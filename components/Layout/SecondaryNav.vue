<template>
	<Transition name="slide-down">
		<nav
			v-if="user && isApproved && isSecondaryNavVisible"
			class="secondary-nav w-full transition-all"
			:class="{retracted: isScrollingDown}"
			:style="{
				backgroundColor: 'var(--theme-secondary-nav-bg, var(--theme-bg-secondary))',
				borderColor: 'var(--theme-border-light)',
			}">
			<div class="secondary-nav__container max-w-7xl mx-auto px-4 sm:px-6">
				<ul
					class="secondary-nav__list w-full flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pt-3 pb-1 scrollbar-hide">
					<!-- Dashboard - visible to all approved users -->
					<li>
						<Tooltip text="Dashboard" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link
								to="/dashboard"
								class="secondary-nav__link flex"
								:class="{active: isActiveRoute('/dashboard')}">
								<Icon name="i-lucide-layout-dashboard" class="w-6 h-6" />
								<span class="hidden">Dashboard</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Announcements - visible to all approved users -->
					<li>
						<Tooltip text="Announcements" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link
								to="/announcements"
								class="secondary-nav__link flex"
								:class="{active: isActiveRoute('/announcements')}">
								<Icon name="i-heroicons-megaphone" class="w-6 h-6" />
								<span class="hidden">Announcements</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Meetings - visible to all approved users -->
					<li>
						<Tooltip text="Meetings" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link to="/meetings" class="secondary-nav__link flex" :class="{active: isActiveRoute('/meetings')}">
								<Icon name="i-heroicons-calendar-days" class="w-6 h-6" />
								<span class="hidden">Meetings</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- By-Laws - visible to all approved users -->
					<li>
						<Tooltip text="By-Laws" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link
								to="/documents"
								class="secondary-nav__link flex"
								:class="{active: isActiveRoute('/documents')}">
								<Icon name="i-heroicons-document-text" class="w-6 h-6" />
								<span class="hidden">By-Laws</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Rules - visible to all approved users -->
					<li>
						<Tooltip text="Rules" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link
								to="/rules-regulations"
								class="secondary-nav__link flex"
								:class="{active: isActiveRoute('/rules-regulations')}">
								<Icon name="i-heroicons-clipboard-document-list" class="w-6 h-6" />
								<span class="hidden">Rules</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Parking - visible to all approved users -->
					<li>
						<Tooltip text="Parking" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link
								to="/parking-garage"
								class="secondary-nav__link flex"
								:class="{active: isActiveRoute('/parking-garage')}">
								<Icon name="i-lucide-car" class="w-6 h-6" />
								<span class="hidden">Parking</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Projects - visible to all approved users -->
					<li>
						<Tooltip text="Projects" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link to="/projects" class="secondary-nav__link flex" :class="{active: isActiveRoute('/projects')}">
								<Icon name="i-lucide-chart-no-axes-gantt" class="w-6 h-6" />
								<span class="hidden">Projects</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Account - visible to all approved users -->
					<li>
						<Tooltip text="Account" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link to="/account" class="secondary-nav__link flex" :class="{active: isActiveRoute('/account')}">
								<Icon name="i-heroicons-user-circle" class="w-6 h-6" />
								<span class="hidden">Account</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Channels - visible to board_members OR users with channel membership -->
					<li v-if="showChannels">
						<Tooltip text="Channels" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link to="/channels" class="secondary-nav__link flex" :class="{active: isActiveRoute('/channels')}">
								<Icon name="i-lucide-messages-square" class="w-6 h-6" />
								<span class="hidden">Channels</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<li v-if="showSecurity">
						<Tooltip text="Security" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link to="/security" class="secondary-nav__link flex" :class="{active: isActiveRoute('/security')}">
								<Icon name="i-lucide-cctv" class="w-6 h-6" />
								<span class="hidden">Security</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Requests - visible to board_members and owners -->
					<li v-if="showFinancials">
						<Tooltip text="Requests" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link
								to="/requests"
								class="secondary-nav__link flex"
								:class="{active: isActiveRoute('/requests')}">
								<Icon name="i-heroicons-inbox-arrow-down" class="w-6 h-6" />
								<span class="hidden">Requests</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Divider - only show if user has access to board member features -->
					<li v-if="showBoardMemberNav" class="secondary-nav__divider" aria-hidden="true">
						<span class="h-4 w-px bg-current opacity-20"></span>
					</li>

					<!-- Financials - visible to board_members and owners -->
					<li v-if="showFinancials">
						<Tooltip text="Financials" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link
								to="/financials"
								class="secondary-nav__link flex"
								:class="{active: isActiveRoute('/financials') && !isActiveRoute('/financials/import-center')}">
								<Icon name="i-heroicons-currency-dollar" class="w-6 h-6" />
								<span class="hidden">Financials</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Import Center - visible to board_members only -->
					<li v-if="isBoardMember">
						<Tooltip text="Import Center" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link
								to="/financials/import-center"
								class="secondary-nav__link flex"
								:class="{active: isActiveRoute('/financials/import-center')}">
								<Icon name="i-heroicons-arrow-up-tray" class="w-6 h-6" />
								<span class="hidden">Import</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Tasks - visible to board_members only -->
					<li v-if="isBoardMember">
						<Tooltip text="Tasks" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link to="/tasks" class="secondary-nav__link flex" :class="{active: isActiveRoute('/tasks')}">
								<Icon name="i-heroicons-clipboard-document-check" class="w-6 h-6" />
								<span class="hidden">Tasks</span>
							</nuxt-link>
						</Tooltip>
					</li>

					<!-- Admin - visible to board_members and admins -->
					<li v-if="isBoardMember">
						<Tooltip text="Users" :popper="{placement: 'bottom'}" class="uppercase">
							<nuxt-link
								to="/admin"
								class="secondary-nav__link flex admin-link"
								:class="{active: isActiveRoute('/admin')}">
								<Icon name="i-heroicons-shield-check" class="w-6 h-6" />
								<span class="hidden">Users</span>
							</nuxt-link>
						</Tooltip>
					</li>
				</ul>
			</div>
		</nav>
	</Transition>
