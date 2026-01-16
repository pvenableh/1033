<template>
	<div v-if="editor" class="channel-message-editor relative">
		<!-- Reply indicator -->
		<Transition name="slide-down">
			<div
				v-if="replyTo"
				class="reply-indicator flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-b-0 border-primary-200 dark:border-primary-800 rounded-t-lg">
				<div class="flex-1 flex items-center gap-2 min-w-0">
					<Icon name="i-heroicons-arrow-uturn-left" class="w-4 h-4 text-primary rotate-180 flex-shrink-0" />
					<span class="text-sm text-primary-700 dark:text-primary-300 flex-shrink-0">Replying to</span>
					<span class="font-medium text-sm text-primary-800 dark:text-primary-200 flex-shrink-0">
						{{ replyToAuthorName }}
					</span>
					<span class="text-sm text-primary dark:text-primary truncate">{{ replyToPreview }}</span>
				</div>
				<Button
					size="xs"
					color="primary"
					variant="ghost"
					icon="i-heroicons-x-mark"
					class="flex-shrink-0"
					@click="$emit('cancel-reply')" />
			</div>
		</Transition>

		<editor-content
			:editor="editor"
			class="border border-gray-300 dark:border-gray-600 dark:text-white text-[14px] transition-all duration-200 overflow-y-auto focus:border-primary relative"
			:class="[
				{'ring-2 ring-primary': editor.isFocused},
				replyTo ? 'rounded-b-lg border-t-0' : 'rounded-lg',
				height,
			]" />

		<div
			class="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-b-lg border-x border-b border-gray-300 dark:border-gray-600">
			<div class="flex items-center gap-1">
				<!-- Formatting buttons -->
				<Button
					v-for="(button, index) in toolbarButtons"
					:key="index"
					size="xs"
					variant="ghost"
					color="gray"
					:icon="button.icon"
					:class="{'bg-gray-200 dark:bg-gray-700': editor.isActive(button.command)}"
					@click="button.action" />

				<!-- Mention button -->
				<Button size="xs" variant="ghost" color="gray" icon="i-heroicons-at-symbol" @click="insertMentionTrigger" />

				<!-- File upload button -->
				<Button
					v-if="allowUploads"
					size="xs"
					variant="ghost"
					color="gray"
					icon="i-heroicons-paper-clip"
					@click="$refs.fileInput.click()" />
			</div>

			<div class="flex items-center gap-2">
				<!-- Enter-to-send toggle -->
				<Tooltip
					:text="enterToSend ? 'Enter sends message (Shift+Enter for new line)' : 'Click to enable Enter to send'">
					<Button
						size="xs"
						:variant="enterToSend ? 'solid' : 'ghost'"
						:color="enterToSend ? 'primary' : 'gray'"
						class="text-xs font-mono px-1.5"
						@click="toggleEnterToSend">
						<span class="flex items-center gap-0.5">
							<Icon name="i-heroicons-arrow-turn-down-left" class="w-3 h-3" />
							<span class="hidden sm:inline text-[10px]">Enter</span>
						</span>
					</Button>
				</Tooltip>

				<!-- Character count -->
				<span
					v-if="showCharCount && characterLimit > 0"
					class="text-xs"
					:class="{
						'text-red-500': characterCount > characterLimit,
						'text-gray-500': characterCount <= characterLimit,
					}">
					{{ characterCount }} / {{ characterLimit }}
				</span>

				<!-- Send button -->
				<Button size="xs" color="primary" :icon="'i-heroicons-paper-airplane'" :disabled="!canSend" @click="handleSend">
					Send
				</Button>
			</div>
		</div>

		<input ref="fileInput" type="file" multiple class="hidden" @change="handleFileUpload" />

		<Progress v-if="isUploading" :value="uploadProgress" color="primary" class="mt-2" />

		<!-- Mentions popup portal -->
		<div ref="mentionsPortal" class="mentions-portal" />
	</div>
