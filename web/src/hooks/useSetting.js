import { useMutation, useQuery, useQueryClient } from "react-query";

const defaultValues = {
  "theme.mode": "auto",
  "ipfs.base": "https://cloudflare-ipfs.com",
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
