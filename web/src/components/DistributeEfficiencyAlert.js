import { Alert, AlertTitle } from "@mui/material";
import useGasPrice from "../hooks/useGasPrice";

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
    <Alert sx={{ mt: 2, mb: 2, opacity: 0.9 }} severity={efficiencySeverity}>
      <AlertTitle>{efficiencyPer.toFixed(2)}% Efficiency</AlertTitle>
      {!!hideMessage || efficiencySeverity === "success"
        ? ""
        : "Consider waiting for lower gas prices or a larger balance."}
    </Alert>
  );
}
