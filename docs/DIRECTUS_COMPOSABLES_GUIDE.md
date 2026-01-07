# Directus + Nuxt 3/4 Composables Guide

> Instructions for Claude Code to build a Directus authentication and CRUD system in Nuxt 3/4 projects.

## Overview

This guide provides patterns for building:

- Authentication (login, logout, password reset, token refresh)
- CRUD operations on Directus collections
- User management and permissions
- File uploads and management
- Real-time WebSocket subscriptions

## Prerequisites

```bash
# Install dependencies
npm install @directus/sdk nuxt-auth-utils

# For UI (choose one):
npm install @nuxt/ui        # NuxtUI option
# OR
npx shadcn-vue@latest init  # shadcn-vue option
```

## Project Structure

```
composables/
├── useDirectusAuth.ts      # Authentication
├── useDirectusUser.ts      # User operations
├── useDirectusItems.ts     # Generic CRUD
├── useDirectusFiles.ts     # File management
├── useDirectusFolders.ts   # Folder management
├── useDirectusNotifications.ts
└── useDirectusWebSocket.ts # Real-time

server/
├── api/
│   ├── auth/
│   │   ├── login.post.ts
│   │   ├── logout.post.ts
│   │   └── refresh-session.post.ts
│   └── directus/
│       ├── items.post.ts
│       ├── users/
│       │   ├── me.get.ts
│       │   ├── me.patch.ts
│       │   ├── password-reset-request.post.ts
│       │   └── password-reset.post.ts
│       └── files/
│           └── upload.post.ts
└── utils/
    └── directus.ts         # Server-side SDK setup

pages/
└── auth/
    ├── signin.vue
    ├── logout.vue
    └── password-reset/
        └── index.vue
```

---

## 1. Configuration

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
	modules: [
		'nuxt-auth-utils',
		'@nuxt/ui', // or configure shadcn-vue
	],

	runtimeConfig: {
		// Server-only
		directusServerToken: process.env.DIRECTUS_SERVER_TOKEN,
		session: {
			password: process.env.NUXT_SESSION_PASSWORD, // min 32 chars
		},
		// Public (client + server)
		public: {
			directusUrl: process.env.DIRECTUS_URL,
		},
	},
});
```

### .env

```env
DIRECTUS_URL=https://your-directus.com
DIRECTUS_SERVER_TOKEN=your-static-token
NUXT_SESSION_PASSWORD=at-least-32-characters-long-secret
```

---

## 2. Server Utils - Directus Client Setup

### server/utils/directus.ts

```typescript
import {
	createDirectus,
	rest,
	authentication,
	staticToken,
	readMe,
	readItems,
	readItem,
	createItem,
	updateItem,
	deleteItem,
	readUsers,
	createUser,
	updateUser,
	deleteUser,
	uploadFiles,
	readFiles,
	passwordRequest,
	passwordReset,
} from '@directus/sdk';
import type {H3Event} from 'h3';

// Re-export SDK functions for use in API routes
export {
	readItems,
	readItem,
	createItem,
	updateItem,
	deleteItem,
	readUsers,
	createUser,
	updateUser,
	deleteUser,
	uploadFiles,
	readFiles,
	passwordRequest,
	passwordReset,
};

// Types
interface DirectusSchema {
	// Define your collections here
	[key: string]: any;
}

interface DirectusTokens {
	access_token: string;
	refresh_token: string;
	expires: number;
}

// Admin client - uses static token for elevated access
export function useDirectusAdmin() {
	const config = useRuntimeConfig();
	return createDirectus<DirectusSchema>(config.public.directusUrl)
		.with(staticToken(config.directusServerToken))
		.with(rest());
}

// User client - uses session tokens with auto-refresh
export async function getUserDirectus(event: H3Event) {
	const config = useRuntimeConfig();
	const session = await getUserSession(event);

	if (!session?.secure?.directusAccessToken) {
		throw createError({statusCode: 401, message: 'Not authenticated'});
	}

	// Check if token needs refresh (within 60 seconds of expiry)
	const expiresAt = session.expiresAt || 0;
	const now = Date.now();

	if (expiresAt - now < 60000 && session.secure.directusRefreshToken) {
		try {
			const tokens = await directusRefresh(session.secure.directusRefreshToken);
			// Update session with new tokens
			await setUserSession(event, {
				...session,
				expiresAt: Date.now() + tokens.expires * 1000,
				secure: {
					directusAccessToken: tokens.access_token,
					directusRefreshToken: tokens.refresh_token,
				},
			});

			return createDirectus<DirectusSchema>(config.public.directusUrl)
				.with(staticToken(tokens.access_token))
				.with(rest());
		} catch {
			throw createError({statusCode: 401, message: 'Session expired'});
		}
	}

	return createDirectus<DirectusSchema>(config.public.directusUrl)
		.with(staticToken(session.secure.directusAccessToken))
		.with(rest());
}

// Public client - no authentication
export function getPublicDirectus() {
	const config = useRuntimeConfig();
	return createDirectus<DirectusSchema>(config.public.directusUrl).with(rest());
}

// Authentication helpers
export async function directusLogin(email: string, password: string): Promise<DirectusTokens> {
	const config = useRuntimeConfig();
	const client = createDirectus(config.public.directusUrl).with(authentication()).with(rest());

	const result = await client.login(email, password);
	return result as DirectusTokens;
}

export async function directusRefresh(refreshToken: string): Promise<DirectusTokens> {
	const config = useRuntimeConfig();
	const client = createDirectus(config.public.directusUrl).with(authentication()).with(rest());

	const result = await client.refresh('json', refreshToken);
	return result as DirectusTokens;
}

export async function directusLogout(refreshToken: string): Promise<void> {
	const config = useRuntimeConfig();
	const client = createDirectus(config.public.directusUrl).with(authentication()).with(rest());

	await client.logout(refreshToken);
}

