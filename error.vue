<script setup lang="ts">
const config = useRuntimeConfig();
const isDev = config.public.dev || false;

const error = useError();

const handleError = () => {
	clearError();

	navigateTo('/');
};

const {x, y} = useMouse({touch: false});
</script>

<template>
	<div class="min-h-screen flex items-center justify-center px-4">
		<div class="max-w-lg w-full text-center">
			<div class="w-full h-[190px] sm:h-[300px] relative flex items-center justify-center">
				<img src="~/assets/img/palm-tree.png" class="absolute h-[60px] w-auto top-[50px] sm:top-[10px] ml-12" />
				<img
					src="~/assets/img/palm-tree.png"
					class="absolute h-[70px] w-auto top-[55px] sm:-top-[2px] -ml-28 -scale-x-100"
					:style="{marginRight: -x / 60 + 'px'}" />
				<img
					src="~/assets/img/palm-tree.png"
					class="absolute h-[60px] sm:h-[90px] w-auto top-[55px] sm:top-[0px] ml-20 -scale-x-100"
					:style="{marginRight: -x / 50 + 'px'}" />
				<img
					src="~/assets/img/palm-tree.png"
					class="absolute h-[50px] sm:h-[70px] w-auto top-[60px] sm:top-[3px] mr-32"
					:style="{marginLeft: -x / 30 + 'px'}" />
				<img
					ref="movableElement"
					src="https://admin.1033lenox.com/assets/22f2b886-0804-4fa4-9661-27da9d2ce6a6?key=medium"
					class="lg:absolute mt-8 mb-8 px-8 drop-shadow-[15px_15px_10px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_2px_20px_rgba(0,0,0,0.95)] transition-transform building"
					:style="{marginTop: -y / 40 + 'px', marginLeft: -x / 20 + 'px'}" />
			</div>
			<div class="mb-8">
				<h1 class="text-6xl font-bold">
					<!-- {{ error?.statusCode || '404' }} -->
					🤷‍♂️
				</h1>
				<!-- <h2 class="text-2xl font-semibold text-gray-800 mb-4">
					{{ error?.message || 'Page not found' }}
				</h2> -->
				<p class="text-gray-600 mb-8 text-xs">
					The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
				</p>
				<Button
					@click="handleError"
					class="px-6"
					color="primary"
					icon="i-heroicons-home-modern"
					variant="outline"
					:trailing="true">
					Back to Home
				</UButton>
			</div>

			<!-- Error Details (only shown in development) -->
			<div v-if="isDev && error?.stack" class="mt-8 text-left">
				<h3 class="text-lg font-semibold text-gray-800 mb-2">Error Details:</h3>
				<pre class="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
          {{ error.stack }}
        </pre>
			</div>
		</div>
	</div>
</template>
