import { bnSum } from "../utils";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  Button,
  FormHelperText,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import useK from "../hooks/useK";
import useCanConnectedAccountWithdraw from "../hooks/useCanConnectedAccountWithdraw";
import useGasPrice from "../hooks/useGasPrice";
import CurrencyValue from "./CurrencyValue";
import GasInfoFooter from "./GasInfoFooter";
import ClaimSlider from "./ClaimSlider";
import DistributeEfficiencyAlert from "./DistributeEfficiencyAlert";
import _ from "lodash";

export function ClaimButtonTooltip({
  sx,
  gasAmount,
  ethTotal,
  rplTotal,
  stakeAmountRpl,
  children,
}) {
  const gasPrice = useGasPrice();
  const estGas = gasPrice.mul(gasAmount);
  return (
    <Stack
      sx={{
        p: 1,
        width: 285,
        ...sx,
      }}
      direction="column"
      spacing={2}
    >
      <Stack direction="column" spacing={0} sx={{ m: 0 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="baseline"
          justifyContent="space-between"
        >
          <CurrencyValue
            value={ethTotal.sub(estGas)}
            currency="eth"
            placeholder="0"
          />
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
      {children}
      {gasAmount.isZero() ? null : (
        <DistributeEfficiencyAlert
          gasAmount={gasAmount}
          nodeTotal={ethTotal}
          hideMessage
        />
      )}
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
        <ClaimSlider
          stakeAmountRpl={stakeAmountRpl}
          totalRpl={totalRpl}
          onSetStakeAmountRpl={setStakeAmountRpl}
          sliderProps={sliderProps}
        />
      </Stack>
    </Tooltip>
  );
}
