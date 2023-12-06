import useFetchJSONZST from "./useFetchJSONZST";
import useSetting from "./useSetting";

export default function useFetchRewardSnapshots({
  snapshots,
  network = "mainnet",
}) {
  let [ipfsBase] = useSetting("ipfs.base");
  let snapshotJsons = useFetchJSONZST(
    (snapshots || []).map(
      ({ rewardIndex, merkleTreeCID }) =>
        `${ipfsBase}/ipfs/${merkleTreeCID}/rp-rewards-${network}-${rewardIndex}.json.zst`
    ),
    {
      enabled: !!ipfsBase,
      cacheTime: Infinity,
      staleTime: Infinity,
    }
  );
  return (snapshots || []).map((snapshot, i) => ({
    ...snapshot,
    data: snapshotJsons[i]?.data,
  }));
}
