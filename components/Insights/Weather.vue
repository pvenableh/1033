<script setup>
const weather = await $fetch(
	'https://api.openweathermap.org/data/2.5/weather?lat=25.7803705&lon=-80.1388466&appid=11a6889ce0bda17eda9f935cd43fba39&units=imperial',
).catch((error) => error.data);

const isIcon = ref(true);

function generateIcon(code) {
	if (code === '01d') {
		return 'i-wi-day-sunny';
	} else if (code === '02d') {
		return 'i-wi-day-cloudy';
	} else {
		isIcon.value = false;
	}
};
</script>
<template>
	<div class="hidden sm:inline-block weather">
		<h5 class="uppercase tracking-wide weather__intro"></h5>
		<h5 class="uppercase tracking-wide relative weather__stats">
			<span class="">{{ roundToDecimal(weather.main.temp, 0) }}°</span>
			/
			{{ weather.weather[0].main }}
			<span v-if="isIcon" class="weather-icon"><UIcon v-if="weather.weather.length" :name="generateIcon(weather.weather[0].icon)" class="drop-shadow"/></span>
			<img
				v-else
				:src="'https://openweathermap.org/img/wn/' + weather.weather[0].icon + '.png'"
				:alt="weather.weather[0].description"
				class="hidden sm:inline-block"
			/>
		</h5>
	</div>
</template>
<style>
.weather {
	@apply scale-75 sm:scale-75 md:scale-100;
	&__intro {
		font-size: 10px;
	}

	&__stats {
		font-size: 12px;

		img, .weather-icon {
			color: var(--pink);
			font-size: 20px;
			line-height: 30px;
			width: 30px;
			height: 30px;
			background: rgba(50, 50, 50, 0.15);
			right: -33px;
			top: -5px;
			text-shadow: 0 2px 5px rgba(0, 0, 0, 1);
			@apply absolute rounded-full inline-flex items-center justify-center;
		}
	}
}
</style>
