<template>
	<div
		id="nav-drawer"
		ref="navDrawerRef"
		class="flex items-center justify-center flex-col nav-drawer"
		:style="{
			backgroundColor: 'var(--theme-drawer-bg)',
			color: 'var(--theme-text-primary)'
		}"
		@click="closeNavDrawer">
		<div class="nav-drawer__menu-box p-4 overflow-y-auto relative">
			<UIcon
				name="i-heroicons-x-mark"
				class="cursor-pointer h-6 w-6 -ml-[5px] -mt-[10px] mb-[10px] heroicon-sw-1.2 close-btn" />
			<ul tabindex="0" class="nav-drawer__menu">
				<!-- Dashboard -->
				<li>
					<a
						href="/dashboard"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessApproved}"
						@click="(e) => handleNavClick(e, '/dashboard', canAccessApproved, 'Dashboard')">
						<UIcon name="i-lucide-layout-dashboard" class="w-4 h-4" />
						Dashboard
						<UIcon v-if="!canAccessApproved" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Announcements -->
				<li>
					<a
						href="/announcements"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessApproved}"
						@click="(e) => handleNavClick(e, '/announcements', canAccessApproved, 'Announcements')">
						<UIcon name="i-heroicons-megaphone" class="w-4 h-4" />
						Announcements
						<UIcon v-if="!canAccessApproved" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Meetings -->
				<li>
					<a
						href="/meetings"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessApproved}"
						@click="(e) => handleNavClick(e, '/meetings', canAccessApproved, 'Meetings')">
						<UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
						Meetings
						<UIcon v-if="!canAccessApproved" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- By-Laws -->
				<li>
					<a
						href="/documents"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessApproved}"
						@click="(e) => handleNavClick(e, '/documents', canAccessApproved, 'By-Laws')">
						<UIcon name="i-heroicons-document-text" class="w-4 h-4" />
						By-Laws
						<UIcon v-if="!canAccessApproved" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Rules -->
				<li>
					<a
						href="/rules-regulations"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessApproved}"
						@click="(e) => handleNavClick(e, '/rules-regulations', canAccessApproved, 'Rules')">
						<UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4" />
						Rules
						<UIcon v-if="!canAccessApproved" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Parking -->
				<li>
					<a
						href="/parking-garage"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessApproved}"
						@click="(e) => handleNavClick(e, '/parking-garage', canAccessApproved, 'Parking')">
						<UIcon name="i-lucide-car" class="w-4 h-4" />
						Parking
						<UIcon v-if="!canAccessApproved" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Projects -->
				<li>
					<a
						href="/projects"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessApproved}"
						@click="(e) => handleNavClick(e, '/projects', canAccessApproved, 'Projects')">
						<UIcon name="i-lucide-chart-no-axes-gantt" class="w-4 h-4" />
						Projects
						<UIcon v-if="!canAccessApproved" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Channels -->
				<li>
					<a
						href="/channels"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessChannels}"
						@click="(e) => handleNavClick(e, '/channels', canAccessChannels, 'Channels', 'channel membership')">
						<UIcon name="i-lucide-messages-square" class="w-4 h-4" />
						Channels
						<UIcon v-if="!canAccessChannels" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Security -->
				<li>
					<a
						href="/security"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessOwner}"
						@click="(e) => handleNavClick(e, '/security', canAccessOwner, 'Security', 'owner')">
						<UIcon name="i-lucide-cctv" class="w-4 h-4" />
						Security
						<UIcon v-if="!canAccessOwner" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Financials -->
				<li>
					<a
						href="/financials"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessOwner}"
						@click="(e) => handleNavClick(e, '/financials', canAccessOwner, 'Financials', 'owner')">
						<UIcon name="i-heroicons-currency-dollar" class="w-4 h-4" />
						Financials
						<UIcon v-if="!canAccessOwner" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Tasks -->
				<li>
					<a
						href="/tasks"
						class="flex items-center gap-2"
						:class="{'restricted-link': !canAccessBoardMember}"
						@click="(e) => handleNavClick(e, '/tasks', canAccessBoardMember, 'Tasks', 'board member')">
						<UIcon name="i-heroicons-clipboard-document-check" class="w-4 h-4" />
						Tasks
						<UIcon v-if="!canAccessBoardMember" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Admin/Users -->
				<li>
					<a
						href="/admin"
						class="flex items-center gap-2 admin-link"
						:class="{'restricted-link': !canAccessBoardMember}"
						@click="(e) => handleNavClick(e, '/admin', canAccessBoardMember, 'Users', 'board member')">
						<UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
						Users
						<UIcon v-if="!canAccessBoardMember" name="i-heroicons-lock-closed" class="w-3 h-3 ml-auto lock-icon" />
					</a>
				</li>

				<!-- Divider before account section -->
				<li class="nav-drawer__divider" aria-hidden="true">
					<span class="divider-line"></span>
				</li>

				<!-- Account - visible only when logged in -->
				<li v-if="user">
					<nuxt-link to="/account" class="flex items-center gap-2">
						<UIcon name="i-heroicons-user-circle" class="w-4 h-4" />
						Account
					</nuxt-link>
				</li>

				<!-- Login/Logout -->
				<li v-if="user">
					<AccountLogout />
				</li>
				<li v-else>
					<nuxt-link to="/auth/signin" class="flex items-center gap-2">
						<UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
						Login
					</nuxt-link>
				</li>
			</ul>

			<!-- Theme Selector -->
			<ThemeSelector />
		</div>
	</div>
