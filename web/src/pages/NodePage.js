import { useEnsAddress } from "wagmi";
import Layout from "../components/Layout";
import { useParams } from "react-router-dom";
import { CircularProgress, Grid } from "@mui/material";
import MinipoolRewardsSummaryCard from "../components/MinipoolRewardsSummaryCard";
import SafeSweepCard from "../components/SafeSweepCard";
import MinipoolRewardsTable from "../components/MinipoolRewardsTable";

export default function NodePage() {
  let { nodeAddressOrName } = useParams();
  let { data: nodeAddress } = useEnsAddress({
    name: nodeAddressOrName,
    enabled: nodeAddressOrName.endsWith(".eth"),
  });
  if (!nodeAddressOrName.endsWith(".eth")) {
    nodeAddress = nodeAddressOrName;
  }
  return (
    <Layout
      breadcrumbs={[
        { label: "Rocket Sweep", href: "/" },
        {
          label: `Node: ${nodeAddressOrName}`,
          href: `/node/${nodeAddressOrName}`,
        },
      ]}
    >
      {!nodeAddress ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          <Grid key={"summary-card"} item xs={4}>
            <MinipoolRewardsSummaryCard nodeAddress={nodeAddress} />
          </Grid>
          <Grid key={"sweep-table-cards"} item xs={8}>
            <SafeSweepCard sx={{ mb: 2 }} nodeAddress={nodeAddress} />
            <MinipoolRewardsTable nodeAddress={nodeAddress} />
          </Grid>
        </Grid>
      )}
    </Layout>
  );
}
