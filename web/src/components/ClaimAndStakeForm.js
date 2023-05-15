import { bnSum } from "../utils";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  Button,
  FormHelperText,
  Slider,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import CurrencyValue from "./CurrencyValue";
import useK from "../hooks/useK";
import _ from "lodash";
import useGasPrice from "../hooks/useGasPrice";
import GasInfoFooter from "./GasInfoFooter";
import useCanConnectedAccountWithdraw from "../hooks/useCanConnectedAccountWithdraw";

function ClaimButtonTooltip({ gasAmount, ethTotal, rplTotal, stakeAmountRpl }) {
  const gasPrice = useGasPrice();
  const estGas = gasPrice.mul(gasAmount);
  return (
    <Stack direction="column" spacing={3} sx={{ m: 1 }}>
      <Stack direction="column" spacing={0} sx={{ m: 0 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="baseline"
          justifyContent="space-between"
        >
          {!!ethTotal?.gt(0) && (
            <CurrencyValue
              value={ethTotal.sub(estGas)}
              currency="eth"
              placeholder="0"
            />
          )}
          <CurrencyValue
            value={rplTotal.sub(stakeAmountRpl)}
            currency="rpl"
            placeholder="0"
          />
        </Stack>
        <FormHelperText sx={{ m: 0 }}>
          approximate receipts (after gas)
        </FormHelperText>
      </Stack>
      <GasInfoFooter gasAmount={gasAmount} />
    </Stack>
  );
}

function ClaimExecutorButton({
  label,
  claiming,
  ethTotal,
  rplTotal,
  stakeAmountRpl,
  gasAmount,
  ...props
}) {
  let theme = useTheme();
  return (
    <Button
      onClick={() => claiming.writeAsync()}
      disabled={claiming.isExecuting || !claiming.writeAsync}
      variant="outlined"
      color="primary"
      sx={{
        "&.Mui-disabled": {
          borderColor: theme.palette.gray.main,
          color: theme.palette.gray.main,
        },
        ...(props.sx || {}),
      }}
      {...props}
    >
      {label}
    </Button>
  );
}

function useDistributeGasEstimate({
  nodeAddress,
  args,
  hasProofs,
  stakeAmountRpl,
}) {
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  let [estimateGasAmount, setEstimateGasAmount] = useState(
    ethers.BigNumber.from(297000)
  );
  let distributor = useK.RocketMerkleDistributorMainnet.Raw();
  useEffect(() => {
    if (!distributor || canWithdraw || !hasProofs) {
      return;
    }
    let cancelled = false;
    distributor.estimateGas
      .claimAndStake(...args, { from: nodeAddress })
      .then((estimate) => !cancelled && setEstimateGasAmount(estimate))
      .catch((err) => !cancelled && console.log("error estimating gas", err));
    return () => (cancelled = true);
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [
    nodeAddress,
    canWithdraw,
    distributor,
    hasProofs,
    stakeAmountRpl.toString(),
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */
  return estimateGasAmount;
}

export default function ClaimAndStakeForm({
  sx,
  spacing = 1,
  nodeAddress,
  rewardIndexes,
  amountsEth,
  amountsRpl,
  merkleProofs,
  buttonProps = {},
  sliderProps = {},
  helperProps = {},
}) {
  let totalRpl = bnSum(amountsRpl);
  let [stakeAmountRpl, setStakeAmountRpl] = useState(totalRpl);
  // If we get an updated `totalRpl` later, we want to use it as the default.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setStakeAmountRpl(totalRpl), [totalRpl.toString()]);
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  let hasProofs = merkleProofs.length && _.every(merkleProofs);
  let args = [
    nodeAddress,
    rewardIndexes,
    amountsRpl,
    amountsEth,
    merkleProofs,
    stakeAmountRpl,
  ];
  let claiming = useK.RocketMerkleDistributorMainnet.Write.claimAndStake({
    args,
    // don't prepare until we have the proofs
    enabled: canWithdraw && hasProofs,
  });
  let estimateGasAmount = useDistributeGasEstimate({
    nodeAddress,
    args,
    hasProofs,
    stakeAmountRpl,
  });
  let gasAmount = claiming.prepareData?.request?.gasLimit || estimateGasAmount;
  let rplTotal = bnSum(amountsRpl);
  let ethTotal = bnSum(amountsEth);
  let stakeAmountRplF = Number(ethers.utils.formatUnits(stakeAmountRpl));
  let maxStakeAmountRplF = Number(ethers.utils.formatUnits(totalRpl));
  return (
    <Tooltip
      arrow
      position="bottom"
      title={
        <ClaimButtonTooltip
          gasAmount={gasAmount}
          ethTotal={ethTotal}
          rplTotal={rplTotal}
          stakeAmountRpl={stakeAmountRpl}
        />
      }
    >
      <Stack sx={sx} direction="row" spacing={spacing} alignItems="center">
        <ClaimExecutorButton
          label="Claim"
          claiming={claiming}
          ethTotal={ethTotal}
          rplTotal={rplTotal}
          stakeAmountRpl={stakeAmountRpl}
          gasAmount={gasAmount}
          {...buttonProps}
        />
        <Stack direction="column">
          <Slider
            value={stakeAmountRplF}
            color="rpl"
            valueLabelDisplay="off"
            onChange={(e) =>
              setStakeAmountRpl(
                e.target.value >= maxStakeAmountRplF
                  ? totalRpl
                  : ethers.utils.parseUnits(String(e.target.value))
              )
            }
            min={0}
            max={maxStakeAmountRplF}
            {...sliderProps}
          />
          <Stack
            direction="row"
            alignItems="baseline"
            spacing={1}
            {...helperProps}
          >
            <FormHelperText sx={{ m: 0 }}>and stake</FormHelperText>
            <Typography variant="default">
              <CurrencyValue
                placeholder="0"
                value={stakeAmountRpl}
                size="xsmall"
                currency="rpl"
              />
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Tooltip>
  );
}
