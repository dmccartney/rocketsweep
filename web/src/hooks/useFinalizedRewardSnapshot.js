import useK from "./useK";
import useFetchRewardSnapshots from "./useFetchRewardSnapshots";

export default function useFinalizedRewardSnapshot({
  rewardIndex,
  network = "mainnet",
  enabled = true,
}) {
  let { data: snapshots } = useK.RocketRewardsPool.Find.RewardSnapshot({
    args: [rewardIndex],
    from: 0,
    to: "latest",
    enabled,
  });
  snapshots = (snapshots || []).map(
    ({ args: [rewardIndex, submission, startTime, endTime] }) => ({
      rewardIndex: rewardIndex.toNumber(),
      merkleTreeCID: submission[4],
      startTime: startTime.toNumber(),
      endTime: endTime.toNumber(),
    })
  );
  let results = useFetchRewardSnapshots({ snapshots, network });
  return results[0];
}
