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
  useTheme,
} from "@mui/material";
import { OpenInNew, Warning } from "@mui/icons-material";
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
    headerName: "",
    width: 150,
    sortable: false,
    renderCell: ({ row }) => {
      let balance = ethers.BigNumber.from(row.balance || "0");
      let hasBalance = balance.gt(ethers.constants.Zero);
      if (!hasBalance || row.status !== MinipoolStatus.staking) {
        return "";
      }
      return (
        <DistributeButton
          nodeAddress={row.nodeAddress}
          minipoolAddress={row.minipoolAddress}
          balance={balance}
          nodeBalance={ethers.BigNumber.from(row.nodeBalance || "0")}
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
    valueGetter: ({ value, row: { upgraded } }) =>
      !MinipoolStatusNameByValue[value]
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
}) {
  let theme = useTheme();
  let canWithdraw = useCanConnectedAccountWithdraw(nodeAddress);
  let hasLowBalance = nodeBalance.lt(ethers.utils.parseEther("0.4"));
  let hasTooHighBalance = balance.gt(ethers.utils.parseEther("8"));
  let disabled = !canWithdraw || hasTooHighBalance; // over 8 ETH you cannot skim rewards.
  const prep = usePrepareContractWrite({
    address: minipoolAddress,
    abi: distributeBalanceInterface,
    functionName: "distributeBalance",
    args: [true], // rewardsOnly
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
    if (!mp || hasTooHighBalance) {
      return;
    }
    let cancelled = false;
    mp.estimateGas
      .distributeBalance(true)
      .then((estimate) => !cancelled && setEstimateGasAmount(estimate))
      .catch((err) => !cancelled && console.log("error estimating gas", err));
    return () => (cancelled = true);
  }, [mp, hasTooHighBalance]);

  let distribute = useContractWrite({
    ...prep.config,
  });
  const gasAmount = prep.data?.request?.gasLimit || estimateGasAmount;
  return (
    <Tooltip
      arrow
      slotProps={{
        tooltip: { sx: { backgroundColor: theme.palette.grey[800] } },
        arrow: { sx: { color: theme.palette.grey[800] } },
      }}
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
          endIcon={hasLowBalance ? <Warning /> : null}
        >
          Distribute
        </Button>
      </Box>
    </Tooltip>
  );
}

export default function MinipoolRewardsTable({ sx, nodeAddress }) {
  let [pageSize, setPageSize] = useState(5);
  let minipools = useMinipoolDetails(nodeAddress);
  let columns = MINIPOOL_COLS;
  let maxWidth = columns.reduce((sum, { width }) => sum + width, 0);
  return (
    <div style={{ display: "flex", maxWidth }}>
      <div style={{ flexGrow: 1 }}>
        <DataGrid
          sx={{ ...sx }}
          autoHeight
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          pagination
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
          rows={minipools.map((mp) => ({ ...mp, nodeAddress }))}
          getRowId={({ minipoolAddress }) => minipoolAddress}
          columns={columns}
          initialState={{
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
