import { _ as __nuxt_component_0$1 } from './PeopleCalculator-35ccaa6d.mjs';
import { computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';
import { b as useAsyncData } from '../server.mjs';
import { u as useDirectus } from './useDirectus-a7bab9cf.mjs';
import { readItems } from '@directus/sdk';
import { w as withAsyncContext } from './asyncContext-6deebb0d.mjs';
import 'tailwind-merge';
import './Avatar-d4c2b86a.mjs';
import './Icon-ccc8d6de.mjs';
import './_plugin-vue_export-helper-cc2b3d55.mjs';
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

const _sfc_main$1 = {
  __name: "Card",
  __ssrInlineRender: true,
  props: {
    meeting: {
      type: Object,
      default: null
    }
  },
  setup(__props) {
    const props = __props;
    const minutes = computed(() => {
      if (props.meeting.files.length) {
        return props.meeting.files.filter((file) => {
          if (file.directus_files_id.tags.length) {
            return file.directus_files_id.tags.includes("Minutes");
          } else {
            return false;
          }
        }).map((file) => {
          return file.directus_files_id.id;
        }).join(", ");
      } else {
        return false;
      }
    });
    const agenda = computed(() => {
      if (props.meeting.files.length) {
        return props.meeting.files.filter((file) => {
          if (file.directus_files_id.tags.length) {
            return file.directus_files_id.tags.includes("Agenda");
          } else {
            return false;
          }
        }).map((file) => {
          return file.directus_files_id.id;
        }).join(", ");
      } else {
        return false;
      }
    });
    const formattedDate = computed(() => {
      if (props.meeting.date) {
        const options = { year: "numeric", month: "long", day: "numeric" };
        const [year, month, day] = props.meeting.date.split("-");
        return new Date(year, month - 1, day).toLocaleDateString("en-US", options);
      } else {
        return false;
      }
    });
    const formattedTime = computed(() => {
      if (props.meeting.time) {
        const [hour, minute] = props.meeting.time.split(":");
        const newTime = /* @__PURE__ */ new Date();
        newTime.setHours(hour);
        newTime.setMinutes(minute);
        return newTime.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "numeric",
          minute: "numeric"
        });
      } else {
        return;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_MeetingsPeopleCalculator = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col lg:flex-row lg:flex-wrap meeting-card" }, _attrs))}><div class="w-full mb-4 meeting-card__title"><h2 class="tracking-wide">${ssrInterpolate(unref(formattedDate))} @ ${ssrInterpolate(unref(formattedTime))}</h2><h4 class="tracking-wide"><span class="opacity-50">${ssrInterpolate(__props.meeting.category)} Location: </span> Community Room</h4></div>`);
      if (__props.meeting.people.length) {
        _push(ssrRenderComponent(_component_MeetingsPeopleCalculator, {
          people: __props.meeting.people,
          date: __props.meeting.date
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="w-full flex items-start mt-4 justify-start">`);
      if (unref(agenda)) {
        _push(`<a class="mr-4 button"${ssrRenderAttr("href", "https://admin.1033lenox.com/assets/" + unref(agenda))} target="_blank">Agenda</a>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(minutes)) {
        _push(`<a class="button"${ssrRenderAttr("href", "https://admin.1033lenox.com/assets/" + unref(minutes))} target="_blank">Minutes</a>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Meetings/Card.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = _sfc_main$1;
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const {
      data: meetings,
      pending,
      error
    } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("meetings", () => {
      return useDirectus(
        readItems("meetings", {
          fields: [
            "id,status,title,category,description,date,time,files.directus_files_id.id,files.directus_files_id.tags,files.directus_files_id.description,files.directus_files_id.title,url,presentations.*,people.people_id.unit.units_id.number,people.people_id.board_member.status,people.people_id.first_name,people.people_id.last_name,people.people_id.email,people.people_id.board_member.title,people.people_id.board_member.start,people.people_id.board_member.finish,people.people_id.board_member.person"
          ],
          sort: "-date"
        })
      );
    })), __temp = await __temp, __restore(), __temp);
    const pastMeetings = computed(() => {
      if (meetings) {
        return meetings.value.filter((meeting) => {
          return new Date(meeting.date) < /* @__PURE__ */ new Date();
        });
      } else {
        return [];
      }
    });
    computed(() => {
      if (meetings) {
        return meetings.value.filter((meeting) => {
          return new Date(meeting.date) >= /* @__PURE__ */ new Date();
        });
      } else {
        return [];
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_MeetingsCard = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative w-full min-h-screen flex items-center justify-start flex-col meetings" }, _attrs))}><div class="w-full max-w-7xl flex items-center justify-start flex-col flex-wrap"><h2 class="page__content-title">Board Meetings</h2>`);
      if (unref(pending)) {
        _push(`<div>Loading</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(pastMeetings)) {
        _push(`<div><!--[-->`);
        ssrRenderList(unref(pastMeetings), (item, index) => {
          _push(ssrRenderComponent(_component_MeetingsCard, {
            key: index,
            meeting: item
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(error)) {
        _push(`<div>Error</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/meetings/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-fbaa5422.mjs.map
