import {
  Alert,
  AlertTitle,
  Box,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import useGasPrice from "../hooks/useGasPrice";
import CurrencyValue from "./CurrencyValue";

export default function DistributeEfficiencyAlert({
  icon,
  gasAmount,
  nodeTotal,
  severity = undefined,
  hideMessage,
}) {
  const gasPrice = useGasPrice();
  const estGas = gasPrice.mul(gasAmount);
  const estReceipt = nodeTotal.sub(estGas);
  const efficiencyPer =
    estReceipt.isNegative() || nodeTotal.isZero()
      ? 0
      : estReceipt.mul(10000).div(nodeTotal).toNumber() / 100;
  const efficiencySeverity = severity
    ? severity
    : efficiencyPer > 95
    ? "success"
    : efficiencyPer > 85
    ? "warning"
    : "error";
  const title = estGas.isZero()
    ? "--.--"
    : `${efficiencyPer.toFixed(2)}% Efficiency`;
  const message =
    efficiencySeverity === "success"
      ? ""
      : "Consider waiting for lower gas prices or a larger balance.";
  return (
    <Tooltip
      arrow
      title={
        <Stack
          direction="column"
          spacing={1}
          alignItems="center"
          sx={{ p: 1, width: 250 }}
        >
          <Typography color="text.secondary" variant="caption">
            Amount received after gas costs
          </Typography>
          <CurrencyValue size="small" value={estReceipt} currency="eth" />
          <Typography color="text.secondary" variant="caption">
            divided by the distribution total
          </Typography>
          <CurrencyValue size="small" value={nodeTotal} currency="eth" />
          <Typography sx={{ pt: 3 }} color="text.secondary" variant="caption">
            This is just a rough ETH metric to help decide when to execute.
          </Typography>
        </Stack>
      }
    >
      <Box>
        <Alert
          icon={icon}
          style={{ cursor: "help" }}
          sx={{ opacity: 0.9 }}
          severity={efficiencySeverity}
        >
          {hideMessage || !message ? (
            <>{title}</>
          ) : (
            <>
              <AlertTitle>{title}</AlertTitle>
              {message}
            </>
          )}
        </Alert>
      </Box>
    </Tooltip>
  );
}
