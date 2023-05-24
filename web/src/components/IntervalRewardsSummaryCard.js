import {
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Divider,
  FormHelperText,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { bnSum } from "../utils";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import { EventRepeat, HourglassTop } from "@mui/icons-material";
import CurrencyValue from "./CurrencyValue";
import useRewardSnapshot from "../hooks/useRewardSnapshot";
import moment from "moment";
import _ from "lodash";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";

function SummaryCardHeader({ rewardIndex, minimal }) {
  let { isOngoing, startTime, endTime, totalRewards } = useRewardSnapshot({
    rewardIndex,
  });
  let start = startTime && moment(startTime);
  let end = endTime && moment(endTime);
  let now = moment();
  let percentComplete =
    isOngoing && start && end && now.diff(start) / end.diff(start);
  let {
    totalSmoothingPoolEth,
    protocolDaoRpl,
    totalCollateralRpl,
    totalOracleDaoRpl,
  } = totalRewards || {};
  let ethTotal = bnSum([totalSmoothingPoolEth]);
  let rplTotal = bnSum([protocolDaoRpl, totalCollateralRpl, totalOracleDaoRpl]);
  let isLoading = !totalRewards;
  return (
    <CardHeader
      avatar={<EventRepeat fontSize="medium" color="disabled" />}
      title={`Interval #${rewardIndex}`}
      subheader={
        isLoading ? null : isOngoing ? (
          `${Number(100 * percentComplete).toFixed(0)}% complete`
        ) : !minimal ? null : (
          <Stack direction="row" spacing={1} justifyContent="left">
            <CurrencyValue
              value={ethTotal}
              placeholder="0"
              size="xsmall"
              currency="eth"
            />
            <CurrencyValue
              value={rplTotal}
              placeholder="0"
              size="xsmall"
              currency="rpl"
            />
          </Stack>
        )
      }
      action={
        isLoading ? null : (
          <Stack
            sx={{ m: 1.25 }}
            spacing={1}
            direction="row"
            alignItems="center"
          >
            {isOngoing && <HourglassTop color="disabled" fontSize="small" />}
            <Typography color="text.secondary" variant="subtitle1">
              {end?.fromNow()}
            </Typography>
          </Stack>
        )
      }
    />
  );
}

function SummaryCardContent({ rewardIndex, minimal }) {
  let theme = useTheme();
  let { isOngoing, totalRewards } = useRewardSnapshot({ rewardIndex });
  let {
    totalSmoothingPoolEth,
    poolStakerSmoothingPoolEth,
    nodeOperatorSmoothingPoolEth,
    protocolDaoRpl,
    totalCollateralRpl,
    totalOracleDaoRpl,
  } = totalRewards || {};
  let nodeSmoothingTotal = ethers.BigNumber.from(
    nodeOperatorSmoothingPoolEth || 0
  );
  let poolSmoothingTotal = ethers.BigNumber.from(
    poolStakerSmoothingPoolEth || 0
  );
  let rplTotal = bnSum([protocolDaoRpl, totalCollateralRpl, totalOracleDaoRpl]);
  let [pDaoRpl, nodeRpl, oDaoRpl] = [
    protocolDaoRpl,
    totalCollateralRpl,
    totalOracleDaoRpl,
  ].map((rpl) => (rpl ? ethers.BigNumber.from(rpl) : ethers.constants.Zero));
  let size = "medium";
  if (minimal && !isOngoing) {
    return null;
  }
  return (
    <CardContent sx={{ pt: 1 }}>
      <Stack
        direction="row"
        divider={
          <Divider
            orientation="vertical"
            sx={{ opacity: 0.5 }}
            flexItem
          ></Divider>
        }
        spacing={2}
        justifyContent={minimal ? "center" : "left"}
      >
        <CurrencyValue
          value={ethers.BigNumber.from(totalSmoothingPoolEth || 0)}
          placeholder="0"
          size={size}
          currency="eth"
        />
        <CurrencyValue
          value={rplTotal}
          placeholder="0"
          size={size}
          currency="rpl"
        />
      </Stack>
      {minimal ? null : (
        <>
          <FormHelperText sx={{ mb: 2 }} disabled>
            Total periodic rewards
          </FormHelperText>
          {nodeSmoothingTotal.isZero() && poolSmoothingTotal.isZero() ? null : (
            <>
              <ResponsiveContainer height={32} width="100%">
                <Treemap
                  colorPanel={[theme.palette.eth.main, theme.palette.eth.light]}
                  data={[
                    {
                      name: `Node Operators`,
                      value: Number(
                        ethers.utils.formatUnits(nodeSmoothingTotal)
                      ),
                    },
                    {
                      name: `rETH`,
                      value: Number(
                        ethers.utils.formatUnits(poolSmoothingTotal)
                      ),
                    },
                  ]}
                  isAnimationActive={false}
                >
                  <Tooltip
                    separator=""
                    allowEscapeViewBox={{ x: false, y: true }}
                    formatter={(value) => value.toLocaleString()}
                  />
                </Treemap>
              </ResponsiveContainer>
              <FormHelperText sx={{ mb: 2 }} disabled>
                Smoothing Pool ETH
              </FormHelperText>
            </>
          )}
          {nodeRpl.isZero() && pDaoRpl.isZero() && oDaoRpl.isZero() ? null : (
            <>
              <ResponsiveContainer height={32} width="100%">
                <Treemap
                  colorPanel={[
                    theme.palette.rpl.dark,
                    theme.palette.rpl.main,
                    theme.palette.rpl.light,
                  ]}
                  data={[
                    {
                      name: `Node Operators`,
                      value: Number(ethers.utils.formatUnits(nodeRpl)),
                    },
                    {
                      name: `pDAO`,
                      value: Number(ethers.utils.formatUnits(pDaoRpl)),
                    },
                    {
                      name: `oDAO`,
                      value: Number(ethers.utils.formatUnits(oDaoRpl)),
                    },
                  ]}
                  isAnimationActive={false}
                >
                  <Tooltip
                    separator=""
                    allowEscapeViewBox={{ x: false, y: true }}
                    formatter={(value) => value.toLocaleString()}
                  />
                </Treemap>
              </ResponsiveContainer>
              <FormHelperText disabled>Inflation RPL</FormHelperText>
            </>
          )}
        </>
      )}
    </CardContent>
  );
}

export default function IntervalRewardsSummaryCard({
  sx,
  elevation,
  rewardIndex,
  minimal = false,
  asLink = false,
}) {
  if (!_.isNumber(rewardIndex) || isNaN(rewardIndex)) {
    return null;
  }
  if (asLink) {
    return (
      <Card sx={sx} elevation={elevation}>
        <CardActionArea component={Link} to={`/interval/${rewardIndex}`}>
          <SummaryCardHeader rewardIndex={rewardIndex} minimal={minimal} />
          <SummaryCardContent rewardIndex={rewardIndex} minimal={minimal} />
        </CardActionArea>
      </Card>
    );
  }
  return (
    <Card sx={sx} elevation={elevation}>
      <SummaryCardHeader rewardIndex={rewardIndex} minimal={minimal} />
      <SummaryCardContent rewardIndex={rewardIndex} minimal={minimal} />
    </Card>
  );
}
