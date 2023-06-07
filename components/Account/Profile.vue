<template>
  <div class="px-10 account__profile">
    <h2>Profile</h2>
    <VForm class="" @submit="onSubmit()">
      <FormVInput name="first_name" type="text" rules="required" label="First Name" v-model="user.first_name"
        class="my-6" />
      <FormVInput name="last_name" type="text" rules="required" label="Last Name" v-model="user.last_name" class="my-6" />
      <FormVInput name="email" type="email" rules="email|required" label="Email" v-model="user.email" class="my-6" />


      <FormVButton class="w-full mb-6" type="submit">Update</FormVButton>
    </VForm>
  </div>
</template>
<script setup>
const toast = useToast()
const config = useRuntimeConfig()
const user = useDirectusUser()

watch(user.value, (currentValue, oldValue) => {
  return currentValue
})
function onSubmit() {
  if (user.value) {
    $fetch(`https://admin.1033lenox.com/users/${user.value.id}`, {
      method: 'PATCH',
      body: {
        first_name: user.value.first_name,
        last_name: user.value.last_name,
        email: user.value.email,
        password: user.value.password,
      },
    }).then((res) => {
      toast.add('Successfully updated your profile.')
    })
  } else {
    console.log('no user')
  }
}
</script>
<style></style>