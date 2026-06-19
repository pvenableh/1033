<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

useSeoMeta({ title: 'Moderate Ideas - Admin' });

const ideasCollection = useDirectusItems('ideas');
const { getImageUrl } = useDirectusFiles();
const toast = useToast();

const ideas = ref<any[]>([]);
const loading = ref(true);
const updatingId = ref<string | null>(null);
const filterStatus = ref('pending');

const statusOptions = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  published: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const loadIdeas = async () => {
  loading.value = true;
  try {
    ideas.value = await ideasCollection.list({
      filter: { status: { _eq: filterStatus.value } },
      fields: [
        'id',
        'status',
        'title',
        'category',
        'description',
        'name',
        'email',
        'unit_number',
        'verified_resident',
        'date_created',
        'images.directus_files_id',
      ],
      sort: ['-date_created'],
      limit: 200,
    });
  } catch (error) {
    console.error('Failed to load ideas:', error);
    toast.add({ title: 'Error', description: 'Could not load ideas.', color: 'red' });
  } finally {
    loading.value = false;
  }
};

const setStatus = async (idea: any, status: string) => {
  updatingId.value = idea.id;
  try {
    await ideasCollection.update(idea.id, { status });
    toast.add({ title: 'Updated', description: `Idea marked ${status}.`, color: 'green' });
    await loadIdeas();
  } catch (error: any) {
    toast.add({ title: 'Error', description: error?.data?.message || 'Update failed.', color: 'red' });
  } finally {
    updatingId.value = null;
  }
};

const fileId = (img: any) =>
  typeof img.directus_files_id === 'string' ? img.directus_files_id : img.directus_files_id?.id;

watch(filterStatus, loadIdeas);
onMounted(loadIdeas);
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">Moderate Ideas</h1>
        <p class="text-sm text-muted-foreground">Approve resident submissions before they appear publicly.</p>
      </div>
      <div class="w-48">
        <Select v-model="filterStatus" :options="statusOptions" />
      </div>
    </div>

    <div v-if="loading" class="py-20 text-center text-muted-foreground">
      <Icon name="lucide:loader-circle" class="w-6 h-6 animate-spin inline" />
    </div>

    <div v-else-if="!ideas.length" class="py-20 text-center text-muted-foreground">
      No {{ filterStatus }} ideas.
    </div>

    <div v-else class="space-y-4">
      <Card v-for="idea in ideas" :key="idea.id">
        <CardContent class="pt-6">
          <div class="flex gap-4">
            <!-- thumbnail -->
            <div v-if="idea.images?.length" class="shrink-0">
              <img
                :src="getImageUrl(fileId(idea.images[0]), { width: 160, height: 160, fit: 'cover', quality: 70 })"
                :alt="idea.title"
                class="w-20 h-20 rounded-md object-cover border" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold">{{ idea.title }}</h3>
                <Badge v-if="idea.category" variant="outline">{{ idea.category }}</Badge>
                <span class="text-xs px-2 py-0.5 rounded-full" :class="statusBadge[idea.status]">
                  {{ idea.status }}
                </span>
                <Badge v-if="idea.verified_resident" class="gap-1 bg-emerald-600">
                  <Icon name="lucide:badge-check" class="w-3 h-3" /> Verified
                </Badge>
              </div>

              <p class="text-sm text-muted-foreground mt-1 whitespace-pre-line">{{ idea.description }}</p>

              <div class="text-xs text-muted-foreground mt-2">
                {{ idea.name }}
                <span v-if="idea.unit_number"> · Unit {{ idea.unit_number }}</span>
                <span v-if="idea.email"> · {{ idea.email }}</span>
              </div>

              <div class="flex gap-2 mt-3 flex-wrap">
                <Button
                  v-if="idea.status !== 'published'"
                  size="sm"
                  :disabled="updatingId === idea.id"
                  @click="setStatus(idea, 'published')">
                  <Icon name="lucide:check" class="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  v-if="idea.status !== 'rejected'"
                  size="sm"
                  variant="outline"
                  :disabled="updatingId === idea.id"
                  @click="setStatus(idea, 'rejected')">
                  <Icon name="lucide:x" class="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button
                  v-if="idea.status === 'published'"
                  size="sm"
                  variant="ghost"
                  :disabled="updatingId === idea.id"
                  @click="setStatus(idea, 'archived')">
                  Archive
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
