<template>
	<div class="w-full flex flex-row flex-wrap items-start min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-600">
		<h1 class="text-3xl font-bold w-full text-center uppercase tracking-wide text-white lg:py-6 mt-4 md:mt-8">
			Access Control
		</h1>

		<!-- Mobile Tabs (hidden on lg and up) -->
		<div class="w-full md:px-6 lg:hidden mt-0">
			<UTabs
				:items="tabs"
				class="w-full"
				:ui="{
					list: {
						tab: {
							base: 'relative inline-flex items-center justify-center flex-shrink-0 w-full ui-focus-visible:outline-0 ui-focus-visible:ring-2 ui-focus-visible:ring-primary-500 dark:ui-focus-visible:ring-primary-400 ui-not-focus-visible:outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors duration-200 ease-out uppercase tracking-wide rounded-none',
							rounded: 'rounded-none',
						},
					},
				}">
				<template #item="{item}">
					<div v-if="item.key === 'directory'">
						<!-- Tenants Directory Content -->
						<div class="bg-zinc-950 shadow-2xl overflow-hidden mt-4">
							<div class="swiftlane-bg p-4">
								<h2 class="text-white text-sm md:text-xl font-bold tracking-wide mb-3">RESIDENT DIRECTORY</h2>

								<!-- Search Input -->
								<div class="relative">
									<input
										v-model="searchQuery"
										type="text"
										placeholder="Search by name or unit number..."
										class="w-full swiftlane-bg border border-white/20 px-4 py-3 pl-11 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all" />
									<UIcon
										name="i-heroicons-magnifying-glass"
										class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
									<button
										v-if="searchQuery"
										@click="searchQuery = ''"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors">
										<UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
									</button>
								</div>
							</div>

							<div class="max-h-[600px] overflow-y-auto">
								<!-- No Results Message -->
								<div v-if="Object.keys(filteredTenants).length === 0" class="px-4 py-8 text-center text-zinc-500">
									<UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-2 text-zinc-700" />
									<p>No residents found</p>
								</div>

								<div
									v-for="(group, unitNumber) in filteredTenants"
									:key="unitNumber"
									class="border-b border-zinc-800 hover:bg-zinc-900 transition-colors duration-200">
									<!-- Unit Header -->
									<div class="bg-zinc-900 px-4 py-3 flex items-center gap-3">
										<div
											class="swiftlane-bg text-white font-bold text-sm tracking-wide uppercase px-3 py-0.5 min-w-[60px] text-center">
											{{ unitNumber }}
										</div>
										<div class="h-px flex-1 bg-zinc-800"></div>
									</div>

									<!-- Tenant Names -->
									<div class="bg-zinc-950">
										<div
											v-for="tenant in group"
											:key="tenant.id"
											class="px-4 py-3 border-l-4 border-transparent hover:bg-zinc-900/50 hover:border-zinc-600 transition-all duration-200">
											<div class="flex items-center justify-between">
												<div>
													<p class="text-white font-semibold uppercase text-sm tracking-wide">
														{{ tenant.display_name }}
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div v-if="item.key === 'activity'">
						<!-- Activity Feed Content -->
						<div class="bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden mt-4">
							<div class="swiftlane-bg p-4">
								<div class="w-full flex flex-row items-center justify-between relative">
									<h2 class="text-white text-sm md:text-xl font-bold tracking-wide mb-3 uppercase">ACTIVITY FEED</h2>
									<h5
										v-if="!loadingMore"
										class="text-white/60 mb-3 flex flex-col text-right uppercase tracking-wide text-[8px] leading-3 absolute right-[5px]">
										{{ filteredEvents.length }} of {{ totalEvents }} events
										<span class="text-white/70 text-[8px] uppercase tracking-wide">Updated {{ lastUpdatedText }}</span>
									</h5>
								</div>

								<!-- Activity Search Input -->
								<div class="relative">
									<input
										v-model="activitySearchQuery"
										type="text"
										placeholder="Search by name, access point, or status..."
										class="w-full swiftlane-bg border border-white/20 px-4 py-2 md:py-3 pl-11 pr-12 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all" />
									<UIcon
										name="i-heroicons-magnifying-glass"
										class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />

									<!-- Auto-refresh indicator / Manual refresh button -->
									<button
										v-if="!activitySearchQuery"
										@click="manualRefresh"
										:disabled="pending || loadingMore"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors disabled:opacity-50">
										<UIcon
											name="i-heroicons-arrow-path"
											class="w-5 h-5"
											:class="isAutoRefreshing || pending ? 'animate-spin' : ''" />
									</button>

									<button
										v-else
										@click="activitySearchQuery = ''"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors">
										<UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
									</button>
								</div>
							</div>

							<div ref="activityScrollMobile" @scroll="handleScrollMobile" class="max-h-[600px] overflow-y-auto">
								<div v-if="pending && events.length === 0" class="px-4 py-8 text-center text-zinc-500">
									<UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto animate-spin text-blue-500" />
									<p class="mt-4">Loading activity...</p>
								</div>

								<div v-else-if="error && events.length === 0" class="px-4 py-8 text-center text-red-500">
									<UIcon name="i-heroicons-exclamation-circle" class="w-12 h-12 mx-auto mb-2" />
									<p>Error loading activity</p>
								</div>

								<!-- No Results Message -->
								<div v-else-if="filteredEvents.length === 0" class="px-4 py-8 text-center text-zinc-500">
									<UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-2 text-zinc-700" />
									<p>No activity found</p>
								</div>

								<div v-else>
									<div
										v-for="event in filteredEvents"
										:key="event.id"
										class="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors duration-200">
										<div class="p-4 flex gap-4">
											<!-- Photo -->
											<div class="flex-shrink-0">
												<img
													v-if="event.photo_path"
													:src="event.photo_path"
													@click="openPhotoModal(event)"
													class="w-32 h-32 object-cover border border-zinc-700 cursor-pointer hover:opacity-80 transition-opacity"
													alt="Access photo" />
												<div
													v-else
													class="w-32 h-32 bg-zinc-800 flex items-center justify-center border border-zinc-700">
													<UIcon name="i-heroicons-user-circle" class="w-8 h-8 text-zinc-600" />
												</div>
											</div>

											<!-- Event Details -->
											<div class="flex-1 min-w-0">
												<!-- Timestamp -->
												<div class="text-zinc-200 text-xs mb-2">
													{{ formatDate(event.created_at) }}
													<div class="text-zinc-500 text-xs mt-0.5">
														{{ new Date(event.created_at).toLocaleString() }}
													</div>
												</div>

												<!-- Name/Subject -->
												<h3 class="text-white font-semibold mb-3 text-xs leading-4">
													<span v-if="event.employee_name">{{ event.employee_name }}</span>
													<span v-else-if="event.subject">{{ event.subject }}</span>
												</h3>

												<!-- Access Details -->
												<div class="flex flex-wrap gap-2 mb-2">
													<span class="swiftlane-bg text-white text-xs px-2 py-1 uppercase tracking-wide font-semibold">
														{{ event.access_point_name }}
													</span>
													<span
														:class="
															event.access_status === 'Granted'
																? 'bg-green-600'
																: event.access_status === 'completed'
																	? 'swiftlane-bg'
																	: 'bg-zinc-700'
														"
														class="text-white text-xs px-2 py-1 uppercase tracking-wide font-semibold">
														{{ event.access_status }}
													</span>
													<span
														class="text-white text-xs px-2 py-1 uppercase tracking-wide font-semibold"
														:class="event.access_type?.toLowerCase().includes('face') ? 'swiftlane-bg' : 'bg-zinc-700'">
														{{ formatAccessType(event.access_type) }}
													</span>
												</div>

												<!-- Pass Name (if exists) -->
												<p v-if="event.pass_name" class="text-zinc-500 text-xs font-semibold uppercase tracking-wide">
													Pass:
													<span class="text-zinc-200">{{ event.pass_name }}</span>
												</p>
											</div>
										</div>
									</div>

									<!-- Loading More Indicator -->
									<div v-if="loadingMore" class="px-4 py-6 text-center text-zinc-500">
										<UIcon name="i-heroicons-arrow-path" class="w-6 h-6 mx-auto animate-spin text-blue-500" />
										<p class="mt-2 text-sm">Loading more...</p>
									</div>

									<!-- End of Results -->
									<div
										v-if="!hasMore && events.length > 0 && !activitySearchQuery"
										class="px-4 py-6 text-center text-zinc-600">
										<p class="text-sm">End of activity feed</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</template>
			</UTabs>
		</div>

		<!-- Desktop Side-by-Side (hidden on mobile, visible on lg and up) -->
		<!-- Tenants Directory - Digital Intercom Style -->
		<div class="hidden lg:block w-1/2 p-6">
			<div class="bg-zinc-950 shadow-2xl overflow-hidden">
				<div class="swiftlane-bg p-4">
					<h2 class="text-white text-xl font-bold tracking-wide mb-3">RESIDENT DIRECTORY</h2>

					<!-- Search Input -->
					<div class="relative">
						<input
							v-model="searchQuery"
							type="text"
							placeholder="Search by name or unit number..."
							class="w-full swiftlane-bg border border-white/20 px-4 py-2 md:py-3 pl-11 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all" />
						<UIcon
							name="i-heroicons-magnifying-glass"
							class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
						<button
							v-if="searchQuery"
							@click="searchQuery = ''"
							class="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors">
							<UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
						</button>
					</div>
				</div>

				<div class="max-h-[800px] overflow-y-auto">
					<!-- No Results Message -->
					<div v-if="Object.keys(filteredTenants).length === 0" class="px-4 py-8 text-center text-zinc-500">
						<UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-2 text-zinc-700" />
						<p>No residents found</p>
					</div>

					<div
						v-for="(group, unitNumber) in filteredTenants"
						:key="unitNumber"
						class="border-b border-zinc-800 hover:bg-zinc-900 transition-colors duration-200">
						<!-- Unit Header -->
						<div class="bg-zinc-900 px-4 py-3 flex items-center gap-3">
							<div
								class="swiftlane-bg text-white font-bold text-sm tracking-wide uppercase px-3 py-0.5 min-w-[60px] text-center">
								{{ unitNumber }}
							</div>
							<div class="h-px flex-1 bg-zinc-800"></div>
						</div>

						<!-- Tenant Names -->
						<div class="bg-zinc-950">
							<div
								v-for="tenant in group"
								:key="tenant.id"
								class="px-4 py-3 border-l-4 border-transparent hover:bg-zinc-900/50 hover:border-zinc-600 transition-all duration-200">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-white font-semibold uppercase text-sm tracking-wide">{{ tenant.display_name }}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Activity Feed - Digital Intercom Style -->
		<div class="hidden lg:block w-1/2 p-6">
			<div class="bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
				<div class="swiftlane-bg p-4">
					<div class="w-full flex flex-row items-center justify-between">
						<h2 class="text-white text-xl font-bold tracking-wide mb-3">ACTIVITY FEED</h2>
						<h5
							v-if="!loadingMore"
							class="text-white/60 text-sm mb-3 flex flex-col uppercase tracking-wide leading-4 text-right">
							{{ filteredEvents.length }} of {{ totalEvents }} events
							<span class="text-white/40 text-[9px] mt-0.5">Updated {{ lastUpdatedText }}</span>
						</h5>
					</div>

					<!-- Activity Search Input -->
					<div class="relative">
						<input
							v-model="activitySearchQuery"
							type="text"
							placeholder="Search by name, access point, or status..."
							class="w-full swiftlane-bg border border-white/20 px-4 py-3 pl-11 pr-12 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all" />
						<UIcon
							name="i-heroicons-magnifying-glass"
							class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />

						<!-- Auto-refresh indicator / Manual refresh button -->
						<button
							v-if="!activitySearchQuery"
							@click="manualRefresh"
							:disabled="pending || loadingMore"
							class="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors disabled:opacity-50">
							<UIcon
								name="i-heroicons-arrow-path"
								class="w-5 h-5"
								:class="isAutoRefreshing || pending ? 'animate-spin' : ''" />
						</button>

						<button
							v-else
							@click="activitySearchQuery = ''"
							class="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors">
							<UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
						</button>
					</div>
				</div>

				<div ref="activityScroll" @scroll="handleScroll" class="max-h-[800px] overflow-y-auto">
					<div v-if="pending && events.length === 0" class="px-4 py-8 text-center text-zinc-500">
						<UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto animate-spin text-blue-500" />
						<p class="mt-4">Loading activity...</p>
					</div>

					<div v-else-if="error && events.length === 0" class="px-4 py-8 text-center text-red-500">
						<UIcon name="i-heroicons-exclamation-circle" class="w-12 h-12 mx-auto mb-2" />
						<p>Error loading activity</p>
					</div>

					<!-- No Results Message -->
					<div v-else-if="filteredEvents.length === 0" class="px-4 py-8 text-center text-zinc-500">
						<UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-2 text-zinc-700" />
						<p>No activity found</p>
					</div>

					<div v-else>
						<div
							v-for="event in filteredEvents"
							:key="event.id"
							class="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors duration-200">
							<div class="p-4 flex gap-4">
								<!-- Photo -->
								<div class="flex-shrink-0">
									<img
										v-if="event.photo_path"
										:src="event.photo_path"
										@click="openPhotoModal(event)"
										class="w-32 h-32 object-cover border border-zinc-700 cursor-pointer hover:opacity-80 transition-opacity"
										alt="Access photo" />
									<div v-else class="w-32 h-32 bg-zinc-800 flex items-center justify-center border border-zinc-700">
										<UIcon name="i-heroicons-user-circle" class="w-8 h-8 text-zinc-600" />
									</div>
								</div>

								<!-- Event Details -->
								<div class="flex-1 min-w-0">
									<!-- Timestamp -->
									<div class="text-zinc-200 text-xs mb-2">
										{{ formatDate(event.created_at) }}
										<div class="text-zinc-500 text-xs mt-0.5">{{ new Date(event.created_at).toLocaleString() }}</div>
									</div>

									<!-- Name/Subject -->
									<h3 class="text-white font-semibold mb-3 text-xs leading-4">
										<span v-if="event.employee_name">{{ event.employee_name }}</span>
										<span v-else-if="event.subject">{{ event.subject }}</span>
									</h3>

									<!-- Access Details -->
									<div class="flex flex-wrap gap-2 mb-2">
										<span class="swiftlane-bg text-white text-xs px-2 py-1 uppercase tracking-wide font-semibold">
											{{ event.access_point_name }}
										</span>
										<span
											:class="
												event.access_status === 'Granted'
													? 'bg-green-600'
													: event.access_status === 'completed'
														? 'swiftlane-bg'
														: 'bg-zinc-700'
											"
											class="text-white text-xs px-2 py-1 uppercase tracking-wide font-semibold">
											{{ event.access_status }}
										</span>
										<span
											class="text-white text-xs px-2 py-1 uppercase tracking-wide font-semibold"
											:class="event.access_type?.toLowerCase().includes('face') ? 'swiftlane-bg' : 'bg-zinc-700'">
											{{ formatAccessType(event.access_type) }}
										</span>
									</div>

									<!-- Pass Name (if exists) -->
									<p v-if="event.pass_name" class="text-zinc-500 text-xs font-semibold uppercase tracking-wide">
										Pass:
										<span class="text-zinc-200">{{ event.pass_name }}</span>
									</p>
								</div>
							</div>
						</div>

						<!-- Loading More Indicator -->
						<div v-if="loadingMore" class="px-4 py-6 text-center text-zinc-500">
							<UIcon name="i-heroicons-arrow-path" class="w-6 h-6 mx-auto animate-spin text-blue-500" />
							<p class="mt-2 text-sm">Loading more...</p>
						</div>

						<!-- End of Results -->
						<div
							v-if="!hasMore && events.length > 0 && !activitySearchQuery"
							class="px-4 py-6 text-center text-zinc-600">
							<p class="text-sm">End of activity feed</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Photo Modal -->
		<UModal v-model="isPhotoModalOpen" :ui="{background: 'bg-zinc-900/95'}">
			<div class="p-6 bg-zinc-950">
				<!-- Modal Header -->
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="text-white font-semibold text-sm leading-4 mb-1">
							<span v-if="selectedEvent?.employee_name">{{ selectedEvent.employee_name }}</span>
							<span v-else-if="selectedEvent?.subject">{{ selectedEvent.subject }}</span>
						</h3>
						<p class="text-zinc-400 text-sm">
							{{ selectedEvent?.created_at ? new Date(selectedEvent.created_at).toLocaleString() : '' }}
						</p>
					</div>
					<button @click="isPhotoModalOpen = false" class="text-zinc-400 hover:text-white transition-colors">
						<UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
					</button>
				</div>

				<!-- Photo -->
				<div class="flex items-center justify-center bg-zinc-900 overflow-hidden">
					<img
						v-if="selectedEvent?.photo_path"
						:src="selectedEvent.photo_path"
						class="max-w-full max-h-[70vh] object-contain"
						alt="Event photo" />
				</div>

				<!-- Event Details -->
				<div class="mt-4 flex flex-wrap gap-2">
					<span class="swiftlane-bg text-white text-xs px-3 py-1.5 uppercase tracking-wide font-semibold">
						{{ selectedEvent?.access_point_name }}
					</span>
					<span
						:class="
							selectedEvent?.access_status === 'Granted'
								? 'bg-green-600'
								: selectedEvent?.access_status === 'completed'
									? 'swiftlane-bg'
									: 'bg-zinc-700'
						"
						class="text-white text-xs px-3 py-1.5 uppercase tracking-wide font-semibold">
						{{ selectedEvent?.access_status }}
					</span>
					<span
						class="text-white text-xs px-3 py-1.5 uppercase tracking-wide font-semibold"
						:class="selectedEvent?.access_type?.toLowerCase().includes('face') ? 'swiftlane-bg' : 'bg-zinc-700'">
						{{ formatAccessType(selectedEvent?.access_type || '') }}
					</span>
				</div>

				<!-- Pass Name if exists -->
				<p v-if="selectedEvent?.pass_name" class="mt-3 text-zinc-400 text-sm uppercase tracking-wide">
					Pass:
					<span class="text-white">{{ selectedEvent.pass_name }}</span>
				</p>
			</div>
		</UModal>
	</div>
