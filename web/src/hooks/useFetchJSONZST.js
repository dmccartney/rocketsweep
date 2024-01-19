import { useQueries } from "react-query";
import { ZSTDDecoder } from "zstddec";
const zst = new ZSTDDecoder();

export async function fetchJSONZST(url) {
  if (url.endsWith(".json")) {
    return fetch(url).then((res) => res.json());
  }
  let initingZst = zst.init();
  let res = await fetch(url);
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
    urls.map(({ sourceUrls }, i) => ({
      queryKey: ["fetchJSONZST", sourceUrls[0]],
      queryFn: async () => {
        try {
          return await Promise.any(
            sourceUrls.map((url) =>
              fetchJSONZST(url).catch((err) => {
                console.log(`failed to fetch ${url}`, err);
                throw err;
              })
            )
          );
        } catch (err) {
          console.log(`all sourceUrls failed`, sourceUrls, err);
          throw err;
        }
      },
      ...((Array.isArray(options) ? options[i] : options) || {}),
    }))
  );
}
