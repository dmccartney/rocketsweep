import useNodeDetails from "./useNodeDetails";
import { useContractRead } from "wagmi";
import contracts from "../contracts";
import { ethers } from "ethers";

export default function useNodeFeeDistributorInfo({ nodeAddress }) {
  const { data: details } = useNodeDetails({ nodeAddress });
  const { data: nodeShare } = useContractRead({
    address: details?.feeDistributorAddress,
    abi: contracts.RocketNodeDistributorInterface.abi,
    functionName: "getNodeShare",
  });
  const { data: userShare } = useContractRead({
    address: details?.feeDistributorAddress,
    abi: contracts.RocketNodeDistributorInterface.abi,
    functionName: "getUserShare",
  });
  return {
    nodeShare: nodeShare ?? ethers.constants.Zero,
    userShare: userShare ?? ethers.constants.Zero,
    feeDistributorAddress: details?.feeDistributorAddress,
  };
}
