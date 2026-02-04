<template>
  <SidebarProvider>
    <AdminSidebar />
    <SidebarInset class="overflow-x-hidden">
      <LayoutHeader :links="[]" />
      <!-- Page content -->
      <div class="flex-1 overflow-x-hidden overflow-y-auto max-w-full">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'
</script>
