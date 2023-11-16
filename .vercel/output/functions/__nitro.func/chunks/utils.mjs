import { existsSync, promises } from 'node:fs';
import { Buffer } from 'node:buffer';
import { d as useRuntimeConfig, B as prefixStorage, A as useStorage, f as getQuery, v as setHeader, t as withoutLeadingSlash, C as defu, q as useNitroOrigin } from './nitro/vercel.mjs';
import sizeOf from 'image-size';

async function useNitroCache(e, module, options) {
  const { runtimeCacheStorage, version } = useRuntimeConfig()[module];
  const enabled = options.cache && runtimeCacheStorage && options.cacheTtl && options.cacheTtl > 0;
  const baseCacheKey = runtimeCacheStorage === "default" ? `/cache/${module}@${version}` : `/${module}@${version}`;
  const cache = prefixStorage(useStorage(), `${baseCacheKey}/`);
  const key = options.key;
  let xCacheHeader = "DISABLED";
  let xCacheExpires = 0;
  const newExpires = Date.now() + (options.cacheTtl || 0);
  const purge = typeof getQuery(e).purge !== "undefined";
  let cachedItem = false;
  if (!options.skipRestore && enabled && await cache.hasItem(key).catch(() => false)) {
    const { value, expiresAt } = await cache.getItem(key).catch(() => ({ value: null, expiresAt: Date.now() }));
    if (purge) {
      xCacheHeader = "PURGE";
      xCacheExpires = newExpires;
      await cache.removeItem(key).catch(() => {
      });
    } else if (expiresAt > Date.now()) {
      xCacheHeader = "HIT";
      xCacheExpires = newExpires;
      cachedItem = value;
    } else {
      xCacheHeader = "MISS";
      xCacheExpires = expiresAt;
      await cache.removeItem(key).catch(() => {
      });
    }
  }
  if (options.headers) {
    setHeader(e, `x-${module}-cache`, xCacheHeader);
    setHeader(e, `x-${module}-expires`, xCacheExpires.toString());
  }
  return {
    enabled,
    cachedItem,
    async update(item) {
      enabled && await cache.setItem(key, { value: item, expiresAt: Date.now() + (options.cacheTtl || 0) });
    }
  };
}

function normalizeWindowsPath(input = "") {
  if (!input || !input.includes("\\")) {
    return input;
  }
  return input.replace(/\\/g, "/");
}

const _UNC_REGEX = /^[/\\]{2}/;
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
const normalize = function(path) {
  if (path.length === 0) {
    return ".";
  }
  path = normalizeWindowsPath(path);
  const isUNCPath = path.match(_UNC_REGEX);
  const isPathAbsolute = isAbsolute(path);
  const trailingSeparator = path[path.length - 1] === "/";
  path = normalizeString(path, !isPathAbsolute);
  if (path.length === 0) {
    if (isPathAbsolute) {
      return "/";
    }
    return trailingSeparator ? "./" : ".";
  }
  if (trailingSeparator) {
    path += "/";
  }
  if (_DRIVE_LETTER_RE.test(path)) {
    path += "/";
  }
  if (isUNCPath) {
    if (!isPathAbsolute) {
      return `//./${path}`;
    }
    return `//${path}`;
  }
  return isPathAbsolute && !isAbsolute(path) ? `/${path}` : path;
};
const join = function(...arguments_) {
  if (arguments_.length === 0) {
    return ".";
  }
  let joined;
  for (const argument of arguments_) {
    if (argument && argument.length > 0) {
      if (joined === void 0) {
        joined = argument;
      } else {
        joined += `/${argument}`;
      }
    }
  }
  if (joined === void 0) {
    return ".";
  }
  return normalize(joined.replace(/\/\/+/g, "/"));
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};

function wasmLoader(asyncModuleLoad, fallback) {
  let promise;
  let wasm;
  return {
    async load(options) {
      if (typeof promise !== "undefined")
        return promise;
      if (wasm)
        return wasm;
      promise = promise || new Promise(async (resolve) => {
        try {
          wasm = await asyncModuleLoad;
          if (typeof wasm === "string")
            wasm = void 0;
        } catch (e) {
        }
        if (!wasm) {
          wasm = await readPublicAsset(fallback, "base64");
          if (wasm)
            wasm = Buffer.from(wasm, "base64");
        }
        if (!wasm) {
          wasm = await (await globalThis.$fetch(fallback, { baseURL: options.requestOrigin })).arrayBuffer();
          wasm = Buffer.from(wasm);
        }
        resolve(wasm);
      });
      return promise;
    }
  };
}
async function fetchOptionsCached(e, path) {
  const key = [
    withoutLeadingSlash(path === "/" || !path ? "index" : path).replaceAll("/", "-"),
    "options"
  ].join(":");
  const { cachedItem, update } = await useNitroCache(e, "nuxt-og-image", {
    key,
    // allow internal requests to be cached
    cacheTtl: 5 * 1e3,
    cache: !false,
    headers: false
  });
  if (cachedItem)
    return cachedItem;
  const options = await fetchOptions(e, path);
  await update(options);
  return options;
}
async function fetchOptions(e, path) {
  const options = await globalThis.$fetch("/api/og-image-options", {
    query: {
      path
    },
    responseType: "json"
  });
  return defu(
    { requestOrigin: useNitroOrigin(e) },
    options,
    // use query data
    getQuery(e)
  );
}
function base64ToArrayBuffer(base64) {
  const buffer = Buffer.from(base64, "base64");
  return new Uint8Array(buffer).buffer;
}
function r(base, key) {
  return join(base, key.replace(/:/g, "/"));
}
async function readPublicAsset(file, encoding) {
  const { assetDirs } = useRuntimeConfig()["nuxt-og-image"];
  for (const assetDir of assetDirs) {
    const path = r(assetDir, file);
    if (existsSync(path))
      return await promises.readFile(path, { encoding });
  }
}
async function readPublicAssetBase64(file) {
  const base64 = await readPublicAsset(file, "base64");
  if (base64) {
    const dimensions = await sizeOf(Buffer.from(base64, "base64"));
    return {
      src: toBase64Image(file, base64),
      ...dimensions
    };
  }
}
function toBase64Image(fileName, data) {
  const base64 = typeof data === "string" ? data : Buffer.from(data).toString("base64");
  let type = "image/jpeg";
  const ext = fileName.split(".").pop();
  if (ext === "svg")
    type = "image/svg+xml";
  else if (ext === "png")
    type = "image/png";
  return `data:${type};base64,${base64}`;
}

export { readPublicAssetBase64 as a, base64ToArrayBuffer as b, fetchOptionsCached as f, readPublicAsset as r, toBase64Image as t, useNitroCache as u, wasmLoader as w };
//# sourceMappingURL=utils.mjs.map
