<script setup lang="ts">
interface Meeting {
  id: string | number;
  title: string;
  description?: string;
  meeting_type: 'board' | 'annual' | 'special' | 'committee' | 'other';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start_datetime: string;
  end_datetime?: string;
  location?: string;
  virtual_link?: string;
  is_virtual: boolean;
  agenda?: string;
  minutes?: string;
  attendees_count?: number;
  date_created?: string;
  date_updated?: string;
  user_created?: { id: string; first_name: string; last_name: string };
}

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

const toast = useToast();
const { isAdmin, isBoardMember } = useRoles();

// State
const meetings = ref<Meeting[]>([]);
const loading = ref(true);
const selectedMeeting = ref<Meeting | null>(null);
const showMeetingModal = ref(false);
const showDeleteModal = ref(false);
const saving = ref(false);
const isEditing = ref(false);

// Filters
const statusFilter = ref('all');
const typeFilter = ref('all');
const searchQuery = ref('');

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Board Meeting', value: 'board' },
  { label: 'Annual Meeting', value: 'annual' },
  { label: 'Special Meeting', value: 'special' },
  { label: 'Committee', value: 'committee' },
  { label: 'Other', value: 'other' },
];

const meetingTypeLabels: Record<string, string> = {
  board: 'Board Meeting',
  annual: 'Annual Meeting',
  special: 'Special Meeting',
  committee: 'Committee',
  other: 'Other',
};

// Meeting form state
const meetingForm = ref<Partial<Meeting>>({
  title: '',
  description: '',
  meeting_type: 'board',
  status: 'scheduled',
  start_datetime: '',
  end_datetime: '',
  location: '',
  virtual_link: '',
  is_virtual: false,
  agenda: '',
});

// Permission checks
const hasAccess = computed(() => isAdmin.value || isBoardMember.value);

// Computed
const filteredMeetings = computed(() => {
  let result = meetings.value;

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter((m) => m.status === statusFilter.value);
  }

  // Filter by type
  if (typeFilter.value !== 'all') {
    result = result.filter((m) => m.meeting_type === typeFilter.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (m) =>
        m.title?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query) ||
        m.location?.toLowerCase().includes(query)
    );
  }

  return result;
});

// Stats
const meetingStats = computed(() => ({
  total: meetings.value.length,
  scheduled: meetings.value.filter((m) => m.status === 'scheduled').length,
  completed: meetings.value.filter((m) => m.status === 'completed').length,
  cancelled: meetings.value.filter((m) => m.status === 'cancelled').length,
}));

// Methods
async function fetchMeetings() {
  loading.value = true;
  try {
    const response = await $fetch<Meeting[]>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'meetings',
        operation: 'list',
        query: {
          fields: [
            'id',
            'title',
            'description',
            'meeting_type',
            'status',
            'start_datetime',
            'end_datetime',
            'location',
            'virtual_link',
            'is_virtual',
            'agenda',
            'minutes',
            'attendees_count',
            'date_created',
            'date_updated',
            'user_created.id',
            'user_created.first_name',
            'user_created.last_name',
          ],
          sort: ['-start_datetime'],
          limit: -1,
        },
      },
    });
    meetings.value = response || [];
  } catch (error) {
    console.error('Failed to fetch meetings:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to load meetings',
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  isEditing.value = false;
  selectedMeeting.value = null;
  // Set default start datetime to next hour
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  const defaultStart = now.toISOString().slice(0, 16);
  now.setHours(now.getHours() + 1);
  const defaultEnd = now.toISOString().slice(0, 16);

  meetingForm.value = {
    title: '',
    description: '',
    meeting_type: 'board',
    status: 'scheduled',
    start_datetime: defaultStart,
    end_datetime: defaultEnd,
    location: '',
    virtual_link: '',
    is_virtual: false,
    agenda: '',
  };
  showMeetingModal.value = true;
}

function openEditModal(meeting: Meeting) {
  isEditing.value = true;
  selectedMeeting.value = meeting;
  meetingForm.value = {
    title: meeting.title,
    description: meeting.description || '',
    meeting_type: meeting.meeting_type,
    status: meeting.status,
    start_datetime: meeting.start_datetime ? meeting.start_datetime.slice(0, 16) : '',
    end_datetime: meeting.end_datetime ? meeting.end_datetime.slice(0, 16) : '',
    location: meeting.location || '',
    virtual_link: meeting.virtual_link || '',
    is_virtual: meeting.is_virtual || false,
    agenda: meeting.agenda || '',
  };
  showMeetingModal.value = true;
}

function confirmDelete(meeting: Meeting) {
  selectedMeeting.value = meeting;
  showDeleteModal.value = true;
}

async function saveMeeting() {
  if (!meetingForm.value.title) {
    toast.add({
      title: 'Error',
      description: 'Meeting title is required',
      color: 'red',
    });
    return;
  }

  saving.value = true;
  try {
    const data = {
      ...meetingForm.value,
      status: meetingForm.value.status || 'scheduled',
    };

    if (isEditing.value && selectedMeeting.value) {
      // Update existing meeting
      await $fetch('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'meetings',
          operation: 'update',
          id: selectedMeeting.value.id,
          data,
        },
      });
      toast.add({
        title: 'Meeting Updated',
        description: `${meetingForm.value.title} has been updated`,
        color: 'green',
      });
    } else {
      // Create new meeting
      await $fetch('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'meetings',
          operation: 'create',
          data,
        },
      });
      toast.add({
        title: 'Meeting Created',
        description: `${meetingForm.value.title} has been created`,
        color: 'green',
      });
    }

    showMeetingModal.value = false;
    await fetchMeetings();
  } catch (error: any) {
    console.error('Failed to save meeting:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to save meeting',
      color: 'red',
    });
  } finally {
    saving.value = false;
  }
}

