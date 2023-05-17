import {
  Card,
  CardContent,
  FormControl,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAccount, useEnsAddress } from "wagmi";
import { Search } from "@mui/icons-material";
import { useState } from "react";
import { ethers } from "ethers";
import ConnectedWalletButton from "../components/ConnectedWalletButton";
import Layout from "../components/Layout";
import NodeRewardsSummaryCard from "../components/NodeRewardsSummaryCard";
import useWithdrawableNodeAddresses from "../hooks/useWithdrawableNodeAddresses";

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

export default function HomePage() {
  let { address, isConnected } = useAccount();
  let [input, setInput] = useState("");
  let isAddress = ethers.utils.isAddress(input);
  return (
    <Layout>
      <Stack sx={{ mt: 2 }} alignItems="center" direction="column">
        {!isConnected && (
          <Grid container alignItems="center" justifyContent="center">
            <Grid item xs={12} sm={4} align>
              <Card sx={{ width: "100%", mt: 1, mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Connect wallet to view your nodes
                  </Typography>
                  <ConnectedWalletButton fullWidth />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        <Grid container alignItems="center" justifyContent="center">
          <Grid item xs={12} sm={4} align>
            <Card sx={{ width: "100%" }}>
              <CardContent>
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
          </Grid>
        </Grid>
      </Stack>
      <Grid container alignItems="center" justifyContent="center">
        <Grid item xs={12} sm={4} sx={{ mt: 3 }}>
          {input && isAddress && (
            <WithdrawalableNodes sx={{ width: "100%" }} address={input} />
          )}
          {!input && isConnected && (
            <WithdrawalableNodes sx={{ width: "100%" }} address={address} />
          )}
        </Grid>
      </Grid>
    </Layout>
  );
}
