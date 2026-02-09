<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

useSeoMeta({
  title: 'Documents - Admin',
});

const toast = useToast();
const { isAdmin, isBoardMember } = useRoles();
const { getUrl, formatFileSize, getExtension, uploadFiles } = useDirectusFiles();

interface Document {
  id: number;
  title: string;
  description?: string | null;
  status: 'published' | 'draft' | 'archived';
  category?: string | null;
  file?: { id: string; title: string | null; type: string; filesize: number; filename_download: string } | null;
  sort?: number | null;
  date_created?: string | null;
  date_updated?: string | null;
}

// State
const documents = ref<Document[]>([]);
const loading = ref(true);
const selectedDocument = ref<Document | null>(null);
const showDocumentModal = ref(false);
const showDeleteModal = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const uploading = ref(false);
const uploadedFile = ref<any>(null);

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

const categoryOptions = ref([
  { label: 'All Categories', value: 'all' },
  { label: 'General', value: 'General' },
  { label: 'Policy', value: 'Policy' },
  { label: 'Insurance', value: 'Insurance' },
  { label: 'Compliance', value: 'Compliance' },
  { label: 'Forms', value: 'Forms' },
  { label: 'Other', value: 'Other' },
]);

// Document form state
const documentForm = ref({
  title: '',
  description: '',
  category: 'General',
  status: 'draft' as 'published' | 'draft' | 'archived',
});

// Permission checks
const hasAccess = computed(() => isAdmin.value || isBoardMember.value);

// Computed
const filteredDocuments = computed(() => {
  let result = documents.value;

  if (statusFilter.value !== 'all') {
    result = result.filter((d) => d.status === statusFilter.value);
  }

  if (categoryFilter.value !== 'all') {
    result = result.filter((d) => d.category === categoryFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (d) =>
        d.title?.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.category?.toLowerCase().includes(query)
    );
  }

  return result;
});

// Stats
const documentStats = computed(() => ({
  total: documents.value.length,
  published: documents.value.filter((d) => d.status === 'published').length,
  draft: documents.value.filter((d) => d.status === 'draft').length,
  archived: documents.value.filter((d) => d.status === 'archived').length,
}));

// Unique categories from existing documents
const uniqueCategories = computed(() => {
  const cats = new Set(documents.value.map((d) => d.category).filter(Boolean));
  return Array.from(cats);
});

// Methods
const collection = useDirectusItems('documents');

async function fetchDocuments() {
  loading.value = true;
  try {
    const response = await collection.list({
      fields: [
        'id',
        'title',
        'description',
        'status',
        'category',
        'sort',
        'date_created',
        'date_updated',
        'file.id',
        'file.title',
        'file.type',
        'file.filesize',
        'file.filename_download',
      ],
      sort: ['sort', '-date_created'],
      limit: -1,
    });
    documents.value = (response as Document[]) || [];
  } catch (error: any) {
    console.error('Failed to fetch documents:', error);
    // If collection doesn't exist yet, show empty state
    if (error?.data?.message?.includes('Collection') || error?.statusCode === 403) {
      documents.value = [];
      toast.add({
        title: 'Collection Not Found',
        description: 'The documents collection needs to be created in Directus first',
        color: 'amber',
      });
    } else {
      toast.add({
        title: 'Error',
        description: 'Failed to load documents',
        color: 'red',
      });
    }
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  isEditing.value = false;
  selectedDocument.value = null;
  uploadedFile.value = null;
  documentForm.value = {
    title: '',
    description: '',
    category: 'General',
    status: 'draft',
  };
  showDocumentModal.value = true;
}

function openEditModal(doc: Document) {
  isEditing.value = true;
  selectedDocument.value = doc;
  uploadedFile.value = doc.file || null;
  documentForm.value = {
    title: doc.title || '',
    description: doc.description || '',
    category: doc.category || 'General',
    status: doc.status || 'draft',
  };
  showDocumentModal.value = true;
}

function confirmDelete(doc: Document) {
  selectedDocument.value = doc;
  showDeleteModal.value = true;
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];

  // Validate file size (20MB limit)
  if (file.size > 20 * 1024 * 1024) {
    toast.add({
      title: 'File Too Large',
      description: 'Maximum file size is 20MB',
      color: 'red',
    });
    return;
  }

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);

    const result = await $fetch<any>('/api/directus/files/upload', {
      method: 'POST',
      body: formData,
    });

    uploadedFile.value = result;

    // Auto-fill title from filename if title is empty
    if (!documentForm.value.title && result.title) {
      documentForm.value.title = result.title;
    } else if (!documentForm.value.title) {
      documentForm.value.title = file.name.replace(/\.[^/.]+$/, '');
    }

    toast.add({
      title: 'File Uploaded',
      description: `${file.name} uploaded successfully`,
      color: 'green',
    });
  } catch (error: any) {
    console.error('Upload failed:', error);
    toast.add({
      title: 'Upload Failed',
      description: error?.data?.message || 'Failed to upload file',
      color: 'red',
    });
  } finally {
    uploading.value = false;
    // Reset input so same file can be selected again
    input.value = '';
  }
}