</template>

<script setup lang="ts">
import type {PropType} from 'vue';
import StarterKit from '@tiptap/starter-kit';
import {Editor, EditorContent} from '@tiptap/vue-3';
import {Extension} from '@tiptap/core';
import {Plugin} from '@tiptap/pm/state';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import Mention from '@tiptap/extension-mention';
import type {MentionData, ChannelMessageWithRelations} from '~/types/channels';
import {Progress} from '~/components/ui/progress';

const {processUpload, validateFiles} = useFileUpload();

// Default folder for channel message uploads
const CHANNEL_UPLOADS_FOLDER = 'a37304fc-9bf9-40a2-838e-647adb2d10e4';

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
	},
	channelId: {
		type: String,
		default: null,
	},
	replyTo: {
		type: Object as PropType<ChannelMessageWithRelations | null>,
		default: null,
	},
	height: {
		type: String,
		default: 'min-h-[80px] max-h-[200px]',
	},
	characterLimit: {
		type: Number,
		default: 2000,
	},
	showCharCount: {
		type: Boolean,
		default: true,
	},
	allowUploads: {
		type: Boolean,
		default: true,
	},
	placeholder: {
		type: String,
		default: 'Type a message... Use @ to mention someone',
	},
	folderId: {
		type: String,
		default: null,
	},
});

const emit = defineEmits(['update:modelValue', 'send', 'mention', 'files-uploaded', 'cancel-reply']);

// Computed folder ID - use prop if provided, otherwise default folder
const uploadFolderId = computed(() => props.folderId ?? CHANNEL_UPLOADS_FOLDER);

// Reply computed properties
const replyToAuthorName = computed(() => {
	if (!props.replyTo) return '';
	const author = props.replyTo.user_created;
	if (!author || typeof author === 'string') return 'Unknown';
	return `${author.first_name} ${author.last_name}`;
});

const replyToPreview = computed(() => {
	if (!props.replyTo || !props.replyTo.content) return '';
	const text = props.replyTo.content.replace(/<[^>]*>/g, '');
	return text.length > 60 ? text.substring(0, 60) + '...' : text;
});

// Enter-to-send toggle state (persisted in localStorage)
const enterToSend = ref(false);

const editor = ref<Editor | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const mentionsPortal = ref<HTMLElement | null>(null);
const mentionedUsers = ref<MentionData[]>([]);

const {uploadFiles, updateFile} = useDirectusFiles();
const {getMentionableUsers} = useChannels();
const {user: currentUser} = useDirectusAuth();
const config = useRuntimeConfig();
const toast = useToast();

const toolbarButtons = [
	{icon: 'i-heroicons-bold', command: 'bold', action: () => editor.value?.chain().focus().toggleBold().run()},
	{icon: 'i-heroicons-italic', command: 'italic', action: () => editor.value?.chain().focus().toggleItalic().run()},
	{
		icon: 'i-heroicons-strikethrough',
		command: 'strike',
		action: () => editor.value?.chain().focus().toggleStrike().run(),
	},
	{
		icon: 'i-heroicons-list-bullet',
		command: 'bulletList',
		action: () => editor.value?.chain().focus().toggleBulletList().run(),
	},
];

const characterCount = computed(() => {
	return editor.value?.storage.characterCount.characters() ?? 0;
});

const canSend = computed(() => {
	const content = editor.value?.getHTML() ?? '';
	const hasContent = content.replace(/<[^>]*>/g, '').trim().length > 0;
	const withinLimit = props.characterLimit === 0 || characterCount.value <= props.characterLimit;
	return hasContent && withinLimit && !isUploading.value;
});

// Insert @ to trigger mentions
const insertMentionTrigger = () => {
	editor.value?.chain().focus().insertContent('@').run();
};

// Toggle enter-to-send and persist preference
const toggleEnterToSend = () => {
	enterToSend.value = !enterToSend.value;
	localStorage.setItem('channel-enter-to-send', String(enterToSend.value));
};

