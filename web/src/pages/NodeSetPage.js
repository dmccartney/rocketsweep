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
  Divider,
  Grid,
  Stack,
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
          href={`https://app.gravitaprotocol.com/constellation/xreth`}
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

function NodeSetMiniPoolsColumn() {
  let [isShowingAll, setShowingAll] = useState(false);
  let rplEthPrice = useRplEthPrice();
  const { data: superNodeDetails } = useNodeDetails({
    nodeAddress: contracts.SuperNodeAccount.address,
  });
  let { data: minimumStakeRatio } =
    useK.OperatorDistributor.Read.minimumStakeRatio();

  let { rplStake } = superNodeDetails || {
    rplStake: ethers.constants.Zero,
  };
  let rplStakedInEth = rplStake
    ?.mul(rplEthPrice)
    .div(ethers.utils.parseEther("1"));
  let { data: minipoolsInOrder } = useK.SuperNodeAccount.Find.MinipoolCreated({
    args: [null, null],
    from: 0,
    to: "latest",
  });
  let minipools = _.reverse(_.clone(minipoolsInOrder || []));
  let activeMinipools = minipools || [];
  let maxMinipoolCountByRpl = rplStakedInEth
    ?.mul(ethers.utils.parseEther("1"))
    .div(minimumStakeRatio || ethers.utils.parseEther("1"))
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
  let moreMinipoolCount = Math.min(
    moreMinipoolCountByXREth,
    moreMinipoolCountByREth,
    moreMinipoolCountByRpl
  );
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
          <CardContent>
            <Stack spacing={1}>
              <Stack direction={"row"} alignItems={"baseline"} spacing={1}>
                <Chip
                  component="span"
                  size="small"
                  label={activeMinipools.length}
                />
                <Typography variant={"caption"} color={"text.secondary"}>
                  minipools created across
                </Typography>
                <Chip
                  component="span"
                  size="small"
                  label={
                    _.uniq(
                      activeMinipools.map(
                        ({ args: [, operatorAddress] }) => operatorAddress
                      )
                    ).length
                  }
                />
                <Typography variant={"caption"} color={"text.secondary"}>
                  operators.
                </Typography>
              </Stack>
              <Stack
                sx={{
                  mt: 0.5,
                  borderRadius: "20px",
                  ...(moreMinipoolCount < 1
                    ? {}
                    : {
                        background: "rgba(128,255,128,0.1)",
                      }),
                }}
                direction={"row"}
                alignItems={"baseline"}
                spacing={1}
              >
                <Chip component="span" size="small" label={moreMinipoolCount} />
                <Typography variant={"caption"} color={"text.secondary"}>
                  more can be created from available deposits.
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
                  columnSpacing={1}
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
                  <Grid item xs={4}>
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
                  <Grid item xs={2}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-end"
                    >
                      <Chip
                        sx={{ width: "100%" }}
                        component="span"
                        size="small"
                        label={moreMinipoolCountByXREth}
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
                  columnSpacing={1}
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
                  <Grid item xs={4}>
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
                  <Grid item xs={2}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-end"
                    >
                      <Chip
                        sx={{ width: "100%" }}
                        component="span"
                        size="small"
                        label={moreMinipoolCountByREth}
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
                  columnSpacing={1}
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
                  <Grid item xs={4}>
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
                  <Grid item xs={2}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="baseline"
                      justifyContent="flex-end"
                    >
                      <Chip
                        sx={{ width: "100%" }}
                        component="span"
                        size="small"
                        label={moreMinipoolCountByRpl}
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
                        value={minimumStakeRatio?.mul(100)}
                        trimZeroWhole
                        maxDecimals={0}
                        currency={"ratio"}
                        hideCurrency
                        size="xsmall"
                      />
                      <Typography variant={"caption"} color={"text.secondary"}>
                        % borrow limit
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
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
