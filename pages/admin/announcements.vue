<script setup lang="ts">
import type {Announcement} from '~/types/directus';

definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

const toast = useToast();
const {isAdmin, isBoardMember} = useRoles();
const {canManage} = useUserPermissions();

// Check if user has access - uses announcements_approved permission
const hasAccess = computed(() => {
	return canManage('announcements');
});

const canCreate = computed(() => {
	return canManage('announcements');
});

const canEdit = computed(() => {
	return canManage('announcements');
});

const canDelete = computed(() => {
	return canManage('announcements');
});

// State
const announcements = ref<Announcement[]>([]);
const loading = ref(true);
const showModal = ref(false);
const showSendModal = ref(false);
const saving = ref(false);
const sending = ref(false);
const selectedAnnouncement = ref<Announcement | null>(null);
const searchQuery = ref('');
const statusFilter = ref<string>('all');

// Recipients state
const allPeople = ref<any[]>([]);
const selectedRecipients = ref<string[]>([]);
const recipientFilter = ref<'all' | 'owners' | 'tenants'>('all');
const loadingRecipients = ref(false);

// Form state
const form = ref<Partial<Announcement>>({
	status: 'draft',
	title: '',
	subtitle: '',
	content: '',
	urgent: false,
	template: 'Generic',
});

// Template options
const templateOptions = [
	{label: 'Generic', value: 'Generic'},
	{label: 'Parking', value: 'Parking'},
];

// Status options
const statusOptions = [
	{label: 'Draft', value: 'draft', color: 'gray'},
	{label: 'Sent', value: 'sent', color: 'green'},
	{label: 'Archived', value: 'archived', color: 'red'},
];

// Computed
const filteredAnnouncements = computed(() => {
	let result = announcements.value;

	if (statusFilter.value !== 'all') {
		result = result.filter((a) => a.status === statusFilter.value);
	}

	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		result = result.filter((a) => a.title?.toLowerCase().includes(query) || a.subtitle?.toLowerCase().includes(query));
	}

	return result;
});

const filteredRecipients = computed(() => {
	let result = allPeople.value;

	switch (recipientFilter.value) {
		case 'owners':
			result = result.filter((p) => p.is_owner);
			break;
		case 'tenants':
			result = result.filter((p) => p.is_resident && !p.is_owner);
			break;
	}

	return result;
});

// Methods
async function fetchAnnouncements() {
	loading.value = true;
	try {
		const response = await $fetch<Announcement[]>('/api/directus/items', {
			method: 'POST',
			body: {
				collection: 'announcements',
				operation: 'list',
				query: {
					fields: [
						'*',
						'recipients.people_id.first_name',
						'recipients.people_id.last_name',
						'recipients.people_id.email',
					],
					sort: ['-date_created'],
					limit: 100,
				},
			},
		});
		announcements.value = response || [];
	} catch (error: any) {
		console.error('Failed to fetch announcements:', error);
		toast.add({title: 'Error', description: 'Failed to load announcements', color: 'red'});
	} finally {
		loading.value = false;
	}
}

async function fetchPeople() {
	loadingRecipients.value = true;
	try {
		const response = await $fetch<any[]>('/api/directus/items', {
			method: 'POST',
			body: {
				collection: 'people',
				operation: 'list',
				query: {
					fields: ['id', 'first_name', 'last_name', 'email', 'is_owner', 'is_resident', 'category'],
					filter: {
						status: {_eq: 'published'},
						email: {_nnull: true},
					},
					sort: ['last_name', 'first_name'],
					limit: -1,
				},
			},
		});
		allPeople.value = response || [];
	} catch (error: any) {
		console.error('Failed to fetch people:', error);
	} finally {
		loadingRecipients.value = false;
	}
}

function openCreateModal() {
	selectedAnnouncement.value = null;
	form.value = {
		status: 'draft',
		title: '',
		subtitle: '',
		content: '',
		urgent: false,
		template: 'Generic',
	};
	showModal.value = true;
}

function openEditModal(announcement: Announcement) {
	selectedAnnouncement.value = announcement;
	form.value = {...announcement};
	showModal.value = true;
}

function openSendModal(announcement: Announcement) {
	selectedAnnouncement.value = announcement;
	selectedRecipients.value = [];
	recipientFilter.value = 'all';
	fetchPeople();
	showSendModal.value = true;
}

