<script setup lang="ts">
import { IDEA_CATEGORIES } from '~/composables/useIdeas';

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
});

useSeoMeta({ title: 'Manage Polls - Admin' });

// Authenticated CRUD (admins have full Directus access via their session).
const pollsCollection = useDirectusItems('polls');
const optionsCollection = useDirectusItems('poll_options');
const votesCollection = useDirectusItems('poll_votes');
const toast = useToast();

interface AdminOption {
  id: string;
  label: string;
  sort?: number;
}
interface AdminPoll {
  id: string;
  status: 'draft' | 'open' | 'closed';
  question: string;
  description: string | null;
  category: string | null;
  closes_at: string | null;
  options: AdminOption[];
}

const polls = ref<AdminPoll[]>([]);
const counts = ref<Record<string, Record<string, number>>>({}); // pollId -> optionId -> count
const loading = ref(true);
const busyId = ref<string | null>(null);

const statusClass: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  open: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  closed: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
};

const tallyFor = (pollId: string) => counts.value[pollId] || {};
const totalFor = (pollId: string) =>
  Object.values(tallyFor(pollId)).reduce((sum, n) => sum + n, 0);

const loadVoteCounts = async (pollId: string) => {
  try {
    const rows: any[] = await votesCollection.aggregate({
      aggregate: { count: ['*'] },
      groupBy: ['option'],
      filter: { poll: { _eq: pollId } },
    });
    const map: Record<string, number> = {};
    for (const row of rows) {
      if (row.option != null) map[row.option] = Number(row.count ?? 0);
    }
    counts.value[pollId] = map;
  } catch {
    counts.value[pollId] = {};
  }
};

const loadPolls = async () => {
  loading.value = true;
  try {
    polls.value = await pollsCollection.list({
      fields: [
        'id',
        'status',
        'question',
        'description',
        'category',
        'closes_at',
        'options.id',
        'options.label',
        'options.sort',
      ],
      sort: ['-date_created'],
      limit: 100,
    });
    await Promise.all(polls.value.map((p) => loadVoteCounts(p.id)));
  } catch (error) {
    console.error('Failed to load polls:', error);
    toast.add({ title: 'Error', description: 'Could not load polls.', color: 'red' });
  } finally {
    loading.value = false;
  }
};

// ---- Create form --------------------------------------------------------
const showCreate = ref(false);
const form = reactive({
  question: '',
  description: '',
  category: '',
  closes_at: '',
  openNow: true,
});
const optionInputs = ref<string[]>(['', '']);
const creating = ref(false);

const addOption = () => optionInputs.value.push('');
const removeOption = (i: number) => {
  if (optionInputs.value.length > 2) optionInputs.value.splice(i, 1);
};

const resetForm = () => {
  form.question = '';
  form.description = '';
  form.category = '';
  form.closes_at = '';
  form.openNow = true;
  optionInputs.value = ['', ''];
};

const createPoll = async () => {
  const question = form.question.trim();
  const labels = optionInputs.value.map((o) => o.trim()).filter(Boolean);
  if (!question) {
    toast.add({ title: 'Question required', color: 'red' });
    return;
  }
  if (labels.length < 2) {
    toast.add({ title: 'Add at least two options', color: 'red' });
    return;
  }

  creating.value = true;
  try {
    const poll: any = await pollsCollection.create({
      question,
      description: form.description.trim() || null,
      category: form.category || null,
      closes_at: form.closes_at || null,
      status: form.openNow ? 'open' : 'draft',
    });
    await optionsCollection.createMany(
      labels.map((label, idx) => ({ poll: poll.id, label, sort: idx }))
    );
    toast.add({ title: 'Poll created', color: 'green' });
    resetForm();
    showCreate.value = false;
    await loadPolls();
  } catch (error: any) {
    toast.add({ title: 'Error', description: error?.data?.message || 'Could not create poll.', color: 'red' });
  } finally {
    creating.value = false;
  }
};

// ---- Per-poll actions ---------------------------------------------------
const setStatus = async (poll: AdminPoll, status: string) => {
  busyId.value = poll.id;
  try {
    await pollsCollection.update(poll.id, { status });
    poll.status = status as AdminPoll['status'];
    toast.add({ title: `Poll ${status}`, color: 'green' });
  } catch (error: any) {
    toast.add({ title: 'Error', description: error?.data?.message || 'Update failed.', color: 'red' });
  } finally {
    busyId.value = null;
  }
};

const deletePoll = async (poll: AdminPoll) => {
  if (!confirm(`Delete "${poll.question}" and all its votes? This cannot be undone.`)) return;
  busyId.value = poll.id;
  try {
    // Remove children first so FK constraints don't block the delete.
    const voteRows: any[] = await votesCollection.list({
      filter: { poll: { _eq: poll.id } },
      fields: ['id'],
      limit: -1,
    });
    if (voteRows.length) await votesCollection.remove(voteRows.map((v) => v.id));
    if (poll.options?.length) await optionsCollection.remove(poll.options.map((o) => o.id));
    await pollsCollection.remove(poll.id);
    toast.add({ title: 'Poll deleted', color: 'green' });
    await loadPolls();
  } catch (error: any) {
    toast.add({ title: 'Error', description: error?.data?.message || 'Delete failed.', color: 'red' });
  } finally {
    busyId.value = null;
  }
};

