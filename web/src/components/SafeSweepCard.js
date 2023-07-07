import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  FormHelperText,
  Grid,
  Link,
  Paper,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ExpandLess,
  ExpandMore,
  HelpOutline,
  Merge,
  OpenInNew,
  Tune,
} from "@mui/icons-material";
import _ from "lodash";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import {
  BNSortComparator,
  bnSum,
  delegateUpgradeEncoded,
  distributeBalanceEncoded,
  distributeEncoded,
  estimateClaimIntervalsGas,
  estimateDistributeConsensusBatchGas,
  estimateTipsMevGas,
  MinipoolStatus,
  safeAppUrl,
} from "../utils";
import useCouldBeSafeContract from "../hooks/useCouldBeSafeContract";
import useMinipoolDetails from "../hooks/useMinipoolDetails";
import SafeIcon from "./SafeIcon";
import { GasInfo } from "./GasInfoFooter";
import DistributeEfficiencyAlert from "./DistributeEfficiencyAlert";
import useGasPrice from "../hooks/useGasPrice";
import CurrencyValue from "./CurrencyValue";
import useCanConnectedAccountWithdraw from "../hooks/useCanConnectedAccountWithdraw";
import useNodeContinuousRewards from "../hooks/useNodeContinuousRewards";
import ClaimSlider from "./ClaimSlider";
import useNodeFinalizedRewardSnapshots from "../hooks/useNodeFinalizedRewardSnapshots";
import contracts from "../contracts";
import useNodeDetails from "../hooks/useNodeDetails";
import { ClaimButtonTooltip } from "./ClaimAndStakeForm";

function ConsensusConfigurationCard({
  sx,
  isDistributingConsensus,
  onDistributingConsensusChanged,
  batchSize,
  onBatchSize,
  ethThreshold,
  onEthThreshold,
  minipoolCount,
  disabled = false,
  calculatedBatchAmount = ethers.constants.Zero,
  calculatedMinipoolCount = 0,
}) {
  return (
    <Grid
      sx={sx}
      container
      rowSpacing={1}
      columnSpacing={2}
      alignItems="center"
    >
      <Grid item xs={5} sx={{ textAlign: "right" }}>
        <Tooltip
          arrow
          sx={{ cursor: "help" }}
          title="Distribute beacon chain rewards that have accumulated in your minipools."
        >
          <Stack
            direction={"row"}
            spacing={1}
            justifyContent="end"
            alignItems={"center"}
          >
            <HelpOutline fontSize="inherit" color="disabled" />
            <Typography color={"text.primary"} variant={"subtitle2"}>
              Consensus
            </Typography>
          </Stack>
        </Tooltip>
      </Grid>
      <Grid item xs={7}>
        <FormControlLabel
          control={
            <Checkbox
              disabled={disabled}
              checked={isDistributingConsensus}
              onChange={(e) => onDistributingConsensusChanged(e.target.checked)}
            />
          }
          color="text.secondary"
          slotProps={{
            typography: {
              variant: "caption",
              color: "text.secondary",
            },
          }}
          disableTypography
          label={
            <Stack direction="column">
              <Stack direction="row" spacing={1}>
                <CurrencyValue
                  size="xsmall"
                  value={calculatedBatchAmount}
                  currency="eth"
                />
              </Stack>
              <FormHelperText sx={{ m: 0 }}>
                {isDistributingConsensus ? "Distributing" : "Not Distributing"}
              </FormHelperText>
            </Stack>
          }
        />
      </Grid>
      {!isDistributingConsensus ? null : (
        <>
          <Grid item xs={6} sx={{ textAlign: "right" }}>
            <Tooltip
              arrow
              sx={{ cursor: "help" }}
              title="Exclude minipools with ETH balance less than this amount"
            >
              <Stack
                direction={"row"}
                spacing={1}
                justifyContent="end"
                alignItems={"center"}
              >
                <HelpOutline fontSize="inherit" color="disabled" />
                <Typography color={"text.primary"} variant={"subtitle2"}>
                  Threshold
                </Typography>
              </Stack>
            </Tooltip>
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Chip
                size="small"
                sx={{ width: 70 }}
                label={Number(ethThreshold).toFixed(2)}
              />
              <Slider
                size="small"
                valueLabelDisplay="off"
                value={Number(ethThreshold)}
                onChange={(e) => onEthThreshold(String(e.target.value))}
                min={0}
                step={0.01}
                max={0.5}
              />
            </Stack>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: "right" }}>
            <Tooltip
              arrow
              sx={{ cursor: "help" }}
              title="Limit the batch to this many minipools (larger balances are selected first)"
            >
              <Stack
                direction={"row"}
                spacing={1}
                justifyContent="end"
                alignItems={"center"}
              >
                <HelpOutline fontSize="inherit" color="disabled" />
                <Typography color={"text.primary"} variant={"subtitle2"}>
                  Batch Size
                </Typography>
              </Stack>
            </Tooltip>
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Chip size="small" sx={{ width: 70 }} label={batchSize} />
              <Slider
                size="small"
                valueLabelDisplay="off"
                value={batchSize}
                onChange={(e) => onBatchSize(e.target.value)}
                min={1}
                step={1}
                max={Math.min(200, minipoolCount)}
              />
            </Stack>
          </Grid>
        </>
      )}
    </Grid>
  );
}