// Handle sending the message
const handleSend = () => {
	if (!canSend.value) return;

	const content = editor.value?.getHTML() ?? '';
	const mentionIds = mentionedUsers.value.map((u) => u.id);

	emit('send', {
		content,
		mentionedUserIds: mentionIds,
		parentId: props.replyTo?.id || null,
	});

	// Clear editor
	editor.value?.commands.clearContent();
	mentionedUsers.value = [];
};

// Handle file uploads
const handleFileUpload = async (event: Event) => {
	const target = event.target as HTMLInputElement;
	const files = Array.from(target.files || []);
	await handleFiles(files);
	target.value = '';
};

const handleFiles = async (files: File[]) => {
	if (!files.length) return;

	try {
		const validation = validateFiles(files);
		if (!validation.isValid) {
			toast.add({
				title: 'Invalid Files',
				description: validation.errors.join('\n'),
				color: 'red',
			});
			return;
		}

		isUploading.value = true;
		uploadProgress.value = 0;

		const {formData, processedFiles} = await processUpload(files);
		const result = await uploadFiles(formData);
		const uploadedFiles = Array.isArray(result) ? result : [result];

		// Update files with folder
		await Promise.all(
			uploadedFiles.map(async (file: any) => {
				try {
					await updateFile(file.id, {
						folder: uploadFolderId.value,
						title: processedFiles.find((pf: any) => pf.sanitizedName === file.filename_download)?.originalName,
					});
				} catch (updateError) {
					console.error('Error updating file:', updateError);
				}
			})
		);

		// Insert files into editor
		uploadedFiles.forEach((file: any) => {
			const fileUrl = `${config.public.directusUrl}/assets/${file.id}`;
			const processedFile = processedFiles.find((pf: any) => pf.sanitizedName === file.filename_download);

			if (processedFile?.type.startsWith('image/')) {
				editor.value
					?.chain()
					.focus()
					.setImage({
						src: fileUrl,
						alt: processedFile.originalName,
					})
					.run();
			} else {
				const displayText = file.filename_download;
				editor.value?.chain().focus().setLink({href: fileUrl}).insertContent(displayText).run();
			}
		});

		emit('files-uploaded', uploadedFiles);
	} catch (error: any) {
		console.error('Upload failed:', error);
		toast.add({
			title: 'Error',
			description: error.message || 'Failed to upload files',
			color: 'red',
		});
	} finally {
		isUploading.value = false;
		uploadProgress.value = 0;
	}
};

// File drop extension
const FileUpload = Extension.create({
	name: 'fileUpload',
	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					handleDrop: (view, event) => {
						const hasFiles = event.dataTransfer?.files?.length;
						if (!hasFiles) return false;
						event.preventDefault();
						handleFiles(Array.from(event.dataTransfer.files));
						return true;
					},
				},
			}),
		];
	},
});

// Enter-to-send extension
const EnterToSend = Extension.create({
	name: 'enterToSend',
	addKeyboardShortcuts() {
		return {
			Enter: () => {
				// Only handle if enterToSend is enabled and no modifier keys
				if (!enterToSend.value) return false;

				// Check if mentions popup is open (don't send if selecting a mention)
				const mentionsPopup = document.querySelector('.mentions-menu');
				if (mentionsPopup && mentionsPopup.children.length > 0) return false;

				// Check if can send
				if (canSend.value) {
					handleSend();
					return true;
				}
				return false;
			},
			'Shift-Enter': () => {
				// Always allow new line with Shift+Enter
				return false;
			},
		};
	},
});

