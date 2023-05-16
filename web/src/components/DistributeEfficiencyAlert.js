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
  gasAmount,
  nodeTotal,
  hideMessage,
}) {
  const gasPrice = useGasPrice();
  const estGas = gasPrice.mul(gasAmount);
  const estReceipt = nodeTotal.sub(estGas);
  const efficiencyPer = estReceipt.isNegative()
    ? 0
    : estReceipt
        .mul(10000)
        .div(nodeTotal.isZero() ? 1 : nodeTotal)
        .toNumber() / 100;
  const efficiencySeverity =
    efficiencyPer > 99 ? "success" : efficiencyPer > 95 ? "warning" : "error";
  return (
    <Tooltip
      arrow
      title={
        <Stack direction="column" alignItems="center" sx={{ p: 1, width: 250 }}>
          <Typography color="text.secondary" variant="caption">
            Amount received after gas costs
          </Typography>
          <CurrencyValue size="small" value={estReceipt} currency="eth" />
          <Typography color="text.secondary" variant="caption">
            divided by the distribution total
          </Typography>
          <CurrencyValue size="small" value={nodeTotal} currency="eth" />
        </Stack>
      }
    >
      <Box>
        <Alert
          style={{ cursor: "help" }}
          sx={{ opacity: 0.9 }}
          severity={efficiencySeverity}
        >
          <AlertTitle>{efficiencyPer.toFixed(2)}% Efficiency</AlertTitle>
          {!!hideMessage || efficiencySeverity === "success"
            ? ""
            : "Consider waiting for lower gas prices or a larger balance."}
        </Alert>
      </Box>
    </Tooltip>
  );
}
