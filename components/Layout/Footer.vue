<template>
    <div class="
      w-full
      flex
      items-center
      justify-start sm:justify-center px-4 md:px-6 footer">
        <div class="flex items-start flex-col hidden">
            <nuxt-link v-if="auth.loggedIn" to="/account">Account</nuxt-link>
            <a v-if="auth.loggedIn" @click.prevent="onSubmit()" class="cursor-pointer">Logout</a>
            <nuxt-link v-else to="/login">Login</nuxt-link>
        </div>
    </div>
</template>
<script setup>
const user = useDirectusUser();
import { useAuth } from '~~/stores/AuthStore'

const auth = useAuth()

</script>
<style scoped>
.footer {
    a {
        @apply uppercase tracking-wide;
    }
}
</style>
