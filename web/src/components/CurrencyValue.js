import { Stack, Typography } from "@mui/material";
import { trimValue } from "../utils";
import { ethers } from "ethers";

const typeVariantBySize = {
  xsmall: {
    value: "caption",
    currency: "caption",
    spacing: 0.65,
  },
  small: {
    value: "body1",
    currency: "caption",
    spacing: 0.65,
  },
  medium: {
    value: "h6",
    currency: "subtitle2",
    spacing: 0.8,
  },
  large: {
    value: "h4",
    currency: "subtitle1",
    spacing: 1,
  },
};
export default function CurrencyValue({
  value = ethers.constants.Zero,
  currency = "eth",
  size = (v) => (v.gte(ethers.utils.parseUnits("1000")) ? "small" : "medium"),
  placeholder = "-.---",
  decimalPlaces = 3,
  ...props
}) {
  let computedSize = size;
  if (typeof size === "function") {
    computedSize = size(value || ethers.constants.Zero);
  }
  let typeVariants =
    typeVariantBySize[computedSize] || typeVariantBySize["medium"];
  let valueText = placeholder;
  if (value && !value.isZero()) {
    valueText = trimValue(
      ethers.utils.formatUnits(value.abs() || ethers.constants.Zero)
    );
  }
  if (value && value.isNegative()) {
    valueText = `(${valueText})`;
  }
  return (
    <Stack
      direction="row"
      alignItems="baseline"
      spacing={typeVariants.spacing}
      {...props}
    >
      <Typography
        variant={typeVariants.value}
        color={(theme) => theme.palette.text.primary}
      >
        {valueText}
      </Typography>
      <Typography
        component={"span"}
        variant={typeVariants.currency}
        color={(theme) =>
          theme.palette[currency] ? theme.palette[currency].main : "default"
        }
      >
        {" "}
        {currency.toUpperCase()}
      </Typography>
    </Stack>
  );
}
