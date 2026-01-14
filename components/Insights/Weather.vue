<script setup lang="ts">
/**
 * WeatherWidget - A comprehensive weather display component
 *
 * Supports two icon libraries:
 * - Weather Icons (wi) - Static icons by Erik Flowers
 * - Meteocons - Animated icons by Bas Milius
 *
 * @see https://erikflowers.github.io/weather-icons/
 * @see https://bas.dev/work/meteocons
 * @see https://openweathermap.org/weather-conditions
 */

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
		sea_level?: number;
		grnd_level?: number;
	};
	visibility: number;
	wind: {speed: number; deg: number; gust?: number};
	clouds: {all: number};
	rain?: {'1h'?: number; '3h'?: number};
	snow?: {'1h'?: number; '3h'?: number};
	sys: {sunrise: number; sunset: number; country: string};
	name: string;
	dt: number;
	timezone: number;
}

interface Props {
	lat?: number;
	lon?: number;
	apiKey?: string;
	units?: 'imperial' | 'metric' | 'standard';
	variant?: 'compact' | 'standard' | 'detailed';
	showLocation?: boolean;
	animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	lat: 25.781175,
	lon: -80.139328,
	apiKey: '11a6889ce0bda17eda9f935cd43fba39',
	units: 'imperial',
	variant: 'compact',
	showLocation: false,
	animated: false,
});

const weather = await $fetch<WeatherData>(
	`https://api.openweathermap.org/data/2.5/weather?lat=${props.lat}&lon=${props.lon}&appid=${props.apiKey}&units=${props.units}`
).catch(() => null);

const hasData = computed(() => weather !== null && weather.weather?.length > 0);

const unitSymbols = computed(() => ({
	temp: props.units === 'metric' ? '°C' : props.units === 'imperial' ? '°F' : 'K',
	speed: props.units === 'imperial' ? 'mph' : 'm/s',
}));

/**
 * Determines if it's currently daytime using sunrise/sunset from API
 * This is more accurate than the icon suffix, especially near transition times
 */
function isDaytime(data: WeatherData): boolean {
	const now = data.dt;
	return now >= data.sys.sunrise && now < data.sys.sunset;
}

/**
 * Generates the appropriate icon class based on the animated prop
 */
function generateIconClass(data: WeatherData): string {
	if (!data.weather?.[0]?.id) {
		return props.animated ? 'i-meteocons-not-available-fill' : 'i-wi-na';
	}

	return props.animated ? generateMeteoconClass(data) : generateWeatherIconClass(data);
}

/**
 * Meteocons icon mapping for OpenWeatherMap condition IDs
 * Uses animated SVG icons by Bas Milius
 * @see https://bas.dev/work/meteocons
 */