</template>
<script setup lang="ts">
import {onClickOutside} from '@vueuse/core';
import {closeScreen} from '~~/composables/useScreen';

const {user} = useDirectusAuth();
const {isBoardMember, isOwner, isApproved} = useRoles();
const toast = useToast();
const router = useRouter();

// Check if user has channel membership
const hasChannelMembership = ref(false);

// Fetch user's channel membership status
const checkChannelMembership = async () => {
	if (!user.value?.id) {
		hasChannelMembership.value = false;
		return;
	}

	try {
		const {getChannels} = useChannels();
		const channels = await getChannels();

		// Check if user is a member of any channel
		hasChannelMembership.value = channels.some((channel: any) => {
			if (!channel.members) return false;
			return channel.members.some((member: any) => {
				const memberId = typeof member.user_id === 'string' ? member.user_id : member.user_id?.id;
				return memberId === user.value?.id;
			});
		});
	} catch (error) {
		console.error('Failed to check channel membership:', error);
		hasChannelMembership.value = false;
	}
};

// Check channel membership on mount
onMounted(() => {
	checkChannelMembership();
});

// Re-check when user changes
watch(
	() => user.value?.id,
	() => {
		checkChannelMembership();
	}
);

// Computed properties for access checks (used for styling and click handling)
const canAccessApproved = computed(() => {
	return user.value && isApproved.value;
});

const canAccessChannels = computed(() => {
	return user.value && (isBoardMember.value || hasChannelMembership.value);
});

const canAccessOwner = computed(() => {
	return user.value && (isBoardMember.value || isOwner.value);
});

const canAccessBoardMember = computed(() => {
	return user.value && isBoardMember.value;
});

// Handle navigation click with access check
function handleNavClick(e: Event, path: string, hasAccess: boolean, featureName: string, requiredAccess?: string) {
	e.preventDefault();
	e.stopPropagation();

	if (!user.value) {
		// Not logged in - show toast and redirect to login
		toast.add({
			icon: 'i-heroicons-lock-closed',
			title: 'Sign in required',
			description: `Sign in to access ${featureName}`,
			color: 'blue',
		});
		closeNavDrawer();
		router.push(`/auth/signin?redirect=${encodeURIComponent(path)}`);
		return;
	}

	if (!hasAccess) {
		// Logged in but no access - show toast explaining required access
		const accessLabel = requiredAccess || 'approved member';
		toast.add({
			icon: 'i-heroicons-lock-closed',
			title: 'Access restricted',
			description: `${featureName} requires ${accessLabel} access`,
			color: 'amber',
		});
		return;
	}

	// Has access - navigate normally
	closeNavDrawer();
	router.push(path);
}

