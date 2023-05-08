import { useFeeData } from "wagmi";
import { ethers } from "ethers";

export default function useGasPrice({
  defaultGasPrice = ethers.utils.parseUnits("40", "gwei"),
} = {}) {
  let { data: gasData } = useFeeData();
  return gasData?.gasPrice || defaultGasPrice;
}
