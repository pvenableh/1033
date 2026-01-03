<script setup lang="ts">
import type { Announcement, DirectusFile, DirectusFolder } from '~/types/directus';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const config = useRuntimeConfig();
const { isAdmin, isBoardMember } = useRoles();
const { canManage } = useUserPermissions();

// Default folder for announcement uploads
const ANNOUNCEMENT_UPLOADS_FOLDER = '2ff19b77-0aa8-4474-af8f-20512666ddb9';

// Check if user has access
const hasAccess = computed(() => {
  return canManage('announcements');
});

// Edit mode
const announcementId = computed(() => route.query.id as string | undefined);
const isEditing = computed(() => !!announcementId.value);

// State
const loading = ref(true);
const saving = ref(false);
const sending = ref(false);

// Form state
const form = reactive({
  title: '',
  subtitle: '',
  content: '',
  template: 'Generic' as 'Generic' | 'Parking',
  urgent: false,
  greeting: '',
  closing: '',
  status: 'draft' as 'draft' | 'sent' | 'archived',
});

// Recipients state
const allPeople = ref<any[]>([]);
const selectedRecipients = ref<string[]>([]);
const recipientFilter = ref<'all' | 'owners' | 'tenants'>('all');
const loadingRecipients = ref(false);
const selectionMode = ref<'all' | 'selected'>('all');

// Attachment state
interface AttachmentInfo {
  id: string;
  filename: string;
  type: string;
  size: number;
}
const selectedAttachments = ref<AttachmentInfo[]>([]);
const showAttachmentBrowser = ref(false);
const attachmentFiles = ref<DirectusFile[]>([]);
const attachmentFolders = ref<DirectusFolder[]>([]);
const currentAttachmentFolder = ref<string | null>(null);
const attachmentFolderPath = ref<{ id: string | null; name: string }[]>([]);
const isLoadingAttachments = ref(false);
const attachmentSearchQuery = ref('');
const attachmentFileInput = ref<HTMLInputElement | null>(null);
const isUploadingAttachment = ref(false);

// Test email state
const showTestEmailSection = ref(false);
const testEmails = ref<string[]>([]);
const testEmailInput = ref('');
const testEmailSending = ref(false);
const testEmailResults = ref<{ email: string; success: boolean; error?: string }[]>([]);

// Preview state
const showPreview = ref(false);
const previewHtml = ref('');
const previewLoading = ref(false);

// Template options
const templateOptions = [
  { label: 'Generic', value: 'Generic', icon: 'i-heroicons-envelope' },
  { label: 'Parking', value: 'Parking', icon: 'i-heroicons-truck' },
];

// Recipient filter options
const recipientFilterOptions = [
  { label: 'All Members', value: 'all', icon: 'i-heroicons-users' },
  { label: 'Owners Only', value: 'owners', icon: 'i-heroicons-home' },
  { label: 'Tenants Only', value: 'tenants', icon: 'i-heroicons-key' },
] as const;

// Computed
const filteredRecipients = computed(() => {
  let result = allPeople.value;

  switch (recipientFilter.value) {
    case 'owners':
      result = result.filter(p => p.is_owner);
      break;
    case 'tenants':
      result = result.filter(p => p.is_resident && !p.is_owner);
      break;
  }

  return result;
});

const selectedRecipientsList = computed(() => {
  if (selectionMode.value === 'all') {
    return filteredRecipients.value;
  }
  return allPeople.value.filter(p => selectedRecipients.value.includes(p.id));
});

const recipientCount = computed(() => selectedRecipientsList.value.length);

const memberCounts = computed(() => ({
  all: allPeople.value.length,
  owners: allPeople.value.filter(p => p.is_owner).length,
  tenants: allPeople.value.filter(p => p.is_resident && !p.is_owner).length,
}));

