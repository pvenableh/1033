import { _ as __nuxt_component_0 } from './Logo-af5e7596.mjs';
import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { d as useAppConfig, t as truncateString } from '../server.mjs';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderAttr, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import colors from 'tailwindcss/colors.js';
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
import 'crypto';

const _sfc_main = /* @__PURE__ */ defineComponent({
  ...{
    inheritAttrs: false
  },
  __name: "Template",
  __ssrInlineRender: true,
  props: {
    imageUrl: {},
    title: {},
    summary: {},
    authorName: {},
    authorImage: {},
    badgeLabel: {},
    badgeColor: {}
  },
  setup(__props) {
    const appConfig = useAppConfig();
    const primaryColor = computed(() => {
      return colors[appConfig.ui.primary];
    });
    const grayColor = computed(() => {
      return colors[appConfig.ui.gray];
    });
    const fonts = {
      display: "Poppins",
      body: "Inter"
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Logo = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ style: {
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden"
      } }, _attrs))}><div style="${ssrRenderStyle({
        background: `linear-gradient(to bottom right,${unref(grayColor)["900"]}, ${unref(primaryColor)["900"]})`,
        position: "absolute",
        inset: "0px",
        width: "100%",
        height: "100%"
      })}"></div>`);
      if (_ctx.imageUrl) {
        _push(`<div style="${ssrRenderStyle({
          position: "absolute",
          inset: "0px",
          width: "100%",
          height: "100%",
          overflow: "hidden"
        })}"><img${ssrRenderAttr("src", _ctx.imageUrl)} style="${ssrRenderStyle({
          objectFit: "cover",
          objectPosition: "center",
          width: "100%",
          height: "100%",
          filter: "grayscale(100%)",
          opacity: "0.3"
        })}"></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div style="${ssrRenderStyle({
        display: "flex",
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        inset: "0px",
        width: "100%",
        height: "100%"
      })}"><div style="${ssrRenderStyle({
        position: "relative",
        width: "1000px",
        padding: "3rem",
        display: "flex",
        flexDirection: "column"
      })}"><div style="${ssrRenderStyle({
        position: "relative",
        width: "100%",
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        borderRadius: "0.5rem",
        border: `2px solid ${unref(primaryColor)["500"]}`,
        backgroundColor: "#ffffff"
      })}">`);
      if (_ctx.title) {
        _push(`<h1 style="${ssrRenderStyle({
          fontFamily: fonts.display,
          fontSize: "4rem",
          fontWeight: "700",
          lineHeight: "0.9",
          color: "#111827"
        })}">${ssrInterpolate(_ctx.title)}</h1>`);
      } else {
        _push(`<!---->`);
      }
      if (_ctx.summary) {
        _push(`<p style="${ssrRenderStyle({
          fontFamily: fonts.body,
          fontSize: "1.5rem",
          fontWeight: "400",
          lineHeight: "1.5",
          color: "#334155",
          marginTop: "1rem"
        })}">${ssrInterpolate(_ctx.summary ? ("truncateString" in _ctx ? _ctx.truncateString : unref(truncateString))(_ctx.summary, 150) : "")}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div style="${ssrRenderStyle({
        display: "flex",
        alignItems: "center",
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid #E5E7EB",
        justifyContent: "space-between"
      })}"><div style="${ssrRenderStyle({
        display: "flex",
        alignItems: "center"
      })}"><div style="${ssrRenderStyle({
        marginRight: "0.5rem"
      })}">`);
      if (_ctx.authorImage) {
        _push(`<img style="${ssrRenderStyle({
          objectFit: "cover",
          objectPosition: "center",
          width: "3rem",
          height: "3rem",
          borderRadius: "9999px"
        })}"${ssrRenderAttr("src", _ctx.authorImage)}>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (_ctx.authorName) {
        _push(`<div style="${ssrRenderStyle({
          fontFamily: fonts.display,
          fontSize: "1.5rem",
          fontWeight: "400",
          lineHeight: "1.5",
          color: "#111827"
        })}">${ssrInterpolate(_ctx.authorName)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (_ctx.badgeLabel) {
        _push(`<div style="${ssrRenderStyle({
          fontFamily: fonts.display,
          fontSize: "1rem",
          fontWeight: "500",
          backgroundColor: `${_ctx.badgeColor}`,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          padding: "0.5rem 1rem",
          borderRadius: ".5rem"
        })}">${ssrInterpolate(_ctx.badgeLabel)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div></div>`);
      _push(ssrRenderComponent(_component_Logo, {
        style: {
          position: "absolute",
          top: "2.5rem",
          right: "2.5rem",
          width: "100%",
          objectFit: "contain",
          maxWidth: "12rem",
          height: "3rem",
          color: "#ffffff"
        },
        color: unref(primaryColor)["500"]
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/OgImage/Template.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=Template-e04cb0d1.mjs.map
