<template>
  <div class="w-full flex items-start justify-start flex-row register">
    <VForm class="w-full" @submit="getPerson()">
      <!-- <FormVInput
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
      /> -->
      <FormVInput name="email" type="email" rules="personExists" label="Email" v-model="user.email" class="my-6" />
      <FormVInput name="password" type="password" rules="required" label="Password" v-model="user.password"
        class="my-6" />
      <FormVButton class="w-full mb-6" type="submit">Register</FormVButton>
    </VForm>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from '#imports'
const { createUser, login } = useDirectusAuth()
import { openScreen, loader, closeScreen } from '~/composables/useScreen'
const ownerRole = ref('ae20ccef-b4ab-42e2-b8e3-fba5f4684929')
const tenantRole = ref('ab66d5f6-8eb0-48e4-a021-68d758aae525')
const user = ref({
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  role: '',
  status: 'active',
})
async function getPerson() {
  loader.value = true
  openScreen()
  const { data: exists } = await useFetch('https://admin.1033lenox.com/items/people?filter[email][_eq]=' + user.value.email)
  console.log(exists.value.data[0])
  if (exists.value.data[0]) {
    user.value.first_name = exists.value.data[0].first_name
    user.value.last_name = exists.value.data[0].last_name
    if (exists.value.data[0].category === 'Owner') {
      user.value.role = ownerRole.value
    } else {
      user.value.role = tenantRole.value
    }
    onSubmit()
  }
}
const onSubmit = async () => {

  try {
    var newUser = await createUser(user.value)
    if (newUser) {
      // const { data, pending, error, refresh } = await useFetch(
      //   '/api/registrationnotification?email=' +
      //   email.value +
      //   '&first_name=' +
      //   user.value.first_name,
      //   {
      //     onResponse({ request, response, options }) {
      //       return response._data
      //     },
      //   }
      // )
      const status = await login({
        email: user.value.email,
        password: user.value.password,
      })
      closeScreen()
      return navigateTo('/account', { replace: true })
    } else {
      console.log('There was an error with your request.')
    }
  } catch (e) {
    console.log(e)

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