// Fetch existing announcement if editing
async function fetchAnnouncement() {
  if (!announcementId.value) {
    loading.value = false;
    return;
  }

  try {
    const response = await $fetch<Announcement>('/api/directus/items', {
      method: 'POST',
      body: {
        collection: 'announcements',
        operation: 'get',
        id: announcementId.value,
        query: {
          fields: ['*'],
        },
      },
    });

    if (response) {
      form.title = response.title || '';
      form.subtitle = response.subtitle || '';
      form.content = response.content || '';
      form.template = response.template || 'Generic';
      form.urgent = response.urgent || false;
      form.greeting = response.greeting || '';
      form.closing = response.closing || '';
      form.status = response.status || 'draft';
    }
  } catch (error: any) {
    console.error('Failed to fetch announcement:', error);
    toast.add({ title: 'Error', description: 'Failed to load announcement', color: 'red' });
  } finally {
    loading.value = false;
  }
}

// Fetch people for recipients
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
            status: { _eq: 'published' },
            email: { _nnull: true },
          },
          sort: ['last_name', 'first_name'],
          limit: -1,
        },
      },
    });
    allPeople.value = response || [];
  } catch (error: any) {
    console.error('Failed to fetch people:', error);
    toast.add({ title: 'Error', description: 'Failed to load recipients', color: 'red' });
  } finally {
    loadingRecipients.value = false;
  }
}

// Save announcement (draft or update)
async function saveAnnouncement(status: 'draft' | 'sent' = 'draft') {
  if (!form.title) {
    toast.add({ title: 'Error', description: 'Title is required', color: 'red' });
    return null;
  }

  saving.value = true;
  try {
    // Generate URL slug from title
    const url = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const data = {
      title: form.title,
      subtitle: form.subtitle,
      content: form.content,
      template: form.template,
      urgent: form.urgent,
      greeting: form.greeting,
      closing: form.closing,
      status,
      url,
    };

    let result: Announcement;

    if (isEditing.value && announcementId.value) {
      result = await $fetch<Announcement>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'announcements',
          operation: 'update',
          id: announcementId.value,
          data,
        },
      });
      toast.add({ title: 'Success', description: 'Announcement saved', color: 'green' });
    } else {
      result = await $fetch<Announcement>('/api/directus/items', {
        method: 'POST',
        body: {
          collection: 'announcements',
          operation: 'create',
          data,
        },
      });
      // Update URL to include the new ID for future saves
      router.replace({ query: { id: result.id } });
      toast.add({ title: 'Success', description: 'Announcement created', color: 'green' });
    }

    return result;
  } catch (error: any) {
    console.error('Failed to save announcement:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to save announcement',
      color: 'red',
    });
    return null;
  } finally {
    saving.value = false;
  }
}

// Send announcement
async function sendAnnouncement() {
  const recipientIds = selectionMode.value === 'all'
    ? filteredRecipients.value.map(p => p.id)
    : selectedRecipients.value;

  if (recipientIds.length === 0) {
    toast.add({ title: 'Error', description: 'Please select at least one recipient', color: 'red' });
    return;
  }

  sending.value = true;
  try {
    // Save announcement first
    let announcement = await saveAnnouncement('draft');
    if (!announcement) return;

    const id = announcement.id || announcementId.value;

    // Create recipient entries in Directus
    const recipientData = recipientIds.map(personId => ({
      announcements_id: id,
      people_id: personId,
    }));

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
        id,
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
          id,
          data: {
            status: 'sent',
            date_sent: new Date().toISOString(),
          },
        },
      });

      toast.add({
        title: 'Sent!',
        description: `Email sent to ${recipientIds.length} recipients`,
        color: 'green',
      });

      router.push('/admin/announcements');
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

