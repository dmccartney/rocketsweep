import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormHelperText,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { bnSum, MinipoolStatus, rocketscanUrl, trimValue } from "../utils";
import { ethers } from "ethers";
import useMinipoolDetails from "../hooks/useMinipoolDetails";
import { ResponsiveContainer, Treemap } from "recharts";
import WalletChip from "./WalletChip";
import { useEnsName } from "wagmi";
import { Link } from "react-router-dom";
import { AllInclusive, EventRepeat, OpenInNew } from "@mui/icons-material";
import CurrencyValue from "./CurrencyValue";
import useNodeFinalizedRewardSnapshots from "../hooks/useNodeFinalizedRewardSnapshots";
import useNodeDetails from "../hooks/useNodeDetails";

function SummaryCardHeader({ nodeAddress }) {
  const continuous = useContinuousRewards({ nodeAddress });
  const { data: details } = useNodeDetails({ nodeAddress });
  let rplStakeText = "-.---";
  if (details?.rplStake) {
    rplStakeText = trimValue(ethers.utils.formatUnits(details?.rplStake), {
      maxDecimals: 0,
    });
  }
  return (
    <CardHeader
      title={
        <WalletChip
          clickable={false}
          sx={{ cursor: "inherit" }}
          labelVariant={"body2"}
          walletAddress={nodeAddress}
        />
      }
      action={
        <Stack sx={{ mr: 1 }} spacing={2} direction="row" alignItems="center">
          <Stack sx={{ pt: 1 }} direction="column" alignItems="flex-end">
            <Box sx={{ mt: 0 }}>
              <Chip
                size="small"
                label={
                  <Typography variant="caption">
                    {continuous?.minipoolCount}
                  </Typography>
                }
              />
            </Box>
            <FormHelperText sx={{ mt: 0.25 }}>minipools</FormHelperText>
          </Stack>
          <Stack sx={{ pt: 1 }} direction="column" alignItems="flex-end">
            <Box sx={{ mt: 0 }}>
              <Chip
                size="small"
                label={
                  <Typography variant="caption">{rplStakeText}</Typography>
                }
              />
            </Box>
            <FormHelperText sx={{ mt: 0.25 }}>
              staked
              <Typography
                component={"span"}
                variant="rpl"
                sx={{ pl: 0.5 }}
                color={(theme) => theme.palette.rpl.light}
              >
                {"RPL"}
              </Typography>
            </FormHelperText>
          </Stack>
        </Stack>
      }
    />
  );
}

function PeriodicRewardsCard({
  sx,
  unclaimed,
  unclaimedEthTotal,
  unclaimedRplTotal,
}) {
  return (
    <Card elevation={5} sx={sx}>
      <CardHeader
        avatar={<EventRepeat fontSize="medium" color="disabled" />}
        subheader="Periodic Rewards"
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack direction="row" sx={{ mb: 2 }} spacing={2} justifyContent="left">
          <CurrencyValue
            value={unclaimedEthTotal}
            placeholder="0"
            size="medium"
            currency="eth"
          />
          <CurrencyValue
            value={unclaimedRplTotal}
            placeholder="0"
            size="medium"
            currency="rpl"
          />
        </Stack>
        <FormHelperText>
          From <Chip component="span" size="small" label={unclaimed.length} />{" "}
          unclaimed
          {unclaimed.length === 1 ? " interval" : " intervals"}
        </FormHelperText>
      </CardContent>
    </Card>
  );
}

