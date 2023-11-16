import { _ as __nuxt_component_0, a as __nuxt_component_1, b as __nuxt_component_5 } from './NavDrawer-49ae2182.mjs';
import { useSSRContext, mergeProps, unref } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderSlot } from 'vue/server-renderer';
import { s as screen, l as loader } from './useScreen-ec762145.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-cc2b3d55.mjs';
import './math-098b0747.mjs';
import './asyncContext-6deebb0d.mjs';
import './nuxt-link-37f0be90.mjs';
import '../../nitro/vercel.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:async_hooks';
import '../server.mjs';
import 'unhead';
import '@unhead/shared';
import 'vue-router';
import 'framesync';
import 'popmotion';
import 'style-value-types';
import '@vue/shared';
import 'tailwind-merge';
import 'jwt-decode';
import '@directus/sdk';
import 'vee-validate';
import '@formkit/auto-animate/vue';
import 'crypto';
import './Logo-af5e7596.mjs';
import './Avatar-d4c2b86a.mjs';
import './Icon-ccc8d6de.mjs';
import './Icon-8655181f.mjs';

const _sfc_main$1 = {
  __name: "Screen",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "screen",
        class: "fixed h-screen w-full flex items-center justify-center screen cursor-pointer"
      }, _attrs))} data-v-7841fce9>`);
      if (unref(loader)) {
        _push(`<svg aria-hidden="true" class="mr-2 w-8 h-8 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-7841fce9><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#cccccc" data-v-7841fce9></path><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#502989" data-v-7841fce9></path></svg>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Layout/Screen.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-7841fce9"]]);
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_LayoutHeader = __nuxt_component_0;
  const _component_LayoutFooter = __nuxt_component_1;
  const _component_LayoutScreen = __nuxt_component_2;
  const _component_LayoutNavDrawer = __nuxt_component_5;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen w-full transition duration-150 bg-white flex items-center justify-start flex-col relative" }, _attrs))}><input id="nav-drawer-toggle" type="checkbox" class="hidden"><div class="w-full flex items-center justify-center flex-col min-h-screen page__content">`);
  _push(ssrRenderComponent(_component_LayoutHeader, null, null, _parent));
  _push(`<h1 class="uppercase tracking-wide text-xs">Authorized</h1><div class="w-full mx-auto min-h-screen relative px-4 md:px-6">`);
  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</div>`);
  _push(ssrRenderComponent(_component_LayoutFooter, null, null, _parent));
  _push(`</div>`);
  if ("screen" in _ctx ? _ctx.screen : unref(screen)) {
    _push(ssrRenderComponent(_component_LayoutScreen, null, null, _parent));
  } else {
    _push(`<!---->`);
  }
  _push(ssrRenderComponent(_component_LayoutNavDrawer, null, null, _parent));
  _push(`</div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/auth.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const auth = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { auth as default };
//# sourceMappingURL=auth-c23a3fbc.mjs.map
