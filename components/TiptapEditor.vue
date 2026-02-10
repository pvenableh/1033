<template>
	<div class="tiptap-editor-wrapper">
		<!-- Toolbar -->
		<div
			v-if="editor && showToolbar"
			class="tiptap-toolbar border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-800 p-1 flex flex-wrap items-center gap-0.5">
			<!-- Text Formatting Group -->
			<div class="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
				<ToolbarButton
					icon="i-heroicons-bold"
					:active="editor.isActive('bold')"
					title="Bold (Ctrl+B)"
					@click="editor.chain().focus().toggleBold().run()" />
				<ToolbarButton
					icon="i-heroicons-italic"
					:active="editor.isActive('italic')"
					title="Italic (Ctrl+I)"
					@click="editor.chain().focus().toggleItalic().run()" />
				<ToolbarButton
					v-if="mode === 'full'"
					icon="i-lucide-underline"
					:active="editor.isActive('underline')"
					title="Underline (Ctrl+U)"
					@click="editor.chain().focus().toggleUnderline().run()" />
				<ToolbarButton
					icon="i-heroicons-strikethrough"
					:active="editor.isActive('strike')"
					title="Strikethrough"
					@click="editor.chain().focus().toggleStrike().run()" />
			</div>

			<!-- Headings Group (full mode only) -->
			<div v-if="mode === 'full'" class="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
				<Popover v-model:open="headingOpen">
					<PopoverTrigger as-child>
						<ToolbarButton
							icon="i-lucide-heading"
							:active="editor.isActive('heading')"
							title="Headings"
							:showChevron="true" />
					</PopoverTrigger>
					<PopoverContent side="bottom" align="start" :side-offset="4" class="w-auto p-2 space-y-1 min-w-32">
						<button
							v-for="level in [1, 2, 3]"
							:key="level"
							class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
							:class="{'bg-primary-100 dark:bg-primary-900': editor.isActive('heading', {level})}"
							@click="
								editor.chain().focus().toggleHeading({level}).run();
								headingOpen = false;
							">
							<span :class="`text-${level === 1 ? 'lg' : level === 2 ? 'base' : 'sm'} font-bold`">H{{ level }}</span>
							<span class="text-gray-500 text-sm">Heading {{ level }}</span>
						</button>
						<button
							class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
							:class="{
								'bg-primary-100 dark:bg-primary-900': editor.isActive('paragraph') && !editor.isActive('heading'),
							}"
							@click="
								editor.chain().focus().setParagraph().run();
								headingOpen = false;
							">
							<span class="text-sm">P</span>
							<span class="text-gray-500 text-sm">Paragraph</span>
						</button>
					</PopoverContent>
				</Popover>
			</div>

			<!-- Lists Group -->
			<div class="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
				<ToolbarButton
					icon="i-heroicons-list-bullet"
					:active="editor.isActive('bulletList')"
					title="Bullet List"
					@click="editor.chain().focus().toggleBulletList().run()" />
				<ToolbarButton
					icon="i-lucide-list-ordered"
					:active="editor.isActive('orderedList')"
					title="Numbered List"
					@click="editor.chain().focus().toggleOrderedList().run()" />
			</div>

			<!-- Block Elements Group (full mode only) -->
			<div v-if="mode === 'full'" class="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
				<ToolbarButton
					icon="i-lucide-text-quote"
					:active="editor.isActive('blockquote')"
					title="Block Quote"
					@click="editor.chain().focus().toggleBlockquote().run()" />
				<ToolbarButton
					icon="i-lucide-code"
					:active="editor.isActive('codeBlock')"
					title="Code Block"
					@click="editor.chain().focus().toggleCodeBlock().run()" />
			</div>

			<!-- Text Alignment (full mode only) -->
			<div v-if="mode === 'full'" class="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
				<ToolbarButton
					icon="i-lucide-align-left"
					:active="editor.isActive({textAlign: 'left'})"
					title="Align Left"
					@click="editor.chain().focus().setTextAlign('left').run()" />
				<ToolbarButton
					icon="i-lucide-align-center"
					:active="editor.isActive({textAlign: 'center'})"
					title="Align Center"
					@click="editor.chain().focus().setTextAlign('center').run()" />
				<ToolbarButton
					icon="i-lucide-align-right"
					:active="editor.isActive({textAlign: 'right'})"
					title="Align Right"
					@click="editor.chain().focus().setTextAlign('right').run()" />
			</div>

			<!-- Links -->
			<div class="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
				<Popover v-model:open="linkOpen">
					<PopoverTrigger as-child>
						<ToolbarButton icon="i-heroicons-link" :active="editor.isActive('link')" title="Insert Link" />
					</PopoverTrigger>
					<PopoverContent side="bottom" align="start" :side-offset="4" class="w-80 p-3 space-y-3">
						<FormGroup label="URL">
							<Input v-model="linkUrl" placeholder="https://example.com" @keyup.enter="setLink" />
						</FormGroup>
						<div class="flex justify-end gap-2">
							<Button v-if="editor.isActive('link')" size="xs" color="red" variant="soft" @click="removeLink">
								Remove
							</Button>
							<Button size="xs" color="primary" @click="setLink">
								{{ editor.isActive('link') ? 'Update' : 'Add' }}
							</Button>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			<!-- Table (full mode only) -->
			<div v-if="mode === 'full'" class="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
				<Popover v-model:open="tableOpen">
					<PopoverTrigger as-child>
						<ToolbarButton icon="i-lucide-table" :active="editor.isActive('table')" title="Table" :showChevron="true" />
					</PopoverTrigger>
					<PopoverContent side="bottom" align="start" :side-offset="4" class="w-auto p-2 space-y-1 min-w-40">
						<button
							v-if="!editor.isActive('table')"
							class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
							@click="
								editor.chain().focus().insertTable({rows: 3, cols: 3, withHeaderRow: true}).run();
								tableOpen = false;
							">
							<Icon name="i-lucide-plus" class="w-4 h-4" />
							Insert Table
						</button>
						<template v-if="editor.isActive('table')">
							<button
								class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
								@click="
									editor.chain().focus().addColumnBefore().run();
									tableOpen = false;
								">
								<Icon name="i-lucide-columns-3" class="w-4 h-4" />
								Add Column Before
							</button>
							<button
								class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
								@click="
									editor.chain().focus().addColumnAfter().run();
									tableOpen = false;
								">
								<Icon name="i-lucide-columns-3" class="w-4 h-4" />
								Add Column After
							</button>
							<button
								class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
								@click="
									editor.chain().focus().addRowBefore().run();
									tableOpen = false;
								">
								<Icon name="i-lucide-rows-3" class="w-4 h-4" />
								Add Row Before
							</button>
							<button
								class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
								@click="
									editor.chain().focus().addRowAfter().run();
									tableOpen = false;
								">
								<Icon name="i-lucide-rows-3" class="w-4 h-4" />
								Add Row After
							</button>
							<hr class="my-1 border-gray-200 dark:border-gray-700" />
							<button
								class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
								@click="
									editor.chain().focus().deleteColumn().run();
									tableOpen = false;
								">
								<Icon name="i-lucide-trash-2" class="w-4 h-4 text-red-500" />
								Delete Column
							</button>
							<button
								class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
								@click="
									editor.chain().focus().deleteRow().run();
									tableOpen = false;
								">
								<Icon name="i-lucide-trash-2" class="w-4 h-4 text-red-500" />
								Delete Row
							</button>
							<button
								class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
								@click="
									editor.chain().focus().deleteTable().run();
									tableOpen = false;
								">
								<Icon name="i-lucide-trash-2" class="w-4 h-4 text-red-500" />
								Delete Table
							</button>
						</template>
					</PopoverContent>
				</Popover>
			</div>

			<!-- Media (full mode only) -->
			<div
				v-if="mode === 'full' && allowUploads"
				class="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
				<Popover v-model:open="mediaOpen">
					<PopoverTrigger as-child>
						<ToolbarButton icon="i-lucide-image" title="Insert Image" :showChevron="true" />
					</PopoverTrigger>
					<PopoverContent side="bottom" align="start" :side-offset="4" class="w-auto p-2 space-y-1 min-w-40">
						<button
							class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
							@click="
								triggerFileUpload();
								mediaOpen = false;
							">
							<Icon name="i-lucide-upload" class="w-4 h-4" />
							Upload Image
						</button>
						<button
							v-if="folderId"
							class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
							@click="
								openFileBrowser();
								mediaOpen = false;
							">
							<Icon name="i-lucide-folder-open" class="w-4 h-4" />
							Browse Files
						</button>
						<hr class="my-1 border-gray-200 dark:border-gray-700" />
						<button
							class="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
							@click="
								showImageUrlInput = true;
								mediaOpen = false;
							">
							<Icon name="i-lucide-link" class="w-4 h-4" />
							From URL
						</button>
					</PopoverContent>
				</Popover>
				<input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
			</div>

			<!-- Spacer -->
			<div class="flex-1"></div>

			<!-- Undo/Redo -->
			<div class="flex items-center">
				<ToolbarButton
					icon="i-lucide-undo"
					title="Undo"
					:disabled="!editor.can().undo()"
					@click="editor.chain().focus().undo().run()" />
				<ToolbarButton
					icon="i-lucide-redo"
					title="Redo"
					:disabled="!editor.can().redo()"
					@click="editor.chain().focus().redo().run()" />
			</div>
		</div>

		<!-- Editor Content -->
		<editor-content
			:editor="editor"
			class="tiptap-content border border-gray-300 dark:border-gray-600 dark:text-white transition-all duration-200 overflow-y-auto focus-within:border-primary dark:focus-within:border-primary-400"
			:class="[
				showToolbar ? 'rounded-b-lg' : 'rounded-lg',
				heightClass,
				disabled ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900',
			]" />

		<!-- Upload Progress -->
		<Progress v-if="isUploading" :value="uploadProgress" color="primary" class="mt-2" />

		<!-- Image URL Modal -->
		<Modal v-model="showImageUrlInput">
			<Card>
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Insert Image from URL</h3>
						<Button color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showImageUrlInput = false" />
					</div>
				</template>
				<div class="space-y-4">
					<FormGroup label="Image URL">
						<Input v-model="imageUrl" placeholder="https://example.com/image.jpg" @keyup.enter="insertImageFromUrl" />
					</FormGroup>
					<FormGroup label="Alt Text (optional)">
						<Input v-model="imageAlt" placeholder="Image description" />
					</FormGroup>
				</div>
				<template #footer>
					<div class="flex justify-end gap-2">
						<Button color="gray" variant="ghost" @click="showImageUrlInput = false">Cancel</Button>
						<Button color="primary" @click="insertImageFromUrl" :disabled="!imageUrl">Insert</Button>
					</div>
				</template>
			</Card>
		</Modal>

		<!-- File Browser Modal -->
		<Modal v-model="showFileBrowser" :ui="{width: 'sm:max-w-3xl'}">
			<Card class="max-h-[80vh] flex flex-col">
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Select Image</h3>
						<Button color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showFileBrowser = false" />
					</div>
				</template>

				<!-- Breadcrumb -->
				<div class="flex items-center gap-1 text-sm border-b dark:border-gray-700 pb-2 mb-3">
					<template v-for="(folder, index) in folderPath" :key="folder.id || 'root'">
						<button
							class="hover:text-primary hover:underline"
							:class="{'font-medium': index === folderPath.length - 1}"
							@click="navigateToFolder(folder.id, folder.name)">
							{{ folder.name }}
						</button>
						<Icon v-if="index < folderPath.length - 1" name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400" />
					</template>
				</div>

				<!-- Search -->
				<Input
					v-model="fileSearchQuery"
					icon="i-heroicons-magnifying-glass"
					placeholder="Search files..."
					class="mb-3" />

				<!-- File Grid -->
				<div class="flex-1 overflow-y-auto min-h-[300px]">
					<div v-if="isLoadingFiles" class="flex items-center justify-center h-full">
						<Icon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
					</div>
					<div
						v-else-if="folders.length === 0 && filteredFiles.length === 0"
						class="flex flex-col items-center justify-center h-full text-gray-500">
						<Icon name="i-lucide-folder-x" class="w-12 h-12 mb-2" />
						<p>No files found</p>
					</div>
					<div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
						<!-- Folders -->
						<button
							v-for="folder in folders"
							:key="folder.id"
							class="flex flex-col items-center p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
							@click="navigateToFolder(folder.id, folder.name || 'Folder')">
							<Icon name="i-lucide-folder" class="w-10 h-10 text-amber-500 mb-2" />
							<span class="text-xs text-center truncate w-full">{{ folder.name || 'Folder' }}</span>
						</button>

						<!-- Images Only -->
						<button
							v-for="file in filteredFiles"
							:key="file.id"
							class="flex flex-col items-center p-2 rounded-lg border dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
							@click="selectFile(file)">
							<div class="w-full aspect-square rounded overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2">
								<img
									v-if="file.type?.startsWith('image/')"
									:src="getImageThumbnail(file.id)"
									:alt="file.title || file.filename_download"
									class="w-full h-full object-cover" />
								<div v-else class="w-full h-full flex items-center justify-center">
									<Icon :name="getFileIcon(file.type || '')" class="w-8 h-8 text-gray-400" />
								</div>
							</div>
							<span class="text-xs text-center truncate w-full group-hover:text-primary">
								{{ file.title || file.filename_download }}
							</span>
						</button>
					</div>
				</div>
			</Card>
		</Modal>

		<!-- Image Lightbox -->
		<Modal v-model="showLightbox" fullscreen>
			<div class="relative flex items-center justify-center min-h-screen bg-black/90 p-4">
				<Button
					class="absolute top-4 right-4 z-10"
					color="gray"
					variant="ghost"
					icon="i-heroicons-x-mark"
					:ui="{rounded: 'rounded-full'}"
					@click="showLightbox = false" />
				<img
					v-if="lightboxSrc"
					:src="lightboxSrc"
					alt="Expanded view"
					class="max-w-full max-h-full object-contain rounded-lg" />
			</div>
		</Modal>
	</div>
