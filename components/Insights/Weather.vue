<script setup>
const weather = await $fetch(
	'https://api.openweathermap.org/data/2.5/weather?lat=25.7803705&lon=-80.1388466&appid=11a6889ce0bda17eda9f935cd43fba39&units=imperial'
).catch((error) => error.data);

const isIcon = ref(true);

function generateIcon(weatherData) {
	// Check if we have weather data
	if (!weatherData || !weatherData.id) {
		isIcon.value = false;
		return null;
	}

	const id = weatherData.id;
	const isDay = weatherData.icon?.includes('d');

	// Thunderstorm
	if (id >= 200 && id < 300) {
		return isDay ? 'i-wi-day-thunderstorm' : 'i-wi-night-alt-thunderstorm';
	}

	// Drizzle
	if (id >= 300 && id < 400) {
		return isDay ? 'i-wi-day-sprinkle' : 'i-wi-night-alt-sprinkle';
	}

	// Rain
	if (id >= 500 && id < 600) {
		if (id === 511) return 'i-wi-sleet'; // Freezing rain
		return isDay ? 'i-wi-day-rain' : 'i-wi-night-alt-rain';
	}

	// Snow
	if (id >= 600 && id < 700) {
		return isDay ? 'i-wi-day-snow' : 'i-wi-night-alt-snow';
	}

	// Atmosphere (fog, mist, etc)
	if (id >= 700 && id < 800) {
		switch (id) {
			case 701:
				return 'i-wi-fog';
			case 721:
				return 'i-wi-day-haze';
			case 731:
				return 'i-wi-dust';
			case 741:
				return 'i-wi-fog';
			case 751:
				return 'i-wi-sandstorm';
			case 761:
				return 'i-wi-dust';
			case 762:
				return 'i-wi-volcano';
			case 771:
				return 'i-wi-strong-wind';
			case 781:
				return 'i-wi-tornado';
			default:
				return 'i-wi-fog';
		}
	}

	// Clear
	if (id === 800) {
		return isDay ? 'i-wi-day-sunny' : 'i-wi-night-clear';
	}

	// Clouds
	if (id > 800) {
		if (id === 801) {
			// Few clouds
			return isDay ? 'i-wi-day-sunny-overcast' : 'i-wi-night-alt-partly-cloudy';
		}
		if (id === 802) {
			// Scattered clouds
			return isDay ? 'i-wi-day-cloudy' : 'i-wi-night-alt-cloudy';
		}
		if (id === 803 || id === 804) {
			// Broken or overcast clouds
			return 'i-wi-cloudy';
		}
	}

	// Fallback
	isIcon.value = false;
	return null;
}
</script>
<template>
	<div class="hidden sm:inline-block weather">
		<h5 class="uppercase tracking-wide weather__intro"></h5>
		<h5 class="uppercase tracking-wide relative weather__stats">
			<span class="">{{ roundToDecimal(weather.main.temp, 0) }}°</span>
			/
			{{ weather.weather[0].main }}
			<span v-if="isIcon" class="weather-icon">
				<UIcon v-if="weather.weather.length" :name="generateIcon(weather.weather[0])" class="drop-shadow" />
			</span>
			<img
				v-else
				:src="`https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`"
				:alt="weather.weather[0].description"
				class="hidden sm:inline-block" />
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

		img,
		.weather-icon {
			color: var(--pink);
			font-size: 20px;
			line-height: 30px;
			width: 30px;
			height: 30px;
			right: -38px;
			top: -7px;
			text-shadow: 0 2px 5px rgba(0, 0, 0, 1);
			@apply absolute rounded-full inline-flex items-center justify-center bg-gray-200 dark:bg-gray-600 shadow-inner;
		}
	}
}
</style>
