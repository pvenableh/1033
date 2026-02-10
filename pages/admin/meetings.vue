<script setup lang="ts">
import type { Meeting, DirectusFile } from '~/types/directus';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

useSeoMeta({
  title: 'Meetings - Admin',
});

const toast = useToast();
const { isAdmin, isBoardMember } = useRoles();
const filesComposable = useDirectusFiles();
const config = useRuntimeConfig();

// State
const meetings = ref<Meeting[]>([]);
const loading = ref(true);
const selectedMeeting = ref<Meeting | null>(null);
const showMeetingModal = ref(false);
const showDeleteModal = ref(false);
const saving = ref(false);
const isEditing = ref(false);

// File upload state
const agendaFileInput = ref<HTMLInputElement | null>(null);
const minutesFileInput = ref<HTMLInputElement | null>(null);
const uploadingAgenda = ref(false);
const uploadingMinutes = ref(false);
const agendaFile = ref<{ id: string; filename: string; type: string; filesize: number } | null>(null);
const minutesFile = ref<{ id: string; filename: string; type: string; filesize: number } | null>(null);

// Filters
const statusFilter = ref('all');
const categoryFilter = ref('all');
const searchQuery = ref('');

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

const categoryOptions = [
  { label: 'All Categories', value: 'all' },
  { label: 'Board Meeting', value: 'Board Meeting' },
];

const locationOptions = [
  { label: 'Community Room', value: 'Community Room' },
  { label: 'Zoom', value: 'Zoom' },
];

// Meeting form state
const meetingForm = ref<Partial<Meeting>>({
  title: '',
  description: '',
  category: 'Board Meeting',
  status: 'draft',
  date: '',
  time: '',
  location: 'Community Room',
  video_link: '',
  url: '',
});

// Permission checks
const hasAccess = computed(() => isAdmin.value || isBoardMember.value);

// Computed
const filteredMeetings = computed(() => {
  let result = meetings.value;

  if (statusFilter.value !== 'all') {
    result = result.filter((m) => m.status === statusFilter.value);
  }

  if (categoryFilter.value !== 'all') {
    result = result.filter((m) => m.category === categoryFilter.value);
  }

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
  published: meetings.value.filter((m) => m.status === 'published').length,
  draft: meetings.value.filter((m) => m.status === 'draft').length,
  archived: meetings.value.filter((m) => m.status === 'archived').length,
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
            'category',
            'status',
            'date',
            'time',
            'location',
            'video_link',
            'url',
            'sort',
            'date_created',
            'date_updated',
            'user_created.id',
            'user_created.first_name',
            'user_created.last_name',
            'agenda_file.id',
            'agenda_file.filename_download',
            'agenda_file.type',
            'agenda_file.filesize',
            'minutes_file.id',
            'minutes_file.filename_download',
            'minutes_file.type',
            'minutes_file.filesize',
            'files.directus_files_id.id',
            'files.directus_files_id.title',
            'files.directus_files_id.tags',
          ],
          sort: ['-date'],
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

function getDefaultDate() {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now.toISOString().slice(0, 10);
}

function openCreateModal() {
  isEditing.value = false;
  selectedMeeting.value = null;
  agendaFile.value = null;
  minutesFile.value = null;

  meetingForm.value = {
    title: '',
    description: '',
    category: 'Board Meeting',
    status: 'draft',
    date: getDefaultDate(),
    time: '19:00',
    location: 'Community Room',
    video_link: '',
    url: '',
  };
  showMeetingModal.value = true;
}

function openEditModal(meeting: Meeting) {
  isEditing.value = true;
  selectedMeeting.value = meeting;

  // Set file state from existing meeting data
  const af = meeting.agenda_file;
  if (af && typeof af === 'object' && af.id) {
    agendaFile.value = {
      id: af.id,
      filename: af.filename_download || 'Agenda',
      type: af.type || '',
      filesize: af.filesize || 0,
    };
  } else {
    agendaFile.value = null;
  }

  const mf = meeting.minutes_file;
  if (mf && typeof mf === 'object' && mf.id) {
    minutesFile.value = {
      id: mf.id,
      filename: mf.filename_download || 'Minutes',
      type: mf.type || '',
      filesize: mf.filesize || 0,
    };
  } else {
    minutesFile.value = null;
  }

  meetingForm.value = {
    title: meeting.title || '',
    description: meeting.description || '',
    category: meeting.category || 'Board Meeting',
    status: meeting.status || 'draft',
    date: meeting.date || '',
    time: meeting.time || '',
    location: meeting.location || 'Community Room',
    video_link: meeting.video_link || '',
    url: meeting.url || '',
  };
  showMeetingModal.value = true;
}

function confirmDelete(meeting: Meeting) {
  selectedMeeting.value = meeting;
  showDeleteModal.value = true;
}

async function uploadFile(event: Event, type: 'agenda' | 'minutes') {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (type === 'agenda') {
    uploadingAgenda.value = true;
  } else {
    uploadingMinutes.value = true;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const result = await filesComposable.uploadFiles(formData);
    const uploadedFile = Array.isArray(result) ? result[0] : result;

    if (uploadedFile?.id) {
      const fileInfo = {
        id: uploadedFile.id,
        filename: uploadedFile.filename_download || file.name,
        type: uploadedFile.type || file.type,
        filesize: uploadedFile.filesize || file.size,
      };

      if (type === 'agenda') {
        agendaFile.value = fileInfo;
      } else {
        minutesFile.value = fileInfo;
      }

      toast.add({
        title: 'Uploaded',
        description: `${type === 'agenda' ? 'Agenda' : 'Minutes'} file uploaded`,
        color: 'green',
      });
    }
  } catch (error: any) {
    console.error('Upload failed:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to upload file',
      color: 'red',
    });
  } finally {
    if (type === 'agenda') {
      uploadingAgenda.value = false;
    } else {
      uploadingMinutes.value = false;
    }
    if (input) input.value = '';
  }
}

