<template>
	<div v-if="editor" class="unified-message-editor relative">
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

		<!-- Optional avatar display -->
		<div class="flex gap-3" :class="{ 'mt-0': !replyTo }">
			<Avatar
				v-if="showAvatar"
				:src="currentUserAvatar"
				:alt="currentUserName"
				size="sm"
				class="flex-shrink-0 mt-1" />

			<div class="flex-1">
				<!-- Editor content area -->
				<editor-content
					:editor="editor"
					class="editor-content border border-gray-300 dark:border-gray-600 dark:text-white text-[14px] transition-all duration-200 overflow-y-auto focus:border-primary relative"
					:class="[
						{'ring-2 ring-primary': editor.isFocused},
						replyTo ? 'rounded-b-lg border-t-0' : 'rounded-lg',
						height,
					]" />

				<!-- Toolbar -->
				<div
					class="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-b-lg border-x border-b border-gray-300 dark:border-gray-600 mt-[-1px]">
					<div class="flex items-center gap-1">
						<!-- Formatting buttons -->
						<Button
							v-for="(button, index) in toolbarButtons"
							:key="index"
							size="xs"
							variant="ghost"
							color="gray"
							:icon="button.icon"
							:title="button.title"
							:class="{'bg-gray-200 dark:bg-gray-700': editor.isActive(button.command)}"
							@click="button.action" />

						<!-- Mention button -->
						<Button
							size="xs"
							variant="ghost"
							color="gray"
							icon="i-heroicons-at-symbol"
							title="Mention someone (@)"
							@click="insertMentionTrigger" />

						<!-- File upload button -->
						<Button
							v-if="allowUploads"
							size="xs"
							variant="ghost"
							color="gray"
							icon="i-heroicons-paper-clip"
							title="Attach file"
							@click="triggerFileUpload" />

						<!-- Link button -->
						<Popover>
							<PopoverTrigger asChild>
								<Button
									size="xs"
									variant="ghost"
									color="gray"
									icon="i-heroicons-link"
									title="Add link"
									:class="{'bg-gray-200 dark:bg-gray-700': editor.isActive('link')}" />
							</PopoverTrigger>
							<PopoverContent class="w-64 p-2" side="top">
								<div class="space-y-2">
									<Input
										v-model="linkUrl"
										placeholder="https://example.com"
										class="text-sm"
										@keyup.enter="setLink" />
									<div class="flex justify-end gap-1">
										<Button v-if="editor.isActive('link')" size="xs" color="destructive" variant="outline" @click="removeLink">
											Remove
										</Button>
										<Button size="xs" color="primary" @click="setLink">
											{{ editor.isActive('link') ? 'Update' : 'Add' }}
										</Button>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<div class="flex items-center gap-2">
						<!-- Enter-to-send toggle (optional) -->
						<Tooltip
							v-if="showEnterToSend"
							:text="enterToSend ? 'Enter sends message (Shift+Enter for new line)' : 'Click to enable Enter to send'">
							<Button
								size="xs"
								:variant="enterToSend ? 'default' : 'ghost'"
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

						<!-- Cancel button (optional) -->
						<Button
							v-if="showCancel"
							size="xs"
							color="gray"
							variant="ghost"
							@click="$emit('cancel')">
							Cancel
						</Button>

						<!-- Send/Submit button -->
						<Button
							size="xs"
							color="primary"
							:icon="'i-heroicons-paper-airplane'"
							:disabled="!canSend"
							:loading="submitting"
							@click="handleSend">
							{{ submitLabel }}
						</Button>
					</div>
				</div>
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
import Placeholder from '@tiptap/extension-placeholder';
import type {MentionData} from '~/types/comments';
import type {ChannelMessageWithRelations} from '~/types/channels';
import type {Comment} from '~/types/comments';
import {Progress} from '~/components/ui/progress';
import {Popover, PopoverContent, PopoverTrigger} from '~/components/ui/popover';
import {Tooltip} from '~/components/ui/tooltip';
import {Input} from '~/components/ui/input';

const {processUpload, validateFiles} = useFileUpload();

// Default folder for uploads
const DEFAULT_UPLOADS_FOLDER = 'a37304fc-9bf9-40a2-838e-647adb2d10e4';

// Union type for reply target
type ReplyTarget = ChannelMessageWithRelations | Comment | null;

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
	},
	// For channel context
	channelId: {
		type: String,
		default: null,
	},
	// Reply to a message
	replyTo: {
		type: Object as PropType<ReplyTarget>,
		default: null,
	},
	// Editor height
	height: {
		type: String,
		default: 'min-h-[80px] max-h-[200px]',
	},
	// Character limit
	characterLimit: {
		type: Number,
		default: 2000,
	},
	// Show character count
	showCharCount: {
		type: Boolean,
		default: true,
	},
	// Allow file uploads
	allowUploads: {
		type: Boolean,
		default: true,
	},
	// Placeholder text
	placeholder: {
		type: String,
		default: 'Type a message... Use @ to mention someone',
	},
	// Folder ID for uploads
	folderId: {
		type: String,
		default: null,
	},
	// Show avatar
	showAvatar: {
		type: Boolean,
		default: false,
	},
	// Show cancel button
	showCancel: {
		type: Boolean,
		default: false,
	},
	// Submit button label
	submitLabel: {
		type: String,
		default: 'Send',
	},
	// Show enter-to-send toggle
	showEnterToSend: {
		type: Boolean,
		default: true,
	},
	// Is submitting
	submitting: {
		type: Boolean,
		default: false,
	},
	// Context for mentions (channel or general)
	mentionContext: {
		type: String as PropType<'channel' | 'general'>,
		default: 'general',
	},
});