function ReceiptsInfo({
  sx,
  size = "small",
  amountEth = ethers.constants.Zero,
  amountRpl,
  amountGas,
}) {
  const gasPrice = useGasPrice();
  const gasCostEth = gasPrice.mul(amountGas);
  return (
    <Stack
      sx={sx}
      direction="row"
      alignItems="baseline"
      justifyContent="space-between"
    >
      <Stack direction="column">
        <Stack direction="row" spacing={1} justifyContent="space-between">
          <CurrencyValue
            value={amountEth.sub(gasCostEth)}
            currency="eth"
            placeholder="0"
            size={size}
          />
          {!amountRpl ? null : (
            <CurrencyValue
              value={amountRpl}
              currency="rpl"
              placeholder="0"
              size={size}
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.disabled">
          receipts (after gas)
        </Typography>
      </Stack>
      <GasInfo size={size} gasAmount={amountGas} />
    </Stack>
  );
}

function useSortedMinipoolDetails(nodeAddress) {
  let minipools = useMinipoolDetails(nodeAddress);
  // TODO: consider caching this
  return _.chain(minipools)
    .map((mp) => ({ ...mp, balance: ethers.BigNumber.from(mp.balance || "0") }))
    .sort((a, b) => BNSortComparator(b.balance, a.balance))
    .value();
}

function UnupgradedAlert({ sx, nodeAddress }) {
  let { connector, address } = useAccount();
  let minipools = useSortedMinipoolDetails(nodeAddress);
  let withdrawalAddress = useNodeWithdrawalAddress(nodeAddress);
  let unupgradedMps = minipools.filter(({ upgraded }) => upgraded === false);
  const upgradeAll = async (unupgradedMps) => {
    let sdk = new SafeAppsSDK({
      // allowedDomains: ["*"],
      debug: true,
    });
    let txs = unupgradedMps.map(({ minipoolAddress }) => ({
      operation: "0x00",
      to: minipoolAddress,
      value: "0",
      data: delegateUpgradeEncoded,
    }));
    return sdk.txs.send({
      txs,
    });
  };
  if (!unupgradedMps.length) {
    return null;
  }
  const isSafeConnected = connector?.id === "safe";
  const isNodeOrWithdrawalAddress =
    address === nodeAddress || address === withdrawalAddress;
  const canProposeBatches = isSafeConnected && isNodeOrWithdrawalAddress;
  return (
    <Alert
      sx={{ mb: 4, maxWidth: 450 }}
      severity={"info"}
      action={
        canProposeBatches && (
          <Button
            size={"small"}
            variant={"contained"}
            color={"info"}
            onClick={() => upgradeAll(unupgradedMps)}
          >
            Upgrade
          </Button>
        )
      }
    >
      <AlertTitle>
        <Chip size="small" label={unupgradedMps.length} /> minipools need
        upgrade
      </AlertTitle>
      You cannot distribute minipools that have not been upgraded.
    </Alert>
  );
}

function useNodeWithdrawalAddress(nodeAddress) {
  let { data } = useNodeDetails({ nodeAddress });
  return data?.withdrawalAddress;
}

function SafeAlert({ sx, nodeAddress }) {
  let { connector } = useAccount();
  let withdrawalAddress = useNodeWithdrawalAddress(nodeAddress);
  let hasSafeWithdrawalAddress = useCouldBeSafeContract(withdrawalAddress);
  let hasSafeNodeAddress = useCouldBeSafeContract(nodeAddress);
  let safeAddress = hasSafeWithdrawalAddress
    ? withdrawalAddress
    : hasSafeNodeAddress
    ? nodeAddress
    : null;
  if (!safeAddress) {
    return (
      <Alert severity="warning" sx={sx}>
        Sweep requires the node or its withdrawal address to be a{" "}
        <Link href="https://safe.global/" target="_blank">
          Safe
        </Link>
      </Alert>
    );
  }
  if (connector?.id === "safe") {
    // No alert when it is already open as a Safe app.
    return null;
  }
  return (
    <Alert
      severity="warning"
      sx={sx}
      size={"small"}
      action={
        <Button
          variant="outlined"
          size="small"
          color="primary"
          startIcon={<SafeIcon />}
          endIcon={<OpenInNew />}
          href={safeAppUrl({ safeAddress })}
        >
          Open
        </Button>
      }
    >
      Open as a Safe App to enable Sweep
    </Alert>
  );
}

function useSweeper({ nodeAddress }) {
  let { data: details } = useNodeDetails({ nodeAddress });
  let { feeDistributorAddress } = details || {};

  // Intervals configuration
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
  let totalEth = bnSum(amountsEth);
  let totalRpl = bnSum(amountsRpl);
  let [isClaimingInterval, setClaimingInterval] = useState(
    !totalRpl.isZero() || !totalEth.isZero()
  );
  let [stakeAmountRpl, setStakeAmountRpl] = useState(totalRpl);
  // If we get updated interval info (`totalRpl/Eth`) then we want to use it as default.
  useEffect(
    () => setClaimingInterval(!totalRpl.isZero() || !totalEth.isZero()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalEth.toString(), totalRpl.toString()]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setStakeAmountRpl(totalRpl), [totalRpl.toString()]);

  // Consensus configuration
  let minipools = useSortedMinipoolDetails(nodeAddress);
  let distributableMinipools = _.chain(minipools)
    .filter(({ status }) => status === MinipoolStatus.staking)
    .filter(({ upgraded }) => upgraded)
    .filter(({ balance }) => balance.gt(ethers.constants.Zero))
    .value();
  let [isDistributingConsensus, setDistributingConsensus] = useState(
    !!distributableMinipools.length
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    () => setDistributingConsensus(!!distributableMinipools.length),
    [distributableMinipools.length]
  );
  let [batchSize, setBatchSize] = useState(minipools.length || 200);
  let [ethThreshold, setEthThreshold] = useState("0");
  let batches = _.chain(distributableMinipools)
    .filter(({ balance }) => balance.gte(ethers.utils.parseEther(ethThreshold)))
    .chunk(batchSize)
    .value();
  let currentBatch = _.first(batches);
  // let moreBatches = _.tail(batches);
  let currentBatchAmount = bnSum(
    (currentBatch || []).map(({ nodeBalance }) => nodeBalance)
  );

  // Execution configuration
  let { executionNodeTotal } = useNodeContinuousRewards({ nodeAddress });
  let [isDistributingTipsMev, setDistributingTipsMev] = useState(
    !executionNodeTotal.isZero()
  );
  // If we get an updated `executionNodeTotal` later, we want to use it as the default.
  useEffect(
    () => setDistributingTipsMev(!executionNodeTotal.isZero()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [executionNodeTotal.toString()]
  );

  let beforeGas = {
    intervalsEth: totalEth,
    tipsMevEth: executionNodeTotal,
    consensusEth: currentBatchAmount,
  };
  let callGas = ethers.BigNumber.from("21000");

  let gas = {
    intervals: estimateClaimIntervalsGas(
      unclaimed.length,
      stakeAmountRpl.isZero()
    ),
    tipsMev: estimateTipsMevGas(),
    consensus: estimateDistributeConsensusBatchGas((currentBatch || []).length),
  };
  let overall = {
    eth: bnSum([
      isClaimingInterval ? beforeGas.intervalsEth : ethers.constants.Zero,
      isDistributingTipsMev ? beforeGas.tipsMevEth : ethers.constants.Zero,
      isDistributingConsensus ? beforeGas.consensusEth : ethers.constants.Zero,
    ]),
    rpl: isClaimingInterval
      ? totalRpl.sub(stakeAmountRpl)
      : ethers.constants.Zero,
    gas: bnSum([
      isClaimingInterval ? gas.intervals : ethers.constants.Zero,
      isDistributingTipsMev ? gas.tipsMev : ethers.constants.Zero,
      isDistributingConsensus ? gas.consensus : ethers.constants.Zero,
    ]),
  };
  if (!overall.gas.isZero()) {
    overall.gas = overall.gas.add(callGas);
  }
  let execute = async () => {
    let sdk = new SafeAppsSDK();
    let txs = [];
    if (isClaimingInterval) {
      let args = [
        nodeAddress,
        rewardIndexes,
        amountsRpl,
        amountsEth,
        merkleProofs,
        stakeAmountRpl,
      ];
      txs = txs.concat([
        {
          operation: "0x00",
          to: contracts.RocketMerkleDistributorMainnet.address,
          value: "0",
          data: new ethers.utils.Interface(
            contracts.RocketMerkleDistributorMainnet.abi
          ).encodeFunctionData("claimAndStake", args),
        },
      ]);
    }
    if (isDistributingTipsMev) {
      txs = txs.concat([
        {
          operation: "0x00",
          to: feeDistributorAddress,
          value: "0",
          data: distributeEncoded,
        },
      ]);
    }
    if (isDistributingConsensus) {
      txs = txs.concat(
        currentBatch.map(({ minipoolAddress }) => ({
          operation: "0x00",
          to: minipoolAddress,
          value: "0",
          data: distributeBalanceEncoded,
        }))
      );
    }
    return sdk.txs.send({
      txs,
    });
  };

  return {
    execute,
    // Interval config
    isClaimingInterval,
    setClaimingInterval,
    stakeAmountRpl,
    setStakeAmountRpl,
    // Interval derived values
    totalEth,
    totalRpl,
    rewardIndexes,

    // Consensus config
    isDistributingConsensus,
    setDistributingConsensus,
    batchSize,
    setBatchSize,
    ethThreshold,
    setEthThreshold,
    // Consensus derived values
    minipools,
    distributableMinipools,
    currentBatch,
    currentBatchAmount,

    // Execution config
    isDistributingTipsMev,
    setDistributingTipsMev,
    executionNodeTotal,

    // Analysis
    beforeGas,
    gas,
    overall,
  };
}

function SweepCardContent({ sx, nodeAddress, sweeper }) {
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  let {
    isClaimingInterval,
    setClaimingInterval,
    stakeAmountRpl,
    setStakeAmountRpl,
    totalEth,
    totalRpl,

    isDistributingConsensus,
    setDistributingConsensus,
    batchSize,
    setBatchSize,
    ethThreshold,
    setEthThreshold,
    minipools,
    currentBatch,
    currentBatchAmount,

    isDistributingTipsMev,
    setDistributingTipsMev,

    beforeGas,
    gas,
    overall,
  } = sweeper;
  return (
    <CardContent sx={sx}>
      <Stack direction="column">
        <TransactionRow
          lhs={
            <Grid
              sx={{ pt: 0.5, pr: 3 }}
              container
              rowSpacing={2}
              columnSpacing={2}
              // alignItems="center"
            >
              <Grid item xs={5} sx={{ textAlign: "right" }}>
                <Tooltip
                  arrow
                  sx={{ cursor: "help" }}
                  title="Claim your periodic rewards. This includes inflation RPL and ETH for nodes in the smoothing pool."
                >
                  <Stack
                    direction={"row"}
                    spacing={1}
                    sx={{ pt: 1, pb: 1 }}
                    justifyContent="end"
                    alignItems={"center"}
                  >
                    <HelpOutline fontSize="inherit" color="disabled" />
                    <Typography color={"text.primary"} variant={"subtitle2"}>
                      Intervals
                    </Typography>
                  </Stack>
                </Tooltip>
              </Grid>
              <Grid item xs={7}>
                <Stack direction="column">
                  <FormControlLabel
                    control={
                      <Checkbox
                        // disabled={totalRpl.isZero() && totalEth.isZero()}
                        checked={isClaimingInterval}
                        onChange={(e) => setClaimingInterval(e.target.checked)}
                      />
                    }
                    color="text.secondary"
                    slotProps={{
                      typography: {
                        variant: "caption",
                        color: "text.secondary",
                      },
                    }}
                    disableTypography
                    label={
                      <Stack spacing={0} direction="column">
                        <Stack direction="row" spacing={1}>
                          <CurrencyValue
                            size="xsmall"
                            value={totalEth}
                            currency="eth"
                            placeholder="0"
                          />
                          {isClaimingInterval ? null : (
                            <CurrencyValue
                              size="xsmall"
                              value={totalRpl}
                              currency="rpl"
                              // placeholder="0"
                            />
                          )}
                        </Stack>
                        <FormHelperText sx={{ m: 0 }}>
                          {isClaimingInterval ? "Claiming" : "Not Claiming"}
                        </FormHelperText>
                      </Stack>
                    }
                  />
                  {!isClaimingInterval || totalRpl.isZero() ? null : (
                    <ClaimSlider
                      sx={{ ml: 4 }}
                      stakeAmountRpl={stakeAmountRpl}
                      totalRpl={totalRpl}
                      onSetStakeAmountRpl={setStakeAmountRpl}
                      caption="staking"
                      sliderProps={{
                        size: "small",
                        color: canWithdraw ? "rpl" : "gray",
                        sx: {
                          width: 124,
                          pb: 0,
                        },
                      }}
                    />
                  )}
                </Stack>
              </Grid>
            </Grid>
          }
          rhs={
            <Stack direction="column" sx={{ pl: 2, pr: 2 }} spacing={2}>
              {!isClaimingInterval ? null : (
                <ReceiptsInfo
                  amountEth={beforeGas.intervalsEth}
                  amountGas={gas.intervals}
                  amountRpl={totalRpl.sub(stakeAmountRpl)}
                />
              )}
              <TransactionDescription
                title={
                  isClaimingInterval
                    ? "Claim rewards (inflation, smoothing)"
                    : "Don't claim rewards (inflation, smoothing)"
                }
              />
            </Stack>
          }
        />
        <IconRow Icon={Add} />
        <TransactionRow
          lhs={
            <Grid
              sx={{ pt: 0, pr: 3 }}
              container
              rowSpacing={2}
              columnSpacing={2}
              alignItems="center"
            >
              <Grid item xs={5} sx={{ textAlign: "right" }}>
                <Tooltip
                  arrow
                  sx={{ cursor: "help" }}
                  title="Distribute tips/MEV awareded to your validators. This will stay empty when you're in the smoothing pool."
                >
                  <Stack
                    direction={"row"}
                    spacing={1}
                    justifyContent="end"
                    alignItems={"center"}
                  >
                    <HelpOutline fontSize="inherit" color="disabled" />
                    <Typography color={"text.primary"} variant={"subtitle2"}>
                      Execution
                    </Typography>
                  </Stack>
                </Tooltip>
              </Grid>
              <Grid item xs={7}>
                <FormControlLabel
                  control={
                    <Checkbox
                      // disabled={executionNodeTotal.isZero()}
                      checked={isDistributingTipsMev}
                      onChange={(e) => setDistributingTipsMev(e.target.checked)}
                    />
                  }
                  color="text.secondary"
                  slotProps={{
                    typography: {
                      variant: "caption",
                      color: "text.secondary",
                    },
                  }}
                  disableTypography
                  label={
                    <Stack spacing={0} direction="column">
                      <CurrencyValue
                        size="xsmall"
                        value={beforeGas.tipsMevEth}
                        currency="eth"
                      />
                      <FormHelperText sx={{ m: 0 }}>
                        {isDistributingTipsMev
                          ? "Distributing"
                          : "Not Distributing"}
                      </FormHelperText>
                    </Stack>
                  }
                />
              </Grid>
            </Grid>
          }
          rhs={
            <Stack direction="column" sx={{ pl: 2, pr: 2 }} spacing={2}>
              {!isDistributingTipsMev ? null : (
                <ReceiptsInfo
                  amountEth={beforeGas.tipsMevEth}
                  amountGas={gas.tipsMev}
                />
              )}
              <TransactionDescription
                title={
                  isDistributingTipsMev
                    ? "Distribute execution rewards (tips/MEV)"
                    : "Don't distribute execution rewards (tips/MEV)"
                }
              />
            </Stack>
          }
        />
        <IconRow Icon={Add} />
        <TransactionRow
          lhs={
            <ConsensusConfigurationCard
              sx={{ pr: 3, pt: 0 }}
              isDistributingConsensus={isDistributingConsensus}
              onDistributingConsensusChanged={setDistributingConsensus}
              // disabled={!distributableMinipools.length}
              batchSize={batchSize}
              ethThreshold={ethThreshold}
              onBatchSize={setBatchSize}
              onEthThreshold={setEthThreshold}
              minipoolCount={minipools.length}
              calculatedMinipoolCount={currentBatch?.length || 0}
              calculatedBatchAmount={currentBatchAmount}
            />
          }
          rhs={
            <Stack direction="column" sx={{ pl: 2, pr: 2 }} spacing={2}>
              {!isDistributingConsensus || !currentBatch?.length ? null : (
                <ReceiptsInfo
                  amountEth={beforeGas.consensusEth}
                  amountGas={gas.consensus}
                />
              )}
              <TransactionDescription
                title={
                  !isDistributingConsensus || !currentBatch?.length ? (
                    "Don't distribute any minipools (skimming etc)"
                  ) : (
                    <>
                      Distribute{" "}
                      <Chip
                        size="small"
                        label={
                          !currentBatch?.length
                            ? "0"
                            : currentBatch?.length.toLocaleString()
                        }
                      />{" "}
                      minipools (skimming)
                    </>
                  )
                }
              />
            </Stack>
          }
        />
        <IconRow
          Icon={Merge}
          iconProps={{
            sx: {
              transform: "rotate(180deg)",
            },
          }}
        />
        <TransactionRow
          // elevation={0}
          rhs={
            <Stack direction="column" spacing={3} sx={{ pl: 2, pr: 2 }}>
              <ReceiptsInfo
                amountEth={overall.eth}
                amountRpl={overall.rpl}
                amountGas={overall.gas}
              />
              <DistributeEfficiencyAlert
                gasAmount={overall.gas}
                nodeTotal={overall.eth}
                hideMessage
              />
            </Stack>
          }
        />
      </Stack>
    </CardContent>
  );
}

function TransactionRow({ lhs, rhs, elevation = 2 }) {
  return (
    <Paper sx={{ pb: 1, pt: 1 }} elevation={elevation} square>
      {/*<Typography variant="overline">Title</Typography>*/}
      <Grid container columnSpacing={4} rowSpacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          {lhs}
        </Grid>
        <Grid item xs={12} sm={6}>
          {rhs}
        </Grid>
      </Grid>
    </Paper>
  );
}

function TransactionDescription({ title }) {
  return (
    <Paper sx={{ textAlign: "center", fontSize: 11, p: 1 }} square>
      {title}
    </Paper>
  );
}

function IconRow({ Icon, iconProps }) {
  return (
    <Grid container sx={{ p: 0, m: 0 }} alignItems="center">
      <Grid item xs={12} sm={6} />
      <Grid item xs={12} sm={6} sx={{ pt: 0.5, m: 0, textAlign: "center" }}>
        <Icon fontSize="medium" color="disabled" {...iconProps} />
      </Grid>
    </Grid>
  );
}

export default function SafeSweepCard({ sx, nodeAddress }) {
  let { address, connector } = useAccount();
  let [isCustomizing, setCustomizing] = useState(false);
  let sweeper = useSweeper({ nodeAddress });
  let {
    execute,
    isClaimingInterval,
    isDistributingTipsMev,
    isDistributingConsensus,
    totalRpl,
    totalEth,
    rewardIndexes,
    stakeAmountRpl,
    setStakeAmountRpl,
    currentBatch,
    currentBatchAmount,
    executionNodeTotal,
    overall,
  } = sweeper;
  let withdrawalAddress = useNodeWithdrawalAddress(nodeAddress);
  const isSafeConnected = connector?.id === "safe";
  const isNodeOrWithdrawalAddress =
    address === nodeAddress || address === withdrawalAddress;
  let canWithdraw = isSafeConnected && isNodeOrWithdrawalAddress;
  let color = canWithdraw ? "primary" : "gray";
  return (
    <Stack sx={sx} direction="column" spacing={2}>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ maxWidth: 700 }}
        justifyContent="flex-start"
      >
        <Button
          size="large"
          sx={{ pl: 0, pr: 1.5, minWidth: 54 }}
          color="gray"
          onClick={() => setCustomizing(!isCustomizing)}
        >
          {isCustomizing ? (
            <ExpandLess fontSize="inherit" />
          ) : (
            <ExpandMore fontSize="inherit" />
          )}
          <Tune fontSize="medium" />
        </Button>
        <Tooltip
          arrow
          // placement="bottom-start"
          title={
            <ClaimButtonTooltip
              gasAmount={overall.gas}
              ethTotal={overall.eth}
              rplTotal={isClaimingInterval ? totalRpl : ethers.constants.Zero}
              stakeAmountRpl={isClaimingInterval ? stakeAmountRpl : ethers.constants.Zero}
            >
              <Stack>
                <Grid container columnSpacing={1} rowSpacing={0.5}>
                  {!isClaimingInterval ? null : (
                    <>
                      <Grid item xs={4.5}>
                        <Stack direction="row" justifyContent="flex-end">
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.primary"
                            >
                              {rewardIndexes?.length}
                            </Typography>{" "}
                            interval{rewardIndexes?.length === 1 ? "" : "s"}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={7.5}>
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-start"
                        >
                          <CurrencyValue
                            size="xsmall"
                            value={totalEth}
                            currency="eth"
                            placeholder="0"
                          />
                          <CurrencyValue
                            size="xsmall"
                            value={totalRpl}
                            currency="rpl"
                            placeholder="0"
                          />
                        </Stack>
                      </Grid>
                    </>
                  )}
                  {!isDistributingTipsMev ? null : (
                    <>
                      <Grid item xs={4.5}>
                        <Stack direction="row" justifyContent="flex-end">
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            tips/MEV
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={7.5}>
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-start"
                        >
                          <CurrencyValue
                            size="xsmall"
                            value={executionNodeTotal}
                            currency="eth"
                            placeholder="0"
                          />
                        </Stack>
                      </Grid>
                    </>
                  )}
                  {!isDistributingConsensus ? null : (
                    <>
                      <Grid item xs={4.5}>
                        <Stack direction="row" justifyContent="flex-end">
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.primary"
                            >
                              {currentBatch?.length}
                            </Typography>{" "}
                            minipool{currentBatch?.length === 1 ? "" : "s"}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={7.5}>
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-start"
                        >
                          <CurrencyValue
                            size="xsmall"
                            value={currentBatchAmount}
                            currency="eth"
                            placeholder="0"
                          />
                        </Stack>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Stack>
            </ClaimButtonTooltip>
          }
        >
          <Stack
            sx={{
              cursor: canWithdraw ? undefined : "not-allowed",
            }}
            direction="row"
            alignItems="center"
          >
            <Button
              onClick={() =>
                execute()
                  .then((res) => console.log("res", res))
                  .catch((err) => console.log("err", err))
              }
              sx={(theme) => ({
                // maxWidth: 200,
                mr: 1.5,
                boxShadow: `0 0 5px ${theme.palette[color].light}`,
              })}
              size="medium"
              variant="outlined"
              color={color}
              disabled={!canWithdraw}
              endIcon={
                <CurrencyValue
                  value={overall.eth}
                  size="xsmall"
                  currency="eth"
                  placeholder="0"
                />
              }
            >
              Sweep
            </Button>
            {!isClaimingInterval || totalRpl.isZero() ? null : (
              <ClaimSlider
                // sx={{ width: 150 }}
                stakeAmountRpl={stakeAmountRpl}
                totalRpl={totalRpl}
                onSetStakeAmountRpl={setStakeAmountRpl}
                sliderProps={{
                  size: "small",
                  color: canWithdraw ? "rpl" : "gray",
                  sx: {
                    width: 124,
                    pb: 0,
                  },
                }}
              />
            )}
          </Stack>
        </Tooltip>
      </Stack>
      <SafeAlert sx={{ maxWidth: 700 }} nodeAddress={nodeAddress} />
      <UnupgradedAlert sx={{ maxWidth: 700 }} nodeAddress={nodeAddress} />
      {!isCustomizing ? null : (
        <Card raised>
          <SweepCardContent nodeAddress={nodeAddress} sweeper={sweeper} />
        </Card>
      )}
    </Stack>
  );
}
