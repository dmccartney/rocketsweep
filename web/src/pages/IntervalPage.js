import Layout from "../components/Layout";
import { useParams, useSearchParams } from "react-router-dom";
import { Grid, TextField } from "@mui/material";
import { useState } from "react";
import useOngoingRewardIndex from "../hooks/useOngoingRewardIndex";
import IntervalRewardsSummaryCard from "../components/IntervalRewardsSummaryCard";
import _ from "lodash";
import { useEnsAddress } from "wagmi";
import IntervalRewardsTable from "../components/IntervalRewardsTable";

export default function IntervalPage() {
  let { rewardIndexOrOngoing } = useParams();
  let [search, setSearch] = useSearchParams();
  let ongoingRewardIndex = useOngoingRewardIndex();
  let [filter, setFilter] = useState(search.get("q") || "");
  let { data: filterAddress } = useEnsAddress({
    name: filter,
    enabled: filter?.endsWith(".eth"),
  });
  let rewardIndex = rewardIndexOrOngoing;
  if (rewardIndexOrOngoing === "ongoing") {
    rewardIndex = ongoingRewardIndex;
  }
  rewardIndex = _.toNumber(rewardIndex);
  return (
    <Layout>
      <Grid container columnSpacing={3} rowSpacing={5}>
        <Grid key={"summary"} item xs={12} lg={4}>
          <IntervalRewardsSummaryCard rewardIndex={rewardIndex} />
        </Grid>
        <Grid key={"table"} item xs={12} lg={8}>
          <TextField
            sx={{ mb: 2, maxWidth: 400 }}
            // size="small"
            placeholder="find operator by address or ENS"
            value={filter}
            fullWidth
            autoFocus
            helperText={filterAddress}
            onChange={(e) => {
              let q = e.target.value.toLowerCase() || "";
              setFilter(q);
              setSearch(q ? { q } : {}, { replace: true });
            }}
          />
          <IntervalRewardsTable
            rewardIndex={rewardIndex}
            filter={filter}
            filterAddress={filterAddress}
          />
        </Grid>
      </Grid>
    </Layout>
  );
}
