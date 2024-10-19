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
  FormHelperText,
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

export default function NodeSetPage() {
  return (
    <Layout>
      <Grid container columnSpacing={3} rowSpacing={5}>
        {/* TODO */}
        {/*<Grid key={"rocket-deposit-pool"} item xs={12} lg={4}>*/}
        {/*  <RocketDepositCard/>*/}
        {/*</Grid>*/}
        <Grid key={"minipools"} item xs={12} lg={4}>
          <NodeSetMiniPoolsCard />
        </Grid>
        <Grid key={"nodeset-deposit-pool"} item xs={12} lg={4}>
          <NodeDepositCard />
        </Grid>
      </Grid>
    </Layout>
  );
}

function NodeDepositCard() {
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
  let minipoolCreatableEth = opBalance?.value;
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
              <FormHelperText>
                <Chip component="span" size="small" label={deposits.length} />{" "}
                deposits from{" "}
                <Chip
                  component="span"
                  size="small"
                  label={
                    _.uniq(
                      deposits.map(({ args: [senderAddress] }) => senderAddress)
                    ).length
                  }
                />{" "}
                depositors.
              </FormHelperText>
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
                        size="large"
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
                        value={totalWithdrawnEth.mul(-1)}
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
                        size="medium"
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
                        size="medium"
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
          .slice(0, isShowingAll ? deposits.length : 5)
          .map(({ transactionHash, args: [senderAddress, , amountEth] }) => (
            <Card key={transactionHash}>
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
                    <Stack
                      alignItems={"flex-end"}
                      sx={{ mt: 1, mr: 1 }}
                      spacing={1}
                    >
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
        }}
      >
        <NodeSetIcon sx={{ width: 12, height: 12 }} />
      </Avatar>
    </Box>
  );
}

function NodeSetMiniPoolsCard() {
  let [isShowingAll, setShowingAll] = useState(false);
  let { data: minipoolsInOrder } = useK.SuperNodeAccount.Find.MinipoolCreated({
    args: [null, null],
    from: 0,
    to: "latest",
  });
  let minipools = _.reverse(_.clone(minipoolsInOrder || []));
  let activeMinipools = minipools || [];
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
            <Stack spacing={2}>
              <FormHelperText>
                <Chip
                  component="span"
                  size="small"
                  label={activeMinipools.length}
                />{" "}
                minipools created across{" "}
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
                />{" "}
                operators.
              </FormHelperText>
              <Stack spacing={1}>
                <CurrencyValue
                  value={ethers.utils
                    .parseEther("32")
                    .mul(activeMinipools.length)}
                  placeholder="0"
                  size="large"
                  currency="eth"
                  maxDecimals={0}
                />
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
                    size="small"
                    currency="eth"
                    maxDecimals={0}
                  />
                  <Typography variant={"caption"} color={"text.secondary"}>
                    from
                  </Typography>
                  <Typography variant={"caption"} color={"rpl"}>
                    rETH
                  </Typography>
                  <Typography variant={"caption"} color={"text.secondary"}>
                    deposits
                  </Typography>
                </Stack>
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
                    size="small"
                    currency="eth"
                    maxDecimals={0}
                  />
                  <Typography variant={"caption"} color={"text.secondary"}>
                    from
                  </Typography>
                  <Avatar
                    sx={{
                      width: 18,
                      height: 18,
                      fontSize: 12,
                      bgcolor: "white",
                      color: "black",
                    }}
                  >
                    <NodeSetIcon fontSize={"inherit"} />
                  </Avatar>
                  <Typography variant={"caption"} color={"text.secondary"}>
                    deposits
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
      <Stack spacing={1}>
        {(minipools || [])
          .slice(0, isShowingAll ? (minipools || []).length : 5)
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
