import { createTheme } from "@mui/material/styles";
import "@fontsource/jetbrains-mono/latin-300.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import green from "@mui/material/colors/green";
import deepOrange from "@mui/material/colors/deepOrange";
import indigo from "@mui/material/colors/indigo";
import lightBlue from "@mui/material/colors/lightBlue";
import amber from "@mui/material/colors/amber";
const theme = createTheme({
  spacing: 8,
  palette: {
    mode: "dark", // TODO: make this toggle-able
    primary: green,
    rpl: {
      main: deepOrange[400],
      light: deepOrange[300],
      dark: deepOrange[700],
    },
    eth: {
      main: indigo[300],
      light: indigo[200],
      dark: indigo[600],
    },
    gray: {
      main: "#aaaaaa",
      light: "#cccccc",
      dark: "#666666",
    },
    secondary: lightBlue,
    warning: {
      main: amber[400],
      light: amber[300],
      dark: amber[700],
    },
  },
  typography: {
    fontFamily: "JetBrains Mono",
    overline: {
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 11,
    },
  },
  components: {
    MuiAlert: {
      styleOverrides: {
        message: {
          fontWeight: 300,
        },
      },
    },
  },
});

export default theme;
