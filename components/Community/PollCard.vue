<script setup lang="ts">
import type { Poll, PollResults } from '~/composables/usePolls';

const props = defineProps<{
  poll: Poll;
  // Optional: if the visitor identified as a resident this session, passing
  // their email upgrades dedup from cookie/IP to per-resident. (For signed-in
  // users the server reads identity from the session, so this isn't required.)
  voterEmail?: string;
  // When signed in, the display name powers the "voting as …" hint.
  voterName?: string;
}>();

const { getResults, vote } = usePolls();
const toast = useToast();

const results = ref<PollResults | null>(null);
const loading = ref(true);
const voting = ref(false);

const isClosed = computed(() => {
  if (props.poll.status === 'closed') return true;
  if (props.poll.closes_at) return new Date(props.poll.closes_at).getTime() < Date.now();
  return false;
});

const showResults = computed(() => isClosed.value || !!results.value?.alreadyVoted);

const sortedOptions = computed(() =>
  [...(props.poll.options || [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
);

const pct = (optionId: string) => {
  const total = results.value?.total || 0;
  if (!total) return 0;
  return Math.round(((results.value?.counts[optionId] || 0) / total) * 100);
};

const loadResults = async () => {
  try {
    results.value = await getResults(props.poll.id);
  } catch {
    results.value = { counts: {}, total: 0, alreadyVoted: false, votedOption: null };
  } finally {
    loading.value = false;
  }
};

const castVote = async (optionId: string) => {
  if (voting.value || showResults.value) return;
  voting.value = true;
  try {
    results.value = await vote(props.poll.id, optionId, props.voterEmail);
  } catch (error: any) {
    // 409 = already voted; the endpoint returns results in error.data
    if (error?.statusCode === 409 && error?.data?.data) {
      results.value = error.data.data;
      toast.add({ title: 'Already voted', description: 'You have already voted in this poll.', color: 'amber' });
    } else {
      toast.add({
        title: 'Vote failed',
        description: error?.data?.message || 'Please try again.',
        color: 'red',
      });
    }
  } finally {
    voting.value = false;
  }
};

onMounted(loadResults);
</script>

<template>
  <Card class="w-full break-inside-avoid">
    <CardHeader class="pb-3">
      <div class="flex items-center gap-2">
        <Icon name="lucide:bar-chart-3" class="w-4 h-4 text-primary" />
        <Badge v-if="poll.category" variant="outline">{{ poll.category }}</Badge>
        <Badge v-if="isClosed" variant="soft" class="ml-auto">Closed</Badge>
        <Badge v-else variant="soft" class="ml-auto bg-emerald-600/10 text-emerald-700">Open</Badge>
      </div>
      <CardTitle class="text-base mt-2">{{ poll.question }}</CardTitle>
      <CardDescription v-if="poll.description">{{ poll.description }}</CardDescription>
    </CardHeader>

    <CardContent>
      <div v-if="loading" class="py-6 text-center text-sm text-muted-foreground">
        <Icon name="lucide:loader-circle" class="w-4 h-4 animate-spin inline" /> Loading…
      </div>

      <!-- Ballot -->
      <div v-else-if="!showResults" class="space-y-2">
        <p v-if="voterName" class="text-xs text-muted-foreground flex items-center gap-1 mb-1">
          <Icon name="lucide:badge-check" class="w-3 h-3 text-emerald-600" />
          Voting as {{ voterName }} — your vote counts once.
        </p>
        <button
          v-for="opt in sortedOptions"
          :key="opt.id"
          type="button"
          :disabled="voting"
          class="w-full text-left px-4 py-2.5 rounded-md border hover:border-primary hover:bg-primary/5 transition disabled:opacity-60"
          @click="castVote(opt.id)">
          {{ opt.label }}
        </button>
      </div>

      <!-- Results -->
      <div v-else class="space-y-3">
        <div v-for="opt in sortedOptions" :key="opt.id">
          <div class="flex justify-between text-sm mb-1">
            <span class="flex items-center gap-1.5">
              <Icon
                v-if="results?.votedOption === opt.id"
                name="lucide:check"
                class="w-3.5 h-3.5 text-primary" />
              {{ opt.label }}
            </span>
            <span class="text-muted-foreground tabular-nums">{{ pct(opt.id) }}%</span>
          </div>
          <div class="h-2 rounded-full bg-muted overflow-hidden">
            <div
              class="h-full bg-primary transition-all duration-500"
              :class="{ 'opacity-60': results?.votedOption !== opt.id }"
              :style="{ width: pct(opt.id) + '%' }" />
          </div>
        </div>
        <p class="text-xs text-muted-foreground pt-1">
          {{ results?.total || 0 }} vote{{ (results?.total || 0) === 1 ? '' : 's' }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>
