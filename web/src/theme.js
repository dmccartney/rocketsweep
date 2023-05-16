import { createTheme, ThemeProvider } from "@mui/material/styles";
import "@fontsource/jetbrains-mono/latin-300.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import green from "@mui/material/colors/green";
import deepOrange from "@mui/material/colors/deepOrange";
import indigo from "@mui/material/colors/indigo";
import lightBlue from "@mui/material/colors/lightBlue";
import amber from "@mui/material/colors/amber";
import React, { createContext, useContext, useMemo } from "react";
import { useMediaQuery } from "@mui/material";
import useSetting from "./hooks/useSetting";
const makeTheme = (mode) =>
  createTheme({
    spacing: 8,
    palette: {
      mode,
      primary: green,
      background: {
        default: mode === "dark" ? "#121212" : "#fafafa",
      },
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
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === "dark" ? "#212121" : "#eaeaea",
          },
          arrow: {
            color: mode === "dark" ? "#212121" : "#eaeaea",
          },
        },
      },
    },
  });

const ThemeMode = createContext({
  mode: "auto",
  resolvedMode: "dark",
  setMode: () => {},
});

export const useThemeMode = () => useContext(ThemeMode);

export function ThemeModeProvider({ children }) {
  let [mode, setMode] = useSetting("theme.mode");
  let prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  let resolvedMode =
    mode === "auto" ? (prefersDarkMode ? "dark" : "light") : mode;
  let theme = useMemo(() => makeTheme(resolvedMode), [resolvedMode]);
  let configure = React.useMemo(
    () => ({ mode, setMode, resolvedMode }),
    [mode, setMode, resolvedMode]
  );
  return (
    <ThemeMode.Provider value={configure}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeMode.Provider>
  );
}
