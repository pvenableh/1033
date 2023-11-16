import { _ as __nuxt_component_0 } from './nuxt-link-37f0be90.mjs';
import { ref, mergeProps, withCtx, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { a as useRoute, b as useAsyncData } from '../server.mjs';
import { u as useDirectus } from './useDirectus-a7bab9cf.mjs';
import { readItems } from '@directus/sdk';
import { w as withAsyncContext } from './asyncContext-6deebb0d.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
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
  __name: "[unit]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { params, path } = useRoute();
    const unit = ref(null);
    const { data: page, pending, error } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("page", () => {
      return useDirectus(
        readItems("units", {
          filter: {
            number: {
              _eq: params.unit
            }
          },
          fields: ["*, people.people_id.*"]
        })
      );
    })), __temp = await __temp, __restore(), __temp);
    unit.value = page.value.data[0];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-3xl px-6 py-12 mx-auto space-y-8" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        class: "flex items-center font-bold text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200",
        to: "/"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="mr-2 text-xl"${_scopeId}>\u2190</span> Back to Home Page `);
          } else {
            return [
              createVNode("span", { class: "mr-2 text-xl" }, "\u2190"),
              createTextVNode(" Back to Home Page ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="relative pt-48 pb-10 overflow-hidden shadow-xl rounded-2xl"><div class="absolute inset-0 bg-primary-500 mix-blend-multiply"></div><div class="absolute inset-0 bg-gradient-to-t from-primary-600 via-primary-600 opacity-80"></div><div class="relative px-8"><div class="relative text-lg font-medium text-white md:flex-grow mb-6"><h1 class="text-6xl font-thin tracking-wider uppercase"><span class="opacity-50">Unit: </span>${ssrInterpolate(unref(unit).number)}</h1></div><div class="w-full flex flex-col"><!--[-->`);
      ssrRenderList(unref(unit).people, (person, index) => {
        _push(`<div class="w-full flex flex-col my-4"><h3 class="font-thin tracking-wider uppercase text-white">${ssrInterpolate(person.people_id.first_name)} ${ssrInterpolate(person.people_id.last_name)}</h3><h5 class="text-white">${ssrInterpolate(person.people_id.email)}</h5><h5 class="text-white">${ssrInterpolate(person.people_id.phone)}</h5></div>`);
      });
      _push(`<!--]--></div></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/units/[unit].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_unit_-9f32d9bc.mjs.map