</template>

<script setup lang="ts">
import {defineComponent, h} from 'vue';
import {Editor, EditorContent} from '@tiptap/vue-3';
import {Extension} from '@tiptap/core';
import {Plugin} from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CharacterCount from '@tiptap/extension-character-count';
import {Progress} from '~/components/ui/progress';

import type {DirectusFile, DirectusFolder} from '~/types/directus';

// Default folder for announcement uploads
const ANNOUNCEMENT_UPLOADS_FOLDER = '2ff19b77-0aa8-4474-af8f-20512666ddb9';

// Props
const props = defineProps<{
	modelValue?: string;
	placeholder?: string;
	mode?: 'full' | 'simple'; // full = all features, simple = basic formatting
	height?: string;
	disabled?: boolean;
	folderId?: string | null; // Organization folder for file browsing (defaults to Announcement Uploads)
	allowUploads?: boolean;
	showToolbar?: boolean;
	characterLimit?: number;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: string];
	blur: [event: FocusEvent];
	focus: [event: FocusEvent];
}>();

// Defaults
const mode = computed(() => props.mode ?? 'full');
const showToolbar = computed(() => props.showToolbar ?? true);
const allowUploads = computed(() => props.allowUploads ?? true);
const heightClass = computed(() => props.height ?? 'min-h-[200px] max-h-[500px]');

