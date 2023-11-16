<script setup lang="ts">
// const { _loggedIn } = useDirectusAuth();

// definePageMeta({
// 	layout() {
// 		if (_loggedIn.get()) {
// 			return 'auth';
// 		} else {
// 			return 'default';
// 		}
// 	},
// })
</script>
<template>
	<NuxtLayout>
		<NuxtLoadingIndicator color="repeating-linear-gradient(to right,#FF99DD
    0%,#94a3b8 100%)" />
		<NuxtPage />
	</NuxtLayout>
</template>
