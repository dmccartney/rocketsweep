import useK from "../hooks/useK";
import {
  Button,
  Stack,
  Tooltip,
  tooltipClasses,
  Typography,
} from "@mui/material";
import { CheckCircle, HourglassTop } from "@mui/icons-material";
import NodeRewardsSummaryCard from "./NodeRewardsSummaryCard";
import WalletChip from "./WalletChip";
import { BNSortComparator } from "../utils";
import { ethers } from "ethers";
import CurrencyValue from "./CurrencyValue";
import useRewardSnapshot from "../hooks/useRewardSnapshot";
import { DataGrid } from "@mui/x-data-grid";
import DataToolbar from "./DataToolbar";

function ClaimIndicator({ isOngoing, rewardIndex, nodeAddress }) {
  let { data: isClaimed, isLoading } =
    useK.RocketMerkleDistributorMainnet.Read.isClaimed({
      args: [rewardIndex, nodeAddress],
      enabled: !isOngoing,
    });
  if (isLoading) {
    return null;
  }
  return (
    <Button
      disabled
      endIcon={
        isClaimed ? <CheckCircle /> : isOngoing ? <HourglassTop /> : null
      }
    >
      {isClaimed ? "Claimed" : isOngoing ? "Ongoing" : "Unclaimed"}
    </Button>
  );
}

const INTERVAL_COLS = [
  {
    field: "nodeAddress",
    type: "string",
    headerName: "Operator",
    width: 200,
    sortable: false,
    renderCell: ({ value }) => {
      return (
        <Tooltip
          arrow
          slotProps={{
            popper: {
              sx: {
                [`& .${tooltipClasses.tooltip}`]: {
                  p: 0,
                  maxWidth: 420,
                },
              },
            },
          }}
          title={
            <NodeRewardsSummaryCard
              asLink
              sx={{ width: 400 }}
              nodeAddress={value}
              size="small"
            />
          }
        >
          <span>
            <WalletChip
              walletAddress={value}
              size={"medium"}
              avatarSize={32}
              to={(addressOrName) => `/node/${addressOrName}`}
            />
          </span>
        </Tooltip>
      );
    },
  },
  {
    field: "isClaimed",
    headerName: "Claimed",
    width: 150,
    disableExport: true, // derived fields don't sort/export properly.
    sortable: false,
    renderCell: ({ row }) => {
      let { isOngoing, nodeAddress, rewardIndex } = row;
      return (
        <ClaimIndicator
          isOngoing={isOngoing}
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
    width: 175,
    sortComparator: BNSortComparator,
    valueFormatter: (params) => ethers.utils.formatEther(params.value || 0),
    valueGetter: ({ value }) => ethers.BigNumber.from(value || 0),
    renderCell: ({ value, row: { isOngoing } }) => (
      <Stack direction="row" spacing={1} alignItems="baseline">
        {isOngoing && (
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
    width: 175,
    sortComparator: BNSortComparator,
    valueFormatter: (params) => ethers.utils.formatEther(params.value || 0),
    valueGetter: ({ row }) =>
      ethers.BigNumber.from(row.collateralRpl || 0).add(
        ethers.BigNumber.from(row.oracleDaoRpl || 0)
      ),
    renderCell: ({ value, row: { isOngoing } }) => (
      <Stack direction="row" spacing={1} alignItems="baseline">
        {isOngoing && (
          <Typography component="span" variant="inherit" color="text.secondary">
            &ge;
          </Typography>
        )}
        <CurrencyValue size="small" currency="rpl" value={value} />
      </Stack>
    ),
  },
];

export default function IntervalRewardsTable({
  rewardIndex,
  filter,
  filterAddress,
}) {
  let snapshot = useRewardSnapshot({ rewardIndex });
  let { isOngoing, nodeRewards } = snapshot || {};
  let nodeAddresses = Object.keys(nodeRewards || {});
  let maxWidth = INTERVAL_COLS.reduce((sum, { width }) => sum + width, 0);
  let rows = nodeAddresses
    .filter(
      (nodeAddress) =>
        !filter ||
        nodeAddress.toLowerCase().indexOf(filter.toLowerCase()) !== -1 ||
        (filterAddress &&
          nodeAddress.toLowerCase() === filterAddress.toLowerCase())
    )
    .map((nodeAddress) => ({
      nodeAddress,
      isOngoing,
      rewardIndex,
      ...nodeRewards[nodeAddress],
    }));
  return (
    <div style={{ display: "flex", maxWidth }}>
      <div style={{ flexGrow: 1, width: "100%" }}>
        <DataGrid
          sx={{ width: "100%", minHeight: 240 }}
          slots={{ toolbar: DataToolbar }}
          slotProps={{
            toolbar: {
              fileName: `rocketsweep-interval-${rewardIndex}-rewards`,
              isLoading: rows.length < 1,
            },
          }}
          density="compact"
          rowSelection={false}
          autoHeight
          pagination
          pageSizeOptions={[3, 10, 20, 50, 100]}
          rows={rows}
          getRowId={({ nodeAddress }) => nodeAddress}
          columns={INTERVAL_COLS}
          initialState={{
            pagination: { paginationModel: { pageSize: 3 } },
            sorting: {
              sortModel: [
                {
                  field: "totalRpl",
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