// Editor state
const editor = ref<Editor | null>(null);
const linkUrl = ref('');

// Popover open states
const headingOpen = ref(false);
const linkOpen = ref(false);
const tableOpen = ref(false);
const mediaOpen = ref(false);

// Image state
const showImageUrlInput = ref(false);
const imageUrl = ref('');
const imageAlt = ref('');
const showLightbox = ref(false);
const lightboxSrc = ref('');

// File browser state
const showFileBrowser = ref(false);
const files = ref<DirectusFile[]>([]);
const folders = ref<DirectusFolder[]>([]);
const folderPath = ref<{id: string | null; name: string}[]>([]);
const currentFolder = ref<string | null>(null);
const fileSearchQuery = ref('');
const isLoadingFiles = ref(false);

// Upload state
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadProgress = ref(0);

// Composables
const config = useRuntimeConfig();
const toast = useToast();
const filesComposable = useDirectusFiles();
const foldersComposable = useDirectusFolders();

// Filtered files (images only for browser)
const filteredFiles = computed(() => {
	let result = files.value.filter((f) => f.type?.startsWith('image/'));

	if (fileSearchQuery.value) {
		const query = fileSearchQuery.value.toLowerCase();
		result = result.filter(
			(f) => f.title?.toLowerCase().includes(query) || f.filename_download?.toLowerCase().includes(query)
		);
	}

	return result;
});

