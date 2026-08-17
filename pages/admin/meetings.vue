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

// Announcement picker state
interface AnnouncementOption {
  id: number;
  title: string;
  url: string | null;
  status: string | null;
  private: boolean | null;
  date_sent: string | null;
}
const announcementOptions = ref<AnnouncementOption[]>([]);
const selectedAnnouncements = ref<number[]>([]);
const announcementSearch = ref('');

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

// Presets only — the field accepts any text, so a meeting held somewhere
// unusual doesn't have to be mislabelled. Keep in sync with LOCATION_PRESETS in
// scripts/setup-meeting-records.mjs.
const LOCATION_PRESETS = [
  'Community Room',
  'Pool Deck',
  'Lobby',
  'Rooftop Terrace',
  'Zoom',
  'Hybrid — Community Room + Zoom',
  'Offsite',
];

// Meeting form state. Modelled with non-nullable fields (empty string rather
// than null) so the inputs bind cleanly; nulls are restored in saveMeeting().
interface MeetingFormState {
  title: string;
  description: string;
  category: NonNullable<Meeting['category']>;
  status: NonNullable<Meeting['status']>;
  date: string;
  time: string;
  location: NonNullable<Meeting['location']>;
  video_link: string;
  url: string;
  canceled: boolean;
  cancellation_note: string;
  recording_link: string;
  recording_passcode: string;
}

const meetingForm = ref<MeetingFormState>({
  title: '',
  description: '',
  category: 'Board Meeting',
  status: 'draft',
  date: '',
  time: '',
  location: 'Community Room',
  video_link: '',
  url: '',
  canceled: false,
  cancellation_note: '',
  recording_link: '',
  recording_passcode: '',
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
            'canceled',
            'cancellation_note',
            'recording_link',
            'recording_passcode',
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

async function fetchAnnouncements() {
  try {
    announcementOptions.value =
      (await $fetch<AnnouncementOption[]>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'announcements',
          operation: 'list',
          query: {
            fields: ['id', 'title', 'url', 'status', 'private', 'date_sent'],
            sort: ['-date_sent', '-id'],
            limit: -1,
          },
        },
      })) || [];
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
  }
}

/**
 * Only sent, non-private announcements with a slug reach the public page — the
 * board-meetings endpoint filters the rest. Flag those here so attaching one
 * doesn't look like it worked when nothing will show. Status casing is
 * inconsistent in the data ("sent" and "Sent" both occur), hence the lowercasing.
 */
function announcementPublishable(a: AnnouncementOption) {
  return Boolean(a.url) && String(a.status).toLowerCase() === 'sent' && !a.private;
}

const filteredAnnouncements = computed(() => {
  const query = announcementSearch.value.trim().toLowerCase();
  if (!query) return announcementOptions.value;
  return announcementOptions.value.filter((a) => a.title?.toLowerCase().includes(query));
});

const selectedAnnouncementDetails = computed(() =>
  selectedAnnouncements.value
    .map((id) => announcementOptions.value.find((a) => a.id === id))
    .filter((a): a is AnnouncementOption => Boolean(a))
);

const hiddenAnnouncementCount = computed(
  () => selectedAnnouncementDetails.value.filter((a) => !announcementPublishable(a)).length
);

function toggleAnnouncement(id: number) {
  const index = selectedAnnouncements.value.indexOf(id);
  if (index === -1) selectedAnnouncements.value.push(id);
  else selectedAnnouncements.value.splice(index, 1);
}

async function loadMeetingAnnouncements(meetingId: number) {
  try {
    const rows = await $fetch<{ announcements_id: number }[]>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'meetings_announcements',
        operation: 'list',
        query: {
          fields: ['announcements_id'],
          filter: { meetings_id: { _eq: meetingId } },
          limit: -1,
        },
      },
    });
    selectedAnnouncements.value = (rows || []).map((r) => r.announcements_id).filter(Boolean);
  } catch (error) {
    console.error('Failed to load meeting announcements:', error);
    selectedAnnouncements.value = [];
  }
}

/**
 * Diff the junction rows rather than replacing the whole M2M array, so an
 * unrelated concurrent edit isn't clobbered and unchanged rows keep their ids.
 */
async function syncMeetingAnnouncements(meetingId: number) {
  const existing = await $fetch<{ id: number; announcements_id: number }[]>('/api/directus/items', {
    method: 'POST',
    body: {
      collection: 'meetings_announcements',
      operation: 'list',
      query: {
        fields: ['id', 'announcements_id'],
        filter: { meetings_id: { _eq: meetingId } },
        limit: -1,
      },
    },
  });

  const wanted = new Set(selectedAnnouncements.value);
  const present = new Set((existing || []).map((r) => r.announcements_id));

  const toDelete = (existing || []).filter((r) => !wanted.has(r.announcements_id)).map((r) => r.id);
  const toCreate = [...wanted]
    .filter((id) => !present.has(id))
    .map((id) => ({ meetings_id: meetingId, announcements_id: id }));

  if (toDelete.length) {
    await $fetch('/api/directus/items', {
      method: 'POST',
      body: { collection: 'meetings_announcements', operation: 'delete', id: toDelete },
    });
  }
  if (toCreate.length) {
    await $fetch('/api/directus/items', {
      method: 'POST',
      body: { collection: 'meetings_announcements', operation: 'create', data: toCreate },
    });
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
  selectedAnnouncements.value = [];
  announcementSearch.value = '';

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
    canceled: false,
    cancellation_note: '',
    recording_link: '',
    recording_passcode: '',
  };
  showMeetingModal.value = true;
}

