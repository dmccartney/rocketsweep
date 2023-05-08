import { Box, FormHelperText, Grid, Tooltip, Typography } from "@mui/material";
import { trimValue } from "../utils";
import { ethers } from "ethers";
import useGasPrice from "../hooks/useGasPrice";

export default function DistributeAmountGasShare({ gasAmount, nodeTotal }) {
  const gasPrice = useGasPrice();
  const estGas = gasPrice.mul(gasAmount);
  return (
    <Grid container>
      <Grid item xs={6}>
        <Typography sx={{ mb: 0, lineHeight: 1 }} variant={"subtitle2"}>
          {nodeTotal.eq(0)
            ? "-.----"
            : trimValue(ethers.utils.formatUnits(nodeTotal))}
          <Typography
            sx={{ mb: 0, lineHeight: 1, opacity: 0.6, pl: 0.5 }}
            variant={"subtitle2"}
            component={"span"}
            color={"secondary"}
          >
            ETH
          </Typography>
        </Typography>
        <FormHelperText sx={{ m: 0 }}>your share</FormHelperText>
      </Grid>
      <Grid item xs={6} sx={{ textAlign: "right" }}>
        <Tooltip
          title={`~${gasAmount.toNumber().toLocaleString()} gas`}
          sx={{ cursor: "help" }}
        >
          <Box>
            <Typography sx={{ mb: 0, lineHeight: 1 }} variant={"subtitle2"}>
              ({trimValue(ethers.utils.formatUnits(estGas))})
              <Typography
                sx={{ mb: 0, lineHeight: 1, opacity: 0.6, pl: 0.5 }}
                variant={"subtitle2"}
                component={"span"}
                color={"secondary"}
              >
                ETH
              </Typography>
            </Typography>
            <FormHelperText sx={{ m: 0, textAlign: "right" }}>
              gas @{" "}
              {trimValue(ethers.utils.formatUnits(gasPrice, "gwei"), {
                maxDecimals: 0,
              })}{" "}
              gwei
            </FormHelperText>
          </Box>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
