import useK from "../hooks/useK";
import useCanConnectedAccountWithdraw from "../hooks/useCanConnectedAccountWithdraw";
import { Button, Skeleton, Tooltip } from "@mui/material";
import { CheckCircle, HourglassTop } from "@mui/icons-material";
import _ from "lodash";
import ClaimAndStakeForm from "./ClaimAndStakeForm";

export default function ClaimButtonGroup({
  type,
  nodeAddress,
  rewardIndex,
  totalEth,
  totalRpl,
  merkleProof,
}) {
  let { data: isClaimed, isLoading } =
    useK.RocketMerkleDistributorMainnet.Read.isClaimed({
      args: [rewardIndex, nodeAddress],
    });
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  if (isLoading) {
    return <Skeleton variant="circular" width={20} height={20} />;
  }
  if (type !== "finalized") {
    return (
      <Tooltip title="This interval is still in progress. Reward amounts will continue to grow until they are finalized at the end of the interval.">
        <span>
          <Button
            size="small"
            disabled
            color="inherit"
            endIcon={<HourglassTop />}
          >
            {_.capitalize(type)}
          </Button>
        </span>
      </Tooltip>
    );
  }
  if (isClaimed) {
    return (
      <Tooltip title="Periodic rewards for this interval were already claimed.">
        <span>
          <Button
            size="small"
            disabled
            color="inherit"
            endIcon={<CheckCircle />}
          >
            Claimed
          </Button>
        </span>
      </Tooltip>
    );
  }
  return (
    <ClaimAndStakeForm
      sx={{
        cursor: canWithdraw ? undefined : "not-allowed",
      }}
      buttonProps={{
        size: "small",
        label: "Claim",
        // color: canWithdraw ? "rpl" : "gray",
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
      rewardIndexes={[rewardIndex]}
      amountsEth={[totalEth]}
      amountsRpl={[totalRpl]}
      merkleProofs={[merkleProof]}
    />
  );
}
