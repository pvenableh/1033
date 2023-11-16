import { r as roundToDecimal } from './math-098b0747.mjs';
import { useSSRContext, computed, mergeProps, withCtx, createVNode, unref, createTextVNode } from 'vue';
import { w as withAsyncContext } from './asyncContext-6deebb0d.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';
import { _ as __nuxt_component_0$2 } from './nuxt-link-37f0be90.mjs';
import { _ as __nuxt_component_0$3 } from './Logo-af5e7596.mjs';
import { _ as __nuxt_component_3 } from './Avatar-d4c2b86a.mjs';
import { u as useDirectusAuth } from '../server.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-cc2b3d55.mjs';
import { _ as __nuxt_component_0$4 } from './Icon-8655181f.mjs';

const _sfc_main$3 = {
  __name: "Weather",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const weather = ([__temp, __restore] = withAsyncContext(() => $fetch(
      "https://api.openweathermap.org/data/2.5/weather?lat=25.7803705&lon=-80.1388466&appid=11a6889ce0bda17eda9f935cd43fba39&units=imperial"
    ).catch((error) => error.data)), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "hidden sm:inline-block weather" }, _attrs))}><h5 class="uppercase tracking-wide weather__intro"></h5><h5 class="uppercase tracking-wide weather__stats"><span class="">${ssrInterpolate(("roundToDecimal" in _ctx ? _ctx.roundToDecimal : unref(roundToDecimal))(unref(weather).main.temp, 0))}\xB0</span> / ${ssrInterpolate(unref(weather).weather[0].main)} <img${ssrRenderAttr("src", "https://openweathermap.org/img/wn/" + unref(weather).weather[0].icon + ".png")}${ssrRenderAttr("alt", unref(weather).weather[0].description)} class="hidden sm:inline-block"></h5></div>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Insights/Weather.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_0$1 = _sfc_main$3;
