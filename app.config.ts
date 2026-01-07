import { theme } from "~/theme";

export default defineAppConfig({
  // Theme configuration for the application
  theme,

  // Application-wide UI settings (non-NuxtUI)
  ui: {
    // Primary brand color
    primary: "turquoise",
    // Gray scale
    gray: "zinc",
    // Border radius preference (none = sharp corners)
    borderRadius: "none",
    // Icon defaults
    icons: {
      loading: "lucide:loader-2",
      check: "lucide:check",
      close: "lucide:x",
      chevronDown: "lucide:chevron-down",
      chevronUp: "lucide:chevron-up",
      chevronLeft: "lucide:chevron-left",
      chevronRight: "lucide:chevron-right",
      search: "lucide:search",
      menu: "lucide:menu",
      user: "lucide:user",
      settings: "lucide:settings",
    },
  },
});
