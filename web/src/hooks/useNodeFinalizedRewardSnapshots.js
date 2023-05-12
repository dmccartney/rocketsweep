import useFinalizedRewardSnapshots from "./useFinalizedRewardSnapshots";
import useK from "./useK";
import { useQueries } from "react-query";

export default function useNodeFinalizedRewardSnapshots({ nodeAddress }) {
  let snapshots = useFinalizedRewardSnapshots({});
  let distributor = useK.RocketMerkleDistributorMainnet.Raw();
  let claims = useQueries(
    snapshots.map(({ rewardIndex }) => ({
      queryKey: ["intervalIsClaimed", rewardIndex, nodeAddress],
      queryFn: async () => distributor.isClaimed(rewardIndex, nodeAddress),
    }))
  );
  return snapshots
    .map(({ rewardIndex, endTime, data }, i) => ({
      type: "finalized",
      rewardIndex,
      endTime,
      nodeAddress,
      isClaimed: claims[i]?.data,
      isLoading: !data,
      isNodeIncluded: !!data?.nodeRewards[nodeAddress.toLowerCase()],
      ...(data?.nodeRewards[nodeAddress.toLowerCase()] || {}),
    }))
    .filter(({ isLoading, isNodeIncluded }) => isLoading || isNodeIncluded);
}
