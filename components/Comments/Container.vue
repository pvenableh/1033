<script setup>
const config = useRuntimeConfig();
const { user } = useDirectusAuth();
// const adminUrl = config.public.adminUrl;

const props = defineProps({
	item: {
		type: String,
		default: '',
	},
	collection: {
		type: String,
		default: 'tasks',
	},
});

const access_token = ref(config.public.staticToken);
const url = ref(config.public.websocketUrl);
const showComments = ref(false);

const comments = ref({
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

	function updateComments(data) {
		for (const comment of data) {
			const index = comments.value.history.findIndex((item) => item.id == comment.id);

			console.log(index);

			if (index > -1) {
				comments.value.history[index] = comment;
			}
		}

		comments.value.history.sort((a, b) => {
			return new Date(b.comments_id.date_created) - new Date(a.comments_id.date_created);
		});
	}

	function receiveMessage(message) {
		const data = JSON.parse(message.data);

		if (data.type == 'auth' && data.status == 'ok') {
			connection.send(
				JSON.stringify({
					type: 'subscribe',
					collection: 'tasks_comments',
					query: {
						fields: [
							'comments_id.*,comments_id.user.id,comments_id.user.first_name,comments_id.user.last_name,comments_id.user.avatar,comments_id.user.email,user.phone',
						],
						filter: {
							tasks_id: {
								_eq: props.item,
							},
							comments_id: {
								comment: {
									_nnull: true,
								},
							},
						},
						sort: '-comments_id.date_created',
					},
				}),
			);
		}

		if (data.type == 'subscription' && data.event == 'init') {
			for (const message of data.data) {
				comments.value.history.push(message);
			}
		}

		if (data.type == 'subscription' && data.event == 'create') {
			comments.value.history.push(data.data[0]);

			comments.value.history.sort((a, b) => {
				return new Date(b.comments_id.date_created) - new Date(a.comments_id.date_created);
			});
		}

		if (data.type == 'subscription' && data.event == 'update') {
			updateComments(data.data);
		}

		// if (data.type == 'ping') {
		// 	comments.value.history.sort((a, b) => {
		// 		return new Date(b.date_created) - new Date(a.date_created);
		// 	});
		// }
	}
});

const commentsTotal = computed(() => {
	if (comments.value.history.length > 0) {
		return comments.value.history.length;
	} else {
		return '';
	}
});
</script>
<template>
	<div :id="'comments-container-' + item.id" class="w-full comments-container">
		<div
			class="w-full flex items-center justify-between flex-row uppercase text-xs font-bold tracking-wide text-[8px]"
			style="font-size: 8px"
		>
			<div v-if="comments.history.length > 0" class="flex flex-row items-center justify-center">
				<UToggle
					color="gray"
					on-icon="i-heroicons-check-20-solid"
					off-icon="i-heroicons-x-mark-20-solid"
					v-model="showComments"
				/>
				<p class="ml-2">
					{{ showComments ? 'Hide ' + commentsTotal + ' Comments' : 'Show ' + commentsTotal + ' Comments' }}
				</p>
			</div>
		</div>

		<transition name="fade">
			<div v-if="showComments">
				<CommentsCreateComment v-if="user" :item="item" :collection="collection" class="my-3" />
				<transition-group name="fade" tag="div" class="w-full flex items-start justify-start flex-col">
					<CommentsComment
						v-for="item in comments.history"
						:key="item.id"
						:comment="item"
						:collection="collection"
						class="my-2"
					/>
				</transition-group>
			</div>
		</transition>
	</div>
</template>
<style></style>
