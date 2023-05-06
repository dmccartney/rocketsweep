import useK from "./useK";
import { useProvider } from "wagmi";
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
  let provider = useProvider();
  let minipoolAddresses = _.uniq(
    (minipools || []).map(({ args: [minipoolAddress] }) => minipoolAddress)
  );
  let mpDelegateInterface = new ethers.utils.Interface(
    contracts.RocketMinipoolDelegate.abi
  );
  let details = useQueries(
    minipoolAddresses.map((minipoolAddress, i) => ({
      queryKey: ["MinipoolDetails", minipoolAddress],
      queryFn: async () => {
        if (i > 30) {
          // HACK: When there are lots of minipools (> 30)
          // HACK: then we spread them across a 10 second window to reduce load.
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 10000)
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
        let calculatedNodeShare = await mp.calculateNodeShare(
          balance.sub(nodeRefundBalance)
        );
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
      ...(details[i].data || {}),
    }),
    []
  );
}
