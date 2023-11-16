<template>
	<div class="px-10 account__profile">
		<h2>Profile</h2>
		<VForm class="" @submit="updateUser()">
			<FormVInput name="first_name" type="text" rules="required" label="First Name" v-model="user.first_name"
				class="my-6" />
			<FormVInput name="last_name" type="text" rules="required" label="Last Name" v-model="user.last_name" class="my-6" />
			<FormVInput name="email" type="email" rules="email|required" label="Email" v-model="user.email" class="my-6"
				disabled="true" />


			<FormVButton class="w-full mb-6" type="submit">Update</FormVButton>
		</VForm>
	</div>
</template>
<script setup>

const { user } = useDirectusAuth();

watch(user.value, (currentValue, oldValue) => {
	return currentValue
})

async function updateUser() {
	await useDirectus(
		updateMe({
			first_name: user.value.first_name,
			last_name: user.value.last_name,
		}),
	);
}


function onSubmit() {
	//   const updateUser = async () => {
	//   try {
	//     const newItem = {
	//       first_name: user.value.first_name,
	//       last_name: user.value.last_name,
	//     };
	//     await updateItem({
	//       collection: "News",
	//       id: "itemid",
	//       item: newItem,
	//     });
	//   } catch (e) {}
	// };

	if (user.value) {
		$fetch(`https://admin.1033lenox.com/users/${user.value.id}`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer rpS9FnBjatOHHUyDye4W4LCqwqV2vhlE`,
			},
			body: {
				first_name: user.value.first_name,
				last_name: user.value.last_name,
			},
		}).then((res) => {
			console.log(res)
		})
	} else {
		console.log('no user')
	}
}
</script>
<style></style>
