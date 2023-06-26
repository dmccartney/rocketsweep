import { ethers } from "ethers";
import { FormHelperText, Slider, Stack, Typography } from "@mui/material";
import CurrencyValue from "./CurrencyValue";

export default function ClaimSlider({
  sx,
  stakeAmountRpl,
  totalRpl,
  onSetStakeAmountRpl,
  sliderProps = {},
  caption = "and stake",
}) {
  let stakeAmountRplF = Number(ethers.utils.formatUnits(stakeAmountRpl));
  let maxStakeAmountRplF = Number(ethers.utils.formatUnits(totalRpl));
  return (
    <Stack sx={sx} direction="column" justifyContent="space-between">
      <Slider
        value={stakeAmountRplF}
        color="rpl"
        valueLabelDisplay="off"
        onChange={(e) =>
          onSetStakeAmountRpl(
            e.target.value >= maxStakeAmountRplF
              ? totalRpl
              : ethers.utils.parseUnits(String(e.target.value))
          )
        }
        slotProps={{
          root: {
            style: {
              padding: "8px 0px",
            },
          },
        }}
        min={0}
        max={maxStakeAmountRplF}
        {...sliderProps}
      />
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <FormHelperText sx={{ m: 0 }}>{caption}</FormHelperText>
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
  );
}