function openEditModal(meeting: Meeting) {
  isEditing.value = true;
  selectedMeeting.value = meeting;
  announcementSearch.value = '';
  selectedAnnouncements.value = [];
  if (meeting.id) loadMeetingAnnouncements(meeting.id);

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
    canceled: meeting.canceled === true,
    cancellation_note: meeting.cancellation_note || '',
    recording_link: meeting.recording_link || '',
    recording_passcode: meeting.recording_passcode || '',
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
      canceled: meetingForm.value.canceled === true,
      cancellation_note: meetingForm.value.canceled
        ? meetingForm.value.cancellation_note || null
        : null,
      recording_link: meetingForm.value.recording_link || null,
      recording_passcode: meetingForm.value.recording_passcode || null,
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
      await syncMeetingAnnouncements(Number(selectedMeeting.value.id));
      toast.add({
        title: 'Meeting Updated',
        description: `${meetingForm.value.title} has been updated`,
        color: 'green',
      });
    } else {
      const created = await $fetch<Meeting>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'meetings',
          operation: 'create',
          data,
        },
      });
      // Junction rows need the new meeting's id, so this runs after the create.
      if (created?.id) await syncMeetingAnnouncements(Number(created.id));
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
  fetchAnnouncements();
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
              <div class="flex flex-wrap items-center gap-1.5">
                <Badge :color="getStatusColor(row.status)" variant="soft" size="sm">
                  {{ row.status }}
                </Badge>
                <Badge v-if="row.canceled" color="red" variant="soft" size="sm">canceled</Badge>
              </div>
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

            <!-- Location. Free text with presets — see LOCATION_PRESETS. -->
            <FormGroup
              label="Location"
              hint="Pick a preset or type anywhere else. Set the Zoom link separately if it's also online."
            >
              <Input v-model="meetingForm.location" list="meeting-locations" placeholder="Community Room" />
              <datalist id="meeting-locations">
                <option v-for="preset in LOCATION_PRESETS" :key="preset" :value="preset" />
              </datalist>
            </FormGroup>

            <!-- Live Zoom Link -->
            <FormGroup
              label="Live Zoom Link"
              hint="Link to join the live meeting. Hidden on the public page once the meeting date passes."
            >
              <Input v-model="meetingForm.video_link" placeholder="https://zoom.us/j/..." />
            </FormGroup>

            <!-- Recording -->
            <div class="grid grid-cols-3 gap-4">
              <FormGroup
                label="Recording Link"
                hint="Zoom 'Copy shareable link'. Shown publicly after the meeting."
                class="col-span-2"
              >
                <Input
                  v-model="meetingForm.recording_link"
                  placeholder="https://us06web.zoom.us/rec/share/..."
                />
              </FormGroup>
              <FormGroup label="Recording Passcode">
                <Input v-model="meetingForm.recording_passcode" placeholder="7hVb*s68" />
              </FormGroup>
            </div>

            <!-- Related announcements -->
            <FormGroup
              label="Related Announcements"
              hint="Shown publicly on /board-meetings. Only sent, non-private announcements appear there."
            >
              <div class="rounded-lg border dark:border-gray-700">
                <div class="border-b p-2 dark:border-gray-700">
                  <Input
                    v-model="announcementSearch"
                    icon="i-heroicons-magnifying-glass"
                    placeholder="Search announcements..."
                    size="sm"
                  />
                </div>

                <div class="max-h-56 overflow-y-auto p-1">
                  <p
                    v-if="!filteredAnnouncements.length"
                    class="px-2 py-4 text-center text-sm text-gray-500"
                  >
                    No announcements match "{{ announcementSearch }}"
                  </p>
                  <label
                    v-for="announcement in filteredAnnouncements"
                    :key="announcement.id"
                    class="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Checkbox
                      :model-value="selectedAnnouncements.includes(announcement.id)"
                      class="mt-0.5"
                      @update:model-value="toggleAnnouncement(announcement.id)"
                    />
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm">{{ announcement.title }}</span>
                      <span class="flex items-center gap-2 text-xs text-gray-500">
                        <span v-if="announcement.date_sent">{{ formatDate(announcement.date_sent.slice(0, 10)) }}</span>
                        <Badge
                          v-if="!announcementPublishable(announcement)"
                          color="amber"
                          variant="soft"
                          size="xs"
                        >
                          {{ announcement.private ? 'private' : announcement.status }}
                        </Badge>
                      </span>
                    </span>
                  </label>
                </div>

                <div
                  v-if="selectedAnnouncements.length"
                  class="border-t px-3 py-2 text-xs text-gray-500 dark:border-gray-700"
                >
                  {{ selectedAnnouncements.length }} selected
                  <span v-if="hiddenAnnouncementCount" class="text-amber-600">
                    — {{ hiddenAnnouncementCount }} won't show publicly (not sent, or private)
                  </span>
                </div>
              </div>
            </FormGroup>

            <!-- Cancellation -->
            <div class="rounded-lg border p-3 dark:border-gray-700">
              <label class="flex cursor-pointer items-center gap-2">
                <Checkbox v-model="meetingForm.canceled" />
                <span class="text-sm font-medium">This meeting was canceled</span>
              </label>
              <FormGroup
                v-if="meetingForm.canceled"
                label="Reason"
                hint="Shown publicly beneath the canceled meeting"
                class="mt-3"
              >
                <Textarea
                  v-model="meetingForm.cancellation_note"
                  placeholder="Canceled for lack of quorum. Rescheduled to March 4."
                  rows="2"
                />
              </FormGroup>
            </div>

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
