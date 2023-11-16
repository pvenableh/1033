import { ref, mergeProps, unref, useSSRContext } from 'vue';
import { b as useAsyncData } from '../server.mjs';
import { u as useDirectus } from './useDirectus-a7bab9cf.mjs';
import { readItems } from '@directus/sdk';
import { w as withAsyncContext } from './asyncContext-6deebb0d.mjs';
import { ssrRenderAttrs } from 'vue/server-renderer';
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
    const doc = ref(null);
    const {
      data: page,
      pending,
      error
    } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("page", () => {
      return useDirectus(
        readItems("by_laws", {
          fields: ["*"]
        })
      );
    })), __temp = await __temp, __restore(), __temp);
    doc.value = page.value;
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative w-full min-h-screen flex items-center justify-center flex-col scroll-smooth documents" }, _attrs))}><h1 class="page__content-title">By-Laws </h1><div class="w-full flex flex-row items-start justify-center relative"><div class="sticky flex flex-col items-start flex-shrink uppercase mr-10 text-right page__nav"><h5 class="uppercase text-xs opacity-25 tracking-wider font-bold w-full mb-4">Sections</h5><a href="#one">Identity</a><a href="#two">Members</a><a href="#three">Members&#39; Meeting</a><a href="#four">Directors</a><a href="#five">Officers</a><a href="#six">Fiscal Management</a><a href="#seven">Parlimentary Rules</a><a href="#eight">Developer</a><a href="#nine">Amendment</a></div>`);
      if (unref(doc).document) {
        _push(`<div class="pr-4 pl-4 lg:pl-10 w-full flex-grow scroll-smooth page__content-body by-laws">${unref(doc).document}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/documents/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-0c0e6943.mjs.map
