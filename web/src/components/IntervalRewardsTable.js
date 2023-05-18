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
import { useState } from "react";
import useRewardSnapshot from "../hooks/useRewardSnapshot";
import { DataGrid } from "@mui/x-data-grid";

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
    width: 160,
    sortComparator: BNSortComparator,
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
  let [pageSize, setPageSize] = useState(3);
  let snapshot = useRewardSnapshot({ rewardIndex });
  let { isOngoing, nodeRewards } = snapshot || {};
  let nodeAddresses = Object.keys(nodeRewards || {});
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
    <DataGrid
      sx={{ width: "100%", minHeight: 240 }}
      autoHeight
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      pagination
      rowsPerPageOptions={[5, 10, 20, 50, 100]}
      rows={rows}
      getRowId={({ nodeAddress }) => nodeAddress}
      columns={INTERVAL_COLS}
      initialState={{
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
  );
}
