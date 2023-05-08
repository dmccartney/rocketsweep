import {
  Alert,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Link,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  HelpOutline,
  OpenInNew,
} from "@mui/icons-material";
import _ from "lodash";
import { useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import {
  BNSortComparator,
  bnSum,
  distributeBalanceEncoded,
  delegateUpgradeEncoded,
  estimateDistributeBatchGas,
  MinipoolStatus,
  rocketscanUrl,
  safeAppUrl,
  shortenAddress,
  trimValue,
} from "../utils";
import useK from "../hooks/useK";
import useCouldBeSafeContract from "../hooks/useCouldBeSafeContract";
import useMinipoolDetails from "../hooks/useMinipoolDetails";
import SafeIcon from "./SafeIcon";
import DistributeAmountGasShare from "./DistributeAmountGasShare";
import DistributeAmountTotal from "./DistributeAmountTotal";
import DistributeEfficiencyAlert from "./DistributeEfficiencyAlert";

function ConfigurationCard({
  sx,
  batchSize,
  onBatchSize,
  ethThreshold,
  onEthThreshold,
}) {
  return (
    <Grid container sx={sx} columnSpacing={2} rowSpacing={6}>
      <Grid item xs={5} sx={{ textAlign: "right" }}>
        <Typography variant={"h6"} color={"text.primary"}>
          Threshold
        </Typography>
        <Typography variant={"caption"} color={"text.secondary"}>
          Minimum minipool ETH balance to distribute
        </Typography>
      </Grid>
      <Grid item xs={7}>
        <Slider
          valueLabelDisplay="on"
          value={Number(ethThreshold)}
          onChange={(e) => onEthThreshold(String(e.target.value))}
          min={0}
          step={0.01}
          max={1.5}
        />
      </Grid>
      <Grid item xs={5} sx={{ textAlign: "right" }}>
        <Typography variant={"h6"} color={"text.primary"}>
          Batch Size
        </Typography>
        <Typography variant={"caption"} color={"text.secondary"}>
          Maximum minipools to distribute in a batch
        </Typography>
      </Grid>
      <Grid item xs={7}>
        <Slider
          valueLabelDisplay="on"
          value={batchSize}
          onChange={(e) => onBatchSize(e.target.value)}
          min={1}
          step={1}
          max={200}
        />
      </Grid>
    </Grid>
  );
}

function BatchCard({ batch, upNext, readOnly }) {
  let [isShowing, setShowing] = useState(false);
  let total = bnSum(batch.map(({ balance }) => balance));
  let nodeTotal = bnSum(batch.map(({ nodeBalance }) => nodeBalance));
  let gasAmount = estimateDistributeBatchGas(batch.length);
  const submitBatch = async (batch) => {
    let sdk = new SafeAppsSDK();
    let txs = batch.map(({ minipoolAddress }) => ({
      operation: "0x00",
      to: minipoolAddress,
      value: "0",
      data: distributeBalanceEncoded,
    }));
    return sdk.txs.send({
      txs,
    });
  };
  return (
    <Badge
      sx={{ width: "100%" }}
      badgeContent={batch.length}
      color="primary"
      max={999}
    >
      <Card sx={{ width: "100%" }} variant="outlined">
        <CardContent>
          <DistributeAmountTotal total={total} />
          <DistributeEfficiencyAlert
            gasAmount={gasAmount}
            nodeTotal={nodeTotal}
            hideMessage={!upNext}
          />
          <DistributeAmountGasShare
            gasAmount={gasAmount}
            nodeTotal={nodeTotal}
          />
          {!readOnly && upNext && (
            <Button
              onClick={() =>
                submitBatch(batch)
                  .then((res) => console.log("res", res))
                  .catch((err) => console.log("err", err))
              }
              variant="contained"
              sx={{ mt: 1, mb: 1 }}
              fullWidth
            >
              {"Preview"}
            </Button>
          )}
          <Button
            sx={{ mt: 1 }}
            fullWidth
            color={"inherit"}
            onClick={() => setShowing(!isShowing)}
            endIcon={isShowing ? <ExpandLess /> : <ExpandMore />}
          >
            {batch.length} minipools
          </Button>
          {isShowing && (
            <Grid sx={{ mt: 2 }} container columnSpacing={1}>
              {batch.map(({ minipoolAddress, balance }) => (
                <>
                  <Grid key={`mp-${minipoolAddress}-rscan`} item xs={6}>
                    <Chip
                      size="small"
                      variant="outlined"
                      color="primary"
                      clickable
                      component="a"
                      target="_blank"
                      href={rocketscanUrl({ minipool: minipoolAddress })}
                      label={shortenAddress(minipoolAddress)}
                    />
                  </Grid>
                  <Grid key={`mp-${minipoolAddress}-balance`} item xs={6}>
                    {trimValue(
                      ethers.utils.formatUnits(
                        ethers.BigNumber.from(balance || "0")
                      )
                    )}
                  </Grid>
                </>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Badge>
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

function SafeAlert({ sx, label, safeAddress }) {
  let { connector } = useAccount();
  if (connector?.id === "safe") {
    // No alert when it is already open as a Safe app.
    return null;
  }
  return (
    <Alert
      sx={sx}
      color={"success"}
      icon={<SafeIcon fontSize="medium" />}
      severity={"info"}
      variant={"outlined"}
      action={
        <>
          <Button
            size="small"
            variant="contained"
            color="inherit"
            target="_blank"
            sx={{ whiteSpace: "nowrap" }}
            endIcon={<OpenInNew />}
            href={safeAppUrl({ safeAddress })}
          >
            Open
          </Button>
        </>
      }
    >
      Safe Configured: {label}
    </Alert>
  );
}

function SweepCardContent({ sx, nodeAddress }) {
  let { address, connector } = useAccount();
  let { data: withdrawalAddress } =
    useK.RocketStorage.Read.getNodeWithdrawalAddress({
      args: [nodeAddress],
      enabled: !!nodeAddress,
    });
  let hasSafeWithdrawalAddress = useCouldBeSafeContract(withdrawalAddress);
  let hasSafeNodeAddress = useCouldBeSafeContract(nodeAddress);
  let minipools = useSortedMinipoolDetails(nodeAddress);
  let [isShowingMore, setShowingMore] = useState(false);
  let [batchSize, setBatchSize] = useState(100);
  let [ethThreshold, setEthThreshold] = useState("0.2");
  let batches = _.chain(minipools)
    .filter(({ status }) => status === MinipoolStatus.staking)
    .filter(({ upgraded }) => upgraded)
    .filter(({ balance }) => balance.gte(ethers.utils.parseEther(ethThreshold)))
    .chunk(batchSize)
    .value();
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
  const isSafeConnected = connector?.id === "safe";
  const isNodeOrWithdrawalAddress =
    address === nodeAddress || address === withdrawalAddress;
  const canProposeBatches = isSafeConnected && isNodeOrWithdrawalAddress;
  let currentBatch = _.first(batches);
  let moreBatches = _.tail(batches);
  return (
    <CardContent sx={sx}>
      {!hasSafeWithdrawalAddress && !hasSafeNodeAddress && (
        <Alert sx={{ mb: 2, maxWidth: 450 }} severity="warning">
          Executing a batch sweep requires the node or its withdrawal address to
          be a{" "}
          <Link href="https://safe.global/" target="_blank">
            Safe
          </Link>
        </Alert>
      )}
      {hasSafeNodeAddress && (
        <SafeAlert
          sx={{ mb: 2, maxWidth: 450 }}
          label="Node"
          safeAddress={nodeAddress}
        />
      )}
      {hasSafeWithdrawalAddress && (
        <SafeAlert
          sx={{ mb: 2, maxWidth: 450 }}
          label="Withdrawal"
          safeAddress={withdrawalAddress}
        />
      )}
      {unupgradedMps.length > 0 && (
        <Alert
          sx={{ mb: 2, maxWidth: 450 }}
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
      )}
      <Grid container columnSpacing={4} rowSpacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <ConfigurationCard
            sx={{ pr: 2, pt: 4 }}
            batchSize={batchSize}
            ethThreshold={ethThreshold}
            onBatchSize={setBatchSize}
            onEthThreshold={setEthThreshold}
            minipoolCount={minipools.length}
          />
        </Grid>
        <Grid item xs={12} sm={6} sx={{ pr: 0.5 }}>
          <Tooltip
            title={`The next batch to distribute based on your configured Threshold and Batch Size.`}
            sx={{ cursor: "help" }}
          >
            <Typography variant={"overline"} color={"text.secondary"}>
              Current Batch <HelpOutline fontSize="inherit" />
            </Typography>
          </Tooltip>
          {currentBatch && (
            <BatchCard
              key={"first-batch"}
              batch={currentBatch}
              upNext
              readOnly={!canProposeBatches}
              nodeAddress={nodeAddress}
            />
          )}
          {currentBatch && moreBatches.length > 0 && (
            <Button
              sx={{ mt: 1 }}
              fullWidth
              color={"inherit"}
              onClick={() => setShowingMore(!isShowingMore)}
              endIcon={isShowingMore ? <ExpandLess /> : <ExpandMore />}
            >
              and {moreBatches.length} more{" "}
              {moreBatches.length > 0 ? "batches" : "batch"}
            </Button>
          )}
          {!currentBatch &&
            (minipools.length > 0 ? (
              minipools.length === unupgradedMps.length ? (
                <Alert severity="info">
                  <AlertTitle>Upgrade required</AlertTitle>
                  You cannot distribute minipools that have not been upgraded.
                </Alert>
              ) : (
                <Alert severity="info">
                  <AlertTitle>Below Threshold</AlertTitle>
                  You should wait for more to accumulate in your minipools. Or
                  you can lower the threshold to distribute smaller balances.
                </Alert>
              )
            ) : (
              <Alert severity="info">No minipools found.</Alert>
            ))}
        </Grid>
      </Grid>
      {moreBatches.length > 0 && isShowingMore && (
        <>
          <Typography
            sx={{ mt: 3 }}
            variant={"overline"}
            color={"text.secondary"}
          >
            Up Next - {moreBatches.length} more batches
          </Typography>
          <Grid container spacing={2}>
            {moreBatches.map((batch, i) => (
              <Grid key={`batch-${i}`} item xs={12} sm={4} sx={{ pr: 0.5 }}>
                <BatchCard
                  batch={batch}
                  upNext={false}
                  readOnly={!canProposeBatches}
                  ethThreshold={ethThreshold}
                  nodeAddress={nodeAddress}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </CardContent>
  );
}

export default function SafeSweepCard({ sx, nodeAddress }) {
  let { connector } = useAccount();
  let [isShowing, setShowing] = useState(connector?.id === "safe");
  let { data: withdrawalAddress } =
    useK.RocketStorage.Read.getNodeWithdrawalAddress({
      args: [nodeAddress],
      enabled: !!nodeAddress,
    });
  let hasSafeWithdrawalAddress = useCouldBeSafeContract(withdrawalAddress);
  let hasSafeNodeAddress = useCouldBeSafeContract(nodeAddress);
  let hasSafe = hasSafeWithdrawalAddress || hasSafeNodeAddress;
  return (
    <Card sx={sx}>
      <CardActionArea onClick={() => setShowing(!isShowing)}>
        <CardHeader
          title={
            <>
              Batch Sweep
              {!!nodeAddress && (
                <Chip
                  variant="outlined"
                  clickable={false}
                  sx={{ ml: 1, cursor: "inherit" }}
                  color={hasSafe ? "success" : "warning"}
                  size="small"
                  label={
                    <Stack direction="row" alignItems="center">
                      {!hasSafe && (
                        <Typography sx={{ mr: 1 }} variant="inherit">
                          No
                        </Typography>
                      )}
                      <SafeIcon fontSize="inherit" />
                      <Typography variant="inherit">Safe</Typography>
                      <Typography sx={{ ml: 1 }} variant="inherit">
                        configured
                      </Typography>
                    </Stack>
                  }
                />
              )}
            </>
          }
          subheader="Distribute from multiple minipools in a single transaction."
          subheaderTypographyProps={{ mt: 1 }}
          action={
            isShowing ? (
              <ExpandLess sx={{ m: 1 }} />
            ) : (
              <ExpandMore sx={{ m: 1 }} />
            )
          }
        />
      </CardActionArea>
      {isShowing && <SweepCardContent nodeAddress={nodeAddress} />}
    </Card>
  );
}
