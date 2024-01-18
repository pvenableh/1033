<script setup>
const openTaskModal = ref(false);
</script>
<template>
	<div class="w-full">
		<h1 class="w-full mt-12 mb-8 text-center uppercase tracking-wide font-bold text-sm">Tasks</h1>
		<div class="w-full flex itesm-center justify-center pb-12">
			<UButton
				label="Create Task"
				class="uppercase tracking-wide font-bold"
				color="gray"
				@click="openTaskModal = true"
			/>
			<UModal v-model="openTaskModal">
				<TasksTaskDetail action="create" />
			</UModal>
		</div>
		<TasksBoard />
	</div>
</template>
