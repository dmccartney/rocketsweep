import useK from "./useK";
import { ethers } from "ethers";

export default function useRplEthPrice() {
  let { data: rplEthPrice } = useK.RocketNetworkPrices.Read.getRPLPrice();
  return rplEthPrice || ethers.constants.Zero;
}