const navDrawerRef = ref(null);

function closeNavDrawer() {
	const element = document.getElementById('nav-drawer-toggle');
	if (element) {
		(element as HTMLInputElement).checked = false;
	}
	closeScreen();
}

onClickOutside(navDrawerRef, () => {
	closeNavDrawer();
});
</script>
<style scoped>
.nav-drawer {
	min-height: 100vh;
	max-height: 100vh;
	position: fixed;
	right: 0%;
	top: 0px;
	z-index: 50;
	/* background: var(--white);
	background: rgba(208, 208, 208, 0.5);
	background: rgba(255, 255, 255, 0.75); */
	transform: translateX(100%);
	transition: 0.35s var(--curve);
	width: 100%;
	max-width: 500px;
	backdrop-filter: blur(10px);
	@apply shadow-lg;

	.close-btn {
		/* right: 0px;
	  top: 0px;
	  @apply absolute; */
	}

	&__menu-box {
	}

	&__menu {
		@apply overflow-hidden;

		li {
			opacity: 0;
			transform: translateX(50px) translateZ(-9.7rem);
			transition: all 0.4s var(--curve);
			@apply my-1;

			a,
			label {
				font-size: 13px;
				letter-spacing: 0.3em;
				@apply block uppercase py-1;
			}

			a.router-link-exact-active,
			a.router-link-active {
				color: var(--theme-accent-active, var(--cyan2));
				@apply font-bold;
			}

			a.admin-link {
				color: var(--theme-warning, #f59e0b);
			}

			a.admin-link.router-link-active {
				color: var(--theme-warning, #f59e0b);
			}

			a.restricted-link {
				opacity: 0.5;
				cursor: pointer;

				&:hover {
					opacity: 0.7;
				}

				.lock-icon {
					opacity: 0.7;
				}
			}

			a.admin-link.restricted-link {
				opacity: 0.4;
			}
		}
	}

	&__divider {
		padding: 0.5rem 0;

		.divider-line {
			display: block;
			height: 1px;
			width: 100%;
			background: currentColor;
			opacity: 0.2;
		}
	}
}

#nav-drawer-toggle:checked ~ .nav-drawer {
	transform: translateX(0%);

	li {
		opacity: 1;
		transform: translateX(0%) translateZ(0rem);
	}

	li:nth-of-type(1) {
		transition-delay: 0.045s;
	}

	li:nth-of-type(2) {
		transition-delay: 0.06s;
	}

	li:nth-of-type(3) {
		transition-delay: 0.075s;
	}

	li:nth-of-type(4) {
		transition-delay: 0.09s;
	}

	li:nth-of-type(5) {
		transition-delay: 0.105s;
	}

	li:nth-of-type(6) {
		transition-delay: 0.12s;
	}

	li:nth-of-type(7) {
		transition-delay: 0.135s;
	}

	li:nth-of-type(8) {
		transition-delay: 0.15s;
	}
	li:nth-of-type(9) {
		transition-delay: 0.165s;
	}
	li:nth-of-type(10) {
		transition-delay: 0.18s;
	}
	li:nth-of-type(11) {
		transition-delay: 0.195s;
	}
	li:nth-of-type(12) {
		transition-delay: 0.21s;
	}
	li:nth-of-type(13) {
		transition-delay: 0.225s;
	}
	li:nth-of-type(14) {
		transition-delay: 0.24s;
	}
	li:nth-of-type(15) {
		transition-delay: 0.255s;
	}
}

#nav-drawer-toggle:checked ~ .page-content {
	/* transform: matrix(1, 0, 0, 1, 8, 0); */
	transform: translateX(8px);
	filter: blur(2px);
}

/* #nav-drawer-toggle:checked ~ .nav-drawer > .nav-drawer-overlay {
	background: rgba(48, 54, 64, 0.4);
	opacity: 0.999999;
	visibility: visible;
  } */
</style>
