import useNodeDetails from "./useNodeDetails";
import { ethers } from "ethers";

export default function useNodeRplStatus({ nodeAddress }) {
  const { data: details } = useNodeDetails({ nodeAddress });
  let { rplStake, minimumRPLStake, maximumRPLStake } = details || {
    rplStake: ethers.constants.Zero,
    minimumRPLStake: ethers.constants.Zero,
    maximumRPLStake: ethers.constants.Zero,
  };
  // rplStake = rplStake.div(ethers.BigNumber.from(2));
  return !rplStake
    ? "effective"
    : rplStake?.lte(minimumRPLStake)
    ? "under"
    : rplStake?.lte(minimumRPLStake.mul(3).div(2))
    ? "close"
    : rplStake?.gt(maximumRPLStake)
    ? "over"
    : "effective";
}
