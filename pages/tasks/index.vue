<script setup>
import { isOpen, taskModalData, taskModalAction } from '~/composables/useTaskModal';

definePageMeta({
	layout: 'auth',
	middleware: ['auth'],
});

useHead({
	title: 'Tasks',
});
</script>
<template>
	<div class="w-full px-0">
		<h1 class="w-full mt-12 mb-8 text-center uppercase tracking-wide font-bold text-sm">Tasks</h1>
		<div class="w-full flex itesm-center justify-center pb-12">
			<UButton label="Create Task" class="uppercase tracking-wide font-bold" color="gray" @click="openModal" />
			<UModal v-model="isOpen">
				<TasksTaskDetail :action="taskModalAction" :task="taskModalData" />
			</UModal>
		</div>
		<client-only>
			<TasksBoard />
		</client-only>
	</div>
</template>
