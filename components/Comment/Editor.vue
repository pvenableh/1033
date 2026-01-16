<template>
	<div v-if="editor" class="comment-editor relative">
		<div class="flex gap-3">
			<UAvatar
				v-if="showAvatar"
				:src="currentUserAvatar"
				:alt="currentUserName"
				size="sm"
				class="flex-shrink-0 mt-1" />

			<div class="flex-1">
				<editor-content
					:editor="editor"
					class="border border-gray-300 dark:border-gray-600 rounded-lg dark:text-white text-sm transition-all duration-200 overflow-y-auto focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500"
					:class="[height]" />

				<div class="flex items-center justify-between mt-2">
					<div class="flex items-center gap-1">
						<!-- Formatting buttons -->
						<UButton
							v-for="(button, index) in toolbarButtons"
							:key="index"
							size="xs"
							variant="ghost"
							color="gray"
							:icon="button.icon"
							:class="{'bg-gray-200 dark:bg-gray-700': editor.isActive(button.command)}"
							@click="button.action" />

						<!-- Mention button -->
						<UButton
							size="xs"
							variant="ghost"
							color="gray"
							icon="i-heroicons-at-symbol"
							@click="insertMentionTrigger" />

						<!-- File upload button -->
						<UButton
							v-if="allowUploads"
							size="xs"
							variant="ghost"
							color="gray"
							icon="i-heroicons-paper-clip"
							@click="$refs.fileInput.click()" />

						<!-- Link button -->
						<UPopover :popper="{placement: 'top'}" mode="click">
							<UButton
								size="xs"
								variant="ghost"
								color="gray"
								icon="i-heroicons-link"
								:class="{'bg-gray-200 dark:bg-gray-700': editor.isActive('link')}" />
							<template #panel="{close}">
								<div class="p-2 w-64 space-y-2">
									<UInput
										v-model="linkUrl"
										placeholder="https://example.com"
										size="sm"
										@keyup.enter="setLink(close)" />
									<div class="flex justify-end gap-1">
										<UButton v-if="editor.isActive('link')" size="xs" color="red" variant="soft" @click="removeLink(close)">
											Remove
										</UButton>
										<UButton size="xs" color="primary" @click="setLink(close)">
											{{ editor.isActive('link') ? 'Update' : 'Add' }}
										</UButton>
									</div>
								</div>
							</template>
						</UPopover>
					</div>

					<div class="flex items-center gap-2">
						<UButton
							v-if="showCancel"
							size="xs"
							color="gray"
							variant="ghost"
							@click="$emit('cancel')">
							Cancel
						</UButton>
						<UButton
							size="xs"
							color="primary"
							:disabled="!canSubmit"
							:loading="submitting"
							@click="handleSubmit">
							{{ submitLabel }}
						</UButton>
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
import StarterKit from '@tiptap/starter-kit';
import {Editor, EditorContent} from '@tiptap/vue-3';
import {Extension} from '@tiptap/core';
import {Plugin} from '@tiptap/pm/state';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Mention from '@tiptap/extension-mention';
import type {MentionData} from '~/types/comments';
import {Progress} from '~/components/ui/progress';

const {processUpload, validateFiles} = useFileUpload();

// Default folder for comment uploads
const COMMENT_UPLOADS_FOLDER = 'aa5ef2f0-fda1-48d4-b853-f696447d3dc9';

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
	},
	placeholder: {
		type: String,
		default: 'Write a comment... Use @ to mention someone',
	},
	height: {
		type: String,
		default: 'min-h-[60px] max-h-[150px]',
	},
	showAvatar: {
		type: Boolean,
		default: true,
	},
	showCancel: {
		type: Boolean,
		default: false,
	},
	submitLabel: {
		type: String,
		default: 'Comment',
	},
	allowUploads: {
		type: Boolean,
		default: true,
	},
	folderId: {
		type: String,
		default: null,
	},
	submitting: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['update:modelValue', 'submit', 'mention', 'cancel', 'files-uploaded']);

// Computed folder ID - use prop if provided, otherwise default folder
const uploadFolderId = computed(() => props.folderId ?? COMMENT_UPLOADS_FOLDER);

const editor = ref<Editor | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const mentionsPortal = ref<HTMLElement | null>(null);
const mentionedUsers = ref<MentionData[]>([]);
const linkUrl = ref('');

const {uploadFiles, updateFile} = useDirectusFiles();
const {getMentionableUsers} = useComments();
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
	{icon: 'i-heroicons-bold', command: 'bold', action: () => editor.value?.chain().focus().toggleBold().run()},
	{icon: 'i-heroicons-italic', command: 'italic', action: () => editor.value?.chain().focus().toggleItalic().run()},
	{icon: 'i-heroicons-list-bullet', command: 'bulletList', action: () => editor.value?.chain().focus().toggleBulletList().run()},
];

