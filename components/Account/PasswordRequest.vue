<template>
  <div class="w-full flex items-start justify-start flex-row password-request">
    <VForm class="w-full" @submit="onSubmit()">
      <VInput
        name="email"
        type="email"
        rules="emailExists"
        label="Email"
        v-model="email"
        class="my-6"
      />

      <VButton class="w-full mb-6" type="submit">Send Email</VButton>
    </VForm>
  </div>
</template>

<script setup lang="ts">
import { openScreen, loader, closeScreen } from '~/composables/useScreen'
const toast = useToast()
const email = ref()
const response = ref()
const onSubmit = async () => {
  loader.value = true
  openScreen()
  try {
    const { data, pending, error, refresh } = await useFetch(
      '/api/passwordreset?email=' + email.value,
      {
        onResponse({ request, response, options }) {
          return response._data
        },
      }
    )
    response.value = data
    closeScreen()
    if (response.value) {
      toast.add({ title: 'An email was sent to ' + email.value + '.', click: () => alert('Clicked!') })
    }
  } catch (e) {}
}
</script>
<style>
</style>