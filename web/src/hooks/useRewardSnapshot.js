import useOngoingRewardIndex from "./useOngoingRewardIndex";
import useOngoingRewardSnapshot from "./useOngoingRewardSnapshot";
import useFinalizedRewardSnapshot from "./useFinalizedRewardSnapshot";

export default function useRewardSnapshot({ rewardIndex }) {
  let ongoingRewardIndex = useOngoingRewardIndex();
  let isOngoing = rewardIndex === ongoingRewardIndex;
  let onGoingSnapshot = useOngoingRewardSnapshot({
    rewardIndex,
    enabled: isOngoing,
  });
  let finalizedSnapshot = useFinalizedRewardSnapshot({
    rewardIndex,
    enabled: !isOngoing,
  });
  let snapshot = finalizedSnapshot?.data || onGoingSnapshot;
  return {
    isOngoing,
    rewardIndex,
    ...snapshot,
  };
}
