import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Chip,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { CheckCircle, HourglassTop } from "@mui/icons-material";
import { ethers } from "ethers";
import moment from "moment";
import { BNSortComparator } from "../utils";
import ClaimAndStakeForm from "./ClaimAndStakeForm";
import CurrencyValue from "./CurrencyValue";
import useCanConnectedAccountWithdraw from "../hooks/useCanConnectedAccountWithdraw";
import useK from "../hooks/useK";
import useNodeFinalizedRewardSnapshots from "../hooks/useNodeFinalizedRewardSnapshots";
import useNodePendingRewardSnapshot from "../hooks/useNodePendingRewardSnapshot";
import useNodeOngoingRewardSnapshot from "../hooks/useNodeOngoingRewardSnapshot";
import _ from "lodash";

function ClaimButtonGroup({
  type,
  nodeAddress,
  rewardIndex,
  totalEth,
  totalRpl,
  merkleProof,
}) {
  let { data: isClaimed, isLoading } =
    useK.RocketMerkleDistributorMainnet.Read.isClaimed({
      args: [rewardIndex, nodeAddress],
    });
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  if (isLoading) {
    return <Skeleton variant="circular" width={20} height={20} />;
  }
  if (type !== "finalized") {
    return (
      <Button size="small" disabled color="inherit" endIcon={<HourglassTop />}>
        {_.capitalize(type)}
      </Button>
    );
  }
  if (isClaimed) {
    return (
      <Button size="small" disabled color="inherit" endIcon={<CheckCircle />}>
        Claimed
      </Button>
    );
  }
  return (
    <ClaimAndStakeForm
      sx={{
        cursor: canWithdraw ? undefined : "not-allowed",
      }}
      buttonProps={{
        size: "small",
        label: "Claim",
        // color: canWithdraw ? "rpl" : "gray",
      }}
      sliderProps={{
        size: "small",
        color: canWithdraw ? "rpl" : "gray",
        sx: {
          width: 144,
          pb: 0,
        },
      }}
      nodeAddress={nodeAddress}
      rewardIndexes={[rewardIndex]}
      amountsEth={[totalEth]}
      amountsRpl={[totalRpl]}
      merkleProofs={[merkleProof]}
    />
  );
}

const INTERVAL_COLS = [
  {
    field: "rewardIndex",
    headerName: "Interval",
    width: 175,
    renderCell: ({
      row: { type, rewardIndex, endTime, file, nodeAddressOrName },
    }) => {
      let when = endTime ? moment(1000 * endTime) : null;
      return (
        <Tooltip arrow title={when?.toLocaleString() || ""}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography>#{rewardIndex}</Typography>
            <Chip
              size="medium"
              variant={type === "finalized" ? "contained" : "outlined"}
              label={`${when?.fromNow() || "ongoing"}`}
            />
          </Stack>
        </Tooltip>
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
          isClaimed={value}
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
        <CurrencyValue size="small" currency="eth" value={value} />
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

export default function PeriodicRewardsTable({ sx, nodeAddress }) {
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
