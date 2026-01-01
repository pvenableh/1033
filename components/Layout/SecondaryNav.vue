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
					<UTooltip text="Dashboard" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link to="/dashboard" class="secondary-nav__link flex" :class="{active: isActiveRoute('/dashboard')}">
							<UIcon name="i-lucide-layout-dashboard" class="w-5 h-5" />
							<span class="hidden xl:inline">Dashboard</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/dashboard"
						class="secondary-nav__link hidden xl:flex"
						:class="{active: isActiveRoute('/dashboard')}">
						<UIcon name="i-lucide-layout-dashboard" class="w-4 h-4" />
						<span>Dashboard</span>
					</nuxt-link>
				</li>

				<!-- Announcements - visible to all approved users -->
				<li>
					<UTooltip text="Announcements" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link
							to="/announcements"
							class="secondary-nav__link flex"
							:class="{active: isActiveRoute('/announcements')}">
							<UIcon name="i-heroicons-megaphone" class="w-5 h-5" />
							<span class="hidden xl:inline">Announcements</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/announcements"
						class="secondary-nav__link hidden xl:flex"
						:class="{active: isActiveRoute('/announcements')}">
						<UIcon name="i-heroicons-megaphone" class="w-4 h-4" />
						<span>Announcements</span>
					</nuxt-link>
				</li>

				<!-- Meetings - visible to all approved users -->
				<li>
					<UTooltip text="Meetings" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link to="/meetings" class="secondary-nav__link flex" :class="{active: isActiveRoute('/meetings')}">
							<UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
							<span class="hidden xl:inline">Meetings</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/meetings"
						class="secondary-nav__link hidden xl:flex"
						:class="{active: isActiveRoute('/meetings')}">
						<UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
						<span>Meetings</span>
					</nuxt-link>
				</li>

				<!-- By-Laws - visible to all approved users -->
				<li>
					<UTooltip text="By-Laws" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link to="/documents" class="secondary-nav__link flex" :class="{active: isActiveRoute('/documents')}">
							<UIcon name="i-heroicons-document-text" class="w-5 h-5" />
							<span class="hidden xl:inline">By-Laws</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/documents"
						class="secondary-nav__link hidden xl:flex"
						:class="{active: isActiveRoute('/documents')}">
						<UIcon name="i-heroicons-document-text" class="w-4 h-4" />
						<span>By-Laws</span>
					</nuxt-link>
				</li>

				<!-- Rules - visible to all approved users -->
				<li>
					<UTooltip text="Rules" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link
							to="/rules-regulations"
							class="secondary-nav__link flex"
							:class="{active: isActiveRoute('/rules-regulations')}">
							<UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5" />
							<span class="hidden xl:inline">Rules</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/rules-regulations"
						class="secondary-nav__link hidden xl:flex"
						:class="{active: isActiveRoute('/rules-regulations')}">
						<UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4" />
						<span>Rules</span>
					</nuxt-link>
				</li>

				<!-- Parking - visible to all approved users -->
				<li>
					<UTooltip text="Parking" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link
							to="/parking-garage"
							class="secondary-nav__link flex"
							:class="{active: isActiveRoute('/parking-garage')}">
							<UIcon name="i-lucide-car" class="w-5 h-5" />
							<span class="hidden xl:inline">Parking</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/parking-garage"
						class="secondary-nav__link hidden xl:flex"
						:class="{active: isActiveRoute('/parking-garage')}">
						<UIcon name="i-lucide-car" class="w-4 h-4" />
						<span>Parking</span>
					</nuxt-link>
				</li>

				<!-- Channels - visible to board_members OR users with channel membership -->
				<li v-if="showChannels">
					<UTooltip text="Channels" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link to="/channels" class="secondary-nav__link flex" :class="{active: isActiveRoute('/channels')}">
							<UIcon name="i-lucide-messages-square" class="w-5 h-5" />
							<span class="hidden xl:inline">Channels</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/channels"
						class="secondary-nav__link hidden xl:flex"
						:class="{active: isActiveRoute('/channels')}">
						<UIcon name="i-heroicons-chat-bubble-left-right" class="w-4 h-4" />
						<span>Channels</span>
					</nuxt-link>
				</li>

				<li v-if="showSecurity">
					<UTooltip text="Security" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link to="/security" class="secondary-nav__link flex" :class="{active: isActiveRoute('/security')}">
							<UIcon name="i-lucide-cctv" class="w-5 h-5" />
							<span class="hidden xl:inline">Security</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/security"
						class="secondary-nav__link hidden xl:flex"
						:class="{active: isActiveRoute('/security')}">
						<UIcon name="i-lucide-cctv" class="w-4 h-4" />
						<span>Security</span>
					</nuxt-link>
				</li>

				<!-- Divider - only show if user has access to board member features -->
				<li v-if="showBoardMemberNav" class="secondary-nav__divider" aria-hidden="true">
					<span class="h-4 w-px bg-current opacity-20"></span>
				</li>

				<!-- Financials - visible to board_members and owners -->
				<li v-if="showFinancials">
					<UTooltip text="Financials" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link
							to="/financials"
							class="secondary-nav__link flex"
							:class="{active: isActiveRoute('/financials')}">
							<UIcon name="i-heroicons-currency-dollar" class="w-5 h-5" />
							<span class="hidden xl:inline">Financials</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/financials"
						class="secondary-nav__link hidden xl:flex"
						:class="{active: isActiveRoute('/financials')}">
						<UIcon name="i-heroicons-currency-dollar" class="w-4 h-4" />
						<span>Financials</span>
					</nuxt-link>
				</li>

				<!-- Tasks - visible to board_members only -->
				<li v-if="isBoardMember">
					<UTooltip text="Tasks" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link to="/tasks" class="secondary-nav__link flex" :class="{active: isActiveRoute('/tasks')}">
							<UIcon name="i-heroicons-clipboard-document-check" class="w-5 h-5" />
							<span class="hidden xl:inline">Tasks</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link to="/tasks" class="secondary-nav__link hidden xl:flex" :class="{active: isActiveRoute('/tasks')}">
						<UIcon name="i-heroicons-clipboard-document-check" class="w-4 h-4" />
						<span>Tasks</span>
					</nuxt-link>
				</li>

				<!-- Admin - visible to board_members and admins -->
				<li v-if="isBoardMember">
					<UTooltip text="Admin" :popper="{placement: 'bottom'}" class="xl:hidden">
						<nuxt-link
							to="/admin"
							class="secondary-nav__link flex admin-link"
							:class="{active: isActiveRoute('/admin')}">
							<UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
							<span class="hidden xl:inline">Admin</span>
						</nuxt-link>
					</UTooltip>
					<nuxt-link
						to="/admin"
						class="secondary-nav__link admin-link hidden xl:flex"
						:class="{active: isActiveRoute('/admin')}">
						<UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
						<span>Admin</span>
					</nuxt-link>
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
/* Slide down transition for toggle */
.slide-down-enter-active,
.slide-down-leave-active {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
	opacity: 0;
	transform: translateY(-100%);
}

.secondary-nav {
	position: fixed;
	top: 52px; /* Below main header */
	left: 0;
	z-index: 15;
	border-bottom: 1px solid var(--theme-border-light, rgba(55, 55, 55, 0.1));
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform;
	padding-top: env(safe-area-inset-top, 0px);
}

.secondary-nav.retracted {
	transform: translateY(calc(-100% - 52px - env(safe-area-inset-top, 0px)));
}

@media (min-width: 1024px) {
	.secondary-nav.retracted {
		transform: translateY(0px);
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
