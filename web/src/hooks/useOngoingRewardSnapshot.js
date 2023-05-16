import useSetting from "./useSetting";
import { useQuery } from "react-query";

const minuteMs = 1000 * 60;

export default function useOngoingRewardSnapshot({
  rewardIndex,
  network = "mainnet",
}) {
  let [ongoingRewardsBaseUrl] = useSetting("rewards.ongoing.base");
  let url = `${ongoingRewardsBaseUrl}/rp-rewards-${network}-${rewardIndex}.json`;
  let { data: result } = useQuery(
    ["ongoingRewardSnapshot", url],
    async () => {
      let res = await fetch(url);
      if (!res.ok) {
        throw new Error(`failure fetching ongoing reward JSON from ${url}`);
      }
      return res.json();
    },
    {
      enabled: !!ongoingRewardsBaseUrl && !!rewardIndex,
      cacheTime: 120 * minuteMs,
      staleTime: 60 * minuteMs,
    }
  );
  return result;
}
