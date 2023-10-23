import { GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import { Box, CircularProgress, Stack } from "@mui/material";

export default function DataToolbar({ isLoading, fileName, header }) {
  return (
    <GridToolbarContainer
      sx={{
        bgcolor: "divider",
        pt: 1,
        pb: 1,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
      }}
    >
      <Stack sx={{ width: "100%" }} direction="row" alignItems="flex-start">
        <Box sx={{ flexGrow: 1 }}>{header ? header : null}</Box>
        <Box sx={{ minWidth: 90, textAlign: "center" }}>
          {isLoading ? (
            <CircularProgress color="inherit" size={14} sx={{ m: 1.5 }} />
          ) : (
            <GridToolbarExport
              size="small"
              color="inherit"
              sx={{ mt: 0.5, minWidth: 90, opacity: 0.8 }}
              disabled={isLoading}
              printOptions={{ disableToolbarButton: true }}
              csvOptions={{ fileName }}
            />
          )}
        </Box>
      </Stack>
    </GridToolbarContainer>
  );
}
