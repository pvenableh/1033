<script setup>
const config = useRuntimeConfig();
const access_token = ref(config.public.staticToken);
const url = ref(config.public.websocketUrl);
// const { user } = useDirectusAuth();

const tasks = ref([]);
onMounted(async () => {
	const connection = new WebSocket(url.value);
	await connection.addEventListener('open', () => authenticate(access_token.value));
	await connection.addEventListener('message', (message) => receiveMessage(message));

	function authenticate() {
		connection.send(JSON.stringify({ type: 'auth', access_token: access_token.value }));
		console.log(connection);
	}

	function updateTasks(data) {
		for (const task of data) {
			const index = tasks.value.findIndex((item) => item.id == task.id);
			if (index > -1) {
				tasks.value[index] = task;
			}
		}
	}

	function receiveMessage(message) {
		const data = JSON.parse(message.data);
		console.log(data);
		if (data.type == 'auth' && data.status == 'ok') {
			connection.send(
				JSON.stringify({
					type: 'subscribe',
					collection: 'tasks',
					query: {
						fields: ['*'],

						sort: 'date_created',
					},
				}),
			);
		}

		if (data.type == 'subscription' && data.event == 'init') {
			for (const message of data.data) {
				tasks.value.push(message);
			}
		}

		if (data.type == 'subscription' && data.event == 'create') {
			tasks.value.push(data.data[0]);
		}

		if (data.type == 'subscription' && data.event == 'update') {
			updateTasks(data.data);
		}

		if (data.type == 'ping') {
			connection.send(JSON.stringify({ type: 'pong' }));
		}
	}
});
</script>
<template>
	<div class="min-h-screen">
		{{ tasks }}
	</div>
</template>

<style></style>
