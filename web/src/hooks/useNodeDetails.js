import useK from "./useK";

export default function useNodeDetails({ nodeAddress }) {
  return useK.RocketNodeManager.Read.getNodeDetails({
    args: [nodeAddress],
    enabled: !!nodeAddress,
  });
}
