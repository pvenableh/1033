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
				<!-- Dashboard - visible to approved users or when not logged in -->
				<li v-if="showApprovedLinks">
					<nuxt-link to="/dashboard" class="flex items-center gap-2">
						<UIcon name="i-lucide-layout-dashboard" class="w-4 h-4" />
						Dashboard
					</nuxt-link>
				</li>

				<!-- Announcements - visible to approved users or when not logged in -->
				<li v-if="showApprovedLinks">
					<nuxt-link to="/announcements" class="flex items-center gap-2">
						<UIcon name="i-heroicons-megaphone" class="w-4 h-4" />
						Announcements
					</nuxt-link>
				</li>

				<!-- Meetings - visible to approved users or when not logged in -->
				<li v-if="showApprovedLinks">
					<nuxt-link to="/meetings" class="flex items-center gap-2">
						<UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
						Meetings
					</nuxt-link>
				</li>

				<!-- By-Laws - visible to approved users or when not logged in -->
				<li v-if="showApprovedLinks">
					<nuxt-link to="/documents" class="flex items-center gap-2">
						<UIcon name="i-heroicons-document-text" class="w-4 h-4" />
						By-Laws
					</nuxt-link>
				</li>

				<!-- Rules - visible to approved users or when not logged in -->
				<li v-if="showApprovedLinks">
					<nuxt-link to="/rules-regulations" class="flex items-center gap-2">
						<UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4" />
						Rules
					</nuxt-link>
				</li>

				<!-- Parking - visible to approved users or when not logged in -->
				<li v-if="showApprovedLinks">
					<nuxt-link to="/parking-garage" class="flex items-center gap-2">
						<UIcon name="i-lucide-car" class="w-4 h-4" />
						Parking
					</nuxt-link>
				</li>

				<!-- Channels - visible to board members, channel members, or when not logged in -->
				<li v-if="showChannels">
					<nuxt-link to="/channels" class="flex items-center gap-2">
						<UIcon name="i-lucide-messages-square" class="w-4 h-4" />
						Channels
					</nuxt-link>
				</li>

				<!-- Security - visible to board members, owners, or when not logged in -->
				<li v-if="showSecurity">
					<nuxt-link to="/security" class="flex items-center gap-2">
						<UIcon name="i-lucide-cctv" class="w-4 h-4" />
						Security
					</nuxt-link>
				</li>

				<!-- Financials - visible to board members, owners, or when not logged in -->
				<li v-if="showFinancials">
					<nuxt-link to="/financials" class="flex items-center gap-2">
						<UIcon name="i-heroicons-currency-dollar" class="w-4 h-4" />
						Financials
					</nuxt-link>
				</li>

				<!-- Tasks - visible to board members or when not logged in -->
				<li v-if="showBoardMemberLinks">
					<nuxt-link to="/tasks" class="flex items-center gap-2">
						<UIcon name="i-heroicons-clipboard-document-check" class="w-4 h-4" />
						Tasks
					</nuxt-link>
				</li>

				<!-- Admin/Users - visible to board members or when not logged in -->
				<li v-if="showBoardMemberLinks">
					<nuxt-link to="/admin" class="flex items-center gap-2 admin-link">
						<UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
						Users
					</nuxt-link>
				</li>

				<!-- Divider before account section -->
				<li v-if="user" class="nav-drawer__divider" aria-hidden="true">
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

// Computed properties for navigation visibility
// When no user is logged in, show all links (middleware will redirect to login)
const showApprovedLinks = computed(() => {
	return !user.value || isApproved.value;
});

const showChannels = computed(() => {
	// Show when not logged in (middleware handles redirect) or when user has access
	if (!user.value) return true;
	return isBoardMember.value || hasChannelMembership.value;
});

const showFinancials = computed(() => {
	// Show when not logged in (middleware handles redirect) or when user has access
	if (!user.value) return true;
	return isBoardMember.value || isOwner.value;
});

const showSecurity = computed(() => {
	// Show when not logged in (middleware handles redirect) or when user has access
	if (!user.value) return true;
	return isBoardMember.value || isOwner.value;
});

const showBoardMemberLinks = computed(() => {
	// Show when not logged in (middleware handles redirect) or when user is board member
	if (!user.value) return true;
	return isBoardMember.value;
});

const navDrawerRef = ref(null);

function closeNavDrawer() {
	const element = document.getElementById('nav-drawer-toggle');
	element.checked = false;
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
