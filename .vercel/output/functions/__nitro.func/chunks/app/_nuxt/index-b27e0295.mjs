import { mergeProps, unref, useSSRContext } from 'vue';
import { b as useAsyncData } from '../server.mjs';
import { u as useDirectus } from './useDirectus-a7bab9cf.mjs';
import { readItems } from '@directus/sdk';
import { w as withAsyncContext } from './asyncContext-6deebb0d.mjs';
import { ssrRenderAttrs, ssrRenderList, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
import '../../nitro/vercel.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:async_hooks';
import 'unhead';
import '@unhead/shared';
import 'vue-router';
import 'framesync';
import 'popmotion';
import 'style-value-types';
import '@vue/shared';
import 'tailwind-merge';
import 'jwt-decode';
import 'vee-validate';
import '@formkit/auto-animate/vue';
import 'crypto';

const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: rules } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("rules", () => {
      return useDirectus(
        readItems("rules", {
          fields: ["*"],
          filter: {
            url: {
              _eq: "trash-recycling"
            }
          }
        })
      );
    })), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative w-full min-h-screen flex items-center justify-start flex-col" }, _attrs))}><h1 class="w-full uppercase tracking-wider mt-6 mb-6 pb-2 text-center border-b max-w-2xl"> Garbage Room Reminders </h1><div class="w-full max-w-2xl rule"><!--[-->`);
      ssrRenderList(unref(rules), (rule, index) => {
        _push(`<div><h3${ssrRenderAttr("id", rule.url)}>${ssrInterpolate(rule.title)}</h3><div>${rule.description}</div></div>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/rules-regulations/garbage-room/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-b27e0295.mjs.map
