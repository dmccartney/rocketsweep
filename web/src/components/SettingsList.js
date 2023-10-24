import { useAccount, useDisconnect } from "wagmi";
import { useThemeMode } from "../theme";
import useSetting from "../hooks/useSetting";
import { useRef } from "react";
import {
  Button,
  ButtonGroup,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Help } from "@mui/icons-material";

export default function SettingsList() {
  let { isConnected } = useAccount();
  let { disconnectAsync } = useDisconnect();
  let { mode, setMode } = useThemeMode();
  let [ipfsBase, setIpfsBase, defaultIpfsBase] = useSetting("ipfs.base");
  let [rewardsOngoingBase] = useSetting("rewards.ongoing.base");
  let ipfsRef = useRef();
  return (
    <List>
      {isConnected && (
        <ListItem>
          <ListItemText primary="Wallet" />
          <Button
            size="small"
            onClick={() =>
              disconnectAsync().catch((e) =>
                console.log("failure disconnecting", e)
              )
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
        <ListItemText primary="Ethereum RPC" />
        <Tooltip arrow title="TODO: make Ethereum RPC configurable">
          <Stack direction="column" alignItems="flex-end">
            <ButtonGroup disabled size="small">
              <Button variant="contained">Default</Button>
              <Button variant="outlined">Custom</Button>
            </ButtonGroup>
          </Stack>
        </Tooltip>
      </ListItem>
      <ListItem>
        <ListItemText primary="IPFS Gateway" />
        <Stack direction="column" alignItems="flex-end">
          <ButtonGroup size="small">
            <Button
              onClick={() => setIpfsBase(defaultIpfsBase)}
              variant={ipfsBase === defaultIpfsBase ? "contained" : "outlined"}
            >
              default
            </Button>
            <Button
              onClick={() => {
                setIpfsBase("");
                setTimeout(() => ipfsRef.current?.focus(), 50);
              }}
              variant={ipfsBase === defaultIpfsBase ? "outlined" : "contained"}
            >
              custom
            </Button>
          </ButtonGroup>
        </Stack>
      </ListItem>
      <Grid container sx={{ mb: 1, pr: 2 }}>
        <Grid item xs={4} />
        <Grid item xs={8}>
          <TextField
            inputRef={ipfsRef}
            disabled={ipfsBase === defaultIpfsBase}
            fullWidth
            size="small"
            placeholder="https://..."
            onChange={(e) => setIpfsBase(e.target.value)}
            value={ipfsBase}
          />
        </Grid>
      </Grid>
      <ListItem>
        <ListItemText
          primary={
            <>
              Ongoing Rewards
              <Tooltip title="To preview the ongoing interval’s rewards, we rely on an off-chain source to calculate an estimate of the rewards tree.">
                <Typography component="span" color="text.secondary">
                  <Help sx={{ ml: 1 }} fontSize="small" />
                </Typography>
              </Tooltip>
            </>
          }
        />
        <Tooltip arrow title="TODO: make Ongoing Rewards configurable">
          <Stack direction="column" alignItems="flex-end">
            <ButtonGroup disabled size="small">
              <Button variant="contained">Default</Button>
              <Button variant="outlined">Custom</Button>
            </ButtonGroup>
          </Stack>
        </Tooltip>
      </ListItem>
      <Grid container sx={{ mb: 1, pr: 2 }}>
        <Grid item xs={4} />
        <Grid item xs={8}>
          <TextField
            disabled
            fullWidth
            size="small"
            value={rewardsOngoingBase}
          />
        </Grid>
      </Grid>
    </List>
  );
}
