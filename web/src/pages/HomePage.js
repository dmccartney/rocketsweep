import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  FormControl,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  tooltipClasses,
  Typography,
} from "@mui/material";
import { useAccount, useEnsAddress } from "wagmi";
import {
  EventRepeat,
  ExpandLess,
  ExpandMore,
  Search,
} from "@mui/icons-material";
import { useState } from "react";
import { ethers } from "ethers";
import ConnectedWalletButton from "../components/ConnectedWalletButton";
import Layout from "../components/Layout";
import NodeRewardsSummaryCard from "../components/NodeRewardsSummaryCard";
import useWithdrawableNodeAddresses from "../hooks/useWithdrawableNodeAddresses";
import useOngoingRewardIndex from "../hooks/useOngoingRewardIndex";
import IntervalsChart from "../components/IntervalsChart";
import IntervalRewardsSummaryCard from "../components/IntervalRewardsSummaryCard";
import _ from "lodash";

function SearchInput({ sx, input, onChange }) {
  useEnsAddress({
    name: input,
    enabled: input.endsWith(".eth"),
    cacheTime: 0,
    staleTime: 0,
    onSuccess: (data) => data && onChange(data),
  });
  return (
    <FormControl sx={sx} fullWidth variant="outlined">
      <TextField
        value={input}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        size="small"
        name="address"
        placeholder="0x..."
        fullWidth
        helperText="Address or ENS name"
        autoFocus
        InputProps={{
          color: "secondary",
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />
    </FormControl>
  );
}

function WithdrawalableNodes({ sx, address }) {
  let nodeAddresses = useWithdrawableNodeAddresses(address);
  return (
    <Stack sx={sx} direction="column" alignItems="center" spacing={1}>
      {nodeAddresses.map((nodeAddress) => (
        <NodeRewardsSummaryCard
          key={nodeAddress}
          sx={{ width: "100%" }}
          nodeAddress={nodeAddress}
          asLink
        />
      ))}
    </Stack>
  );
}

function TooltippedSummaryCard({
  sx,
  rewardIndex,
  onTooltipOpen,
  onTooltipClose,
}) {
  return (
    <Tooltip
      arrow
      onOpen={onTooltipOpen}
      onClose={onTooltipClose}
      slotProps={{
        popper: {
          sx: {
            [`& .${tooltipClasses.tooltip}`]: {
              p: 1,
              maxWidth: 420,
            },
          },
        },
      }}
      title={
        <Stack
          direction="column"
          spacing={3}
          sx={{ width: "100%", maxWidth: 600 }}
        >
          <IntervalRewardsSummaryCard
            elevation={9}
            asLink
            rewardIndex={rewardIndex}
          />
        </Stack>
      }
    >
      <span>
        <IntervalRewardsSummaryCard
          sx={sx}
          elevation={3}
          asLink
          minimal
          rewardIndex={rewardIndex}
        />
      </span>
    </Tooltip>
  );
}

export default function HomePage() {
  let { address, isConnected } = useAccount();
  let ongoingRewardIndex = useOngoingRewardIndex();
  let [input, setInput] = useState("");
  let [activeRewardIndex, setActiveRewardIndex] = useState(null);
  let [isShowingAll, setShowingAll] = useState(false);
  let isAddress = ethers.utils.isAddress(input);
  let intervals = _.times(
    ongoingRewardIndex,
    (n) => ongoingRewardIndex - n - 1
  );
  return (
    <Layout>
      <Stack sx={{ mt: 1 }} alignItems="center" direction="column">
        <Grid container columnSpacing={3} justifyContent="center">
          <Grid item xs={12} sm={10} md={6} lg={4}>
            <Card sx={{ width: "100%", mb: 3 }}>
              <CardHeader
                avatar={<EventRepeat fontSize="medium" color="disabled" />}
                subheader={"Periodic Rewards"}
              />
              <CardMedia
                component={IntervalsChart}
                activeRewardIndex={activeRewardIndex}
              />
              <CardContent sx={{ pt: 0 }}>
                <Typography
                  sx={{ mb: 2, textAlign: "center", width: "100%" }}
                  component={"div"}
                  color={(theme) => theme.palette.text.secondary}
                  variant="caption"
                >
                  <Typography
                    component={"span"}
                    variant="caption"
                    color={(theme) => theme.palette.eth.main}
                  >
                    Smoothing Pool ETH
                  </Typography>
                  {" • "}
                  <Typography
                    component={"span"}
                    variant="caption"
                    color={(theme) => theme.palette.rpl.main}
                  >
                    Inflation RPL
                  </Typography>
                </Typography>
                <TooltippedSummaryCard
                  key="reward-summary-ongoing"
                  sx={{ mb: 1 }}
                  onTooltipOpen={() => setActiveRewardIndex(ongoingRewardIndex)}
                  onTooltipClose={() => setActiveRewardIndex(null)}
                  rewardIndex={ongoingRewardIndex}
                />
                {intervals
                  .slice(0, isShowingAll ? intervals.length : 1)
                  .map((rewardIndex) => (
                    <TooltippedSummaryCard
                      key={`reward-summary-${rewardIndex}`}
                      sx={{ mb: 1 }}
                      onTooltipOpen={() => setActiveRewardIndex(rewardIndex)}
                      onTooltipClose={() => setActiveRewardIndex(null)}
                      rewardIndex={rewardIndex}
                    />
                  ))}
                {!intervals.length ? null : (
                  <Button
                    sx={{ mt: 1 }}
                    fullWidth
                    color={"inherit"}
                    onClick={() => setShowingAll(!isShowingAll)}
                    endIcon={isShowingAll ? <ExpandLess /> : <ExpandMore />}
                  >
                    See All
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={10} md={6} lg={4}>
            <Card sx={{ width: "100%", mb: 3 }}>
              <CardContent>
                {!isConnected && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Connect wallet to view your nodes
                    </Typography>
                    <ConnectedWalletButton sx={{ mb: 3 }} fullWidth />
                  </>
                )}
                <Typography variant="subtitle2" gutterBottom>
                  {isConnected
                    ? "Find nodes by address"
                    : "Or find nodes by address"}
                </Typography>
                <SearchInput
                  sx={{ width: "100%" }}
                  input={input}
                  onChange={setInput}
                />
              </CardContent>
            </Card>
            {input && isAddress && (
              <WithdrawalableNodes sx={{ width: "100%" }} address={input} />
            )}
            {!input && isConnected && (
              <WithdrawalableNodes sx={{ width: "100%" }} address={address} />
            )}
          </Grid>
        </Grid>
      </Stack>
    </Layout>
  );
}
