<script setup lang="ts">
/**
 * GreetingWidget - Time-based personalized greeting
 *
 * Displays "Good morning/afternoon/evening" based on local time
 * with optional user's first name if authenticated.
 * Falls back to guestGreeting (e.g., "Welcome") for unauthenticated visitors.
 * Includes motivational tagline with day of week.
 */

interface Props {
	/** Override the user's first name (for unauthenticated/custom use) */
	name?: string;
	/** Greeting to show when no user name is available */
	guestGreeting?: string;
	/** Show the current time */
	showTime?: boolean;
	/** Show the current date */
	showDate?: boolean;
	/** Show motivational tagline */
	showTagline?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	name: '',
	guestGreeting: '',
	showTime: false,
	showDate: false,
	showTagline: true,
});

// Motivational adjectives array
const motivationalWords = [
	'productive',
	'beautiful',
	'wonderful',
	'amazing',
	'fantastic',
	'brilliant',
	'inspiring',
	'energizing',
	'refreshing',
	'promising',
	'exciting',
	'magnificent',
	'glorious',
	'spectacular',
	'remarkable',
	'incredible',
	'perfect',
	'exceptional',
	'outstanding',
	'memorable',
];

// Try to get authenticated user
const {user} = useDirectusAuth();

// Reactive current time (updates every minute)
const now = ref(new Date());
let intervalId: NodeJS.Timeout | null = null;

// Pick a random word once on mount (persists for session)
const motivationalWord = ref('');

onMounted(() => {
	// Pick random motivational word
	motivationalWord.value = motivationalWords[Math.floor(Math.random() * motivationalWords.length)];

	intervalId = setInterval(() => {
		now.value = new Date();
	}, 60000); // Update every minute
});

onUnmounted(() => {
	if (intervalId) clearInterval(intervalId);
});

// Get display name: prop override > authenticated user > empty
const displayName = computed(() => {
	if (props.name) return props.name;
	if (user.value?.first_name) return user.value.first_name;
	return '';
});

// Determine if we should use guest greeting (no name available)
const isGuest = computed(() => !displayName.value);

// Calculate time of day
const timeOfDay = computed(() => {
	const hour = now.value.getHours();
	if (hour >= 5 && hour < 12) return 'morning';
	if (hour >= 12 && hour < 17) return 'afternoon';
	if (hour >= 17 && hour < 21) return 'evening';
	return 'night';
});

// Generate simple greeting (without day)
const greeting = computed(() => {
	// If guest and guestGreeting provided, use that instead
	if (isGuest.value && props.guestGreeting) {
		return props.guestGreeting;
	}

	const greetings: Record<string, string> = {
		morning: 'Good morning ☀️',
		afternoon: 'Good afternoon 🌴',
		evening: 'Good evening 🌙',
		night: 'Good night ✨',
	};
	return greetings[timeOfDay.value];
});

// Get day name
const dayName = computed(() => {
	return now.value.toLocaleDateString('en-US', {weekday: 'long'});
});

// Generate motivational tagline with proper a/an grammar
const tagline = computed(() => {
	const word = motivationalWord.value;
	const startsWithVowel = /^[aeiou]/i.test(word);
	const article = startsWithVowel ? 'an' : 'a';
	return `It's going to be ${article} ${word} ${dayName.value}.`;
});

// Format current time
const formattedTime = computed(() => {
	return now.value.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});
});

// Format current date
const formattedDate = computed(() => {
	return now.value.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	});
});
</script>

<template>
	<div class="widget-greeting-text flex flex-col gap-0.5">
		<div class="flex items-center gap-1">
			<span class="font-semibold">{{ greeting }}</span>
			<span v-if="displayName">, {{ displayName }}</span>
		</div>
		<div v-if="showTagline && motivationalWord" class="text-cream/70 italic font-light normal-case tracking-normal">
			{{ tagline }}
		</div>
		<div v-if="showDate || showTime" class="flex gap-2 text-cream/60">
			<span v-if="showDate">{{ formattedDate }}</span>
			<span v-if="showTime">{{ formattedTime }}</span>
		</div>
	</div>
</template>
