import useSetting from "./useSetting";
import { useQuery } from "react-query";
import useK from "./useK";

const minuteMs = 1000 * 60;

export default function useOngoingRewardSnapshot({
  rewardIndex,
  network = "mainnet",
  enabled = true,
}) {
  let [ongoingRewardsBaseUrl] = useSetting("rewards.ongoing.base");
  let { data: intervalTime } =
    useK.RocketRewardsPool.Read.getClaimIntervalTime();
  let { data: intervalTimeStart } =
    useK.RocketRewardsPool.Read.getClaimIntervalTimeStart();
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
      enabled: enabled && !!ongoingRewardsBaseUrl && !!rewardIndex,
      cacheTime: 120 * minuteMs,
      staleTime: 60 * minuteMs,
    }
  );
  let startTime = null;
  let endTime = null;
  intervalTime = intervalTime?.toNumber();
  intervalTimeStart = intervalTimeStart?.toNumber();
  if (intervalTime && intervalTimeStart) {
    startTime = intervalTimeStart * 1000;
    endTime = (intervalTime + intervalTimeStart) * 1000;
  }
  return {
    ...(result || {}),
    startTime,
    endTime,
  };
}
