<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '~/components/ui/sidebar'
import { ChevronRight } from 'lucide-vue-next'
import {
  CollapsibleRoot,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'reka-ui'

const route = useRoute()
const { isBoardMember, isOwner, isAdmin } = useRoles()

const isActive = (path: string) => {
  if (path === '/financials') {
    return route.path === '/financials' || route.path === '/financials/'
  }
  return route.path === path || route.path.startsWith(path + '/')
}

// Check if any financial route is active (for collapsible default state)
const isFinancialsActive = computed(() => route.path.startsWith('/financials'))
const isCommunicationsActive = computed(() => {
  return route.path.startsWith('/admin/announcements') ||
    route.path.startsWith('/admin/notices') ||
    route.path.startsWith('/admin/email') ||
    route.path.startsWith('/channels') ||
    route.path.startsWith('/admin/analytics')
})
const isManagementActive = computed(() => {
  return route.path.startsWith('/admin/users') ||
    route.path.startsWith('/admin/units') ||
    route.path.startsWith('/admin/permissions') ||
    route.path.startsWith('/admin/approvals') ||
    route.path.startsWith('/admin/invite')
})
const isOperationsActive = computed(() => {
  return route.path.startsWith('/admin/projects') ||
    route.path.startsWith('/tasks') ||
    route.path.startsWith('/requests') ||
    route.path.startsWith('/meetings')
})

// Financial sub-links for the collapsible group
const financialSubLinks = [
  { title: 'Transactions', icon: 'i-heroicons-currency-dollar', to: '/financials' },
  { title: 'Dashboard', icon: 'i-heroicons-chart-bar', to: '/financials/dashboard' },
  { title: 'Reconciliation', icon: 'i-heroicons-document-check', to: '/financials/reconciliation' },
  { title: 'Budget Management', icon: 'i-heroicons-calculator', to: '/financials/budget-management' },
  { title: 'Budget Overview', icon: 'i-heroicons-chart-pie', to: '/financials/budget' },
  { title: 'Year-End', icon: 'i-heroicons-calendar-days', to: '/financials/yearly-reconciliation' },
  { title: 'Import Center', icon: 'i-heroicons-arrow-up-tray', to: '/financials/import-center', boardOnly: true },
]

const communicationsLinks = [
  { title: 'Announcements', icon: 'i-heroicons-megaphone', to: '/admin/announcements' },
  { title: 'Notices', icon: 'i-heroicons-bell', to: '/admin/notices' },
  { title: 'Email Compose', icon: 'i-heroicons-envelope', to: '/admin/email/compose' },
  { title: 'Email Activity', icon: 'i-heroicons-chart-bar', to: '/admin/email-activity' },
  { title: 'Channels', icon: 'i-lucide-messages-square', to: '/channels' },
  { title: 'Analytics', icon: 'i-heroicons-chart-bar-square', to: '/admin/analytics' },
]

const managementLinks = [
  { title: 'Users', icon: 'i-heroicons-users', to: '/admin/users' },
  { title: 'Units', icon: 'i-heroicons-home-modern', to: '/admin/units' },
  { title: 'Permissions', icon: 'i-heroicons-key', to: '/admin/permissions' },
  { title: 'Approvals', icon: 'i-heroicons-clock', to: '/admin/approvals' },
  { title: 'Invite User', icon: 'i-heroicons-envelope-open', to: '/admin/invite' },
]

const operationsLinks = [
  { title: 'Projects', icon: 'i-heroicons-folder', to: '/admin/projects' },
  { title: 'Tasks', icon: 'i-heroicons-clipboard-document-check', to: '/tasks' },
  { title: 'Requests', icon: 'i-heroicons-inbox-arrow-down', to: '/requests' },
  { title: 'Meetings', icon: 'i-heroicons-calendar', to: '/meetings' },
]

const canAccessFinancials = computed(() => isBoardMember.value || isOwner.value)
const hasAdminAccess = computed(() => isBoardMember.value || isOwner.value || isAdmin.value)
const { state: sidebarState } = useSidebar()
const isCollapsed = computed(() => sidebarState.value === 'collapsed')

// Get the first link for each group (for collapsed click navigation)
const financialsFirstLink = computed(() => financialSubLinks[0]?.to || '/financials')
const communicationsFirstLink = computed(() => communicationsLinks[0]?.to || '/admin/announcements')
const managementFirstLink = computed(() => managementLinks[0]?.to || '/admin/users')
const operationsFirstLink = computed(() => operationsLinks[0]?.to || '/admin/projects')
</script>

<template>
  <ClientOnly>
    <Sidebar v-if="hasAdminAccess" collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            as-child
            :is-active="isActive('/dashboard')"
            tooltip="Dashboard"
          >
            <nuxt-link to="/dashboard">
              <Icon name="i-lucide-layout-dashboard" class="size-4 shrink-0" />
              <span>DASHBOARD</span>
            </nuxt-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarSeparator />

    <SidebarContent>
      <!-- Financial - Collapsible group -->
      <SidebarGroup v-if="canAccessFinancials">
        <SidebarGroupContent>
          <SidebarMenu>
            <CollapsibleRoot
              as="li"
              :default-open="isFinancialsActive"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <!-- When collapsed, show a link instead of trigger -->
                <SidebarMenuButton
                  v-if="isCollapsed"
                  as-child
                  :is-active="isFinancialsActive"
                  tooltip="Financials"
                >
                  <nuxt-link :to="financialsFirstLink">
                    <Icon name="i-heroicons-banknotes" class="size-4 shrink-0" />
                    <span>Financials</span>
                  </nuxt-link>
                </SidebarMenuButton>
                <!-- When expanded, show collapsible trigger -->
                <CollapsibleTrigger v-else as-child>
                  <SidebarMenuButton
                    :is-active="isFinancialsActive"
                    tooltip="Financials"
                  >
                    <Icon name="i-heroicons-banknotes" class="size-4 shrink-0" />
                    <span>Financials</span>
                    <ChevronRight class="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent class="collapsible-content">
                  <SidebarMenuSub>
                    <template v-for="sub in financialSubLinks" :key="sub.to">
                      <SidebarMenuSubItem v-if="!sub.boardOnly || isBoardMember">
                        <SidebarMenuSubButton
                          as-child
                          :is-active="isActive(sub.to)"
                        >
                          <nuxt-link :to="sub.to">
                            <span>{{ sub.title }}</span>
                          </nuxt-link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </template>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </CollapsibleRoot>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Communications - Collapsible group -->
      <SidebarGroup v-if="isBoardMember">
        <SidebarGroupContent>
          <SidebarMenu>
            <CollapsibleRoot
              as="li"
              :default-open="isCommunicationsActive"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <!-- When collapsed, show a link instead of trigger -->
                <SidebarMenuButton
                  v-if="isCollapsed"
                  as-child
                  :is-active="isCommunicationsActive"
                  tooltip="Communications"
                >
                  <nuxt-link :to="communicationsFirstLink">
                    <Icon name="i-heroicons-chat-bubble-left-right" class="size-4 shrink-0" />
                    <span>Communications</span>
                  </nuxt-link>
                </SidebarMenuButton>
                <!-- When expanded, show collapsible trigger -->
                <CollapsibleTrigger v-else as-child>
                  <SidebarMenuButton
                    :is-active="isCommunicationsActive"
                    tooltip="Communications"
                  >
                    <Icon name="i-heroicons-chat-bubble-left-right" class="size-4 shrink-0" />
                    <span>Communications</span>
                    <ChevronRight class="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent class="collapsible-content">
                  <SidebarMenuSub>
                    <SidebarMenuSubItem v-for="item in communicationsLinks" :key="item.to">
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isActive(item.to)"
                      >
                        <nuxt-link :to="item.to">
                          <span>{{ item.title }}</span>
                        </nuxt-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </CollapsibleRoot>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Management - Collapsible group -->
      <SidebarGroup v-if="isBoardMember">
        <SidebarGroupContent>
          <SidebarMenu>
            <CollapsibleRoot
              as="li"
              :default-open="isManagementActive"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <!-- When collapsed, show a link instead of trigger -->
                <SidebarMenuButton
                  v-if="isCollapsed"
                  as-child
                  :is-active="isManagementActive"
                  tooltip="Management"
                >
                  <nuxt-link :to="managementFirstLink">
                    <Icon name="i-heroicons-cog-6-tooth" class="size-4 shrink-0" />
                    <span>Management</span>
                  </nuxt-link>
                </SidebarMenuButton>
                <!-- When expanded, show collapsible trigger -->
                <CollapsibleTrigger v-else as-child>
                  <SidebarMenuButton
                    :is-active="isManagementActive"
                    tooltip="Management"
                  >
                    <Icon name="i-heroicons-cog-6-tooth" class="size-4 shrink-0" />
                    <span>Management</span>
                    <ChevronRight class="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent class="collapsible-content">
                  <SidebarMenuSub>
                    <SidebarMenuSubItem v-for="item in managementLinks" :key="item.to">
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isActive(item.to)"
                      >
                        <nuxt-link :to="item.to">
                          <span>{{ item.title }}</span>
                        </nuxt-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </CollapsibleRoot>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Operations - Collapsible group -->
      <SidebarGroup v-if="isBoardMember">
        <SidebarGroupContent>
          <SidebarMenu>
            <CollapsibleRoot
              as="li"
              :default-open="isOperationsActive"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <!-- When collapsed, show a link instead of trigger -->
                <SidebarMenuButton
                  v-if="isCollapsed"
                  as-child
                  :is-active="isOperationsActive"
                  tooltip="Operations"
                >
                  <nuxt-link :to="operationsFirstLink">
                    <Icon name="i-heroicons-wrench-screwdriver" class="size-4 shrink-0" />
                    <span>Operations</span>
                  </nuxt-link>
                </SidebarMenuButton>
                <!-- When expanded, show collapsible trigger -->
                <CollapsibleTrigger v-else as-child>
                  <SidebarMenuButton
                    :is-active="isOperationsActive"
                    tooltip="Operations"
                  >
                    <Icon name="i-heroicons-wrench-screwdriver" class="size-4 shrink-0" />
                    <span>Operations</span>
                    <ChevronRight class="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent class="collapsible-content">
                  <SidebarMenuSub>
                    <SidebarMenuSubItem v-for="item in operationsLinks" :key="item.to">
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isActive(item.to)"
                      >
                        <nuxt-link :to="item.to">
                          <span>{{ item.title }}</span>
                        </nuxt-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </CollapsibleRoot>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton as-child tooltip="Account">
            <nuxt-link to="/account">
              <Icon name="i-heroicons-user-circle" class="size-4 shrink-0" />
              <span>Account</span>
            </nuxt-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
  </ClientOnly>
</template>

<style scoped>
/* Collapsible content transitions */
.collapsible-content {
  overflow: hidden;
}

.collapsible-content[data-state='open'] {
  animation: slideDown 200ms ease-out;
}

.collapsible-content[data-state='closed'] {
  animation: slideUp 200ms ease-out;
}

@keyframes slideDown {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: var(--reka-collapsible-content-height);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    height: var(--reka-collapsible-content-height);
    opacity: 1;
  }
  to {
    height: 0;
    opacity: 0;
  }
}
</style>