</template>

<script setup>
const {data: tenants} = await useFetch('/api/swiftlane/tenants');

// Activity Feed State
const events = ref([]);
const pending = ref(true);
const error = ref(null);
const loadingMore = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const totalEvents = ref(0);
const activityScroll = ref(null);
const activityScrollMobile = ref(null); // Add mobile ref

// Search
const searchQuery = ref('');
const activitySearchQuery = ref('');

// Photo Modal State
const isPhotoModalOpen = ref(false);
const selectedEvent = ref(null);

// Auto-refresh State
const refreshInterval = ref(null);
const isAutoRefreshing = ref(false);
const wasScrolledDown = ref(false);
const lastUpdated = ref(new Date());
const now = ref(new Date());
const REFRESH_INTERVAL_MS = 1 * 60 * 1000;

// Tabs for mobile
const tabs = [
	{
		key: 'directory',
		label: 'Directory',
		icon: 'i-heroicons-users',
	},
	{
		key: 'activity',
		label: 'Activity',
		icon: 'i-heroicons-clock',
	},
];

// Open photo modal
const openPhotoModal = (event) => {
	selectedEvent.value = event;
	isPhotoModalOpen.value = true;
};

// Fetch events with proper pagination
// Fetch events with proper pagination
const fetchEvents = async (page = 1, append = false, silent = false) => {
	try {
		if (page === 1 && !silent) {
			pending.value = true;
		} else if (!silent) {
			loadingMore.value = true;
		}

		if (silent) {
			isAutoRefreshing.value = true;
		}

		const response = await $fetch('/api/swiftlane/events', {
			params: {
				page: page,
				per_page: 50,
			},
		});

		if (append) {
			events.value = [...events.value, ...response.data.data.events_feed];
		} else {
			events.value = response.data.data.events_feed;
			lastUpdated.value = new Date(); // ADD THIS LINE - only update on fresh data, not append
		}

		hasMore.value = response.data.metadata.has_next;
		totalEvents.value = response.data.metadata.total_count;
		currentPage.value = page;
	} catch (e) {
		error.value = e;
		console.error('Error fetching events:', e);
	} finally {
		pending.value = false;
		loadingMore.value = false;
		isAutoRefreshing.value = false;
	}
};

