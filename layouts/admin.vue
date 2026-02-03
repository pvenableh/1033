<template>
  <SidebarProvider>
    <AdminSidebar />
    <SidebarInset>
      <LayoutHeader :links="[]" />
      <!-- Page content -->
      <div class="flex-1 overflow-auto">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'
</script>
