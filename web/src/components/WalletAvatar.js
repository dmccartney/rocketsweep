import { Avatar } from "@mui/material";
import { useEnsAvatar } from "wagmi";
import Blockies from "./Blockies";

export default function WalletAvatar({ walletAddress, size = 40 }) {
  const ensAvatar = useEnsAvatar({
    addressOrName: walletAddress,
  });
  return ensAvatar.data ? (
    <Avatar sx={{ width: size, height: size }} src={ensAvatar.data} />
  ) : (
    <Avatar sx={{ width: size, height: size }}>
      <Blockies walletAddress={walletAddress} size={size} />
    </Avatar>
  );
}
