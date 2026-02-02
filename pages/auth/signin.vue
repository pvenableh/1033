<script setup lang="ts">
const route = useRoute();
const panel = ref('login');
const errorMessage = ref<string | null>(null);

// Check for error query params
onMounted(() => {
	if (route.query.error === 'account_inactive') {
		errorMessage.value = 'Your account is not active. Please contact an administrator.';
	} else if (route.query.error === 'unauthorized') {
		errorMessage.value = route.query.message as string || 'You do not have permission to access that page.';
	}
});

function movePanel(val: string) {
	panel.value = val;
	errorMessage.value = null;
}
</script>

<template>
	<div class="flex items-center justify-center flex-col px-12 login text-foreground">
		<Alert
			v-if="errorMessage"
			class="mb-6 max-w-md"
			color="amber"
			variant="subtle"
			icon="i-heroicons-exclamation-triangle"
			:description="errorMessage"
			:close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link' }"
			@close="errorMessage = null" />

		<transition-group name="list" tag="div" class="login-panels">
			<div v-if="panel === 'register'" key="1" class="flex items-center justify-center flex-col login-panel login-panel--wide">
				<h2
					v-motion="{
						initial: { y: -100, opacity: 0 },
						enter: { y: 0, opacity: 1 },
					}"
					class="text-lg font-bold uppercase tracking-wide mb-4">
					Request Access
				</h2>
				<AccountAccessRequestForm />
				<a class="cursor-pointer login-panel__nav-button mt-4" @click.prevent="movePanel('login')">Already have an account? <span class="text-primary-500">Sign In</span></a>
			</div>
			<div v-if="panel === 'login'" key="2" class="flex items-center justify-center flex-col login-panel">
				<p
					v-motion="{
						initial: {
							y: -100,
							opacity: 0,
						},
						enter: {
							y: 0,
							opacity: 1,
						},
					}"
					class="text-xs uppercase tracking-wide mb-4">
					Welcome to the 1033 Lenox resident portal.
				</p>

				<AccountLoginForm />

				<a @click.prevent="movePanel('register')" class="cursor-pointer login-panel__nav-button mt-4">New resident? <span class="text-primary-500">Request Access</span></a>
				<a class="cursor-pointer login-panel__nav-button mt-2" @click.prevent="movePanel('request')">Reset Password</a>
			</div>
			<div v-if="panel === 'request'" key="3" class="flex items-center justify-center flex-col login-panel">
				<AccountPasswordRequest />
				<a class="cursor-pointer login-panel__nav-button mt-4" @click.prevent="movePanel('login')">Login</a>
			</div>
		</transition-group>
	</div>
</template>

<style>
@reference "~/assets/css/tailwind.css";

.login {
	/* height: 90vh; */
}

.login-panel {
	width: 325px;
	min-height: 450px;
}

.login-panel--wide {
	width: 400px;
	min-height: auto;
	padding: 1rem 0;
}

.login-panel__nav-button {
	font-size: 14px;
	color: var(--theme-text-secondary);
	@apply uppercase tracking-wider;
}

.login-panel__nav-button.reset {
	font-size: 10px;
}
</style>
