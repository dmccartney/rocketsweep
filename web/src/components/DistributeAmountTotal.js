import { Typography } from "@mui/material";
import { trimValue } from "../utils";
import { ethers } from "ethers";

export default function DistributeAmountTotal({ total }) {
  return (
    <Typography variant={"h5"}>
      {total.eq(0) ? "-.----" : trimValue(ethers.utils.formatUnits(total))}
      <Typography
        sx={{ opacity: 0.6, pl: 0.5 }}
        variant={"h6"}
        component={"span"}
        color={"secondary"}
      >
        ETH
      </Typography>
    </Typography>
  );
}
