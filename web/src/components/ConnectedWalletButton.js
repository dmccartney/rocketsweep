import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";
import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import WalletAvatar from "./WalletAvatar";
import { shortenAddress } from "../utils";
import SafeIcon from "./SafeIcon";

export default function ConnectedWalletButton({
  sx,
  showConnected = true,
  ...props
}) {
  const { connect, connectors, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const [showingOptions, setShowingOptions] = useState(false);

  const { address, connector, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  if (isConnected) {
    if (!showConnected) {
      return null;
    }
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Button size={"small"} onClick={() => disconnect()}>
          Disconnect
        </Button>
        <WalletAvatar walletAddress={address} size={48} />
        <Stack direction="column" spacing={0.5}>
          <Typography variant="body2">
            {ensName ?? shortenAddress(address)}
          </Typography>
          <Box>
            <Chip
              size="small"
              avatar={
                connector?.id === "safe" ? (
                  <Avatar>
                    <SafeIcon />
                  </Avatar>
                ) : null
              }
              label={connector?.name}
            />
          </Box>
        </Stack>
      </Stack>
    );
  }
  return (
    <>
      <Button
        variant="contained"
        onClick={() => setShowingOptions(true)}
        {...props}
      >
        Connect
      </Button>
      <Modal
        open={showingOptions}
        sx={{
          display: "flex",
          p: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
        onClose={() => setShowingOptions(false)}
      >
        <Card sx={{ width: 300 }}>
          <CardHeader title={"Connect Wallet"} />
          <CardContent>
            <Stack direction="column" spacing={2}>
              {connectors
                .filter((connector) => connector.ready)
                .map((connector) => (
                  <Button
                    variant="contained"
                    color="inherit"
                    disabled={!connector.ready}
                    key={connector.id}
                    onClick={() => {
                      setShowingOptions(false);
                      connect({ connector });
                    }}
                  >
                    {connector.name}
                    {!connector.ready && " (unsupported)"}
                    {isLoading &&
                      connector.id === pendingConnector?.id &&
                      " (connecting)"}
                  </Button>
                ))}
            </Stack>
          </CardContent>
        </Card>
      </Modal>
    </>
  );
}
