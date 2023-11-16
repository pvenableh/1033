import { n as defineEventHandler, f as getQuery, z as withoutBase, d as useRuntimeConfig, h as createError, i as getRouteRules } from '../nitro/vercel.mjs';
import { e as extractAndNormaliseOgImageOptions } from '../utils-pure.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:async_hooks';
import 'vue';

const options = defineEventHandler(async (e) => {
  const query = getQuery(e);
  const path = withoutBase(query.path || "/", useRuntimeConfig().app.baseURL);
  let html;
  try {
    html = await globalThis.$fetch(path);
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read the path ${path} for og-image extraction. ${err.message}.`
    });
  }
  e.node.req.url = path;
  const oldRouteRules = e.context._nitro.routeRules;
  e.context._nitro.routeRules = void 0;
  const routeRules = getRouteRules(e)?.ogImage || {};
  e.context._nitro.routeRules = oldRouteRules;
  e.node.req.url = e.path;
  if (routeRules === false)
    return false;
  const { defaults } = useRuntimeConfig()["nuxt-og-image"];
  const payload = extractAndNormaliseOgImageOptions(path, html, routeRules, defaults);
  if (!payload) {
    throw createError({
      statusCode: 500,
      statusMessage: `The path ${path} is missing the og-image payload.`
    });
  }
  return payload;
});

export { options as default };
//# sourceMappingURL=options.mjs.map
