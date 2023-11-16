import { _ as __nuxt_component_0 } from './VInput-6f3974c7.mjs';
import { _ as __nuxt_component_0$1 } from './VButton-89f5645d.mjs';
import { useSSRContext, defineComponent, reactive, ref, resolveComponent, mergeProps, unref, withCtx, createTextVNode, createVNode, isRef } from 'vue';
import { l as loader, o as openScreen, c as closeScreen } from './useScreen-ec762145.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrInterpolate } from 'vue/server-renderer';
import { createDirectus, rest, passwordRequest } from '@directus/sdk';
import { u as useDirectusAuth } from '../server.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PasswordRequest",
  __ssrInlineRender: true,
  setup(__props) {
    const client = createDirectus("https://admin.1033lenox.com").with(rest());
    const email = ref();
    async function submit() {
      const result = await client.request(passwordRequest(email.value, "https://1033lenox.com/auth/password-reset"));
      console.log(result);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_VForm = resolveComponent("VForm");
      const _component_FormVInput = __nuxt_component_0;
      const _component_FormVButton = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full flex items-start justify-start flex-row password-request" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_VForm, {
        class: "w-full",
        onSubmit: submit
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_FormVInput, {
              name: "email",
              type: "email",
              rules: "emailExists",
              label: "Email",
              modelValue: unref(email),
              "onUpdate:modelValue": ($event) => isRef(email) ? email.value = $event : null,
              class: "my-6"
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_FormVButton, {
              class: "w-full mb-6",
              type: "submit"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Send Email`);
                } else {
                  return [
                    createTextVNode("Send Email")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_FormVInput, {
                name: "email",
                type: "email",
                rules: "emailExists",
                label: "Email",
                modelValue: unref(email),
                "onUpdate:modelValue": ($event) => isRef(email) ? email.value = $event : null,
                class: "my-6"
              }, null, 8, ["modelValue", "onUpdate:modelValue"]),
              createVNode(_component_FormVButton, {
                class: "w-full mb-6",
                type: "submit"
              }, {
                default: withCtx(() => [
                  createTextVNode("Send Email")
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Account/PasswordRequest.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "signin",
  __ssrInlineRender: true,
  setup(__props) {
    const { login } = useDirectusAuth();
    const credentials = reactive({
      email: "peter@huestudios.com",
      password: "p195pr"
    });
    const loading = ref(false);
    const error = ref(null);
    async function attemptLogin() {
      loader.value = true;
      openScreen();
      const { email, password } = unref(credentials);
      loading.value = true;
      error.value = null;
      try {
        loader.value = false;
        closeScreen();
        await login(email, password);
      } catch (err) {
        error.value = err.message;
      }
      loader.value = false;
      closeScreen();
      loading.value = false;
    }
    const panel = ref("login");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_VForm = resolveComponent("VForm");
      const _component_FormVInput = __nuxt_component_0;
      const _component_FormVButton = __nuxt_component_0$1;
      const _component_AccountPasswordRequest = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex items-center justify-center flex-col login" }, _attrs))}><div${ssrRenderAttrs({
        name: "list",
        class: "login-panels"
      })}>`);
      if (unref(panel) === "register") {
        _push(`<div class="flex items-center justify-center flex-col login-panel"><a class="cursor-pointer login-panel__nav-button purple-txt">Login</a></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(panel) === "login") {
        _push(`<div class="flex items-center justify-center flex-col login-panel"><p class="text-xs uppercase tracking-wide">This platform is accessible by invitation only.</p>`);
        _push(ssrRenderComponent(_component_VForm, {
          class: "w-full",
          onSubmit: ($event) => attemptLogin()
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_FormVInput, {
                name: "email",
                type: "email",
                rules: "emailExists",
                label: "Email",
                modelValue: unref(credentials).email,
                "onUpdate:modelValue": ($event) => unref(credentials).email = $event,
                class: "my-6"
              }, null, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_FormVInput, {
                name: "password",
                type: "password",
                rules: "required",
                label: "Password",
                modelValue: unref(credentials).password,
                "onUpdate:modelValue": ($event) => unref(credentials).password = $event,
                class: "my-6"
              }, null, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_FormVButton, {
                class: "w-full mb-6",
                type: "submit"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`Login`);
                  } else {
                    return [
                      createTextVNode("Login")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_FormVInput, {
                  name: "email",
                  type: "email",
                  rules: "emailExists",
                  label: "Email",
                  modelValue: unref(credentials).email,
                  "onUpdate:modelValue": ($event) => unref(credentials).email = $event,
                  class: "my-6"
                }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                createVNode(_component_FormVInput, {
                  name: "password",
                  type: "password",
                  rules: "required",
                  label: "Password",
                  modelValue: unref(credentials).password,
                  "onUpdate:modelValue": ($event) => unref(credentials).password = $event,
                  class: "my-6"
                }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                createVNode(_component_FormVButton, {
                  class: "w-full mb-6",
                  type: "submit"
                }, {
                  default: withCtx(() => [
                    createTextVNode("Login")
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<a class="cursor-pointer login-panel__nav-button reset purple-txt mt-4">Reset Password</a>`);
        if (unref(error)) {
          _push(`<div class="text-red-500 uppercase tracking-wide font-bold" style="${ssrRenderStyle({ "font-size": "10px" })}">${ssrInterpolate(unref(error))}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(panel) === "request") {
        _push(`<div class="flex items-center justify-center flex-col login-panel">`);
        _push(ssrRenderComponent(_component_AccountPasswordRequest, null, null, _parent));
        _push(`<a class="cursor-pointer login-panel__nav-button">Login</a></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/auth/signin.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=signin-352ac633.mjs.map
