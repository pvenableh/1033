import { ref, mergeProps, unref, useSSRContext } from 'vue';
import { a as useRoute, b as useAsyncData } from '../server.mjs';
import { u as useDirectus } from './useDirectus-a7bab9cf.mjs';
import { readItems } from '@directus/sdk';
import { w as withAsyncContext } from './asyncContext-6deebb0d.mjs';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
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
  __name: "[url]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { params, path } = useRoute();
    const email = ref(null);
    const {
      data: page,
      pending,
      error
    } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("page", () => {
      return useDirectus(
        readItems("announcements", {
          filter: {
            url: {
              _eq: params.url
            }
          },
          fields: ["*"]
        })
      );
    })), __temp = await __temp, __restore(), __temp);
    email.value = page.value[0];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full flex items-center justify-center flex-col" }, _attrs))}><div class="w-full h-4 email__border"></div><div class="w-full flex items-center justify-center flex-col email"><div class="w-full flex items-center justify-center email__header"><a href="https://1033lenox.com" class="inline-block"><img src="https://admin.1033lenox.com/assets/61e1a568-679d-4965-9527-c89009ee2486?key=large"></a></div>`);
      if (unref(email)) {
        _push(`<div class="w-full flex items-center justify-center flex-col email__body"><p style="${ssrRenderStyle({ "font-weight": "900", "line-height": "1.1em", "font-size": "10px", "text-transform": "uppercase", "letter-spacing": "0.07em", "padding-bottom": "30px" })}"> \u{1F6E1} Official Communication of the Lenox Plaza Association \u{1F6E1}</p><h3 class="${ssrRenderClass([{ red: unref(email).urgent }, "email__title"])}">`);
        if (unref(email).urgent) {
          _push(`<span>\u{1F6A8} </span>`);
        } else {
          _push(`<span></span>`);
        }
        _push(`${ssrInterpolate(unref(email).title)}</h3><h5 class="email__subtitle">${ssrInterpolate(unref(email).subtitle)}</h5><div class="w-full email__content"><p>${ssrInterpolate(unref(email).greeting)}</p><div>${unref(email).content}</div><div class="w-full flex flex-row flex-wrap items-start signature"><p class="w-full font-bold greeting">${ssrInterpolate(unref(email).closing)}</p><p class="w-full font-bold greeting">Lenox Plaza Association Board of Directors \u2600\uFE0F</p><p class="tracking-wide font-bold uppercase w-full sm:w-1/2">Peter Wyatt<span class="icon peter">\u{1F576}</span><span class="title">President</span></p><p class="tracking-wide font-bold uppercase w-full sm:w-1/2">Alejandro Salinas<span class="icon">\u{1F3CD}</span><span class="title">Vice-President</span></p><p class="tracking-wide font-bold uppercase w-full sm:w-1/2">Camila Hoffman<span class="icon">\u2728</span><span class="title">Secretary</span></p><p class="tracking-wide font-bold uppercase w-full sm:w-1/2">Nenad Rakita<span class="icon">\u{1F3CA}\u200D\u2642\uFE0F</span><span class="title">Treasurer</span></p><p class="tracking-wide font-bold uppercase w-full sm:w-1/2">Cecilia V. Demattos<span class="icon">\u{1FAB4}</span></p><p class="tracking-wide font-bold uppercase w-full sm:w-1/2">Nick Valencia<span class="icon">\u{1F4D0}</span></p><p class="tracking-wide font-bold uppercase w-full sm:w-1/2">Pat Tamburrino<span class="icon">\u{1F30A}</span></p></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="w-full text-center email__footer"><a href="https://1033lenox.com" class="font-bold tracking-wide uppercase" target="_blank">1033lenox.com</a><h5 class="font-bold tracking-wide uppercase"> \xA9 ${ssrInterpolate(( new Date()).getFullYear())} LENOX PLAZA ASSOCIATION INC. </h5><div class="w-full"><img src="https://admin.1033lenox.com/assets/a7e9ae99-656a-4c18-aeea-f96071ddcb57?key=large" alt="1033 Lenox Ave Building"></div></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/announcements/email/[url].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_url_-7f3d63e7.mjs.map
