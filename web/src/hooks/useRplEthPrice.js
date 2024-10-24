import useK from "./useK";
import { ethers } from "ethers";

export default function useRplEthPrice(defaultValue = ethers.constants.Zero) {
  let { data: rplEthPrice } = useK.RocketNetworkPrices.Read.getRPLPrice();
  return rplEthPrice || defaultValue;
}
