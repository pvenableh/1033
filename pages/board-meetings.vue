<script setup lang="ts">
import type { PublicMeeting } from '~/server/api/public/board-meetings.get';

/**
 * Standalone public board meeting schedule.
 *
 * Intentionally separate from /meetings (resident-only): no auth middleware,
 * reads a whitelisted public feed, and shows a single year at a time.
 */
const YEAR = 2026;

definePageMeta({ layout: 'default' });

interface MeetingsResponse {
	year: number;
	locked: boolean;
	hint: string | null;
	meetings: PublicMeeting[];
}

const { data, pending, error, refresh } = await useAsyncData<MeetingsResponse>(
	`board-meetings-${YEAR}`,
	() =>
		$fetch<MeetingsResponse>('/api/public/board-meetings', {
			params: { year: YEAR },
		})
);

// Newest first from the endpoint.
const meetings = computed(() => data.value?.meetings ?? []);

// The soonest upcoming meeting — the list is descending, so scan from the end.
const nextMeeting = computed(
	() => [...meetings.value].reverse().find((m) => !m.isPast && !m.canceled) ?? null
);

const heldCount = computed(() => meetings.value.filter((m) => m.isPast && !m.canceled).length);
const scheduledCount = computed(() => meetings.value.filter((m) => !m.isPast && !m.canceled).length);

/**
 * "3 meetings" once the year is done; "2 held · 1 scheduled" while meetings are
 * still upcoming, since that distinction is the useful one mid-year.
 */
const meetingSummary = computed(() => {
	const held = heldCount.value;
	const scheduled = scheduledCount.value;
	if (!scheduled) return `${held} ${held === 1 ? 'meeting' : 'meetings'}`;
	if (!held) return `${scheduled} scheduled`;
	return `${held} held · ${scheduled} scheduled`;
});

/* ---------------------------------------------------------------------- lock */

const locked = computed(() => data.value?.locked === true);
const hint = computed(() => data.value?.hint ?? null);

const unlockOpen = ref(false);

/**
 * Passed to the unlock panel. Resolves to an error message, or null on success.
 * Lives here so the page can refresh() — the records were never sent to this
 * browser, so they only arrive on a re-fetch.
 */
async function attemptUnlock(phrase: string): Promise<string | null> {
	try {
		await $fetch('/api/public/board-meetings/unlock', {
			method: 'POST',
			body: { passphrase: phrase },
		});
		await refresh();
		return null;
	} catch (err: any) {
		return err?.data?.message || 'Something went wrong. Please try again.';
	}
}

/** What's waiting behind the lock, summarised across all meetings. */
const lockedSummary = computed(() => {
	const totals = { agenda: 0, minutes: 0, presentations: 0, announcements: 0, recording: 0 };
	for (const m of meetings.value) {
		const c = m.lockedCounts;
		if (!c) continue;
		if (c.agenda) totals.agenda += 1;
		if (c.minutes) totals.minutes += 1;
		if (c.recording) totals.recording += 1;
		totals.presentations += c.presentations;
		totals.announcements += c.announcements;
	}
	return [
		{ label: totals.agenda === 1 ? 'agenda' : 'agendas', count: totals.agenda },
		{ label: 'minutes', count: totals.minutes },
		{ label: totals.presentations === 1 ? 'presentation' : 'presentations', count: totals.presentations },
		{ label: totals.recording === 1 ? 'recording' : 'recordings', count: totals.recording },
		{ label: totals.announcements === 1 ? 'announcement' : 'announcements', count: totals.announcements },
	].filter((t) => t.count > 0);
});

/** "5 agendas, 4 minutes and 2 recordings" — for the unlock panel copy. */
const lockedSummaryText = computed(() => {
	const parts = lockedSummary.value.map((t) => `${t.count} ${t.label}`);
	if (parts.length <= 1) return parts[0] ?? '';
	return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
});

/* ---------------------------------------------------------------- formatting */

// Dates come back as plain YYYY-MM-DD; parse the parts so they aren't shifted
// into the previous day by UTC.
function parseDate(date: string) {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(y, m - 1, d);
}

