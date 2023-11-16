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
    const { data: page } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("page", () => {
      return useDirectus(
        readItems("rules", {
          fields: ["*"]
        })
      );
    })), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative w-full min-h-screen flex items-center justify-center flex-col scroll-smooth" }, _attrs))}><h1 class="page__content-title">Rules / Regulations</h1><div class="w-full flex flex-row items-start justify-center relative"><div class="sticky flex flex-col items-start flex-shrink uppercase mr-10 text-right page__nav"><h5 class="uppercase text-xs opacity-25 tracking-wider font-bold w-full mb-4">Sections</h5><!--[-->`);
      ssrRenderList(unref(page), (rule, index) => {
        _push(`<a${ssrRenderAttr("href", "#" + rule.url)}>${ssrInterpolate(rule.title)}</a>`);
      });
      _push(`<!--]--></div><div class="pr-4 pl-4 lg:pl-10 w-full flex-grow scroll-smooth page__content-body rules"><!--[-->`);
      ssrRenderList(unref(page), (rule, index) => {
        _push(`<div class="mb-20"><h3${ssrRenderAttr("id", rule.url)} class="border-b w-full">${ssrInterpolate(rule.title)}</h3><div>${rule.description}</div></div>`);
      });
      _push(`<!--]--></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/rules-regulations/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-0c312a65.mjs.map