// Generate preview HTML
async function generatePreview() {
  previewLoading.value = true;
  try {
    // For now, create a simple preview
    previewHtml.value = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; margin-bottom: 8px;">${form.title || 'Untitled'}</h1>
        ${form.subtitle ? `<p style="color: #666; margin-bottom: 24px;">${form.subtitle}</p>` : ''}
        ${form.greeting ? `<p style="color: #333;">${form.greeting.replace('{{first_name}}', 'Resident')},</p>` : ''}
        <div style="color: #333; line-height: 1.6;">${form.content || '<p>No content</p>'}</div>
        ${form.closing ? `<p style="color: #333; margin-top: 24px;">${form.closing}</p>` : ''}
        ${form.urgent ? '<div style="background: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; margin-top: 16px;"><strong>URGENT</strong></div>' : ''}
      </div>
    `;
    showPreview.value = true;
  } finally {
    previewLoading.value = false;
  }
}

// Test email functions
function addTestEmail() {
  const email = testEmailInput.value.trim();
  if (email && !testEmails.value.includes(email) && email.includes('@')) {
    testEmails.value.push(email);
    testEmailInput.value = '';
  }
}

function removeTestEmail(email: string) {
  testEmails.value = testEmails.value.filter(e => e !== email);
}

async function sendTestEmail() {
  if (testEmails.value.length === 0) {
    toast.add({ title: 'Error', description: 'Add at least one test email address', color: 'red' });
    return;
  }

  if (!form.title || !form.content) {
    toast.add({ title: 'Error', description: 'Please fill in title and content first', color: 'red' });
    return;
  }

  testEmailSending.value = true;
  testEmailResults.value = [];

  try {
    // Save as draft first to get an ID
    let announcement = await saveAnnouncement('draft');
    if (!announcement && !announcementId.value) {
      throw new Error('Failed to save announcement');
    }

    const id = announcement?.id || announcementId.value;

    // Send test emails
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const email of testEmails.value) {
      try {
        // Create a fake recipient for test
        const testRecipient = {
          people_id: {
            email,
            first_name: 'Test',
            last_name: 'Recipient',
          },
        };

        await $fetch('/api/email/announcement', {
          method: 'POST',
          body: {
            data: {
              data: {
                id,
                title: form.title,
                subtitle: form.subtitle,
                content: form.content,
                urgent: form.urgent,
                closing: form.closing,
                template: form.template,
              },
              recipients: [testRecipient],
            },
          },
        });

        results.push({ email, success: true });
      } catch (error: any) {
        results.push({ email, success: false, error: error.message || 'Failed to send' });
      }
    }

    testEmailResults.value = results;

    const successCount = results.filter(r => r.success).length;
    if (successCount === results.length) {
      toast.add({ title: 'Success', description: `Test email sent to ${successCount} address(es)`, color: 'green' });
    } else {
      toast.add({ title: 'Partial Success', description: `${successCount}/${results.length} test emails sent`, color: 'yellow' });
    }
  } catch (error: any) {
    console.error('Failed to send test email:', error);
    toast.add({ title: 'Error', description: error.message || 'Failed to send test email', color: 'red' });
  } finally {
    testEmailSending.value = false;
  }
}

// Toggle member selection
function toggleMember(id: string) {
  const index = selectedRecipients.value.indexOf(id);
  if (index > -1) {
    selectedRecipients.value.splice(index, 1);
  } else {
    selectedRecipients.value.push(id);
  }
}

function selectAll() {
  selectedRecipients.value = filteredRecipients.value.map(p => p.id);
}

function deselectAll() {
  selectedRecipients.value = [];
}

// Cancel and go back
function handleCancel() {
  router.push('/admin/announcements');
}

// Attachment functions
const filesComposable = useDirectusFiles();
const foldersComposable = useDirectusFolders();

async function openAttachmentBrowser() {
  showAttachmentBrowser.value = true;
  currentAttachmentFolder.value = ANNOUNCEMENT_UPLOADS_FOLDER;
  attachmentFolderPath.value = [{ id: ANNOUNCEMENT_UPLOADS_FOLDER, name: 'Announcement Uploads' }];
  await loadAttachmentFilesAndFolders();
}

async function loadAttachmentFilesAndFolders() {
  isLoadingAttachments.value = true;
  try {
    const filesResult = await filesComposable.findByFolder(currentAttachmentFolder.value, {
      fields: ['id', 'title', 'filename_download', 'type', 'filesize'],
      sort: ['-uploaded_on'],
      limit: 100,
    });
    attachmentFiles.value = filesResult || [];

    let foldersResult: DirectusFolder[] = [];
    if (currentAttachmentFolder.value) {
      foldersResult = await foldersComposable.getChildren(currentAttachmentFolder.value);
    } else {
      foldersResult = await foldersComposable.getRootFolders();
    }
    attachmentFolders.value = foldersResult || [];
  } catch (error) {
    console.error('Failed to load files:', error);
  } finally {
    isLoadingAttachments.value = false;
  }
}

async function navigateToAttachmentFolder(folderId: string | null, folderName: string) {
  currentAttachmentFolder.value = folderId;

  const existingIndex = attachmentFolderPath.value.findIndex(f => f.id === folderId);
  if (existingIndex >= 0) {
    attachmentFolderPath.value = attachmentFolderPath.value.slice(0, existingIndex + 1);
  } else {
    attachmentFolderPath.value.push({ id: folderId, name: folderName });
  }

  await loadAttachmentFilesAndFolders();
}

function selectAttachmentFile(file: DirectusFile) {
  if (!file.id) return;

  if (selectedAttachments.value.some(a => a.id === file.id)) {
    toast.add({ title: 'Already attached', description: 'This file is already attached', color: 'yellow' });
    return;
  }

  selectedAttachments.value.push({
    id: file.id,
    filename: file.filename_download || file.title || 'attachment',
    type: file.type || 'application/octet-stream',
    size: file.filesize || 0,
  });

  showAttachmentBrowser.value = false;
  toast.add({ title: 'Attached', description: 'File added to attachments', color: 'green' });
}

function removeAttachment(id: string) {
  selectedAttachments.value = selectedAttachments.value.filter(a => a.id !== id);
}

async function uploadAttachment(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  isUploadingAttachment.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', ANNOUNCEMENT_UPLOADS_FOLDER);

    const result = await filesComposable.uploadFiles(formData);
    const uploadedFile = Array.isArray(result) ? result[0] : result;

    if (uploadedFile?.id) {
      selectedAttachments.value.push({
        id: uploadedFile.id,
        filename: uploadedFile.filename_download || file.name,
        type: uploadedFile.type || file.type,
        size: uploadedFile.filesize || file.size,
      });
      toast.add({ title: 'Uploaded', description: 'File uploaded and attached', color: 'green' });
    }
  } catch (error: any) {
    console.error('Upload failed:', error);
    toast.add({ title: 'Error', description: 'Failed to upload file', color: 'red' });
  } finally {
    isUploadingAttachment.value = false;
    if (input) input.value = '';
  }
}

const filteredAttachmentFiles = computed(() => {
  if (!attachmentSearchQuery.value) return attachmentFiles.value;
  const query = attachmentSearchQuery.value.toLowerCase();
  return attachmentFiles.value.filter(
    file => file.title?.toLowerCase().includes(query) || file.filename_download?.toLowerCase().includes(query)
  );
});

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return 'i-lucide-image';
  if (type.includes('pdf')) return 'i-lucide-file-text';
  if (type.includes('word') || type.includes('document')) return 'i-lucide-file-text';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'i-lucide-file-spreadsheet';
  return 'i-lucide-file';
}

// Initialize
onMounted(async () => {
  await Promise.all([
    fetchAnnouncement(),
    fetchPeople(),
  ]);
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-6 max-w-6xl">
      <!-- Header -->
      <div class="mb-6">
        <UButton variant="ghost" size="sm" @click="handleCancel" class="mb-4">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
          Back to Announcements
        </UButton>
        <h1 class="text-2xl font-bold">
          {{ isEditing ? 'Edit Announcement' : 'Compose Announcement' }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Create and send email announcements to residents
        </p>
      </div>

      <!-- Access Denied -->
      <div v-if="!hasAccess" class="text-center py-12">
        <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">
          You don't have permission to create announcements.
        </p>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="text-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p class="text-gray-600">Loading...</p>
      </div>

      <!-- Main Form -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Email Content (Left) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Template Selection -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Template</h3>
            </template>
            <div class="flex gap-3">
              <button
                v-for="option in templateOptions"
                :key="option.value"
                @click="form.template = option.value as any"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                  form.template === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                ]"
              >
                <UIcon :name="option.icon" class="w-5 h-5" />
                {{ option.label }}
              </button>
            </div>
          </UCard>

          <!-- Subject & Content -->
          <UCard>
            <template #header>
              <h3 class="font-semibold">Email Content</h3>
            </template>
            <div class="space-y-4">
              <UFormGroup label="Title" required>
                <UInput v-model="form.title" placeholder="Enter announcement title..." size="lg" />
              </UFormGroup>

              <UFormGroup label="Subtitle">
                <UInput v-model="form.subtitle" placeholder="Brief summary (optional)" />
              </UFormGroup>

              <UFormGroup label="Greeting">
                <UInput v-model="form.greeting" placeholder="Dear {{first_name}}," />
                <template #hint>
                  Use <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{{first_name}}</code> for personalization
                </template>
              </UFormGroup>

              <UFormGroup label="Message" required>
                <TiptapEditor
                  v-model="form.content"
                  placeholder="Write your announcement message..."
                  mode="full"
                  height="min-h-[300px] max-h-[500px]"
                  :allow-uploads="true"
                  :folder-id="ANNOUNCEMENT_UPLOADS_FOLDER"
                />
              </UFormGroup>

              <UFormGroup label="Closing">
                <UInput v-model="form.closing" placeholder="Best regards,\nThe Board" />
              </UFormGroup>

              <UCheckbox v-model="form.urgent" label="Mark as urgent" />
            </div>
          </UCard>

          <!-- Attachments -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-paper-clip" class="w-5 h-5" />
                <h3 class="font-semibold">Attachments</h3>
              </div>
            </template>
            <div class="space-y-4">
              <div class="flex gap-2">
                <UButton variant="outline" size="sm" @click="openAttachmentBrowser">
                  <UIcon name="i-lucide-folder-open" class="w-4 h-4 mr-2" />
                  Browse Files
                </UButton>
                <UButton variant="outline" size="sm" :loading="isUploadingAttachment" @click="attachmentFileInput?.click()">
                  <UIcon name="i-lucide-upload" class="w-4 h-4 mr-2" />
                  Upload New
                </UButton>
                <input
                  ref="attachmentFileInput"
                  type="file"
                  class="hidden"
                  @change="uploadAttachment"
                />
              </div>

              <div v-if="selectedAttachments.length > 0" class="space-y-2">
                <div
                  v-for="attachment in selectedAttachments"
                  :key="attachment.id"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                >
                  <div class="flex items-center gap-3">
                    <UIcon :name="getFileIcon(attachment.type)" class="w-5 h-5 text-gray-500" />
                    <div>
                      <div class="font-medium text-sm">{{ attachment.filename }}</div>
                      <div class="text-xs text-gray-500">{{ formatFileSize(attachment.size) }}</div>
                    </div>
                  </div>
                  <UButton variant="ghost" size="xs" @click="removeAttachment(attachment.id)">
                    <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                  </UButton>
                </div>
              </div>

              <p v-else class="text-sm text-gray-500 text-center py-4">
                No attachments added
              </p>
            </div>
          </UCard>
        </div>

        <!-- Recipients & Actions (Right) -->
        <div class="space-y-6">
          <!-- Recipients Card -->
          <UCard class="sticky top-6">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">Recipients</h3>
                <span class="text-sm text-gray-500">{{ recipientCount }} selected</span>
              </div>
            </template>

            <div class="space-y-4">
              <!-- Recipient Filter -->
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="option in recipientFilterOptions"
                  :key="option.value"
                  @click="recipientFilter = option.value"
                  :class="[
                    'p-2 rounded-lg border text-center transition-all text-xs',
                    recipientFilter === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                  ]"
                >
                  <UIcon :name="option.icon" class="w-4 h-4 mx-auto mb-1" />
                  <div class="font-medium">{{ option.label }}</div>
                  <div class="text-gray-500">({{ memberCounts[option.value] }})</div>
                </button>
              </div>

              <hr class="border-gray-200 dark:border-gray-700" />

              <!-- Selection Mode -->
              <div class="space-y-2">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="radio" v-model="selectionMode" value="all" class="w-4 h-4" />
                  <span>All {{ recipientFilter === 'all' ? 'members' : recipientFilter }} ({{ filteredRecipients.length }})</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="radio" v-model="selectionMode" value="selected" class="w-4 h-4" />
                  <span>Select specific members</span>
                </label>
              </div>

              <!-- Member Selection List -->
              <div
                v-if="selectionMode === 'selected'"
                class="border dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto"
              >
                <div class="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center sticky top-0">
                  <span class="text-xs text-gray-600 dark:text-gray-400">
                    {{ selectedRecipients.length }} selected
                  </span>
                  <div class="flex gap-2">
                    <UButton variant="ghost" size="xs" @click="selectAll">All</UButton>
                    <UButton variant="ghost" size="xs" @click="deselectAll">None</UButton>
                  </div>
                </div>
                <div v-if="loadingRecipients" class="p-4 text-center">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin w-5 h-5 text-gray-400" />
                </div>
                <div
                  v-for="member in filteredRecipients"
                  :key="member.id"
                  @click="toggleMember(member.id)"
                  :class="[
                    'p-2 border-b dark:border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2',
                    selectedRecipients.includes(member.id) ? 'bg-primary-50 dark:bg-primary-900/20' : '',
                  ]"
                >
                  <input type="checkbox" :checked="selectedRecipients.includes(member.id)" class="w-4 h-4" />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">
                      {{ member.first_name }} {{ member.last_name }}
                    </div>
                    <div class="text-xs text-gray-500 truncate">{{ member.email }}</div>
                  </div>
                </div>
              </div>
            </div>

            <template #footer>
              <div class="space-y-3">
                <UButton
                  class="w-full"
                  size="lg"
                  color="green"
                  :loading="sending"
                  :disabled="recipientCount === 0"
                  @click="sendAnnouncement"
                >
                  <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5 mr-2" />
                  Send to {{ recipientCount }} recipient{{ recipientCount !== 1 ? 's' : '' }}
                </UButton>

                <div class="grid grid-cols-2 gap-2">
                  <UButton variant="outline" :loading="previewLoading" @click="generatePreview">
                    <UIcon name="i-heroicons-eye" class="w-4 h-4 mr-2" />
                    Preview
                  </UButton>
                  <UButton variant="outline" :loading="saving" @click="saveAnnouncement('draft')">
                    <UIcon name="i-heroicons-bookmark" class="w-4 h-4 mr-2" />
                    Save Draft
                  </UButton>
                </div>

                <UButton variant="ghost" class="w-full" @click="handleCancel">
                  Cancel
                </UButton>
              </div>
            </template>
          </UCard>

          <!-- Test Email Card -->
          <UCard>
            <template #header>
              <button
                type="button"
                class="flex items-center justify-between w-full"
                @click="showTestEmailSection = !showTestEmailSection"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-beaker" class="w-5 h-5 text-amber-600" />
                  <h3 class="font-semibold">Test Email</h3>
                </div>
                <UIcon
                  :name="showTestEmailSection ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                  class="w-4 h-4 text-gray-400"
                />
              </button>
            </template>

            <div v-if="showTestEmailSection" class="space-y-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Test your email in different clients before sending to all recipients.
              </p>

              <!-- Email Input -->
              <div class="flex gap-2">
                <UInput
                  v-model="testEmailInput"
                  placeholder="Enter email address"
                  class="flex-1"
                  @keyup.enter="addTestEmail"
                />
                <UButton size="sm" @click="addTestEmail">Add</UButton>
              </div>

              <!-- Email Tags -->
              <div v-if="testEmails.length > 0" class="flex flex-wrap gap-2">
                <div
                  v-for="email in testEmails"
                  :key="email"
                  class="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                >
                  <span>{{ email }}</span>
                  <button @click="removeTestEmail(email)" class="p-0.5 hover:text-red-500">
                    <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <!-- Test Results -->
              <div v-if="testEmailResults.length > 0" class="space-y-2">
                <div class="text-sm font-medium">Results:</div>
                <div
                  v-for="result in testEmailResults"
                  :key="result.email"
                  class="flex items-center gap-2 text-sm"
                >
                  <UIcon
                    :name="result.success ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                    :class="result.success ? 'text-green-600' : 'text-red-600'"
                    class="w-4 h-4"
                  />
                  <span class="truncate">{{ result.email }}</span>
                  <span v-if="result.error" class="text-red-600 text-xs">({{ result.error }})</span>
                </div>
              </div>

              <UButton
                variant="outline"
                class="w-full"
                :loading="testEmailSending"
                :disabled="testEmails.length === 0 || !form.title || !form.content"
                @click="sendTestEmail"
              >
                <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 mr-2" />
                Send Test Email{{ testEmails.length > 1 ? 's' : '' }}
              </UButton>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Preview Modal -->
      <UModal v-model="showPreview" :ui="{ width: 'sm:max-w-4xl' }">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Email Preview</h3>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showPreview = false" />
            </div>
          </template>
          <div class="max-h-[70vh] overflow-auto border dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
            <div class="bg-white dark:bg-gray-900 rounded shadow-sm" v-html="previewHtml"></div>
          </div>
          <template v-if="selectedAttachments.length > 0" #footer>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <UIcon name="i-heroicons-paper-clip" class="w-4 h-4" />
              <span>{{ selectedAttachments.length }} attachment{{ selectedAttachments.length !== 1 ? 's' : '' }}</span>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Attachment Browser Modal -->
      <UModal v-model="showAttachmentBrowser" :ui="{ width: 'sm:max-w-3xl' }">
        <UCard class="max-h-[80vh] flex flex-col">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Select File</h3>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showAttachmentBrowser = false" />
            </div>
          </template>

          <!-- Breadcrumb -->
          <div class="flex items-center gap-1 text-sm border-b dark:border-gray-700 pb-2 mb-3">
            <template v-for="(folder, index) in attachmentFolderPath" :key="folder.id || 'root'">
              <button
                class="hover:text-primary-500 hover:underline"
                :class="{ 'font-medium': index === attachmentFolderPath.length - 1 }"
                @click="navigateToAttachmentFolder(folder.id, folder.name)"
              >
                {{ folder.name }}
              </button>
              <UIcon
                v-if="index < attachmentFolderPath.length - 1"
                name="i-heroicons-chevron-right"
                class="w-4 h-4 text-gray-400"
              />
            </template>
          </div>

          <!-- Search -->
          <UInput
            v-model="attachmentSearchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search files..."
            class="mb-3"
          />

          <!-- File Grid -->
          <div class="flex-1 overflow-y-auto min-h-[300px]">
            <div v-if="isLoadingAttachments" class="flex items-center justify-center h-full">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
            </div>
            <div
              v-else-if="attachmentFolders.length === 0 && filteredAttachmentFiles.length === 0"
              class="flex flex-col items-center justify-center h-full text-gray-500"
            >
              <UIcon name="i-lucide-folder-x" class="w-12 h-12 mb-2" />
              <p>No files found</p>
            </div>
            <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
              <!-- Folders -->
              <button
                v-for="folder in attachmentFolders"
                :key="folder.id"
                class="flex flex-col items-center p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                @click="navigateToAttachmentFolder(folder.id, folder.name || 'Folder')"
              >
                <UIcon name="i-lucide-folder" class="w-10 h-10 text-amber-500 mb-2" />
                <span class="text-xs text-center truncate w-full">{{ folder.name || 'Folder' }}</span>
              </button>

              <!-- Files -->
              <button
                v-for="file in filteredAttachmentFiles"
                :key="file.id"
                class="flex flex-col items-center p-2 rounded-lg border dark:border-gray-700 hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                @click="selectAttachmentFile(file)"
              >
                <div class="w-10 h-10 mb-2 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
                  <UIcon :name="getFileIcon(file.type || '')" class="w-5 h-5 text-gray-400" />
                </div>
                <span class="text-xs text-center truncate w-full">
                  {{ file.title || file.filename_download || 'File' }}
                </span>
                <span class="text-[10px] text-gray-400">
                  {{ formatFileSize(file.filesize) }}
                </span>
              </button>
            </div>
          </div>
        </UCard>
      </UModal>
    </div>
  </div>
</template>