async function deleteMeeting() {
  if (!selectedMeeting.value) return;

  saving.value = true;
  try {
    await $fetch('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'meetings',
        operation: 'delete',
        id: selectedMeeting.value.id,
      },
    });

    toast.add({
      title: 'Meeting Deleted',
      description: `${selectedMeeting.value.title} has been deleted`,
      color: 'green',
    });

    showDeleteModal.value = false;
    await fetchMeetings();
  } catch (error: any) {
    console.error('Failed to delete meeting:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to delete meeting',
      color: 'red',
    });
  } finally {
    saving.value = false;
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    scheduled: 'blue',
    in_progress: 'amber',
    completed: 'green',
    cancelled: 'gray',
  };
  return colors[status] || 'gray';
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    board: 'primary',
    annual: 'purple',
    special: 'amber',
    committee: 'cyan',
    other: 'gray',
  };
  return colors[type] || 'gray';
}

function formatDateTime(dateStr: string | undefined) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Initialize
onMounted(() => {
  fetchMeetings();
});
</script>

<template>
  <div class="admin-page t-bg min-h-full">
    <div class="container mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">Meetings</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Schedule and manage board meetings, annual meetings, and more
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center gap-3">
          <Button
            v-if="hasAccess"
            color="primary"
            icon="i-heroicons-plus"
            @click="openCreateModal"
          >
            New Meeting
          </Button>
        </div>
      </div>

      <!-- Access Denied -->
      <div v-if="!hasAccess" class="text-center py-12">
        <Icon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">
          You need board member or administrator privileges to manage meetings.
        </p>
      </div>

      <!-- Meetings Management -->
      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ meetingStats.total }}</div>
              <div class="text-sm text-gray-500">Total Meetings</div>
            </div>
          </Card>
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ meetingStats.scheduled }}</div>
              <div class="text-sm text-gray-500">Scheduled</div>
            </div>
          </Card>
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ meetingStats.completed }}</div>
              <div class="text-sm text-gray-500">Completed</div>
            </div>
          </Card>
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-500">{{ meetingStats.cancelled }}</div>
              <div class="text-sm text-gray-500">Cancelled</div>
            </div>
          </Card>
        </div>

        <!-- Filters -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search meetings..."
            class="md:w-64"
          />
          <SelectMenu
            v-model="statusFilter"
            :options="statusOptions"
            value-attribute="value"
            option-attribute="label"
            class="md:w-48"
          />
          <SelectMenu
            v-model="typeFilter"
            :options="typeOptions"
            value-attribute="value"
            option-attribute="label"
            class="md:w-48"
          />
        </div>

        <!-- Meetings Table -->
        <Card>
          <Table
            :rows="filteredMeetings"
            :columns="[
              { key: 'title', label: 'Meeting' },
              { key: 'type', label: 'Type' },
              { key: 'datetime', label: 'Date & Time' },
              { key: 'location', label: 'Location' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: 'Actions' },
            ]"
            :loading="loading"
            :empty-state="{ icon: 'i-heroicons-calendar', label: 'No meetings found' }"
          >
            <template #title-data="{ row }">
              <div>
                <p class="font-medium">{{ row.title }}</p>
                <p v-if="row.description" class="text-xs text-gray-500 truncate max-w-xs">
                  {{ row.description }}
                </p>
              </div>
            </template>

            <template #type-data="{ row }">
              <Badge :color="getTypeColor(row.meeting_type)" variant="soft" size="sm">
                {{ meetingTypeLabels[row.meeting_type] || row.meeting_type }}
              </Badge>
            </template>

            <template #datetime-data="{ row }">
              <div class="text-sm">
                <p>{{ formatDate(row.start_datetime) }}</p>
                <p class="text-xs text-gray-500">
                  {{ new Date(row.start_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }}
                </p>
              </div>
            </template>

            <template #location-data="{ row }">
              <div class="flex items-center gap-2">
                <Icon
                  :name="row.is_virtual ? 'i-heroicons-video-camera' : 'i-heroicons-map-pin'"
                  class="w-4 h-4 text-gray-500"
                />
                <span class="text-sm">
                  {{ row.is_virtual ? 'Virtual' : (row.location || 'TBD') }}
                </span>
              </div>
            </template>

            <template #status-data="{ row }">
              <Badge :color="getStatusColor(row.status)" variant="soft" size="sm">
                {{ row.status.replace('_', ' ') }}
              </Badge>
            </template>

            <template #actions-data="{ row }">
              <div class="flex items-center gap-2">
                <Button
                  size="xs"
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  @click="openEditModal(row)"
                >
                  Edit
                </Button>
                <Button
                  size="xs"
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  @click="confirmDelete(row)"
                />
              </div>
            </template>
          </Table>
        </Card>
      </template>

      <!-- Meeting Modal -->
      <Modal v-model="showMeetingModal" :ui="{ width: 'sm:max-w-2xl' }">
        <Card>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ isEditing ? 'Edit Meeting' : 'New Meeting' }}
              </h3>
              <Button
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showMeetingModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <!-- Title -->
            <FormGroup label="Title" required>
              <Input v-model="meetingForm.title" placeholder="Meeting title" />
            </FormGroup>

            <!-- Type and Status -->
            <div class="grid grid-cols-2 gap-4">
              <FormGroup label="Meeting Type">
                <SelectMenu
                  v-model="meetingForm.meeting_type"
                  :options="typeOptions.slice(1)"
                  value-attribute="value"
                  option-attribute="label"
                />
              </FormGroup>
              <FormGroup label="Status">
                <SelectMenu
                  v-model="meetingForm.status"
                  :options="statusOptions.slice(1)"
                  value-attribute="value"
                  option-attribute="label"
                />
              </FormGroup>
            </div>

            <!-- Date/Time -->
            <div class="grid grid-cols-2 gap-4">
              <FormGroup label="Start Date & Time" required>
                <Input v-model="meetingForm.start_datetime" type="datetime-local" />
              </FormGroup>
              <FormGroup label="End Date & Time">
                <Input v-model="meetingForm.end_datetime" type="datetime-local" />
              </FormGroup>
            </div>

            <!-- Virtual toggle -->
            <div class="flex items-center gap-3">
              <Checkbox v-model="meetingForm.is_virtual" label="This is a virtual meeting" />
            </div>

            <!-- Location / Virtual Link -->
            <FormGroup v-if="!meetingForm.is_virtual" label="Location">
              <Input v-model="meetingForm.location" placeholder="Meeting location" />
            </FormGroup>
            <FormGroup v-else label="Virtual Meeting Link">
              <Input v-model="meetingForm.virtual_link" placeholder="https://zoom.us/..." />
            </FormGroup>

            <!-- Description -->
            <FormGroup label="Description">
              <Textarea
                v-model="meetingForm.description"
                placeholder="Brief description of the meeting purpose..."
                rows="3"
              />
            </FormGroup>

            <!-- Agenda -->
            <FormGroup label="Agenda">
              <Textarea
                v-model="meetingForm.agenda"
                placeholder="Meeting agenda items..."
                rows="4"
              />
            </FormGroup>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <Button color="gray" variant="ghost" @click="showMeetingModal = false">
                Cancel
              </Button>
              <Button color="primary" :loading="saving" @click="saveMeeting">
                {{ isEditing ? 'Save Changes' : 'Create Meeting' }}
              </Button>
            </div>
          </template>
        </Card>
      </Modal>

      <!-- Delete Confirmation Modal -->
      <Modal v-model="showDeleteModal">
        <Card>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
              </div>
              <h3 class="text-lg font-semibold">Delete Meeting</h3>
            </div>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete
            <strong>{{ selectedMeeting?.title }}</strong>?
            This action cannot be undone.
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <Button color="gray" variant="ghost" @click="showDeleteModal = false">
                Cancel
              </Button>
              <Button color="red" :loading="saving" @click="deleteMeeting">
                Delete Meeting
              </Button>
            </div>
          </template>
        </Card>
      </Modal>
    </div>
  </div>
</template>