// Auto-refresh function - only refreshes first page
const autoRefresh = () => {
	// Don't refresh if user is:
	// - Searching
	// - Viewing a photo modal
	// - Has scrolled past first page
	if (activitySearchQuery.value || isPhotoModalOpen.value || currentPage.value > 1) {
		return;
	}

	// Silent refresh (doesn't show loading spinner)
	fetchEvents(1, false, true);
};

// Format last updated time
const lastUpdatedText = computed(() => {
	const currentTime = now.value; // Use reactive now
	const diffMs = currentTime - lastUpdated.value;
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffMs / 60000);

	if (diffSecs < 10) return 'Just now';
	if (diffSecs < 60) return `${diffSecs}s ago`;
	if (diffMins < 60) return `${diffMins}m ago`;

	return lastUpdated.value.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
	});
});

// Start auto-refresh interval
const startAutoRefresh = () => {
	if (refreshInterval.value) {
		clearInterval(refreshInterval.value);
	}
	refreshInterval.value = setInterval(autoRefresh, REFRESH_INTERVAL_MS);
};

// Stop auto-refresh interval
const stopAutoRefresh = () => {
	if (refreshInterval.value) {
		clearInterval(refreshInterval.value);
		refreshInterval.value = null;
	}
};

// Manual refresh button handler
// Manual refresh button handler - REPLACE THIS FUNCTION
const manualRefresh = async () => {
	// Reset to page 1 and clear any pagination state
	currentPage.value = 1;
	wasScrolledDown.value = false;

	// Fetch fresh data (not silent, so shows loading state)
	await fetchEvents(1, false, false);

	// Scroll to top of activity feed
	if (activityScroll.value) {
		activityScroll.value.scrollTop = 0;
	}
	if (activityScrollMobile.value) {
		activityScrollMobile.value.scrollTop = 0;
	}
};