async function saveAnnouncement() {
	if (!form.value.title) {
		toast.add({title: 'Error', description: 'Title is required', color: 'red'});
		return;
	}

	saving.value = true;
	try {
		// Generate URL slug from title
		const url = form.value.title
			?.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');

		const data = {
			...form.value,
			url,
		};

		if (selectedAnnouncement.value) {
			await $fetch('/api/directus/items', {
				method: 'POST',
				body: {
					collection: 'announcements',
					operation: 'update',
					id: selectedAnnouncement.value.id,
					data,
				},
			});
			toast.add({title: 'Success', description: 'Announcement updated', color: 'green'});
		} else {
			await $fetch('/api/directus/items', {
				method: 'POST',
				body: {
					collection: 'announcements',
					operation: 'create',
					data,
				},
			});
			toast.add({title: 'Success', description: 'Announcement created', color: 'green'});
		}

		showModal.value = false;
		await fetchAnnouncements();
	} catch (error: any) {
		console.error('Failed to save announcement:', error);
		toast.add({
			title: 'Error',
			description: error?.data?.message || 'Failed to save announcement',
			color: 'red',
		});
	} finally {
		saving.value = false;
	}
}

async function deleteAnnouncement(announcement: Announcement) {
	if (!confirm(`Delete "${announcement.title}"?`)) return;

	try {
		await $fetch('/api/directus/items', {
			method: 'POST',
			body: {
				collection: 'announcements',
				operation: 'delete',
				id: announcement.id,
			},
		});
		toast.add({title: 'Success', description: 'Announcement deleted', color: 'green'});
		await fetchAnnouncements();
	} catch (error: any) {
		toast.add({
			title: 'Error',
			description: error?.data?.message || 'Failed to delete announcement',
			color: 'red',
		});
	}
}

function selectAllRecipients() {
	selectedRecipients.value = filteredRecipients.value.map((p) => p.id);
}

function clearRecipients() {
	selectedRecipients.value = [];
}

async function sendAnnouncement() {
	if (selectedRecipients.value.length === 0) {
		toast.add({title: 'Error', description: 'Please select at least one recipient', color: 'red'});
		return;
	}

	if (!selectedAnnouncement.value) return;

	sending.value = true;
	try {
		// First, create recipient entries in Directus
		const recipientData = selectedRecipients.value.map((personId) => ({
			announcements_id: selectedAnnouncement.value!.id,
			people_id: personId,
		}));

		// Clear existing recipients and add new ones
		await $fetch('/api/directus/items', {
			method: 'POST',
			body: {
				collection: 'announcements_people',
				operation: 'create',
				data: recipientData,
			},
		});

		// Fetch the announcement with full recipient data
		const fullAnnouncement = await $fetch<Announcement>('/api/directus/items', {
			method: 'POST',
			body: {
				collection: 'announcements',
				operation: 'get',
				id: selectedAnnouncement.value.id,
				query: {
					fields: [
						'*',
						'recipients.people_id.id',
						'recipients.people_id.email',
						'recipients.people_id.first_name',
						'recipients.people_id.last_name',
						'recipients.people_id.unit.units_id.number',
						'recipients.people_id.unit.units_id.parking_spot',
						'recipients.people_id.unit.units_id.vehicles.*',
					],
				},
			},
		});

		// Send emails via SendGrid
		const emailResult = await $fetch('/api/email/announcement', {
			method: 'POST',
			body: {
				data: {
					data: fullAnnouncement,
					recipients: fullAnnouncement.recipients,
				},
			},
		});

		if (emailResult.success) {
			// Update announcement status to sent
			await $fetch('/api/directus/items', {
				method: 'POST',
				body: {
					collection: 'announcements',
					operation: 'update',
					id: selectedAnnouncement.value.id,
					data: {
						status: 'sent',
						date_sent: new Date().toISOString(),
					},
				},
			});

			toast.add({
				title: 'Sent!',
				description: `Email sent to ${selectedRecipients.value.length} recipients`,
				color: 'green',
			});

			showSendModal.value = false;
			await fetchAnnouncements();
		} else {
			throw new Error(emailResult.message || 'Failed to send emails');
		}
	} catch (error: any) {
		console.error('Failed to send announcement:', error);
		toast.add({
			title: 'Error',
			description: error?.message || 'Failed to send announcement',
			color: 'red',
		});
	} finally {
		sending.value = false;
	}
}

function getStatusColor(status?: string): string {
	const option = statusOptions.find((o) => o.value === status);
	return option?.color || 'gray';
}

function formatDate(date?: string | null): string {
	if (!date) return '-';
	return new Date(date).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});
}

function getRecipientCount(announcement: Announcement): number {
	return Array.isArray(announcement.recipients) ? announcement.recipients.length : 0;
}

// Initialize
onMounted(() => {
	fetchAnnouncements();
});
</script>

