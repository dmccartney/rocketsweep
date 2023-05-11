import useNextRewardIndex from "./useNextRewardIndex";
import useOngoingRewardSnapshot from "./useOngoingRewardSnapshot";
import useFinalizedRewardSnapshots from "./useFinalizedRewardSnapshots";
import _ from "lodash";
import moment from "moment";

export default function useNodeOngoingRewardSnapshot({ nodeAddress }) {
  let rewardIndex = useNextRewardIndex();
  let data = useOngoingRewardSnapshot({ rewardIndex });
  let finalized = useFinalizedRewardSnapshots({});
  let last = _.maxBy(finalized, "rewardIndex");
  let endTime = null;
  if (last) {
    endTime =
      moment(last.endTime * 1000)
        .add(28, "days")
        .valueOf() / 1000;
  }
  if (!rewardIndex) {
    return null;
  }
  return {
    type: "ongoing",
    rewardIndex,
    endTime,
    nodeAddress,
    isClaimed: false,
    ...((data?.nodeRewards || {})[nodeAddress.toLowerCase()] || {}),
  };
}
