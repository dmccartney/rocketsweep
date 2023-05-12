import { useAccount } from "wagmi";
import useWithdrawableNodeAddresses from "./useWithdrawableNodeAddresses";

export default function useCanConnectedAccountWithdraw(nodeAddress) {
  let { address } = useAccount();
  let nodeAddresses = useWithdrawableNodeAddresses(address);
  return nodeAddresses.indexOf(nodeAddress) !== -1;
}
