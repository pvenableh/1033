<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
});

useSeoMeta({
  title: 'Financial Documents - Admin',
});

const toast = useToast();
const { isAdmin, isBoardMember } = useRoles();
const { formatFileSize } = useDirectusFiles();

interface FinancialDoc {
  id: string;
  title: string;
  description?: string | null;
  status: 'published' | 'draft' | 'archived';
  category?: string | null;
  period?: string | null;
  report_date?: string | null;
  fiscal_year?: { id: string; year: number } | null;
  file?: { id: string; title: string | null; type: string; filesize: number; filename_download: string } | null;
  uploaded_by?: { id: string; first_name: string; last_name: string } | null;
  date_created?: string | null;
}

// State
const documents = ref<FinancialDoc[]>([]);
const fiscalYears = ref<{ id: string; year: number }[]>([]);
const loading = ref(true);
const selectedDocument = ref<FinancialDoc | null>(null);
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

const categoryOptions = [
  { label: 'All Categories', value: 'all' },
  { label: 'Monthly Report', value: 'monthly_report' },
  { label: 'Annual Report', value: 'annual_report' },
  { label: 'Budget', value: 'budget' },
  { label: 'Reserve Study', value: 'reserve_study' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'Assessment', value: 'assessment' },
  { label: 'Tax Filing', value: 'tax_filing' },
  { label: 'Audit', value: 'audit' },
  { label: 'Other', value: 'other' },
];

const categoryLabels: Record<string, string> = {
  monthly_report: 'Monthly Report',
  annual_report: 'Annual Report',
  budget: 'Budget',
  reserve_study: 'Reserve Study',
  compliance: 'Compliance',
  assessment: 'Assessment',
  tax_filing: 'Tax Filing',
  audit: 'Audit',
  other: 'Other',
};

const periodOptions = [
  { label: 'None', value: '' },
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
  { label: 'Q1 (Jan-Mar)', value: 'Q1' },
  { label: 'Q2 (Apr-Jun)', value: 'Q2' },
  { label: 'Q3 (Jul-Sep)', value: 'Q3' },
  { label: 'Q4 (Oct-Dec)', value: 'Q4' },
];

// Document form state
const documentForm = ref({
  title: '',
  description: '',
  category: 'monthly_report',
  period: '',
  fiscal_year: '' as string,
  report_date: '',
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
        d.description?.toLowerCase().includes(query)
    );
  }

  return result;
});

// Stats
const documentStats = computed(() => ({
  total: documents.value.length,
  published: documents.value.filter((d) => d.status === 'published').length,
  draft: documents.value.filter((d) => d.status === 'draft').length,
}));

// Fiscal year options for dropdown
const fiscalYearOptions = computed(() => {
  return [
    { label: 'No Year', value: '' },
    ...fiscalYears.value.map((fy) => ({ label: `${fy.year}`, value: fy.id })),
  ];
});

// Methods
const collection = useDirectusItems('financial_documents');
const fyCollection = useDirectusItems('fiscal_years');