</template>

<script setup lang="ts">
const route = useRoute();
const {user} = useDirectusAuth();
const {isScrollingDown} = useScrollDirection();
const {isBoardMember, isOwner, isApproved, hasOwnerAccess} = useRoles();
const {isSecondaryNavVisible} = useSecondaryNavToggle();

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
const showChannels = computed(() => {
	return isBoardMember.value || hasChannelMembership.value;
});

const showFinancials = computed(() => {
	// Board members and owners can see financials
	return isBoardMember.value || isOwner.value;
});

const showSecurity = computed(() => {
	// Board members and owners can see security
	return isBoardMember.value || isOwner.value;
});

const showBoardMemberNav = computed(() => {
	// Show divider and board member section if user has access to any board member features
	return isBoardMember.value || showFinancials.value;
});

// Check if current route matches
const isActiveRoute = (path: string): boolean => {
	return route.path === path || route.path.startsWith(path + '/');
};
</script>

<style scoped>
/* Slide down transition for toggle - smoother with GPU acceleration */
/* Use .secondary-nav prefix for specificity to override base transform */
.slide-down-enter-active.secondary-nav,
.slide-down-leave-active.secondary-nav {
	transition: opacity 0.25s ease-out, transform 0.25s ease-out;
	will-change: transform, opacity;
}

.slide-down-enter-from.secondary-nav,
.slide-down-leave-to.secondary-nav {
	opacity: 0;
	transform: translateY(-100%) translateZ(0);
}

.slide-down-enter-to.secondary-nav,
.slide-down-leave-from.secondary-nav {
	opacity: 1;
	transform: translateY(0) translateZ(0);
}

.secondary-nav {
	position: fixed;
	top: 56px; /* Below main header - matches page-content padding */
	left: 0;
	z-index: 15;
	border-bottom: 1px solid var(--theme-border-light, rgba(55, 55, 55, 0.1));
	transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
	transform: translateZ(0); /* Force GPU layer */
	backface-visibility: hidden;
	padding-top: env(safe-area-inset-top, 0px);
}

.secondary-nav.retracted {
	transform: translateY(calc(-100% - 56px - env(safe-area-inset-top, 0px))) translateZ(0);
}

@media (min-width: 1024px) {
	.secondary-nav.retracted {
		transform: translateY(0) translateZ(0);
	}
}

.secondary-nav__list {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.secondary-nav__list::-webkit-scrollbar {
	display: none;
}

.secondary-nav__link {
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	padding: 0.5rem 0.75rem;
	font-size: 0.75rem;
	font-weight: 500;
	letter-spacing: 0.025em;
	text-transform: uppercase;
	color: var(--theme-text-secondary, #666);
	border-radius: 0.375rem;
	transition: all 0.2s ease;
	white-space: nowrap;
}

.secondary-nav__link:hover {
	background-color: var(--theme-bg-hover, rgba(0, 0, 0, 0.05));
	color: var(--theme-text-primary, #333);
}

.secondary-nav__link.active {
	background-color: var(--theme-accent-bg, rgba(0, 191, 255, 0.1));
	color: var(--theme-accent, var(--cyan2, #00bfff));
}

.secondary-nav__link.admin-link {
	color: var(--theme-warning, #f59e0b);
}

.secondary-nav__link.admin-link:hover {
	color: var(--theme-warning-hover, #d97706);
}

.secondary-nav__link.admin-link.active {
	background-color: rgba(245, 158, 11, 0.1);
	color: var(--theme-warning, #f59e0b);
}

.secondary-nav__divider {
	display: flex;
	align-items: center;
	padding: 0 0.25rem;
}

/* Mobile and tablet adjustments - icon only mode */
@media (max-width: 1279px) {
	.secondary-nav__link {
		padding: 0.5rem;
	}
}

/* Desktop xlarge - show text labels */
@media (min-width: 1280px) {
	.secondary-nav__link {
		padding: 0.5rem 0.75rem;
	}
}
</style>
