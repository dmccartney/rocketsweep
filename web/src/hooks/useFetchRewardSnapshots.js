import useFetchJSONZST from "./useFetchJSONZST";

const IPFS_BASE = "https://ipfs.io";
// const IPFS_BASE = "https://cloudflare-ipfs.com";

export default function useFetchRewardSnapshots({
  snapshots,
  network = "mainnet",
}) {
  let snapshotJsons = useFetchJSONZST(
    (snapshots || []).map(
      ({ rewardIndex, merkleTreeCID }) =>
        `${IPFS_BASE}/ipfs/${merkleTreeCID}/rp-rewards-${network}-${rewardIndex}.json.zst`
    )
  );
  return (snapshots || []).map((snapshot, i) => ({
    ...snapshot,
    data: snapshotJsons[i]?.data,
  }));
}
