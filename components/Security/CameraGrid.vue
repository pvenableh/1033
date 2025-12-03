<template>
	<div class="camera-grid-container">
		<h1>Security Camera System</h1>

		<div class="controls">
			<label>
				Refresh Rate:
				<select v-model="refreshInterval">
					<option :value="500">2 FPS (Fast)</option>
					<option :value="1000">1 FPS (Normal)</option>
					<option :value="2000">0.5 FPS (Slow)</option>
				</select>
			</label>

			<label>
				<input type="checkbox" v-model="useSubStream" />
				Use Sub-Stream (Lower Quality, Faster)
			</label>
		</div>

		<ClientOnly>
			<div class="camera-grid">
				<div v-for="camera in cameras" :key="camera.id" class="camera-item" @click="selectCamera(camera)">
					<div class="camera-header">
						<h3>{{ camera.name }}</h3>
						<span class="status-indicator" :class="camera.status" />
					</div>

					<img
						:src="getCameraUrl(camera)"
						:key="`${camera.id}-${refreshKey}`"
						:alt="camera.name"
						class="camera-feed"
						@load="() => handleLoad(camera)"
						@error="() => handleError(camera)" />

					<p v-if="camera.error" class="error-text">
						{{ camera.error }}
					</p>
				</div>
			</div>

			<!-- Full Screen View -->
			<div v-if="selectedCamera" class="fullscreen-overlay" @click="selectedCamera = null">
				<div class="fullscreen-content" @click.stop>
					<button class="close-btn" @click="selectedCamera = null">✕</button>
					<h2>{{ selectedCamera.name }}</h2>
					<img
						:src="getCameraUrl(selectedCamera)"
						:key="`fullscreen-${refreshKey}`"
						alt="Fullscreen Camera"
						class="fullscreen-feed" />
				</div>
			</div>
		</ClientOnly>
	</div>
</template>

<script setup>
const refreshKey = ref(0);
const refreshInterval = ref(1000);
const useSubStream = ref(false);
const selectedCamera = ref(null);

const cameras = ref([
	{id: 1, channel: 101, name: 'Camera 1 - Front Entrance', status: 'loading', error: null},
	{id: 2, channel: 201, name: 'Camera 2 - Back Door', status: 'loading', error: null},
	{id: 3, channel: 301, name: 'Camera 3 - Lobby', status: 'loading', error: null},
	{id: 4, channel: 401, name: 'Camera 4 - Parking Lot', status: 'loading', error: null},
	{id: 5, channel: 501, name: 'Camera 5 - Hallway A', status: 'loading', error: null},
	{id: 6, channel: 601, name: 'Camera 6 - Hallway B', status: 'loading', error: null},
	{id: 7, channel: 701, name: 'Camera 7 - Storage', status: 'loading', error: null},
	{id: 8, channel: 801, name: 'Camera 8 - Roof Access', status: 'loading', error: null},
]);

const getCameraUrl = (camera) => {
	const streamType = useSubStream.value ? 2 : 1; // 1=main, 2=sub
	const channel = Math.floor(camera.channel / 100) * 100 + streamType;

	// Add timestamp to force refresh
	return `http://lenoxuser:lenox1033@69.84.126.179:8000/ISAPI/Streaming/channels/${channel}/picture?t=${refreshKey.value}`;
};

const handleLoad = (camera) => {
	camera.status = 'online';
	camera.error = null;
};

const handleError = (camera) => {
	camera.status = 'offline';
	camera.error = 'Connection failed';
};

const selectCamera = (camera) => {
	if (camera.status === 'online') {
		selectedCamera.value = camera;
	}
};

// Auto-refresh interval
let intervalId;
onMounted(() => {
	intervalId = setInterval(() => {
		refreshKey.value++;
	}, refreshInterval.value);
});

onUnmounted(() => {
	if (intervalId) clearInterval(intervalId);
});

// Update interval when changed
watch(refreshInterval, (newVal) => {
	if (intervalId) clearInterval(intervalId);
	intervalId = setInterval(() => {
		refreshKey.value++;
	}, newVal);
});
</script>

<style scoped>
.camera-grid-container {
	padding: 20px;
	max-width: 1600px;
	margin: 0 auto;
}

h1 {
	text-align: center;
	margin-bottom: 20px;
}

.controls {
	display: flex;
	gap: 20px;
	margin-bottom: 20px;
	padding: 15px;
	background: #f5f5f5;
	border-radius: 8px;
}

.controls label {
	display: flex;
	align-items: center;
	gap: 8px;
}

.controls select {
	padding: 5px 10px;
	border-radius: 4px;
	border: 1px solid #ccc;
}

.camera-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 20px;
}

.camera-item {
	border: 2px solid #ddd;
	border-radius: 8px;
	overflow: hidden;
	background: #000;
	cursor: pointer;
	transition: transform 0.2s;
}

.camera-item:hover {
	transform: scale(1.02);
	border-color: #007bff;
}

.camera-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 15px;
	background: #222;
	color: white;
}

.camera-header h3 {
	margin: 0;
	font-size: 14px;
}

.status-indicator {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	display: inline-block;
}

.status-indicator.online {
	background: #0f0;
	box-shadow: 0 0 5px #0f0;
}

.status-indicator.offline {
	background: #f00;
	box-shadow: 0 0 5px #f00;
}

.status-indicator.loading {
	background: #ff0;
	animation: pulse 1s infinite;
}

@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

.camera-feed {
	width: 100%;
	height: auto;
	min-height: 200px;
	display: block;
	background: #000;
}

.error-text {
	color: #f00;
	text-align: center;
	padding: 10px;
	margin: 0;
	background: #222;
}

/* Fullscreen Overlay */
.fullscreen-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.95);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	cursor: pointer;
}

.fullscreen-content {
	max-width: 90vw;
	max-height: 90vh;
	position: relative;
	cursor: default;
}

.fullscreen-content h2 {
	color: white;
	margin-bottom: 10px;
}

.close-btn {
	position: absolute;
	top: 10px;
	right: 10px;
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	font-size: 24px;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	cursor: pointer;
	z-index: 1001;
}

.close-btn:hover {
	background: rgba(255, 255, 255, 0.3);
}

.fullscreen-feed {
	max-width: 90vw;
	max-height: 80vh;
	border: 3px solid #fff;
	border-radius: 8px;
}

/* Responsive */
@media (max-width: 768px) {
	.camera-grid {
		grid-template-columns: 1fr;
	}

	.controls {
		flex-direction: column;
	}
}
</style>
