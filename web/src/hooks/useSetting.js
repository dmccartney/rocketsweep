import { useMutation, useQuery, useQueryClient } from "react-query";

const defaultValues = {
  "theme.mode": "auto",
  "ipfs.base": "https://cloudflare-ipfs.com",
  "rewards.ongoing.base": "https://rp-s3-cache.invis.tools",
  // "rewards.ongoing.base": "https://rocket-pool-trees.s3.amazonaws.com",
  // "rewards.ongoing.base": "http://localhost:3000",
  // TODO: "eth.rpc": { alchemy: "..." } etc
};

export default function useSetting(key) {
  let { data: value } = useQuery(
    ["setting", key],
    () => {
      try {
        let valueJson = window.localStorage.getItem(key);
        return valueJson ? JSON.parse(valueJson) : defaultValues[key];
      } catch (ignore) {
        return defaultValues[key];
      }
    },
    {}
  );
  let qc = useQueryClient();
  let { mutate } = useMutation({
    mutationKey: ["setting", key],
    onMutate: (newValue) => {
      qc.setQueryData(["setting", key], newValue);
    },
    mutationFn: (newValue) => {
      try {
        let newValueJson = JSON.stringify(newValue);
        window.localStorage.setItem(key, newValueJson);
      } catch (ignore) {}
    },
  });
  let clear = () => mutate(undefined);
  return [value, mutate, defaultValues[key], clear];
}
