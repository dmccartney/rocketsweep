import {
  AppBar,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Link,
  Modal,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ConnectedWalletButton from "./ConnectedWalletButton";
import { HelpOutline, Settings } from "@mui/icons-material";
import { useState } from "react";
import SettingsList from "./SettingsList";

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
            <SettingsList />
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
