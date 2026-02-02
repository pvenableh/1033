<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
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

const quickLinks = [
  { title: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
  { title: 'Admin Home', icon: 'i-heroicons-shield-check', to: '/admin' },
]

const canAccessFinancials = computed(() => isBoardMember.value || isOwner.value)
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in quickLinks" :key="item.to">
          <SidebarMenuButton
            as-child
            :is-active="isActive(item.to)"
            :tooltip="item.title"
          >
            <nuxt-link :to="item.to">
              <Icon :name="item.icon" class="size-4 shrink-0" />
              <span>{{ item.title }}</span>
            </nuxt-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarSeparator />

    <SidebarContent>
      <!-- Financial - Single collapsible entry -->
      <SidebarGroup v-if="canAccessFinancials">
        <SidebarGroupLabel>
          <Icon name="i-heroicons-banknotes" class="size-4 shrink-0 mr-1" />
          Financial
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <CollapsibleRoot
              as="li"
              :default-open="isFinancialsActive"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton
                    :is-active="isFinancialsActive"
                    tooltip="Financials"
                  >
                    <Icon name="i-heroicons-banknotes" class="size-4 shrink-0" />
                    <span>Financials</span>
                    <ChevronRight class="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
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

      <!-- Communications Mode -->
      <SidebarGroup v-if="isBoardMember">
        <SidebarGroupLabel>
          <Icon name="i-heroicons-chat-bubble-left-right" class="size-4 shrink-0 mr-1" />
          Communications
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in communicationsLinks" :key="item.to">
              <SidebarMenuButton
                as-child
                :is-active="isActive(item.to)"
                :tooltip="item.title"
              >
                <nuxt-link :to="item.to">
                  <Icon :name="item.icon" class="size-4 shrink-0" />
                  <span>{{ item.title }}</span>
                </nuxt-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Management Mode -->
      <SidebarGroup v-if="isBoardMember">
        <SidebarGroupLabel>
          <Icon name="i-heroicons-cog-6-tooth" class="size-4 shrink-0 mr-1" />
          Management
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in managementLinks" :key="item.to">
              <SidebarMenuButton
                as-child
                :is-active="isActive(item.to)"
                :tooltip="item.title"
              >
                <nuxt-link :to="item.to">
                  <Icon :name="item.icon" class="size-4 shrink-0" />
                  <span>{{ item.title }}</span>
                </nuxt-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Operations Mode -->
      <SidebarGroup v-if="isBoardMember">
        <SidebarGroupLabel>
          <Icon name="i-heroicons-wrench-screwdriver" class="size-4 shrink-0 mr-1" />
          Operations
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in operationsLinks" :key="item.to">
              <SidebarMenuButton
                as-child
                :is-active="isActive(item.to)"
                :tooltip="item.title"
              >
                <nuxt-link :to="item.to">
                  <Icon :name="item.icon" class="size-4 shrink-0" />
                  <span>{{ item.title }}</span>
                </nuxt-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton as-child tooltip="Back to Site">
            <nuxt-link to="/">
              <Icon name="i-heroicons-arrow-left" class="size-4 shrink-0" />
              <span>Back to Site</span>
            </nuxt-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
