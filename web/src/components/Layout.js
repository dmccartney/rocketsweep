import {
  AppBar,
  Box,
  Breadcrumbs,
  Link,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { HelpOutline } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import ConnectedWalletButton from "./ConnectedWalletButton";

function FAQ() {
  return (
    <Stack spacing={1} sx={{ m: 1 }}>
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
        operators to distribute the accumulated balances from their minipools.
      </Typography>
      <Typography variant="h6">How does it work?</Typography>
      <Typography variant="body2">
        It uses on-chain data to list all minipools under control. And then it
        allows you to initiate distribution of their rewards.
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

export default function Layout({ breadcrumbs = [], children }) {
  return (
    <Box
      sx={{
        display: "flex",
      }}
    >
      <AppBar component="nav" color="primary">
        <Toolbar sx={{ pr: 0 }}>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <span>Rocket Sweep</span>
              <Tooltip title={<FAQ />} sx={{ cursor: "help" }}>
                <HelpOutline color="disabled" fontSize="inherit" />
              </Tooltip>
            </Stack>
          </Typography>
          <ConnectedWalletButton />
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        {!breadcrumbs?.length ? null : (
          <Breadcrumbs sx={{ p: 3 }}>
            {breadcrumbs.map(({ label, href }, n) => (
              <Link
                key={`breadcrumb-${n}`}
                underline="hover"
                component={RouterLink}
                color={
                  n === breadcrumbs.length - 1 ? "text.primary" : "inherit"
                }
                to={href}
              >
                {label}
              </Link>
            ))}
          </Breadcrumbs>
        )}
        <Stack sx={{ width: "100%", pl: 3, pr: 3 }}>{children}</Stack>
      </Box>
    </Box>
  );
}
