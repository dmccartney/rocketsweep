import { ethers } from "ethers";
import _ from "lodash";
import { useQuery } from "react-query";
import {
  useContract,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useProvider,
  useWaitForTransaction,
} from "wagmi";

import contracts from "../contracts";

// TODO: consider publishing this as a tiny NPM package

// This exposes hooks for each contract's Read and Write functions.
// It also exposes hooks for finding Events from the contract.
//
// It pulls the contract address and ABI from the contracts.js.
//
//  e.g. let {data} = useK.MyContract.Read.myViewFunction({
//         args: [1, 2, 3],
//       })
//       let {write} = useK.MyContract.Write.myModifyFunction({
//         args: [4, 5, 6],
//       })
//
// Beyond `args`, you can also pass any other configuration options.
// And you receive all the other response parameters (isLoading, isError, etc).
// See the `useContractRead` and `useContractWrite` hooks for more details.
//
// Use `from` and `to` to specify blocks to search for events.
//
//  e.g. let {events} = useK.MyContract.Find.MyEvent({
//         args: [7, null],
//         from: 0,
//         to: "latest",
//       });
//
// You can also find events from a particular transaction hash by
// passing the hash as the `from` parameter.
//
//  e.g. let {events} = useK.MyContract.Find.MyEvent({
//         args: [7, null],
//         from: "0x1111111122222222333333334444444455555555666666667777777788888888",
//       });
//
// The `args` for finding events are used in the bloom filter to find matches.
// Only `indexed` arguments are used in the bloom filter.
// Absent or `null` arguments mean "match anything".
// See https://docs.ethers.io/v5/api/contract/contract/#Contract--filters

// This creates all the `.Read` hooks for a single contract.
// It produces a mapping of { [functionName]: (config) => { ... } },
function makeReaders(kName, k) {
  const kInterface = new ethers.utils.Interface(k.abi);
  const kAddress = Array.isArray(k.address) ? k.address[0] : k.address;
  return _.chain(kInterface.fragments)
    .filter((f) => f.type === "function" && f.constant)
    .keyBy("name")
    .mapValues((f, functionName) => (config) => {
      return useContractRead({
        address: kAddress,
        abi: k.abi,
        onError: (error) => {
          console.error("error reading", kName, functionName, config, error);
        },
        functionName,
        ...config,
      });
    })
    .value();
}

// This creates all the `.Write` hooks for a single contract.
function makeWriters(kName, k) {
  const kInterface = new ethers.utils.Interface(k.abi);
  const kAddress = Array.isArray(k.address) ? k.address[0] : k.address;
  return _.chain(kInterface.fragments)
    .filter((f) => f.type === "function" && f.constant)
    .keyBy("name")
    .mapValues((f, functionName) => (config) => {
      let {
        config: prepared,
        isError: isPrepareError,
        error: prepareError,
      } = usePrepareContractWrite({
        address: kAddress,
        abi: k.abi,
        onError: (error) => {
          console.error(
            "error preparing to write",
            kName,
            functionName,
            config,
            error
          );
        },
        functionName,
        ...config,
      });
      let { data, write } = useContractWrite({
        onError: (error) => {
          console.error("error writing", kName, functionName, config, error);
        },
        ...prepared,
      });
      let hash = data?.hash;
      const { isLoading, isSuccess, isError, error } = useWaitForTransaction({
        hash,
        onError: (error) => {
          console.error(
            "error waiting for transaction",
            hash,
            kName,
            functionName,
            config,
            error
          );
        },
      });
      return {
        isPrepareError,
        prepareError,
        isError,
        error,
        isSuccess,
        isLoading,
        write,
      };
    })
    .value();
}

// This creates all the `.Find` hooks for a single contract.
// It produces a mapping of { [eventName]: (config) => { ... } },
function makeEventFinders(kName, k) {
  const kInterface = new ethers.utils.Interface(k.abi);
  const kAddresses = Array.isArray(k.address) ? k.address : [k.address];
  return _.chain(kInterface.fragments)
    .filter((f) => f.type === "event")
    .keyBy("name")
    .mapValues((event, eventName) => (config) => {
      let provider = useProvider();
      // WARN: this is rule-of-hooks safe only if the address array is static.
      let kInstances = kAddresses.map((kAddress) =>
        useContract({
          address: kAddress,
          abi: k.abi,
          signerOrProvider: provider,
        })
      );
      let chainId = provider.network.chainId;
      let queryKey = [
        "findContractEvents",
        kName,
        chainId,
        kAddresses.join(),
        eventName,
        config.from,
        config.to,
        ...config.args,
      ];
      return useQuery(
        queryKey,
        async () =>
          Promise.all(
            kInstances.map((kInstance) =>
              kInstance.queryFilter(
                kInstance.filters[eventName](...config.args),
                config.from,
                config.to
              )
            )
          ).then((res) => _.concat(...res)),
        {
          // TODO: consider introducing a `select` transform to decode args
          cacheTime: config.cacheTime,
          enabled: config.enabled,
          staleTime: config.staleTime,
          suspense: config.suspense,
          onError: config.onError,
          onSettled: config.onSettled,
          onSuccess: config.onSuccess,
        }
      );
    })
    .value();
}

// See usage notes above.
//
// This goes converts `contracts`
//  from { [kName]: { address, abi }, ... }
//  into { [kName]: {
//           Read: { [functionName]: (config) => { ... } },
//           Write: { [functionName]: (config) => { ... } }
//           Find: { [eventName]: (config) => { ... } }
//         }, ... }
export default _.mapValues(contracts, (k, kName) => ({
  Read: makeReaders(kName, k),
  Write: makeWriters(kName, k),
  Find: makeEventFinders(kName, k),
  Raw: (config) => {
    const kAddress = Array.isArray(k.address) ? k.address[0] : k.address;
    let provider = useProvider();
    return useContract({
      address: kAddress,
      abi: k.abi,
      signerOrProvider: provider,
      ...config,
    });
  },
}));
