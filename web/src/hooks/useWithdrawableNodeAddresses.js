import useK from "./useK";
import _ from "lodash";
import { useQueries } from "react-query";

export default function useWithdrawableNodeAddresses(address) {
  let { data: withdrawables } =
    useK.RocketStorage.Find.NodeWithdrawalAddressSet({
      args: [null, address],
      from: 0,
      to: "latest",
      cacheTime: Math.Infinity,
      staleTime: Math.Infinity,
    });
  let rocketStorageK = useK.RocketStorage.Raw();
  let rocketNodeManagerK = useK.RocketNodeManager.Raw();
  let candidates = _.uniq(
    (address ? [address] : []).concat(
      (withdrawables || []).map((w) => w.args[0])
    )
  );
  let configured = useQueries(
    candidates.map((candidate) => ({
      queryKey: ["isWithdrawalAddress", candidate, address],
      queryFn: async () => {
        if (candidate === address) {
          return await rocketNodeManagerK.getNodeExists(candidate);
        }
        let withdrawalAddress = await rocketStorageK.getNodeWithdrawalAddress(
          candidate
        );
        return withdrawalAddress === address;
      },
      enabled: !!candidate && !!rocketStorageK,
    }))
  );
  return candidates.filter((_, i) => configured[i].data);
}
