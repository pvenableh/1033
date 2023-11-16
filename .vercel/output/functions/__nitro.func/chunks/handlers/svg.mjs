import { n as defineEventHandler, f as getQuery, x as withBase, d as useRuntimeConfig, v as setHeader, h as createError } from '../nitro/vercel.mjs';
import { f as fetchOptionsCached } from '../utils.mjs';
import { u as useProvider } from '../rollup/provider.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:async_hooks';
import 'vue';
import 'node:fs';
import 'node:buffer';
import 'image-size';
import 'satori-html';
import '../utils-pure.mjs';
import '@resvg/resvg-wasm';
import 'satori';

const svg = defineEventHandler(async (e) => {
  const query = getQuery(e);
  const path = withBase(query.path || "/", useRuntimeConfig().app.baseURL);
  const options = await fetchOptionsCached(e, path);
  setHeader(e, "Content-Type", "image/svg+xml");
  const provider = await useProvider(options.provider);
  if (!provider) {
    throw createError({
      statusCode: 500,
      statusMessage: `Provider ${options.provider} is missing.`
    });
  }
  return provider.createSvg(options);
});

export { svg as default };
//# sourceMappingURL=svg.mjs.map
