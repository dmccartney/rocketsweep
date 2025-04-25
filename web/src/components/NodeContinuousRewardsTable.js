import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormHelperText,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { ethers } from "ethers";
import {
  useContract,
  useContractWrite,
  usePrepareContractWrite,
  useWebSocketProvider,
} from "wagmi";
import useMinipoolDetails from "../hooks/useMinipoolDetails";
import {
  BNSortComparator,
  delegateUpgradeInterface,
  distributeBalanceInterface,
  etherscanUrl,
  MinipoolStatusNameByValue,
  MinipoolStatus,
  rocketscanUrl,
  shortenAddress,
} from "../utils";
import DistributeEfficiencyAlert from "./DistributeEfficiencyAlert";
import GasInfoFooter from "./GasInfoFooter";
import CurrencyValue from "./CurrencyValue";
import useCanConnectedAccountWithdraw from "../hooks/useCanConnectedAccountWithdraw";
import useGasPrice from "../hooks/useGasPrice";
import DataToolbar from "./DataToolbar";
import _ from "lodash";

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
          // variant="outlined"
          // color="inherit"
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
    field: "distribute",
    headerName: "Skimming etc",
    width: 125,
    disableExport: true,
    sortable: false,
    renderCell: ({ row }) => {
      let balance = ethers.BigNumber.from(row.balance || "0");
      let hasBalance = balance.gt(ethers.constants.Zero);
      if (!hasBalance || row.status !== MinipoolStatus.staking) {
        return "";
      }
      return row.upgraded ? (
        <DistributeButton
          nodeAddress={row.nodeAddress}
          minipoolAddress={row.minipoolAddress}
          upgraded={row.upgraded}
          balance={balance}
          nodeBalance={ethers.BigNumber.from(row.nodeBalance || "0")}
        />
      ) : (
        <UpgradeButton
          nodeAddress={row.nodeAddress}
          minipoolAddress={row.minipoolAddress}
          upgraded={row.upgraded}
        />
      );
    },
  },
  {
    field: "balance",
    headerName: "Balance",
    type: "number",
    width: 120,
    sortComparator: BNSortComparator,
    valueFormatter: (params) => ethers.utils.formatEther(params.value || 0),
    valueGetter: ({ value, row }) =>
      ethers.BigNumber.from(
        row.status !== MinipoolStatus.staking ? "0" : value || "0"
      ),
    renderCell: ({ value, row }) => {
      if (!value) {
        return <CircularProgress size="1em" />;
      }
      return <CurrencyValue size="small" currency="eth" value={value} />;
    },
  },
  {
    field: "nodeBalance",
    headerName: "Your Share",
    type: "number",
    width: 120,
    sortComparator: BNSortComparator,
    valueFormatter: (params) => ethers.utils.formatEther(params.value || 0),
    valueGetter: ({ value, row }) =>
      ethers.BigNumber.from(
        row.status !== MinipoolStatus.staking ? "0" : value || "0"
      ),
    renderCell: ({ value, row }) => {
      if (!row.upgraded || value.isZero()) {
        return "";
      }
      return <CurrencyValue size="small" currency="eth" value={value} />;
    },
  },
  {
    field: "protocolBalance",
    headerName: "rETH Share",
    type: "number",
    width: 120,
    sortComparator: BNSortComparator,
    valueFormatter: (params) => ethers.utils.formatEther(params.value || 0),
    valueGetter: ({ value, row }) =>
      ethers.BigNumber.from(
        row.status !== MinipoolStatus.staking ? "0" : value || "0"
      ),
    renderCell: ({ value, row }) => {
      if (!row.upgraded || value.isZero()) {
        return "";
      }
      return <CurrencyValue size="small" currency="eth" value={value} />;
    },
  },
  {
    field: "status",
    headerName: "Status",
    width: 195,
    valueGetter: ({ value, row: { upgraded, isFinalized } }) =>
      value === MinipoolStatus.staking && isFinalized
        ? "finalized"
        : !MinipoolStatusNameByValue[value]
        ? ""
        : upgraded
        ? MinipoolStatusNameByValue[value]
        : `${MinipoolStatusNameByValue[value] || ""} (unupgraded)`,
  },
];

function DistributeButtonTooltip({ gasAmount, nodeTotal }) {
  const gasPrice = useGasPrice();
  const estGas = gasPrice.mul(gasAmount);
  return (
    <Stack direction="column" spacing={1} sx={{ m: 1 }}>
      <Stack direction="column" spacing={0} sx={{ m: 0, mb: 1 }}>
        <Stack
          direction="row"
          alignItems="baseline"
          justifyContent="space-between"
        >
          <CurrencyValue
            value={nodeTotal.sub(estGas)}
            currency="eth"
            placeholder="0"
          />
        </Stack>
        <FormHelperText sx={{ m: 0 }}>
          approximate receipts (after gas)
        </FormHelperText>
      </Stack>
      <DistributeEfficiencyAlert gasAmount={gasAmount} nodeTotal={nodeTotal} />
      <GasInfoFooter gasAmount={gasAmount} />
    </Stack>
  );
}