// Create custom Mention extension with suggestion popup
const CustomMention = Mention.configure({
	HTMLAttributes: {
		class: 'mention',
	},
	suggestion: {
		char: '@',
		items: async ({query}: {query: string}) => {
			if (!currentUser.value) return [];

			try {
				const users = await getMentionableUsers(props.channelId);

				return users
					.filter((user: any) => {
						const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
						return fullName.includes(query.toLowerCase()) && user.id !== currentUser.value?.id;
					})
					.map((user: any) => ({
						id: user.id,
						label: `${user.first_name} ${user.last_name}`,
						email: user.email,
						avatar: user.avatar ? `${config.public.directusUrl}/assets/${user.avatar}?key=small` : null,
					}));
			} catch (error) {
				console.error('Error fetching mentionable users:', error);
				return [];
			}
		},
		render: () => {
			let popup: HTMLElement | null = null;
			let selectedIndex = 0;
			let mentionRange: any = null;
			let currentItems: MentionData[] = [];
			let currentClientRect: (() => DOMRect) | null = null;

			const positionPopup = (coords: DOMRect) => {
				if (!popup || !mentionsPortal.value) return;

				const portalRect = mentionsPortal.value.getBoundingClientRect();
				const viewportHeight = window.innerHeight;

				let left = coords.left - portalRect.left;
				let top = coords.bottom - portalRect.top + 4;

				// Flip to top if not enough space below
				if (coords.bottom + popup.offsetHeight > viewportHeight) {
					top = coords.top - portalRect.top - popup.offsetHeight - 4;
				}

				// Keep within bounds
				const maxLeft = portalRect.width - popup.offsetWidth;
				left = Math.max(0, Math.min(left, maxLeft));

				popup.style.transform = `translate3d(${left}px, ${top}px, 0)`;
			};

			const renderItems = (items: MentionData[]) => {
				currentItems = items;
				if (!popup) return;

				if (items.length === 0) {
					popup.innerHTML = `
						<div class="py-2 px-3 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
							No users found
						</div>
					`;
					return;
				}

				popup.innerHTML = `
					<div class="max-h-48 overflow-y-auto py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
						${items
							.map(
								(item, index) => `
							<div class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${
								index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
							}" data-index="${index}">
								<img
									src="${item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=eeeeee&color=00bfff`}"
									class="w-8 h-8 rounded-full object-cover"
									alt="${item.label}"
									onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=eeeeee&color=00bfff'"
								>
								<div>
									<div class="font-medium text-sm text-gray-900 dark:text-white">${item.label}</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">${item.email || ''}</div>
								</div>
							</div>
						`
							)
							.join('')}
					</div>
				`;

				if (currentClientRect) {
					positionPopup(currentClientRect());
				}
			};

			const selectItem = (item: MentionData) => {
				if (!editor.value || !mentionRange) return;

				// Track mentioned user
				if (!mentionedUsers.value.find((u) => u.id === item.id)) {
					mentionedUsers.value.push(item);
				}

				editor.value
					.chain()
					.focus()
					.deleteRange(mentionRange)
					.insertContentAt(mentionRange.from, [
						{
							type: 'mention',
							attrs: {
								id: item.id,
								label: item.label,
							},
						},
						{type: 'text', text: ' '},
					])
					.run();

				emit('mention', item);
				popup?.remove();
				popup = null;
			};

			return {
				onStart: ({items, clientRect, range}: any) => {
					selectedIndex = 0;
					mentionRange = range;
					currentClientRect = clientRect;

					if (!popup) {
						popup = document.createElement('div');
						popup.classList.add('mentions-menu');
						popup.style.position = 'absolute';
						popup.style.zIndex = '50';
						mentionsPortal.value?.appendChild(popup);

						popup.addEventListener('click', (e) => {
							const target = (e.target as HTMLElement).closest('[data-index]');
							if (target) {
								selectedIndex = parseInt(target.getAttribute('data-index') || '0');
								const selectedItem = currentItems[selectedIndex];
								if (selectedItem) {
									selectItem(selectedItem);
								}
							}
						});
					}

					renderItems(items);
					const coords = clientRect?.();
					if (coords) positionPopup(coords);
				},

				onUpdate: ({items, clientRect, range}: any) => {
					selectedIndex = 0;
					mentionRange = range;
					currentClientRect = clientRect;
					renderItems(items);
					const coords = clientRect?.();
					if (coords) positionPopup(coords);
				},

				onKeyDown: ({event}: {event: KeyboardEvent}) => {
					if (!popup || currentItems.length === 0) return false;

					if (event.key === 'ArrowUp') {
						selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
						renderItems(currentItems);
						return true;
					}

					if (event.key === 'ArrowDown') {
						selectedIndex = (selectedIndex + 1) % currentItems.length;
						renderItems(currentItems);
						return true;
					}

					if (event.key === 'Enter') {
						event.preventDefault();
						const selectedItem = currentItems[selectedIndex];
						if (selectedItem) {
							selectItem(selectedItem);
						}
						return true;
					}

					if (event.key === 'Escape') {
						popup?.remove();
						popup = null;
						return true;
					}

					return false;
				},

				onExit: () => {
					popup?.remove();
					popup = null;
					mentionRange = null;
					currentItems = [];
					selectedIndex = 0;
					currentClientRect = null;
				},
			};
		},
	},
});