// Custom image extension with click handler
const CustomImage = Image.extend({
	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					handleClick: (view, pos, event) => {
						const node = view.state.doc.nodeAt(pos);
						if (node?.type.name === 'image') {
							event.preventDefault();
							lightboxSrc.value = node.attrs.src;
							showLightbox.value = true;
							return true;
						}
						return false;
					},
				},
			}),
		];
	},
});

// File drop extension
const FileUpload = Extension.create({
	name: 'fileUpload',
	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					handleDrop: (view, event) => {
						const hasFiles = event.dataTransfer?.files?.length;
						if (!hasFiles || !allowUploads.value) return false;

						const imageFiles = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
						if (imageFiles.length === 0) return false;

						event.preventDefault();
						handleFilesUpload(imageFiles);
						return true;
					},
				},
			}),
		];
	},
});

// Initialize editor
onMounted(() => {
	const extensions: any[] = [
		StarterKit.configure({
			heading: mode.value === 'full' ? {levels: [1, 2, 3]} : false,
			blockquote: mode.value === 'full',
			codeBlock: mode.value === 'full',
		}),
		Link.configure({
			openOnClick: true,
			HTMLAttributes: {
				target: '_blank',
				rel: 'noopener noreferrer',
			},
		}),
		CustomImage.configure({
			allowBase64: false,
			HTMLAttributes: {
				class: 'rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity',
			},
		}),
		CharacterCount.configure({
			limit: props.characterLimit || undefined,
		}),
		Placeholder.configure({
			placeholder: props.placeholder || 'Start writing...',
		}),
		FileUpload,
	];

	// Full mode extensions
	if (mode.value === 'full') {
		extensions.push(
			Underline,
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			Table.configure({
				resizable: true,
				HTMLAttributes: {
					class: 'border-collapse border border-gray-300 dark:border-gray-600 w-full',
				},
			}),
			TableRow,
			TableHeader.configure({
				HTMLAttributes: {
					class: 'border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-2 font-semibold text-left',
				},
			}),
			TableCell.configure({
				HTMLAttributes: {
					class: 'border border-gray-300 dark:border-gray-600 p-2',
				},
			})
		);
	}

	editor.value = new Editor({
		extensions,
		content: props.modelValue || '',
		editable: !props.disabled,
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
		onBlur: ({event}) => {
			emit('blur', event as FocusEvent);
		},
		onFocus: ({event}) => {
			emit('focus', event as FocusEvent);
		},
	});
});

