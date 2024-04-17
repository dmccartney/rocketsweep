import useNodeDetails from "./useNodeDetails";
import { ethers } from "ethers";

export default function useNodeRplStatus({ nodeAddress }) {
  const { data: details } = useNodeDetails({ nodeAddress });
  let { rplStake, minimumRPLStake } = details || {
    rplStake: ethers.constants.Zero,
    minimumRPLStake: ethers.constants.Zero,
  };
  return !rplStake
    ? "optimal"
    : rplStake?.lte(minimumRPLStake)
    ? "under"
    : rplStake?.lte(minimumRPLStake.mul(11).div(10))
    ? "close"
    : rplStake?.gt(minimumRPLStake.mul(3).div(2))
    ? "excess"
    : "optimal";
}
