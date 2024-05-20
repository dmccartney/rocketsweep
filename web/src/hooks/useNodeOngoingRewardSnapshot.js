import useOngoingRewardIndex from "./useOngoingRewardIndex";
import useOngoingRewardSnapshot from "./useOngoingRewardSnapshot";
import useFinalizedRewardSnapshots from "./useFinalizedRewardSnapshots";
import _ from "lodash";
import moment from "moment";
import { ethers } from "ethers";

export default function useNodeOngoingRewardSnapshot({ nodeAddress }) {
  let rewardIndex = useOngoingRewardIndex();
  let data = useOngoingRewardSnapshot({ rewardIndex });
  let finalized = useFinalizedRewardSnapshots({});
  let last = _.maxBy(finalized, "rewardIndex");
  let endTime = null;
  let percentDone = 1.0;
  if (last) {
    endTime =
      moment(last.endTime * 1000)
        .add(28, "days")
        .valueOf() / 1000;
    let startTime = moment(last.endTime * 1000).valueOf() / 1000;
    let now = moment().valueOf() / 1000;
    percentDone =
      now > endTime ? 1.0 : (now - startTime) / (endTime - startTime);
  }
  if (!rewardIndex) {
    return null;
  }
  let nodeData = (data?.nodeRewards || {})[nodeAddress.toLowerCase()] || {};
  if (percentDone < 1.0) {
    let predict = (bn) => bn.mul(100000).div(Math.round(100000 * percentDone));
    nodeData = {
      ...nodeData,
      collateralRpl: predict(
        ethers.BigNumber.from(nodeData.collateralRpl || "0")
      ).toString(),
      smoothingPoolEth: predict(
        ethers.BigNumber.from(nodeData.smoothingPoolEth || "0")
      ).toString(),
    };
  }
  return {
    type: "ongoing",
    percentDone,
    rewardIndex,
    endTime,
    nodeAddress,
    isClaimed: false,
    ...nodeData,
  };
}
