import useFetchJSONZST from "./useFetchJSONZST";
import useSetting from "./useSetting";

// HACK: for now, until we have a better fix for failed IPFS publications.
const fallbackBase =
  "https://storage.googleapis.com/lgtm-info-dev-preview/rewards-trees";
// NOTE: we can't just use "https://github.com/rocket-pool/rewards-trees/raw/main"
//       because GitHub doesn't support CORS for raw.githubusercontent.com.

export default function useFetchRewardSnapshots({
  snapshots,
  network = "mainnet",
}) {
  let [ipfsBase] = useSetting("ipfs.base");
  let snapshotJsons = useFetchJSONZST(
    (snapshots || []).map(({ rewardIndex, merkleTreeCID }) => ({
      sourceUrls: [
        // NOTE: IPFS dumps aren't being published reliably anymore so we use the fallback instead.
        // `${ipfsBase}/ipfs/${merkleTreeCID}/rp-rewards-${network}-${rewardIndex}.json.zst`,
        `${fallbackBase}/${network}/rp-rewards-${network}-${rewardIndex}.json`,
      ],
    })),
    {
      enabled: !!ipfsBase,
      cacheTime: Math.Infinite,
      staleTime: Math.Infinite,
    }
  );
  return (snapshots || []).map((snapshot, i) => ({
    ...snapshot,
    data: snapshotJsons[i]?.data,
  }));
}