function removeFile(type: 'agenda' | 'minutes') {
  if (type === 'agenda') {
    agendaFile.value = null;
  } else {
    minutesFile.value = null;
  }
}

function getFileIcon(type: string): string {
  if (type?.startsWith('image/')) return 'i-lucide-image';
  if (type?.includes('pdf')) return 'i-lucide-file-text';
  if (type?.includes('word') || type?.includes('document')) return 'i-lucide-file-text';
  if (type?.includes('excel') || type?.includes('spreadsheet')) return 'i-lucide-file-spreadsheet';
  return 'i-lucide-file';
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileDownloadUrl(fileId: string): string {
  return `${config.public.directusUrl}/assets/${fileId}`;
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

  if (!meetingForm.value.date) {
    toast.add({
      title: 'Error',
      description: 'Meeting date is required',
      color: 'red',
    });
    return;
  }

  saving.value = true;
  try {
    const data: Record<string, any> = {
      title: meetingForm.value.title,
      description: meetingForm.value.description || null,
      category: meetingForm.value.category || 'Board Meeting',
      status: meetingForm.value.status || 'draft',
      date: meetingForm.value.date,
      time: meetingForm.value.time || null,
      location: meetingForm.value.location || null,
      video_link: meetingForm.value.video_link || null,
      url: meetingForm.value.url || null,
      agenda_file: agendaFile.value?.id || null,
      minutes_file: minutesFile.value?.id || null,
    };

    if (isEditing.value && selectedMeeting.value) {
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
    published: 'green',
    draft: 'amber',
    archived: 'gray',
  };
  return colors[status] || 'gray';
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return 'N/A';
  const [year, month, day] = dateStr.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string | undefined | null) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':');
  const d = new Date();
  d.setHours(Number(hour), Number(minute));
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function isPastMeeting(dateStr: string) {
  return new Date(dateStr) < new Date();
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
            Schedule and manage board meetings
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
              <div class="text-2xl font-bold text-green-600">{{ meetingStats.published }}</div>
              <div class="text-sm text-gray-500">Published</div>
            </div>
          </Card>
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-amber-600">{{ meetingStats.draft }}</div>
              <div class="text-sm text-gray-500">Drafts</div>
            </div>
          </Card>
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-500">{{ meetingStats.archived }}</div>
              <div class="text-sm text-gray-500">Archived</div>
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
            class="md:w-48"
          />
          <SelectMenu
            v-model="categoryFilter"
            :options="categoryOptions"
            class="md:w-48"
          />
        </div>

        <!-- Meetings Table -->
        <Card>
          <Table
            :rows="filteredMeetings"
            :columns="[
              { key: 'title', label: 'Meeting' },
              { key: 'date', label: 'Date & Time' },
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
                <p v-if="row.category" class="text-xs text-gray-500">
                  {{ row.category }}
                </p>
              </div>
            </template>

            <template #date-data="{ row }">
              <div class="text-sm">
                <p :class="{ 'text-gray-400': isPastMeeting(row.date) }">{{ formatDate(row.date) }}</p>
                <p v-if="row.time" class="text-xs text-gray-500">
                  {{ formatTime(row.time) }}
                </p>
              </div>
            </template>

            <template #location-data="{ row }">
              <div class="flex items-center gap-2">
                <Icon
                  :name="row.location === 'Zoom' ? 'i-heroicons-video-camera' : 'i-heroicons-map-pin'"
                  class="w-4 h-4 text-gray-500"
                />
                <span class="text-sm">
                  {{ row.location || 'TBD' }}
                </span>
              </div>
            </template>

            <template #status-data="{ row }">
              <Badge :color="getStatusColor(row.status)" variant="soft" size="sm">
                {{ row.status }}
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

            <!-- Category and Status -->
            <div class="grid grid-cols-2 gap-4">
              <FormGroup label="Category">
                <SelectMenu
                  v-model="meetingForm.category"
                  :options="categoryOptions.slice(1)"
                />
              </FormGroup>
              <FormGroup label="Status">
                <SelectMenu
                  v-model="meetingForm.status"
                  :options="statusOptions.slice(1)"
                />
              </FormGroup>
            </div>

            <!-- Date/Time -->
            <div class="grid grid-cols-2 gap-4">
              <FormGroup label="Date" required>
                <Input v-model="meetingForm.date" type="date" />
              </FormGroup>
              <FormGroup label="Time">
                <Input v-model="meetingForm.time" type="time" />
              </FormGroup>
            </div>

            <!-- Location -->
            <FormGroup label="Location">
              <SelectMenu
                v-model="meetingForm.location"
                :options="locationOptions"
              />
            </FormGroup>

            <!-- Video Link -->
            <FormGroup v-if="meetingForm.location === 'Zoom'" label="Video Link">
              <Input v-model="meetingForm.video_link" placeholder="https://zoom.us/..." />
            </FormGroup>

            <!-- URL -->
            <FormGroup label="URL">
              <Input v-model="meetingForm.url" placeholder="Meeting URL" />
            </FormGroup>

            <!-- Description -->
            <FormGroup label="Description">
              <Textarea
                v-model="meetingForm.description"
                placeholder="Brief description of the meeting purpose..."
                rows="3"
              />
            </FormGroup>

            <!-- Agenda File -->
            <FormGroup label="Agenda">
              <div v-if="agendaFile" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div class="flex items-center gap-3 min-w-0">
                  <Icon :name="getFileIcon(agendaFile.type)" class="w-5 h-5 text-gray-500 shrink-0" />
                  <div class="min-w-0">
                    <a
                      :href="getFileDownloadUrl(agendaFile.id)"
                      target="_blank"
                      class="font-medium text-sm text-primary hover:underline truncate block"
                    >
                      {{ agendaFile.filename }}
                    </a>
                    <div class="text-xs text-gray-500">{{ formatFileSize(agendaFile.filesize) }}</div>
                  </div>
                </div>
                <Button variant="ghost" size="xs" @click="removeFile('agenda')">
                  <Icon name="i-heroicons-x-mark" class="w-4 h-4" />
                </Button>
              </div>
              <div v-else class="flex gap-2">
                <Button variant="outline" size="sm" :loading="uploadingAgenda" @click="agendaFileInput?.click()">
                  <Icon name="i-lucide-upload" class="w-4 h-4 mr-2" />
                  Upload Agenda
                </Button>
              </div>
              <input
                ref="agendaFileInput"
                type="file"
                class="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                @change="uploadFile($event, 'agenda')"
              />
            </FormGroup>

            <!-- Minutes File -->
            <FormGroup label="Minutes">
              <div v-if="minutesFile" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div class="flex items-center gap-3 min-w-0">
                  <Icon :name="getFileIcon(minutesFile.type)" class="w-5 h-5 text-gray-500 shrink-0" />
                  <div class="min-w-0">
                    <a
                      :href="getFileDownloadUrl(minutesFile.id)"
                      target="_blank"
                      class="font-medium text-sm text-primary hover:underline truncate block"
                    >
                      {{ minutesFile.filename }}
                    </a>
                    <div class="text-xs text-gray-500">{{ formatFileSize(minutesFile.filesize) }}</div>
                  </div>
                </div>
                <Button variant="ghost" size="xs" @click="removeFile('minutes')">
                  <Icon name="i-heroicons-x-mark" class="w-4 h-4" />
                </Button>
              </div>
              <div v-else class="flex gap-2">
                <Button variant="outline" size="sm" :loading="uploadingMinutes" @click="minutesFileInput?.click()">
                  <Icon name="i-lucide-upload" class="w-4 h-4 mr-2" />
                  Upload Minutes
                </Button>
              </div>
              <input
                ref="minutesFileInput"
                type="file"
                class="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                @change="uploadFile($event, 'minutes')"
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
