export { default as ChartContainer } from "./ChartContainer.vue"

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
    icon?: string
  }
}