<template>
	<div class="admin-page bg-white dark:bg-gray-900 min-h-full">
		<div class="container mx-auto px-6 py-8">
			<!-- Header -->
			<div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
				<div>
					<h1 class="text-2xl font-bold">Email Announcements</h1>
					<p class="text-gray-600 dark:text-gray-400 mt-1">Create, edit, and send email announcements to residents</p>
				</div>
				<div class="mt-4 md:mt-0 flex gap-3">
					<Button variant="soft" color="gray" icon="i-heroicons-chart-bar" to="/admin/email-activity">
						View Activity
					</Button>
					<Button v-if="canCreate" icon="i-heroicons-plus" color="primary" to="/admin/email/compose">
						New Announcement
					</Button>
				</div>
			</div>

			<!-- Access Denied -->
			<div v-if="!hasAccess" class="text-center py-12">
				<Icon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
				<h2 class="text-xl font-semibold mb-2">Access Denied</h2>
				<p class="text-gray-600 dark:text-gray-400">You don't have permission to manage announcements.</p>
			</div>

			<template v-else>
				<!-- Filters -->
				<div class="flex flex-col sm:flex-row gap-4 mb-6">
					<Input
						v-model="searchQuery"
						icon="i-heroicons-magnifying-glass"
						placeholder="Search announcements..."
						class="flex-1 max-w-md" />
					<USelectMenu
						v-model="statusFilter"
						:options="[{label: 'All Status', value: 'all'}, ...statusOptions]"
						value-attribute="value"
						option-attribute="label"
						class="w-40" />
				</div>

				<!-- Announcements Table -->
				<Card>
					<UTable
						:rows="filteredAnnouncements"
						:columns="[
							{key: 'title', label: 'Title'},
							{key: 'status', label: 'Status'},
							{key: 'recipients', label: 'Recipients'},
							{key: 'date_sent', label: 'Sent'},
							{key: 'actions', label: 'Actions'},
						]"
						:loading="loading"
						:empty-state="{icon: 'i-heroicons-envelope', label: 'No announcements found'}">
						<template #title-data="{row}">
							<div class="max-w-md">
								<div class="flex items-center gap-2">
									<p class="font-medium truncate">{{ row.title }}</p>
									<Badge v-if="row.urgent" color="red" variant="soft" size="xs">Urgent</Badge>
								</div>
								<p v-if="row.subtitle" class="text-xs text-gray-500 truncate">{{ row.subtitle }}</p>
							</div>
						</template>

						<template #status-data="{row}">
							<Badge :color="getStatusColor(row.status)" variant="soft" size="sm">
								{{ row.status }}
							</Badge>
						</template>

						<template #recipients-data="{row}">
							<span class="text-sm text-gray-600">{{ getRecipientCount(row) }} recipients</span>
						</template>

						<template #date_sent-data="{row}">
							<span class="text-sm text-gray-500">{{ formatDate(row.date_sent) }}</span>
						</template>

						<template #actions-data="{row}">
							<div class="flex gap-2">
								<Button
									v-if="row.status === 'draft' && canEdit"
									size="xs"
									color="green"
									variant="soft"
									icon="i-heroicons-paper-airplane"
									@click="openSendModal(row)"
									title="Send">
									Send
								</Button>
								<Button
									size="xs"
									color="gray"
									variant="ghost"
									icon="i-heroicons-eye"
									:to="`/announcements/email/${row.url}`"
									target="_blank"
									title="Preview" />
								<Button
									v-if="canEdit"
									size="xs"
									color="primary"
									variant="ghost"
									icon="i-heroicons-pencil"
									:to="`/admin/email/compose?id=${row.id}`" />
								<Button
									v-if="canDelete"
									size="xs"
									color="red"
									variant="ghost"
									icon="i-heroicons-trash"
									@click="deleteAnnouncement(row)" />
							</div>
						</template>
					</UTable>
				</Card>
			</template>

			<!-- Create/Edit Modal -->
			<UModal v-model="showModal" :ui="{width: 'sm:max-w-2xl'}">
				<Card>
					<template #header>
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold">
								{{ selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement' }}
							</h3>
							<Button color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showModal = false" />
						</div>
					</template>

					<div class="space-y-4">
						<FormGroup label="Title" required>
							<Input v-model="form.title" placeholder="Announcement title" />
						</UFormGroup>

						<FormGroup label="Subtitle">
							<Input v-model="form.subtitle" placeholder="Brief summary" />
						</UFormGroup>

						<div class="grid grid-cols-2 gap-4">
							<FormGroup label="Template">
								<USelectMenu
									v-model="form.template"
									:options="templateOptions"
									value-attribute="value"
									option-attribute="label" />
							</UFormGroup>

							<FormGroup label="Status">
								<USelectMenu
									v-model="form.status"
									:options="statusOptions"
									value-attribute="value"
									option-attribute="label" />
							</UFormGroup>
						</div>

						<FormGroup label="Content">
							<ClientOnly>
								<TiptapEditor
									v-model="form.content"
									placeholder="Write your announcement content..."
									mode="full"
									height="min-h-[200px] max-h-[400px]"
									:allow-uploads="true"
									folder-id="2ff19b77-0aa8-4474-af8f-20512666ddb9" />
								<template #fallback>
									<div
										class="min-h-[200px] border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
										<Icon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
									</div>
								</template>
							</ClientOnly>
						</UFormGroup>

						<Checkbox v-model="form.urgent" label="Mark as urgent" />
					</div>

					<template #footer>
						<div class="flex justify-end gap-3">
							<Button color="gray" variant="ghost" @click="showModal = false">Cancel</Button>
							<Button color="primary" :loading="saving" @click="saveAnnouncement">
								{{ selectedAnnouncement ? 'Update' : 'Create' }}
							</Button>
						</div>
					</template>
				</Card>
			</UModal>

			<!-- Send Modal -->
			<UModal v-model="showSendModal" :ui="{width: 'sm:max-w-3xl'}">
				<Card v-if="selectedAnnouncement">
					<template #header>
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold">Send Announcement</h3>
								<p class="text-sm text-gray-500 mt-1">{{ selectedAnnouncement.title }}</p>
							</div>
							<Button color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showSendModal = false" />
						</div>
					</template>

					<div class="space-y-4">
						<!-- Recipient Filter -->
						<div class="flex items-center justify-between">
							<div class="flex gap-2">
								<Button
									:color="recipientFilter === 'all' ? 'primary' : 'gray'"
									:variant="recipientFilter === 'all' ? 'soft' : 'ghost'"
									size="sm"
									@click="recipientFilter = 'all'">
									All ({{ allPeople.length }})
								</Button>
								<Button
									:color="recipientFilter === 'owners' ? 'primary' : 'gray'"
									:variant="recipientFilter === 'owners' ? 'soft' : 'ghost'"
									size="sm"
									@click="recipientFilter = 'owners'">
									Owners ({{ allPeople.filter((p) => p.is_owner).length }})
								</Button>
								<Button
									:color="recipientFilter === 'tenants' ? 'primary' : 'gray'"
									:variant="recipientFilter === 'tenants' ? 'soft' : 'ghost'"
									size="sm"
									@click="recipientFilter = 'tenants'">
									Tenants ({{ allPeople.filter((p) => p.is_resident && !p.is_owner).length }})
								</Button>
							</div>
							<div class="flex gap-2">
								<Button size="xs" variant="ghost" @click="selectAllRecipients">Select All</Button>
								<Button size="xs" variant="ghost" @click="clearRecipients">Clear</Button>
							</div>
						</div>

						<!-- Recipients List -->
						<div class="border rounded-lg max-h-[400px] overflow-y-auto">
							<div v-if="loadingRecipients" class="p-4 text-center">
								<Icon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6 text-gray-400" />
							</div>
							<div v-else-if="filteredRecipients.length === 0" class="p-4 text-center text-gray-500">
								No recipients found
							</div>
							<div v-else class="divide-y">
								<label
									v-for="person in filteredRecipients"
									:key="person.id"
									class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
									<input
										type="checkbox"
										:value="person.id"
										v-model="selectedRecipients"
										class="rounded border-gray-300" />
									<Avatar :alt="`${person.first_name} ${person.last_name}`" size="sm" />
									<div class="flex-1 min-w-0">
										<p class="font-medium text-sm">{{ person.first_name }} {{ person.last_name }}</p>
										<p class="text-xs text-gray-500 truncate">{{ person.email }}</p>
									</div>
									<div class="flex gap-1">
										<Badge v-if="person.is_owner" color="green" variant="soft" size="xs">Owner</Badge>
									</div>
								</label>
							</div>
						</div>

						<!-- Selected Count -->
						<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<span class="text-sm">
								<strong>{{ selectedRecipients.length }}</strong>
								recipients selected
							</span>
						</div>
					</div>

					<template #footer>
						<div class="flex justify-end gap-3">
							<Button color="gray" variant="ghost" @click="showSendModal = false">Cancel</Button>
							<Button
								color="green"
								:loading="sending"
								:disabled="selectedRecipients.length === 0"
								icon="i-heroicons-paper-airplane"
								@click="sendAnnouncement">
								Send to {{ selectedRecipients.length }} recipients
							</Button>
						</div>
					</template>
				</Card>
			</UModal>
		</div>
	</div>
</template>