// Load initial data
onMounted(() => {
	fetchEvents(1);
	startAutoRefresh();
	setInterval(() => {
		now.value = new Date();
	}, 1000);
});

// Cleanup on unmount
onBeforeUnmount(() => {
	stopAutoRefresh();
});

// Pause auto-refresh when modal is open, resume when closed
watch(isPhotoModalOpen, (isOpen) => {
	if (isOpen) {
		stopAutoRefresh();
	} else {
		startAutoRefresh();
	}
});

// Infinite scroll handler - Desktop
const handleScroll = (e) => {
	const element = e.target;
	const bottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
	const isNearTop = element.scrollTop < 50;

	// Track scroll position
	if (!isNearTop && currentPage.value > 1) {
		wasScrolledDown.value = true;
	}

	// If scrolled back to top after being down, refresh
	if (isNearTop && wasScrolledDown.value && !activitySearchQuery.value) {
		wasScrolledDown.value = false;
		fetchEvents(1, false, true);
	}

	// Load more at bottom
	if (bottom && hasMore.value && !loadingMore.value && !activitySearchQuery.value) {
		fetchEvents(currentPage.value + 1, true);
	}
};

// Infinite scroll handler - Mobile
const handleScrollMobile = (e) => {
	const element = e.target;
	const bottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
	const isNearTop = element.scrollTop < 50;

	// Track scroll position
	if (!isNearTop && currentPage.value > 1) {
		wasScrolledDown.value = true;
	}

	// If scrolled back to top after being down, refresh
	if (isNearTop && wasScrolledDown.value && !activitySearchQuery.value) {
		wasScrolledDown.value = false;
		fetchEvents(1, false, true);
	}

	// Load more at bottom
	if (bottom && hasMore.value && !loadingMore.value && !activitySearchQuery.value) {
		fetchEvents(currentPage.value + 1, true);
	}
};

