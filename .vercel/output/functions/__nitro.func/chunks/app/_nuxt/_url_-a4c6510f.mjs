import { ref, resolveComponent, mergeProps, unref, useSSRContext } from 'vue';
import { a as useRoute, b as useAsyncData } from '../server.mjs';
import { u as useDirectus } from './useDirectus-a7bab9cf.mjs';
import { readItems } from '@directus/sdk';
import { w as withAsyncContext } from './asyncContext-6deebb0d.mjs';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
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
    const { data: projects, pending, error } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("projects", () => {
      return useDirectus(
        readItems("projects", {
          filter: {
            url: {
              _eq: params.url
            }
          },
          fields: [
            "id,title,category,description,url,vendors.vendors_projects_id.vendors_id.*,events.*,documents.*"
          ]
        })
      );
    })), __temp = await __temp, __restore(), __temp);
    const project = ref(projects[0]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_FormButton = resolveComponent("FormButton");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full flex items-start justify-center flex-col lg:flex-row relative project" }, _attrs))}><div class="w-full flex flex-col items-start justify-center lg:sticky project__info">${ssrInterpolate(unref(project))} <div class="w-full flex items-center justify-between flex-row my-4">`);
      _push(ssrRenderComponent(_component_FormButton, {
        onClick: _ctx.showEventForm,
        label: "Add Event",
        width: "160"
      }, null, _parent));
      _push(`</div></div><div class="w-full flex items-center justify-center flex-col md:mt-12 project-events"><div class="w-full max-w-xl flex items-center justify-center flex-row mb-12 project-events__controls"></div><div${ssrRenderAttrs({
        name: "list",
        mode: "out-in",
        class: "w-full flex flex-col align-middle justify-center items-center projects__completed"
      })}></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/projects/[url].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_url_-a4c6510f.mjs.map
