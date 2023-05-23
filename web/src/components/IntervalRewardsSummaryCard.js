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
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";

function SummaryCardHeader({ rewardIndex, action }) {
  let { isOngoing, endTime } = useRewardSnapshot({ rewardIndex });
  let when = endTime && moment(endTime);
  return (
    <CardHeader
      avatar={<EventRepeat fontSize="medium" color="disabled" />}
      title={`Interval #${rewardIndex}`}
      action={
        <Stack sx={{ m: 1.25 }} spacing={1} direction="row" alignItems="center">
          {isOngoing && <HourglassTop color="disabled" fontSize="small" />}
          <Typography color="text.secondary" variant="subtitle1">
            {when?.fromNow()}
          </Typography>
        </Stack>
      }
      // subheader={isOngoing ? "ongoing" : "finalized"}
    />
  );
}

function SummaryCardContent({ rewardIndex }) {
  let theme = useTheme();
  let snapshot = useRewardSnapshot({ rewardIndex });
  let { totalRewards } = snapshot;
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
        justifyContent="left"
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
      <FormHelperText sx={{ mb: 2 }} disabled>
        Total rewards
      </FormHelperText>
      {nodeSmoothingTotal.isZero() && poolSmoothingTotal.isZero() ? null : (
        <>
          <ResponsiveContainer height={36} width="100%">
            <Treemap
              colorPanel={[theme.palette.eth.main, theme.palette.eth.light]}
              data={[
                {
                  name: `Node Operators`,
                  value: Number(ethers.utils.formatUnits(nodeSmoothingTotal)),
                },
                {
                  name: `rETH`,
                  value: Number(ethers.utils.formatUnits(poolSmoothingTotal)),
                },
              ]}
              isAnimationActive={false}
            >
              <Tooltip formatter={(value) => value.toLocaleString()} />
            </Treemap>
          </ResponsiveContainer>
          <FormHelperText sx={{ mb: 2 }} disabled>
            Smoothing Pool ETH
          </FormHelperText>
        </>
      )}
      {nodeSmoothingTotal.isZero() && poolSmoothingTotal.isZero() ? null : (
        <>
          <ResponsiveContainer height={36} width="100%">
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
              <Tooltip formatter={(value) => value.toLocaleString()} />
            </Treemap>
          </ResponsiveContainer>
          <FormHelperText disabled>Inflation RPL</FormHelperText>
        </>
      )}
    </CardContent>
  );
}

export default function IntervalRewardsSummaryCard({
  sx,
  rewardIndex,
  asLink = false,
}) {
  if (isNaN(rewardIndex)) {
    return null;
  }
  if (asLink) {
    return (
      <Card sx={sx}>
        <CardActionArea component={Link} to={`/interval/${rewardIndex}`}>
          <SummaryCardHeader rewardIndex={rewardIndex} />
          <SummaryCardContent rewardIndex={rewardIndex} />
        </CardActionArea>
      </Card>
    );
  }
  return (
    <Card sx={sx}>
      <SummaryCardHeader rewardIndex={rewardIndex} />
      <SummaryCardContent rewardIndex={rewardIndex} />
    </Card>
  );
}
