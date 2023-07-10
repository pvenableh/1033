<script setup>
import { Buffer } from 'buffer'
import { navigateTo } from '#imports'
// const toast = useToast()
const route = useRoute()
const { login } = useDirectusAuth()
const encodedEmail = ref(
  Buffer.from(route.params.email, 'base64').toString('ascii')
)
const email = ref(encodedEmail.value)
const userExists = ref()
const user = ref()
const password = ref()
if (email.value) {
  const { data, pending, error, refresh } = await useFetch(
    'https://admin.1033lenox.com/users?filter[email]=' + email.value,
    {
      onResponse({ request, response, options }) {
        return response._data
      },
    }
  )
  if (data._value.data.length) {
    userExists.value = true
    user.value = data._value.data[0]
    console.log('yes')
  } else {
    userExists.value = false
    console.log('no')
  }
}

// const user = ref(productReq[0])
const onSubmit = async () => {
  const { data, refresh } = await useFetch(
    'https://admin.1033lenox.com/users/' + user.value.id,
    {
      headers: { Authorization: 'Bearer rpS9FnBjatOHHUyDye4W4LCqwqV2vhlE' },
      method: 'PATCH',
      body: {
        password: password.value,
      },
    }
  )
  console.log(data._value.data.id)

  // toast.success('Your password was updated.')

  const status = await login({ email: email.value, password: password.value })
  return navigateTo('/account', { replace: true })
}
</script>
<template>
  <div class="flex items-center justify-center flex-col">
    <div v-if="userExists && email">
      <p>Reset password for {{ email }}.</p>
      <VForm class="" @submit="onSubmit()">
        <VInput
          name="password"
          type="password"
          rules="required"
          label="Password"
          v-model="password"
          class="my-6"
        />
        <VButton class="w-full mb-6" type="submit">Update Password</VButton>
      </VForm>
    </div>
    <p v-else>The email address was not found.</p>
  </div>
</template>

<style>
</style>
