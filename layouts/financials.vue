<template>
  <div
    class="min-h-screen w-full transition duration-300 flex items-center justify-start flex-col relative"
    :style="{
      backgroundColor: 'var(--theme-bg-primary)',
      color: 'var(--theme-text-primary)',
    }">
    <input id="nav-drawer-toggle" type="checkbox" class="hidden" />
    <LayoutHeader :links="headerLinks" />
    <LayoutSecondaryNav />
    <div class="page-content w-full" :class="{ 'has-secondary-nav': showSecondaryNav }">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <FinancialsSubNav />
      </div>
      <slot />
    </div>

    <LayoutFooter :links="footerLinks" />
    <LayoutMobileToolbar :links="toolbarLinks" />
    <LayoutNavDrawer />
    <transition name="screen">
      <LayoutScreen v-if="screen" />
    </transition>
  </div>
</template>

<script setup lang="ts">
const { initTheme } = useTheme()
const { user } = useDirectusAuth()
const { isApproved } = useRoles()
const { isSecondaryNavVisible } = useSecondaryNavToggle()

interface Link {
  name: string
  type: string[]
  to: string
  icon: string
}

const props = defineProps({
  links: {
    type: Array as PropType<Link[]>,
    default: () => [],
  },
})

const showSecondaryNav = computed(() => {
  return !!user.value && isApproved.value && isSecondaryNavVisible.value
})

onMounted(() => {
  initTheme()
})

const headerLinks = computed(() => props.links.filter((link) => link.type.includes('header')))
const footerLinks = computed(() => props.links.filter((link) => link.type.includes('footer')))
const toolbarLinks = computed(() => props.links.filter((link) => link.type.includes('toolbar')))

// screen reactive - imported from composable for nav drawer overlay
import { screen } from '~/composables/useScreen'
</script>