// Cleanup
onBeforeUnmount(() => {
	editor.value?.destroy();
});

// Watch for external changes
watch(
	() => props.modelValue,
	(value) => {
		if (editor.value && editor.value.getHTML() !== value) {
			editor.value.commands.setContent(value || '', false);
		}
	}
);

watch(
	() => props.disabled,
	(value) => {
		editor.value?.setEditable(!value);
	}
);

// Link functions
const setLink = () => {
	if (linkUrl.value) {
		let url = linkUrl.value;
		// Add https:// if no protocol
		if (!/^https?:\/\//.test(url)) {
			url = 'https://' + url;
		}
		editor.value?.chain().focus().setLink({href: url, target: '_blank'}).run();
	}
	linkUrl.value = '';
	linkOpen.value = false;
};

const removeLink = () => {
	editor.value?.chain().focus().unsetLink().run();
	linkUrl.value = '';
	linkOpen.value = false;
};

// Update link URL when selection changes
watch(
	() => editor.value?.isActive('link'),
	() => {
		if (editor.value?.isActive('link')) {
			linkUrl.value = editor.value.getAttributes('link').href || '';
		}
	}
);

// Image functions
const insertImageFromUrl = () => {
	if (imageUrl.value && editor.value) {
		editor.value
			.chain()
			.focus()
			.setImage({
				src: imageUrl.value,
				alt: imageAlt.value || undefined,
			})
			.run();
	}
	imageUrl.value = '';
	imageAlt.value = '';
	showImageUrlInput.value = false;
};

const triggerFileUpload = () => {
	fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
	const input = event.target as HTMLInputElement;
	const uploadedFiles = Array.from(input.files || []);

	if (uploadedFiles.length > 0) {
		await handleFilesUpload(uploadedFiles);
	}

	// Reset input
	if (input) input.value = '';
};

