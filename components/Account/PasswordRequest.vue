<template>
  <div class="w-full flex items-start justify-start flex-row password-request">
    <VForm class="w-full" @submit="onSubmit()">
      <FormVInput
        name="email"
        type="email"
        rules="emailExists"
        label="Email"
        v-model="email"
        class="my-6"
      />

      <FormVButton class="w-full mb-6" type="submit">Send Email</FormVButton>
    </VForm>
  </div>
</template>

<script setup lang="ts">
import { openScreen, loader, closeScreen } from '~/composables/useScreen'

const email = ref()
const response = ref()
const onSubmit = async () => {
  loader.value = true
  openScreen()
  const resetPassword = await $fetch('/api/email/passwordreset', {
    data: {
      email: email.value,
    }
  }).catch((error) => error.data)
  response.value = resetPassword.data
    closeScreen()
    if (response.value) {
      // toast.add({ title: 'An email was sent to ' + email.value + '.', click: () => alert('Clicked!') })
    }
  // try {
  //   const { data, pending, error, refresh } = await useFetch(
  //     '/api/email/passwordreset?email=' + email.value,
  //     {
  //       onResponse({ request, response, options }) {
  //         return response._data
  //       },
  //     }
  //   )
  //   response.value = data
  //   closeScreen()
    
  // } catch (e) {}
}
</script>
<style>
</style>