import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import useMinipoolDetails from "../hooks/useMinipoolDetails";
import { Chip, CircularProgress, IconButton, Typography } from "@mui/material";
import {
  BNSortComparator,
  etherscanUrl,
  MinipoolStatus,
  rocketscanUrl,
  shortenAddress,
  trimValue,
} from "../utils";
import { OpenInNew } from "@mui/icons-material";
import { ethers } from "ethers";
import _ from "lodash";

const MinipoolStatusName = _.invert(MinipoolStatus);

const MINIPOOL_COLS = [
  {
    field: "minipoolAddress",
    headerName: "Minipool",
    width: 165,
    renderCell: ({ value }) => (
      <>
        <Chip
          sx={{ mr: 1 }}
          size="small"
          variant="outlined"
          color="primary"
          clickable
          component="a"
          target="_blank"
          href={rocketscanUrl({ minipool: value })}
          label={shortenAddress(value)}
        />
        <IconButton
          size={"small"}
          variant={"contained"}
          color={"default"}
          clickable="true"
          component="a"
          target="_blank"
          href={etherscanUrl({ address: value })}
        >
          <OpenInNew fontSize="inherit" />
        </IconButton>
      </>
    ),
  },
  {
    field: "status",
    headerName: "Status",
    width: 125,
    valueGetter: ({ value }) => MinipoolStatusName[value],
  },
  {
    field: "upgraded",
    headerName: "Upgraded",
    width: 125,
    type: "boolean",
    valueFormatter: ({ value }) => (value ? "upgraded" : "not upgraded"),
  },
  {
    field: "balance",
    headerName: "Total",
    width: 150,
    sortComparator: BNSortComparator,
    valueGetter: ({ value }) =>
      value ? ethers.BigNumber.from(value || "0") : value,
    renderCell: ({ value, row }) => {
      if (!value) {
        return <CircularProgress size="1em" />;
      }
      if (row.status !== MinipoolStatus.staking) {
        return "---";
      }
      return (
        <Typography>
          {trimValue(
            ethers.utils.formatUnits(ethers.BigNumber.from(value || "0"))
          )}
          {/*<Button sx={{ ml: 2 }} size="small" variant="contained">*/}
          {/*  Distribute*/}
          {/*</Button>*/}
        </Typography>
      );
    },
  },
  {
    field: "nodeBalance",
    headerName: "Your Share",
    width: 100,
    sortComparator: BNSortComparator,
    valueGetter: ({ value }) =>
      value ? ethers.BigNumber.from(value || "0") : value,
    renderCell: ({ value, row }) => {
      if (!row.upgraded) {
        return "---";
      }
      if (row.status !== MinipoolStatus.staking) {
        return "---";
      }
      if (!value) {
        return null;
      }
      return trimValue(
        ethers.utils.formatUnits(ethers.BigNumber.from(value || "0"))
      );
    },
  },
  {
    field: "protocolBalance",
    headerName: "rETH Share",
    width: 100,
    sortComparator: BNSortComparator,
    valueGetter: ({ value }) =>
      value ? ethers.BigNumber.from(value || "0") : value,
    renderCell: ({ value, row }) => {
      if (!row.upgraded) {
        return "---";
      }
      if (row.status !== MinipoolStatus.staking) {
        return "---";
      }
      if (!value) {
        return null;
      }
      return trimValue(
        ethers.utils.formatUnits(ethers.BigNumber.from(value || "0"))
      );
    },
  },
];

export default function MinipoolRewardsTable({ sx, nodeAddress }) {
  let [pageSize, setPageSize] = useState(10);
  let minipools = useMinipoolDetails(nodeAddress);
  return (
    <DataGrid
      sx={{ ...sx }}
      autoHeight
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      pagination
      rowsPerPageOptions={[5, 10, 20, 50, 100]}
      rows={minipools}
      getRowId={({ minipoolAddress }) => minipoolAddress}
      columns={MINIPOOL_COLS}
      initialState={{
        // filter: {
        //   filterModel: {
        //     items: [
        //       {
        //         columnField: "status",
        //         operatorValue: "equals",
        //         value: "staking",
        //       }
        //     ],
        //   },
        // },
        sorting: {
          sortModel: [
            {
              field: "balance",
              sort: "desc",
            },
          ],
        },
      }}
      disableSelectionOnClick
    />
  );
}
