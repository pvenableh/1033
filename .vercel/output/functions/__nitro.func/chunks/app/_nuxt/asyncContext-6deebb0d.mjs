import { withAsyncContext as withAsyncContext$1, getCurrentInstance } from 'vue';

function withAsyncContext(fn) {
  return withAsyncContext$1(() => {
    var _a;
    const nuxtApp = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
    return nuxtApp ? nuxtApp.runWithContext(fn) : fn();
  });
}

export { withAsyncContext as w };
//# sourceMappingURL=asyncContext-6deebb0d.mjs.map
