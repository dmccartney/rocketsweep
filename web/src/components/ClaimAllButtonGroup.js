import ClaimAndStakeForm from "./ClaimAndStakeForm";
import useCanConnectedAccountWithdraw from "../hooks/useCanConnectedAccountWithdraw";
import useNodeFinalizedRewardSnapshots from "../hooks/useNodeFinalizedRewardSnapshots";
import _ from "lodash";
import { ethers } from "ethers";

export default function ClaimAllButtonGroup({ nodeAddress }) {
  let finalized = useNodeFinalizedRewardSnapshots({ nodeAddress });
  let unclaimed = _.filter(finalized, ({ isClaimed }) => !isClaimed);
  let rewardIndexes = _.map(unclaimed, "rewardIndex");
  let amountsEth = _.map(unclaimed, "smoothingPoolEth");
  let merkleProofs = _.map(unclaimed, "merkleProof");
  let amountsRpl = _.map(unclaimed, ({ collateralRpl, oracleDaoRpl }) =>
    // TODO: consider moving this to useNodeFinalizedRewardSnapshots
    ethers.BigNumber.from(collateralRpl || "0").add(
      ethers.BigNumber.from(oracleDaoRpl || "0")
    )
  );
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  if (unclaimed.length === 0) {
    return null; // Show nothing when there's none to claim.
  }
  return (
    <ClaimAndStakeForm
      sx={{
        cursor: canWithdraw ? undefined : "not-allowed",
      }}
      buttonProps={{
        size: "small",
        label: "Claim All",
      }}
      sliderProps={{
        size: "small",
        color: canWithdraw ? "rpl" : "gray",
        sx: {
          width: 144,
          pb: 0,
        },
      }}
      nodeAddress={nodeAddress}
      rewardIndexes={rewardIndexes}
      amountsEth={amountsEth}
      amountsRpl={amountsRpl}
      merkleProofs={merkleProofs}
    />
  );
}
