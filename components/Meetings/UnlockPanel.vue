<script setup lang="ts">
/**
 * Liquid-glass unlock dialog for /board-meetings.
 *
 * Built on reka-ui's dialog primitives rather than the shared ui/dialog so it
 * can carry the glass treatment (.glass-scrim / .glass-panel) without changing
 * every other dialog in the app. Using the primitives still gets focus trapping,
 * focus restore, Escape-to-close and scroll locking for free.
 *
 * The page owns the unlock logic and passes it in as `submit`, so there's one
 * implementation rather than two that can drift.
 */
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui';

const props = defineProps<{
	/** e.g. "5 agendas, 4 minutes and 2 recordings" — what's behind the lock. */
	summary: string;
	hint: string | null;
	/** Resolves to an error message, or null on success. */
	submit: (passphrase: string) => Promise<string | null>;
}>();

const open = defineModel<boolean>('open', { default: false });

const passphrase = ref('');
const busy = ref(false);
const error = ref<string | null>(null);

// Clear state whenever it reopens, so a previous failure isn't still on screen.
watch(open, (isOpen) => {
	if (isOpen) {
		passphrase.value = '';
		error.value = null;
	}
});

async function onSubmit() {
	if (!passphrase.value.trim() || busy.value) return;
	busy.value = true;
	error.value = await props.submit(passphrase.value);
	busy.value = false;
	if (!error.value) {
		passphrase.value = '';
		open.value = false;
	}
}
</script>

<template>
	<DialogRoot v-model:open="open">
		<DialogPortal>
			<DialogOverlay
				class="glass-scrim fixed inset-0 z-50" />

			<DialogContent
				class="glass-panel fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6 focus:outline-none">
				<DialogClose
					class="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
					<Icon name="lucide:x" class="h-4 w-4" />
					<span class="sr-only">Close</span>
				</DialogClose>

				<DialogTitle
					class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-strong">
					<Icon name="lucide:lock" class="h-4 w-4" />
					Records are protected
				</DialogTitle>

				<DialogDescription class="mt-3 text-sm leading-relaxed text-foreground">
					The schedule is open to everyone. Enter the passphrase to open
					<strong>{{ summary || 'the meeting records' }}</strong
					>.
				</DialogDescription>

				<p v-if="hint" class="mt-1.5 text-sm text-muted-foreground">{{ hint }}</p>

				<form class="mt-5 flex items-end gap-2" @submit.prevent="onSubmit">
					<div class="flex-1">
						<label for="meetings-unlock" class="sr-only">Passphrase</label>
						<input
							id="meetings-unlock"
							v-model="passphrase"
							type="password"
							autocomplete="current-password"
							placeholder="Passphrase"
							class="field-underline h-9 w-full px-1 text-sm text-foreground placeholder:text-muted-foreground" />
					</div>
					<Button type="submit" size="sm" :disabled="busy || !passphrase.trim()">
						<Icon
							:name="busy ? 'lucide:loader-circle' : 'lucide:unlock'"
							class="h-4 w-4"
							:class="busy ? 'animate-spin' : ''" />
						{{ busy ? 'Checking' : 'Unlock' }}
					</Button>
				</form>

				<p v-if="error" class="mt-3 text-sm text-destructive">{{ error }}</p>

				<p class="mt-4 text-xs text-muted-foreground">
					Need the passphrase? Email
					<a
						href="mailto:lenoxplazaboard@gmail.com?subject=Board%20meeting%20records%20access"
						class="text-primary-strong underline underline-offset-4">
						lenoxplazaboard@gmail.com </a
					>.
				</p>
			</DialogContent>
		</DialogPortal>
	</DialogRoot>
</template>
