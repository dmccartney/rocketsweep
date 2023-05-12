import { useQueries } from "react-query";
import { ZSTDDecoder } from "zstddec";
const zst = new ZSTDDecoder();

export async function fetchJSONZST(url) {
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

export default function useFetchJSONZST(url, options) {
  let urls = Array.isArray(url) ? url : [url];
  let results = useQueries(
    urls.map((url, i) => ({
      queryKey: ["fetchJSONZST", url],
      queryFn: async () => fetchJSONZST(url),
      ...((Array.isArray(options) ? options[i] : options) || {}),
    }))
  );
  if (!Array.isArray(url)) {
    return results[0];
  }
  return results;
}
