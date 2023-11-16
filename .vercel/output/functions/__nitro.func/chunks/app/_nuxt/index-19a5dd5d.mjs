import { _ as __nuxt_component_0 } from './VInput-6f3974c7.mjs';
import { _ as __nuxt_component_0$1 } from './VButton-89f5645d.mjs';
import { ref, resolveComponent, mergeProps, unref, withCtx, isRef, createTextVNode, createVNode, useSSRContext } from 'vue';
import { a as useRoute } from '../server.mjs';
import { a as getRelativeTime } from './time-37ce8841.mjs';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { createDirectus, rest, passwordReset } from '@directus/sdk';
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
  setup(__props) {
    const route = useRoute();
    const reset_token = ref(route.query.token ? route.query.token : "");
    const decoded = ref("");
    const expired = ref(false);
    const expiredDate = ref("");
    const password = ref();
    const client = createDirectus("https://admin.1033lenox.com").with(rest());
    async function submit() {
      const result = await client.request(passwordReset(reset_token.value, password.value));
      console.log(result);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_VForm = resolveComponent("VForm");
      const _component_FormVInput = __nuxt_component_0;
      const _component_FormVButton = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex items-center justify-center flex-col min-h-screen" }, _attrs))}>`);
      if (unref(expired)) {
        _push(`<div><h3>Reset password for ${ssrInterpolate(unref(decoded).email)}.</h3><h5 class="uppercase italic text-xs font-bold">Link expires in ${ssrInterpolate(("getRelativeTime" in _ctx ? _ctx.getRelativeTime : unref(getRelativeTime))(unref(expiredDate)))}</h5>`);
        if (unref(expired)) {
          _push(ssrRenderComponent(_component_VForm, {
            class: "",
            onSubmit: ($event) => submit()
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_FormVInput, {
                  name: "password",
                  type: "password",
                  rules: "required",
                  label: "Password",
                  modelValue: unref(password),
                  "onUpdate:modelValue": ($event) => isRef(password) ? password.value = $event : null,
                  class: "my-6"
                }, null, _parent2, _scopeId));
                _push2(ssrRenderComponent(_component_FormVButton, {
                  class: "w-full mb-6",
                  type: "submit"
                }, {
                  default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      _push3(`Update Password`);
                    } else {
                      return [
                        createTextVNode("Update Password")
                      ];
                    }
                  }),
                  _: 1
                }, _parent2, _scopeId));
              } else {
                return [
                  createVNode(_component_FormVInput, {
                    name: "password",
                    type: "password",
                    rules: "required",
                    label: "Password",
                    modelValue: unref(password),
                    "onUpdate:modelValue": ($event) => isRef(password) ? password.value = $event : null,
                    class: "my-6"
                  }, null, 8, ["modelValue", "onUpdate:modelValue"]),
                  createVNode(_component_FormVButton, {
                    class: "w-full mb-6",
                    type: "submit"
                  }, {
                    default: withCtx(() => [
                      createTextVNode("Update Password")
                    ]),
                    _: 1
                  })
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<h5 class="uppercase italic text-xs font-bold">This link has expired.</h5>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/auth/password-reset/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-19a5dd5d.mjs.map
