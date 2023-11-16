import { _ as __nuxt_component_3 } from './Avatar-d4c2b86a.mjs';
import { u as useDirectusAuth } from '../server.mjs';
import { defineComponent, computed, ref, mergeProps, unref, useSSRContext, watch, resolveComponent, withCtx, createTextVNode, createVNode } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { _ as _export_sfc } from './_plugin-vue_export-helper-cc2b3d55.mjs';
import { _ as __nuxt_component_0 } from './VInput-6f3974c7.mjs';
import { _ as __nuxt_component_0$1 } from './VButton-89f5645d.mjs';
import { u as useDirectus } from './useDirectus-a7bab9cf.mjs';
import { updateMe } from '@directus/sdk';
import './Icon-ccc8d6de.mjs';
import 'tailwind-merge';
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
import 'jwt-decode';
import 'vee-validate';
import '@formkit/auto-animate/vue';
import 'crypto';

const _sfc_main$2 = {
  __name: "Logout",
  __ssrInlineRender: true,
  setup(__props) {
    useDirectusAuth();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative z-0 cursor-pointer logout-btn" }, _attrs))} data-v-74fac61a> Logout </div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Account/Logout.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-74fac61a"]]);
const _sfc_main$1 = {
  __name: "Profile",
  __ssrInlineRender: true,
  setup(__props) {
    const { user } = useDirectusAuth();
    watch(user.value, (currentValue, oldValue) => {
      return currentValue;
    });
    async function updateUser() {
      await useDirectus(
        updateMe({
          first_name: user.value.first_name,
          last_name: user.value.last_name
        })
      );
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_VForm = resolveComponent("VForm");
      const _component_FormVInput = __nuxt_component_0;
      const _component_FormVButton = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "px-10 account__profile" }, _attrs))}><h2>Profile</h2>`);
      _push(ssrRenderComponent(_component_VForm, {
        class: "",
        onSubmit: ($event) => updateUser()
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_FormVInput, {
              name: "first_name",
              type: "text",
              rules: "required",
              label: "First Name",
              modelValue: unref(user).first_name,
              "onUpdate:modelValue": ($event) => unref(user).first_name = $event,
              class: "my-6"
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_FormVInput, {
              name: "last_name",
              type: "text",
              rules: "required",
              label: "Last Name",
              modelValue: unref(user).last_name,
              "onUpdate:modelValue": ($event) => unref(user).last_name = $event,
              class: "my-6"
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_FormVInput, {
              name: "email",
              type: "email",
              rules: "email|required",
              label: "Email",
              modelValue: unref(user).email,
              "onUpdate:modelValue": ($event) => unref(user).email = $event,
              class: "my-6",
              disabled: "true"
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(_component_FormVButton, {
              class: "w-full mb-6",
              type: "submit"
            }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`Update`);
                } else {
                  return [
                    createTextVNode("Update")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_FormVInput, {
                name: "first_name",
                type: "text",
                rules: "required",
                label: "First Name",
                modelValue: unref(user).first_name,
                "onUpdate:modelValue": ($event) => unref(user).first_name = $event,
                class: "my-6"
              }, null, 8, ["modelValue", "onUpdate:modelValue"]),
              createVNode(_component_FormVInput, {
                name: "last_name",
                type: "text",
                rules: "required",
                label: "Last Name",
                modelValue: unref(user).last_name,
                "onUpdate:modelValue": ($event) => unref(user).last_name = $event,
                class: "my-6"
              }, null, 8, ["modelValue", "onUpdate:modelValue"]),
              createVNode(_component_FormVInput, {
                name: "email",
                type: "email",
                rules: "email|required",
                label: "Email",
                modelValue: unref(user).email,
                "onUpdate:modelValue": ($event) => unref(user).email = $event,
                class: "my-6",
                disabled: "true"
              }, null, 8, ["modelValue", "onUpdate:modelValue"]),
              createVNode(_component_FormVButton, {
                class: "w-full mb-6",
                type: "submit"
              }, {
                default: withCtx(() => [
                  createTextVNode("Update")
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
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Account/Profile.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_2 = _sfc_main$1;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
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
    const panel = ref(1);
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_UAvatar = __nuxt_component_3;
      const _component_AccountLogout = __nuxt_component_1;
      const _component_AccountProfile = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "md:px-6 mx-auto flex items-start justify-center flex-col md:flex-row relative px-4 pt-20 account" }, _attrs))}><div class="md:top-4 flex md:items-end md:justify-end flex-col w-full md:mr-6 lg:mr account__navigation">`);
      _push(ssrRenderComponent(_component_UAvatar, {
        size: "md",
        src: unref(avatar),
        alt: ((_a = unref(user)) == null ? void 0 : _a.first_name) + " " + ((_b = unref(user)) == null ? void 0 : _b.last_name)
      }, null, _parent));
      _push(`<h1 class="hidden md:inline-block mt-6">${ssrInterpolate((_c = unref(user)) == null ? void 0 : _c.first_name)} ${ssrInterpolate((_d = unref(user)) == null ? void 0 : _d.last_name)}</h1><a class="${ssrRenderClass({ active: unref(panel) === 1 })}">Profile</a>`);
      if (unref(user)) {
        _push(ssrRenderComponent(_component_AccountLogout, { class: "logout-icon" }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div${ssrRenderAttrs({
        name: "list",
        class: "w-full flex flex-col items-center justify-start relative account__panels"
      })}>`);
      if (unref(panel) === 1) {
        _push(`<div class="account__panel profile">`);
        _push(ssrRenderComponent(_component_AccountProfile, null, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(panel) === 2) {
        _push(`<div class="account__panel"></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(panel) === 3) {
        _push(`<div class="account__panel"></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(panel) === 4) {
        _push(`<div class="account__panel"></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/account/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-ddcb556d.mjs.map
