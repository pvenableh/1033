<template>
  <SidebarProvider>
    <AdminSidebar />
    <SidebarInset>
      <!-- Admin Header with sidebar trigger -->
      <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
        <div class="flex items-center gap-2">
          <nuxt-link to="/" class="flex items-center gap-2 hover:opacity-80">
            <NewLogo class="w-[100px]" />
          </nuxt-link>
          <Separator orientation="vertical" class="mx-1 data-[orientation=vertical]:h-4" />
          <span class="hidden sm:inline uppercase tracking-wider text-xs font-medium text-muted-foreground">Admin</span>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <nuxt-link to="/account" class="flex items-center">
            <AccountAvatar size="sm" />
          </nuxt-link>
        </div>
      </header>

      <!-- Page content -->
      <div class="flex-1 overflow-auto">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { Separator } from '~/components/ui/separator'
</script>
