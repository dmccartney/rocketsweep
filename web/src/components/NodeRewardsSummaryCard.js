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
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { bnSum, rocketscanUrl, trimValue } from "../utils";
import { ethers } from "ethers";
import {
  ResponsiveContainer,
  Treemap,
  LineChart,
  XAxis,
  YAxis,
  ReferenceLine,
  Label,
  Rectangle,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import WalletChip from "./WalletChip";
import { useEnsName } from "wagmi";
import { Link } from "react-router-dom";
import {
  AllInclusive,
  EventRepeat,
  Help,
  OpenInNew,
  Warning,
} from "@mui/icons-material";
import CurrencyValue from "./CurrencyValue";
import useNodeContinuousRewards from "../hooks/useNodeContinuousRewards";
import useNodeDetails from "../hooks/useNodeDetails";
import useNodeFinalizedRewardSnapshots from "../hooks/useNodeFinalizedRewardSnapshots";
import useNodeRplStatus from "../hooks/useNodeRplStatus";
import useRplEthPrice from "../hooks/useRplEthPrice";
import { useState } from "react";
import RewardsHelpInfo from "./RewardsHelpInfo";
import useMinipoolDetails from "../hooks/useMinipoolDetails";

function SummaryCardHeader({ asLink, nodeAddress }) {
  const [highlighted, setHighlighted] = useState("");
  const theme = useTheme();
  const minipools = useMinipoolDetails(nodeAddress);
  const rplEthPrice = useRplEthPrice();
  const { data: details } = useNodeDetails({ nodeAddress });
  let { rplStake } = details || {
    rplStake: ethers.constants.Zero,
  };
  const rplStatus = useNodeRplStatus({ nodeAddress });
  const depositEth = bnSum(
    (minipools || [])
      .filter((mp) => !mp.isFinalized)
      .map((mp) => mp.nodeDepositBalance)
  );
  const rplStakeEth = rplStake
    ?.mul(rplEthPrice)
    .div(ethers.constants.WeiPerEther);

  let rplStakeText = trimValue(ethers.utils.formatUnits(rplStake), {
    maxDecimals: 0,
  });
  let depositEthText = trimValue(ethers.utils.formatUnits(depositEth), {
    maxDecimals: 0,
  });
  let rplStakeEthText = trimValue(ethers.utils.formatUnits(rplStakeEth), {
    maxDecimals: 1,
  });
  return (
    <CardHeader
      disableTypography
      sx={{ alignItems: "flex-start" }}
      title={
        <WalletChip
          clickable={false}
          sx={{ mt: 1, cursor: "inherit" }}
          labelVariant={"body2"}
          walletAddress={nodeAddress}
        />
      }
      action={
        <Stack sx={{ lineHeight: 0 }} direction="column">
          <Stack sx={{ mr: 1 }} spacing={2} direction="row" alignItems="center">
            <Tooltip
              arrow
              title="ETH deposited into minipools + ETH value of staked RPL"
              onOpen={() => setHighlighted("depositEth")}
              onClose={() => setHighlighted("")}
            >
              <Stack
                sx={{
                  pt: 1,
                  opacity:
                    !highlighted || highlighted === "depositEth" ? 1 : 0.25,
                }}
                spacing={0}
                direction="column"
                alignItems="flex-end"
              >
                <Box sx={{ mt: 0 }}>
                  <Chip
                    size="small"
                    label={
                      <Typography variant="caption">
                        <Typography
                          variant="caption"
                          sx={{
                            opacity:
                              !highlighted || highlighted === "depositEth"
                                ? 1
                                : 0.25,
                          }}
                          color="inherit"
                          component="span"
                        >
                          {depositEthText}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ opacity: !highlighted ? 1 : 0.25 }}
                          color="inherit"
                          component="span"
                        >
                          {" + "}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity:
                              !highlighted || highlighted === "rplStakeEth"
                                ? 1
                                : 0.25,
                            textEmphasisColor: "red",
                          }}
                          color="inherit"
                          component="span"
                        >
                          {rplStakeEthText}
                        </Typography>
                      </Typography>
                    }
                  />
                </Box>
                <FormHelperText sx={{ mt: 0.25 }}>
                  tvl
                  <Typography
                    component={"span"}
                    variant="eth"
                    sx={{ pl: 0.5 }}
                    color={(theme) => theme.palette.eth.light}
                  >
                    {"ETH"}
                  </Typography>
                </FormHelperText>
              </Stack>
            </Tooltip>
            <Tooltip
              arrow
              onOpen={() => setHighlighted("rplStakeEth")}
              onClose={() => setHighlighted("")}
              slotProps={{
                tooltip: {
                  sx: { boxShadow: 4, bgcolor: "background.paper" },
                },
              }}
              title={
                rplStake.isZero() ? undefined : (
                  <RplStakeChart
                    sx={{ p: 1, width: 260 }}
                    nodeAddress={nodeAddress}
                  />
                )
              }
            >
              <Stack
                sx={{
                  pt: 1,
                  cursor: "help",
                  opacity:
                    !highlighted || highlighted === "rplStakeEth" ? 1 : 0.25,
                }}
                direction="column"
                alignItems="flex-end"
              >
                <Box sx={{ mt: 0, cursor: "help" }}>
                  <Chip
                    size="small"
                    variant={"filled"}
                    icon={
                      {
                        under: <Warning />,
                        close: <Warning />,
                      }[rplStatus]
                    }
                    label={
                      <Typography variant="caption" color="text.primary">
                        {rplStakeText}
                      </Typography>
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
            </Tooltip>
          </Stack>
          {depositEth.isZero() && rplStakeEth.isZero() ? null : (
            <Box sx={{}}>
              <ResponsiveContainer height={4} width="100%">
                <Treemap
                  colorPanel={[
                    theme.palette.eth.light,
                    theme.palette.rpl.light,
                  ]}
                  data={[
                    {
                      name: "depositEth",
                      value: Number(ethers.utils.formatUnits(depositEth)),
                      color: theme.palette.eth.main,
                    },
                    {
                      name: "rplStakeEth",
                      value: Number(ethers.utils.formatUnits(rplStakeEth)),
                      color: theme.palette.rpl.main,
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
            </Box>
          )}
        </Stack>
      }
    />
  );
}

function PeriodicRewardsCard({
  sx,
  asLink,
  unclaimed,
  unclaimedEthTotal,
  unclaimedRplTotal,
}) {
  return (
    <Card elevation={5} sx={sx}>
      <CardHeader
        avatar={<EventRepeat fontSize="medium" color="disabled" />}
        subheader="Periodic Rewards"
        action={
          <Tooltip title={<RewardsHelpInfo />}>
            {asLink ? (
              <Typography color="text.secondary">
                <Help sx={{ mt: 0, ml: 1, mr: 1 }} fontSize="small" />
              </Typography>
            ) : (
              <IconButton
                href="https://docs.rocketpool.net/guides/node/rewards.html"
                sx={{ opacity: 0.5 }}
                component="a"
                target="_blank"
                color="inherit"
                size="small"
              >
                <Typography color="text.secondary">
                  <Help sx={{ mt: 0, ml: 1, mr: 1 }} fontSize="small" />
                </Typography>
              </IconButton>
            )}
          </Tooltip>
        }
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
  let stakingMpCount = minipools.filter(
    ({ isFinalized }) => !isFinalized
  ).length;
  return (
    <Card elevation={5}>
      <CardHeader
        avatar={<AllInclusive fontSize="medium" color="disabled" />}
        subheader="Continuous Rewards"
      />
      <CardContent sx={{ pt: 0 }}>
        <CurrencyValue
          sx={{ mb: 2 }}
          value={stakingMpCount && nodeTotal}
          size="medium"
          currency="eth"
        />
        <FormHelperText sx={{ mb: 2 }}>
          Across{" "}
          <Chip
            component="span"
            size="small"
            label={stakingMpCount === 0 ? "-" : stakingMpCount.toLocaleString()}
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

function RplPriceRangeAxis({ sx, nodeAddress }) {
  const theme = useTheme();
  const { data: details } = useNodeDetails({ nodeAddress });
  const rplEthPrice = useRplEthPrice();
  const rplStatus = useNodeRplStatus({ nodeAddress });
  let { rplStake, minimumRPLStake } = details || {
    rplStake: ethers.constants.Zero,
    minimumRPLStake: ethers.constants.Zero,
  };
  let rplStakeOrOne = rplStake.isZero() ? ethers.constants.One : rplStake;
  return (
    <Stack
      sx={sx}
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack direction="row" spacing={0.5}>
        <CurrencyValue
          key="min"
          value={minimumRPLStake.mul(rplEthPrice).div(rplStakeOrOne)}
          valueColor={
            {
              under: theme.palette.error.main,
              close: theme.palette.warning.main,
            }[rplStatus]
          }
          hideCurrency
          sx={{ opacity: 0.8 }}
          trimZeroWhole
          maxDecimals={4}
          currency="eth"
          perCurrency="rpl"
          size="small"
        />
        <Typography
          sx={{ textAlign: "center", pt: 0, opacity: 0.5 }}
          variant="body1"
          component={"span"}
          color="textSecondary"
        >
          &lt;-&gt;
        </Typography>
        <CurrencyValue
          key="max"
          value={minimumRPLStake
            .mul(3)
            .div(2)
            .mul(rplEthPrice)
            .div(rplStakeOrOne)}
          sx={{ opacity: 0.8 }}
          hideCurrency
          trimZeroWhole
          maxDecimals={4}
          currency="eth"
          perCurrency="rpl"
          size="small"
        />
      </Stack>
      <Typography component={"span"} variant="body1" color="text.secondary">
        <Typography
          component={"span"}
          variant="body1"
          color={theme.palette.eth.main}
        >
          ETH
        </Typography>
        /
        <Typography
          component={"span"}
          variant="body1"
          color={theme.palette.rpl.main}
        >
          RPL
        </Typography>
      </Typography>
    </Stack>
  );
}

function RplStakeEthRangeAxis({ sx, nodeAddress }) {
  const { data: details } = useNodeDetails({ nodeAddress });
  let rplStatus = useNodeRplStatus({ nodeAddress });
  const rplEthPrice = useRplEthPrice();
  let { minimumRPLStake, ethMatched } = details || {
    minimumRPLStake: ethers.constants.Zero,
    ethMatched: ethers.constants.Zero,
  };
  let decayThresholdRPLStake =
    minimumRPLStake?.mul(3).div(2) || ethers.constants.Zero;
  const decayThresholdRPLStakeEth = decayThresholdRPLStake
    ?.mul(rplEthPrice)
    .div(ethers.constants.WeiPerEther);
  return (
    <Stack direction="column" alignItems={"center"}>
      <Stack direction={"row"} alignItems={"baseline"} spacing={0.75}>
        <CurrencyValue
          value={ethMatched}
          size="small"
          currency="eth"
          maxDecimals={0}
        />
        <Typography variant="caption" color="textSecondary">
          borrowed
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.5}>
        <CurrencyValue
          hideCurrency
          sx={{
            width: 95,
            opacity: 0.8,
            ...(rplStatus === "under"
              ? {
                  opacity: 1,
                }
              : {}),
          }}
          justifyContent="end"
          key="min"
          value={ethMatched.div(10)}
          maxDecimals={1}
          currency="eth"
          size="small"
        />
        <Typography
          sx={{ textAlign: "center", pt: 0, opacity: 0.5 }}
          variant="body1"
          color="textSecondary"
        >
          &lt;-&gt;
        </Typography>
        <CurrencyValue
          hideCurrency
          sx={{
            width: 95,
            opacity: 0.8,
            ...(rplStatus === "excess"
              ? {
                  opacity: 1,
                }
              : {}),
          }}
          justifyContent="start"
          key="max"
          value={decayThresholdRPLStakeEth}
          maxDecimals={2}
          currency="eth"
          size="small"
        />
      </Stack>
      <Stack direction="row" spacing={4}>
        <Typography variant="caption" color="textSecondary">
          10%
        </Typography>
        <Typography variant="caption" color="textSecondary">
          15%
        </Typography>
      </Stack>
    </Stack>
  );
}

function decayedRplWeight({ rplStake, ethMatched, rplPrice }) {
  // See RPIP-30
  const weight =
    (13.6137 + 2 * Math.log((100 * rplStake * rplPrice) / ethMatched - 13)) *
    ethMatched;
  return weight;
}

function DecayingRplYieldCurve(props) {
  const {
    x,
    y,
    width,
    height,
    fill,
    opacity,
    decayFill,
    rplStake,
    minRplPrice,
    maxRplPrice,
    ethMatched,
  } = props;
  const weightAtPrice = (rplPrice) =>
    decayedRplWeight({
      ethMatched: ethMatched.div(ethers.constants.WeiPerEther).toNumber(),
      rplStake: rplStake.div(ethers.constants.WeiPerEther).toNumber(),
      rplPrice,
    });
  const maxWeight = weightAtPrice(minRplPrice);
  const yAtPrice = (price) =>
    ((weightAtPrice(price) - maxWeight) / maxWeight) * height + y;
  const xAtPrice = (price) =>
    ((price - minRplPrice) / (maxRplPrice - minRplPrice)) * width + x;
  const curvePointCount = 20; // enough to make it smooth-ish
  const curvePricePoints = Array(curvePointCount)
    .fill(minRplPrice)
    .map(
      (price, i) =>
        price + ((maxRplPrice - minRplPrice) * i) / (curvePointCount - 1)
    );
  return (
    <g>
      <path
        d={[`M ${xAtPrice(minRplPrice)} ${yAtPrice(minRplPrice)}`]
          .concat(
            curvePricePoints
              .slice(1)
              .map((price) => `L ${xAtPrice(price)} ${yAtPrice(price)}`)
          )
          .concat([`L ${xAtPrice(maxRplPrice)} ${yAtPrice(minRplPrice)}`, "Z"])
          .join(" ")}
        fill={decayFill}
        opacity={opacity}
      />
      <path
        d={[
          `M ${xAtPrice(minRplPrice)} ${y + height}`,
          `L ${xAtPrice(minRplPrice)} ${yAtPrice(minRplPrice)}`,
        ]
          .concat(
            curvePricePoints
              .slice(1)
              .map((price) => `L ${xAtPrice(price)} ${yAtPrice(price)}`)
          )
          .concat([`L ${xAtPrice(maxRplPrice)} ${y + height}`, "Z"])
          .join(" ")}
        fill={fill}
        opacity={opacity}
      />
    </g>
  );
}

function RplStakeChart({ sx, nodeAddress }) {
  const theme = useTheme();
  const { data: details } = useNodeDetails({ nodeAddress });
  const rplEthPrice = useRplEthPrice();
  let rplStatus = useNodeRplStatus({ nodeAddress });
  let { ethMatched, rplStake, minimumRPLStake } = details || {
    ethMatched: ethers.constants.Zero,
    rplStake: ethers.constants.Zero,
    minimumRPLStake: ethers.constants.Zero,
  };
  const rplStakeEth = rplStake
    ?.mul(rplEthPrice)
    .div(ethers.constants.WeiPerEther);
  let decayThresholdRPLStake =
    minimumRPLStake?.mul(3).div(2) || ethers.constants.Zero;
  const minRplPrice = rplStake.isZero()
    ? 0
    : Number(
        ethers.utils.formatUnits(
          minimumRPLStake
            .mul(rplEthPrice)
            .div(rplStake.isZero() ? ethers.constants.One : rplStake)
        )
      );
  const decayThresholdRplPrice = rplStake.isZero()
    ? 0
    : Number(
        ethers.utils.formatUnits(
          decayThresholdRPLStake
            .mul(rplEthPrice)
            .div(rplStake.isZero() ? ethers.constants.One : rplStake)
        )
      );
  const rplPrice = Number(ethers.utils.formatUnits(rplEthPrice)) || 0;
  const maxRplStake = decayThresholdRPLStake.mul(20).div(12);
  const maxRplPrice = rplStake.isZero()
    ? 0
    : Number(
        ethers.utils.formatUnits(
          (maxRplStake.lt(rplStake) ? rplStake : maxRplStake)
            .mul(rplEthPrice)
            .div(rplStake.isZero() ? ethers.constants.One : rplStake)
        )
      );
  const data = [
    {
      name: "min",
      rplPrice: minRplPrice,
      value: 1,
    },
    {
      name: "current",
      rplPrice: rplPrice,
      value: 1,
    },
    {
      name: "decay",
      rplPrice: decayThresholdRplPrice,
      value: 1,
    },
    {
      name: "max",
      rplPrice: maxRplPrice,
      value: 1,
    },
  ];
  const priceLineY = 0.5;

  const rplPriceText = trimValue(ethers.utils.formatUnits(rplEthPrice), {
    maxDecimals: 4,
    trimZeroWhole: true,
  });
  const rplStakeEthPriceText = trimValue(
    ethers.utils.formatUnits(rplStakeEth),
    { maxDecimals: 2 }
  );
  const percentEffective = {
    under: () => 0,
    close: () => 1,
    excess: () =>
      decayedRplWeight({
        ethMatched: ethMatched.div(ethers.constants.WeiPerEther).toNumber(),
        rplStake: rplStake.div(ethers.constants.WeiPerEther).toNumber(),
        rplPrice,
      }) /
      100 /
      (rplStakeEth.div(ethers.constants.WeiPerEther).toNumber() || 0.00001),
    optimal: () => 1,
  }[rplStatus]?.();
  return (
    <Stack sx={sx} direction="column">
      <Stack sx={{ mb: 1 }} direction="column" alignItems="center">
        <CurrencyValue
          prefix={<>≈&thinsp;</>}
          value={rplStakeEth}
          maxDecimals={2}
          currency={"eth"}
          size="medium"
        />
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" color="textSecondary">
            @
          </Typography>
          <CurrencyValue
            value={rplEthPrice}
            trimZeroWhole
            maxDecimals={4}
            currency={"eth"}
            perCurrency={"rpl"}
            size="small"
          />
        </Stack>
      </Stack>
      <Grid container alignItems={"center"} spacing={1} sx={{ mb: 1 }}>
        <Grid item flex={1}>
          <Divider />
        </Grid>
        <Grid item>
          <Chip
            size="medium"
            variant="outlined"
            color={
              {
                under: "error",
                close: "warning",
                optimal: "success",
                excess: "success",
              }[rplStatus]
            }
            label={
              percentEffective === 0 ? (
                <Typography variant="caption" color="text.primary">
                  below RPL reward threshold
                </Typography>
              ) : (
                <Typography variant="body1" color="text.primary">
                  {(100 * percentEffective).toFixed(0)}% effective
                </Typography>
              )
            }
          />
        </Grid>
        <Grid item flex={1}>
          <Divider />
        </Grid>
      </Grid>
      <RplStakeEthRangeAxis nodeAddress={nodeAddress} />
      <ResponsiveContainer height={120} width="100%">
        <LineChart
          margin={{}}
          isAnimationActive={false}
          data={data}
          overflow="visible"
        >
          <defs>
            <linearGradient
              id="ethToRplGradient"
              x2="0%"
              y2="100%"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="33%" stopColor={theme.palette.eth.main} />
              <stop offset="66%" stopColor={theme.palette.rpl.main} />
            </linearGradient>
            <linearGradient id="warnToSuccessGradient" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.palette.warning.main} />
              <stop offset="10%" stopColor={theme.palette.warning.main} />
              <stop offset="30%" stopColor={theme.palette.success.main} />
              <stop offset="100%" stopColor={theme.palette.success.main} />
            </linearGradient>
            <pattern
              id="errorPattern"
              width="8"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45 50 50)"
            >
              <line
                stroke={theme.palette.error.main}
                strokeWidth="7px"
                y2="10"
              />
            </pattern>
            <pattern
              id="successPattern"
              width="8"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45 50 50)"
            >
              <line
                stroke={theme.palette.success.main}
                strokeWidth="7px"
                y2="10"
              />
            </pattern>
            <pattern
              id="ethRplPattern"
              width="16"
              height="20"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45 50 50)"
            >
              <rect
                fill={theme.palette.eth.main}
                strokeOpacity={0.8}
                width="16"
                height="20"
              />
              <line
                stroke={theme.palette.rpl.dark}
                strokeOpacity={0.8}
                strokeWidth="15px"
                y2="20"
              />
            </pattern>
          </defs>
          <XAxis
            dataKey="rplPrice"
            hide
            xAxisId="top"
            orientation="top"
            type="number"
            axisLine={false}
            ticks={[minRplPrice, maxRplPrice]}
            // label={<Label value="price" position="middle" fill={theme.palette.text.secondary} fontSize={10} />}
            fontSize={12}
            tickFormatter={(value) => value.toFixed(4)}
            tickSize={0}
            tickMargin={5}
            tickLine
            interval={0}
            // allowDataOverflow
            domain={[0, maxRplPrice]}
          />
          <YAxis type="number" ticks={[0, 1]} domain={[0, "dataMax"]} hide />
          <YAxis type="number" ticks={[0, 1]} domain={[0, "dataMax"]} hide />
          {/*<ReferenceLine xAxisId="top" y={priceLineY} strokeWidth={1} stroke={theme.palette.text.primary} opacity={0.1}/>*/}
          <ReferenceLine
            xAxisId="top"
            x={minRplPrice}
            stroke={theme.palette.text.secondary}
            opacity={0.3}
          />
          <ReferenceLine
            xAxisId="top"
            x={minRplPrice}
            stroke={theme.palette.text.secondary}
            opacity={0.3}
          />
          <ReferenceLine
            xAxisId="top"
            x={(minRplPrice * 3) / 2}
            stroke={theme.palette.text.secondary}
            opacity={0.3}
          />
          <ReferenceLine
            xAxisId="top"
            x={maxRplPrice}
            stroke={theme.palette.text.secondary}
            opacity={0.3}
          />
          <ReferenceArea
            xAxisId="top"
            x1={0}
            x2={minRplPrice}
            y1={0.05}
            y2={0.95}
            stroke={"none"}
            fill="url(#errorPattern)"
            opacity={rplStatus === "under" ? 1 : 0.5}
          />
          <ReferenceArea
            xAxisId="top"
            x1={minRplPrice}
            x2={decayThresholdRplPrice}
            y1={0.05}
            y2={0.95}
            opacity={0.5}
            fill="url(#warnToSuccessGradient)"
          />
          <ReferenceArea
            xAxisId="top"
            x1={decayThresholdRplPrice}
            y1={0.05}
            y2={0.95}
            // fill={"url(#warnToSuccessGradient)"}
            fill={theme.palette.success.main}
            shape={
              <DecayingRplYieldCurve
                minRplPrice={decayThresholdRplPrice}
                maxRplPrice={maxRplPrice}
                rplStake={rplStake}
                ethMatched={ethMatched}
                opacity={0.3}
                decayFill={"url(#successPattern)"}
              />
            }
          />
          {/*<ReferenceLine xAxisId="top" x={rplPrice} stroke={theme.palette.rpl.main} opacity={0.5} />*/}
          <ReferenceLine
            xAxisId="top"
            x={rplPrice}
            stroke="url(#ethToRplGradient)"
            strokeWidth={4}
            opacity={0.5}
          />
          <ReferenceDot
            xAxisId="top"
            x={rplPrice}
            y={priceLineY}
            fill={theme.palette.background.default}
            stroke={theme.palette.eth.main}
            strokeWidth={2}
            radius={4}
            width={12 * rplStakeEthPriceText.length}
            height={32}
            shape={({ cx, cy, x, y, width, height, ...props }) => {
              return (
                <Rectangle
                  x={cx - width / 2}
                  y={cy - height - 6}
                  {...{
                    width,
                    height,
                    ...props,
                  }}
                />
              );
            }}
          >
            <Label
              value={rplStakeEthPriceText}
              position="top"
              fill={theme.palette.text.primary}
              fontSize={18}
            />
          </ReferenceDot>
          <ReferenceDot
            xAxisId="top"
            x={rplPrice}
            y={priceLineY}
            fill={theme.palette.background.default}
            stroke="url(#ethRplPattern)"
            strokeWidth={2}
            radius={4}
            width={12 * rplPriceText.length}
            height={32}
            shape={({ cx, cy, x, y, width, height, ...props }) => {
              return (
                <Rectangle
                  x={cx - width / 2}
                  y={cy + 6}
                  {...{
                    width,
                    height,
                    ...props,
                  }}
                />
              );
            }}
          >
            <Label
              value={rplPriceText}
              position="bottom"
              fill={theme.palette.text.primary}
              fontSize={18}
            />
          </ReferenceDot>
        </LineChart>
      </ResponsiveContainer>
      <RplPriceRangeAxis
        sx={{ mt: 1, mb: 1, ml: 0, mr: 0 }}
        nodeAddress={nodeAddress}
      />
    </Stack>
  );
}

const ten = ethers.utils.parseUnits("10");
function SummaryCardContent({ asLink, nodeAddress, size = "large" }) {
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
          <PeriodicRewardsCard
            sx={{ mt: 2, mb: 3 }}
            asLink={asLink}
            {...periodic}
          />
          <ContinuousRewardsCard nodeAddress={nodeAddress} asLink={asLink} />
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
          <SummaryCardHeader asLink nodeAddress={nodeAddress} />
          <SummaryCardContent asLink nodeAddress={nodeAddress} size={size} />
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