// Get current user data
export async function directusGetMe(accessToken: string, fields?: string[]) {
	const config = useRuntimeConfig();
	const client = createDirectus<DirectusSchema>(config.public.directusUrl).with(staticToken(accessToken)).with(rest());

	return await client.request(readMe({fields: fields || ['*']}));
}
```

---

## 3. Server API Routes

### server/api/auth/login.post.ts

```typescript
import {directusLogin, directusGetMe} from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const {email, password} = body;

	if (!email || !password) {
		throw createError({statusCode: 400, message: 'Email and password required'});
	}

	try {
		// Authenticate with Directus
		const tokens = await directusLogin(email, password);

		// Get user data
		const user = await directusGetMe(tokens.access_token, [
			'id',
			'email',
			'first_name',
			'last_name',
			'status',
			'role.*',
			'avatar',
		]);

		// Check user status
		if (user.status !== 'active' && user.status !== 'draft') {
			throw createError({statusCode: 403, message: 'Account not active'});
		}

		// Set session
		await setUserSession(event, {
			user: {
				id: user.id,
				email: user.email,
				firstName: user.first_name,
				lastName: user.last_name,
				role: user.role?.name,
				avatar: user.avatar,
			},
			expiresAt: Date.now() + tokens.expires * 1000,
			secure: {
				directusAccessToken: tokens.access_token,
				directusRefreshToken: tokens.refresh_token,
			},
		});

		return {success: true, user: {id: user.id, email: user.email}};
	} catch (error: any) {
		throw createError({
			statusCode: error.statusCode || 401,
			message: error.message || 'Invalid credentials',
		});
	}
});
```

### server/api/auth/logout.post.ts

```typescript
import {directusLogout} from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);

	if (session?.secure?.directusRefreshToken) {
		try {
			await directusLogout(session.secure.directusRefreshToken);
		} catch {
			// Ignore logout errors
		}
	}

	await clearUserSession(event);
	return {success: true};
});
```

### server/api/auth/refresh-session.post.ts

```typescript
import {directusRefresh, directusGetMe} from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);

	if (!session?.secure?.directusRefreshToken) {
		throw createError({statusCode: 401, message: 'No refresh token'});
	}

	try {
		const tokens = await directusRefresh(session.secure.directusRefreshToken);
		const user = await directusGetMe(tokens.access_token);

		await setUserSession(event, {
			user: {
				id: user.id,
				email: user.email,
				firstName: user.first_name,
				lastName: user.last_name,
				role: user.role?.name,
				avatar: user.avatar,
			},
			expiresAt: Date.now() + tokens.expires * 1000,
			secure: {
				directusAccessToken: tokens.access_token,
				directusRefreshToken: tokens.refresh_token,
			},
		});

		return {success: true};
	} catch {
		await clearUserSession(event);
		throw createError({statusCode: 401, message: 'Session expired'});
	}
});
```

### server/api/directus/items.post.ts

```typescript
import {readItems, readItem, createItem, updateItem, deleteItem, aggregate} from '@directus/sdk';
import {useDirectusAdmin, getUserDirectus} from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const {operation, collection, id, ids, data, query} = body;

	// Use user client for writes, admin for reads
	const needsUserClient = ['create', 'update', 'delete'].includes(operation) || collection.startsWith('directus_');

	const client = needsUserClient ? await getUserDirectus(event) : useDirectusAdmin();

	try {
		switch (operation) {
			case 'list':
				return await client.request(readItems(collection, query || {}));

			case 'get':
				return await client.request(readItem(collection, id, query || {}));

			case 'create':
				return await client.request(createItem(collection, data, query || {}));

			case 'update':
				return await client.request(updateItem(collection, id, data, query || {}));

			case 'delete':
				if (ids) {
					return await client.request(deleteItems(collection, ids));
				}
				return await client.request(deleteItem(collection, id));

			case 'aggregate':
				return await client.request(aggregate(collection, query || {}));

			default:
				throw createError({statusCode: 400, message: 'Invalid operation'});
		}
	} catch (error: any) {
		throw createError({
			statusCode: error.statusCode || 500,
			message: error.message || 'Operation failed',
		});
	}
});
```

### server/api/directus/users/me.get.ts

```typescript
import {getUserDirectus} from '~/server/utils/directus';
import {readMe} from '@directus/sdk';

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const fields = query.fields ? String(query.fields).split(',') : ['*'];

	const client = await getUserDirectus(event);
	return await client.request(readMe({fields}));
});
```

### server/api/directus/users/password-reset-request.post.ts

```typescript
import {getPublicDirectus} from '~/server/utils/directus';
import {passwordRequest} from '@directus/sdk';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const {email, resetUrl} = body;

	if (!email) {
		throw createError({statusCode: 400, message: 'Email required'});
	}

	const client = getPublicDirectus();
	await client.request(passwordRequest(email, resetUrl));

	return {success: true};
});
```

### server/api/directus/users/password-reset.post.ts

```typescript
import {getPublicDirectus} from '~/server/utils/directus';
import {passwordReset} from '@directus/sdk';

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const {token, password} = body;

	if (!token || !password) {
		throw createError({statusCode: 400, message: 'Token and password required'});
	}

	const client = getPublicDirectus();
	await client.request(passwordReset(token, password));

	return {success: true};
});
```

---

## 4. Client Composables

### composables/useDirectusAuth.ts

```typescript
export function useDirectusAuth() {
	const {user, loggedIn, session, clear, fetch: refreshSession} = useUserSession();

	async function login(email: string, password: string) {
		const response = await $fetch('/api/auth/login', {
			method: 'POST',
			body: {email, password},
		});
		await refreshSession();
		return response;
	}

	async function logout() {
		await $fetch('/api/auth/logout', {method: 'POST'});
		await clear();
	}

	async function register(userData: {email: string; password: string; first_name?: string; last_name?: string}) {
		return await $fetch('/api/auth/register', {
			method: 'POST',
			body: userData,
		});
	}

	async function requestPasswordReset(email: string, resetUrl?: string) {
		return await $fetch('/api/directus/users/password-reset-request', {
			method: 'POST',
			body: {email, resetUrl},
		});
	}

	async function resetPassword(token: string, password: string) {
		return await $fetch('/api/directus/users/password-reset', {
			method: 'POST',
			body: {token, password},
		});
	}

	async function refreshUser() {
		await $fetch('/api/auth/refresh-session', {method: 'POST'});
		await refreshSession();
	}

	return {
		user,
		loggedIn,
		login,
		logout,
		register,
		requestPasswordReset,
		resetPassword,
		refreshUser,
	};
}
```

### composables/useDirectusItems.ts

```typescript
interface ItemsQuery {
	fields?: string[];
	filter?: Record<string, any>;
	sort?: string[];
	limit?: number;
	offset?: number;
	page?: number;
	search?: string;
	deep?: Record<string, any>;
}

