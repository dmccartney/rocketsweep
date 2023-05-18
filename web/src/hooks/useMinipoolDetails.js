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
  let loadingWindowMs = 15 * 1000;
  let details = useQueries(
    minipoolAddresses.map((minipoolAddress, i) => ({
      queryKey: ["MinipoolDetails", minipoolAddress],
      queryFn: async () => {
        if (i > 50) {
          await new Promise((resolve) =>
            setTimeout(resolve, loadingWindowMs * Math.random())
          );
        }
        const mp = new ethers.Contract(
          minipoolAddress,
          mpDelegateInterface,
          provider?.signer || provider
        );
        let [version, balance, nodeRefundBalance] = await Promise.all([
          mp.version(),
          provider.getBalance(minipoolAddress),
          mp.getNodeRefundBalance(),
        ]);
        let balanceLessRefund = balance.sub(nodeRefundBalance);
        let calculatedNodeShare = ethers.constants.Zero;
        if (balanceLessRefund.gt(ethers.constants.Zero)) {
          calculatedNodeShare = await mp.calculateNodeShare(balanceLessRefund);
        }
        let status = await mp.getStatus();
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