const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
	parseDate(date).toLocaleDateString('en-US', options);

const monthOf = (date: string) => fmt(date, { month: 'short' });
const dayOf = (date: string) => fmt(date, { day: 'numeric' });
const weekdayOf = (date: string) => fmt(date, { weekday: 'long' });
const longDateOf = (date: string) => fmt(date, { month: 'long', day: 'numeric', year: 'numeric' });

function formatTime(time: string | null) {
	if (!time) return null;
	const [hour, minute] = time.split(':').map(Number);
	const d = new Date();
	d.setHours(hour, minute || 0, 0, 0);
	return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatSize(bytes: number | null) {
	if (!bytes) return '';
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Short "PDF · 68 KB" style caption for a downloadable record. */
function fileMeta(file: { type: string | null; size: number | null } | null | undefined) {
	if (!file) return '';
	const kind = file.type?.includes('pdf')
		? 'PDF'
		: file.type?.includes('word') || file.type?.includes('document')
			? 'DOC'
			: file.type?.includes('sheet') || file.type?.includes('excel')
				? 'XLS'
				: '';
	return [kind, formatSize(file.size)].filter(Boolean).join(' · ');
}

/* -------------------------------------------------------------------- search */

const search = ref('');

/**
 * One lowercased haystack per meeting: title, description, tags, and the date in
 * every form someone might type — "2026-06-17", "june", "jun 17", "wednesday".
 */
function haystack(meeting: PublicMeeting) {
	return [
		meeting.title,
		meeting.description,
		meeting.location,
		meeting.cancellationNote,
		...meeting.tags,
		...meeting.presentations.map((p) => p.title),
		...meeting.announcements.map((a) => a.title),
		meeting.date,
		weekdayOf(meeting.date),
		longDateOf(meeting.date),
		fmt(meeting.date, { month: 'short', day: 'numeric', year: 'numeric' }),
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();
}

/** Every whitespace-separated term must match, so terms narrow rather than widen. */
const visibleMeetings = computed(() => {
	const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
	if (!terms.length) return meetings.value;
	return meetings.value.filter((m) => {
		const hay = haystack(m);
		return terms.every((term) => hay.includes(term));
	});
});

/* ------------------------------------------------------------ card expansion */

/**
 * Phones collapse everything below the meta row. Desktop ignores this entirely
 * (see .card-details) so nothing is hidden on a screen with room for it.
 */
const expanded = ref<Set<number>>(new Set());

const isExpanded = (id: number) => expanded.value.has(id);

function toggleExpanded(id: number) {
	// Reassign so the Set change is reactive.
	const next = new Set(expanded.value);
	next.has(id) ? next.delete(id) : next.add(id);
	expanded.value = next;
}

/**
 * Label for the collapsed disclosure — names what's inside rather than a bare
 * "Details", so a closed card still tells you what it holds.
 */
function cardSummary(meeting: PublicMeeting) {
	const parts: string[] = [];
	if (locked.value && meeting.lockedCounts) {
		const c = meeting.lockedCounts;
		if (c.agenda) parts.push('Agenda');
		if (c.minutes) parts.push('Minutes');
		if (c.recording) parts.push('Recording');
		if (c.presentations) parts.push(`${c.presentations} Presentation${c.presentations === 1 ? '' : 's'}`);
		if (c.announcements) parts.push(`${c.announcements} Announcement${c.announcements === 1 ? '' : 's'}`);
	} else {
		if (meeting.agenda) parts.push('Agenda');
		if (meeting.minutes) parts.push('Minutes');
		if (meeting.recording) parts.push('Recording');
		if (meeting.presentations.length)
			parts.push(`${meeting.presentations.length} Presentation${meeting.presentations.length === 1 ? '' : 's'}`);
		if (meeting.announcements.length)
			parts.push(`${meeting.announcements.length} Announcement${meeting.announcements.length === 1 ? '' : 's'}`);
	}
	if (!parts.length && meeting.description) return 'Details';
	if (!parts.length) return '';
	return parts.slice(0, 3).join(' · ');
}

/* ----------------------------------------------------------------- resources */

interface Resource {
	key: string;
	label: string;
	meta?: string;
	icon: string;
	href?: string;
	external?: boolean;
	available: boolean;
}

/**
 * The Documents row: agenda, minutes, recording and any extra attachments.
 * The first three always show — as a dashed placeholder when missing — so
 * residents can tell what's still outstanding. Presentations and announcements
 * are optional and render as their own titled groups in the template.
 */
function resourcesFor(meeting: PublicMeeting): Resource[] {
	const list: Resource[] = [
		{
			key: 'agenda',
			label: 'Agenda',
			meta: fileMeta(meeting.agenda),
			icon: 'lucide:file-text',
			href: meeting.agenda?.url,
			external: true,
			available: Boolean(meeting.agenda),
		},
		{
			key: 'minutes',
			label: 'Minutes',
			meta: fileMeta(meeting.minutes),
			icon: 'lucide:file-check-2',
			href: meeting.minutes?.url,
			external: true,
			available: Boolean(meeting.minutes),
		},
	];


	list.push({
		key: 'recording',
		label: 'Recording',
		icon: 'lucide:play-circle',
		href: meeting.recording?.url,
		external: true,
		available: Boolean(meeting.recording),
	});

	for (const doc of meeting.documents) {
		list.push({
			key: `doc-${doc.id}`,
			label: doc.name,
			meta: fileMeta(doc),
			icon: 'lucide:paperclip',
			href: doc.url,
			external: true,
			available: true,
		});
	}

	return list;
}

/* -------------------------------------------------------- recording passcode */

const copiedFor = ref<number | null>(null);

/** execCommand fallback for browsers/contexts where the async clipboard is blocked. */
function legacyCopy(text: string) {
	const field = document.createElement('textarea');
	field.value = text;
	field.setAttribute('readonly', '');
	field.style.position = 'fixed';
	field.style.opacity = '0';
	document.body.appendChild(field);
	field.select();
	let ok = false;
	try {
		ok = document.execCommand('copy');
	} catch {
		ok = false;
	}
	document.body.removeChild(field);
	return ok;
}

async function copyPasscode(meeting: PublicMeeting) {
	const passcode = meeting.recording?.passcode;
	if (!passcode) return;

	let copied = false;
	try {
		await navigator.clipboard.writeText(passcode);
		copied = true;
	} catch {
		copied = legacyCopy(passcode);
	}
	// If both paths fail the passcode is still on screen to select by hand, so
	// say nothing rather than showing a false "Copied".
	if (!copied) return;

	copiedFor.value = meeting.id;
	setTimeout(() => {
		if (copiedFor.value === meeting.id) copiedFor.value = null;
	}, 2000);
}

/* ------------------------------------------------------------ add to calendar */

function icsStamp(date: string, time: string | null, addMinutes = 0) {
	const [y, m, d] = date.split('-').map(Number);
	const [hh, mm] = (time || '19:00').split(':').map(Number);
	const local = new Date(y, m - 1, d, hh, mm || 0);
	local.setMinutes(local.getMinutes() + addMinutes);
	// Floating local time — no timezone suffix, so it lands at the stated hour.
	const pad = (n: number) => String(n).padStart(2, '0');
	return (
		`${local.getFullYear()}${pad(local.getMonth() + 1)}${pad(local.getDate())}` +
		`T${pad(local.getHours())}${pad(local.getMinutes())}00`
	);
}

function addToCalendar(meeting: PublicMeeting) {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//1033 Lenox//Board Meetings//EN',
		'BEGIN:VEVENT',
		`UID:meeting-${meeting.id}@1033lenox.com`,
		`DTSTART:${icsStamp(meeting.date, meeting.time)}`,
		`DTEND:${icsStamp(meeting.date, meeting.time, 90)}`,
		`SUMMARY:${meeting.title} — 1033 Lenox`,
		meeting.location ? `LOCATION:${meeting.location}` : '',
		meeting.description ? `DESCRIPTION:${meeting.description.replace(/\s+/g, ' ').trim()}` : '',
		'END:VEVENT',
		'END:VCALENDAR',
	].filter(Boolean);

	const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `1033-lenox-board-meeting-${meeting.date}.ics`;
	link.click();
	URL.revokeObjectURL(url);
}

/* ----------------------------------------------------------------------- seo */

// og:image is inherited from the site-wide default set in app.vue.
useSeoMeta({
	title: '1033 Lenox Board Meetings',
	description: `Schedule, agendas, minutes, presentations, and recordings for the ${YEAR} board meetings of the 1033 Lenox Condominium Association at 1033 Lenox Avenue, Miami Beach, FL 33139.`,
	ogTitle: '1033 Lenox Board Meetings',
	ogDescription: `Agendas, minutes, presentations, and recordings for every ${YEAR} board meeting.`,
	ogType: 'website',
});

useHead(() => ({
	script: meetings.value.length
		? [
				{
					type: 'application/ld+json',
					innerHTML: JSON.stringify(
						meetings.value.map((m) => ({
							'@context': 'https://schema.org',
							'@type': 'Event',
							name: `${m.title} — 1033 Lenox`,
							startDate: m.time ? `${m.date}T${m.time}` : m.date,
							eventStatus: m.canceled
								? 'https://schema.org/EventCancelled'
								: 'https://schema.org/EventScheduled',
							eventAttendanceMode: m.isVirtual
								? 'https://schema.org/OnlineEventAttendanceMode'
								: 'https://schema.org/OfflineEventAttendanceMode',
							location: m.isVirtual
								? { '@type': 'VirtualLocation', url: m.joinLink || undefined }
								: {
										'@type': 'Place',
										name: m.location || 'Community Room',
										address: '1033 Lenox Ave, Miami Beach, FL 33139',
									},
							organizer: { '@type': 'Organization', name: '1033 Lenox Condominium Association' },
						}))
					),
				},
			]
		: [],
}));
</script>

<template>
	<div class="relative mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
		<!-- Gives the frosted surfaces something to refract; purely decorative. -->
		<div class="ambient-wash" aria-hidden="true" />

		<div class="relative z-10">

		<!-- Hero -->
		<header class="mb-10 sm:mb-14">
			<div class="flex items-center gap-3">
				<h1 class="text-3xl tracking-tight sm:text-4xl">{{ YEAR }} Board Meetings</h1>
				<button
					v-if="locked"
					type="button"
					class="glass-surface inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-strong"
					aria-label="Records are protected — enter the passphrase to unlock"
					@click="unlockOpen = true">
					<Icon name="lucide:lock" class="h-4 w-4" />
				</button>
			</div>
			<p class="mt-3 max-w-2xl text-muted-foreground">
				The year-to-date meeting schedule, with the agenda, minutes, presentation, and recording for
				each meeting posted here as they become available. Open to all owners and residents.
			</p>

			<div
				v-if="meetings.length"
				class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
					<Icon name="lucide:calendar-days" class="h-4 w-4" />
					{{ meetingSummary }}
					<template v-if="search.trim()">
						· {{ visibleMeetings.length }} matching
					</template>
				</span>

				<div class="relative sm:w-72">
					<Icon
						name="lucide:search"
						class="pointer-events-none absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						v-model="search"
						type="search"
						placeholder="Search meetings…"
						aria-label="Search meetings by title, description, date, or tag"
						class="field-underline h-9 w-full pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground" />
				</div>
			</div>
		</header>

		<!-- Next meeting -->
		<section
			v-if="nextMeeting"
			class="mb-10 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
			<p class="text-xs font-semibold uppercase tracking-wider text-primary-strong">Next meeting</p>
			<div class="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 class="text-xl font-semibold tracking-tight">
						{{ weekdayOf(nextMeeting.date) }}, {{ longDateOf(nextMeeting.date) }}
					</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						<span v-if="formatTime(nextMeeting.time)">{{ formatTime(nextMeeting.time) }} · </span>
						{{ nextMeeting.location || 'Location to be announced' }}
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button v-if="nextMeeting.joinLink" as-child size="sm">
						<a :href="nextMeeting.joinLink" target="_blank" rel="noopener noreferrer">
							<Icon name="lucide:video" class="h-4 w-4" />
							Join meeting
						</a>
					</Button>
					<Button variant="outline" size="sm" @click="addToCalendar(nextMeeting)">
						<Icon name="lucide:calendar-plus" class="h-4 w-4" />
						Add to calendar
					</Button>
				</div>
			</div>
		</section>

		<!-- Loading -->
		<div v-if="pending" class="space-y-4">
			<div v-for="n in 3" :key="n" class="rounded-xl border p-5">
				<div class="flex gap-5">
					<div class="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-muted" />
					<div class="flex-1 space-y-3">
						<div class="h-4 w-1/3 animate-pulse rounded bg-muted" />
						<div class="h-3 w-2/3 animate-pulse rounded bg-muted" />
						<div class="h-8 w-full animate-pulse rounded bg-muted" />
					</div>
				</div>
			</div>
		</div>

		<!-- Error -->
		<div v-else-if="error" class="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
			<Icon name="lucide:triangle-alert" class="mx-auto h-8 w-8 text-destructive" />
			<p class="mt-3 font-medium">We couldn't load the meeting schedule</p>
			<p class="mt-1 text-sm text-muted-foreground">Please refresh the page or try again shortly.</p>
		</div>

		<!-- Meetings -->
		<TransitionGroup
				v-else-if="visibleMeetings.length"
				tag="section"
				name="meeting-list"
				class="relative space-y-4">
				<article
					v-for="meeting in visibleMeetings"
					:key="meeting.id"
				class="glass-card rounded-xl p-5 sm:p-6"
				:class="meeting.isPast ? 'opacity-95' : ''">
				<div class="flex gap-4 sm:gap-5">
					<!-- Date chip -->
					<div
						class="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border text-center sm:h-16 sm:w-16"
						:class="
							meeting.canceled
								? 'border-destructive/30 bg-destructive/5 text-muted-foreground'
								: meeting.isPast
									? 'bg-muted/50'
									: 'border-primary/40 bg-primary/10'
						">
						<span
							class="text-[10px] font-semibold uppercase tracking-widest"
							:class="
								meeting.canceled || meeting.isPast ? 'text-muted-foreground' : 'text-primary-strong'
							">
							{{ monthOf(meeting.date) }}
						</span>
						<span class="text-2xl font-semibold leading-none">{{ dayOf(meeting.date) }}</span>
					</div>

					<div class="min-w-0 flex-1">
						<!-- Title row -->
						<div class="flex flex-wrap items-center gap-2">
							<h2
								class="text-lg font-semibold tracking-tight"
								:class="meeting.canceled ? 'text-muted-foreground line-through' : ''">
								{{ meeting.title }}
							</h2>
							<Badge v-if="meeting.canceled" variant="soft" color="red" size="sm">Canceled</Badge>
							<Badge v-else-if="!meeting.isPast" variant="soft" color="primary" size="sm">
								Upcoming
							</Badge>
							<Badge v-else variant="soft" color="gray" size="sm">Held</Badge>
						</div>

						<!-- Meeting info -->
						<div
							class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
							<span class="inline-flex items-center gap-1.5">
								<Icon name="lucide:calendar" class="h-3.5 w-3.5" />
								{{ weekdayOf(meeting.date) }}, {{ longDateOf(meeting.date) }}
							</span>
							<span v-if="formatTime(meeting.time)" class="inline-flex items-center gap-1.5">
								<Icon name="lucide:clock" class="h-3.5 w-3.5" />
								{{ formatTime(meeting.time) }}
							</span>
							<span class="inline-flex items-center gap-1.5">
								<Icon
									:name="meeting.isVirtual ? 'lucide:video' : 'lucide:map-pin'"
									class="h-3.5 w-3.5" />
								{{ meeting.location || 'Location to be announced' }}
							</span>
							<span v-if="meeting.attendeeCount" class="inline-flex items-center gap-1.5">
								<Icon name="lucide:users" class="h-3.5 w-3.5" />
								{{ meeting.attendeeCount }}
								{{ meeting.attendeeCount === 1 ? 'attendee' : 'attendees' }}
							</span>
						</div>

						<!-- Everything below the meta row collapses on phones. Always open
						     from sm up — see .card-details in the style block. -->
						<div class="card-details" :class="{'is-open': isExpanded(meeting.id)}">
							<div>
								<p v-if="meeting.description" class="mt-3 text-sm leading-relaxed">
							{{ meeting.description }}
						</p>

						<!-- Tags double as search shortcuts. -->
						<div v-if="meeting.tags.length" class="mt-3 flex flex-wrap gap-1.5">
							<button
								v-for="tag in meeting.tags"
								:key="tag"
								type="button"
								class="rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
								@click="search = tag">
								{{ tag }}
							</button>
						</div>

						<!-- Cancellation notice -->
						<div
							v-if="meeting.canceled"
							class="mt-3 flex gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm">
							<Icon name="lucide:calendar-x" class="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
							<div>
								<p class="font-medium">This meeting was canceled</p>
								<p v-if="meeting.cancellationNote" class="mt-0.5 leading-relaxed text-muted-foreground">
									{{ meeting.cancellationNote }}
								</p>
							</div>
						</div>

						<!-- Locked: inert chips naming what exists, carrying no hrefs.
						     The server never sent the URLs, so there is nothing to reveal. -->
						<div v-if="locked && meeting.lockedCounts" class="mt-4 flex flex-wrap gap-2">
							<template
								v-for="item in [
									{ show: meeting.lockedCounts.agenda, label: 'Agenda', icon: 'lucide:file-text' },
									{ show: meeting.lockedCounts.minutes, label: 'Minutes', icon: 'lucide:file-check-2' },
									{
										show: meeting.lockedCounts.presentations > 0,
										label: `${meeting.lockedCounts.presentations} Presentation${meeting.lockedCounts.presentations === 1 ? '' : 's'}`,
										icon: 'lucide:presentation',
									},
									{ show: meeting.lockedCounts.recording, label: 'Recording', icon: 'lucide:play-circle' },
									{
										show: meeting.lockedCounts.announcements > 0,
										label: `${meeting.lockedCounts.announcements} Announcement${meeting.lockedCounts.announcements === 1 ? '' : 's'}`,
										icon: 'lucide:megaphone',
									},
								].filter((i) => i.show)"
								:key="item.label">
								<button
									type="button"
									class="inline-flex items-center gap-2 rounded-full border border-dashed px-3.5 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70 transition-colors hover:border-primary/50 hover:text-foreground"
									:aria-label="`${item.label} — locked. Enter the passphrase to unlock.`"
									@click="unlockOpen = true">
									<Icon name="lucide:lock" class="h-3.5 w-3.5" />
									{{ item.label }}
								</button>
							</template>
							<span
								v-if="!Object.values(meeting.lockedCounts).some(Boolean)"
								class="text-xs text-muted-foreground">
								No records posted yet
							</span>
						</div>

						<!-- Unlocked resources. A canceled meeting only shows what actually
						     exists — "minutes pending" would mislead for a meeting never held. -->
						<div
							v-else-if="!meeting.canceled || resourcesFor(meeting).some((r) => r.available)"
							class="card-section">
							<p class="card-section-title">Documents</p>
							<div class="mt-2 flex flex-wrap gap-2">
							<template v-for="resource in resourcesFor(meeting)" :key="resource.key">
								<a
									v-if="resource.available && resource.href"
									:href="resource.href"
									:target="resource.external ? '_blank' : undefined"
									:rel="resource.external ? 'noopener noreferrer' : undefined"
									class="glass-surface inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium uppercase tracking-wide">
									<Icon :name="resource.icon" class="h-4 w-4 text-primary-strong" />
									<span class="max-w-[16rem] truncate">{{ resource.label }}</span>
									<span v-if="resource.meta" class="normal-case tracking-normal text-muted-foreground">
										{{ resource.meta }}
									</span>
									<span v-if="resource.external" class="sr-only">(opens in a new tab)</span>
								</a>

								<!-- Unavailable: reads as a disabled control, with the reason in a
								     tooltip rather than as inline text cluttering every card.
								     A span (not <button disabled>) so hover still fires. -->
								<Tooltip
									v-else-if="!meeting.canceled"
									:text="meeting.isPast ? 'Not posted' : 'Pending'">
									<span
										role="button"
										aria-disabled="true"
										tabindex="0"
										class="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-dashed px-3.5 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/60 opacity-70">
										<Icon :name="resource.icon" class="h-4 w-4" />
										{{ resource.label }}
									</span>
								</Tooltip>

								<!-- Passcode rides alongside the recording it belongs to. -->
								<span
									v-if="resource.key === 'recording' && meeting.recording?.passcode"
									class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
									<span class="text-[10px] font-semibold uppercase tracking-wider">Passcode</span>
									<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
										{{ meeting.recording.passcode }}
									</code>
									<button
										type="button"
										class="inline-flex items-center gap-1 normal-case tracking-normal transition-opacity hover:opacity-70"
										:aria-label="`Copy recording passcode for ${longDateOf(meeting.date)}`"
										@click="copyPasscode(meeting)">
										<Icon
											:name="copiedFor === meeting.id ? 'lucide:check' : 'lucide:copy'"
											class="h-3.5 w-3.5" />
									</button>
								</span>
							</template>
						</div>
						</div>

						<!-- Presentations. Their own group so the Documents row stays
						     records-only and the three section titles read consistently. -->
						<div v-if="!locked && meeting.presentations.length" class="card-section">
							<p class="card-section-title">Presentations</p>
							<div class="mt-2 flex flex-wrap gap-2">
								<NuxtLink
									v-for="presentation in meeting.presentations"
									:key="presentation.id"
									:to="presentation.url"
									target="_blank"
									rel="noopener"
									class="glass-surface inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium uppercase tracking-wide">
									<Icon name="lucide:presentation" class="h-4 w-4 text-primary-strong" />
									<span class="max-w-[16rem] truncate">{{ presentation.title }}</span>
									<span class="sr-only">(opens in a new tab)</span>
								</NuxtLink>
							</div>
						</div>

						<!-- Related announcements. Kept out of the records row above:
						     these are communications about the meeting, not records of it. -->
						<div v-if="!locked && meeting.announcements.length" class="card-section">
							<p class="card-section-title">Related announcements</p>
							<ul class="mt-2 space-y-1">
								<li v-for="announcement in meeting.announcements" :key="announcement.id">
									<NuxtLink
										:to="announcement.url"
										target="_blank"
										rel="noopener"
										class="group inline-flex items-baseline gap-2 text-sm hover:text-primary-strong">
										<Icon
											name="lucide:megaphone"
											class="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-muted-foreground" />
										<span class="underline-offset-4 group-hover:underline">
											{{ announcement.title }}
										</span>
										<span v-if="announcement.date" class="text-xs text-muted-foreground">
											{{ fmt(announcement.date.slice(0, 10), { month: 'short', day: 'numeric' }) }}
										</span>
										<span class="sr-only">(opens in a new tab)</span>
									</NuxtLink>
								</li>
							</ul>
						</div>

						<!-- Per-meeting actions -->
						<div v-if="!locked && !meeting.isPast && !meeting.canceled" class="mt-4 flex flex-wrap gap-2">
							<Button v-if="meeting.joinLink" as-child variant="outline" size="sm">
								<a :href="meeting.joinLink" target="_blank" rel="noopener noreferrer">
									<Icon name="lucide:video" class="h-4 w-4" />
									Join meeting
								</a>
							</Button>
							<Button variant="ghost" size="sm" @click="addToCalendar(meeting)">
								<Icon name="lucide:calendar-plus" class="h-4 w-4" />
								Add to calendar
							</Button>
								</div>
							</div>
						</div>

						<!-- Phone-only disclosure. Names what's inside so a collapsed card
						     still says what it holds, rather than a bare "Details". -->
						<button
							v-if="cardSummary(meeting)"
							type="button"
							class="mt-3 flex w-full items-center gap-1.5 text-left text-xs font-medium uppercase tracking-wide text-primary-strong sm:hidden"
							:aria-expanded="isExpanded(meeting.id)"
							@click="toggleExpanded(meeting.id)">
							<Icon
								name="lucide:chevron-down"
								class="h-3.5 w-3.5 shrink-0 transition-transform duration-300"
								:class="isExpanded(meeting.id) ? 'rotate-180' : ''" />
							<span class="min-w-0">
								{{ isExpanded(meeting.id) ? 'Hide' : cardSummary(meeting) }}
							</span>
						</button>
					</div>
				</div>
			</article>
		</TransitionGroup>

		<!-- No search results -->
		<div v-else-if="meetings.length" class="rounded-xl border border-dashed p-12 text-center">
			<Icon name="lucide:search-x" class="mx-auto h-10 w-10 text-muted-foreground/50" />
			<p class="mt-3 font-medium">No meetings match “{{ search.trim() }}”</p>
			<button
				type="button"
				class="mt-3 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors hover:bg-muted"
				@click="search = ''">
				Clear search
			</button>
		</div>

		<!-- Empty -->
		<div v-else class="rounded-xl border border-dashed p-12 text-center">
			<Icon name="lucide:calendar-x" class="mx-auto h-10 w-10 text-muted-foreground/50" />
			<p class="mt-3 font-medium">No {{ YEAR }} meetings published yet</p>
			<p class="mt-1 text-sm text-muted-foreground">
				The schedule will appear here as soon as it's posted.
			</p>
		</div>

		<!-- Footer note -->
		<footer class="mt-12 text-sm text-muted-foreground">
			<p>
				Owners who need an official copy of any record can request one from the board at
				<a
					href="mailto:lenoxplazaboard@gmail.com"
					class="text-primary-strong underline underline-offset-4">
					lenoxplazaboard@gmail.com </a
				>.
			</p>
		</footer>

		<MeetingsUnlockPanel
				v-model:open="unlockOpen"
				:summary="lockedSummaryText"
				:hint="hint"
				:submit="attemptUnlock" />
		</div>
	</div>
</template>

<style scoped>
/*
 * Card disclosure.
 *
 * Height animates via grid-template-rows 0fr -> 1fr, which transitions cleanly
 * without needing a measured pixel height. From sm up the row is always 1fr, so
 * the content is simply always open and the toggle is hidden — no JS state has
 * to know about the breakpoint.
 */
.card-details {
	display: grid;
	grid-template-rows: 0fr;
	transition: grid-template-rows 0.34s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-details > * {
	overflow: hidden;
	min-height: 0;
}

.card-details.is-open {
	grid-template-rows: 1fr;
}

@media (min-width: 640px) {
	.card-details {
		grid-template-rows: 1fr;
	}
}

@media (prefers-reduced-motion: reduce) {
	.card-details {
		transition: none;
	}
}

/*
 * Search filtering.
 *
 * TransitionGroup gives FLIP for free via .meeting-list-move — cards that stay
 * on screen slide to their new position instead of jumping. Leaving cards are
 * taken out of flow (position: absolute) so the survivors start moving
 * immediately rather than waiting for the gap to collapse.
 */
.meeting-list-move,
.meeting-list-enter-active,
.meeting-list-leave-active {
	transition:
		opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1),
		transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.meeting-list-enter-from,
.meeting-list-leave-to {
	opacity: 0;
	transform: translateY(10px) scale(0.985);
}

.meeting-list-leave-active {
	position: absolute;
	width: 100%;
}

@media (prefers-reduced-motion: reduce) {
	.meeting-list-move,
	.meeting-list-enter-active,
	.meeting-list-leave-active {
		transition: none;
	}
}

/*
 * Shared label for the groups inside a meeting card — Documents,
 * Presentations, Related announcements. One rule so the three can't drift
 * apart, set smaller and more tracked than body copy so they read as
 * structure rather than content.
 */
.card-section {
	margin-top: 1.5rem;
}

.card-section-title {
	font-size: 10px;
	font-weight: 600;
	line-height: 1.4;
	text-transform: uppercase;
	letter-spacing: 0.14em;
	color: var(--muted-foreground);
}
</style>
