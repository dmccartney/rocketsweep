import { ethers } from "ethers";
import _ from "lodash";

// Trim the input address to be "0x####...####"
export function shortenAddress(address, charCount = 4) {
  // .getAddress here ensures we're dealing with the checksum address
  const a = ethers.utils.getAddress(address);
  return `${a.substring(0, charCount + 2)}...${a.substring(42 - charCount)}`;
}

// Sort BigNumber params `a` and `b` (for use in DataGrid sortComparator)
export function BNSortComparator(a, b) {
  if (!a) {
    return a;
  }
  if (!b) {
    return b;
  }
  if (!a.sub) {
    return a - b;
  }
  let cmp = a.sub(b);
  if (cmp.isZero()) {
    return 0;
  }
  if (cmp.gt(0)) {
    return 1;
  }
  return -1;
}

// convert "1234.123415123123123123" into "1,234.1234"
export function trimValue(
  amountEthish,
  { maxDecimals = 4, maxLength = 11 } = {}
) {
  if (amountEthish.indexOf(".") !== -1) {
    amountEthish = amountEthish.slice(
      0,
      amountEthish.indexOf(".") + maxDecimals + (maxDecimals ? 1 : 0)
    );
  }
  if (amountEthish.length <= maxLength) {
    return `${ethers.utils.commify(amountEthish)}`;
  }
  return `${ethers.utils.commify(amountEthish.substring(0, maxLength))}…`;
}

// Returns the sha1 of the provided array buffer asa hex string.
export async function makeSha1Hash(buffer) {
  let hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// generate the etherscan URL for a given address, block, tx, or token.
export function etherscanUrl({
  network = "mainnet",
  address,
  block,
  tx,
  token,
  a,
}) {
  const ETHERSCAN_BASE = {
    mainnet: "https://etherscan.io",
    goerli: "https://goerli.etherscan.io",
    prater: "https://goerli.etherscan.io",
  }[network];
  if (address) {
    return `${ETHERSCAN_BASE}/address/${address}`;
  }
  if (block) {
    return `${ETHERSCAN_BASE}/block/${block}`;
  }
  if (tx) {
    return `${ETHERSCAN_BASE}/tx/${tx}`;
  }
  if (token) {
    return `${ETHERSCAN_BASE}/token/${token}${a ? `?a=${a}` : ""}`;
  }
  return ETHERSCAN_BASE;
}

// generate the rocketscan URL for a given node.
export function rocketscanUrl({ network = "mainnet", node, minipool }) {
  const ROCKETSCAN_BASE = {
    mainnet: "https://rocketscan.io",
    goerli: "https://prater.rocketscan.io",
    prater: "https://prater.rocketscan.io",
  }[network];
  if (node) {
    return `${ROCKETSCAN_BASE}/node/${node}`;
  }
  if (minipool) {
    return `${ROCKETSCAN_BASE}/minipool/${minipool}`;
  }
  return ROCKETSCAN_BASE;
}

export function safeAppUrl({
  safeAddress,
  appUrl = process.env.REACT_APP_ROCKET_SWEEP_URL,
}) {
  const url = new URL(`https://app.safe.global/apps/open`)
  url.searchParams.append('safe', `eth:${safeAddress}`)
  url.searchParams.append('appUrl', appUrl)
  return url.toString()
}

export function bnSum(arr) {
  return arr.reduce(
    (a, b) => a.add(b ? ethers.BigNumber.from(b) : ethers.constants.Zero),
    ethers.constants.Zero
  );
}

// This is derived from gas profiling analysis.
export function estimateDistributeBatchGas(batchSize) {
  let count = ethers.BigNumber.from(batchSize);
  return ethers.BigNumber.from(21000) // txn init
    .add(count.mul(1000)) // call data
    .add(count.mul(53000)) // typical distributeBalance call
    .sub(count.mul(4800)); // typical gas refund
}

export const MinipoolStatus = {
  initialised: 0,
  prelaunch: 1,
  staking: 2,
  withdrawable: 3,
  dissolved: 4,
};

export const MinipoolStatusNameByValue = _.invert(MinipoolStatus);

export const distributeBalanceInterface = new ethers.utils.Interface([
  {
    type: "function",
    name: "distributeBalance",
    inputs: [{ type: "bool", name: "_rewardsOnly" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
]);

export const distributeBalanceEncoded =
  distributeBalanceInterface.encodeFunctionData("distributeBalance", [true]);

export const delegateUpgradeInterface = new ethers.utils.Interface([
  {
    type: "function",
    name: "delegateUpgrade",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
]);

export const delegateUpgradeEncoded =
  delegateUpgradeInterface.encodeFunctionData("delegateUpgrade", []);
