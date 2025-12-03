<template>
	<div class="camera-container">
		<h2>Live Camera Feed</h2>
		<img src="http://lenoxuser:lenox1033@69.84.126.179:8000/ISAPI/Streaming/channels/101/picture" alt="Camera" />
		<img src="http://lenoxuser:lenox1033@69.84.126.179:8000/ISAPI/Streaming/channels/1/picture" alt="Camera" />
		<img src="http://lenoxuser:lenox1033@69.84.126.179:8000/cgi-bin/snapshot.cgi?channel=1" alt="Camera" />
		<img :src="streamUrl" alt="Camera Feed" class="camera-feed" @error="handleError" @load="handleLoad" />
		<p v-if="error" class="error">{{ error }}</p>
		<p v-if="loading" class="loading">Loading feed...</p>
	</div>
</template>

<script setup>
const error = ref(null);
const loading = ref(true);

// Build the stream URL dynamically
const streamUrl = computed(() => {
	if (process.client) {
		return `${window.location.origin}/api/camera/stream`;
	}
	return '/api/camera/stream';
});

const handleError = () => {
	error.value = 'Unable to load camera feed. Check connection and credentials.';
	loading.value = false;
};

const handleLoad = () => {
	loading.value = false;
	error.value = null;
};
</script>

<style scoped>
.camera-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
}

.camera-feed {
	width: 100%;
	height: auto;
	border: 2px solid #333;
	border-radius: 8px;
	background: #000;
}

.error {
	color: red;
	margin-top: 10px;
}

.loading {
	color: #666;
	margin-top: 10px;
}
</style>