// Filter events based on search
const filteredEvents = computed(() => {
	if (!activitySearchQuery.value.trim()) {
		return events.value;
	}

	const query = activitySearchQuery.value.toLowerCase().trim();

	return events.value.filter((event) => {
		const employeeName = event.employee_name?.toLowerCase() || '';
		const subject = event.subject?.toLowerCase() || '';
		const accessPoint = event.access_point_name?.toLowerCase() || '';
		const accessStatus = event.access_status?.toLowerCase() || '';
		const accessType = event.access_type?.toLowerCase() || '';
		const passName = event.pass_name?.toLowerCase() || '';

		return (
			employeeName.includes(query) ||
			subject.includes(query) ||
			accessPoint.includes(query) ||
			accessStatus.includes(query) ||
			accessType.includes(query) ||
			passName.includes(query)
		);
	});
});

// Date formatting
const formatDate = (dateString) => {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now - date;
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
	if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
	if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
		hour: 'numeric',
		minute: '2-digit',
	});
};

// Format access type
const formatAccessType = (type) => {
	return type
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
};

// Tenant grouping
const groupedTenants = computed(() => {
	const data = tenants.value?.data?.data?.tenants || [];

	const grouped = data.reduce((acc, tenant) => {
		const match = tenant.display_name.match(/^(\d+):/);
		if (match) {
			const unitNumber = match[1];
			if (!acc[unitNumber]) {
				acc[unitNumber] = [];
			}
			acc[unitNumber].push(tenant);
		}
		return acc;
	}, {});

	return Object.keys(grouped)
		.sort((a, b) => parseInt(a) - parseInt(b))
		.reduce((acc, key) => {
			acc[key] = grouped[key];
			return acc;
		}, {});
});

const filteredTenants = computed(() => {
	if (!searchQuery.value.trim()) {
		return groupedTenants.value;
	}

	const query = searchQuery.value.toLowerCase().trim();
	const filtered = {};

	Object.entries(groupedTenants.value).forEach(([unitNumber, tenants]) => {
		if (unitNumber.includes(query)) {
			filtered[unitNumber] = tenants;
		} else {
			const matchingTenants = tenants.filter((tenant) => {
				const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
				const displayName = tenant.display_name.toLowerCase();
				return fullName.includes(query) || displayName.includes(query);
			});

			if (matchingTenants.length > 0) {
				filtered[unitNumber] = matchingTenants;
			}
		}
	});

	return filtered;
});
</script>

<style>
.swiftlane {
	color: #330df2;
}
.swiftlane-bg {
	background: #330df2;
}
.swiftlane-border {
	border-color: #330df2;
}
</style>
