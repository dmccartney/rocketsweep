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
import MinipoolRewardsSummaryCard from "../components/MinipoolRewardsSummaryCard";
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

function WithdrawalableNodes({ address }) {
  let nodeAddresses = useWithdrawableNodeAddresses(address);
  return (
    <Grid
      sx={{ maxWidth: 800, mt: 1 }}
      container
      alignSelf="center"
      justifyContent="center"
      spacing={3}
    >
      {nodeAddresses.map((nodeAddress) => (
        <Grid key={"summary-card"} item xs={6}>
          <MinipoolRewardsSummaryCard nodeAddress={nodeAddress} asLink />
        </Grid>
      ))}
    </Grid>
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
          <Card sx={{ minWidth: 400, maxWidth: 800, mt: 1, mb: 2 }}>
            <CardContent>
              <Typography gutterBottom>
                Connect wallet to view your nodes
              </Typography>
              <ConnectedWalletButton fullWidth />
            </CardContent>
          </Card>
        )}
        <Card sx={{ minWidth: 400, maxWidth: 800 }}>
          <CardContent>
            <Typography gutterBottom>
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
      </Stack>
      {input && isAddress && <WithdrawalableNodes address={input} />}
      {!input && isConnected && <WithdrawalableNodes address={address} />}
    </Layout>
  );
}
