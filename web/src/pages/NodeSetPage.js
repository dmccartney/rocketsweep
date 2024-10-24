import Layout from "../components/Layout";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import useK from "../hooks/useK";
import _ from "lodash";
import WalletChip from "../components/WalletChip";
import NodeSetIcon from "../components/NodeSetIcon";
import CurrencyValue from "../components/CurrencyValue";
import { ethers } from "ethers";
import { etherscanUrl, shortenAddress } from "../utils";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useTransaction, useBalance } from "wagmi";
import moment from "moment";
import { useState } from "react";
import contracts from "../contracts";
import useBlock from "../hooks/useBlock";
import { Link } from "react-router-dom";
import useRplEthPrice from "../hooks/useRplEthPrice";
import useNodeDetails from "../hooks/useNodeDetails";
import { RadialBar, RadialBarChart } from "recharts";

export default function NodeSetPage() {
  return (
    <Layout>
      <Grid container columnSpacing={3} rowSpacing={5}>
        {/* TODO */}
        {/*<Grid key={"rocket-deposit-pool"} item xs={12} lg={4}>*/}
        {/*  <RocketDepositCard/>*/}
        {/*</Grid>*/}
        <Grid key={"minipools"} item xs={12} lg={4}>
          <NodeSetMiniPoolsColumn />
        </Grid>
        <Grid key={"nodeset-eth-deposit-pool"} item xs={12} lg={4}>
          <NodeEthDepositColumn />
        </Grid>
        <Grid key={"nodeset-rpl-deposit-pool"} item xs={12} lg={4}>
          <NodeRplDepositColumn />
        </Grid>
      </Grid>
    </Layout>
  );
}

