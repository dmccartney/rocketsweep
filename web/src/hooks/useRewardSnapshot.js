import useOngoingRewardIndex from "./useOngoingRewardIndex";
import useOngoingRewardSnapshot from "./useOngoingRewardSnapshot";
import useFinalizedRewardSnapshot from "./useFinalizedRewardSnapshot";

export default function useRewardSnapshot({ rewardIndex }) {
  let ongoingRewardIndex = useOngoingRewardIndex();
  let isOngoing = rewardIndex === ongoingRewardIndex;
  let onGoingSnapshot = useOngoingRewardSnapshot({
    rewardIndex,
    enabled: isOngoing && !!ongoingRewardIndex,
  });
  let finalizedSnapshot = useFinalizedRewardSnapshot({
    rewardIndex,
    enabled: !isOngoing && !!ongoingRewardIndex,
  });
  let snapshot = finalizedSnapshot?.data || onGoingSnapshot;
  return {
    isOngoing,
    rewardIndex,
    ...snapshot,
  };
}
