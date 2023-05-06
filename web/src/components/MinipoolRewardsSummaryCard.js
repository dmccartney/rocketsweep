import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  FormHelperText,
  Typography,
} from "@mui/material";
import lightBlue from "@mui/material/colors/lightBlue";
import { bnSum, MinipoolStatus, rocketscanUrl, trimValue } from "../utils";
import { ethers } from "ethers";
import useMinipoolDetails from "../hooks/useMinipoolDetails";
import { ResponsiveContainer, Treemap } from "recharts";
import WalletChip from "./WalletChip";
import { useEnsName } from "wagmi";
import { Link } from "react-router-dom";
import { OpenInNew } from "@mui/icons-material";

function SummaryCardHeader({ nodeAddress }) {
  return (
    <CardHeader
      title={
        <WalletChip
          clickable={false}
          sx={{ cursor: "inherit" }}
          labelVariant={"body2"}
          // avatarSize={18}
          // size="small"
          walletAddress={nodeAddress}
        />
      }
    />
  );
}

function SummaryCardContent({ nodeAddress }) {
  let minipools = useMinipoolDetails(nodeAddress);
  minipools = minipools.filter(
    ({ status }) => status === MinipoolStatus.staking
  );
  const total = bnSum(minipools.map(({ balance }) => balance));
  const nodeTotal = bnSum(
    minipools
      .filter(({ upgraded }) => upgraded)
      .map(({ nodeBalance }) => nodeBalance)
  );
  const protocolTotal = bnSum(
    minipools
      .filter(({ upgraded }) => upgraded)
      .map(({ protocolBalance }) => protocolBalance)
  );
  return (
    <CardContent>
      <Typography
        variant={"overline"}
        color={"text.secondary"}
        component={"div"}
      >
        Undistributed
      </Typography>
      <Typography variant={"h3"} gutterBottom>
        {minipools.length === 0
          ? "-.----"
          : trimValue(ethers.utils.formatUnits(total))}
        <Typography
          sx={{ opacity: 0.6 }}
          variant={"h5"}
          component={"span"}
          color={"secondary"}
        >
          {" "}
          ETH
        </Typography>
      </Typography>
      <FormHelperText sx={{ mb: 2 }}>
        Across{" "}
        <Chip
          component="span"
          size="small"
          label={
            minipools.length === 0 ? "-" : minipools.length.toLocaleString()
          }
        />{" "}
        staking minipools
      </FormHelperText>
      {nodeTotal.isZero() && protocolTotal.isZero() ? null : (
        <ResponsiveContainer height={64} width="100%">
          <Treemap
            colorPanel={[lightBlue["200"], lightBlue["300"]]}
            data={[
              {
                name: `${trimValue(
                  ethers.utils.formatUnits(nodeTotal)
                )} to You`,
                value: Number(ethers.utils.formatUnits(nodeTotal)),
              },
              {
                name: `${trimValue(
                  ethers.utils.formatUnits(protocolTotal)
                )} to rETH`,
                value: Number(ethers.utils.formatUnits(protocolTotal)),
              },
            ]}
            isAnimationActive={false}
          />
        </ResponsiveContainer>
      )}
    </CardContent>
  );
}

export default function MinipoolRewardsSummaryCard({
  sx,
  nodeAddress,
  asLink = false,
}) {
  let { data: name } = useEnsName({ address: nodeAddress });
  let nodeAddressOrName = name || nodeAddress;
  if (asLink) {
    return (
      <Card sx={sx}>
        <CardActionArea component={Link} to={`/node/${nodeAddressOrName}`}>
          <SummaryCardHeader nodeAddress={nodeAddress} />
          <SummaryCardContent nodeAddress={nodeAddress} />
        </CardActionArea>
      </Card>
    );
  }
  return (
    <Card sx={sx}>
      <SummaryCardHeader nodeAddress={nodeAddress} />
      <SummaryCardContent nodeAddress={nodeAddress} />
      <CardActions>
        <Button
          href={rocketscanUrl({ node: nodeAddressOrName })}
          target="_blank"
          color="primary"
          endIcon={<OpenInNew />}
        >
          Explore
        </Button>
      </CardActions>
    </Card>
  );
}
