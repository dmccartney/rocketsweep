import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import moment from "moment";
import { BNSortComparator } from "../utils";
import CurrencyValue from "./CurrencyValue";
import useNodeFinalizedRewardSnapshots from "../hooks/useNodeFinalizedRewardSnapshots";
import useNodePendingRewardSnapshot from "../hooks/useNodePendingRewardSnapshot";
import useNodeOngoingRewardSnapshot from "../hooks/useNodeOngoingRewardSnapshot";
import ClaimButtonGroup from "./ClaimButtonGroup";

const INTERVAL_COLS = [
  {
    field: "rewardIndex",
    headerName: "Interval",
    width: 150,
    renderCell: ({
      row: { type, rewardIndex, endTime, file, nodeAddressOrName },
    }) => {
      let when = endTime ? moment(1000 * endTime) : null;
      return (
        <Button
          component={Link}
          size="small"
          variant="inherit"
          to={`/interval/${rewardIndex}`}
        >
          <Stack direction="row" alignItems="baseline">
            #{rewardIndex}
            <Typography sx={{ pl: 1 }} variant="caption" color="text.secondary">
              {`${when?.fromNow() || "ongoing"}`}
            </Typography>
          </Stack>
        </Button>
      );
    },
  },
  {
    field: "isClaimed",
    headerName: "",
    width: 245,
    sortable: false,
    renderCell: ({ value, row }) => {
      let {
        type,
        nodeAddress,
        rewardIndex,
        oracleDaoRpl,
        collateralRpl,
        smoothingPoolEth,
        merkleProof,
      } = row;
      return (
        <ClaimButtonGroup
          type={type}
          totalEth={ethers.BigNumber.from(smoothingPoolEth || "0")}
          totalRpl={ethers.BigNumber.from(collateralRpl || "0").add(
            ethers.BigNumber.from(oracleDaoRpl || "0")
          )}
          merkleProof={merkleProof}
          rewardIndex={rewardIndex}
          nodeAddress={nodeAddress}
        />
      );
    },
  },
  {
    field: "smoothingPoolEth",
    type: "number",
    headerName: "Smoothing Pool",
    width: 150,
    sortComparator: BNSortComparator,
    valueGetter: ({ value }) => ethers.BigNumber.from(value || 0),
    renderCell: ({ value, row: { type } }) => (
      <Stack direction="row" spacing={1} alignItems="baseline">
        {type === "ongoing" && (
          <Typography component="span" variant="inherit" color="text.secondary">
            &ge;
          </Typography>
        )}
        <CurrencyValue
          size="small"
          currency="eth"
          placeholder="0"
          value={value}
        />
      </Stack>
    ),
  },
  {
    field: "totalRpl",
    type: "number",
    headerName: "Inflation",
    width: 150,
    sortComparator: BNSortComparator,
    valueGetter: ({ row: { collateralRpl, oracleDaoRpl } }) => {
      return ethers.BigNumber.from(collateralRpl || "0").add(
        ethers.BigNumber.from(oracleDaoRpl || "0")
      );
    },
    renderCell: ({ value, row: { type } }) => (
      <Stack direction="row" spacing={1} alignItems="baseline">
        {type === "ongoing" && (
          <Typography component="span" variant="inherit" color="text.secondary">
            &ge;
          </Typography>
        )}
        <CurrencyValue size="small" currency="rpl" value={value} />
      </Stack>
    ),
  },
];

export default function NodePeriodicRewardsTable({ sx, nodeAddress }) {
  let [pageSize, setPageSize] = useState(3);
  let finalized = useNodeFinalizedRewardSnapshots({ nodeAddress });
  let pending = useNodePendingRewardSnapshot({ nodeAddress });
  let ongoing = useNodeOngoingRewardSnapshot({ nodeAddress });
  let columns = INTERVAL_COLS;
  let maxWidth = columns.reduce((sum, { width }) => sum + width, 0);
  let rows = []
    // The now ongoing interval, precomputed
    .concat(ongoing ? [ongoing] : [])
    // The just-finished interval pending oDAO consensus
    .concat(pending ? [pending] : [])
    // The finished and finalized intervals ready for claiming
    .concat(finalized);
  return (
    <div style={{ display: "flex", maxWidth }}>
      <div style={{ flexGrow: 1 }}>
        <DataGrid
          sx={{ ...sx }}
          autoHeight
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          pagination
          rowsPerPageOptions={[3, 10, 20, 50, 100]}
          rows={rows}
          getRowId={({ type, rewardIndex }) =>
            type === "local" ? "local" : rewardIndex
          }
          columns={columns}
          initialState={{
            sorting: {
              sortModel: [
                {
                  field: "rewardIndex",
                  sort: "desc",
                },
              ],
            },
          }}
          disableSelectionOnClick
        />
      </div>
    </div>
  );
}
