<template>
	<div @click.prevent="logout()" class="relative z-0 cursor-pointer logout-btn">Logout</div>
</template>
<script setup>
// import { navigateTo } from '#imports';

const { logout } = useDirectusAuth();

// const onSubmit = async () => {
// 	logout();
// 	return navigateTo('/', { replace: true });
// };
</script>
<style scoped lang="postcss">
.logout {
}
</style>