function ContinuousRewardsCard({ nodeTotal, protocolTotal, minipools }) {
  let theme = useTheme();
  return (
    <Card elevation={5}>
      <CardHeader
        avatar={<AllInclusive fontSize="medium" color="disabled" />}
        subheader="Continuous Rewards"
      />
      <CardContent sx={{ pt: 0 }}>
        <CurrencyValue
          sx={{ mb: 2 }}
          value={minipools.length && nodeTotal}
          size="medium"
          currency="eth"
        />
        <FormHelperText sx={{ mb: 2 }}>
          Across{" "}
          <Chip
            component="span"
            size="small"
            label={
              minipools.length === 0 ? "-" : minipools.length.toLocaleString()
            }
          />{" "}
          staking minipools
        </FormHelperText>
        {nodeTotal.isZero() && protocolTotal.isZero() ? null : (
          <ResponsiveContainer height={36} width="100%">
            <Treemap
              colorPanel={[theme.palette.eth.main, theme.palette.eth.light]}
              data={[
                {
                  name: `${trimValue(
                    ethers.utils.formatUnits(nodeTotal)
                  )} to You`,
                  value: Number(ethers.utils.formatUnits(nodeTotal)),
                },
                {
                  name: `${trimValue(
                    ethers.utils.formatUnits(protocolTotal)
                  )} to rETH`,
                  value: Number(ethers.utils.formatUnits(protocolTotal)),
                },
              ]}
              isAnimationActive={false}
            />
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function usePeriodicRewards({ nodeAddress }) {
  let nodeSnapshots = useNodeFinalizedRewardSnapshots({ nodeAddress });
  let unclaimed = nodeSnapshots.filter(({ isClaimed }) => isClaimed === false);
  let unclaimedEthTotal = bnSum(
    unclaimed.map(({ smoothingPoolEth }) => smoothingPoolEth)
  );
  let unclaimedRplTotal = bnSum(
    unclaimed.map(({ collateralRpl, oracleDaoRpl }) =>
      ethers.BigNumber.from(oracleDaoRpl || "0").add(
        ethers.BigNumber.from(collateralRpl || "0")
      )
    )
  );
  return { unclaimed, unclaimedEthTotal, unclaimedRplTotal };
}

function useContinuousRewards({ nodeAddress }) {
  let minipools = useMinipoolDetails(nodeAddress);
  let minipoolCount = minipools?.length;
  let isLoadingCount = minipools.filter(({ isLoading }) => isLoading).length;
  minipools = minipools.filter(
    ({ status }) => status === MinipoolStatus.staking
  );
  const nodeTotal = bnSum(
    minipools
      .filter(({ upgraded }) => upgraded)
      .map(({ nodeBalance }) => nodeBalance)
  );
  const protocolTotal = bnSum(
    minipools
      .filter(({ upgraded }) => upgraded)
      .map(({ protocolBalance }) => protocolBalance)
  );
  return { nodeTotal, protocolTotal, minipools, minipoolCount, isLoadingCount };
}

const oneHundred = ethers.utils.parseUnits("100");
function SummaryCardContent({ nodeAddress, size = "large" }) {
  const periodic = usePeriodicRewards({ nodeAddress });
  const continuous = useContinuousRewards({ nodeAddress });
  const ethTotal = continuous.nodeTotal?.add(periodic.unclaimedEthTotal);
  const rplTotal = periodic.unclaimedRplTotal;
  let fontSize =
    ethTotal?.gt(oneHundred) || rplTotal?.gt(oneHundred) ? "medium" : "large";
  let unupgradedMps = continuous?.minipools?.filter(
    ({ upgraded }) => upgraded === false
  );
  return (
    <CardContent sx={{ pt: 1 }}>
      <Stack
        direction="row"
        divider={
          <Divider
            orientation="vertical"
            sx={{ opacity: 0.5 }}
            flexItem
          ></Divider>
        }
        spacing={2}
        justifyContent="left"
      >
        <CurrencyValue
          value={ethTotal}
          placeholder="0"
          size={fontSize}
          currency="eth"
        />
        <CurrencyValue
          value={rplTotal}
          placeholder="0"
          size={fontSize}
          currency="rpl"
        />
      </Stack>
      <Typography variant="caption" color="text.secondary">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
        >
          Total sweepable rewards
          {continuous.isLoadingCount === 0 ? null : (
            <Stack direction="row" alignItems="baseline">
              <Typography variant="caption">
                {Math.floor(
                  (100 *
                    (continuous.minipoolCount - continuous.isLoadingCount)) /
                    (continuous.minipoolCount || 1)
                )}
                %
              </Typography>
              <CircularProgress color="inherit" size={10} sx={{ ml: 1 }} />
            </Stack>
          )}
        </Stack>
      </Typography>
      {unupgradedMps?.length > 0 && (
        <Alert sx={{ mt: 1 }} icon={false} size="small" severity="warning">
          <Chip size="small" label={unupgradedMps.length} /> minipools are not
          upgraded
        </Alert>
      )}
      {size === "small" ? null : (
        <>
          <PeriodicRewardsCard sx={{ mt: 2, mb: 3 }} {...periodic} />
          <ContinuousRewardsCard {...continuous} />
        </>
      )}
    </CardContent>
  );
}

export default function NodeRewardsSummaryCard({
  sx,
  nodeAddress,
  action,
  size = "large",
  asLink = false,
}) {
  let { data: name } = useEnsName({ address: nodeAddress });
  let nodeAddressOrName = name || nodeAddress;
  if (asLink) {
    return (
      <Card sx={sx}>
        <CardActionArea component={Link} to={`/node/${nodeAddressOrName}`}>
          <SummaryCardHeader nodeAddress={nodeAddress} />
          <SummaryCardContent nodeAddress={nodeAddress} size={size} />
        </CardActionArea>
      </Card>
    );
  }
  return (
    <Card sx={sx}>
      <SummaryCardHeader nodeAddress={nodeAddress} />
      <SummaryCardContent nodeAddress={nodeAddress} size={size} />
      <CardActions>
        <Stack
          sx={{ width: "100%" }}
          direction="row"
          justifyContent="space-between"
        >
          <Button
            href={rocketscanUrl({ node: nodeAddressOrName })}
            target="_blank"
            color="rpl"
            endIcon={<OpenInNew />}
          >
            Explore
          </Button>
          {action}
        </Stack>
      </CardActions>
    </Card>
  );
}
