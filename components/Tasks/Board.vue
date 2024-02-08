<script setup>
import draggable from 'vuedraggable';

const config = useRuntimeConfig();

const access_token = ref(config.public.staticToken);
const url = ref(config.public.websocketUrl);
const { user } = useDirectusAuth();

const tasks = ref({
	history: [],
	new: '',
});

onMounted(async () => {
	const connection = new WebSocket(url.value);
	await connection.addEventListener('open', () => authenticate(access_token.value));
	await connection.addEventListener('message', (message) => receiveMessage(message));

	function authenticate() {
		connection.send(JSON.stringify({ type: 'auth', access_token: access_token.value }));
	}

	function updateTasks(data) {
		// const cards = document.querySelectorAll('.task-card');

		// cards.forEach((element) => {
		// 	element.classList.remove('updated');
		// });

		for (const task of data) {
			const index = tasks.value.history.findIndex((item) => item.id == task.id);

			// const card = document.getElementById('task-' + task.id);

			// card.classList.add('updated');

			if (index > -1) {
				tasks.value.history[index] = task;
			}
		}
	}

	function receiveMessage(message) {
		const data = JSON.parse(message.data);

		if (data.type == 'auth' && data.status == 'ok') {
			connection.send(
				JSON.stringify({
					type: 'subscribe',
					collection: 'tasks',
					query: {
						fields: [
							'*,user_created.id,user_created.first_name,user_created.last_name,user_updated.id,user_updated.first_name,user_updated.last_name',
						],

						sort: 'date_created',
					},
				}),
			);
		}
		// ,comments.id,comments.comments_id.id,comments.comments_id.comment,comments.comments_id.user.id,comments.comments_id.user.first_name,comments.comments_id.user.last_name,comments.comments_id.user.avatar,comments.comments_id.user.email,assign_to.*,assigned_to.directus_users_id.id
		if (data.type == 'subscription' && data.event == 'init') {
			for (const message of data.data) {
				tasks.value.history.push(message);
			}
		}

		if (data.type == 'subscription' && data.event == 'create') {
			tasks.value.history.push(data.data[0]);
		}

		if (data.type == 'subscription' && data.event == 'update') {
			updateTasks(data.data);
		}

		if (data.type == 'ping') {
			connection.send(JSON.stringify({ type: 'pong' }));
		}
	}
});

const dragging = ref(false);

const enabled = computed(() => {
	return user.value ? true : false;
});

const draggingInfo = computed(() => {
	return dragging.value ? 'under drag' : '';
});

function updateTasks(category, event) {
	if (event.added) {
		const movedTask = tasks.value.history.find((task) => task.id === event.added.element.id);

		if (movedTask) {
			movedTask.category = category;
		}

		sendUpdate(movedTask);
	}

	if (event.moved) {
		const movedTask = tasks.value.history.find((task) => task.id === event.moved.element.id);

		if (movedTask) {
			movedTask.category = category;
		}
	}
}

async function sendUpdate(item) {
	const result = await useDirectus(updateItem('tasks', item.id, item));
}

const groupedData = computed(() => {
	const requiredCategories = ['Pending', 'Scheduled', 'In Progress', 'Completed'];

	const categories = requiredCategories.reduce((acc, category) => {
		acc[category] = [];
		return acc;
	}, {});

	tasks.value.history.forEach((item) => {
		if (!categories[item.category]) {
			categories[item.category] = [];
		}

		console.log(user.value);
		console.log('looking for user role');

		if (user.value && user.value.role === '7913bfde-8ec9-4c51-8ecf-7efdb160a36d') {
			categories[item.category].push(item);
		} else {
			if (item.assigned_to.length > 0) {
				item.assigned_to.forEach((person) => {
					if (person.directus_users_id.id === user.value.id) {
						categories[item.category].push(item);
					}
				});
			} else {
				console.log('no assigned user.');
			}
		}
	});

	return categories;
});
</script>
<template>
	<div class="flex flex-row w-full items-start justify-center tasks-board">
		<h1 class="hidden">{{ draggingInfo }}</h1>
		<div v-for="(items, category) in groupedData" :key="category" class="tasks-board__col flex-1">
			<h2 class="w-full relative uppercase tracking-wide font-bold text-sm">
				{{ category }}
				<UBadge
					v-if="items.length"
					size="xs"
					color="gray"
					:ui="{ rounded: 'rounded-full' }"
					class="absolute top-[-10px] scale-90"
				>
					{{ items.length }}
				</UBadge>
			</h2>
			<draggable
				:disabled="!enabled"
				:list="items"
				tag="div"
				group="tasks"
				class="tasks-board__col-inner"
				ghost-class="ghost"
				@change="updateTasks(category, $event)"
				@start="dragging = true"
				@end="dragging = false"
			>
				<template #item="{ element: task }">
					<TasksTaskCard :id="'task-' + task.id" :key="task.id" :task="task" />
				</template>
			</draggable>
		</div>
	</div>
</template>
<style>
.tasks-board {
	&__col {
		max-width: 375px;
		@apply w-full min-h-screen flex flex-col items-center justify-start;
	}

	&__col-inner {
		max-width: 375px;
		/* border: thin solid rgba(0, 0, 0, 0.05); */
		@apply border border-gray-900/5 dark:border-gray-900/50 w-full flex flex-col items-center justify-start px-4 py-4 min-h-screen;
	}
}
</style>
