import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormHelperText,
  Stack,
  useTheme,
} from "@mui/material";
import { bnSum, MinipoolStatus, rocketscanUrl, trimValue } from "../utils";
import { ethers } from "ethers";
import useMinipoolDetails from "../hooks/useMinipoolDetails";
import { ResponsiveContainer, Treemap } from "recharts";
import WalletChip from "./WalletChip";
import { useEnsName } from "wagmi";
import { Link } from "react-router-dom";
import { AllInclusive, EventRepeat, OpenInNew } from "@mui/icons-material";
import CurrencyValue from "./CurrencyValue";
import useNodeFinalizedRewardSnapshots from "../hooks/useNodeFinalizedRewardSnapshots";

function SummaryCardHeader({ nodeAddress, action }) {
  return (
    <CardHeader
      title={
        <WalletChip
          clickable={false}
          sx={{ cursor: "inherit" }}
          labelVariant={"body2"}
          walletAddress={nodeAddress}
        />
      }
      action={action}
    />
  );
}

function PeriodicRewardsCard({
  sx,
  unclaimed,
  unclaimedEthTotal,
  unclaimedRplTotal,
}) {
  return (
    <Card elevation={5} sx={sx}>
      <CardHeader
        avatar={<EventRepeat fontSize="medium" color="disabled" />}
        subheader="Periodic Rewards"
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack direction="row" sx={{ mb: 2 }} spacing={2} justifyContent="left">
          <CurrencyValue
            value={unclaimedEthTotal}
            placeholder="0"
            size="medium"
            currency="eth"
          />
          <CurrencyValue
            value={unclaimedRplTotal}
            placeholder="0"
            size="medium"
            currency="rpl"
          />
        </Stack>
        <FormHelperText>
          From <Chip component="span" size="small" label={unclaimed.length} />{" "}
          unclaimed
          {unclaimed.length === 1 ? " interval" : " intervals"}
        </FormHelperText>
      </CardContent>
    </Card>
  );
}

function ContinuousRewardsCard({ nodeTotal, protocolTotal, minipools }) {
  let theme = useTheme();
  return (
    <Card elevation={5}>
      <CardHeader
        avatar={<AllInclusive fontSize="medium" color="disabled" />}
        subheader="Continuous Rewards"
      />
      <CardContent sx={{ pt: 0 }}>
        <CurrencyValue
          sx={{ mb: 2 }}
          value={minipools.length && nodeTotal}
          size="medium"
          currency="eth"
        />
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
          <ResponsiveContainer height={36} width="100%">
            <Treemap
              colorPanel={[theme.palette.eth.main, theme.palette.eth.light]}
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
    </Card>
  );
}

function usePeriodicRewards({ nodeAddress }) {
  let nodeSnapshots = useNodeFinalizedRewardSnapshots({ nodeAddress });
  let unclaimed = nodeSnapshots.filter(({ isClaimed }) => isClaimed === false);
  let unclaimedEthTotal = bnSum(
    unclaimed.map(({ smoothingPoolEth }) => smoothingPoolEth)
  );
  let unclaimedRplTotal = bnSum(
    unclaimed.map(({ collateralRpl, oracleDaoRpl }) =>
      ethers.BigNumber.from(oracleDaoRpl || "0").add(
        ethers.BigNumber.from(collateralRpl || "0")
      )
    )
  );
  return { unclaimed, unclaimedEthTotal, unclaimedRplTotal };
}

function useContinuousRewards({ nodeAddress }) {
  let minipools = useMinipoolDetails(nodeAddress);
  minipools = minipools.filter(
    ({ status }) => status === MinipoolStatus.staking
  );
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
  return { nodeTotal, protocolTotal, minipools };
}

const oneHundred = ethers.utils.parseUnits("100");
function SummaryCardContent({ nodeAddress }) {
  const periodic = usePeriodicRewards({ nodeAddress });
  const continuous = useContinuousRewards({ nodeAddress });
  const ethTotal = continuous.nodeTotal?.add(periodic.unclaimedEthTotal);
  const rplTotal = periodic.unclaimedRplTotal;
  let size =
    ethTotal?.gt(oneHundred) || rplTotal?.gt(oneHundred) ? "medium" : "large";
  return (
    <CardContent sx={{ pt: 1 }}>
      <Stack
        direction="row"
        divider={
          <Divider
            orientation="vertical"
            sx={{ opacity: 0.5 }}
            flexItem
          ></Divider>
        }
        spacing={2}
        justifyContent="left"
      >
        <CurrencyValue
          value={ethTotal}
          placeholder="0"
          size={size}
          currency="eth"
        />
        <CurrencyValue
          value={rplTotal}
          placeholder="0"
          size={size}
          currency="rpl"
        />
      </Stack>
      <FormHelperText disabled dense>
        Total sweepable rewards
      </FormHelperText>
      <PeriodicRewardsCard sx={{ mt: 2, mb: 3 }} {...periodic} />
      <ContinuousRewardsCard {...continuous} />
    </CardContent>
  );
}

export default function NodeRewardsSummaryCard({
  sx,
  nodeAddress,
  action,
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
        <Stack
          sx={{ width: "100%" }}
          direction="row"
          justifyContent="space-between"
        >
          <Button
            href={rocketscanUrl({ node: nodeAddressOrName })}
            target="_blank"
            color="rpl"
            endIcon={<OpenInNew />}
          >
            Explore
          </Button>
          {action}
        </Stack>
      </CardActions>
    </Card>
  );
}
