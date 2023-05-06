import { useContractRead } from "wagmi";

// Returns whether `safeAddress` looks like a Safe contract.
// It does a simple inspection of the `VERSION` constant.
export default function useCouldBeSafeContract(safeAddress) {
  let { data: safeVersion } = useContractRead({
    address: safeAddress,
    functionName: "VERSION",
    enabled: !!safeAddress,
    abi: [
      {
        type: "function",
        name: "VERSION",
        inputs: [],
        outputs: [{ type: "string" }],
        stateMutability: "view",
      },
    ],
  });
  // e.g. "1.1.1", "1.3.0"
  return /^\d+\.\d+\.\d+$/.test(safeVersion || "");
}
