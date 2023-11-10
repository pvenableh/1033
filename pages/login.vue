<script setup>
import { openScreen, loader, closeScreen } from '~/composables/useScreen'
const { login } = useDirectusAuth()
import { navigateTo } from '#imports'
const email = ref()
const password = ref()
const error = ref(null)
const signIn = async () => {
  loader.value = true
  openScreen()
  try {
    const status = await login({ email: email.value, password: password.value })
    closeScreen()
    return navigateTo('/account')
  } catch (e) {
    closeScreen()
    error.value = "Login failed, please check your credentials."
  } finally {
    closeScreen()
    return navigateTo('/account')
  }
}

const panel = ref('login')
function movePanel(val) {
  console.log(val)
  panel.value = val
}
</script>

<template>
  <div class="flex items-center justify-center flex-col login">
    <transition-group name="list" tag="div" class="login-panels">
      <div v-if="panel === 'register'" key="1" class="flex items-center justify-center flex-col login-panel">
        <AccountRegister />
        <a @click.prevent="movePanel('login')" class="cursor-pointer login-panel__nav-button purple-txt">Login</a>
      </div>
      <div class="flex items-center justify-center flex-col login-panel" v-if="panel === 'login'" key="2">
        <VForm class="w-full" @submit="signIn()">
          <FormVInput name="email" type="email" rules="emailExists" label="Email" v-model="email" class="my-6" />
          <FormVInput name="password" type="password" rules="required" label="Password" v-model="password" class="my-6" />
          <FormVButton class="w-full mb-6" type="submit">Login</FormVButton>
        </VForm>

        <!-- <a @click.prevent="movePanel('register')" class="cursor-pointer login-panel__nav-button">New? <span
            class="purple-txt">Register Here</span></a> -->
        <!-- <a @click.prevent="movePanel('request')"
          class="cursor-pointer login-panel__nav-button reset purple-txt mt-4">Reset Password</a> -->
          <div v-if="error" class="text-red-500 uppercase tracking-wide font-bold" style="font-size: 10px;">{{ error }}</div>
      </div>
      <div v-if="panel === 'request'" key="3" class="flex items-center justify-center flex-col login-panel">
        <AccountPasswordRequest />
        <a @click.prevent="movePanel('login')" class="cursor-pointer login-panel__nav-button">Login</a>
      </div>
    </transition-group>
  </div>
</template>

<style>
.login {
  /* height: 90vh; */
}

.login-panel {
  width: 350px;
  height: 450px;

  &__nav-button {
    font-size: 14px;
    @apply uppercase tracking-wider;
  }

  &__nav-button.reset {
    font-size: 10px;
  }
}
</style>