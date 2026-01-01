<script setup lang="ts">
interface WeatherCondition {
	id: number;
	main: string;
	description: string;
	icon: string;
}

interface WeatherData {
	coord: {lon: number; lat: number};
	weather: WeatherCondition[];
	main: {
		temp: number;
		feels_like: number;
		temp_min: number;
		temp_max: number;
		pressure: number;
		humidity: number;
	};
	visibility: number;
	wind: {speed: number; deg: number; gust?: number};
	clouds: {all: number};
	sys: {sunrise: number; sunset: number; country: string};
	name: string;
	dt: number;
	timezone: number;
}

interface Props {
	lat?: number;
	lon?: number;
	showDetails?: boolean;
	showLocation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	lat: 25.7803705,
	lon: -80.1388466,
	showDetails: false,
	showLocation: false,
});

const weather = await $fetch<WeatherData>(
	`https://api.openweathermap.org/data/2.5/weather?lat=${props.lat}&lon=${props.lon}&appid=11a6889ce0bda17eda9f935cd43fba39&units=imperial`
).catch(() => null);

const hasData = computed(() => weather !== null && weather.weather?.length > 0);

/**
 * Determines if it's currently daytime based on sunrise/sunset times
 * More accurate than relying on the icon suffix from API
 */
function isDaytime(data: WeatherData): boolean {
	const now = data.dt;
	return now >= data.sys.sunrise && now < data.sys.sunset;
}

/**
 * Generates the Weather Icons class name using the built-in OpenWeatherMap mapping
 * Format: wi-owm-{day|night}-{condition_id}
 * @see https://erikflowers.github.io/weather-icons/api-list.html
 */
function generateIconClass(data: WeatherData): string {
	if (!data.weather?.[0]?.id) return 'i-wi-na';

	const id = data.weather[0].id;
	const timePrefix = isDaytime(data) ? 'day' : 'night';

	// Use the built-in OWM mapping classes
	return `i-wi-owm-${timePrefix}-${id}`;
}

/**
 * Converts wind degrees to cardinal direction
 */
function getWindDirection(deg: number): string {
	const directions = [
		'N',
		'NNE',
		'NE',
		'ENE',
		'E',
		'ESE',
		'SE',
		'SSE',
		'S',
		'SSW',
		'SW',
		'WSW',
		'W',
		'WNW',
		'NW',
		'NNW',
	];
	const index = Math.round(deg / 22.5) % 16;
	return directions[index];
}

/**
 * Gets the wind direction icon class
 */
function getWindDirectionIcon(deg: number): string {
	return `i-wi-wind i-wi-from-${deg}-deg`;
}

/**
 * Rounds a number to specified decimal places
 */
function roundToDecimal(value: number, decimals: number = 0): number {
	const factor = Math.pow(10, decimals);
	return Math.round(value * factor) / factor;
}

/**
 * Formats temperature with degree symbol
 */
function formatTemp(temp: number): string {
	return `${roundToDecimal(temp, 0)}°`;
}

/**
 * Gets a human-readable time from unix timestamp
 */
function formatTime(timestamp: number, timezone: number): string {
	const date = new Date((timestamp + timezone) * 1000);
	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: 'UTC',
	});
}

/**
 * Gets UV index description (would need separate API call for actual UV data)
 */
function getVisibilityDescription(visibility: number): string {
	const miles = visibility / 1609.34;
	if (miles >= 6) return 'Clear';
	if (miles >= 3) return 'Moderate';
	if (miles >= 1) return 'Low';
	return 'Very Poor';
}
</script>

<template>
	<div v-if="hasData" class="weather-widget">
		<!-- Compact View -->
		<div class="weather-widget__compact">
			<span v-if="showLocation" class="weather-widget__location">{{ weather!.name }}, {{ weather!.sys.country }}</span>

			<div class="weather-widget__main">
				<span class="weather-widget__temp">{{ formatTemp(weather!.main.temp) }}</span>
				<span class="weather-widget__separator">/</span>
				<span class="weather-widget__condition">{{ weather!.weather[0].main }}</span>
				<span class="weather-widget__icon">
					<UIcon :name="generateIconClass(weather!)" />
				</span>
			</div>

			<div v-if="showDetails" class="weather-widget__secondary">
				<span class="weather-widget__feels-like">Feels {{ formatTemp(weather!.main.feels_like) }}</span>
				<span class="weather-widget__humidity">
					<UIcon name="i-wi-humidity" class="weather-widget__mini-icon" />
					{{ weather!.main.humidity }}%
				</span>
				<span class="weather-widget__wind">
					<UIcon name="i-wi-strong-wind" class="weather-widget__mini-icon" />
					{{ roundToDecimal(weather!.wind.speed, 0) }} mph {{ getWindDirection(weather!.wind.deg) }}
				</span>
			</div>
		</div>

		<!-- Extended Details (optional slot for expanded view) -->
		<slot
			name="details"
			:weather="weather"
			:format-temp="formatTemp"
			:format-time="formatTime"
			:is-daytime="isDaytime"></slot>
	</div>

	<!-- Error/Loading State -->
	<div v-else class="weather-widget weather-widget--error">
		<UIcon name="i-wi-na" class="weather-widget__icon weather-widget__icon--error" />
		<span class="weather-widget__error-text">Weather unavailable</span>
	</div>
</template>

<style scoped>
.weather-widget {
	--weather-icon-color: hwb(39 26% 38%);
	--weather-icon-size: 1.25rem;
	--weather-icon-bg: theme('colors.gray.200');
	--weather-icon-bg-dark: theme('colors.gray.600');

	@apply hidden sm:inline-flex flex-col gap-0.5;
}

.weather-widget__location {
	@apply text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400;
}

.weather-widget__main {
	@apply relative text-xs uppercase tracking-wide flex items-center gap-1;
}

.weather-widget__temp {
	@apply font-medium;
}

.weather-widget__separator {
	@apply text-gray-400 dark:text-gray-500;
}

.weather-widget__condition {
	@apply text-gray-600 dark:text-gray-300;
}

.weather-widget__icon {
	@apply absolute -right-10 -top-1.5
         h-8 w-8 rounded-full
         inline-flex items-center justify-center
         bg-gray-200 dark:bg-gray-600
         shadow-inner;

	color: var(--weather-icon-color);
	font-size: var(--weather-icon-size);
	text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.weather-widget__secondary {
	@apply flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5;
}

.weather-widget__mini-icon {
	@apply inline-block text-sm align-middle mr-0.5;
	color: var(--weather-icon-color);
}

.weather-widget--error {
	@apply flex items-center gap-2 text-gray-400 dark:text-gray-500;
}

.weather-widget__icon--error {
	@apply text-lg;
}

.weather-widget__error-text {
	@apply text-xs;
}
</style>
