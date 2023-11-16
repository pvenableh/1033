import { _ as __nuxt_component_0 } from './nuxt-link-37f0be90.mjs';
import { _ as __nuxt_component_1 } from './Icon-ccc8d6de.mjs';
import { computed, mergeProps, unref, withCtx, createVNode, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { b as useAsyncData } from '../server.mjs';
import { u as useDirectus } from './useDirectus-a7bab9cf.mjs';
import { readItems } from '@directus/sdk';
import { g as getFriendlyDate } from './time-37ce8841.mjs';
import { w as withAsyncContext } from './asyncContext-6deebb0d.mjs';
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import '../../nitro/vercel.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:async_hooks';
import './_plugin-vue_export-helper-cc2b3d55.mjs';
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
    const { data: announcements } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("announcements", () => {
      return useDirectus(
        readItems("announcements", {
          fields: ["*"],
          filter: {
            status: {
              _eq: "sent"
            }
          },
          sort: "-date_sent"
        })
      );
    })), __temp = await __temp, __restore(), __temp);
    const filteredAnnouncements = computed(() => {
      let possibleStrings = ["Minutes", "Agenda", "Board Meeting"];
      return announcements.value.map((item) => {
        if (item.tags) {
          if (!possibleStrings.some((possibleString) => item.tags.includes(possibleString))) {
            console.log(item.tags);
            return item;
          }
          return null;
        } else {
          return item;
        }
      }).filter(Boolean);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_nuxt_link = __nuxt_component_0;
      const _component_UIcon = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative w-full min-h-screen flex items-center justify-start flex-col scroll-smooth" }, _attrs))}><h1 class="page__content-title"> Announcements</h1><div class="w-full flex flex-row items-start justify-center relative"><div class="pr-4 pl-4 lg:pl-10 w-full max-w-xl announcements">`);
      if (unref(announcements)) {
        _push(`<div class="my-4"><!--[-->`);
        ssrRenderList(unref(filteredAnnouncements), (item, index) => {
          _push(ssrRenderComponent(_component_nuxt_link, {
            key: index,
            class: "relative uppercase inline-block w-full relative mb-12 announcement__card",
            to: "/announcements/email/" + item.url
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<h3 class="leading-4 uppercase"${_scopeId}>${ssrInterpolate(item.title)} `);
                _push2(ssrRenderComponent(_component_UIcon, {
                  name: "i-heroicons-arrow-right",
                  class: "ml-2 mb-[-2px] opacity-75"
                }, null, _parent2, _scopeId));
                _push2(`</h3><h5 class="text-xs opacity-75 mt-[2px] leading-4"${_scopeId}>${ssrInterpolate(item.subtitle)}</h5><p class="uppercase text-xs mt-[2px] leading-4"${_scopeId}><span class="opacity-50"${_scopeId}>Sent on:</span> ${ssrInterpolate(("getFriendlyDate" in _ctx ? _ctx.getFriendlyDate : unref(getFriendlyDate))(item.date_sent))}</p>`);
              } else {
                return [
                  createVNode("h3", { class: "leading-4 uppercase" }, [
                    createTextVNode(toDisplayString(item.title) + " ", 1),
                    createVNode(_component_UIcon, {
                      name: "i-heroicons-arrow-right",
                      class: "ml-2 mb-[-2px] opacity-75"
                    })
                  ]),
                  createVNode("h5", { class: "text-xs opacity-75 mt-[2px] leading-4" }, toDisplayString(item.subtitle), 1),
                  createVNode("p", { class: "uppercase text-xs mt-[2px] leading-4" }, [
                    createVNode("span", { class: "opacity-50" }, "Sent on:"),
                    createTextVNode(" " + toDisplayString(("getFriendlyDate" in _ctx ? _ctx.getFriendlyDate : unref(getFriendlyDate))(item.date_sent)), 1)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/announcements/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-6f9b9cb9.mjs.map
