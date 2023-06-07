<template>
  <div class="w-full flex items-start justify-start flex-row register">
    <VForm class="w-full" @submit="onSubmit()">
      <FormVInput
        name="first_name"
        type="text"
        rules="required"
        label="First Name"
        v-model="user.first_name"
        class="my-6"
      />
      <FormVInput
        name="last_name"
        type="text"
        rules="required"
        label="Last Name"
        v-model="user.last_name"
        class="my-6"
      />
      <FormVInput
        name="email"
        type="email"
        rules="emailNotExists"
        label="Email"
        v-model="user.email"
        class="my-6"
      />
      <FormVInput
        name="password"
        type="password"
        rules="required"
        label="Password"
        v-model="user.password"
        class="my-6"
      />

      <FormVButton class="w-full mb-6" type="submit">Register</FormVButton>
    </VForm>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from '#imports'
const { createUser, login } = useDirectusAuth()
import { openScreen, loader, closeScreen } from '~/composables/useScreen'
const toast = useToast()
const user = ref({
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  role: '2d496417-1664-4f23-884a-adf169b62547',
  status: 'active',
})
const onSubmit = async () => {
  loader.value = true
  openScreen()
  try {
    var newUser = await createUser(user.value)
    // console.log(newUser)
    // console.log(user.value.email)
    if (newUser) {
      // const status = await login({
      //   email: newUser.data.email,
      //   password: newUser.data.password,
      // })
      // return navigateTo('/account', { replace: true })
      toast.success("You're account has been created.")
      const { data, pending, error, refresh } = await useFetch(
        '/api/registrationnotification?email=' +
          email.value +
          '&first_name=' +
          user.value.first_name,
        {
          onResponse({ request, response, options }) {
            return response._data
          },
        }
      )

      const status = await login({
        email: user.value.email,
        password: user.value.password,
      })
      closeScreen()
      return navigateTo('/account', { replace: true })
    } else {
      toast.error('There was an error with your request.')
    }
  } catch (e) {
    console.log(e)
    toast.error('There was an error: ' + e)
  }
}
</script>
<style>
.account {
  max-width: 1600px;
  &__nav {
    width: 220px;
    img {
      width: 50px;
      height: 50px;
      @apply rounded-full;
    }
    h1 {
      font-size: 10px;
      @apply w-full uppercase tracking-wider pb-2 mb-2;
    }
    a {
      font-size: 10px;
      @apply w-full uppercase tracking-wider pb-2 mb-2;
    }
    a.router-link-exact-active {
      color: var(--purple);
      opacity: 0.75;
    }
  }
  &__profile {
    width: 800px;
  }
}
</style>