const _sfc_main$2 = {
  __name: "Header",
  __ssrInlineRender: true,
  setup(__props) {
    const { user } = useDirectusAuth();
    const avatar = computed(() => {
      var _a, _b;
      if (user.value.avatar) {
        return "https://admin.1033lenox.com/assets/" + user.value.avatar + "?key=medium";
      } else {
        return "https://ui-avatars.com/api/?name=" + ((_a = user.value) == null ? void 0 : _a.first_name) + " " + ((_b = user.value) == null ? void 0 : _b.last_name) + "&background=eeeeee&color=00bfff";
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_InsightsWeather = __nuxt_component_0$1;
      const _component_nuxt_link = __nuxt_component_0$2;
      const _component_Logo = __nuxt_component_0$3;
      const _component_UAvatar = __nuxt_component_3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative w-full flex items-center justify-center px-4 md:px-6 header" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_InsightsWeather, { class: "absolute left-[5px] sm:pl-1 md:px-6 -mt-[4px]" }, null, _parent));
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_Logo, null, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_Logo)
            ];
          }
        }),
        _: 1
      }, _parent));
      if (unref(user)) {
        _push(`<div class="scale-75 sm:scale-100 absolute inline-block right-[10px] sm:pr-1 md:px-6">`);
        _push(ssrRenderComponent(_component_UAvatar, {
          "chip-color": "sky",
          "chip-text": "12",
          "chip-position": "top-right",
          size: "sm",
          src: unref(avatar),
          alt: ((_a = unref(user)) == null ? void 0 : _a.first_name) + " " + ((_b = unref(user)) == null ? void 0 : _b.last_name)
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<div class="scale-75 sm:scale-100 absolute inline-block right-[10px] sm:pr-1 md:px-6">`);
        _push(ssrRenderComponent(_component_UAvatar, {
          icon: "i-heroicons-user",
          "chip-color": "sky",
          "chip-text": "12",
          "chip-position": "top-right",
          size: "sm"
        }, null, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Layout/Header.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_0 = _sfc_main$2;
const _sfc_main$1 = {
  __name: "Footer",
  __ssrInlineRender: true,
  setup(__props) {
    const { logout, _loggedIn } = useDirectusAuth();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_nuxt_link = __nuxt_component_0$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full flex flex-col md:flex-row flex-wrap items-center justify-start sm:justify-center px-4 md:px-6 pb-10 mt-16 md:mt-20 footer" }, _attrs))} data-v-a8cc5127><div class="flex items-start justify-start flex-col footer__col" data-v-a8cc5127>`);
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Home`);
          } else {
            return [
              createTextVNode("Home")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/meetings/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Meetings`);
          } else {
            return [
              createTextVNode("Meetings")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex items-start justify-start flex-col footer__col" data-v-a8cc5127>`);
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/announcements/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Announcements`);
          } else {
            return [
              createTextVNode("Announcements")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/projects/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Projects`);
          } else {
            return [
              createTextVNode("Projects")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex items-start justify-start flex-col footer__col" data-v-a8cc5127>`);
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/rules-regulations" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Rules / Regulations`);
          } else {
            return [
              createTextVNode("Rules / Regulations")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/documents/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`By-Laws`);
          } else {
            return [
              createTextVNode("By-Laws")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex items-start justify-start flex-col footer__col" data-v-a8cc5127>`);
      if (unref(_loggedIn).get()) {
        _push(ssrRenderComponent(_component_nuxt_link, { to: "/account" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Account`);
            } else {
              return [
                createTextVNode("Account")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      if (unref(_loggedIn).get()) {
        _push(`<a class="cursor-pointer" data-v-a8cc5127>Logout</a>`);
      } else {
        _push(ssrRenderComponent(_component_nuxt_link, { to: "/login" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Login`);
            } else {
              return [
                createTextVNode("Login")
              ];
            }
          }),
          _: 1
        }, _parent));
      }
      _push(`</div><div class="w-full flex items-center justify-center flex-col sm:flex-row my-12 footer__contact-info" data-v-a8cc5127><h5 data-v-a8cc5127>1033 Lenox Ave</h5><h5 data-v-a8cc5127>Maimi Beach, FL</h5><h5 data-v-a8cc5127>33139</h5><h5 data-v-a8cc5127>786.395.3049</h5></div><div class="flex w-full flex-col items-center justify-center" data-v-a8cc5127><h5 class="web-designer" data-v-a8cc5127><a href="https://huestudios.com" target="_blank" rel="noopener" class="columns shrink body-font" data-v-a8cc5127>designed by <svg id="hue-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98.44 48.62" data-v-a8cc5127><title data-v-a8cc5127>hue Creative Marketing - New York | Miami</title><path class="h" d="M347.41,282.12h6.28v19.35c2-3.5,6.14-5.48,10.77-5.48,3.5,0,8.52,1.25,10.44,5.28.66,1.32,1.12,2.91,1.12,7.73v20.74h-3.56c-5.61,0-2.78-19.62-2.78-19.62,0-3,0-9.38-7.13-9.38a8.57,8.57,0,0,0-7.79,4.43c-1.06,1.85-1.06,5-1.06,7v17.57h-6.28Z" transform="translate(-347.41 -282.12)" data-v-a8cc5127></path><path class="h" d="M388.17,296.59v21.34c0,3.24.73,7.33,7.07,7.33,3.1,0,6-1.06,7.79-3.7,1.39-2,1.39-4.56,1.39-6.21,0,0-1.87-18.76,2.07-18.76h4.33v27c0,.66.13,4.36.2,6.21h-6.47l-.13-5.68c-1.19,2.31-3.44,6-10.57,6-8.19,0-12-4.69-12-11.23V296.59Z" transform="translate(-347.41 -282.12)" data-v-a8cc5127></path><path class="h" d="M422,314.29c-.13,6.87,2.71,12,9.51,12,5.93,0,6.3-6.87,9.67-6.87h4.33a11.26,11.26,0,0,1-2.84,6.94c-1.45,1.65-4.76,4.43-11.43,4.43-10.44,0-15.39-6.47-15.39-17,0-6.54,1.32-12,6.54-15.59,3.17-2.25,7.13-2.44,9.05-2.44,14.86,0,14.53,13.15,14.4,18.56Zm17.51-4.36c.07-3.17-.53-9.78-8.19-9.78-4,0-8.92,2.44-9,9.78Z" transform="translate(-347.41 -282.12)" data-v-a8cc5127></path></svg></a></h5><h5 class="tracking-widest uppercase body-font copyright" data-v-a8cc5127> \xA9 ${ssrInterpolate(( new Date()).getFullYear())} Lenox Plaza Association, LLC </h5></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Layout/Footer.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-a8cc5127"]]);
const _sfc_main = {
  __name: "NavDrawer",
  __ssrInlineRender: true,
  setup(__props) {
    const { logout, user } = useDirectusAuth();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Icon = __nuxt_component_0$4;
      const _component_nuxt_link = __nuxt_component_0$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex items-center justify-center flex-col nav-drawer" }, _attrs))}><div class="w-full nav-drawer__menu-box p-4 relative">`);
      _push(ssrRenderComponent(_component_Icon, {
        color: "var(--white)",
        class: "lenox-icon"
      }, null, _parent));
      _push(`<ul class="w-full nav-drawer__menu outline-0 text-center"><li class="outline-0">`);
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Home`);
          } else {
            return [
              createTextVNode("Home")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/meetings/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Meetings`);
          } else {
            return [
              createTextVNode("Meetings")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/announcements/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Announcements`);
          } else {
            return [
              createTextVNode("Announcements")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/projects/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Projects`);
          } else {
            return [
              createTextVNode("Projects")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/rules-regulations/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Rules / Regulations`);
          } else {
            return [
              createTextVNode("Rules / Regulations")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_nuxt_link, { to: "/documents/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`By-Laws`);
          } else {
            return [
              createTextVNode("By-Laws")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li>`);
      if (!unref(user)) {
        _push(`<li>`);
        _push(ssrRenderComponent(_component_nuxt_link, { to: "/auth/signin" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Login`);
            } else {
              return [
                createTextVNode("Login")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(user)) {
        _push(`<li>`);
        _push(ssrRenderComponent(_component_nuxt_link, { to: "/account/" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Account`);
            } else {
              return [
                createTextVNode("Account")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(user)) {
        _push(`<li><a class="cursor-pointer">Logout</a></li>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</ul></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Layout/NavDrawer.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_5 = _sfc_main;

export { __nuxt_component_0 as _, __nuxt_component_1 as a, __nuxt_component_5 as b };
//# sourceMappingURL=NavDrawer-49ae2182.mjs.map
