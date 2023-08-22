import { Typography } from "@mui/material";

export default function RewardsHelpInfo() {
  return (
    <Typography variant="caption" color="text.secondary">
      Your periodic rewards includes your{" "}
      <Typography variant="caption" color="rpl.main">
        RPL
      </Typography>{" "}
      share of inflation.
      <br />
      If you're in the smoothing pool then it also includes your smoothed{" "}
      <Typography variant="caption" color="eth.main">
        ETH
      </Typography>{" "}
      Execution rewards.
      <br />
      Note: if you're <em>not</em> in the smoothing pool, then any Execution
      rewards (Tips/MEV) will show up in the Continuous section below.
    </Typography>
  );
}
