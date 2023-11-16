import { defineComponent, createVNode, defineAsyncComponent } from 'vue';
import { c as createError } from '../server.mjs';
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
import '@directus/sdk';
import 'vee-validate';
import '@formkit/auto-animate/vue';
import 'vue/server-renderer';
import 'crypto';

const OgImageTemplate = /* @__PURE__ */ defineAsyncComponent(() => import(
  './Template-e04cb0d1.mjs'
  /* webpackChunkName: "components/og-image-template" */
).then((c) => c.default || c));
const OgImageTemplateFallback = /* @__PURE__ */ defineAsyncComponent(() => import(
  './Fallback-167e4133.mjs'
  /* webpackChunkName: "components/og-image-template-fallback" */
).then((c) => c.default || c));
const islandComponents = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  OgImageTemplate,
  OgImageTemplateFallback
});
const islandRenderer = /* @__PURE__ */ defineComponent({
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const component = islandComponents[props.context.name];
    if (!component) {
      throw createError({
        statusCode: 404,
        statusMessage: `Island component not found: ${props.context.name}`
      });
    }
    return () => createVNode(component || "span", { ...props.context.props, "nuxt-ssr-component-uid": "" });
  }
});

export { islandRenderer as default };
//# sourceMappingURL=island-renderer-ed27de94.mjs.map
