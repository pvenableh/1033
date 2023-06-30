<template>
    <div class="w-full">
        <div class="w-full flex flex-col items-start max-w-lg mx-auto">
            <transition-group name="list" tag="div" class="w-full">
                <div v-for="(task, index) in tasks" :key="index" class="p-6 mb-10 shadow-lg">
                    <h1 class="uppercase text-xs font-bold mb-4">{{ task.category }}</h1>
                    <h2 class="uppercase mb-2">{{ index + 1 }}). {{ task.title }}</h2>

                    <div v-if="task.description" v-html="task.description"></div>
                </div>
            </transition-group>
        </div>
    </div>
</template>
<script setup>
const tasks = ref([])
const socket = ref(null)
const access_token = '04tXzze0O5HBQScnlFn3FBLgx5QgtBNh'
function openConnection() {
    socket.value.addEventListener('open', function (event) {
        console.log({ event: 'onopen' });
        console.log('connection closed:', event);
        socket.value.send(
            JSON.stringify({
                type: 'auth',
                access_token,
            })
        );
    });
}
onMounted(() => {
    socket.value = new WebSocket('wss://admin.1033lenox.com/websocket')

    openConnection();

    socket.value.addEventListener('message', function (message) {
        const data = JSON.parse(message.data);
        if (data.type == 'auth' && data.status == 'ok') {
            socket.value.send(JSON.stringify({
                type: 'subscribe',
                collection: 'tasks',
                query: {
                    // aggregate: { count: 'choice' },
                    // groupBy: 'catgegory',
                    orderBy: '-sort'
                }
            }));
        }
        if (data.type == 'subscription' && data.event == 'init') {
            console.log('init')
            console.log(data)
            tasks.value = data.data
        }

        if (data.type == 'subscription' && data.event == 'create') {
            console.log('create')
            console.log(data.data)
            tasks.value.push(data.data[0])
            // let updatedTasks = tasks.value.concat(data.data)
            // tasks.value = updatedTasks.sort((a, b) => a.sort - b.sort);
        }
        if (data.type == 'subscription' && data.event == 'update') {
            console.log('update')
            console.log(data.data[0].id)
            const index = tasks.value.findIndex((task) => task.id === data.data[0].id);
            console.log(tasks.value[index])
            tasks.value[index] = data.data[0];
            // tasks.value = tasks.value.sort((a, b) => a.sort - b.sort);
        }
        if (data.type == 'subscription' && data.event == 'delete') {
            console.log('delete')
            console.log(data.data[0])
             const index = tasks.value.findIndex((task) => task.id === data.data[0]);
            tasks.value.splice(index, 1);
            // tasks.value = tasks.value.sort((a, b) => a.sort - b.sort);
            console.log(index)
        }
    });
    socket.value.addEventListener('close', function (event) {
        console.log({ event: 'onclose' });
        console.log('connection closed:', event);
        socket.value.close();
        setTimeout(() => {
            openConnection();
            socket.value.addEventListener('message', function (message) {
                const data = JSON.parse(message.data);
                if (data.type == 'auth' && data.status == 'ok') {
                    socket.value.send(JSON.stringify({
                        type: 'subscribe',
                        collection: 'tasks',
                        query: {
                            // aggregate: { count: 'choice' },
                            // groupBy: ['choice'],
                            orderBy: '-sort'
                        }
                    }));
                }
                if (data.type == 'subscription' && data.event == 'init') {
                    console.log('init')
                    console.log(data)
                    tasks.value = data.data
                }

                if (data.type == 'subscription' && data.event == 'create') {
                    console.log('create')
                    console.log(data.data)
                    // let updatedTasks = tasks.value.concat(data.data)
                    // tasks.value = updatedTasks.sort((a, b) => a.sort - b.sort);
                    tasks.value.push(data.data[0])
                }
                if (data.type == 'subscription' && data.event == 'update') {
                    console.log('update')
                    console.log(data.data[0].id)
                    const index = tasks.value.findIndex((task) => task.id === data.data[0].id);
                    console.log(tasks.value[index])
                    tasks.value[index] = data.data[0];
                    // tasks.value = tasks.value.sort((a, b) => a.sort - b.sort);
                }
                if (data.type == 'subscription' && data.event == 'delete') {
                    console.log('delete')
                    console.log(data.data[0])
                    const index = tasks.value.findIndex((task) => task.id === data.data[0]);
                    tasks.value.splice(index, 1);
                    // tasks.value = tasks.value.sort((a, b) => a.sort - b.sort);
                }
            });

        });
    }, 1500);


});
</script>