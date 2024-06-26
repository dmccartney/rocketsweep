import RocketMerkleDistributorMainnet from "./generated/contracts/RocketMerkleDistributorMainnet.json";
import RocketMinipoolBase from "./generated/contracts/RocketMinipoolBase.json";
import RocketMinipoolDelegate from "./generated/contracts/RocketMinipoolDelegate.json";
import RocketMinipoolManager from "./generated/contracts/RocketMinipoolManager.json";
import RocketNetworkPrices from "./generated/contracts/RocketNetworkPrices.json";
import RocketNodeDistributorInterface from "./generated/contracts/RocketNodeDistributorInterface.json";
import RocketNodeManager from "./generated/contracts/RocketNodeManager.json";
import RocketRewardsPool from "./generated/contracts/RocketRewardsPool.json";
import RocketStorageK from "./generated/contracts/RocketStorage.json";

// This names, locates, and defines the interface to the contracts we use.
// The address can change during a rocketpool upgrade. The first `address` is the latest address.
// But we hang onto the old addresses for things like searching all event logs.
const contracts = {
  RocketMerkleDistributorMainnet: {
    address: [
      "0x5cE71E603B138F7e65029Cc1918C0566ed0dBD4B",
      "0x7eccbbd05830edf593d30005b8f69e965af4d59f",
    ],
    abi: RocketMerkleDistributorMainnet.abi,
  },
  RocketMinipoolBase: {
    abi: RocketMinipoolBase.abi,
  },
  RocketMinipoolDelegate: {
    abi: RocketMinipoolDelegate.abi,
  },
  RocketMinipoolManager: {
    address: [
      "0x09fbCE43e4021a3F69C4599FF00362b83edA501E",
      "0x6d010C43d4e96D74C422f2e27370AF48711B49bF",
      "0x84d11b65e026f7aa08f5497dd3593fb083410b71",
      "0x6293b8abc1f36afb22406be5f96d893072a8cf3a",
    ],
    abi: RocketMinipoolManager.abi,
  },
  RocketNetworkPrices: {
    address: [
      "0x25E54Bf48369b8FB25bB79d3a3Ff7F3BA448E382",
      "0x751826b107672360b764327631cc5764515ffc37",
    ],
    abi: RocketNetworkPrices.abi,
  },
  RocketNodeDistributorInterface: {
    // see RocketNodeManager.Read.getNodeDetails -> .feeDistributorAddress
    abi: RocketNodeDistributorInterface.abi,
  },
  RocketNodeManager: {
    address: [
      "0x2b52479F6ea009907e46fc43e91064D1b92Fdc86",
      "0x89F478E6Cc24f052103628f36598D4C14Da3D287",
    ],
    abi: RocketNodeManager.abi,
  },
  RocketRewardsPool: {
    address: [
      "0xEE4d2A71cF479e0D3d0c3c2C923dbfEB57E73111",
      "0xA805d68b61956BC92d556F2bE6d18747adAeEe82",
      "0x594Fb75D3dc2DFa0150Ad03F99F97817747dd4E1",
    ],
    abi: RocketRewardsPool.abi,
  },
  RocketStorage: {
    address: "0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46",
    abi: RocketStorageK.abi,
  },
};

// TODO: consider pulling addresses/abi from on-chain like this:
// storage = RocketStorage("0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46")
// upgrades = storage.getAddress(keccak256("rocketDAONodeTrustedUpgrade"))
// for each ContractAdded event in upgrades:
//   kAddress = event.newAddress
//   kName = storage.getString(ethers.utils.solidityKeccak256(
//     ["string", "string"],
//     ["contract.name", kAddress]
//   ))
//   kAbi = storage.getString(ethers.utils.solidityKeccak256(
//     ["string", "string"],
//     ["contract.abi", kName]
//   ))
//   contracts[kName] = { address: kAddress, abi: kAbi }

export default contracts;