function generateMeteoconClass(data: WeatherData): string {
	const id = data.weather[0].id;
	const isDay = isDaytime(data);
	const timeOfDay = isDay ? 'day' : 'night';

	// Thunderstorm (2xx)
	if (id >= 200 && id < 300) {
		// Thunderstorm with rain/drizzle
		if ((id >= 200 && id <= 202) || (id >= 230 && id <= 232)) {
			return `i-meteocons-thunderstorms-${timeOfDay}-rain-fill`;
		}
		// Pure thunderstorm
		return `i-meteocons-thunderstorms-${timeOfDay}-fill`;
	}

	// Drizzle (3xx)
	if (id >= 300 && id < 400) {
		return `i-meteocons-partly-cloudy-${timeOfDay}-drizzle-fill`;
	}

	// Rain (5xx)
	if (id >= 500 && id < 600) {
		// Freezing rain
		if (id === 511) {
			return 'i-meteocons-sleet-fill';
		}
		// Shower rain
		if (id >= 520 && id <= 531) {
			return `i-meteocons-partly-cloudy-${timeOfDay}-rain-fill`;
		}
		// Light rain
		if (id === 500) {
			return `i-meteocons-partly-cloudy-${timeOfDay}-rain-fill`;
		}
		// Heavy rain
		if (id >= 502 && id <= 504) {
			return 'i-meteocons-extreme-rain-fill';
		}
		// Default rain
		return `i-meteocons-rain-fill`;
	}

	// Snow (6xx)
	if (id >= 600 && id < 700) {
		// Sleet
		if (id >= 611 && id <= 613) {
			return 'i-meteocons-sleet-fill';
		}
		// Rain and snow mix
		if (id >= 615 && id <= 616) {
			return 'i-meteocons-sleet-fill';
		}
		// Light snow
		if (id === 600 || id === 620) {
			return `i-meteocons-partly-cloudy-${timeOfDay}-snow-fill`;
		}
		// Heavy/shower snow
		if (id === 602 || id === 622) {
			return 'i-meteocons-extreme-snow-fill';
		}
		// Default snow
		return 'i-meteocons-snow-fill';
	}

	// Atmosphere (7xx)
	if (id >= 700 && id < 800) {
		switch (id) {
			case 701: // Mist
			case 741: // Fog
				return `i-meteocons-fog-${timeOfDay}-fill`;
			case 711: // Smoke
				return 'i-meteocons-smoke-fill';
			case 721: // Haze
				return `i-meteocons-haze-${timeOfDay}-fill`;
			case 731: // Sand/dust whirls
			case 751: // Sand
			case 761: // Dust
				return 'i-meteocons-dust-wind-fill';
			case 762: // Volcanic ash
				return 'i-meteocons-smoke-fill';
			case 771: // Squalls
				return 'i-meteocons-wind-fill';
			case 781: // Tornado
				return 'i-meteocons-tornado-fill';
			default:
				return `i-meteocons-fog-${timeOfDay}-fill`;
		}
	}

	// Clear (800)
	if (id === 800) {
		return isDay ? 'i-meteocons-clear-day-fill' : 'i-meteocons-clear-night-fill';
	}

	// Clouds (80x)
	if (id > 800 && id < 900) {
		switch (id) {
			case 801: // Few clouds (11-25%)
				return `i-meteocons-partly-cloudy-${timeOfDay}-fill`;
			case 802: // Scattered clouds (25-50%)
				return `i-meteocons-partly-cloudy-${timeOfDay}-fill`;
			case 803: // Broken clouds (51-84%)
				return `i-meteocons-overcast-${timeOfDay}-fill`;
			case 804: // Overcast (85-100%)
				return 'i-meteocons-overcast-fill';
			default:
				return 'i-meteocons-cloudy-fill';
		}
	}

	// Fallback
	return 'i-meteocons-not-available-fill';
}

/**
 * Weather Icons mapping for OpenWeatherMap condition IDs
 * Uses static icons by Erik Flowers
 * @see https://erikflowers.github.io/weather-icons/
 */
