import useK from "./useK";
import useFetchRewardSnapshots from "./useFetchRewardSnapshots";

export default function useFinalizedRewardSnapshots({ network = "mainnet" }) {
  let { data: snapshots } = useK.RocketRewardsPool.Find.RewardSnapshot({
    args: [],
    from: 0,
    to: "latest",
  });
  snapshots = (snapshots || []).map(
    ({ args: [rewardIndex, submission, startTime, endTime] }) => ({
      rewardIndex: rewardIndex.toNumber(),
      merkleTreeCID: submission[4],
      startTime: startTime.toNumber(),
      endTime: endTime.toNumber(),
    })
  );
  return useFetchRewardSnapshots({ snapshots, network });
}
