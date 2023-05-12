import {
  AppBar,
  Box,
  Card,
  CardActionArea,
  CardHeader,
  Link,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ConnectedWalletButton from "./ConnectedWalletButton";
import { HelpOutline } from "@mui/icons-material";

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

export default function Layout({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
      }}
    >
      <AppBar component="nav" color="default">
        <Toolbar disableGutters>
          <Tooltip title={<FAQ />}>
            <Card elevation={2} square>
              <CardActionArea component={RouterLink} to={`/`}>
                <CardHeader
                  title="Rocket Sweep"
                  action={<HelpOutline sx={{ ml: 1 }} fontSize="inherit" />}
                  titleTypographyProps={{ whiteSpace: "nowrap" }}
                />
              </CardActionArea>
            </Card>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          <ConnectedWalletButton sx={{ mr: 2 }} />
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
