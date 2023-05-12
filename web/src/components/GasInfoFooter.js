import {
  FormHelperText,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { trimValue } from "../utils";
import { ethers } from "ethers";
import useGasPrice from "../hooks/useGasPrice";
import CurrencyValue from "./CurrencyValue";

export default function GasInfoFooter({ sx, gasAmount }) {
  const gasPrice = useGasPrice();
  const estGas = gasPrice.mul(gasAmount);
  return (
    <Grid container sx={sx}>
      <Grid item xs={6}>
        <Tooltip
          title={`~${gasAmount.toNumber().toLocaleString()} gas`}
          sx={{ cursor: "help" }}
        >
          <Stack direction="column">
            <CurrencyValue value={estGas.mul(-1)} currency="eth" size="small" />
            <FormHelperText sx={{ m: 0 }}>
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
            </FormHelperText>
          </Stack>
        </Tooltip>
      </Grid>
      <Grid item xs={6}>
        {/* TODO: show typical gas price range, maybe use fast-gas-gwei.data.eth */}
      </Grid>
    </Grid>
  );
}
