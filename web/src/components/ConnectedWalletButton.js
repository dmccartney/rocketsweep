import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";
import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
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
        <WalletAvatar walletAddress={address} size={36} />
        <Stack direction="column" spacing={0.25}>
          <Typography variant="body2">
            {ensName ?? shortenAddress(address)}
          </Typography>
          <Stack direction="row" alignItems="center">
            {connector?.id === "safe" ? (
              <SafeIcon color="text.secondary" sx={{ width: 16, height: 16 }} />
            ) : null}
            <Typography color="text.secondary" variant="caption">
              {connector?.name}
            </Typography>
          </Stack>
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
        <Card sx={{ width: "95%", maxWidth: 500 }}>
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
