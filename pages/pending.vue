<script setup lang="ts">
definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

useSeoMeta({
	title: 'Access Pending - 1033 Lenox',
});

const {user} = useDirectusAuth();
const {logout} = useDirectusAuth();

async function handleLogout() {
	await logout();
	navigateTo('/auth/signin');
}
</script>

<template>
	<div class="flex items-center justify-center min-h-[80vh] px-6">
		<div class="max-w-md w-full text-center">
			<div class="mb-8">
				<Icon name="i-heroicons-clock" class="w-16 h-16 text-primary mx-auto" />
			</div>

			<h1 class="text-2xl font-bold mb-4">Access Pending</h1>

			<p class="text-gray-600 dark:text-gray-400 mb-6">
				Thank you for registering,
				<span class="font-semibold">{{ user?.first_name }}</span>
				. Your access request is currently being reviewed by an administrator.
			</p>

			<p class="text-sm text-gray-500 dark:text-gray-500 mb-8">
				You will receive an email notification once your account has been approved. This typically takes 1-2 business
				days.
			</p>

			<div class="space-y-4">
				<Alert
					icon="i-heroicons-information-circle"
					color="blue"
					variant="soft"
					title="What happens next?"
					description="An administrator will review your request and assign you the appropriate access level based on your residency status." />
			</div>

			<div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
				<p class="text-xs text-gray-500 mb-4">Registered as: {{ user?.email }}</p>
				<Button variant="ghost" color="gray" size="sm" @click="handleLogout">Sign out</Button>
			</div>
		</div>
	</div>
</template>
