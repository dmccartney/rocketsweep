import {
  useContract,
  useContractWrite,
  useEnsAddress,
  usePrepareContractWrite,
  useWebSocketProvider,
} from "wagmi";
import Layout from "../components/Layout";
import { useParams } from "react-router-dom";
import {
  Button,
  CircularProgress,
  FormHelperText,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import NodeRewardsSummaryCard from "../components/NodeRewardsSummaryCard";
import SafeSweepCard from "../components/SafeSweepCard";
import NodePeriodicRewardsTable from "../components/NodePeriodicRewardsTable";
import NodeContinuousRewardsTable from "../components/NodeContinuousRewardsTable";
import { AllInclusive, EventRepeat, Help } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import useCanConnectedAccountWithdraw from "../hooks/useCanConnectedAccountWithdraw";
import CurrencyValue from "../components/CurrencyValue";
import useNodeContinuousRewards from "../hooks/useNodeContinuousRewards";
import useGasPrice from "../hooks/useGasPrice";
import GasInfoFooter from "../components/GasInfoFooter";
import DistributeEfficiencyAlert from "../components/DistributeEfficiencyAlert";
import useNodeFeeDistributorInfo from "../hooks/useNodeFeeDistributorInfo";
import contracts from "../contracts";
import RewardsHelpInfo from "../components/RewardsHelpInfo";

function PeriodicRewardsHeader({ sx }) {
  return (
    <Stack direction="row" alignItems="center">
      <EventRepeat sx={{ m: 1, mr: 2 }} fontSize="medium" color="disabled" />
      <Typography color="text.primary" variant="subtitle2">
        Periodic Rewards
      </Typography>
      <Tooltip title={<RewardsHelpInfo />}>
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
  );
}

function ClaimTipsMEVTooltip({ gasAmount, ethTotal }) {
  const gasPrice = useGasPrice();
  const estGas = gasPrice.mul(gasAmount);
  return (
    <Stack direction="column" spacing={1} sx={{ m: 1 }}>
      <Stack direction="column" spacing={0} sx={{ m: 0, mb: 1 }}>
        <Stack
          direction="row"
          alignItems="baseline"
          justifyContent="space-between"
        >
          <CurrencyValue
            value={ethTotal.sub(estGas)}
            currency="eth"
            placeholder="0"
          />
        </Stack>
        <FormHelperText sx={{ m: 0 }}>
          approximate receipts (after gas)
        </FormHelperText>
      </Stack>
      <DistributeEfficiencyAlert gasAmount={gasAmount} nodeTotal={ethTotal} />
      <GasInfoFooter gasAmount={gasAmount} />
    </Stack>
  );
}

function ClaimTipsMEVButton({ nodeAddress }) {
  let { executionNodeTotal } = useNodeContinuousRewards({ nodeAddress });
  let feeDistributor = useNodeFeeDistributorInfo({ nodeAddress });
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  let disabled = !canWithdraw || !feeDistributor?.feeDistributorAddress;
  const prep = usePrepareContractWrite({
    address: feeDistributor?.feeDistributorAddress,
    abi: contracts.RocketNodeDistributorInterface.abi,
    functionName: "distribute",
    args: [],
    enabled: !disabled,
  });
  let [estimateGasAmount, setEstimateGasAmount] = useState(
    ethers.BigNumber.from(104000)
  );
  let provider = useWebSocketProvider();
  let dist = useContract({
    address: feeDistributor?.feeDistributorAddress,
    abi: contracts.RocketNodeDistributorInterface.abi,
    signerOrProvider: provider,
  });
  useEffect(() => {
    if (!dist) {
      return;
    }
    let cancelled = false;
    dist.estimateGas
      .distribute()
      .then((estimate) => !cancelled && setEstimateGasAmount(estimate))
      // .catch((err) => !cancelled && console.log("error estimating gas", err));
      .catch((ignore) => {});
    return () => (cancelled = true);
  }, [dist]);
  let distribute = useContractWrite({
    ...prep.config,
  });
  const gasAmount = prep.data?.request?.gasLimit || estimateGasAmount;
  return (
    <Tooltip
      arrow
      title={
        <ClaimTipsMEVTooltip
          gasAmount={gasAmount}
          ethTotal={executionNodeTotal}
        />
      }
    >
      <Stack
        direction="row"
        alignItems="center"
        sx={{ cursor: !disabled ? "inherit" : "not-allowed" }}
      >
        <Button
          onClick={() => distribute.writeAsync()}
          disabled={disabled}
          sx={(theme) => ({
            mr: 1,
            "&.Mui-disabled": {
              borderColor: theme.palette.gray.main,
              color: theme.palette.gray.main,
            },
          })}
          variant="outlined"
          size="small"
        >
          Distribute
        </Button>
        <Stack spacing={0} direction="column">
          <CurrencyValue
            size="xsmall"
            value={executionNodeTotal}
            currency="eth"
          />
          <FormHelperText sx={{ m: 0 }}>Tips/MEV</FormHelperText>
        </Stack>
      </Stack>
    </Tooltip>
  );
}

function ContinuousRewardsHeader({ sx, nodeAddress }) {
  return (
    <Grid sx={sx} rowSpacing={2} container alignItems="center">
      <Grid item xs={12} md={4}>
        <Stack direction="row" alignItems="center">
          <AllInclusive
            sx={{ m: 1, mr: 2 }}
            fontSize="medium"
            color="disabled"
          />
          <Typography variant="subtitle2">Continuous Rewards</Typography>
        </Stack>
      </Grid>
      <Grid item sx={{ pl: 6 }} xs={12} md={8}>
        <Stack direction="row" alignItems="center">
          <ClaimTipsMEVButton nodeAddress={nodeAddress} />
        </Stack>
      </Grid>
    </Grid>
  );
}

export default function NodePage() {
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
            <NodeRewardsSummaryCard nodeAddress={nodeAddress} />
          </Grid>
          <Grid key={"sweep-table-cards"} item xs={12} lg={8}>
            <SafeSweepCard sx={{ mb: 4 }} nodeAddress={nodeAddress} />
            <NodePeriodicRewardsTable
              sx={{ mb: 5, border: 0 }}
              nodeAddress={nodeAddress}
              header={<PeriodicRewardsHeader nodeAddress={nodeAddress} />}
            />
            <NodeContinuousRewardsTable
              sx={{ border: 0 }}
              nodeAddress={nodeAddress}
              header={<ContinuousRewardsHeader nodeAddress={nodeAddress} />}
            />
          </Grid>
        </Grid>
      )}
    </Layout>
  );
}
