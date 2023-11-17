<script setup>
const weather = await $fetch(
	'https://api.openweathermap.org/data/2.5/weather?lat=25.7803705&lon=-80.1388466&appid=11a6889ce0bda17eda9f935cd43fba39&units=imperial',
).catch((error) => error.data);
</script>
<template>
	<div class="hidden sm:inline-block weather">
		<h5 class="uppercase tracking-wide weather__intro"></h5>
		<h5 class="uppercase tracking-wide weather__stats">
			<span class="">{{ roundToDecimal(weather.main.temp, 0) }}°</span>
			/
			{{ weather.weather[0].main }}
			<img
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

		img {
			width: 30px;
			height: 30px;
			background: rgba(50, 50, 50, 0.15);
			@apply rounded-full;
		}
	}
}
</style>