export function useDirectusItems<T = any>(collection: string) {
	async function list(query?: ItemsQuery): Promise<T[]> {
		return await $fetch('/api/directus/items', {
			method: 'POST',
			body: {operation: 'list', collection, query},
		});
	}

	async function get(id: string | number, query?: ItemsQuery): Promise<T> {
		return await $fetch('/api/directus/items', {
			method: 'POST',
			body: {operation: 'get', collection, id, query},
		});
	}

	async function create(data: Partial<T>, query?: ItemsQuery): Promise<T> {
		return await $fetch('/api/directus/items', {
			method: 'POST',
			body: {operation: 'create', collection, data, query},
		});
	}

	async function update(id: string | number, data: Partial<T>, query?: ItemsQuery): Promise<T> {
		return await $fetch('/api/directus/items', {
			method: 'POST',
			body: {operation: 'update', collection, id, data, query},
		});
	}

	async function remove(id: string | number | (string | number)[]): Promise<void> {
		const ids = Array.isArray(id) ? id : undefined;
		const singleId = Array.isArray(id) ? undefined : id;

		await $fetch('/api/directus/items', {
			method: 'POST',
			body: {operation: 'delete', collection, id: singleId, ids},
		});
	}

	async function count(filter?: Record<string, any>): Promise<number> {
		const result = await $fetch('/api/directus/items', {
			method: 'POST',
			body: {
				operation: 'aggregate',
				collection,
				query: {aggregate: {count: '*'}, filter},
			},
		});
		return result?.[0]?.count || 0;
	}

	return {
		list,
		get,
		create,
		update,
		remove,
		count,
	};
}
```

### composables/useDirectusUser.ts

```typescript
export function useDirectusUser() {
	async function me(fields?: string[]) {
		const query = fields ? `?fields=${fields.join(',')}` : '';
		return await $fetch(`/api/directus/users/me${query}`);
	}

	async function updateProfile(data: Record<string, any>) {
		return await $fetch('/api/directus/users/me', {
			method: 'PATCH',
			body: data,
		});
	}

	async function requestPasswordReset(email: string, resetUrl?: string) {
		return await $fetch('/api/directus/users/password-reset-request', {
			method: 'POST',
			body: {email, resetUrl},
		});
	}

	async function resetPassword(token: string, password: string) {
		return await $fetch('/api/directus/users/password-reset', {
			method: 'POST',
			body: {token, password},
		});
	}

	return {
		me,
		updateProfile,
		requestPasswordReset,
		resetPassword,
	};
}
```

### composables/useDirectusFiles.ts

```typescript
export function useDirectusFiles() {
	const config = useRuntimeConfig();
	const items = useDirectusItems('directus_files');

	function getUrl(fileId: string) {
		return `${config.public.directusUrl}/assets/${fileId}`;
	}

	function getImageUrl(
		fileId: string,
		options?: {
			width?: number;
			height?: number;
			fit?: 'cover' | 'contain' | 'inside' | 'outside';
			quality?: number;
			format?: 'jpg' | 'png' | 'webp' | 'avif';
		}
	) {
		const params = new URLSearchParams();
		if (options?.width) params.set('width', String(options.width));
		if (options?.height) params.set('height', String(options.height));
		if (options?.fit) params.set('fit', options.fit);
		if (options?.quality) params.set('quality', String(options.quality));
		if (options?.format) params.set('format', options.format);

		const queryString = params.toString();
		return `${config.public.directusUrl}/assets/${fileId}${queryString ? `?${queryString}` : ''}`;
	}

	async function upload(formData: FormData) {
		return await $fetch('/api/directus/files/upload', {
			method: 'POST',
			body: formData,
		});
	}

	return {
		...items,
		getUrl,
		getImageUrl,
		upload,
	};
}
```

---

## 5. Auth Pages

### Option A: NuxtUI Components

#### pages/auth/signin.vue (NuxtUI)

```vue
<script setup lang="ts">
definePageMeta({layout: 'auth'});

const {login, requestPasswordReset} = useDirectusAuth();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const view = ref<'login' | 'reset'>('login');
const loading = ref(false);
const error = ref('');

const loginForm = reactive({
	email: '',
	password: '',
});

const resetForm = reactive({
	email: '',
});

async function handleLogin() {
	loading.value = true;
	error.value = '';

	try {
		await login(loginForm.email, loginForm.password);
		const redirect = (route.query.redirect as string) || '/';
		router.push(redirect);
	} catch (e: any) {
		error.value = e.data?.message || 'Invalid credentials';
	} finally {
		loading.value = false;
	}
}

