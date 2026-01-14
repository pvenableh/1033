import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        solid: "",
        soft: "",
        subtle: "",
        outline: "border bg-transparent",
      },
      color: {
        default: "",
        primary: "",
        green: "",
        red: "",
        yellow: "",
        orange: "",
        blue: "",
        purple: "",
        amber: "",
        gray: "",
        white: "",
        sky: "",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        xs: "px-2 py-0.5 text-[10px]",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    compoundVariants: [
      // Solid variants
      { variant: "solid", color: "default", class: "bg-primary text-primary-foreground" },
      { variant: "solid", color: "primary", class: "bg-primary text-primary-foreground" },
      { variant: "solid", color: "green", class: "bg-green-500 text-white" },
      { variant: "solid", color: "red", class: "bg-red-500 text-white" },
      { variant: "solid", color: "yellow", class: "bg-yellow-500 text-white" },
      { variant: "solid", color: "orange", class: "bg-orange-500 text-white" },
      { variant: "solid", color: "blue", class: "bg-blue-500 text-white" },
      { variant: "solid", color: "purple", class: "bg-purple-500 text-white" },
      { variant: "solid", color: "amber", class: "bg-amber-500 text-white" },
      { variant: "solid", color: "gray", class: "bg-gray-500 text-white" },
      { variant: "solid", color: "white", class: "bg-white text-gray-900" },
      { variant: "solid", color: "sky", class: "bg-sky-500 text-white" },

      // Soft variants
      { variant: "soft", color: "default", class: "bg-primary/20 text-primary" },
      { variant: "soft", color: "primary", class: "bg-primary/20 text-primary" },
      { variant: "soft", color: "green", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      { variant: "soft", color: "red", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
      { variant: "soft", color: "yellow", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
      { variant: "soft", color: "orange", class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
      { variant: "soft", color: "blue", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      { variant: "soft", color: "purple", class: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
      { variant: "soft", color: "amber", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
      { variant: "soft", color: "gray", class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
      { variant: "soft", color: "white", class: "bg-white/20 text-white" },
      { variant: "soft", color: "sky", class: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },

      // Subtle variants
      { variant: "subtle", color: "default", class: "bg-primary/10 text-primary" },
      { variant: "subtle", color: "primary", class: "bg-primary/10 text-primary" },
      { variant: "subtle", color: "green", class: "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400" },
      { variant: "subtle", color: "red", class: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400" },
      { variant: "subtle", color: "yellow", class: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400" },
      { variant: "subtle", color: "orange", class: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400" },
      { variant: "subtle", color: "blue", class: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
      { variant: "subtle", color: "purple", class: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400" },
      { variant: "subtle", color: "amber", class: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
      { variant: "subtle", color: "gray", class: "bg-gray-50 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400" },
      { variant: "subtle", color: "white", class: "bg-white/10 text-white" },
      { variant: "subtle", color: "sky", class: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400" },

      // Outline variants
      { variant: "outline", color: "default", class: "border-primary text-primary" },
      { variant: "outline", color: "primary", class: "border-primary text-primary" },
      { variant: "outline", color: "green", class: "border-green-500 text-green-600" },
      { variant: "outline", color: "red", class: "border-red-500 text-red-600" },
      { variant: "outline", color: "yellow", class: "border-yellow-500 text-yellow-600" },
      { variant: "outline", color: "orange", class: "border-orange-500 text-orange-600" },
      { variant: "outline", color: "blue", class: "border-blue-500 text-blue-600" },
      { variant: "outline", color: "purple", class: "border-purple-500 text-purple-600" },
      { variant: "outline", color: "amber", class: "border-amber-500 text-amber-600" },
      { variant: "outline", color: "gray", class: "border-gray-500 text-gray-600" },
      { variant: "outline", color: "white", class: "border-white text-white" },
      { variant: "outline", color: "sky", class: "border-sky-500 text-sky-600" },
    ],
    defaultVariants: {
      variant: "solid",
      color: "default",
      size: "default",
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