function removeFile() {
  uploadedFile.value = null;
}

async function saveDocument() {
  if (!documentForm.value.title) {
    toast.add({
      title: 'Error',
      description: 'Document title is required',
      color: 'red',
    });
    return;
  }

  if (!uploadedFile.value && !isEditing.value) {
    toast.add({
      title: 'Error',
      description: 'Please upload a file',
      color: 'red',
    });
    return;
  }

  saving.value = true;
  try {
    const data: Record<string, any> = {
      title: documentForm.value.title,
      description: documentForm.value.description || null,
      category: documentForm.value.category || 'General',
      status: documentForm.value.status || 'draft',
    };

    // Set file reference if we have an uploaded file
    if (uploadedFile.value?.id) {
      data.file = uploadedFile.value.id;
    }

    if (isEditing.value && selectedDocument.value) {
      await collection.update(selectedDocument.value.id, data);
      toast.add({
        title: 'Document Updated',
        description: `${documentForm.value.title} has been updated`,
        color: 'green',
      });
    } else {
      await collection.create(data);
      toast.add({
        title: 'Document Created',
        description: `${documentForm.value.title} has been created`,
        color: 'green',
      });
    }

    showDocumentModal.value = false;
    await fetchDocuments();
  } catch (error: any) {
    console.error('Failed to save document:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to save document',
      color: 'red',
    });
  } finally {
    saving.value = false;
  }
}

