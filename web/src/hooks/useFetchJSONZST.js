import { useQueries } from "react-query";
import { ZSTDDecoder } from "zstddec";
const zst = new ZSTDDecoder();

export async function fetchJSONZST(url) {
  if (url.endsWith(".json")) {
    return fetch(url).then((res) => res.json());
  }
  let initingZst = zst.init();
  let res = await fetch(url, {
    // IPFS gateways are slow to timeout on their own.
    signal: AbortSignal.timeout(8000), // ms
  });
  if (!res.ok) {
    throw new Error(`failure fetching JSON ZST from ${url}`);
  }
  await initingZst;
  let data = await res.arrayBuffer();
  let decoded = zst.decode(new Uint8Array(data));
  let text = new TextDecoder("utf-8").decode(decoded);
  return JSON.parse(text);
}

export default function useFetchJSONZST(urls, options) {
  return useQueries(
    urls.map(({ url, fallbackUrls }, i) => ({
      queryKey: ["fetchJSONZST", url],
      queryFn: async () => {
        try {
          return await fetchJSONZST(url);
        } catch (err) {
          console.log(`error fetching ${url}`, err);
          for (const fallbackUrl of fallbackUrls) {
            console.log(`trying fallback ${fallbackUrl}`);
            try {
              return await fetchJSONZST(fallbackUrl);
            } catch (err) {
              console.log(`error fetching ${fallbackUrl}`, err);
            }
          }
          throw err;
        }
      },
      ...((Array.isArray(options) ? options[i] : options) || {}),
    }))
  );
}
