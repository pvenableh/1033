<template>
  <SidebarProvider>
    <AdminSidebar />
    <SidebarInset>
      <!-- Admin Header with sidebar trigger -->
      <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <div class="flex items-center gap-2">
          <nuxt-link to="/" class="flex items-center gap-2 text-sm font-medium hover:opacity-80">
            <Icon name="i-heroicons-building-office-2" class="size-4" />
            <span class="hidden sm:inline uppercase tracking-wider text-xs">Admin</span>
          </nuxt-link>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <nuxt-link to="/account" class="text-sm text-muted-foreground hover:text-foreground">
            <Icon name="i-heroicons-user-circle" class="size-5" />
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