// Get the upload folder - use prop if provided, otherwise use default announcement uploads folder
const uploadFolderId = computed(() => props.folderId ?? ANNOUNCEMENT_UPLOADS_FOLDER);

const handleFilesUpload = async (filesToUpload: File[]) => {
	isUploading.value = true;
	uploadProgress.value = 0;

	try {
		for (const file of filesToUpload) {
			if (!file.type.startsWith('image/')) {
				toast.add({
					title: 'Invalid file',
					description: 'Only image files are allowed',
					color: 'red',
				});
				continue;
			}

			const formData = new FormData();
			formData.append('file', file);
			formData.append('folder', uploadFolderId.value);

			const result = await filesComposable.uploadFiles(formData);
			const uploadedFile = Array.isArray(result) ? result[0] : result;

			if (uploadedFile?.id) {
				const imageUrl = `${config.public.directusUrl}/assets/${uploadedFile.id}`;
				editor.value
					?.chain()
					.focus()
					.setImage({
						src: imageUrl,
						alt: file.name,
					})
					.run();
			}

			uploadProgress.value += 100 / filesToUpload.length;
		}

		toast.add({
			title: 'Upload complete',
			description: `${filesToUpload.length} image(s) uploaded`,
			color: 'green',
		});
	} catch (error: any) {
		console.error('Upload failed:', error);
		toast.add({
			title: 'Upload failed',
			description: error.message || 'Failed to upload image',
			color: 'red',
		});
	} finally {
		isUploading.value = false;
		uploadProgress.value = 0;
	}
};

// File browser functions
const openFileBrowser = async () => {
	showFileBrowser.value = true;
	currentFolder.value = uploadFolderId.value;
	folderPath.value = [{id: uploadFolderId.value, name: 'Announcement Uploads'}];
	await loadFilesAndFolders();
};

const loadFilesAndFolders = async () => {
	isLoadingFiles.value = true;
	try {
		// Get files from folder
		const filesResult = await filesComposable.findByFolder(currentFolder.value, {
			fields: ['id', 'title', 'filename_download', 'type', 'filesize'],
			sort: ['-uploaded_on'],
			limit: 100,
		});

		// Get child folders
		let foldersResult: DirectusFolder[] = [];
		if (currentFolder.value) {
			foldersResult = await foldersComposable.getChildren(currentFolder.value);
		} else {
			foldersResult = await foldersComposable.getRootFolders();
		}

		files.value = filesResult || [];
		folders.value = foldersResult || [];
	} catch (error) {
		console.error('Failed to load files:', error);
		toast.add({
			title: 'Error',
			description: 'Failed to load files',
			color: 'red',
		});
	} finally {
		isLoadingFiles.value = false;
	}
};

const navigateToFolder = async (folderId: string | null, folderName: string) => {
	currentFolder.value = folderId;

	const existingIndex = folderPath.value.findIndex((f) => f.id === folderId);
	if (existingIndex >= 0) {
		folderPath.value = folderPath.value.slice(0, existingIndex + 1);
	} else {
		folderPath.value.push({id: folderId, name: folderName});
	}

	await loadFilesAndFolders();
};

const selectFile = (file: DirectusFile) => {
	if (file.id && editor.value) {
		const imageUrl = `${config.public.directusUrl}/assets/${file.id}`;
		editor.value
			.chain()
			.focus()
			.setImage({
				src: imageUrl,
				alt: file.title || file.filename_download || 'Image',
			})
			.run();
	}
	showFileBrowser.value = false;
};

const getImageThumbnail = (fileId: string): string => {
	return `${config.public.directusUrl}/assets/${fileId}?width=200&height=200&fit=cover`;
};

const getFileIcon = (type: string): string => {
	if (type.startsWith('image/')) return 'i-lucide-image';
	if (type.includes('pdf')) return 'i-lucide-file-text';
	if (type.includes('word') || type.includes('document')) return 'i-lucide-file-text';
	if (type.includes('excel') || type.includes('spreadsheet')) return 'i-lucide-file-spreadsheet';
	return 'i-lucide-file';
};

