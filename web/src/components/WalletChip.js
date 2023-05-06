import { Chip, Typography } from "@mui/material";
import { useEnsName } from "wagmi";
import WalletAvatar from "./WalletAvatar";
import { shortenAddress } from "../utils";
import { Link } from "react-router-dom";

export default function WalletChip({
  walletAddress,
  avatarSize,
  size,
  sx,
  target,
  labelVariant = "caption",
  // Only one of these will be used:
  href,
  to,
  onClick,
}) {
  const ensName = useEnsName({
    address: walletAddress,
  });
  return (
    <Chip
      sx={sx}
      variant={"filled"}
      avatar={<WalletAvatar size={avatarSize} walletAddress={walletAddress} />}
      component={href ? "a" : to ? Link : "div"}
      clickable={!!(href || to || onClick)}
      onClick={onClick}
      to={typeof to === "function" ? to(ensName.data || walletAddress) : to}
      size={size}
      target={target}
      href={href}
      label={
        <Typography fontFamily={"monospace"} variant={labelVariant}>
          {ensName.data || shortenAddress(walletAddress)}
        </Typography>
      }
    />
  );
}
