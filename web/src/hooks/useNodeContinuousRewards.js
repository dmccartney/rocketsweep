import useNodeFeeDistributorInfo from "./useNodeFeeDistributorInfo";
import useMinipoolDetails from "./useMinipoolDetails";
import { bnSum, MinipoolStatus } from "../utils";

// Continuous rewards includes:
//  - beacon rewards that reside in each minipool contract
//  - execution rewards (tips/mev) that reside in the node's distributor contract
export default function useNodeContinuousRewards({ nodeAddress }) {
  let feeDistributor = useNodeFeeDistributorInfo({ nodeAddress });
  let minipools = useMinipoolDetails(nodeAddress);
  let minipoolCount = minipools?.length;
  let isLoadingCount = minipools.filter(({ isLoading }) => isLoading).length;
  minipools = minipools.filter(
    ({ status }) => status === MinipoolStatus.staking
  );
  const consensusNodeTotal = bnSum(
    minipools
      .filter(({ upgraded }) => upgraded)
      .map(({ nodeBalance }) => nodeBalance)
  );
  const consensusProtocolTotal = bnSum(
    minipools
      .filter(({ upgraded }) => upgraded)
      .map(({ protocolBalance }) => protocolBalance)
  );
  const executionNodeTotal = feeDistributor.nodeShare;
  const executionProtocolTotal = feeDistributor.userShare;
  const protocolTotal = bnSum([consensusProtocolTotal, executionProtocolTotal]);
  const nodeTotal = bnSum([consensusNodeTotal, executionNodeTotal]);
  return {
    nodeTotal,
    consensusNodeTotal,
    executionNodeTotal,

    protocolTotal,
    consensusProtocolTotal,
    executionProtocolTotal,

    minipools,
    minipoolCount,
    isLoadingCount,
  };
}