const emit = defineEmits(['update:modelValue', 'send', 'submit', 'mention', 'files-uploaded', 'cancel-reply', 'cancel']);

// Computed folder ID - use prop if provided, otherwise default folder
const uploadFolderId = computed(() => props.folderId ?? DEFAULT_UPLOADS_FOLDER);

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
const linkUrl = ref('');

const {uploadFiles, updateFile} = useDirectusFiles();
const {getMentionableUsers: getChannelMentionableUsers} = useChannels();
const {getMentionableUsers: getCommentMentionableUsers} = useComments();
const {user: currentUser} = useDirectusAuth();
const config = useRuntimeConfig();
const toast = useToast();

const currentUserAvatar = computed(() => {
	if (!currentUser.value?.avatar) return null;
	return `${config.public.directusUrl}/assets/${currentUser.value.avatar}?key=small`;
});

const currentUserName = computed(() => {
	if (!currentUser.value) return '';
	return `${currentUser.value.first_name} ${currentUser.value.last_name}`;
});

const toolbarButtons = [
	{icon: 'i-heroicons-bold', command: 'bold', title: 'Bold (Ctrl+B)', action: () => editor.value?.chain().focus().toggleBold().run()},
	{icon: 'i-heroicons-italic', command: 'italic', title: 'Italic (Ctrl+I)', action: () => editor.value?.chain().focus().toggleItalic().run()},
	{
		icon: 'i-heroicons-strikethrough',
		command: 'strike',
		title: 'Strikethrough',
		action: () => editor.value?.chain().focus().toggleStrike().run(),
	},
	{
		icon: 'i-heroicons-list-bullet',
		command: 'bulletList',
		title: 'Bullet List',
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
	return hasContent && withinLimit && !isUploading.value && !props.submitting;
});

// Link management
const setLink = () => {
	if (linkUrl.value) {
		editor.value?.chain().focus().setLink({href: linkUrl.value, target: '_blank'}).run();
	}
	linkUrl.value = '';
};

const removeLink = () => {
	editor.value?.chain().focus().unsetLink().run();
	linkUrl.value = '';
};

// Insert @ to trigger mentions
const insertMentionTrigger = () => {
	editor.value?.chain().focus().insertContent('@').run();
};

// Toggle enter-to-send and persist preference
const toggleEnterToSend = () => {
	enterToSend.value = !enterToSend.value;
	localStorage.setItem('unified-editor-enter-to-send', String(enterToSend.value));
};

// Trigger file upload
const triggerFileUpload = () => {
	fileInput.value?.click();
};

// Handle sending the message
const handleSend = () => {
	if (!canSend.value) return;

	const content = editor.value?.getHTML() ?? '';
	const mentionIds = mentionedUsers.value.map((u) => u.id);

	const payload = {
		content,
		mentionedUserIds: mentionIds,
		parentId: props.replyTo?.id || null,
	};

	// Emit both events for compatibility
	emit('send', payload);
	emit('submit', payload);

	// Clear editor
	editor.value?.commands.clearContent();
	mentionedUsers.value = [];
};

// Public method to clear the editor
const clearEditor = () => {
	editor.value?.commands.clearContent();
	mentionedUsers.value = [];
};

// Expose methods for parent components
defineExpose({clearEditor});

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

// Get mentionable users based on context
const getMentionableUsers = async (query: string): Promise<MentionData[]> => {
	if (!currentUser.value) return [];

	try {
		let users: any[];

		if (props.mentionContext === 'channel' && props.channelId) {
			users = await getChannelMentionableUsers(props.channelId);
		} else {
			users = await getCommentMentionableUsers();
		}

		return users
			.filter((user: any) => {
				const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
				return fullName.includes(query.toLowerCase()) && user.id !== currentUser.value?.id;
			})
			.slice(0, 10)
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
};

// Create custom Mention extension with suggestion popup
const CustomMention = Mention.configure({
	HTMLAttributes: {
		class: 'mention',
	},
	suggestion: {
		char: '@',
		items: async ({query}: {query: string}) => {
			return getMentionableUsers(query);
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
	const savedPreference = localStorage.getItem('unified-editor-enter-to-send');
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
			Placeholder.configure({
				placeholder: props.placeholder,
			}),
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
.unified-message-editor .editor-content .ProseMirror {
	min-height: 60px;
}

.unified-message-editor .editor-content .ProseMirror p.is-editor-empty:first-child::before {
	content: attr(data-placeholder);
	float: left;
	color: #adb5bd;
	pointer-events: none;
	height: 0;
}

.unified-message-editor .mention {
	color: #0ea5e9;
	font-weight: 500;
	background: rgba(14, 165, 233, 0.1);
	padding: 0.1em 0.3em;
	border-radius: 0.25em;
	text-decoration: none;
	white-space: nowrap;
}

.unified-message-editor .editor-content .ProseMirror:focus {
	outline: none;
}

.unified-message-editor .editor-content .ProseMirror img {
	max-width: 100%;
	height: auto;
	border-radius: 0.5rem;
	margin: 0.5rem 0;
}

.unified-message-editor .editor-content .ProseMirror ul,
.unified-message-editor .editor-content .ProseMirror ol {
	padding-left: 1.5rem;
}

.unified-message-editor .editor-content .ProseMirror a {
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
