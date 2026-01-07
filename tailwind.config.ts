import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: [
    "./components/**/*.{ts,tsx,vue}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app/**/*.{ts,tsx,vue}",
    "./App.{js,ts,vue}",
    "./app.{js,ts,vue}",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Original brand colors preserved
        turquoise: {
          100: "#edfffc",
          200: "#c0fff8",
          300: "#81fff3",
          400: "#3affed",
          500: "#00efd1",
          600: "#00e2c7",
          700: "#00b7a5",
          800: "#009184",
          900: "#00726a",
          DEFAULT: "#00efd1",
        },
        gold: {
          DEFAULT: "#C9A96E",
          light: "#D4BA8A",
          dark: "#8B7355",
        },
        cream: {
          DEFAULT: "#FDFCFA",
          alt: "#F5F3EF",
        },
        divider: "#E5E0D8",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        large: "30px",
        card: "var(--border-radius-card, 0px)",
        button: "var(--border-radius-button, 0px)",
        input: "var(--border-radius-input, 0px)",
        panel: "var(--border-radius-panel, 0px)",
      },
      fontFamily: {
        sans: ["Proxima Nova W01 Light", ...defaultTheme.fontFamily.sans],
        body: ["Proxima Nova W01 Light", "Helvetica Neue", "Helvetica", "Roboto", "Arial", "sans-serif"],
        bold: ["Proxima Nova W01 Regular", "Helvetica Neue", "Helvetica", "Roboto", "Arial", "sans-serif"],
        serif: ["Bauer Bodoni Pro_1 W05 Roman", "Times New Roman", "Times", "serif"],
        display: ["Bauer Bodoni Pro_1 W05 Roman", ...defaultTheme.fontFamily.serif],
        mono: defaultTheme.fontFamily.mono,
        signature: ["Gaegu", "cursive", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-.075em",
        tighter: "-.05em",
        tight: "-.025em",
        normal: "0",
        wide: ".1em",
        wider: ".2em",
        widest: ".4em",
        "ultra-wide": "0.25em",
        "extra-wide": "0.15em",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.5s ease-out forwards",
        "track-in": "trackIn 1.2s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        trackIn: {
          "0%": { letterSpacing: "0em", opacity: "0.7" },
          "100%": { letterSpacing: "0.1em", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
