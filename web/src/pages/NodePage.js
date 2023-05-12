import { useAccount, useEnsAddress } from "wagmi";
import Layout from "../components/Layout";
import { useParams } from "react-router-dom";
import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import MinipoolRewardsSummaryCard from "../components/MinipoolRewardsSummaryCard";
import SafeSweepCard from "../components/SafeSweepCard";
import IntervalRewardsTable from "../components/IntervalRewardsTable";
import MinipoolRewardsTable from "../components/MinipoolRewardsTable";
import {
  AllInclusive,
  EventRepeat,
  ExpandLess,
  ExpandMore,
  Help,
} from "@mui/icons-material";
import { useState } from "react";
import ClaimAndStakeForm from "../components/ClaimAndStakeForm";
import useNodeFinalizedRewardSnapshots from "../hooks/useNodeFinalizedRewardSnapshots";
import _ from "lodash";
import { ethers } from "ethers";
import useCanConnectedAccountWithdraw from "../hooks/useCanConnectedAccountWithdraw";
import useMinipoolDetails from "../hooks/useMinipoolDetails";

function PeriodicRewardsHeaderCard({ sx, nodeAddress }) {
  let finalized = useNodeFinalizedRewardSnapshots({ nodeAddress });
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
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
  return (
    <Grid sx={sx} rowSpacing={2} container alignItems="center">
      <Grid item xs={12} md={4}>
        <Stack direction="row" alignItems="center">
          <EventRepeat
            sx={{ ml: 2, mr: 2 }}
            fontSize="medium"
            color="disabled"
          />
          <Typography color="text.secondary" variant="subtitle2">
            Periodic Rewards
          </Typography>
          <Tooltip title="Rocket Pool Guide: claiming rewards">
            <IconButton
              href="https://docs.rocketpool.net/guides/node/rewards.html"
              sx={{ opacity: 0.5 }}
              component="a"
              target="_blank"
              color="inherit"
              size="small"
            >
              <Help fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Grid>
      {rewardIndexes.length > 0 && (
        <Grid item sx={{ pl: 7 }} xs={12} md={8}>
          <Grid container>
            <Grid item>
              <ClaimAndStakeForm
                sx={{
                  cursor: canWithdraw ? undefined : "not-allowed",
                }}
                buttonProps={{
                  size: "small",
                  label: "Claim All",
                  color: canWithdraw ? "primary" : "gray",
                }}
                sliderProps={{
                  size: "small",
                  color: canWithdraw ? "rpl" : "gray",
                  sx: {
                    width: 144,
                    pb: 0,
                  },
                }}
                notAllowed={!canWithdraw}
                nodeAddress={nodeAddress}
                rewardIndexes={rewardIndexes}
                amountsEth={amountsEth}
                amountsRpl={amountsRpl}
                merkleProofs={merkleProofs}
              />
            </Grid>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
}

function ContinuousRewardsHeaderCard({
  sx,
  nodeAddress,
  isShowingBatch,
  onToggleShowBatch,
}) {
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  let minipools = useMinipoolDetails(nodeAddress);
  return (
    <Grid sx={sx} rowSpacing={2} container alignItems="center">
      <Grid item xs={12} md={4}>
        <Stack direction="row" alignItems="center">
          <AllInclusive
            sx={{ ml: 2, mr: 2 }}
            fontSize="medium"
            color="disabled"
          />
          <Typography color="text.secondary" variant="subtitle2">
            Continuous Rewards
          </Typography>
          <Tooltip title="Rocket Pool Guide: skimming rewards">
            <IconButton
              href="https://docs.rocketpool.net/guides/node/skimming.html"
              sx={{ opacity: 0.5 }}
              component="a"
              target="_blank"
              color="inherit"
              size="small"
            >
              <Help fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Grid>
      {minipools.length > 0 && (
        <>
          <Grid item sx={{ pl: 7 }} xs={12} md={8}>
            <Button
              onClick={onToggleShowBatch}
              variant="outlined"
              size="small"
              color={canWithdraw ? "primary" : "gray"}
              endIcon={isShowingBatch ? <ExpandLess /> : <ExpandMore />}
            >
              Distribute All
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default function NodePage() {
  let { connector } = useAccount();
  // When the connected account is a Safe, show the batch sweep card by default.
  let [isShowingBatch, setShowingBatch] = useState(connector?.id === "safe");
  let { nodeAddressOrName } = useParams();
  let { data: nodeAddress } = useEnsAddress({
    name: nodeAddressOrName,
    enabled: nodeAddressOrName.endsWith(".eth"),
  });
  if (!nodeAddressOrName.endsWith(".eth")) {
    nodeAddress = nodeAddressOrName;
  }
  return (
    <Layout>
      {!nodeAddress ? (
        <CircularProgress />
      ) : (
        <Grid container columnSpacing={3} rowSpacing={5}>
          <Grid key={"summary-card"} item xs={12} lg={4}>
            <MinipoolRewardsSummaryCard nodeAddress={nodeAddress} />
          </Grid>
          <Grid key={"sweep-table-cards"} item xs={12} lg={8}>
            <PeriodicRewardsHeaderCard
              sx={{ mb: 2 }}
              nodeAddress={nodeAddress}
            />
            <IntervalRewardsTable sx={{ mb: 5 }} nodeAddress={nodeAddress} />
            <ContinuousRewardsHeaderCard
              sx={{ mb: 2 }}
              nodeAddress={nodeAddress}
              isShowingBatch={isShowingBatch}
              onToggleShowBatch={() => setShowingBatch(!isShowingBatch)}
            />
            {isShowingBatch && (
              <SafeSweepCard sx={{ mb: 2 }} nodeAddress={nodeAddress} />
            )}
            <MinipoolRewardsTable nodeAddress={nodeAddress} />
          </Grid>
        </Grid>
      )}
    </Layout>
  );
}