async function deleteDocument() {
  if (!selectedDocument.value) return;

  saving.value = true;
  try {
    await collection.remove(selectedDocument.value.id);

    toast.add({
      title: 'Document Deleted',
      description: `${selectedDocument.value.title} has been deleted`,
      color: 'green',
    });

    showDeleteModal.value = false;
    await fetchDocuments();
  } catch (error: any) {
    console.error('Failed to delete document:', error);
    toast.add({
      title: 'Error',
      description: error?.data?.message || 'Failed to delete document',
      color: 'red',
    });
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(doc: Document) {
  const newStatus = doc.status === 'published' ? 'draft' : 'published';
  try {
    await collection.update(doc.id, { status: newStatus });
    toast.add({
      title: 'Status Updated',
      description: `${doc.title} is now ${newStatus}`,
      color: 'green',
    });
    await fetchDocuments();
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: 'Failed to update status',
      color: 'red',
    });
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

function getFileTypeIcon(type: string | undefined | null) {
  if (!type) return 'i-heroicons-document';
  if (type.includes('pdf')) return 'i-heroicons-document-text';
  if (type.includes('word') || type.includes('document')) return 'i-heroicons-document-text';
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return 'i-heroicons-table-cells';
  if (type.includes('image')) return 'i-heroicons-photo';
  return 'i-heroicons-document';
}

function getFileTypeLabel(type: string | undefined | null) {
  if (!type) return '';
  const parts = type.split('/');
  return parts[parts.length - 1]?.toUpperCase() || '';
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Initialize
onMounted(() => {
  fetchDocuments();
});
</script>

<template>
  <div class="admin-page t-bg min-h-full">
    <div class="container mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold">Documents</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Upload and manage association documents for residents
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center gap-3">
          <Button
            v-if="hasAccess"
            color="primary"
            icon="i-heroicons-plus"
            @click="openCreateModal"
          >
            Add Document
          </Button>
        </div>
      </div>

      <!-- Access Denied -->
      <div v-if="!hasAccess" class="text-center py-12">
        <Icon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-400">
          You need board member or administrator privileges to manage documents.
        </p>
      </div>

      <!-- Documents Management -->
      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ documentStats.total }}</div>
              <div class="text-sm text-gray-500">Total Documents</div>
            </div>
          </Card>
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ documentStats.published }}</div>
              <div class="text-sm text-gray-500">Published</div>
            </div>
          </Card>
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-amber-600">{{ documentStats.draft }}</div>
              <div class="text-sm text-gray-500">Drafts</div>
            </div>
          </Card>
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-500">{{ documentStats.archived }}</div>
              <div class="text-sm text-gray-500">Archived</div>
            </div>
          </Card>
        </div>

        <!-- Filters -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search documents..."
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
            v-model="categoryFilter"
            :options="categoryOptions"
            value-attribute="value"
            option-attribute="label"
            class="md:w-48"
          />
        </div>

        <!-- Documents Table -->
        <Card>
          <Table
            :rows="filteredDocuments"
            :columns="[
              { key: 'title', label: 'Document' },
              { key: 'category', label: 'Category' },
              { key: 'file', label: 'File' },
              { key: 'status', label: 'Status' },
              { key: 'date', label: 'Date' },
              { key: 'actions', label: 'Actions' },
            ]"
            :loading="loading"
            :empty-state="{ icon: 'i-heroicons-document', label: 'No documents found' }"
          >
            <template #title-data="{ row }">
              <div class="max-w-xs">
                <p class="font-medium truncate">{{ row.title }}</p>
                <p v-if="row.description" class="text-xs text-gray-500 truncate">
                  {{ row.description }}
                </p>
              </div>
            </template>

            <template #category-data="{ row }">
              <Badge v-if="row.category" color="primary" variant="soft" size="sm">
                {{ row.category }}
              </Badge>
              <span v-else class="text-xs text-gray-400">--</span>
            </template>

            <template #file-data="{ row }">
              <div v-if="row.file" class="flex items-center gap-2">
                <Icon
                  :name="getFileTypeIcon(row.file.type)"
                  class="w-4 h-4 text-gray-500 flex-shrink-0"
                />
                <div class="min-w-0">
                  <a
                    :href="'https://admin.1033lenox.com/assets/' + row.file.id"
                    target="_blank"
                    class="text-xs text-blue-600 hover:underline truncate block max-w-[150px]"
                  >
                    {{ row.file.filename_download || 'Download' }}
                  </a>
                  <span class="text-[10px] text-gray-400">
                    {{ getFileTypeLabel(row.file.type) }}
                    <span v-if="row.file.filesize"> &middot; {{ formatFileSize(row.file.filesize) }}</span>
                  </span>
                </div>
              </div>
              <span v-else class="text-xs text-gray-400">No file</span>
            </template>

            <template #status-data="{ row }">
              <button @click="toggleStatus(row)" class="cursor-pointer">
                <Badge :color="getStatusColor(row.status)" variant="soft" size="sm">
                  {{ row.status }}
                </Badge>
              </button>
            </template>

            <template #date-data="{ row }">
              <span class="text-xs text-gray-500">{{ formatDate(row.date_created) }}</span>
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

      <!-- Document Modal -->
      <Modal v-model="showDocumentModal" :ui="{ width: 'sm:max-w-2xl' }">
        <Card>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                {{ isEditing ? 'Edit Document' : 'Add Document' }}
              </h3>
              <Button
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showDocumentModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <!-- File Upload -->
            <FormGroup :label="isEditing ? 'Replace File' : 'File'" :required="!isEditing">
              <!-- Current file display -->
              <div v-if="uploadedFile" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2">
                <Icon
                  :name="getFileTypeIcon(uploadedFile.type)"
                  class="w-8 h-8 text-gray-500 flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ uploadedFile.filename_download || uploadedFile.title || 'Uploaded file' }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ getFileTypeLabel(uploadedFile.type) }}
                    <span v-if="uploadedFile.filesize"> &middot; {{ formatFileSize(uploadedFile.filesize) }}</span>
                  </p>
                </div>
                <Button
                  size="xs"
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  @click="removeFile"
                />
              </div>

              <!-- Upload zone -->
              <div
                v-if="!uploadedFile"
                class="relative flex items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary transition-colors"
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  @change="handleFileUpload"
                  :disabled="uploading"
                />
                <div class="text-center">
                  <Icon
                    v-if="!uploading"
                    name="i-heroicons-cloud-arrow-up"
                    class="w-8 h-8 text-gray-400 mx-auto mb-2"
                  />
                  <div v-else class="w-8 h-8 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p class="text-sm text-gray-500">
                    {{ uploading ? 'Uploading...' : 'Click or drag file to upload' }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">PDF, Word, Excel, CSV, Images &middot; Max 20MB</p>
                </div>
              </div>
            </FormGroup>

            <!-- Title -->
            <FormGroup label="Title" required>
              <Input v-model="documentForm.title" placeholder="Document title" />
            </FormGroup>

            <!-- Description -->
            <FormGroup label="Description">
              <Textarea
                v-model="documentForm.description"
                placeholder="Brief description of the document..."
                rows="2"
              />
            </FormGroup>

            <!-- Category and Status -->
            <div class="grid grid-cols-2 gap-4">
              <FormGroup label="Category">
                <SelectMenu
                  v-model="documentForm.category"
                  :options="categoryOptions.slice(1)"
                  value-attribute="value"
                  option-attribute="label"
                />
              </FormGroup>
              <FormGroup label="Status">
                <SelectMenu
                  v-model="documentForm.status"
                  :options="statusOptions.slice(1)"
                  value-attribute="value"
                  option-attribute="label"
                />
              </FormGroup>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <Button color="gray" variant="ghost" @click="showDocumentModal = false">
                Cancel
              </Button>
              <Button color="primary" :loading="saving" :disabled="uploading" @click="saveDocument">
                {{ isEditing ? 'Save Changes' : 'Add Document' }}
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
              <h3 class="text-lg font-semibold">Delete Document</h3>
            </div>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete
            <strong>{{ selectedDocument?.title }}</strong>?
            This action cannot be undone.
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <Button color="gray" variant="ghost" @click="showDeleteModal = false">
                Cancel
              </Button>
              <Button color="red" :loading="saving" @click="deleteDocument">
                Delete Document
              </Button>
            </div>
          </template>
        </Card>
      </Modal>
    </div>
  </div>
</template>
