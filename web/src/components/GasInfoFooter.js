import { Grid, Stack, Tooltip, Typography } from "@mui/material";
import { trimValue } from "../utils";
import { ethers } from "ethers";
import useGasPrice from "../hooks/useGasPrice";
import CurrencyValue from "./CurrencyValue";

export function GasInfo({
  sx,
  size = "small",
  gasAmount = ethers.constants.Zero,
}) {
  const gasPrice = useGasPrice();
  const estGas = gasPrice.mul(gasAmount);
  return (
    <Tooltip
      title={`~${gasAmount.toNumber().toLocaleString()} gas`}
      sx={{ cursor: "help", ...sx }}
    >
      <Stack direction="column">
        <CurrencyValue value={estGas.mul(-1)} currency="eth" size={size} />
        <Typography variant="caption" color="text.disabled">
          gas @
          <Typography
            sx={{ pl: 1, pr: 0.5 }}
            variant="inherit"
            component="span"
            color="white"
          >
            {trimValue(ethers.utils.formatUnits(gasPrice, "gwei"), {
              maxDecimals: 0,
            })}
          </Typography>
          gwei
        </Typography>
      </Stack>
    </Tooltip>
  );
}

export default function GasInfoFooter({ sx, gasAmount }) {
  return (
    <Grid container sx={sx}>
      <Grid item xs={6}>
        <GasInfo gasAmount={gasAmount} />
      </Grid>
      <Grid item xs={6}>
        {/* TODO: show typical gas price range, maybe use fast-gas-gwei.data.eth */}
      </Grid>
    </Grid>
  );
}
