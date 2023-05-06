import makeBlockie from "ethereum-blockies-base64";
import { useMemo } from "react";

export default function Blockies({ walletAddress, size }) {
  const iconSrc = useMemo(() => makeBlockie(walletAddress), [walletAddress]);
  return (
    <img
      src={iconSrc}
      alt={`Blockies for ${walletAddress}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
      }}
    />
  );
}
