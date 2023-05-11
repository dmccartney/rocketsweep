import _ from "lodash";
import useFinalizedRewardSnapshots from "./useFinalizedRewardSnapshots";

export default function useNextRewardIndex() {
  let snapshots = useFinalizedRewardSnapshots({});
  let last = _.maxBy(snapshots || [], "rewardIndex");
  return last ? last.rewardIndex + 1 : undefined;
}