// Toolbar Button Component
const ToolbarButton = defineComponent({
	props: {
		icon: {type: String, required: true},
		active: {type: Boolean, default: false},
		disabled: {type: Boolean, default: false},
		title: {type: String, default: ''},
		showChevron: {type: Boolean, default: false},
	},
	emits: ['click'],
	setup(props, {emit}) {
		return () =>
			h(
				'button',
				{
					type: 'button',
					class: [
						'p-1.5 rounded transition-colors flex items-center gap-0.5',
						props.active
							? 'bg-primary-100 dark:bg-primary-900 text-primary dark:text-primary'
							: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
						props.disabled && 'opacity-50 cursor-not-allowed',
					],
					disabled: props.disabled,
					title: props.title,
					onClick: () => emit('click'),
				},
				[
					h('span', {class: `${props.icon} w-4 h-4`}),
					props.showChevron && h('span', {class: 'i-heroicons-chevron-down w-3 h-3'}),
				]
			);
	},
});
</script>

<style>
.tiptap-content .ProseMirror {
	padding: 1rem;
	min-height: inherit;
	outline: none;
}

.tiptap-content .ProseMirror > * + * {
	margin-top: 0.75em;
}

.tiptap-content .ProseMirror h1 {
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 1.2;
}

.tiptap-content .ProseMirror h2 {
	font-size: 1.25rem;
	font-weight: 600;
	line-height: 1.3;
}

.tiptap-content .ProseMirror h3 {
	font-size: 1.1rem;
	font-weight: 600;
	line-height: 1.4;
}

.tiptap-content .ProseMirror ul {
	list-style-type: disc;
	padding-left: 1.5rem;
}

.tiptap-content .ProseMirror ol {
	list-style-type: decimal;
	padding-left: 1.5rem;
}

.tiptap-content .ProseMirror blockquote {
	padding-left: 1rem;
	border-left: 3px solid #e5e7eb;
	color: #6b7280;
	font-style: italic;
}

.dark .tiptap-content .ProseMirror blockquote {
	border-left-color: #4b5563;
	color: #9ca3af;
}

.tiptap-content .ProseMirror pre {
	background: #1f2937;
	color: #f3f4f6;
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	font-family: ui-monospace, monospace;
	font-size: 0.875rem;
	overflow-x: auto;
}

.tiptap-content .ProseMirror code {
	background: #f3f4f6;
	color: #dc2626;
	padding: 0.125rem 0.25rem;
	border-radius: 0.25rem;
	font-family: ui-monospace, monospace;
	font-size: 0.875em;
}

.dark .tiptap-content .ProseMirror code {
	background: #374151;
	color: #f87171;
}

.tiptap-content .ProseMirror a {
	color: #2563eb;
	text-decoration: underline;
}

.tiptap-content .ProseMirror a:hover {
	color: #1d4ed8;
}

.tiptap-content .ProseMirror img {
	max-width: 100%;
	height: auto;
	margin: 1rem 0;
	cursor: pointer;
}

.tiptap-content .ProseMirror img:hover {
	opacity: 0.9;
}

/* Table styles */
.tiptap-content .ProseMirror table {
	border-collapse: collapse;
	margin: 1rem 0;
	overflow: hidden;
	width: 100%;
}

.tiptap-content .ProseMirror th,
.tiptap-content .ProseMirror td {
	border: 1px solid #e5e7eb;
	padding: 0.5rem;
	position: relative;
	vertical-align: top;
	min-width: 100px;
}

.dark .tiptap-content .ProseMirror th,
.dark .tiptap-content .ProseMirror td {
	border-color: #4b5563;
}

.tiptap-content .ProseMirror th {
	background: #f9fafb;
	font-weight: 600;
	text-align: left;
}

.dark .tiptap-content .ProseMirror th {
	background: #374151;
}

.tiptap-content .ProseMirror .selectedCell::after {
	background: rgba(59, 130, 246, 0.1);
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	pointer-events: none;
}

/* Placeholder */
.tiptap-content .ProseMirror p.is-editor-empty:first-child::before {
	color: #9ca3af;
	content: attr(data-placeholder);
	float: left;
	height: 0;
	pointer-events: none;
}

/* Text alignment */
.tiptap-content .ProseMirror .has-text-align-center {
	text-align: center;
}

.tiptap-content .ProseMirror .has-text-align-right {
	text-align: right;
}

.tiptap-content .ProseMirror .has-text-align-left {
	text-align: left;
}
</style>
