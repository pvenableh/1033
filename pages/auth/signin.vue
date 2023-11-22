<script setup lang="ts">
import { openScreen, loader, closeScreen } from '~/composables/useScreen';

const { login } = useDirectusAuth();

const credentials = reactive({
	email: '',
	password: '',
});

const loading = ref(false);
const error = ref(null);

async function attemptLogin() {
	loader.value = true;
	openScreen();
	const { email, password } = unref(credentials);
	loading.value = true;
	error.value = null;

	try {
		// Be careful when using the login function because you have to pass the email and password as arguments.
		loader.value = false;
		closeScreen();
		await login(email, password);
	} catch (err: any) {
		error.value = err.message;
	}

	loader.value = false;
	closeScreen();
	loading.value = false;
}

const panel = ref('login');

function movePanel(val: string) {
	console.log(val);
	panel.value = val;
}
</script>

<template>
	<div class="flex items-center justify-center flex-col login">
		<transition-group name="list" tag="div" class="login-panels">
			<div v-if="panel === 'register'" key="1" class="flex items-center justify-center flex-col login-panel">
				<!-- <AccountRegister /> -->
				<a @click.prevent="movePanel('login')" class="cursor-pointer login-panel__nav-button">Login</a>
			</div>
			<div class="flex items-center justify-center flex-col login-panel" v-if="panel === 'login'" key="2">
				<p class="text-xs uppercase tracking-wide">This platform is accessible by invitation only.</p>
				<VForm class="w-full" @submit="attemptLogin()">
					<FormVInput
						name="email"
						type="email"
						rules="emailExists"
						label="Email"
						v-model="credentials.email"
						class="my-6"
					/>
					<FormVInput
						name="password"
						type="password"
						rules="required"
						label="Password"
						v-model="credentials.password"
						class="my-6"
					/>
					<FormVButton class="w-full mb-6" type="submit">Login</FormVButton>
				</VForm>

				<!-- <a @click.prevent="movePanel('register')" class="cursor-pointer login-panel__nav-button">New? <span
						class="purple-txt">Register Here</span></a> -->
				<a @click.prevent="movePanel('request')" class="cursor-pointer login-panel__nav-button reset purple-txt mt-4">
					Reset Password
				</a>
				<div v-if="error" class="text-red-500 uppercase tracking-wide font-bold" style="font-size: 10px">
					{{ error }}
				</div>
			</div>
			<div v-if="panel === 'request'" key="3" class="flex items-center justify-center flex-col login-panel">
				<AccountPasswordRequest />
				<a @click.prevent="movePanel('login')" class="cursor-pointer login-panel__nav-button">Login</a>
			</div>
		</transition-group>
	</div>
</template>

<style>
.login {
	/* height: 90vh; */
}

.login-panel {
	width: 350px;
	height: 450px;

	&__nav-button {
		font-size: 14px;
		@apply uppercase tracking-wider;
	}

	&__nav-button.reset {
		font-size: 10px;
	}
}
</style>
