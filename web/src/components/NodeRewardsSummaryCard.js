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
import { bnSum, rocketscanUrl, trimValue } from "../utils";
import { ethers } from "ethers";
import { ResponsiveContainer, Treemap } from "recharts";
import WalletChip from "./WalletChip";
import { useEnsName } from "wagmi";
import { Link } from "react-router-dom";
import { AllInclusive, EventRepeat, OpenInNew } from "@mui/icons-material";
import CurrencyValue from "./CurrencyValue";
import useNodeFinalizedRewardSnapshots from "../hooks/useNodeFinalizedRewardSnapshots";
import useNodeDetails from "../hooks/useNodeDetails";
import useNodeContinuousRewards from "../hooks/useNodeContinuousRewards";
import { useState } from "react";

function SummaryCardHeader({ nodeAddress }) {
  const continuous = useNodeContinuousRewards({ nodeAddress });
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

function ContinuousTreemapContent(props) {
  let { color, x, y, width, height, onHoveredName, highlighted, name } = props;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        onMouseEnter={() => onHoveredName(name)}
        onMouseLeave={() => onHoveredName("")}
        style={{
          cursor: "pointer",
          fill: color || "#00000000",
          opacity: !highlighted
            ? 1
            : (name || "").startsWith(highlighted)
            ? 1
            : 0.25,
        }}
      />
    </g>
  );
}

function ContinuousRewardRow({
  nodeAddress,
  to,
  toColor,
  name,
  highlighted,
  ...props
}) {
  const rewards = useNodeContinuousRewards({ nodeAddress });
  const value = rewards[name] || ethers.constants.Zero;
  return (
    <Stack
      sx={{
        cursor: "pointer",
        opacity: !highlighted ? 1 : name.startsWith(highlighted) ? 1 : 0.25,
      }}
      direction="row"
      spacing={0.7}
      alignItems="end"
      {...props}
    >
      <CurrencyValue value={value} size="xsmall" currency="eth" hideCurrency />
      <FormHelperText>
        to{" "}
        <Typography variant="caption" color={toColor}>
          {to}
        </Typography>
      </FormHelperText>
    </Stack>
  );
}

function ContinuousRewardsCard({ nodeAddress }) {
  let theme = useTheme();
  const {
    nodeTotal,
    consensusNodeTotal,
    executionNodeTotal,

    protocolTotal,
    consensusProtocolTotal,
    executionProtocolTotal,

    minipools,
  } = useNodeContinuousRewards({ nodeAddress });
  let [highlighted, setHighlighted] = useState("");
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
          <>
            <ResponsiveContainer height={20} width="100%">
              <Treemap
                colorPanel={[theme.palette.eth.main, theme.palette.eth.light]}
                data={[
                  {
                    name: "Consensus",
                    children: [
                      {
                        name: "consensusNodeTotal",
                        value: Number(
                          ethers.utils.formatUnits(consensusNodeTotal)
                        ),
                        color: theme.palette.eth.main,
                      },
                      {
                        name: "consensusProtocolTotal",
                        value: Number(
                          ethers.utils.formatUnits(consensusProtocolTotal)
                        ),
                        color: theme.palette.eth.light,
                      },
                    ],
                  },
                  {
                    name: "Execution",
                    children: [
                      {
                        name: "executionNodeTotal",
                        value: Number(
                          ethers.utils.formatUnits(executionNodeTotal)
                        ),
                        color: theme.palette.eth.main,
                      },
                      {
                        name: "executionProtocolTotal",
                        value: Number(
                          ethers.utils.formatUnits(executionProtocolTotal)
                        ),
                        color: theme.palette.eth.light,
                      },
                    ],
                  },
                ]}
                content={
                  <ContinuousTreemapContent
                    highlighted={highlighted}
                    onHoveredName={(name) => setHighlighted(name)}
                  />
                }
                isAnimationActive={false}
              />
            </ResponsiveContainer>
            <Stack
              sx={{ mt: 0.5 }}
              justifyContent="space-between"
              direction="row"
            >
              <Stack direction="column">
                <FormHelperText
                  sx={{
                    cursor: "pointer",
                    opacity: !highlighted
                      ? 1
                      : highlighted.startsWith("consensus")
                      ? 1
                      : 0.25,
                  }}
                  onMouseEnter={() => setHighlighted("consensus")}
                  onMouseLeave={() => setHighlighted("")}
                >
                  Consensus (skimming)
                </FormHelperText>
                <ContinuousRewardRow
                  to="You"
                  toColor={theme.palette.eth.main}
                  name="consensusNodeTotal"
                  nodeAddress={nodeAddress}
                  highlighted={highlighted}
                  onMouseEnter={() => setHighlighted("consensusNodeTotal")}
                  onMouseLeave={() => setHighlighted("")}
                />
                <ContinuousRewardRow
                  to="rETH"
                  toColor={theme.palette.eth.light}
                  name="consensusProtocolTotal"
                  nodeAddress={nodeAddress}
                  highlighted={highlighted}
                  onMouseEnter={() => setHighlighted("consensusProtocolTotal")}
                  onMouseLeave={() => setHighlighted("")}
                />
              </Stack>
              <Stack direction="column">
                <FormHelperText
                  sx={{
                    cursor: "pointer",
                    opacity: !highlighted
                      ? 1
                      : highlighted.startsWith("execution")
                      ? 1
                      : 0.25,
                  }}
                  onMouseEnter={() => setHighlighted("execution")}
                  onMouseLeave={() => setHighlighted("")}
                >
                  Execution (tips/mev)
                </FormHelperText>
                <ContinuousRewardRow
                  to="You"
                  toColor={theme.palette.eth.main}
                  name="executionNodeTotal"
                  nodeAddress={nodeAddress}
                  highlighted={highlighted}
                  onMouseEnter={() => setHighlighted("executionNodeTotal")}
                  onMouseLeave={() => setHighlighted("")}
                />
                <ContinuousRewardRow
                  to="rETH"
                  toColor={theme.palette.eth.light}
                  name="executionProtocolTotal"
                  nodeAddress={nodeAddress}
                  highlighted={highlighted}
                  onMouseEnter={() => setHighlighted("executionProtocolTotal")}
                  onMouseLeave={() => setHighlighted("")}
                />
              </Stack>
            </Stack>
          </>
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

const ten = ethers.utils.parseUnits("10");
function SummaryCardContent({ nodeAddress, size = "large" }) {
  const periodic = usePeriodicRewards({ nodeAddress });
  const continuous = useNodeContinuousRewards({ nodeAddress });
  const ethTotal = continuous.nodeTotal?.add(periodic.unclaimedEthTotal);
  const rplTotal = periodic.unclaimedRplTotal;
  let fontSize = ethTotal?.gt(ten) || rplTotal?.gt(ten) ? "medium" : "large";
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
          <ContinuousRewardsCard nodeAddress={nodeAddress} />
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