function DistributeButton({
  balance,
  nodeBalance,
  minipoolAddress,
  nodeAddress,
  upgraded,
}) {
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  // over 8 ETH you can only distribute and finalize the minipool.
  let hasTooHighBalance = balance.gt(ethers.utils.parseEther("8"));
  let disabled = !upgraded || !canWithdraw;
  const prep = usePrepareContractWrite({
    address: minipoolAddress,
    abi: distributeBalanceInterface,
    functionName: "distributeBalance",
    args: [!hasTooHighBalance], // rewardsOnly
    enabled: !disabled,
  });
  let [estimateGasAmount, setEstimateGasAmount] = useState(
    ethers.BigNumber.from(104000)
  );
  let provider = useWebSocketProvider();
  let mp = useContract({
    address: minipoolAddress,
    abi: distributeBalanceInterface,
    signerOrProvider: provider,
  });
  useEffect(() => {
    if (!mp) {
      return;
    }
    let cancelled = false;
    mp.estimateGas
      .distributeBalance(!hasTooHighBalance)
      .then((estimate) => !cancelled && setEstimateGasAmount(estimate))
      // .catch((err) => !cancelled && console.log("error estimating gas", err));
      .catch((ignore) => {});
    return () => (cancelled = true);
  }, [mp, hasTooHighBalance]);

  let distribute = useContractWrite({
    ...prep.config,
  });
  const gasAmount = prep.data?.request?.gasLimit || estimateGasAmount;
  return (
    <Tooltip
      arrow
      title={
        <DistributeButtonTooltip
          gasAmount={gasAmount}
          nodeTotal={nodeBalance}
          total={balance}
        />
      }
    >
      <Box sx={{ cursor: !disabled ? "inherit" : "not-allowed" }}>
        <Button
          onClick={() => distribute.writeAsync()}
          size="small"
          variant="outlined"
          color="primary"
          disabled={disabled}
          sx={(theme) => ({
            "&.Mui-disabled": {
              borderColor: theme.palette.gray.main,
              color: theme.palette.gray.main,
            },
          })}
        >
          {hasTooHighBalance ? "Finalize" : "Distribute"}
        </Button>
      </Box>
    </Tooltip>
  );
}

function UpgradeButton({ nodeAddress, minipoolAddress, upgraded }) {
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  let disabled = upgraded || !canWithdraw;
  const prep = usePrepareContractWrite({
    address: minipoolAddress,
    abi: delegateUpgradeInterface,
    functionName: "delegateUpgrade",
    args: [],
    enabled: !disabled,
  });
  let [estimateGasAmount, setEstimateGasAmount] = useState(
    ethers.BigNumber.from(104000)
  );
  let provider = useWebSocketProvider();
  let mp = useContract({
    address: minipoolAddress,
    abi: delegateUpgradeInterface,
    signerOrProvider: provider,
  });
  useEffect(() => {
    if (!mp) {
      return;
    }
    let cancelled = false;
    mp.estimateGas
      .delegateUpgrade()
      .then((estimate) => !cancelled && setEstimateGasAmount(estimate))
      // .catch((err) => !cancelled && console.log("error estimating gas", err));
      .catch((ignore) => {});
    return () => (cancelled = true);
  }, [mp]);

  let performUpgrade = useContractWrite({
    ...prep.config,
  });
  const gasAmount = prep.data?.request?.gasLimit || estimateGasAmount;
  return (
    <Tooltip
      arrow
      title={
        <Stack
          direction="column"
          spacing={1}
          alignItems="center"
          sx={{ p: 1, width: 250 }}
        >
          <Typography color="text.secondary" variant="caption">
            Distributing rewards requires upgrading the minipool delegate first.
          </Typography>
          <GasInfoFooter gasAmount={gasAmount} />
        </Stack>
      }
    >
      <Box sx={{ cursor: !disabled ? "inherit" : "not-allowed" }}>
        <Button
          onClick={() => performUpgrade.writeAsync()}
          size="small"
          variant="outlined"
          color="primary"
          disabled={disabled}
          sx={(theme) => ({
            "&.Mui-disabled": {
              borderColor: theme.palette.gray.main,
              color: theme.palette.gray.main,
            },
          })}
        >
          Upgrade
        </Button>
      </Box>
    </Tooltip>
  );
}

export default function NodeContinuousRewardsTable({
  sx,
  nodeAddress,
  header,
}) {
  let minipools = useMinipoolDetails(nodeAddress);
  let columns = MINIPOOL_COLS;
  let maxWidth = columns.reduce((sum, { width }) => sum + width, 0);
  return (
    <div style={{ display: "flex", maxWidth }}>
      <div style={{ flexGrow: 1, width: "100%" }}>
        <DataGrid
          sx={{ ...sx }}
          slots={{ toolbar: DataToolbar }}
          slotProps={{
            toolbar: {
              header,
              fileName: `rocketsweep-node-${nodeAddress}-continuous-rewards`,
              isLoading: _.some(minipools, (mp) => mp.isLoading),
            },
          }}
          density="compact"
          rowSelection={false}
          autoHeight
          pagination
          pageSizeOptions={[3, 10, 20, 50, 100]}
          rows={minipools.map((mp) => ({ ...mp, nodeAddress }))}
          getRowId={({ minipoolAddress }) => minipoolAddress}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 3 } },
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
      </div>
    </div>
  );
}