function NodeRplDepositColumn() {
  let [isShowingAll, setShowingAll] = useState(false);
  let { data: depositsInOrder } = useK.RPLVault.Find.Deposit({
    args: [null, null],
    from: 0,
    to: "latest",
  });
  let { data: withdrawalsInOrder } = useK.RPLVault.Find.Withdraw({
    args: [null, null],
    from: 0,
    to: "latest",
  });
  let { data: withdrawableRPL } = useK.RPL.Read.balanceOf({
    args: [contracts.RPLVault.address],
  });
  let { data: stakableRPL } = useK.RPL.Read.balanceOf({
    args: [contracts.OperatorDistributor.address],
  });
  let deposits = _.reverse(_.clone(depositsInOrder || []));
  let withdrawals = _.reverse(_.clone(withdrawalsInOrder || []));
  let totalDepositedRpl = deposits.reduce(
    (sum, { args: [, , assets] }) => sum.add(assets),
    ethers.BigNumber.from(0)
  );
  let totalWithdrawnRpl = withdrawals.reduce(
    (sum, { args: [, , , assets] }) => sum.add(assets),
    ethers.BigNumber.from(0)
  );
  return (
    <Stack spacing={1}>
      <Card key={"summary"}>
        <CardActionArea
          href={`https://app.gravitaprotocol.com/constellation/xrpl`}
          target="_blank"
        >
          <CardHeader
            avatar={<NodeSetIcon fontSize="medium" color="disabled" />}
            subheader="NodeSet xRPL Deposits"
          />
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={"row"} alignItems={"baseline"} spacing={1}>
                <Chip component="span" size="small" label={deposits.length} />
                <Typography variant={"caption"} color={"text.secondary"}>
                  deposits from
                </Typography>
                <Chip
                  component="span"
                  size="small"
                  label={
                    _.uniq(
                      deposits.map(({ args: [senderAddress] }) => senderAddress)
                    ).length
                  }
                />
                <Typography variant={"caption"} color={"text.secondary"}>
                  depositors.
                </Typography>
              </Stack>
              <Grid container>
                <Grid item xs={6}>
                  <Stack spacing={1}>
                    <Typography variant={"overline"} color={"text.secondary"}>
                      Deposits
                    </Typography>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={totalDepositedRpl}
                        placeholder="0"
                        size="small"
                        currency="rpl"
                        maxDecimals={0}
                      />
                    </Stack>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={totalWithdrawnRpl?.mul(-1)}
                        placeholder="0"
                        size="xsmall"
                        currency="rpl"
                        maxDecimals={1}
                      />
                      <Typography variant={"caption"} color={"text.secondary"}>
                        withdrawn
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack spacing={1}>
                    <Typography variant={"overline"} color={"text.secondary"}>
                      Available
                    </Typography>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={stakableRPL}
                        placeholder="0"
                        size="small"
                        currency="rpl"
                        maxDecimals={1}
                      />
                      <Typography variant={"caption"} color={"text.secondary"}>
                        for staking
                      </Typography>
                    </Stack>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={withdrawableRPL}
                        placeholder="0"
                        size="xsmall"
                        currency="rpl"
                        maxDecimals={1}
                      />
                      <Typography variant={"caption"} color={"text.secondary"}>
                        for withdraw
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
      <Stack spacing={1}>
        {deposits
          .slice(0, isShowingAll ? deposits.length : 3)
          .map(({ transactionHash, args: [senderAddress, , amountRpl] }) => (
            <RplDepositCard
              key={transactionHash}
              {...{ transactionHash, senderAddress, amountRpl }}
            />
          ))}
        {deposits.length > 0 && (
          <Button
            sx={{ mt: 1 }}
            fullWidth
            color={"inherit"}
            onClick={() => setShowingAll(!isShowingAll)}
            endIcon={isShowingAll ? <ExpandLess /> : <ExpandMore />}
          >
            See All
            <Chip
              sx={{ ml: 1, mr: 1 }}
              component="span"
              size="small"
              label={deposits.length}
            />
            deposits
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

function NodeEthDepositColumn() {
  let [isShowingAll, setShowingAll] = useState(false);
  let { data: depositsInOrder } = useK.WETHVault.Find.Deposit({
    args: [null, null],
    from: 0,
    to: "latest",
  });
  let { data: withdrawalsInOrder } = useK.WETHVault.Find.Withdraw({
    args: [null, null],
    from: 0,
    to: "latest",
  });
  let { data: withdrawableETH } = useK.WETH.Read.balanceOf({
    args: [contracts.WETHVault.address],
  });
  let { data: opBalance } = useBalance({
    address: contracts.OperatorDistributor.address,
  });
  let minipoolCreatableEth = opBalance?.value;
  let deposits = _.reverse(_.clone(depositsInOrder || []));
  let withdrawals = _.reverse(_.clone(withdrawalsInOrder || []));
  let totalDepositedEth = deposits.reduce(
    (sum, { args: [, , assets] }) => sum.add(assets),
    ethers.BigNumber.from(0)
  );
  let totalWithdrawnEth = withdrawals.reduce(
    (sum, { args: [, , , assets] }) => sum.add(assets),
    ethers.BigNumber.from(0)
  );
  return (
    <Stack spacing={1}>
      <Card key={"summary"}>
        <CardActionArea
          href={`https://app.gravitaprotocol.com/constellation/xreth`}
          target="_blank"
        >
          <CardHeader
            avatar={<NodeSetIcon fontSize="medium" color="disabled" />}
            subheader="NodeSet xrETH Deposits"
          />
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={"row"} alignItems={"baseline"} spacing={1}>
                <Chip component="span" size="small" label={deposits.length} />
                <Typography variant={"caption"} color={"text.secondary"}>
                  deposits from
                </Typography>
                <Chip
                  component="span"
                  size="small"
                  label={
                    _.uniq(
                      deposits.map(({ args: [senderAddress] }) => senderAddress)
                    ).length
                  }
                />
                <Typography variant={"caption"} color={"text.secondary"}>
                  depositors.
                </Typography>
              </Stack>
              <Grid container>
                <Grid item xs={6}>
                  <Stack spacing={1}>
                    <Typography variant={"overline"} color={"text.secondary"}>
                      Deposits
                    </Typography>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={totalDepositedEth}
                        placeholder="0"
                        size="small"
                        currency="eth"
                        maxDecimals={0}
                      />
                    </Stack>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={totalWithdrawnEth?.mul(-1)}
                        placeholder="0"
                        size="xsmall"
                        currency="eth"
                        maxDecimals={1}
                      />
                      <Typography variant={"caption"} color={"text.secondary"}>
                        withdrawn
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack spacing={1}>
                    <Typography variant={"overline"} color={"text.secondary"}>
                      Available
                    </Typography>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={minipoolCreatableEth}
                        placeholder="0"
                        size="small"
                        currency="eth"
                        maxDecimals={1}
                      />
                      <Typography variant={"caption"} color={"text.secondary"}>
                        for minipools
                      </Typography>
                    </Stack>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={withdrawableETH}
                        placeholder="0"
                        size="xsmall"
                        currency="eth"
                        maxDecimals={1}
                      />
                      <Typography variant={"caption"} color={"text.secondary"}>
                        for withdraw
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
      <Stack spacing={1}>
        {deposits
          .slice(0, isShowingAll ? deposits.length : 3)
          .map(({ transactionHash, args: [senderAddress, , amountEth] }) => (
            <EthDepositCard
              key={transactionHash}
              transactionHash={transactionHash}
              senderAddress={senderAddress}
              amountEth={amountEth}
            />
          ))}
        {deposits.length > 0 && (
          <Button
            sx={{ mt: 1 }}
            fullWidth
            color={"inherit"}
            onClick={() => setShowingAll(!isShowingAll)}
            endIcon={isShowingAll ? <ExpandLess /> : <ExpandMore />}
          >
            See All
            <Chip
              sx={{ ml: 1, mr: 1 }}
              component="span"
              size="small"
              label={deposits.length}
            />
            deposits
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

function RplDepositCard({ transactionHash, senderAddress, amountRpl }) {
  return (
    <Card>
      <CardActionArea
        href={etherscanUrl({ tx: transactionHash })}
        target="_blank"
      >
        <CardHeader
          sx={{ pt: 3 }}
          disableTypography
          title={<WalletChip walletAddress={senderAddress} />}
          subheader={
            <Typography
              component={"div"}
              sx={{ pt: 2, ml: 3 }}
              variant={"caption"}
              color={"text.secondary"}
            >
              deposited
            </Typography>
          }
          action={
            <Stack alignItems={"flex-end"} sx={{ mt: 1, mr: 1 }} spacing={1}>
              <CurrencyValue
                value={amountRpl}
                maxDecimals={2}
                currency={"rpl"}
                size={"medium"}
              />
              <TransactionTimeAgoCaption tx={transactionHash} />
            </Stack>
          }
        />
      </CardActionArea>
    </Card>
  );
}

function EthDepositCard({ transactionHash, senderAddress, amountEth }) {
  return (
    <Card>
      <CardActionArea
        href={etherscanUrl({ tx: transactionHash })}
        target="_blank"
      >
        <CardHeader
          sx={{ pt: 3 }}
          disableTypography
          title={<WalletChip walletAddress={senderAddress} />}
          subheader={
            <Typography
              component={"div"}
              sx={{ pt: 2, ml: 3 }}
              variant={"caption"}
              color={"text.secondary"}
            >
              deposited
            </Typography>
          }
          action={
            <Stack alignItems={"flex-end"} sx={{ mt: 1, mr: 1 }} spacing={1}>
              <CurrencyValue
                value={amountEth}
                maxDecimals={2}
                currency={"eth"}
                size={"medium"}
              />
              <TransactionTimeAgoCaption tx={transactionHash} />
            </Stack>
          }
        />
      </CardActionArea>
    </Card>
  );
}

function NodeSetWalletChip({ walletAddress }) {
  return (
    <Box sx={{ position: "relative" }}>
      <WalletChip walletAddress={walletAddress} />
      <Avatar
        sx={{
          position: "absolute",
          bottom: 0,
          left: 24,
          width: 20,
          height: 20,
          bgcolor: "white",
          color: "black",
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <NodeSetIcon sx={{ width: 12, height: 12 }} />
      </Avatar>
    </Box>
  );
}

const oneEth = ethers.utils.parseEther("1");
function NodeSetMiniPoolsColumn() {
  let [isShowingAll, setShowingAll] = useState(false);
  let rplEthPrice = useRplEthPrice(ethers.utils.parseEther(".004")); // default until loaded
  const { data: superNodeDetails } = useNodeDetails({
    nodeAddress: contracts.SuperNodeAccount.address,
  });
  let { data: minimumStakeRatio } =
    useK.OperatorDistributor.Read.minimumStakeRatio();
  minimumStakeRatio = minimumStakeRatio || oneEth;
  let { rplStake } = superNodeDetails || {
    rplStake: ethers.constants.Zero,
  };
  let rplStakedInEth = rplStake.mul(rplEthPrice).div(oneEth);
  let { isLoading, data: minipoolsInOrder } =
    useK.SuperNodeAccount.Find.MinipoolCreated({
      args: [null, null],
      from: 0,
      to: "latest",
    });
  let minipools = _.reverse(_.clone(minipoolsInOrder || []));

  // TODO: detect no-longer active minipools
  let activeMinipools = minipools || [];

  let maxMinipoolCountByRpl = rplStakedInEth
    .mul(oneEth)
    .div(minimumStakeRatio)
    .div(ethers.utils.parseEther("24"))
    .toNumber();
  let { data: xREthBalance } = useBalance({
    address: contracts.OperatorDistributor.address,
  });
  let { data: rEthBalance } = useBalance({
    address: contracts.RocketVault.address,
  });
  let moreMinipoolCountByXREth = xREthBalance?.value
    .div(ethers.utils.parseEther("8"))
    .toNumber();
  let moreMinipoolCountByREth = rEthBalance?.value
    .div(ethers.utils.parseEther("24"))
    .toNumber();
  let moreMinipoolCountByRpl = maxMinipoolCountByRpl - activeMinipools.length;
  let rplPerMinipool = ethers.utils
    .parseEther("24")
    .mul(minimumStakeRatio)
    .div(rplEthPrice);
  let moreRplRequiredForAnother =
    moreMinipoolCountByRpl > 0
      ? ethers.constants.Zero
      : ethers.utils
          .parseEther("24")
          .mul(activeMinipools.length + 1)
          .mul(minimumStakeRatio)
          .div(ethers.utils.parseEther("1"))
          .sub(rplStakedInEth)
          .mul(ethers.utils.parseEther("1"))
          .div(rplEthPrice);
  let moreXREthRequiredForAnother =
    moreMinipoolCountByXREth > 0
      ? ethers.constants.Zero
      : ethers.utils
          .parseEther("8")
          .sub(xREthBalance?.value || ethers.constants.Zero);
  let moreREthRequiredForAnother =
    moreMinipoolCountByREth > 0
      ? ethers.constants.Zero
      : ethers.utils
          .parseEther("24")
          .sub(rEthBalance?.value || ethers.constants.Zero);
  let moreMinipoolCount = Math.min(
    moreMinipoolCountByXREth,
    moreMinipoolCountByREth,
    moreMinipoolCountByRpl
  );
  let minipoolsByOperator = _.groupBy(
    activeMinipools,
    ({ args: [, operatorAddress] }) => operatorAddress
  );
  let operators = Object.keys(minipoolsByOperator);

  // Gini ref https://en.wikipedia.org/wiki/Gini_coefficient#Definition
  let x = operators.map((operator) => minipoolsByOperator[operator].length);
  let g =
    _.sum(x.map((xi) => _.sum(x.map((xj) => Math.abs(xi - xj))))) /
    (2 * x.length * _.sum(x));
  // HHI ref https://en.wikipedia.org/wiki/Herfindahl%E2%80%93Hirschman_index#Formula
  let hhi = _.sum(x.map((xi) => (xi / minipools.length) ** 2));

  let minipoolsByOperatorByCount = _.groupBy(
    minipoolsByOperator,
    (minipools) => minipools.length
  );
  let data = Object.keys(minipoolsByOperatorByCount).map((nText) => ({
    minipoolCount: Number(nText),
    operatorCount: minipoolsByOperatorByCount[nText].length,
  }));
  const colors = [
    "#8884d8",
    "#83a6ed",
    "#8dd1e1",
    "#82ca9d",
    "#a4de6c",
    "#d0ed57",
    "#ffc658",
    "#ff7043",
  ];
  let radialData = data.map(({ minipoolCount, operatorCount }, i) => ({
    name: `${minipoolCount}`,
    minipoolCount,
    operatorCount: _.sum(
      data.slice(i).map(({ operatorCount }) => operatorCount)
    ),
    fill: colors[i % colors.length],
  }));
  return (
    <Stack spacing={1}>
      <Card key={"summary"}>
        <CardActionArea
          component={Link}
          to={`/node/${contracts.SuperNodeAccount.address}`}
        >
          <CardHeader
            avatar={<NodeSetIcon fontSize="medium" color="disabled" />}
            subheader="NodeSet Minipools"
          />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={1}>
              <Stack
                direction={"row"}
                justifyContent={"center"}
                sx={{ ml: -16 }}
                alignItems={"center"}
                spacing={1}
              >
                <Tooltip
                  title={
                    <Stack
                      direction={"row"}
                      spacing={3}
                      sx={(theme) => ({ color: theme.palette.text.primary })}
                    >
                      <Stack>
                        <Typography
                          variant={"subtitle2"}
                          color={"text.secondary"}
                        >
                          Gini
                        </Typography>
                        <Typography variant={"body2"}>
                          {(100 * g).toFixed(2)}%
                        </Typography>
                      </Stack>
                      <Stack>
                        <Typography
                          variant={"subtitle2"}
                          color={"text.secondary"}
                        >
                          HHI
                        </Typography>
                        <Typography variant={"body2"}>
                          {(100 * hhi).toFixed(2)}%
                        </Typography>
                      </Stack>
                    </Stack>
                  }
                >
                  <Box sx={{ position: "relative" }}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      margin={{
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                      }}
                      width={128}
                      height={128}
                      startAngle={10}
                      endAngle={350}
                      innerRadius="40%"
                      outerRadius="100%"
                      data={radialData}
                    >
                      <RadialBar
                        minAngle={0}
                        background={{ fill: "rgba(128, 128, 128, 0.15)" }}
                        clockWise
                        dataKey="operatorCount"
                      />
                    </RadialBarChart>
                    <Box
                      sx={{
                        position: "absolute",
                        top: "41%",
                        left: "35%",
                        bottom: "50%",
                      }}
                    >
                      <Stack
                        sx={(theme) => ({
                          background: `linear-gradient(90deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 100%)`,
                          borderRadius: 4,
                        })}
                        direction={"row"}
                        alignItems={"baseline"}
                        spacing={1}
                      >
                        <Chip
                          sx={{ cursor: "inherit" }}
                          component="span"
                          size="small"
                          label={
                            isLoading ? (
                              <CircularProgress
                                color="inherit"
                                size={12}
                                sx={{ ml: 0.5, mr: 0.5 }}
                              />
                            ) : (
                              Number(activeMinipools.length).toLocaleString()
                            )
                          }
                        />
                        <Typography
                          variant={"caption"}
                          color={"text.secondary"}
                        >
                          minipools
                        </Typography>
                        <Chip
                          sx={{ cursor: "inherit" }}
                          component="span"
                          size="small"
                          label={
                            isLoading ? (
                              <CircularProgress
                                color="inherit"
                                size={12}
                                sx={{ ml: 0.5, mr: 0.5 }}
                              />
                            ) : (
                              operators.length
                            )
                          }
                        />
                        <Typography
                          variant={"caption"}
                          color={"text.secondary"}
                        >
                          operators
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                </Tooltip>
              </Stack>
              <Stack
                sx={{
                  mt: 0.5,
                  borderRadius: "20px",
                  ...(moreMinipoolCount < 1 || isLoading
                    ? {}
                    : {
                        background: "rgba(128,255,128,0.1)",
                      }),
                }}
                direction={"row"}
                alignItems={"baseline"}
                spacing={1}
              >
                <Chip
                  component="span"
                  size="small"
                  label={isLoading ? "…" : Math.max(0, moreMinipoolCount)}
                />
                <Typography variant={"caption"} color={"text.secondary"}>
                  more from available deposits
                </Typography>
              </Stack>
              <Grid container sx={{ pt: 1 }}>
                <Grid item xs={6}>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="left"
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={ethers.utils
                          .parseEther("32")
                          .mul(activeMinipools.length)}
                        placeholder="0"
                        size="small"
                        currency="eth"
                        maxDecimals={0}
                      />
                      <Typography variant={"caption"} color={"text.secondary"}>
                        staked
                      </Typography>
                    </Stack>
                    <Stack spacing={0} sx={{ pl: 2 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="left"
                        alignItems={"baseline"}
                      >
                        <CurrencyValue
                          value={ethers.utils
                            .parseEther("8")
                            .mul(activeMinipools.length)}
                          placeholder="0"
                          size="xsmall"
                          currency="eth"
                          maxDecimals={0}
                        />
                        <Typography
                          variant={"caption"}
                          color={"text.secondary"}
                        >
                          from
                        </Typography>
                        <NodeSetAvatar />
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="left"
                        alignItems={"baseline"}
                      >
                        <CurrencyValue
                          value={ethers.utils
                            .parseEther("24")
                            .mul(activeMinipools.length)}
                          placeholder="0"
                          size="xsmall"
                          currency="eth"
                          maxDecimals={0}
                        />
                        <Typography
                          variant={"caption"}
                          color={"text.secondary"}
                        >
                          from
                        </Typography>
                        <Typography variant={"caption"} color={"rpl.dark"}>
                          rETH
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack spacing={1}>
                    <Stack
                      direction={"row"}
                      spacing={1}
                      alignItems={"baseline"}
                    >
                      <CurrencyValue
                        value={rplStake}
                        placeholder="0"
                        size="small"
                        currency="rpl"
                        maxDecimals={0}
                      />
                      <Typography variant={"caption"} color={"text.secondary"}>
                        staked
                      </Typography>
                    </Stack>
                    <Stack spacing={0} sx={{ pl: 2 }}>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="baseline"
                      >
                        <Typography variant="caption" color="text.secondary">
                          @
                        </Typography>
                        <CurrencyValue
                          value={rplEthPrice}
                          trimZeroWhole
                          maxDecimals={4}
                          currency={"eth"}
                          perCurrency={"rpl"}
                          size="xsmall"
                        />
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="baseline"
                      >
                        <CurrencyValue
                          prefix={"≈ "}
                          value={rplStakedInEth}
                          trimZeroWhole
                          maxDecimals={0}
                          currency={"eth"}
                          size={"xsmall"}
                        />
                        <Typography
                          variant={"caption"}
                          color={"text.secondary"}
                        >
                          of
                        </Typography>
                        <Typography variant={"caption"} color={"rpl.main"}>
                          RPL
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
              <Stack sx={{ pt: 1 }} spacing={0}>
                <Stack
                  direction="row"
                  alignItems={"center"}
                  spacing={1}
                  sx={{ pb: 1 }}
                >
                  <Typography variant="caption" color={"text.secondary"}>
                    Limiting Factors
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Divider sx={{ m: 0, p: 0 }} flexItem />
                  </Box>
                </Stack>
                <Grid
                  container
                  sx={{
                    mt: 0.5,
                    borderRadius: "20px",
                    ...(moreMinipoolCountByXREth > 0
                      ? {}
                      : {
                          background: "rgba(128,128,128,0.1)",
                        }),
                  }}
                  alignItems={"baseline"}
                >
                  <Grid item xs={3.5}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-end"
                    >
                      <Typography variant="caption" color="eth.main">
                        ETH
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        from
                      </Typography>
                      <NodeSetAvatar />
                    </Stack>
                  </Grid>
                  <Grid item xs={2.5}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-end"
                    >
                      <Chip
                        sx={{ width: "100%", ml: 1, mr: 1 }}
                        component="span"
                        size="small"
                        label={
                          isLoading
                            ? "…"
                            : Math.max(0, moreMinipoolCountByXREth)
                        }
                      />
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-start"
                    >
                      <Typography variant="caption" color="textSecondary">
                        more @
                      </Typography>
                      <CurrencyValue
                        value={ethers.utils.parseEther("8")}
                        trimZeroWhole
                        maxDecimals={0}
                        currency={"eth"}
                        perCurrency={"minipool"}
                        size="xsmall"
                      />
                    </Stack>
                  </Grid>
                </Grid>
                <Grid
                  container
                  sx={{
                    mt: 0.5,
                    borderRadius: "20px",
                    ...(moreMinipoolCountByREth > 0
                      ? {}
                      : {
                          background: "rgba(128,128,128,0.1)",
                        }),
                  }}
                  alignItems={"baseline"}
                >
                  <Grid item xs={3.5}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-end"
                    >
                      <Typography variant="caption" color="eth.main">
                        ETH
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        from
                      </Typography>
                      <Typography variant={"caption"} color={"rpl.dark"}>
                        rETH
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={2.5}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-end"
                    >
                      <Chip
                        sx={{ width: "100%", ml: 1, mr: 1 }}
                        component="span"
                        size="small"
                        label={
                          isLoading ? "…" : Math.max(0, moreMinipoolCountByREth)
                        }
                      />
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-start"
                    >
                      <Typography variant="caption" color="textSecondary">
                        more @
                      </Typography>
                      <CurrencyValue
                        value={ethers.utils.parseEther("24")}
                        trimZeroWhole
                        maxDecimals={0}
                        currency={"eth"}
                        perCurrency={"minipool"}
                        size="xsmall"
                      />
                    </Stack>
                  </Grid>
                </Grid>
                <Grid
                  container
                  // columnSpacing={1}
                  sx={{
                    mt: 0.5,
                    borderRadius: "20px",
                    ...(moreMinipoolCountByRpl > 0
                      ? {}
                      : {
                          background: "rgba(128,128,128,0.1)",
                        }),
                  }}
                  alignItems={"baseline"}
                >
                  <Grid item xs={3.5}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-end"
                    >
                      <Typography variant="caption" color="rpl.main">
                        RPL
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        from
                      </Typography>
                      <NodeSetAvatar />
                    </Stack>
                  </Grid>
                  <Grid item xs={2.5}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-end"
                    >
                      <Chip
                        sx={{ width: "100%", ml: 1, mr: 1 }}
                        component="span"
                        size="small"
                        label={
                          isLoading ? "…" : Math.max(0, moreMinipoolCountByRpl)
                        }
                      />
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack spacing={0}>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="baseline"
                        justifyContent="flex-start"
                      >
                        <Typography variant="caption" color="textSecondary">
                          more @
                        </Typography>
                        <CurrencyValue
                          value={minimumStakeRatio?.mul(100)}
                          trimZeroWhole
                          maxDecimals={0}
                          currency={"ratio"}
                          hideCurrency
                          size="xsmall"
                        />
                        <Typography
                          variant={"caption"}
                          color={"text.secondary"}
                        >
                          % borrow limit
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="baseline"
                      >
                        <Typography variant="caption" color="text.secondary">
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;≈
                        </Typography>
                        <CurrencyValue
                          value={rplPerMinipool.add(
                            ethers.utils.parseEther("1")
                          )}
                          trimZeroWhole
                          maxDecimals={0}
                          currency={"rpl"}
                          perCurrency={"minipool"}
                          size="xsmall"
                        />
                      </Stack>
                    </Stack>
                  </Grid>
                </Grid>
                {isLoading || moreMinipoolCount > 0 || (
                  <Paper
                    sx={{ mt: 2, p: 1 }}
                    elevation={8}
                    icon={false}
                    severity={"info"}
                  >
                    <Stack alignItems={"center"} spacing={1}>
                      <Typography variant={"caption"} color={"text.secondary"}>
                        deposits required for the next minipool
                      </Typography>
                      <Stack alignItems={"center"}>
                        {moreRplRequiredForAnother.gt(0) && (
                          <Stack
                            direction={"row"}
                            alignItems={"baseline"}
                            spacing={0.5}
                          >
                            <CurrencyValue
                              value={moreRplRequiredForAnother.add(
                                ethers.utils.parseEther("1")
                              )}
                              maxDecimals={0}
                              currency={"rpl"}
                              size={"xsmall"}
                            />
                            <Typography variant="caption" color="textSecondary">
                              from
                            </Typography>
                            <NodeSetAvatar />
                          </Stack>
                        )}
                        {moreXREthRequiredForAnother.gt(0) && (
                          <Stack
                            direction={"row"}
                            alignItems={"baseline"}
                            spacing={0.5}
                          >
                            <CurrencyValue
                              value={moreXREthRequiredForAnother.add(
                                ethers.utils.parseEther("1")
                              )}
                              maxDecimals={0}
                              currency={"eth"}
                              size={"xsmall"}
                            />
                            <Typography variant="caption" color="textSecondary">
                              from
                            </Typography>
                            <NodeSetAvatar />
                          </Stack>
                        )}
                        {moreREthRequiredForAnother.gt(0) && (
                          <Stack
                            direction={"row"}
                            alignItems={"baseline"}
                            spacing={0.5}
                          >
                            <CurrencyValue
                              value={moreREthRequiredForAnother.add(
                                ethers.utils.parseEther("1")
                              )}
                              maxDecimals={0}
                              currency={"eth"}
                              size={"xsmall"}
                            />
                            <Typography variant="caption" color="textSecondary">
                              from
                            </Typography>
                            <Typography variant={"caption"} color={"rpl.dark"}>
                              rETH
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
      <Stack spacing={1}>
        {(minipools || [])
          .slice(0, isShowingAll ? (minipools || []).length : 3)
          .map(
            ({ transactionHash, args: [minipoolAddress, operatorAddress] }) => (
              <Card key={minipoolAddress}>
                <CardActionArea
                  href={etherscanUrl({ tx: transactionHash })}
                  target="_blank"
                >
                  <CardHeader
                    sx={{ pt: 3 }}
                    disableTypography
                    title={
                      <Stack sx={{ mt: 0.5 }}>
                        <NodeSetWalletChip walletAddress={operatorAddress} />
                      </Stack>
                    }
                    subheader={
                      <Typography
                        component={"div"}
                        sx={{ pt: 2, ml: 3 }}
                        variant={"caption"}
                        color={"text.secondary"}
                      >
                        created minipool
                      </Typography>
                    }
                    action={
                      <Stack
                        alignItems={"flex-end"}
                        sx={{ mt: 1, mr: 1 }}
                        spacing={2}
                      >
                        <Chip
                          size="small"
                          sx={{ cursor: "inherit" }}
                          // variant="outlined"
                          // color="rpl"
                          // component="a"
                          // target="_blank"
                          // href={rocketscanUrl({minipool: minipoolAddress})}
                          label={shortenAddress(minipoolAddress)}
                        />
                        <TransactionTimeAgoCaption tx={transactionHash} />
                      </Stack>
                    }
                  />
                </CardActionArea>
              </Card>
            )
          )}
        {(minipools || []).length > 0 && (
          <Button
            sx={{ mt: 1 }}
            fullWidth
            color={"inherit"}
            onClick={() => setShowingAll(!isShowingAll)}
            endIcon={isShowingAll ? <ExpandLess /> : <ExpandMore />}
          >
            See All
            <Chip
              sx={{ ml: 1, mr: 1 }}
              component="span"
              size="small"
              label={(minipools || []).length}
            />
            created minipools
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

function NodeSetAvatar() {
  return (
    <Avatar
      sx={{
        width: 13,
        height: 13,
        fontSize: 9,
        bgcolor: "white",
        color: "black",
        border: "0.5px solid rgba(0,0,0,0.1)",
      }}
    >
      <NodeSetIcon fontSize={"inherit"} />
    </Avatar>
  );
}

function TransactionTimeAgoCaption({ tx }) {
  let { data: txn } = useTransaction({ hash: tx });
  let { data: block } = useBlock({ blockNumber: txn?.blockNumber });
  let txnAt = (block?.timestamp || 0) * 1000;
  var label = "";
  if (!!block) {
    label = moment(txnAt).fromNow();
  }
  return (
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  );
}
