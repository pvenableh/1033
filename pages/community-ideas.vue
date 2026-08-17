<script setup lang="ts">
import type { Idea } from '~/composables/useIdeas';
import type { Poll } from '~/composables/usePolls';

// Public page — intentionally no auth middleware.
definePageMeta({ layout: 'default' });

useSeoMeta({
  title: 'Community Ideas — 1033 Lenox',
  description:
    "Share and vote on ideas for our building's shared spaces. A space for residents of 1033 Lenox to shape our community.",
});

// IDEA_CATEGORIES is a named export of useIdeas.ts (auto-imported by Nuxt).
const { listPublished, listMine } = useIdeas();
const { listVisible } = usePolls();
const { user, loggedIn } = useDirectusAuth();

const ideas = ref<Idea[]>([]);
const polls = ref<Poll[]>([]);
const mine = ref<Idea[]>([]);
const loadingFeed = ref(true);
const activeCategory = ref<string | null>(null);

// Signed-in residents get their identity pre-filled into the submit form.
const prefill = computed(() =>
  loggedIn.value && user.value
    ? {
        name: [user.value.first_name, user.value.last_name].filter(Boolean).join(' '),
        email: user.value.email,
      }
    : null
);

const loadMine = async () => {
  if (!loggedIn.value) {
    mine.value = [];
    return;
  }
  try {
    mine.value = await listMine();
  } catch (error) {
    console.error('Failed to load your submissions:', error);
  }
};

const categories = ['All', ...IDEA_CATEGORIES];

const loadFeed = async () => {
  loadingFeed.value = true;
  try {
    [ideas.value, polls.value] = await Promise.all([
      listPublished(activeCategory.value),
      listVisible(activeCategory.value),
    ]);
  } catch (error) {
    console.error('Failed to load community feed:', error);
  } finally {
    loadingFeed.value = false;
  }
};

const selectCategory = (cat: string) => {
  activeCategory.value = cat === 'All' ? null : cat;
};

const onSubmitted = () => {
  loadFeed();
  loadMine();
};

watch(activeCategory, loadFeed);
onMounted(() => {
  loadFeed();
  loadMine();
});

const formRef = ref<HTMLElement | null>(null);
const scrollToForm = () => formRef.value?.scrollIntoView({ behavior: 'smooth' });

const isEmpty = computed(() => !loadingFeed.value && ideas.value.length === 0 && polls.value.length === 0);
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <!-- Hero -->
    <header class="max-w-2xl mb-8">
      <h1 class="text-3xl tracking-tight">Community Ideas</h1>
      <p class="text-muted-foreground mt-2">
        Help shape the shared spaces at 1033 Lenox. Share an idea, browse what your neighbors are dreaming
        up, and weigh in on community polls.
      </p>
    </header>

    <!-- Category filter + primary action.
         The filter row scrolls horizontally on narrow screens rather than
         wrapping, so the action button keeps its place on the right. -->
    <div class="flex flex-col gap-3 mb-8 sm:flex-row-reverse sm:items-center sm:gap-4">
      <Button class="self-start shrink-0" @click="scrollToForm">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1" /> Share your idea
      </Button>

      <div class="filter-scroll w-full sm:flex-1 sm:min-w-0 overflow-x-auto">
        <div class="flex gap-2 w-max">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="px-3 py-1.5 rounded-full text-sm border transition whitespace-nowrap"
            :class="
              (cat === 'All' && !activeCategory) || cat === activeCategory
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-muted'
            "
            @click="selectCategory(cat)">
            {{ cat }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Sidebar: form + polls -->
      <aside ref="formRef" class="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:self-start">
        <CommunityIdeaSubmitForm :prefill="prefill" @submitted="onSubmitted" />

        <div v-if="polls.length" class="space-y-4">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Polls</h2>
          <CommunityPollCard
            v-for="poll in polls"
            :key="poll.id"
            :poll="poll"
            :voter-name="prefill?.name" />
        </div>
      </aside>

      <!-- Feed -->
      <section class="lg:col-span-2">
        <!-- Your submissions (signed-in residents) -->
        <div v-if="loggedIn && mine.length" class="mb-8">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Your submissions
          </h2>
          <div class="columns-1 sm:columns-2 gap-4 space-y-4">
            <CommunityIdeaCard
              v-for="idea in mine"
              :key="`mine-${idea.id}`"
              :idea="idea"
              show-status
              class="mb-4" />
          </div>
          <Separator class="mt-8" />
        </div>

        <div v-if="loadingFeed" class="py-20 text-center text-muted-foreground">
          <Icon name="lucide:loader-circle" class="w-6 h-6 animate-spin inline" />
          <p class="mt-2 text-sm">Loading the community board…</p>
        </div>

        <div v-else-if="ideas.length" class="columns-1 sm:columns-2 gap-4 space-y-4">
          <CommunityIdeaCard v-for="idea in ideas" :key="idea.id" :idea="idea" class="mb-4" />
        </div>

        <div v-else class="py-20 text-center">
          <Icon name="lucide:lightbulb" class="w-10 h-10 mx-auto text-muted-foreground/50" />
          <p class="mt-3 text-muted-foreground">
            {{
              activeCategory
                ? `No ${activeCategory} ideas yet — be the first!`
                : 'No ideas yet. Be the first to share one!'
            }}
          </p>
        </div>
      </section>
    </div>

    <p v-if="isEmpty" class="sr-only">No content available.</p>
  </div>
</template>
