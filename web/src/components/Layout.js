import {
  AppBar,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Modal,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ConnectedWalletButton from "./ConnectedWalletButton";
import { HelpOutline, Settings } from "@mui/icons-material";
import { useRef, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useThemeMode } from "../theme";
import useSetting from "../hooks/useSetting";

function FAQ() {
  let theme = useTheme();
  return (
    <Stack spacing={1} sx={{ m: 1, pb: 1, color: theme.palette.text.primary }}>
      <Typography variant="h6">What is this?</Typography>
      <Typography variant="body2">
        This is a tool for{" "}
        <Link
          href="https://rocketpool.net/"
          target="_blank"
          color="inherit"
          underline="always"
        >
          Rocket Pool
        </Link>{" "}
        operators to view and take rewards.
      </Typography>
      <Typography variant="h6">How does it work?</Typography>
      <Typography variant="body2">
        It uses on-chain data to prepare reward info. And then it allows you to
        initiate claims and distributions.
      </Typography>
      <Typography variant="h6">Who made this?</Typography>
      <Typography variant="body2">
        This unofficial tool was made by{" "}
        <Link
          href="https://github.com/dmccartney"
          target="_blank"
          color="inherit"
          underline="always"
        >
          dmccartney
        </Link>
        .
      </Typography>
      <Typography variant="h6">Where's the source?</Typography>
      <Typography variant="body2">
        <Link
          href="https://github.com/dmccartney/rocketsweep"
          target="_blank"
          color="inherit"
          underline="always"
        >
          dmccartney/rocketsweep
        </Link>
      </Typography>
    </Stack>
  );
}

function SettingsButton({ sx }) {
  let [isOpen, setOpen] = useState(false);
  let { isConnected } = useAccount();
  let { disconnectAsync } = useDisconnect();
  let { mode, setMode } = useThemeMode();
  let [ipfsBase, setIpfsBase, defaultIpfsBase] = useSetting("ipfs.base");
  let ipfsRef = useRef();
  return (
    <>
      <IconButton onClick={() => setOpen(true)} sx={sx}>
        <Settings />
      </IconButton>
      <Modal
        open={isOpen}
        onClose={() => setOpen(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card sx={{ width: "95%", maxWidth: 500 }}>
          <CardHeader title={"Settings"} />
          <CardContent>
            <List>
              {isConnected && (
                <ListItem>
                  <ListItemText primary="Wallet" />
                  <Button
                    size="small"
                    onClick={() =>
                      disconnectAsync()
                        .then(() => setOpen(false))
                        .catch((e) => console.log("failure disconnecting", e))
                    }
                  >
                    Disconnect
                  </Button>
                </ListItem>
              )}
              <ListItem>
                <ListItemText primary="Theme" />
                <ButtonGroup>
                  {["auto", "light", "dark"].map((m) => (
                    <Button
                      key={`mode-${m}`}
                      variant={mode === m ? "contained" : "outlined"}
                      size="small"
                      onClick={() => setMode(m)}
                    >
                      {m}
                    </Button>
                  ))}
                </ButtonGroup>
              </ListItem>
              <ListItem>
                <ListItemText primary="IPFS Gateway" />
                <Stack direction="column" alignItems="flex-end">
                  <ButtonGroup size="small">
                    <Button
                      onClick={() => setIpfsBase(defaultIpfsBase)}
                      variant={
                        ipfsBase === defaultIpfsBase ? "contained" : "outlined"
                      }
                    >
                      default
                    </Button>
                    <Button
                      onClick={() => {
                        setIpfsBase("https://");
                        ipfsRef.current?.focus();
                      }}
                      variant={
                        ipfsBase === defaultIpfsBase ? "outlined" : "contained"
                      }
                    >
                      custom
                    </Button>
                  </ButtonGroup>
                </Stack>
              </ListItem>
              <Grid container>
                <Grid item xs={4} />
                <Grid item xs={8}>
                  <TextField
                    ref={ipfsRef}
                    disabled={ipfsBase === defaultIpfsBase}
                    fullWidth
                    size="small"
                    onChange={(e) => setIpfsBase(e.target.value)}
                    value={ipfsBase}
                  />
                </Grid>
              </Grid>
              <Typography
                sx={{ ml: 2, mt: 4 }}
                color="text.secondary"
                component={"h2"}
                variant="overline"
              >
                TODO
              </Typography>
              <ListItem>
                <ListItemText primary="Ethereum RPC" />
                <Stack direction="column" alignItems="flex-end">
                  <ButtonGroup disabled size="small">
                    <Button variant="contained">Default</Button>
                    <Button variant="outlined">Custom</Button>
                  </ButtonGroup>
                </Stack>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Modal>
    </>
  );
}

export default function Layout({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
      }}
    >
      <AppBar component="nav" color="default">
        <Toolbar disableGutters>
          <Tooltip arrow title={<FAQ />}>
            <Typography
              variant="h6"
              sx={{
                pl: 2,
                color: "inherit",
                textDecoration: "none",
              }}
              component={RouterLink}
              to={"/"}
            >
              Rocket Sweep <HelpOutline sx={{ ml: 1 }} fontSize="inherit" />
            </Typography>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          <ConnectedWalletButton />
          <SettingsButton />
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Stack sx={{ width: "100%", pt: 3, pl: 3, pr: 3 }}>{children}</Stack>
      </Box>
    </Box>
  );
}
