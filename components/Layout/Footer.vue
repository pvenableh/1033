<template>
    <div class="
      w-full
      flex
      items-center
      justify-start sm:justify-center px-4 md:px-6 footer">
        <div class="flex items-start flex-col">
            <nuxt-link v-if="user" to="/account">Account</nuxt-link>
            <a v-if="user" @click.prevent="onSubmit()" class="cursor-pointer">Logout</a>
            <nuxt-link v-else to="/login">Login</nuxt-link>
        </div>
    </div>
</template>
<script setup>
const user = useDirectusUser();
import { navigateTo } from '#imports'
const { logout } = useDirectusAuth()

const onSubmit = async () => {
    logout()
    return navigateTo('/', { replace: true })
}
</script>
<style scoped>
.footer {
    a {
        @apply uppercase tracking-wide;
    }
}
</style>