const canSubmit = computed(() => {
	const content = editor.value?.getHTML() ?? '';
	const hasContent = content.replace(/<[^>]*>/g, '').trim().length > 0;
	return hasContent && !isUploading.value && !props.submitting;
});

const setLink = (close: () => void) => {
	if (linkUrl.value) {
		editor.value?.chain().focus().setLink({href: linkUrl.value, target: '_blank'}).run();
	}
	linkUrl.value = '';
	close();
};

const removeLink = (close: () => void) => {
	editor.value?.chain().focus().unsetLink().run();
	linkUrl.value = '';
	close();
};

const insertMentionTrigger = () => {
	editor.value?.chain().focus().insertContent('@').run();
};

const handleSubmit = () => {
	if (!canSubmit.value) return;

	const content = editor.value?.getHTML() ?? '';
	const mentionIds = mentionedUsers.value.map(u => u.id);

	emit('submit', {
		content,
		mentionedUserIds: mentionIds,
	});
};

const clearEditor = () => {
	editor.value?.commands.clearContent();
	mentionedUsers.value = [];
};

// Expose clear method for parent components
defineExpose({ clearEditor });

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
					await updateFile(file.id, {folder: uploadFolderId.value});
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
				editor.value?.chain().focus().setImage({
					src: fileUrl,
					alt: processedFile.originalName,
				}).run();
			} else {
				editor.value?.chain().focus().setLink({href: fileUrl}).insertContent(file.filename_download).run();
			}
		});

		emit('files-uploaded', uploadedFiles);
	} catch (error: any) {
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

// Custom Mention extension
const CustomMention = Mention.configure({
	HTMLAttributes: {
		class: 'mention',
	},
	suggestion: {
		char: '@',
		items: async ({query}: {query: string}) => {
			if (!currentUser.value) return [];

			try {
				const users = await getMentionableUsers();

				return users
					.filter((user: any) => {
						const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
						return fullName.includes(query.toLowerCase());
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

				let left = coords.left - portalRect.left;
				let top = coords.bottom - portalRect.top + 4;

				popup.style.transform = `translate3d(${left}px, ${top}px, 0)`;
			};

			const renderItems = (items: MentionData[]) => {
				currentItems = items;
				if (!popup) return;

				if (items.length === 0) {
					popup.innerHTML = `
						<div class="py-2 px-3 text-sm text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
							No users found
						</div>
					`;
					return;
				}

				popup.innerHTML = `
					<div class="max-h-48 overflow-y-auto py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
						${items.map((item, index) => `
							<div class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${
								index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
							}" data-index="${index}">
								<img
									src="${item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=eeeeee&color=00bfff`}"
									class="w-7 h-7 rounded-full object-cover"
									alt="${item.label}"
									onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.label)}&background=eeeeee&color=00bfff'"
								>
								<div>
									<div class="font-medium text-sm text-gray-900 dark:text-white">${item.label}</div>
									<div class="text-xs text-gray-500">${item.email || ''}</div>
								</div>
							</div>
						`).join('')}
					</div>
				`;

				if (currentClientRect) positionPopup(currentClientRect());
			};

			const selectItem = (item: MentionData) => {
				if (!editor.value || !mentionRange) return;

				if (!mentionedUsers.value.find(u => u.id === item.id)) {
					mentionedUsers.value.push(item);
				}

				editor.value
					.chain()
					.focus()
					.deleteRange(mentionRange)
					.insertContentAt(mentionRange.from, [
						{type: 'mention', attrs: {id: item.id, label: item.label}},
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
								if (selectedItem) selectItem(selectedItem);
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
						if (selectedItem) selectItem(selectedItem);
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
				},
			};
		},
	},
});

watch(
	() => props.modelValue,
	(value) => {
		if (editor.value && editor.value.getHTML() !== value) {
			editor.value.commands.setContent(value, false);
		}
	}
);

onMounted(() => {
	editor.value = new Editor({
		extensions: [
			StarterKit,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {target: '_blank', rel: 'noopener noreferrer'},
			}),
			Image,
			FileUpload,
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
.comment-editor .ProseMirror {
	min-height: 40px;
}

.comment-editor .ProseMirror:focus {
	outline: none;
}

.comment-editor .mention {
	color: #0ea5e9;
	font-weight: 500;
	background: rgba(14, 165, 233, 0.1);
	padding: 0.1em 0.3em;
	border-radius: 0.25em;
}

.comment-editor .ProseMirror img {
	max-width: 200px;
	height: auto;
	border-radius: 0.375rem;
	margin: 0.25rem 0;
}

.comment-editor .ProseMirror a {
	color: #0ea5e9;
	text-decoration: underline;
}

.mentions-portal {
	position: relative;
}
</style>