async function fetchDocuments() {
  loading.value = true;
  try {
    const [docsData, fyData] = await Promise.all([
      collection.list({
        fields: [
          'id', 'title', 'description', 'status', 'category', 'period',
          'report_date', 'date_created',
          'fiscal_year.id', 'fiscal_year.year',
          'file.id', 'file.title', 'file.type', 'file.filesize', 'file.filename_download',
          'uploaded_by.id', 'uploaded_by.first_name', 'uploaded_by.last_name',
        ],
        sort: ['-date_created'],
        limit: -1,
      }),
      fyCollection.list({
        fields: ['id', 'year'],
        sort: ['-year'],
      }),
    ]);
    documents.value = (docsData as FinancialDoc[]) || [];
    fiscalYears.value = (fyData as { id: string; year: number }[]) || [];
  } catch (error: any) {
    console.error('Failed to fetch financial documents:', error);
    if (error?.data?.message?.includes('Collection') || error?.statusCode === 403) {
      documents.value = [];
      toast.add({
        title: 'Collection Not Found',
        description: 'Run the setup script first: node scripts/setup-financial-documents.mjs',
        color: 'amber',
      });
    } else {
      toast.add({ title: 'Error', description: 'Failed to load financial documents', color: 'red' });
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
    category: 'monthly_report',
    period: '',
    fiscal_year: '',
    report_date: '',
    status: 'draft',
  };
  showDocumentModal.value = true;
}

function openEditModal(doc: FinancialDoc) {
  isEditing.value = true;
  selectedDocument.value = doc;
  uploadedFile.value = doc.file || null;
  documentForm.value = {
    title: doc.title || '',
    description: doc.description || '',
    category: doc.category || 'monthly_report',
    period: doc.period || '',
    fiscal_year: doc.fiscal_year?.id || '',
    report_date: doc.report_date || '',
    status: doc.status || 'draft',
  };
  showDocumentModal.value = true;
}

function confirmDelete(doc: FinancialDoc) {
  selectedDocument.value = doc;
  showDeleteModal.value = true;
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];

  if (file.size > 20 * 1024 * 1024) {
    toast.add({ title: 'File Too Large', description: 'Maximum file size is 20MB', color: 'red' });
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

    if (!documentForm.value.title && result.title) {
      documentForm.value.title = result.title;
    } else if (!documentForm.value.title) {
      documentForm.value.title = file.name.replace(/\.[^/.]+$/, '');
    }

    toast.add({ title: 'File Uploaded', description: `${file.name} uploaded`, color: 'green' });
  } catch (error: any) {
    console.error('Upload failed:', error);
    toast.add({ title: 'Upload Failed', description: error?.data?.message || 'Failed to upload file', color: 'red' });
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

function removeFile() {
  uploadedFile.value = null;
}

async function saveDocument() {
  if (!documentForm.value.title) {
    toast.add({ title: 'Error', description: 'Title is required', color: 'red' });
    return;
  }

  if (!uploadedFile.value && !isEditing.value) {
    toast.add({ title: 'Error', description: 'Please upload a file', color: 'red' });
    return;
  }

  saving.value = true;
  try {
    const data: Record<string, any> = {
      title: documentForm.value.title,
      description: documentForm.value.description || null,
      category: documentForm.value.category || 'monthly_report',
      period: documentForm.value.period || null,
      fiscal_year: documentForm.value.fiscal_year || null,
      report_date: documentForm.value.report_date || null,
      status: documentForm.value.status || 'draft',
    };

    if (uploadedFile.value?.id) {
      data.file = uploadedFile.value.id;
    }

    if (isEditing.value && selectedDocument.value) {
      await collection.update(selectedDocument.value.id, data);
      toast.add({ title: 'Updated', description: `${documentForm.value.title} updated`, color: 'green' });
    } else {
      await collection.create(data);
      toast.add({ title: 'Created', description: `${documentForm.value.title} created`, color: 'green' });
    }

    showDocumentModal.value = false;
    await fetchDocuments();
  } catch (error: any) {
    console.error('Failed to save:', error);
    toast.add({ title: 'Error', description: error?.data?.message || 'Failed to save', color: 'red' });
  } finally {
    saving.value = false;
  }
}

async function deleteDocument() {
  if (!selectedDocument.value) return;

  saving.value = true;
  try {
    await collection.remove(selectedDocument.value.id);
    toast.add({ title: 'Deleted', description: `${selectedDocument.value.title} deleted`, color: 'green' });
    showDeleteModal.value = false;
    await fetchDocuments();
  } catch (error: any) {
    console.error('Failed to delete:', error);
    toast.add({ title: 'Error', description: error?.data?.message || 'Failed to delete', color: 'red' });
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(doc: FinancialDoc) {
  const newStatus = doc.status === 'published' ? 'draft' : 'published';
  try {
    await collection.update(doc.id, { status: newStatus });
    toast.add({ title: 'Status Updated', description: `${doc.title} is now ${newStatus}`, color: 'green' });
    await fetchDocuments();
  } catch (error: any) {
    toast.add({ title: 'Error', description: 'Failed to update status', color: 'red' });
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = { published: 'green', draft: 'amber', archived: 'gray' };
  return colors[status] || 'gray';
}

function getFileTypeIcon(type: string | undefined | null) {
  if (!type) return 'i-heroicons-document';
  if (type.includes('pdf')) return 'i-heroicons-document-text';
  if (type.includes('word') || type.includes('document')) return 'i-heroicons-document-text';
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return 'i-heroicons-table-cells';
  return 'i-heroicons-document';
}

function getFileTypeLabel(type: string | undefined | null) {
  if (!type) return '';
  const parts = type.split('/');
  return parts[parts.length - 1]?.toUpperCase() || '';
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
          <h1 class="text-2xl font-bold">Financial Documents</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Upload and manage financial reports for residents
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
          You need board member or administrator privileges to manage financial documents.
        </p>
      </div>

      <!-- Documents Management -->
      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ documentStats.total }}</div>
              <div class="text-sm text-gray-500">Total</div>
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
        </div>

        <!-- Filters -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search..."
            class="md:w-64"
          />
          <SelectMenu
            v-model="statusFilter"
            :options="statusOptions"
            value-attribute="value"
            option-attribute="label"
            class="md:w-40"
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
              { key: 'year', label: 'Year' },
              { key: 'file', label: 'File' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: '' },
            ]"
            :loading="loading"
            :empty-state="{ icon: 'i-heroicons-document', label: 'No financial documents found' }"
          >
            <template #title-data="{ row }">
              <div class="max-w-xs">
                <p class="font-medium truncate">{{ row.title }}</p>
                <p v-if="row.period" class="text-xs text-gray-500">
                  Period: {{ row.period }}
                </p>
              </div>
            </template>

            <template #category-data="{ row }">
              <Badge v-if="row.category" color="primary" variant="soft" size="sm">
                {{ categoryLabels[row.category] || row.category }}
              </Badge>
            </template>

            <template #year-data="{ row }">
              <span class="text-sm">{{ row.fiscal_year?.year || '--' }}</span>
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
                    class="text-xs text-blue-600 hover:underline truncate block max-w-[120px]"
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

            <template #actions-data="{ row }">
              <div class="flex items-center gap-1">
                <Button size="xs" color="gray" variant="ghost" icon="i-heroicons-pencil" @click="openEditModal(row)" />
                <Button size="xs" color="red" variant="ghost" icon="i-heroicons-trash" @click="confirmDelete(row)" />
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
                {{ isEditing ? 'Edit Financial Document' : 'Add Financial Document' }}
              </h3>
              <Button color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showDocumentModal = false" />
            </div>
          </template>

          <div class="space-y-4">
            <!-- File Upload -->
            <FormGroup :label="isEditing ? 'Replace File' : 'File'" :required="!isEditing">
              <div v-if="uploadedFile" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2">
                <Icon :name="getFileTypeIcon(uploadedFile.type)" class="w-8 h-8 text-gray-500 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ uploadedFile.filename_download || uploadedFile.title || 'Uploaded file' }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ getFileTypeLabel(uploadedFile.type) }}
                    <span v-if="uploadedFile.filesize"> &middot; {{ formatFileSize(uploadedFile.filesize) }}</span>
                  </p>
                </div>
                <Button size="xs" color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="removeFile" />
              </div>

              <div
                v-if="!uploadedFile"
                class="relative flex items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary transition-colors"
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  @change="handleFileUpload"
                  :disabled="uploading"
                />
                <div class="text-center">
                  <Icon v-if="!uploading" name="i-heroicons-cloud-arrow-up" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div v-else class="w-8 h-8 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p class="text-sm text-gray-500">{{ uploading ? 'Uploading...' : 'Click or drag file to upload' }}</p>
                  <p class="text-xs text-gray-400 mt-1">PDF, Word, Excel &middot; Max 20MB</p>
                </div>
              </div>
            </FormGroup>

            <!-- Title -->
            <FormGroup label="Title" required>
              <Input v-model="documentForm.title" placeholder="e.g., January 2025 Treasurer's Report" />
            </FormGroup>

            <!-- Category and Period -->
            <div class="grid grid-cols-2 gap-4">
              <FormGroup label="Category" required>
                <SelectMenu
                  v-model="documentForm.category"
                  :options="categoryOptions.slice(1)"
                  value-attribute="value"
                  option-attribute="label"
                />
              </FormGroup>
              <FormGroup label="Period">
                <SelectMenu
                  v-model="documentForm.period"
                  :options="periodOptions"
                  value-attribute="value"
                  option-attribute="label"
                />
              </FormGroup>
            </div>

            <!-- Fiscal Year and Report Date -->
            <div class="grid grid-cols-2 gap-4">
              <FormGroup label="Fiscal Year">
                <SelectMenu
                  v-model="documentForm.fiscal_year"
                  :options="fiscalYearOptions"
                  value-attribute="value"
                  option-attribute="label"
                />
              </FormGroup>
              <FormGroup label="Report Date">
                <Input v-model="documentForm.report_date" type="date" />
              </FormGroup>
            </div>

            <!-- Description -->
            <FormGroup label="Description">
              <Textarea
                v-model="documentForm.description"
                placeholder="Optional notes about this document..."
                rows="2"
              />
            </FormGroup>

            <!-- Status -->
            <FormGroup label="Status">
              <SelectMenu
                v-model="documentForm.status"
                :options="statusOptions.slice(1)"
                value-attribute="value"
                option-attribute="label"
              />
            </FormGroup>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <Button color="gray" variant="ghost" @click="showDocumentModal = false">Cancel</Button>
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
              <h3 class="text-lg font-semibold">Delete Financial Document</h3>
            </div>
          </template>

          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete
            <strong>{{ selectedDocument?.title }}</strong>?
            This action cannot be undone.
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <Button color="gray" variant="ghost" @click="showDeleteModal = false">Cancel</Button>
              <Button color="red" :loading="saving" @click="deleteDocument">Delete</Button>
            </div>
          </template>
        </Card>
      </Modal>
    </div>
  </div>
</template>
