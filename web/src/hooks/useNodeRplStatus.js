import useNodeDetails from "./useNodeDetails";
import { ethers } from "ethers";

export default function useNodeRplStatus({ nodeAddress }) {
  const { data: details } = useNodeDetails({ nodeAddress });
  let { rplStake, minimumRPLStake, maximumRPLStake } = details || {
    rplStake: ethers.constants.Zero,
    minimumRPLStake: ethers.constants.Zero,
    maximumRPLStake: ethers.constants.Zero,
  };
  let rplStatus = !rplStake
    ? "effective"
    : rplStake?.lte(minimumRPLStake)
    ? "under"
    : rplStake?.lte(minimumRPLStake.mul(3).div(2))
    ? "close"
    : rplStake?.gt(maximumRPLStake)
    ? "over"
    : "effective";
  let rplOver =
    rplStatus === "over"
      ? rplStake.sub(maximumRPLStake)
      : ethers.constants.Zero;
  let rplUnder =
    rplStatus === "under"
      ? minimumRPLStake.sub(rplStake)
      : ethers.constants.Zero;
  return {
    rplStatus,
    rplOver,
    rplUnder,
  };
}
