import useNextRewardIndex from "./useNextRewardIndex";
import useSubmittedRewardSnapshots from "./useSubmittedRewardSnapshots";

export default function useNodePendingRewardSnapshot({ nodeAddress }) {
  let rewardIndex = useNextRewardIndex();
  let snapshots = useSubmittedRewardSnapshots({ rewardIndex });
  return (
    (snapshots || [])
      .map(({ rewardIndex, endTime, data }, i) => ({
        type: "pending",
        rewardIndex,
        endTime,
        nodeAddress,
        isClaimed: false,
        isNodeIncluded: !!data?.nodeRewards[nodeAddress.toLowerCase()],
        ...(data?.nodeRewards[nodeAddress.toLowerCase()] || {}),
      }))
      .find(() => true) || null
  );
}
