import { ethers } from "ethers";
import {
  FormHelperText,
  InputAdornment,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CurrencyValue from "./CurrencyValue";
import { useEffect, useRef, useState } from "react";

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
  let [isTextEditing, setIsTextEditing] = useState(false);
  let textInputRef = useRef();
  let [textInput, setTextInput] = useState(String(stakeAmountRplF));
  useEffect(() => {
    setTextInput(String(stakeAmountRplF));
  }, [stakeAmountRplF]);
  return (
    <Stack sx={sx} direction="column" justifyContent="space-between">
      <Slider
        value={stakeAmountRplF}
        color="rpl"
        valueLabelDisplay="off"
        onChange={(e) => {
          setIsTextEditing(false);
          onSetStakeAmountRpl(
            e.target.value >= maxStakeAmountRplF
              ? totalRpl
              : ethers.utils.parseUnits(String(e.target.value))
          );
        }}
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
      <Stack
        direction="row"
        alignItems="baseline"
        spacing={isTextEditing ? 0.5 : 1}
      >
        <FormHelperText sx={{ m: 0 }}>{caption}</FormHelperText>
        {!isTextEditing ? (
          <Typography
            variant="default"
            onClick={() => {
              setIsTextEditing(true);
              setTimeout(() => textInputRef.current?.select(), 50);
            }}
          >
            <CurrencyValue
              placeholder="0"
              value={stakeAmountRpl}
              size="xsmall"
              currency="rpl"
            />
          </Typography>
        ) : (
          <TextField
            inputRef={textInputRef}
            color={"rpl"}
            InputProps={{
              sx: {
                height: "1.125rem",
                fontSize: "0.75rem",
                p: 0,
                pr: 1,
              },
              inputProps: {
                size: 7,
                style: {
                  padding: "0 0 0 4px",
                  borderRight: "1px solid #606060",
                },
              },
              endAdornment: (
                <InputAdornment position="end">
                  <Typography
                    color={(theme) => theme.palette.rpl.main}
                    variant={"caption"}
                  >
                    RPL
                  </Typography>
                </InputAdornment>
              ),
            }}
            size="small"
            placeholder="0.0"
            onChange={(e) => {
              let text = e.target.value;
              try {
                let n = ethers.utils.parseUnits(String(text));
                if (n.gte(totalRpl)) {
                  n = totalRpl;
                  text = String(maxStakeAmountRplF);
                }
                setTextInput(text);
                onSetStakeAmountRpl(n);
              } catch (ignore) {
                // failure to parse may be fine (e.g. still typing a decimal point)
                setTextInput(text);
              }
            }}
            value={textInput}
          />
        )}
      </Stack>
    </Stack>
  );
}
