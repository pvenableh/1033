<script setup lang="ts">
/**
 * BoardWidget - Displays current board members
 *
 * Shows board composition and leadership transparency
 * to prospective buyers.
 */

interface Props {
	variant?: 'compact' | 'standard' | 'detailed';
	animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'standard',
	animated: false,
});

const boardCollection = useDirectusItems('board_member', {requireAuth: false});

// Fetch active board members with person details
const boardMembers = await boardCollection
	.list({
		fields: ['id', 'role', 'person.first_name', 'person.last_name', 'start_date', 'status'],
		filter: {
			status: {_eq: 'published'},
		},
		sort: ['sort'],
		limit: -1,
	})
	.catch(() => []);

const hasData = computed(() => boardMembers !== null && boardMembers.length > 0);
const totalMembers = computed(() => boardMembers?.length ?? 0);

// Get board positions
const president = computed(() => {
	if (!boardMembers?.length) return null;
	return boardMembers.find((m: any) => m.role?.toLowerCase().includes('president'));
});

const treasurer = computed(() => {
	if (!boardMembers?.length) return null;
	return boardMembers.find((m: any) => m.role?.toLowerCase().includes('treasurer'));
});

const secretary = computed(() => {
	if (!boardMembers?.length) return null;
	return boardMembers.find((m: any) => m.role?.toLowerCase().includes('secretary'));
});

// Count directors (non-officer positions)
const directorCount = computed(() => {
	if (!boardMembers?.length) return 0;
	return boardMembers.filter(
		(m: any) => m.role?.toLowerCase().includes('director') || m.role?.toLowerCase().includes('member')
	).length;
});

// Format member name
function formatName(member: any): string {
	if (!member?.person) return 'Vacant';
	const first = member.person.first_name || '';
	const last = member.person.last_name || '';
	return `${first} ${last}`.trim() || 'Vacant';
}

// Get role display name
function formatRole(role: string): string {
	if (!role) return 'Member';
	return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getIcon(): string {
	return props.animated ? 'i-meteocons-clear-day-fill' : 'i-heroicons-user-group';
}
</script>

<template>
	<div
		v-if="hasData"
		class="glass-widget flex flex-col px-8 py-4 text-cream uppercase"
		:class="{
			'gap-0': variant === 'compact',
			'gap-1': variant === 'standard',
			'gap-2 p-3': variant === 'detailed',
		}">
		<!-- Primary Stats Row -->
		<div class="relative text-xs uppercase tracking-wide flex items-center gap-1.5 text-cream">
			<span class="font-semibold">{{ totalMembers }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">Board Members</span>
			<span
				class="glass-widget__icon h-8 w-8 rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700">
				<Icon :name="getIcon()" />
			</span>
		</div>

		<!-- Standard variant -->
		<div v-if="variant !== 'compact'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span class="font-medium">Owner-elected leadership</span>
			<span class="text-cream/70">Active governance</span>
		</div>

		<!-- Detailed variant -->
		<div
			v-if="variant === 'detailed'"
			class="grid grid-cols-1 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
			<div v-if="president" class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-star" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">President</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ formatName(president) }}</span>
			</div>

			<div v-if="treasurer" class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-banknotes" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Treasurer</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ formatName(treasurer) }}</span>
			</div>

			<div v-if="secretary" class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-document-text" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Secretary</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ formatName(secretary) }}</span>
			</div>

			<div v-if="directorCount > 0" class="flex items-center gap-1.5 text-[11px]">
				<Icon name="i-heroicons-users" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Directors</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ directorCount }}</span>
			</div>
		</div>
	</div>

	<!-- Empty State -->
	<div v-else class="glass-widget flex flex-row items-center gap-2 text-cream uppercase px-8 py-4">
		<Icon name="i-heroicons-user-group" class="text-lg" />
		<span class="text-xs">Board info unavailable</span>
	</div>
</template>