function generateWeatherIconClass(data: WeatherData): string {
	const id = data.weather[0].id;
	const isDay = isDaytime(data);

	// Thunderstorm (2xx)
	if (id >= 200 && id < 300) {
		// Thunderstorm with rain
		if (id >= 200 && id <= 202) {
			return isDay ? 'i-wi-day-storm-showers' : 'i-wi-night-alt-storm-showers';
		}
		// Light/standard thunderstorm
		if (id >= 210 && id <= 212) {
			return isDay ? 'i-wi-day-thunderstorm' : 'i-wi-night-alt-thunderstorm';
		}
		// Ragged thunderstorm
		if (id === 221) {
			return isDay ? 'i-wi-day-thunderstorm' : 'i-wi-night-alt-thunderstorm';
		}
		// Thunderstorm with drizzle
		if (id >= 230 && id <= 232) {
			return isDay ? 'i-wi-day-storm-showers' : 'i-wi-night-alt-storm-showers';
		}
		return isDay ? 'i-wi-day-thunderstorm' : 'i-wi-night-alt-thunderstorm';
	}

	// Drizzle (3xx)
	if (id >= 300 && id < 400) {
		// Light drizzle
		if (id >= 300 && id <= 302) {
			return isDay ? 'i-wi-day-sprinkle' : 'i-wi-night-alt-sprinkle';
		}
		// Drizzle rain
		if (id >= 310 && id <= 314) {
			return isDay ? 'i-wi-day-showers' : 'i-wi-night-alt-showers';
		}
		// Shower drizzle
		if (id === 321) {
			return isDay ? 'i-wi-day-showers' : 'i-wi-night-alt-showers';
		}
		return isDay ? 'i-wi-day-sprinkle' : 'i-wi-night-alt-sprinkle';
	}

	// Rain (5xx)
	if (id >= 500 && id < 600) {
		// Light to moderate rain
		if (id >= 500 && id <= 501) {
			return isDay ? 'i-wi-day-rain' : 'i-wi-night-alt-rain';
		}
		// Heavy rain
		if (id >= 502 && id <= 504) {
			return isDay ? 'i-wi-day-rain-wind' : 'i-wi-night-alt-rain-wind';
		}
		// Freezing rain
		if (id === 511) {
			return 'i-wi-sleet';
		}
		// Shower rain
		if (id >= 520 && id <= 531) {
			return isDay ? 'i-wi-day-showers' : 'i-wi-night-alt-showers';
		}
		return isDay ? 'i-wi-day-rain' : 'i-wi-night-alt-rain';
	}

	// Snow (6xx)
	if (id >= 600 && id < 700) {
		// Light/moderate/heavy snow
		if (id >= 600 && id <= 602) {
			return isDay ? 'i-wi-day-snow' : 'i-wi-night-alt-snow';
		}
		// Sleet
		if (id >= 611 && id <= 613) {
			return isDay ? 'i-wi-day-sleet' : 'i-wi-night-alt-sleet';
		}
		// Rain and snow mix
		if (id >= 615 && id <= 616) {
			return isDay ? 'i-wi-day-rain-mix' : 'i-wi-night-alt-rain-mix';
		}
		// Shower snow
		if (id >= 620 && id <= 622) {
			return isDay ? 'i-wi-day-snow-wind' : 'i-wi-night-alt-snow-wind';
		}
		return isDay ? 'i-wi-day-snow' : 'i-wi-night-alt-snow';
	}

	// Atmosphere (7xx)
	if (id >= 700 && id < 800) {
		switch (id) {
			case 701: // Mist
				return isDay ? 'i-wi-day-fog' : 'i-wi-night-fog';
			case 711: // Smoke
				return 'i-wi-smoke';
			case 721: // Haze
				return isDay ? 'i-wi-day-haze' : 'i-wi-night-fog';
			case 731: // Sand/dust whirls
				return 'i-wi-sandstorm';
			case 741: // Fog
				return isDay ? 'i-wi-day-fog' : 'i-wi-night-fog';
			case 751: // Sand
				return 'i-wi-sandstorm';
			case 761: // Dust
				return 'i-wi-dust';
			case 762: // Volcanic ash
				return 'i-wi-volcano';
			case 771: // Squalls
				return 'i-wi-strong-wind';
			case 781: // Tornado
				return 'i-wi-tornado';
			default:
				return 'i-wi-fog';
		}
	}

	// Clear (800)
	if (id === 800) {
		return isDay ? 'i-wi-day-sunny' : 'i-wi-night-clear';
	}

	// Clouds (80x)
	if (id > 800 && id < 900) {
		switch (id) {
			case 801: // Few clouds (11-25%)
				return isDay ? 'i-wi-day-sunny-overcast' : 'i-wi-night-alt-partly-cloudy';
			case 802: // Scattered clouds (25-50%)
				return isDay ? 'i-wi-day-cloudy' : 'i-wi-night-alt-cloudy';
			case 803: // Broken clouds (51-84%)
				return isDay ? 'i-wi-day-cloudy-high' : 'i-wi-night-alt-cloudy-high';
			case 804: // Overcast (85-100%)
				return 'i-wi-cloudy';
			default:
				return 'i-wi-cloudy';
		}
	}

	// Fallback
	return 'i-wi-na';
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
 * Rounds a number to specified decimal places
 */
function roundTo(value: number, decimals: number = 0): number {
	const factor = Math.pow(10, decimals);
	return Math.round(value * factor) / factor;
}

/**
 * Formats temperature with unit
 */
function formatTemp(temp: number, showUnit: boolean = false): string {
	const rounded = roundTo(temp, 0);
	return showUnit ? `${rounded}${unitSymbols.value.temp}` : `${rounded}°`;
}

/**
 * Formats time from unix timestamp respecting timezone
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
 * Gets visibility in appropriate units
 */
function formatVisibility(meters: number): string {
	if (props.units === 'imperial') {
		const miles = meters / 1609.34;
		return `${roundTo(miles, 1)} mi`;
	}
	if (meters >= 1000) {
		return `${roundTo(meters / 1000, 1)} km`;
	}
	return `${meters} m`;
}

/**
 * Gets a human-readable description of conditions
 */
function getConditionDescription(data: WeatherData): string {
	return data.weather[0]?.description || data.weather[0]?.main || 'Unknown';
}

/**
 * Returns the appropriate utility icon based on the animated prop
 */
function getUtilityIcon(type: string): string {
	if (props.animated) {
		const meteoconMap: Record<string, string> = {
			humidity: 'i-meteocons-humidity-fill',
			wind: 'i-meteocons-wind-fill',
			gust: 'i-meteocons-wind-fill',
			pressure: 'i-meteocons-barometer-fill',
			visibility: 'i-meteocons-mist-fill',
			thermometer: 'i-meteocons-thermometer-fill',
			sunrise: 'i-meteocons-sunrise-fill',
			sunset: 'i-meteocons-sunset-fill',
			cloud: 'i-meteocons-cloudy-fill',
			rain: 'i-meteocons-raindrops-fill',
			snow: 'i-meteocons-snowflake-fill',
		};
		return meteoconMap[type] || 'i-meteocons-not-available-fill';
	}

	const wiMap: Record<string, string> = {
		humidity: 'i-wi-humidity',
		wind: 'i-wi-strong-wind',
		gust: 'i-wi-wind-deg',
		pressure: 'i-wi-barometer',
		visibility: 'i-wi-horizon',
		thermometer: 'i-wi-thermometer',
		sunrise: 'i-wi-sunrise',
		sunset: 'i-wi-sunset',
		cloud: 'i-wi-cloud',
		rain: 'i-wi-rain',
		snow: 'i-wi-snow',
	};
	return wiMap[type] || 'i-wi-na';
}
</script>

<template>
	<div v-if="hasData" class="weather text-cream uppercase !glass-container" :class="`weather--${variant}`">
		<!-- Primary Stats Row -->
		<div class="weather__primary text-cream uppercase">
			<span class="weather__temp">{{ formatTemp(weather!.main.temp) }}</span>
			<span class="weather__divider">/</span>
			<span class="weather__condition">{{ weather!.weather[0].main }}</span>
			<span class="weather__icon">
				<UIcon :name="generateIconClass(weather!)" />
			</span>
		</div>

		<!-- Standard variant: adds feels like -->
		<div v-if="variant !== 'compact'" class="weather__secondary text-cream uppercase">
			<span class="weather__feels">Feels like {{ formatTemp(weather!.main.feels_like) }}</span>
			<span class="weather__description">{{ getConditionDescription(weather!) }}</span>
		</div>

		<!-- Detailed variant: adds all weather data -->
		<div v-if="variant === 'detailed'" class="weather__details text-cream uppercase">
			<div class="weather__detail">
				<UIcon :name="getUtilityIcon('humidity')" class="weather__detail-icon" />
				<span class="weather__detail-label">Humidity</span>
				<span class="weather__detail-value">{{ weather!.main.humidity }}%</span>
			</div>

			<div class="weather__detail">
				<UIcon :name="getUtilityIcon('wind')" class="weather__detail-icon" />
				<span class="weather__detail-label">Wind</span>
				<span class="weather__detail-value">
					{{ roundTo(weather!.wind.speed, 0) }} {{ unitSymbols.speed }}
					{{ getWindDirection(weather!.wind.deg) }}
				</span>
			</div>

			<div v-if="weather!.wind.gust" class="weather__detail">
				<UIcon :name="getUtilityIcon('gust')" class="weather__detail-icon" />
				<span class="weather__detail-label">Gusts</span>
				<span class="weather__detail-value">{{ roundTo(weather!.wind.gust, 0) }} {{ unitSymbols.speed }}</span>
			</div>

			<div class="weather__detail">
				<UIcon :name="getUtilityIcon('pressure')" class="weather__detail-icon" />
				<span class="weather__detail-label">Pressure</span>
				<span class="weather__detail-value">{{ weather!.main.pressure }} hPa</span>
			</div>

			<div class="weather__detail">
				<UIcon :name="getUtilityIcon('visibility')" class="weather__detail-icon" />
				<span class="weather__detail-label">Visibility</span>
				<span class="weather__detail-value">{{ formatVisibility(weather!.visibility) }}</span>
			</div>

			<div class="weather__detail">
				<UIcon :name="getUtilityIcon('thermometer')" class="weather__detail-icon" />
				<span class="weather__detail-label">High / Low</span>
				<span class="weather__detail-value">
					{{ formatTemp(weather!.main.temp_max) }} / {{ formatTemp(weather!.main.temp_min) }}
				</span>
			</div>

			<div class="weather__detail">
				<UIcon :name="getUtilityIcon('sunrise')" class="weather__detail-icon" />
				<span class="weather__detail-label">Sunrise</span>
				<span class="weather__detail-value">{{ formatTime(weather!.sys.sunrise, weather!.timezone) }}</span>
			</div>

			<div class="weather__detail">
				<UIcon :name="getUtilityIcon('sunset')" class="weather__detail-icon" />
				<span class="weather__detail-label">Sunset</span>
				<span class="weather__detail-value">{{ formatTime(weather!.sys.sunset, weather!.timezone) }}</span>
			</div>

			<div class="weather__detail">
				<UIcon :name="getUtilityIcon('cloud')" class="weather__detail-icon" />
				<span class="weather__detail-label">Cloud Cover</span>
				<span class="weather__detail-value">{{ weather!.clouds.all }}%</span>
			</div>

			<!-- Precipitation (if any) -->
			<div v-if="weather!.rain?.['1h']" class="weather__detail">
				<UIcon :name="getUtilityIcon('rain')" class="weather__detail-icon" />
				<span class="weather__detail-label">Rain (1h)</span>
				<span class="weather__detail-value">{{ weather!.rain['1h'] }} mm</span>
			</div>

			<div v-if="weather!.snow?.['1h']" class="weather__detail">
				<UIcon :name="getUtilityIcon('snow')" class="weather__detail-icon" />
				<span class="weather__detail-label">Snow (1h)</span>
				<span class="weather__detail-value">{{ weather!.snow['1h'] }} mm</span>
			</div>
		</div>
		<!-- Location (optional) -->
		<div v-if="showLocation" class="weather__location">
			{{ weather!.name }}
			<template v-if="weather!.sys.country">• {{ weather!.sys.country }}</template>
		</div>
	</div>

	<!-- Error State -->
	<div v-else class="weather weather--error">
		<UIcon :name="animated ? 'i-meteocons-not-available-fill' : 'i-wi-na'" class="weather__error-icon" />
		<span class="weather__error-text">Weather unavailable</span>
	</div>
</template>

<style scoped>
@reference "~/assets/css/tailwind.css";
.weather {
	--weather-accent: hwb(39 26% 38%);
	--weather-icon-size: 1.25rem;
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	border-radius: 8px;
	padding: 1rem 2rem;
	border: 1px solid rgba(255, 255, 255, 0.05);
	box-shadow:
		0 8px 32px rgba(0, 0, 0, 0.1),
		inset 0 1px 0 rgba(255, 255, 255, 0.3);

	@apply hidden sm:flex flex-col;
}

/* Compact variant */
.weather--compact {
	@apply gap-0;
}

/* Standard variant */
.weather--standard {
	@apply gap-1;
}

/* Detailed variant */
.weather--detailed {
	@apply gap-2 p-3;
}

.weather__location {
	@apply text-[7px] tracking-wider text-cream uppercase;
}

.weather__primary {
	@apply relative text-xs uppercase tracking-wide flex items-center gap-1.5;
}

.weather__temp {
	@apply font-semibold;
}

.weather__divider {
	@apply text-cream uppercase;
}

.weather__condition {
	@apply text-cream uppercase;
}

.weather__icon {
	color: var(--weather-accent);
	font-size: var(--weather-icon-size);
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	box-shadow: inset 0 1px 6px rgba(0, 0, 0, 0.16);
	@apply h-8 w-8 rounded-full border border-cream/20
         inline-flex items-center justify-center
         bg-cream/10 dark:bg-gray-700;
}

.weather__secondary {
	@apply flex flex-col gap-0.5 text-[10px] text-cream uppercase;
}

.weather__feels {
	@apply font-medium;
}

.weather__description {
	@apply text-cream uppercase;
}

.weather__details {
	@apply grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700;
}

.weather__detail {
	@apply flex items-center gap-1.5 text-[11px];
}

.weather__detail-icon {
	color: var(--weather-accent);
	@apply text-sm flex-shrink-0;
}

.weather__detail-label {
	@apply text-cream uppercase;
}

.weather__detail-value {
	@apply ml-auto font-medium text-cream uppercase;
}

/* Error state */
.weather--error {
	@apply flex-row items-center gap-2 text-cream uppercase;
}

.weather__error-icon {
	@apply text-lg;
}

.weather__error-text {
	@apply text-xs;
}
</style>
