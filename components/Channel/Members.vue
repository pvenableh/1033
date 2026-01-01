<template>
	<div class="channel-members h-full flex flex-col">
		<!-- Header -->
		<div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
			<h3 class="font-semibold text-gray-900 dark:text-white">Members</h3>
			<div class="flex items-center gap-1">
				<UButton
					v-if="canInvite"
					size="xs"
					color="primary"
					variant="ghost"
					icon="i-heroicons-user-plus"
					@click="$emit('invite')" />
				<UButton
					size="xs"
					color="gray"
					variant="ghost"
					icon="i-heroicons-x-mark"
					@click="$emit('close')" />
			</div>
		</div>

		<!-- Member List -->
		<div class="flex-1 overflow-y-auto p-2">
			<div v-if="members.length === 0" class="text-center py-8 text-gray-500">
				<UIcon name="i-heroicons-users" class="w-8 h-8 mx-auto mb-2 opacity-50" />
				<p class="text-sm">No members yet</p>
			</div>

			<div v-else class="space-y-1">
				<div
					v-for="member in sortedMembers"
					:key="member.id"
					class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group">
					<div class="relative">
						<UAvatar
							:src="getMemberAvatar(member)"
							:alt="getMemberName(member)"
							size="sm" />
						<!-- Online indicator (future feature) -->
						<!-- <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span> -->
					</div>

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-1">
							<span class="text-sm font-medium text-gray-900 dark:text-white truncate">
								{{ getMemberName(member) }}
							</span>
							<UBadge
								v-if="member.role === 'moderator'"
								size="xs"
								color="amber"
								variant="subtle">
								Mod
							</UBadge>
						</div>
						<p class="text-xs text-gray-500 dark:text-gray-400 truncate">
							{{ getMemberEmail(member) }}
						</p>
					</div>

					<!-- Remove button -->
					<UButton
						v-if="canRemoveMember(member)"
						size="xs"
						color="red"
						variant="ghost"
						icon="i-heroicons-x-mark"
						class="opacity-0 group-hover:opacity-100 transition-opacity"
						@click="confirmRemove(member)" />
				</div>
			</div>
		</div>

		<!-- Footer with stats -->
		<div class="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
			<p class="text-xs text-gray-500 dark:text-gray-400 text-center">
				{{ members.length }} {{ members.length === 1 ? 'member' : 'members' }}
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import type {ChannelMember} from '~/types/channels';

const props = defineProps<{
	channelId: string;
	members: ChannelMember[];
}>();

const emit = defineEmits(['invite', 'remove', 'close']);

const config = useRuntimeConfig();
const {isBoardMember, isAdmin} = useRoles();
const {user} = useDirectusAuth();

const canInvite = computed(() => isBoardMember.value || isAdmin.value);

const sortedMembers = computed(() => {
	return [...props.members].sort((a, b) => {
		// Moderators first
		if (a.role === 'moderator' && b.role !== 'moderator') return -1;
		if (a.role !== 'moderator' && b.role === 'moderator') return 1;

		// Then alphabetically by name
		const nameA = getMemberName(a).toLowerCase();
		const nameB = getMemberName(b).toLowerCase();
		return nameA.localeCompare(nameB);
	});
});

const getMemberAvatar = (member: ChannelMember) => {
	const userData = typeof member.user_id === 'string' ? null : member.user_id;
	if (!userData?.avatar) return null;
	return `${config.public.directusUrl}/assets/${userData.avatar}?key=small`;
};

const getMemberName = (member: ChannelMember) => {
	const userData = typeof member.user_id === 'string' ? null : member.user_id;
	if (!userData) return 'Unknown';
	return `${userData.first_name} ${userData.last_name}`;
};

const getMemberEmail = (member: ChannelMember) => {
	const userData = typeof member.user_id === 'string' ? null : member.user_id;
	return userData?.email || '';
};

const canRemoveMember = (member: ChannelMember) => {
	if (!canInvite.value) return false;

	// Can't remove yourself
	const userData = typeof member.user_id === 'string' ? member.user_id : member.user_id?.id;
	return userData !== user.value?.id;
};

const confirmRemove = (member: ChannelMember) => {
	if (confirm(`Remove ${getMemberName(member)} from this channel?`)) {
		emit('remove', member);
	}
};
</script>
