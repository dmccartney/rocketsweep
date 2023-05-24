import { Skeleton, useTheme } from "@mui/material";
import { ethers } from "ethers";
import _ from "lodash";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import useOngoingRewardSnapshot from "../hooks/useOngoingRewardSnapshot";
import useFinalizedRewardSnapshots from "../hooks/useFinalizedRewardSnapshots";
import useOngoingRewardIndex from "../hooks/useOngoingRewardIndex";
import IntervalRewardsSummaryCard from "./IntervalRewardsSummaryCard";

function IntervalsChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <IntervalRewardsSummaryCard
      sx={{ minWidth: 320 }}
      elevation={5}
      rewardIndex={label}
    />
  );
}

export default function IntervalsChart({
  width = "100%",
  height = 80,
  activeRewardIndex = null,
}) {
  let theme = useTheme();
  let navigate = useNavigate();
  let snapshots = useFinalizedRewardSnapshots({});
  let ongoingRewardIndex = useOngoingRewardIndex();
  let ongoingSnapshotData = useOngoingRewardSnapshot({
    rewardIndex: ongoingRewardIndex,
  });
  if (snapshots?.length < 1) {
    return <Skeleton variant="rectangular" sx={{ width, height }} />;
  }
  if (ongoingSnapshotData) {
    snapshots = [
      ...snapshots,
      {
        rewardIndex: ongoingRewardIndex,
        endTime: ongoingSnapshotData?.endTime,
        data: ongoingSnapshotData,
      },
    ];
  }
  let data = _.orderBy(snapshots, "rewardIndex", "asc").map((s) => {
    let [pDaoRpl, nodeRpl, oDaoRpl, nodeSmoothingTotal, poolSmoothingTotal] = [
      s.data?.totalRewards?.protocolDaoRpl,
      s.data?.totalRewards?.totalCollateralRpl,
      s.data?.totalRewards?.totalOracleDaoRpl,
      s.data?.totalRewards?.nodeOperatorSmoothingPoolEth,
      s.data?.totalRewards?.poolStakerSmoothingPoolEth,
    ]
      .map((n) => (n ? ethers.BigNumber.from(n) : ethers.constants.Zero))
      .map((n) => Number(ethers.utils.formatUnits(n)));
    let rplTotal = _.sum([pDaoRpl, nodeRpl, oDaoRpl]);
    let ethTotal = _.sum([nodeSmoothingTotal, poolSmoothingTotal]);
    return {
      rewardIndex: s.rewardIndex,
      endTime: s.endTime,
      // TODO: consider scaling these by the ETH/RPL ratio
      pDaoRpl,
      nodeRpl,
      oDaoRpl,
      rplTotal,
      nodeSmoothingTotal,
      poolSmoothingTotal,
      ethTotal,
    };
  });
  const toRoundMax = (max, extraChunks = 0) => {
    if (!max) {
      return 1;
    }
    let chunk = Math.pow(10, Math.floor(Math.log10(max)));
    return chunk * (Math.round(max / chunk) + 1 + extraChunks);
  };
  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart
        margin={{
          top: 0,
          right: 20,
          bottom: 0,
          left: 20,
        }}
        onClick={(e) => {
          let rewardIndex = e?.activeLabel;
          if (_.isNumber(rewardIndex)) {
            navigate(`/interval/${e.activeLabel}`);
          }
        }}
        barGap={0}
        barCategoryGap={"10%"}
        data={data}
      >
        <XAxis
          tickMargin={2}
          tickLine={false}
          dataKey="rewardIndex"
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        {/* TODO: consider using a Brush */}
        {/*<Brush dataKey="rewardIndex"*/}
        {/*       height={10}*/}
        {/*       startIndex={Math.max(0, data.length - 4)}*/}
        {/*       endIndex={Math.max(data.length - 1, 0)}*/}
        {/*       padding={{left: 30, right: 30}}*/}
        {/*       stroke={theme.palette.gray.dark}*/}
        {/*       fill="none"*/}
        {/*/>*/}
        <YAxis
          yAxisId="eth"
          hide // TODO: consider showing this
          stroke={theme.palette.eth.main}
          strokeDasharray="1 8"
          tickMargin={5}
          orientation="left"
          type="number"
          interval="preserveEnd"
          allowDecimals={false}
          tickCount={1}
          domain={[0, toRoundMax]}
        />
        <YAxis
          yAxisId="rpl"
          hide // TODO: consider showing this
          stroke={theme.palette.rpl.main}
          strokeDasharray="1 8"
          tickMargin={5}
          orientation="right"
          type="number"
          interval="preserveEnd"
          allowDecimals={false}
          tickCount={1}
          domain={[0, toRoundMax]}
        />
        <Tooltip
          allowEscapeViewBox={{ x: false, y: true }}
          offset={40}
          cursor={{ fill: theme.palette.gray.dark }}
          wrapperStyle={{ zIndex: 5 }}
          content={IntervalsChartTooltip}
        />
        {[
          {
            group: "eth",
            key: "nodeSmoothingTotal",
            color: "main",
            name: "Smoothing Pool ETH to Node Operators",
          },
          {
            group: "eth",
            key: "poolSmoothingTotal",
            color: "light",
            name: "Smoothing Pool ETH to rETH",
          },
          {
            group: "rpl",
            key: "nodeRpl",
            color: "dark",
            name: "Inflation RPL to Node Operators",
          },
          {
            group: "rpl",
            key: "pDaoRpl",
            color: "main",
            name: "Inflation RPL to pDAO",
          },
          {
            group: "rpl",
            key: "oDaoRpl",
            color: "light",
            name: "Inflation RPL to oDAO",
          },
        ].map(({ group, key, color, name }) => (
          <Bar
            key={key}
            dataKey={key}
            name={name}
            yAxisId={group}
            stackId={group}
            fill={theme.palette[group][color]}
          />
        ))}
        );
      </BarChart>
    </ResponsiveContainer>
  );
}