async function handlePasswordReset() {
	loading.value = true;
	error.value = '';

	try {
		const resetUrl = `${window.location.origin}/auth/password-reset`;
		await requestPasswordReset(resetForm.email, resetUrl);
		toast.add({title: 'Check your email for reset instructions'});
		view.value = 'login';
	} catch (e: any) {
		error.value = e.data?.message || 'Failed to send reset email';
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<div class="min-h-screen flex items-center justify-center px-4">
		<Card class="w-full max-w-md">
			<!-- Login Form -->
			<template v-if="view === 'login'">
				<template #header>
					<h1 class="text-2xl font-bold">Sign In</h1>
				</template>

				<Form :state="loginForm" @submit="handleLogin" class="space-y-4">
					<FormGroup label="Email" name="email">
						<Input v-model="loginForm.email" type="email" placeholder="you@example.com" required />
					</UFormGroup>

					<FormGroup label="Password" name="password">
						<Input v-model="loginForm.password" type="password" placeholder="••••••••" required />
					</UFormGroup>

					<UAlert v-if="error" color="red" :title="error" />

					<Button type="submit" block :loading="loading">Sign In</Button>
				</UForm>

				<template #footer>
					<Button variant="link" @click="view = 'reset'">Forgot password?</Button>
				</template>
			</template>

			<!-- Password Reset Form -->
			<template v-else>
				<template #header>
					<h1 class="text-2xl font-bold">Reset Password</h1>
				</template>

				<Form :state="resetForm" @submit="handlePasswordReset" class="space-y-4">
					<FormGroup label="Email" name="email">
						<Input v-model="resetForm.email" type="email" placeholder="you@example.com" required />
					</UFormGroup>

					<UAlert v-if="error" color="red" :title="error" />

					<Button type="submit" block :loading="loading">Send Reset Link</Button>
				</UForm>

				<template #footer>
					<Button variant="link" @click="view = 'login'">Back to sign in</Button>
				</template>
			</template>
		</Card>
	</div>
</template>
```

#### pages/auth/password-reset/index.vue (NuxtUI)

```vue
<script setup lang="ts">
definePageMeta({layout: 'auth'});

const {resetPassword} = useDirectusAuth();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const token = computed(() => route.query.token as string);
const loading = ref(false);
const error = ref('');
const success = ref(false);

const form = reactive({
	password: '',
	confirmPassword: '',
});

async function handleReset() {
	if (form.password !== form.confirmPassword) {
		error.value = 'Passwords do not match';
		return;
	}

	if (form.password.length < 8) {
		error.value = 'Password must be at least 8 characters';
		return;
	}

	loading.value = true;
	error.value = '';

	try {
		await resetPassword(token.value, form.password);
		success.value = true;
		toast.add({title: 'Password reset successfully'});
		setTimeout(() => router.push('/auth/signin'), 2000);
	} catch (e: any) {
		error.value = e.data?.message || 'Failed to reset password';
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<div class="min-h-screen flex items-center justify-center px-4">
		<Card class="w-full max-w-md">
			<template #header>
				<h1 class="text-2xl font-bold">Set New Password</h1>
			</template>

			<div v-if="!token" class="text-center">
				<UAlert color="red" title="Invalid or missing reset token" />
				<Button class="mt-4" to="/auth/signin">Back to Sign In</Button>
			</div>

			<div v-else-if="success" class="text-center">
				<UAlert color="green" title="Password reset successfully!" />
				<p class="mt-2 text-gray-600">Redirecting to sign in...</p>
			</div>

			<Form v-else :state="form" @submit="handleReset" class="space-y-4">
				<FormGroup label="New Password" name="password">
					<Input v-model="form.password" type="password" placeholder="••••••••" required />
				</UFormGroup>

				<FormGroup label="Confirm Password" name="confirmPassword">
					<Input v-model="form.confirmPassword" type="password" placeholder="••••••••" required />
				</UFormGroup>

				<UAlert v-if="error" color="red" :title="error" />

				<Button type="submit" block :loading="loading">Reset Password</Button>
			</UForm>
		</Card>
	</div>
</template>
```

#### pages/auth/logout.vue (NuxtUI)

```vue
<script setup lang="ts">
definePageMeta({layout: 'auth'});

const {logout} = useDirectusAuth();
const router = useRouter();

onMounted(async () => {
	await logout();
	router.push('/auth/signin');
});
</script>

<template>
	<div class="min-h-screen flex items-center justify-center">
		<Card>
			<div class="text-center">
				<Icon name="i-heroicons-arrow-right-on-rectangle" class="w-12 h-12 mx-auto mb-4" />
				<p>Signing out...</p>
			</div>
		</Card>
	</div>
</template>
```

---

### Option B: shadcn-vue + Tailwind CSS 4

#### Setup shadcn-vue

```bash
npx shadcn-vue@latest init
npx shadcn-vue@latest add button card input label alert form
```

#### pages/auth/signin.vue (shadcn-vue)

```vue
<script setup lang="ts">
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Alert, AlertDescription} from '@/components/ui/alert';

definePageMeta({layout: 'auth'});

const {login, requestPasswordReset} = useDirectusAuth();
const router = useRouter();
const route = useRoute();

const view = ref<'login' | 'reset'>('login');
const loading = ref(false);
const error = ref('');
const message = ref('');

const loginForm = reactive({
	email: '',
	password: '',
});

const resetForm = reactive({
	email: '',
});

async function handleLogin() {
	loading.value = true;
	error.value = '';

	try {
		await login(loginForm.email, loginForm.password);
		const redirect = (route.query.redirect as string) || '/';
		router.push(redirect);
	} catch (e: any) {
		error.value = e.data?.message || 'Invalid credentials';
	} finally {
		loading.value = false;
	}
}

async function handlePasswordReset() {
	loading.value = true;
	error.value = '';

	try {
		const resetUrl = `${window.location.origin}/auth/password-reset`;
		await requestPasswordReset(resetForm.email, resetUrl);
		message.value = 'Check your email for reset instructions';
		view.value = 'login';
	} catch (e: any) {
		error.value = e.data?.message || 'Failed to send reset email';
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<div class="min-h-screen flex items-center justify-center px-4 bg-background">
		<Card class="w-full max-w-md">
			<!-- Login Form -->
			<template v-if="view === 'login'">
				<CardHeader>
					<CardTitle class="text-2xl">Sign In</CardTitle>
				</CardHeader>

				<CardContent>
					<form @submit.prevent="handleLogin" class="space-y-4">
						<div class="space-y-2">
							<Label for="email">Email</Label>
							<Input id="email" v-model="loginForm.email" type="email" placeholder="you@example.com" required />
						</div>

						<div class="space-y-2">
							<Label for="password">Password</Label>
							<Input id="password" v-model="loginForm.password" type="password" placeholder="••••••••" required />
						</div>

						<Alert v-if="error" variant="destructive">
							<AlertDescription>{{ error }}</AlertDescription>
						</Alert>

						<Alert v-if="message" variant="default">
							<AlertDescription>{{ message }}</AlertDescription>
						</Alert>

						<Button type="submit" class="w-full" :disabled="loading">
							<span v-if="loading">Signing in...</span>
							<span v-else>Sign In</span>
						</Button>
					</form>
				</CardContent>

				<CardFooter>
					<Button variant="link" @click="view = 'reset'" class="px-0">Forgot password?</Button>
				</CardFooter>
			</template>

			<!-- Password Reset Form -->
			<template v-else>
				<CardHeader>
					<CardTitle class="text-2xl">Reset Password</CardTitle>
				</CardHeader>

				<CardContent>
					<form @submit.prevent="handlePasswordReset" class="space-y-4">
						<div class="space-y-2">
							<Label for="reset-email">Email</Label>
							<Input id="reset-email" v-model="resetForm.email" type="email" placeholder="you@example.com" required />
						</div>

						<Alert v-if="error" variant="destructive">
							<AlertDescription>{{ error }}</AlertDescription>
						</Alert>

						<Button type="submit" class="w-full" :disabled="loading">
							<span v-if="loading">Sending...</span>
							<span v-else>Send Reset Link</span>
						</Button>
					</form>
				</CardContent>

				<CardFooter>
					<Button variant="link" @click="view = 'login'" class="px-0">Back to sign in</Button>
				</CardFooter>
			</template>
		</Card>
	</div>
</template>
```

#### pages/auth/password-reset/index.vue (shadcn-vue)

```vue
<script setup lang="ts">
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Alert, AlertDescription} from '@/components/ui/alert';

definePageMeta({layout: 'auth'});

const {resetPassword} = useDirectusAuth();
const router = useRouter();
const route = useRoute();

const token = computed(() => route.query.token as string);
const loading = ref(false);
const error = ref('');
const success = ref(false);

const form = reactive({
	password: '',
	confirmPassword: '',
});

async function handleReset() {
	if (form.password !== form.confirmPassword) {
		error.value = 'Passwords do not match';
		return;
	}

	if (form.password.length < 8) {
		error.value = 'Password must be at least 8 characters';
		return;
	}

	loading.value = true;
	error.value = '';

	try {
		await resetPassword(token.value, form.password);
		success.value = true;
		setTimeout(() => router.push('/auth/signin'), 2000);
	} catch (e: any) {
		error.value = e.data?.message || 'Failed to reset password';
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<div class="min-h-screen flex items-center justify-center px-4 bg-background">
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle class="text-2xl">Set New Password</CardTitle>
			</CardHeader>

			<CardContent>
				<div v-if="!token" class="text-center space-y-4">
					<Alert variant="destructive">
						<AlertDescription>Invalid or missing reset token</AlertDescription>
					</Alert>
					<Button as-child>
						<NuxtLink to="/auth/signin">Back to Sign In</NuxtLink>
					</Button>
				</div>

				<div v-else-if="success" class="text-center space-y-2">
					<Alert>
						<AlertDescription>Password reset successfully!</AlertDescription>
					</Alert>
					<p class="text-muted-foreground">Redirecting to sign in...</p>
				</div>

				<form v-else @submit.prevent="handleReset" class="space-y-4">
					<div class="space-y-2">
						<Label for="password">New Password</Label>
						<Input id="password" v-model="form.password" type="password" placeholder="••••••••" required />
					</div>

					<div class="space-y-2">
						<Label for="confirm">Confirm Password</Label>
						<Input id="confirm" v-model="form.confirmPassword" type="password" placeholder="••••••••" required />
					</div>

					<Alert v-if="error" variant="destructive">
						<AlertDescription>{{ error }}</AlertDescription>
					</Alert>

					<Button type="submit" class="w-full" :disabled="loading">
						<span v-if="loading">Resetting...</span>
						<span v-else>Reset Password</span>
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</template>
```

---

## 6. Middleware

### middleware/auth.ts

```typescript
export default defineNuxtRouteMiddleware((to) => {
	const {loggedIn} = useUserSession();

	// Public routes that don't require auth
	const publicRoutes = ['/auth/signin', '/auth/password-reset', '/auth/logout'];

	if (publicRoutes.some((route) => to.path.startsWith(route))) {
		return;
	}

	if (!loggedIn.value) {
		return navigateTo(`/auth/signin?redirect=${encodeURIComponent(to.fullPath)}`);
	}
});
```

### middleware/guest.ts

```typescript
export default defineNuxtRouteMiddleware(() => {
	const {loggedIn} = useUserSession();

	if (loggedIn.value) {
		return navigateTo('/');
	}
});
```

---

## 7. Role-Based Access

### composables/useRoles.ts

```typescript
export const APP_ROLES = {
	ADMIN: 'Administrator',
	EDITOR: 'Editor',
	USER: 'User',
} as const;

export function useRoles() {
	const {user} = useUserSession();

	const currentRole = computed(() => user.value?.role);

	const isAdmin = computed(() => currentRole.value === APP_ROLES.ADMIN);
	const isEditor = computed(() => currentRole.value === APP_ROLES.ADMIN || currentRole.value === APP_ROLES.EDITOR);

	function hasRole(role: string) {
		return currentRole.value === role;
	}

	function hasAnyRole(roles: string[]) {
		return roles.includes(currentRole.value || '');
	}

	return {
		currentRole,
		isAdmin,
		isEditor,
		hasRole,
		hasAnyRole,
	};
}
```

### components/RoleGate.vue

```vue
<script setup lang="ts">
const props = defineProps<{
	roles?: string[];
	requireAdmin?: boolean;
	fallback?: boolean;
}>();

const {isAdmin, hasAnyRole} = useRoles();

const hasAccess = computed(() => {
	if (props.requireAdmin) return isAdmin.value;
	if (props.roles?.length) return hasAnyRole(props.roles) || isAdmin.value;
	return true;
});
</script>

<template>
	<slot v-if="hasAccess" />
	<slot v-else-if="fallback" name="fallback" />
</template>
```

---

## 8. Usage Examples

### Using Generic Items Composable

```vue
<script setup lang="ts">
// For any collection
const posts = useDirectusItems<Post>('posts');
const comments = useDirectusItems<Comment>('comments');

// List with filters
const {data: publishedPosts} = await useAsyncData('posts', () =>
	posts.list({
		filter: {status: {_eq: 'published'}},
		sort: ['-date_created'],
		limit: 10,
		fields: ['id', 'title', 'slug', 'author.*'],
	})
);

// Create
async function createPost(data: Partial<Post>) {
	return await posts.create(data);
}

// Update
async function updatePost(id: string, data: Partial<Post>) {
	return await posts.update(id, data);
}

// Delete
async function deletePost(id: string) {
	await posts.remove(id);
}
</script>
```

### Authentication Flow

```vue
<script setup lang="ts">
const {user, loggedIn, login, logout} = useDirectusAuth();

// Check auth state
watch(loggedIn, (isLoggedIn) => {
	if (!isLoggedIn) {
		navigateTo('/auth/signin');
	}
});

// Login
async function handleLogin() {
	try {
		await login(email.value, password.value);
		navigateTo('/');
	} catch (error) {
		// Handle error
	}
}

// Logout
async function handleLogout() {
	await logout();
	navigateTo('/auth/signin');
}
</script>
```

---

## 9. TypeScript Types

### types/directus.ts

```typescript
export interface DirectusUser {
	id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	status: 'active' | 'inactive' | 'draft' | 'invited' | 'suspended';
	role: DirectusRole | string | null;
	avatar: string | null;
	[key: string]: any;
}

export interface DirectusRole {
	id: string;
	name: string;
	icon: string;
	description: string | null;
	[key: string]: any;
}

export interface DirectusFile {
	id: string;
	storage: string;
	filename_disk: string;
	filename_download: string;
	title: string | null;
	type: string | null;
	folder: string | null;
	uploaded_by: string | null;
	uploaded_on: string;
	modified_by: string | null;
	modified_on: string;
	filesize: number;
	width: number | null;
	height: number | null;
	[key: string]: any;
}

export interface ItemsQuery {
	fields?: string[];
	filter?: Record<string, any>;
	sort?: string[];
	limit?: number;
	offset?: number;
	page?: number;
	search?: string;
	deep?: Record<string, any>;
	aggregate?: Record<string, string>;
}
```

---

## 10. Real-Time WebSocket Composable

### Configuration

Add WebSocket URL to your config:

```typescript
// nuxt.config.ts
runtimeConfig: {
  public: {
    directusUrl: process.env.DIRECTUS_URL,
    websocketUrl: process.env.DIRECTUS_WS_URL, // wss://your-directus.com/websocket
  }
}
```

### server/api/websocket/token.get.ts

```typescript
export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);

	if (!session?.secure?.directusAccessToken) {
		throw createError({statusCode: 401, message: 'Not authenticated'});
	}

	return {token: session.secure.directusAccessToken};
});
```

### composables/useDirectusWebSocket.ts

```typescript
import {createDirectus, realtime, authentication} from '@directus/sdk';

interface SubscriptionOptions {
	collection: string;
	query?: {
		fields?: string[];
		filter?: Record<string, any>;
	};
	uid?: string;
}

interface SubscriptionEvent<T = any> {
	type: 'init' | 'create' | 'update' | 'delete';
	data: T[];
}

type SubscriptionCallback<T = any> = (event: SubscriptionEvent<T>) => void;

export function useDirectusWebSocket() {
	const config = useRuntimeConfig();

	const isConnected = ref(false);
	const isConnecting = ref(false);
	const connectionError = ref<string | null>(null);
	const reconnectAttempts = ref(0);
	const maxReconnectAttempts = 10;

	let client: ReturnType<typeof createDirectus> | null = null;
	const subscriptions = new Map<string, {unsubscribe: () => void}>();

	async function connect() {
		if (isConnected.value || isConnecting.value) return;

		isConnecting.value = true;
		connectionError.value = null;

		try {
			// Get token from server
			const {token} = await $fetch<{token: string}>('/api/websocket/token');

			client = createDirectus(config.public.websocketUrl).with(authentication()).with(realtime());

			// Authenticate WebSocket connection
			await client.connect();
			await client.sendMessage({type: 'auth', access_token: token});

			isConnected.value = true;
			isConnecting.value = false;
			reconnectAttempts.value = 0;
		} catch (error: any) {
			isConnecting.value = false;
			connectionError.value = error.message;
			scheduleReconnect();
		}
	}

	function scheduleReconnect() {
		if (reconnectAttempts.value >= maxReconnectAttempts) {
			connectionError.value = 'Max reconnection attempts reached';
			return;
		}

		const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000);
		reconnectAttempts.value++;

		setTimeout(() => connect(), delay);
	}

	async function subscribe<T = any>(options: SubscriptionOptions, callback: SubscriptionCallback<T>): Promise<string> {
		if (!isConnected.value) {
			await connect();
		}

		const uid = options.uid || `${options.collection}-${Date.now()}`;

		const {subscription} = await client!.subscribe(options.collection, {
			query: options.query,
			uid,
		});

		// Handle subscription events
		(async () => {
			for await (const event of subscription) {
				callback(event as SubscriptionEvent<T>);
			}
		})();

		subscriptions.set(uid, {
			unsubscribe: () => client?.sendMessage({type: 'unsubscribe', uid}),
		});

		return uid;
	}

	function unsubscribe(uid: string) {
		const sub = subscriptions.get(uid);
		if (sub) {
			sub.unsubscribe();
			subscriptions.delete(uid);
		}
	}

	function disconnect() {
		subscriptions.forEach((_, uid) => unsubscribe(uid));
		client?.disconnect();
		client = null;
		isConnected.value = false;
	}

	// Auto-cleanup on unmount
	onUnmounted(() => disconnect());

	return {
		isConnected: readonly(isConnected),
		isConnecting: readonly(isConnecting),
		connectionError: readonly(connectionError),
		reconnectAttempts: readonly(reconnectAttempts),
		connect,
		disconnect,
		subscribe,
		unsubscribe,
	};
}
```

### Reactive Subscription Hook

```typescript
// composables/useDirectusSubscription.ts
export function useDirectusSubscription<T = any>(
	collection: string,
	options?: {
		fields?: string[];
		filter?: Record<string, any>;
		immediate?: boolean;
	}
) {
	const {subscribe, unsubscribe, isConnected} = useDirectusWebSocket();

	const items = ref<T[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	let subscriptionId: string | null = null;

	async function start() {
		if (subscriptionId) return;

		loading.value = true;
		error.value = null;

		try {
			subscriptionId = await subscribe<T>(
				{
					collection,
					query: {
						fields: options?.fields,
						filter: options?.filter,
					},
				},
				(event) => {
					switch (event.type) {
						case 'init':
							items.value = event.data;
							break;
						case 'create':
							items.value = [...items.value, ...event.data];
							break;
						case 'update':
							items.value = items.value.map((item) => {
								const updated = event.data.find((d: any) => d.id === (item as any).id);
								return updated || item;
							});
							break;
						case 'delete':
							const deletedIds = event.data.map((d: any) => d.id);
							items.value = items.value.filter((item: any) => !deletedIds.includes(item.id));
							break;
					}
				}
			);
		} catch (e: any) {
			error.value = e.message;
		} finally {
			loading.value = false;
		}
	}

	function stop() {
		if (subscriptionId) {
			unsubscribe(subscriptionId);
			subscriptionId = null;
		}
	}

	// Auto-start if immediate
	if (options?.immediate !== false) {
		onMounted(() => start());
	}

	onUnmounted(() => stop());

	return {
		items: readonly(items),
		loading: readonly(loading),
		error: readonly(error),
		isConnected,
		start,
		stop,
	};
}
```

### Usage Example

```vue
<script setup lang="ts">
// Subscribe to real-time updates
const {items: tasks, loading} = useDirectusSubscription<Task>('tasks', {
	fields: ['id', 'title', 'status', 'assigned_to.*'],
	filter: {status: {_neq: 'archived'}},
});

// Or manual subscription
const {subscribe, unsubscribe, isConnected} = useDirectusWebSocket();

onMounted(async () => {
	await subscribe({collection: 'messages', query: {fields: ['*', 'author.*']}}, (event) => {
		if (event.type === 'create') {
			// New message received
			console.log('New message:', event.data);
		}
	});
});
</script>

<template>
	<div>
		<span v-if="isConnected" class="text-green-500">Connected</span>
		<div v-for="task in tasks" :key="task.id">
			{{ task.title }}
		</div>
	</div>
</template>
```

---

## 11. Directus Core Collection Composables

### composables/useDirectusActivity.ts

```typescript
import type {ItemsQuery} from '~/types/directus';

interface DirectusActivity {
	id: number;
	action: 'create' | 'update' | 'delete' | 'login' | 'comment';
	user: string | null;
	timestamp: string;
	ip: string | null;
	user_agent: string | null;
	collection: string;
	item: string;
	comment: string | null;
	revisions: number[];
}

export function useDirectusActivity() {
	const items = useDirectusItems<DirectusActivity>('directus_activity');

	async function getActivity(query?: ItemsQuery) {
		return await items.list({
			sort: ['-timestamp'],
			...query,
		});
	}

	async function getActivityForItem(collection: string, itemId: string, query?: ItemsQuery) {
		return await items.list({
			filter: {
				collection: {_eq: collection},
				item: {_eq: itemId},
			},
			sort: ['-timestamp'],
			...query,
		});
	}

	async function getActivityForUser(userId: string, query?: ItemsQuery) {
		return await items.list({
			filter: {user: {_eq: userId}},
			sort: ['-timestamp'],
			...query,
		});
	}

	async function getRecentActivity(limit = 50) {
		return await items.list({
			sort: ['-timestamp'],
			limit,
			fields: ['*', 'user.first_name', 'user.last_name', 'user.avatar'],
		});
	}

	async function getActivityByAction(action: DirectusActivity['action'], query?: ItemsQuery) {
		return await items.list({
			filter: {action: {_eq: action}},
			sort: ['-timestamp'],
			...query,
		});
	}

	return {
		getActivity,
		getActivityForItem,
		getActivityForUser,
		getRecentActivity,
		getActivityByAction,
	};
}
```

### composables/useDirectusNotifications.ts

```typescript
interface DirectusNotification {
	id: string;
	timestamp: string;
	status: 'inbox' | 'archived';
	recipient: string;
	sender: string | null;
	subject: string;
	message: string | null;
	collection: string | null;
	item: string | null;
}

export function useDirectusNotifications() {
	const items = useDirectusItems<DirectusNotification>('directus_notifications');

	// Create notifications
	async function create(data: Partial<DirectusNotification>) {
		return await items.create(data);
	}

	async function createMany(notifications: Partial<DirectusNotification>[]) {
		return await Promise.all(notifications.map((n) => create(n)));
	}

	async function sendTo(
		userId: string,
		subject: string,
		message?: string,
		options?: {collection?: string; item?: string}
	) {
		return await create({
			recipient: userId,
			subject,
			message,
			collection: options?.collection,
			item: options?.item,
		});
	}

	async function broadcast(userIds: string[], subject: string, message?: string) {
		return await createMany(userIds.map((userId) => ({recipient: userId, subject, message})));
	}

	// Read notifications
	async function getMyNotifications(query?: ItemsQuery) {
		return await items.list({
			sort: ['-timestamp'],
			...query,
		});
	}

	async function getUnread() {
		return await items.list({
			filter: {status: {_eq: 'inbox'}},
			sort: ['-timestamp'],
		});
	}

	async function getArchived() {
		return await items.list({
			filter: {status: {_eq: 'archived'}},
			sort: ['-timestamp'],
		});
	}

	async function countUnread(): Promise<number> {
		return await items.count({status: {_eq: 'inbox'}});
	}

	// Update notifications
	async function archive(id: string) {
		return await items.update(id, {status: 'archived'});
	}

	async function archiveMany(ids: string[]) {
		return await Promise.all(ids.map((id) => archive(id)));
	}

	async function archiveAll() {
		const unread = await getUnread();
		return await archiveMany(unread.map((n) => n.id));
	}

	async function markAsUnread(id: string) {
		return await items.update(id, {status: 'inbox'});
	}

	// Delete notifications
	async function remove(id: string) {
		return await items.remove(id);
	}

	async function removeMany(ids: string[]) {
		return await items.remove(ids);
	}

	async function clearArchived() {
		const archived = await getArchived();
		return await removeMany(archived.map((n) => n.id));
	}

	// Reactive hook
	function useNotificationList(options?: {autoRefresh?: number}) {
		const notifications = ref<DirectusNotification[]>([]);
		const unreadCount = ref(0);
		const loading = ref(false);

		async function refresh() {
			loading.value = true;
			try {
				const [list, count] = await Promise.all([getMyNotifications(), countUnread()]);
				notifications.value = list;
				unreadCount.value = count;
			} finally {
				loading.value = false;
			}
		}

		let interval: ReturnType<typeof setInterval> | null = null;

		onMounted(() => {
			refresh();
			if (options?.autoRefresh) {
				interval = setInterval(refresh, options.autoRefresh);
			}
		});

		onUnmounted(() => {
			if (interval) clearInterval(interval);
		});

		return {
			notifications: readonly(notifications),
			unreadCount: readonly(unreadCount),
			loading: readonly(loading),
			refresh,
		};
	}

	return {
		create,
		createMany,
		sendTo,
		broadcast,
		getMyNotifications,
		getUnread,
		getArchived,
		countUnread,
		archive,
		archiveMany,
		archiveAll,
		markAsUnread,
		remove,
		removeMany,
		clearArchived,
		useNotificationList,
	};
}
```

### composables/useDirectusRoles.ts

```typescript
interface DirectusRole {
	id: string;
	name: string;
	icon: string;
	description: string | null;
	ip_access: string[] | null;
	enforce_tfa: boolean;
	admin_access: boolean;
	app_access: boolean;
	users: string[];
}

export function useDirectusRoles() {
	const items = useDirectusItems<DirectusRole>('directus_roles');

	async function list(query?: ItemsQuery) {
		return await items.list(query);
	}

	async function get(id: string, query?: ItemsQuery) {
		return await items.get(id, query);
	}

	async function getByName(name: string) {
		const roles = await items.list({
			filter: {name: {_eq: name}},
			limit: 1,
		});
		return roles[0] || null;
	}

	async function create(data: Partial<DirectusRole>) {
		return await items.create(data);
	}

	async function update(id: string, data: Partial<DirectusRole>) {
		return await items.update(id, data);
	}

	async function remove(id: string) {
		return await items.remove(id);
	}

	async function getAdminRoles() {
		return await items.list({
			filter: {admin_access: {_eq: true}},
		});
	}

	async function getPublicRoles() {
		return await items.list({
			filter: {
				admin_access: {_eq: false},
				app_access: {_eq: true},
			},
		});
	}

	async function getRoleUsers(roleId: string) {
		const role = await items.get(roleId, {
			fields: ['users.*'],
		});
		return role?.users || [];
	}

	return {
		list,
		get,
		getByName,
		create,
		update,
		remove,
		getAdminRoles,
		getPublicRoles,
		getRoleUsers,
	};
}
```

### composables/useDirectusFolders.ts

```typescript
interface DirectusFolder {
	id: string;
	name: string;
	parent: string | null;
}

export function useDirectusFolders() {
	const items = useDirectusItems<DirectusFolder>('directus_folders');

	async function list(query?: ItemsQuery) {
		return await items.list(query);
	}

	async function get(id: string, query?: ItemsQuery) {
		return await items.get(id, query);
	}

	async function create(name: string, parentId?: string) {
		return await items.create({name, parent: parentId || null});
	}

	async function createPath(path: string): Promise<DirectusFolder> {
		const parts = path.split('/').filter(Boolean);
		let parentId: string | null = null;
		let folder: DirectusFolder | null = null;

		for (const part of parts) {
			const existing = await findByName(part, parentId);
			if (existing) {
				folder = existing;
				parentId = existing.id;
			} else {
				folder = await create(part, parentId || undefined);
				parentId = folder.id;
			}
		}

		return folder!;
	}

	async function update(id: string, data: Partial<DirectusFolder>) {
		return await items.update(id, data);
	}

	async function rename(id: string, newName: string) {
		return await update(id, {name: newName});
	}

	async function move(id: string, newParentId: string | null) {
		return await update(id, {parent: newParentId});
	}

	async function remove(id: string) {
		return await items.remove(id);
	}

	async function getRootFolders() {
		return await items.list({
			filter: {parent: {_null: true}},
			sort: ['name'],
		});
	}

	async function getChildren(parentId: string) {
		return await items.list({
			filter: {parent: {_eq: parentId}},
			sort: ['name'],
		});
	}

	async function findByName(name: string, parentId?: string | null) {
		const filter: Record<string, any> = {name: {_eq: name}};
		if (parentId) {
			filter.parent = {_eq: parentId};
		} else if (parentId === null) {
			filter.parent = {_null: true};
		}

		const folders = await items.list({filter, limit: 1});
		return folders[0] || null;
	}

	async function getTree(): Promise<(DirectusFolder & {children: any[]})[]> {
		const allFolders = await items.list({sort: ['name']});

		function buildTree(parentId: string | null): any[] {
			return allFolders
				.filter((f) => f.parent === parentId)
				.map((f) => ({
					...f,
					children: buildTree(f.id),
				}));
		}

		return buildTree(null);
	}

	async function getPath(folderId: string): Promise<DirectusFolder[]> {
		const path: DirectusFolder[] = [];
		let currentId: string | null = folderId;

		while (currentId) {
			const folder = await get(currentId);
			if (folder) {
				path.unshift(folder);
				currentId = folder.parent;
			} else {
				break;
			}
		}

		return path;
	}

	async function getPathString(folderId: string): Promise<string> {
		const path = await getPath(folderId);
		return path.map((f) => f.name).join('/');
	}

	return {
		list,
		get,
		create,
		createPath,
		update,
		rename,
		move,
		remove,
		getRootFolders,
		getChildren,
		findByName,
		getTree,
		getPath,
		getPathString,
	};
}
```

### composables/useDirectusRevisions.ts

```typescript
interface DirectusRevision {
	id: number;
	activity: number;
	collection: string;
	item: string;
	data: Record<string, any>;
	delta: Record<string, any>;
	parent: number | null;
	version: string | null;
}

export function useDirectusRevisions() {
	const items = useDirectusItems<DirectusRevision>('directus_revisions');

	async function list(query?: ItemsQuery) {
		return await items.list(query);
	}

	async function get(id: number, query?: ItemsQuery) {
		return await items.get(id, query);
	}

	async function getForItem(collection: string, itemId: string, query?: ItemsQuery) {
		return await items.list({
			filter: {
				collection: {_eq: collection},
				item: {_eq: itemId},
			},
			sort: ['-id'],
			...query,
		});
	}

	async function getLatest(collection: string, itemId: string) {
		const revisions = await getForItem(collection, itemId, {limit: 1});
		return revisions[0] || null;
	}

	async function compare(revisionId1: number, revisionId2: number) {
		const [rev1, rev2] = await Promise.all([get(revisionId1), get(revisionId2)]);

		if (!rev1 || !rev2) return null;

		const changes: Record<string, {old: any; new: any}> = {};
		const allKeys = new Set([...Object.keys(rev1.data), ...Object.keys(rev2.data)]);

		for (const key of allKeys) {
			if (JSON.stringify(rev1.data[key]) !== JSON.stringify(rev2.data[key])) {
				changes[key] = {old: rev1.data[key], new: rev2.data[key]};
			}
		}

		return changes;
	}

	return {
		list,
		get,
		getForItem,
		getLatest,
		compare,
	};
}
```

### composables/useDirectusPresets.ts

```typescript
interface DirectusPreset {
	id: number;
	bookmark: string | null;
	user: string | null;
	role: string | null;
	collection: string;
	search: string | null;
	layout: string | null;
	layout_query: Record<string, any> | null;
	layout_options: Record<string, any> | null;
	refresh_interval: number | null;
	filter: Record<string, any> | null;
	icon: string;
	color: string | null;
}

export function useDirectusPresets() {
	const items = useDirectusItems<DirectusPreset>('directus_presets');

	async function list(query?: ItemsQuery) {
		return await items.list(query);
	}

	async function get(id: number, query?: ItemsQuery) {
		return await items.get(id, query);
	}

	async function getForCollection(collection: string) {
		return await items.list({
			filter: {collection: {_eq: collection}},
		});
	}

	async function getBookmarks() {
		return await items.list({
			filter: {bookmark: {_nnull: true}},
		});
	}

	async function create(data: Partial<DirectusPreset>) {
		return await items.create(data);
	}

	async function createBookmark(
		collection: string,
		name: string,
		filter?: Record<string, any>,
		options?: Partial<DirectusPreset>
	) {
		return await create({
			collection,
			bookmark: name,
			filter,
			...options,
		});
	}

	async function update(id: number, data: Partial<DirectusPreset>) {
		return await items.update(id, data);
	}

	async function remove(id: number) {
		return await items.remove(id);
	}

	return {
		list,
		get,
		getForCollection,
		getBookmarks,
		create,
		createBookmark,
		update,
		remove,
	};
}
```

---

## Quick Reference

### Composables

| Composable                     | Purpose                         |
| ------------------------------ | ------------------------------- |
| `useDirectusAuth()`            | Login, logout, password reset   |
| `useDirectusUser()`            | Current user operations         |
| `useDirectusItems(collection)` | Generic CRUD for any collection |
| `useDirectusFiles()`           | File uploads and URL helpers    |
| `useRoles()`                   | Role-based access checks        |
| `useDirectusWebSocket()`       | Real-time subscriptions         |
| `useDirectusSubscription()`    | Reactive real-time data         |
| `useDirectusActivity()`        | Activity log operations         |
| `useDirectusNotifications()`   | In-app notifications            |
| `useDirectusRoles()`           | Role management                 |
| `useDirectusFolders()`         | Folder hierarchy management     |
| `useDirectusRevisions()`       | Revision history                |
| `useDirectusPresets()`         | Saved filters/bookmarks         |

### API Routes

| API Route                    | Method    | Purpose                 |
| ---------------------------- | --------- | ----------------------- |
| `/api/auth/login`            | POST      | Authenticate user       |
| `/api/auth/logout`           | POST      | Clear session           |
| `/api/auth/refresh-session`  | POST      | Refresh tokens          |
| `/api/directus/items`        | POST      | Generic CRUD operations |
| `/api/directus/users/me`     | GET/PATCH | Current user data       |
| `/api/directus/files/upload` | POST      | Upload files            |
| `/api/websocket/token`       | GET       | WebSocket auth token    |

---

## Notes for Claude Code

1. **Always create server routes** - Never expose Directus tokens to the client
2. **Use nuxt-auth-utils** - For session management with encrypted token storage
3. **Token refresh is automatic** - Server utils handle refresh before expiry
4. **Admin vs User clients** - Use admin for reads, user for writes (respects permissions)
5. **Type your collections** - Add interfaces to `types/directus.ts`
6. **Handle errors gracefully** - Always wrap API calls in try/catch
7. **Use middleware** - Protect routes with auth middleware