const pct = (pollId: string, optionId: string) => {
  const total = totalFor(pollId);
  if (!total) return 0;
  return Math.round(((tallyFor(pollId)[optionId] || 0) / total) * 100);
};

const sortedOptions = (poll: AdminPoll) =>
  [...(poll.options || [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

onMounted(loadPolls);
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold">Manage Polls</h1>
        <p class="text-sm text-muted-foreground">Create and run community polls shown on the Ideas page.</p>
      </div>
      <Button @click="showCreate = !showCreate">
        <Icon :name="showCreate ? 'lucide:x' : 'lucide:plus'" class="w-4 h-4 mr-1" />
        {{ showCreate ? 'Cancel' : 'New poll' }}
      </Button>
    </div>

    <!-- Create form -->
    <Card v-if="showCreate" class="mb-8">
      <CardHeader>
        <CardTitle>New poll</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <FormGroup label="Question" required>
          <Input v-model="form.question" placeholder="e.g. What should we add to the rooftop?" />
        </FormGroup>
        <FormGroup label="Description">
          <Textarea v-model="form.description" :rows="2" placeholder="Optional context for residents." />
        </FormGroup>
        <div class="grid sm:grid-cols-2 gap-4">
          <FormGroup label="Category">
            <Select v-model="form.category" :options="IDEA_CATEGORIES" placeholder="Optional" />
          </FormGroup>
          <FormGroup label="Closes at" hint="Optional">
            <Input v-model="form.closes_at" type="datetime-local" />
          </FormGroup>
        </div>

        <FormGroup label="Options" required description="At least two.">
          <div class="space-y-2">
            <div v-for="(opt, i) in optionInputs" :key="i" class="flex gap-2">
              <Input v-model="optionInputs[i]" :placeholder="`Option ${i + 1}`" />
              <Button
                v-if="optionInputs.length > 2"
                type="button"
                variant="ghost"
                size="icon"
                @click="removeOption(i)">
                <Icon name="lucide:trash-2" class="w-4 h-4" />
              </Button>
            </div>
            <Button type="button" variant="outline" size="sm" @click="addOption">
              <Icon name="lucide:plus" class="w-4 h-4 mr-1" /> Add option
            </Button>
          </div>
        </FormGroup>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.openNow" type="checkbox" class="rounded" />
          Open for voting immediately (otherwise saved as draft)
        </label>

        <div class="flex justify-end gap-2">
          <Button variant="ghost" @click="showCreate = false">Cancel</Button>
          <Button :disabled="creating" @click="createPoll">
            <Icon v-if="creating" name="lucide:loader-circle" class="w-4 h-4 mr-1 animate-spin" />
            {{ creating ? 'Creating…' : 'Create poll' }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- List -->
    <div v-if="loading" class="py-20 text-center text-muted-foreground">
      <Icon name="lucide:loader-circle" class="w-6 h-6 animate-spin inline" />
    </div>

    <div v-else-if="!polls.length" class="py-20 text-center text-muted-foreground">
      No polls yet. Create your first one above.
    </div>

    <div v-else class="space-y-4">
      <Card v-for="poll in polls" :key="poll.id">
        <CardContent class="pt-6">
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold">{{ poll.question }}</h3>
                <span class="text-xs px-2 py-0.5 rounded-full capitalize" :class="statusClass[poll.status]">
                  {{ poll.status }}
                </span>
                <Badge v-if="poll.category" variant="outline">{{ poll.category }}</Badge>
              </div>
              <p v-if="poll.description" class="text-sm text-muted-foreground mt-1">{{ poll.description }}</p>
            </div>
            <div class="flex gap-2 shrink-0">
              <Button
                v-if="poll.status !== 'open'"
                size="sm"
                :disabled="busyId === poll.id"
                @click="setStatus(poll, 'open')">
                Open
              </Button>
              <Button
                v-if="poll.status === 'open'"
                size="sm"
                variant="outline"
                :disabled="busyId === poll.id"
                @click="setStatus(poll, 'closed')">
                Close
              </Button>
              <Button
                size="sm"
                variant="ghost"
                :disabled="busyId === poll.id"
                @click="deletePoll(poll)">
                <Icon name="lucide:trash-2" class="w-4 h-4" />
              </Button>
            </div>
          </div>

          <!-- Results -->
          <div class="mt-4 space-y-2">
            <div v-for="opt in sortedOptions(poll)" :key="opt.id">
              <div class="flex justify-between text-sm mb-1">
                <span>{{ opt.label }}</span>
                <span class="text-muted-foreground tabular-nums">
                  {{ tallyFor(poll.id)[opt.id] || 0 }} ({{ pct(poll.id, opt.id) }}%)
                </span>
              </div>
              <div class="h-2 rounded-full bg-muted overflow-hidden">
                <div class="h-full bg-primary" :style="{ width: pct(poll.id, opt.id) + '%' }" />
              </div>
            </div>
            <p class="text-xs text-muted-foreground pt-1">{{ totalFor(poll.id) }} total votes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
