import { useAccount } from "wagmi";
import useWithdrawableNodeAddresses from "./useWithdrawableNodeAddresses";
import { ethers } from "ethers";

export default function useCanConnectedAccountWithdraw(nodeAddress) {
  let { address } = useAccount();
  let nodeAddresses = useWithdrawableNodeAddresses(address);
  // .getAddress to ensure we're dealing with the checksum address
  return nodeAddresses.indexOf(ethers.utils.getAddress(nodeAddress)) !== -1;
}
