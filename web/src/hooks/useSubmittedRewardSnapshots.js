import useK from "./useK";
import useFetchRewardSnapshots from "./useFetchRewardSnapshots";

export default function useSubmittedRewardSnapshots({
  rewardIndex,
  network = "mainnet",
}) {
  let { data: snapshots } = useK.RocketRewardsPool.Find.RewardSnapshotSubmitted(
    {
      args: [null, rewardIndex],
      from: 0,
      to: "latest",
    }
  );
  snapshots = (snapshots || []).map(
    ({ args: [fromAddress, rewardIndex, submission, time] }) => ({
      rewardIndex: rewardIndex.toNumber(),
      merkleTreeCID: submission[4],
      fromAddress,
      startTime: time.toNumber(),
      endTime: time.toNumber(),
    })
  );
  return useFetchRewardSnapshots({ snapshots, network });
}
