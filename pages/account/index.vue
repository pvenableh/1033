<template>
	<div class="account-page t-bg min-h-screen">
		<!-- Hero Section -->
		<section class="py-12 lg:py-16 px-6 lg:px-16 t-bg-alt">
			<div class="max-w-5xl mx-auto">
				<div class="page-header text-center opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-4 t-text-accent-tertiary">Resident Portal</p>
					<h1 class="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light tracking-tight leading-tight mb-6 t-text">
						My Account
					</h1>
					<div class="w-16 h-px t-bg-accent mx-auto"></div>
				</div>
			</div>
		</section>

		<!-- Account Content -->
		<section class="py-12 lg:py-16 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="flex flex-col md:flex-row gap-8 lg:gap-12">
					<!-- Navigation Sidebar -->
					<div class="account-nav md:w-56 flex-shrink-0 opacity-0">
						<div class="flex flex-col items-center md:items-end text-center md:text-right">
							<div class="mb-6">
								<div class="w-20 h-20 rounded-full overflow-hidden border-2 t-border-accent mx-auto md:ml-auto md:mr-0">
									<img
										:src="avatar"
										:alt="user?.first_name + ' ' + user?.last_name"
										class="w-full h-full object-cover" />
								</div>
								<p class="font-serif text-lg t-text mt-3">{{ user?.first_name }} {{ user?.last_name }}</p>
							</div>
							<nav class="w-full border-t t-border-divider pt-4 md:border-t-0 md:pt-0">
								<a
									v-for="(item, index) in navItems"
									:key="index"
									:class="[
										'nav-item flex items-center justify-center md:justify-end gap-2 py-3 cursor-pointer transition-all duration-300',
										panel === item.id ? 't-text-accent-tertiary' : 't-text-tertiary hover:t-text',
									]"
									@click.prevent="changePanel(item.id)">
									<span class="text-xs tracking-[0.15em] uppercase">{{ item.label }}</span>
									<span
										class="w-1.5 h-1.5 rounded-full transition-all duration-300"
										:class="panel === item.id ? 't-bg-accent' : 'bg-transparent'"></span>
								</a>
								<div class="mt-4 pt-4 border-t t-border-divider">
									<AccountLogout v-if="user" class="w-full flex justify-center md:justify-end" />
								</div>
							</nav>
						</div>
					</div>

					<!-- Content Panels -->
					<div class="flex-1 account-content opacity-0">
						<div class="t-bg-elevated border t-border-divider p-6 lg:p-8">
							<transition name="fade" mode="out-in">
								<div v-if="panel === 1" key="1">
									<AccountProfile />
								</div>
								<div v-else-if="panel === 2" key="2">
									<AccountUnitInfo />
								</div>
								<div v-else-if="panel === 3" key="3">
									<AccountPets />
								</div>
								<div v-else-if="panel === 4" key="4">
									<AccountVehicles />
								</div>
							</transition>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import {ref, onMounted, onUnmounted} from 'vue';
import {gsap} from 'gsap';

const {user: sessionUser} = useDirectusAuth();

definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

// Fetch fresh user data from API (session may not always have name fields)
const { data: meData } = useLazyFetch<any>('/api/directus/users/me', {
	server: false,
	default: () => null,
});

// Use API data with session fallback
const user = computed(() => {
	const me = meData.value;
	const s = sessionUser.value as any;
	if (me && me.first_name) return me;
	if (s) return s;
	return null;
});

const navItems = [
	{id: 1, label: 'Profile'},
	{id: 2, label: 'My Unit'},
	{id: 3, label: 'Pets'},
	{id: 4, label: 'Vehicles'},
];

const avatar = computed(() => {
	if (user.value?.avatar) {
		return 'https://admin.1033lenox.com/assets/' + user.value.avatar + '?key=medium';
	} else {
		return (
			'https://ui-avatars.com/api/?name=' +
			(user.value?.first_name || '') +
			' ' +
			(user.value?.last_name || '') +
			'&background=C9A96E&color=ffffff'
		);
	}
});

const panel = ref(1);

function changePanel(val: string | number) {
	panel.value = Number(val);
}

let ctx: gsap.Context;

onMounted(() => {
	ctx = gsap.context(() => {
		gsap.fromTo('.page-header', {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2});
		gsap.fromTo(
			'.account-nav',
			{opacity: 0, x: -20},
			{opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.4}
		);
		gsap.fromTo(
			'.account-content',
			{opacity: 0, y: 20},
			{opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.5}
		);
	});
});

onUnmounted(() => {
	if (ctx) ctx.revert();
});
</script>

<style scoped>
.account-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