// Watch for external model value changes
watch(
	() => props.modelValue,
	(value) => {
		if (editor.value && editor.value.getHTML() !== value) {
			editor.value.commands.setContent(value, false);
		}
	}
);

onMounted(() => {
	// Load enter-to-send preference from localStorage
	const savedPreference = localStorage.getItem('channel-enter-to-send');
	if (savedPreference !== null) {
		enterToSend.value = savedPreference === 'true';
	}

	editor.value = new Editor({
		extensions: [
			StarterKit,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					target: '_blank',
					rel: 'noopener noreferrer',
				},
			}),
			Image,
			FileUpload,
			EnterToSend,
			CharacterCount.configure({
				limit: props.characterLimit > 0 ? props.characterLimit : undefined,
			}),
			CustomMention,
		],
		content: props.modelValue,
		editorProps: {
			attributes: {
				class: 'prose prose-sm dark:prose-invert max-w-none p-3 focus:outline-none',
			},
		},
		onUpdate: () => {
			if (editor.value) {
				emit('update:modelValue', editor.value.getHTML());
			}
		},
	});
});

onBeforeUnmount(() => {
	editor.value?.destroy();
});
</script>

<style>
.channel-message-editor .ProseMirror {
	min-height: 60px;
}

.channel-message-editor .ProseMirror p.is-editor-empty:first-child::before {
	content: attr(data-placeholder);
	float: left;
	color: #adb5bd;
	pointer-events: none;
	height: 0;
}

.channel-message-editor .mention {
	color: #0ea5e9;
	font-weight: 500;
	background: rgba(14, 165, 233, 0.1);
	padding: 0.1em 0.3em;
	border-radius: 0.25em;
	text-decoration: none;
	white-space: nowrap;
}

.channel-message-editor .ProseMirror:focus {
	outline: none;
}

.channel-message-editor .ProseMirror img {
	max-width: 100%;
	height: auto;
	border-radius: 0.5rem;
	margin: 0.5rem 0;
}

.channel-message-editor .ProseMirror ul,
.channel-message-editor .ProseMirror ol {
	padding-left: 1.5rem;
}

.channel-message-editor .ProseMirror a {
	color: #0ea5e9;
	text-decoration: underline;
}

.mentions-portal {
	position: relative;
}

.mentions-menu {
	position: absolute;
	z-index: 50;
}

/* Reply indicator slide transition */
.slide-down-enter-active,
.slide-down-leave-active {
	transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
	opacity: 0;
	transform: translateY(-10px);
}

.reply-indicator {
	animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
	0%,
	100% {
		border-color: rgb(var(--color-primary-200));
	}
	50% {
		border-color: rgb(var(--color-primary-400));
	}
}
</style>
