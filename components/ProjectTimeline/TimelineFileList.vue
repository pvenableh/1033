<template>
  <div class="space-y-2">
    <a
      v-for="file in files"
      :key="file.id"
      :href="getFileUrl(file.directus_files_id)"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-3 p-3 bg-gray-900/5 rounded-lg hover:bg-gray-900/10 transition-colors group"
    >
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center"
        :class="getFileIconBg(file.directus_files_id)"
      >
        <UIcon
          :name="getFileIcon(file.directus_files_id)"
          class="w-5 h-5"
          :class="getFileIconColor(file.directus_files_id)"
        />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate group-hover:text-gold transition-colors">
          {{ file.directus_files_id.filename_download }}
        </p>
        <p class="text-xs text-gray-500">
          {{ formatFileSize(file.directus_files_id.filesize) }}
        </p>
      </div>

      <UIcon
        name="i-heroicons-arrow-down-tray"
        class="w-4 h-4 text-gray-400 group-hover:text-gold transition-colors"
      />
    </a>

    <p
      v-if="files.length === 0"
      class="text-sm text-gray-400 text-center py-4"
    >
      No files attached
    </p>
  </div>
</template>

<script setup lang="ts">
import type { DirectusFile } from '~/types/directus';

interface FileWithRelation {
  id: number;
  sort: number | null;
  directus_files_id: DirectusFile;
}

interface Props {
  files: FileWithRelation[];
}

defineProps<Props>();

const { getFileUrl: getUrl } = useDirectusFiles();

const getFileUrl = (file: DirectusFile) => {
  return getUrl(file.id);
};

const getFileIcon = (file: DirectusFile) => {
  const type = file.type || '';

  if (type.startsWith('image/')) return 'i-heroicons-photo';
  if (type.startsWith('video/')) return 'i-heroicons-video-camera';
  if (type.startsWith('audio/')) return 'i-heroicons-musical-note';
  if (type.includes('pdf')) return 'i-heroicons-document-text';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'i-heroicons-table-cells';
  if (type.includes('presentation') || type.includes('powerpoint'))
    return 'i-heroicons-presentation-chart-bar';
  if (type.includes('document') || type.includes('word')) return 'i-heroicons-document';
  if (type.includes('zip') || type.includes('archive')) return 'i-heroicons-archive-box';

  return 'i-heroicons-document';
};

const getFileIconBg = (file: DirectusFile) => {
  const type = file.type || '';

  if (type.startsWith('image/')) return 'bg-purple-100';
  if (type.startsWith('video/')) return 'bg-pink-100';
  if (type.includes('pdf')) return 'bg-red-100';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'bg-green-100';
  if (type.includes('presentation')) return 'bg-orange-100';
  if (type.includes('document') || type.includes('word')) return 'bg-blue-100';

  return 'bg-gray-100';
};

const getFileIconColor = (file: DirectusFile) => {
  const type = file.type || '';

  if (type.startsWith('image/')) return 'text-purple-600';
  if (type.startsWith('video/')) return 'text-pink-600';
  if (type.includes('pdf')) return 'text-red-600';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'text-green-600';
  if (type.includes('presentation')) return 'text-orange-600';
  if (type.includes('document') || type.includes('word')) return 'text-blue-600';

  return 'text-gray-600';
};

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};
</script>
