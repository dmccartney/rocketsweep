import { useClient } from "wagmi";
import { useQuery } from "react-query";

export default function useBlock({ blockNumber }) {
  const publicClient = useClient();

  return useQuery(
    ["useBlock", blockNumber],
    async () => {
      let provider = await publicClient.getProvider();
      return provider.getBlock(blockNumber);
    },
    {
      enabled: !!blockNumber || !!publicClient,
    }
  );
}
