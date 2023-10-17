import useK from "./useK";
import { useWebSocketProvider } from "wagmi";
import _ from "lodash";
import { ethers } from "ethers";
import contracts from "../contracts";
import { useQueries } from "react-query";

export default function useMinipoolDetails(nodeAddress) {
  let { data: minipools } = useK.RocketMinipoolManager.Find.MinipoolCreated({
    args: [null, nodeAddress],
    from: 0,
    to: "latest",
  });
  let provider = useWebSocketProvider();
  let minipoolAddresses = _.uniq(
    (minipools || []).map(({ args: [minipoolAddress] }) => minipoolAddress)
  );
  let mpDelegateInterface = new ethers.utils.Interface(
    contracts.RocketMinipoolDelegate.abi
  );

  // For very large nodes we can't load all minipools at once without hitting rate limits.
  // But most nodes are smaller and they can be loaded at once.
  // So we aggressively load the first minipools for a node and then spread out the remainder.
  // Thus, most nodes load right away and larger nodes load over a predictable loading window.

  // Note: these numbers are experimentally derived and may need tweaking as the `queryFn` changes.
  // Load this many minipools immediately without spreading out the load.
  let loadingWindowBypassCount = 50;
  // Spread out any remaining minipool loads over this-sized window of time.
  let loadingWindowMs = 25 * 1000; // 25 seconds

  let details = useQueries(
    minipoolAddresses.map((minipoolAddress, i) => ({
      queryKey: ["MinipoolDetails", minipoolAddress],
      queryFn: async () => {
        // Spread out load for large nodes.
        if (i > loadingWindowBypassCount) {
          await new Promise((resolve) =>
            setTimeout(resolve, loadingWindowMs * Math.random())
          );
        }
        const mp = new ethers.Contract(
          minipoolAddress,
          mpDelegateInterface,
          provider?.signer || provider
        );
        // Note: we don't Promise.all these reads to be gentler on the rate-limit.
        // TODO: issue a multi-read call instead.
        let isFinalized = await mp.getFinalised();
        let nodeRefundBalance = await mp.getNodeRefundBalance();
        let version = await mp.version();
        let status = await mp.getStatus();
        let balance = await provider.getBalance(minipoolAddress);

        let balanceLessRefund = balance.sub(nodeRefundBalance);
        let calculatedNodeShare = ethers.constants.Zero;
        if (balanceLessRefund.gt(ethers.constants.Zero)) {
          calculatedNodeShare = await mp.calculateNodeShare(balanceLessRefund);
        }
        let nodeBalance = ethers.BigNumber.from(nodeRefundBalance || "0").add(
          ethers.BigNumber.from(calculatedNodeShare || "0")
        );
        let protocolBalance = balance.sub(nodeBalance);
        balance = balance.toHexString();
        nodeRefundBalance = nodeRefundBalance.toHexString();
        calculatedNodeShare = calculatedNodeShare.toHexString();
        nodeBalance = nodeBalance.toHexString();
        protocolBalance = protocolBalance.toHexString();
        let upgraded = version > 2;
        return {
          minipoolAddress,
          balance,
          nodeRefundBalance,
          calculatedNodeShare,
          nodeBalance,
          protocolBalance,
          status,
          isFinalized,
          upgraded,
        };
      },
    }))
  );
  return minipoolAddresses.map(
    (minipoolAddress, i) => ({
      minipoolAddress,
      ...(details[i].data || { isLoading: true }),
    }),
    []
  );
}
