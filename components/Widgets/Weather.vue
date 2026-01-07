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
	/** Compact mode for mobile */
	compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	lat: 25.781175,
	lon: -80.139328,
	apiKey: '11a6889ce0bda17eda9f935cd43fba39',
	units: 'imperial',
	variant: 'compact',
	showLocation: false,
	animated: false,
	compact: false,
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
 */
function generateMeteoconClass(data: WeatherData): string {
	const id = data.weather[0].id;
	const isDay = isDaytime(data);
	const timeOfDay = isDay ? 'day' : 'night';

	// Thunderstorm (2xx)
	if (id >= 200 && id < 300) {
		if ((id >= 200 && id <= 202) || (id >= 230 && id <= 232)) {
			return `i-meteocons-thunderstorms-${timeOfDay}-rain-fill`;
		}
		return `i-meteocons-thunderstorms-${timeOfDay}-fill`;
	}

	// Drizzle (3xx)
	if (id >= 300 && id < 400) {
		return `i-meteocons-partly-cloudy-${timeOfDay}-drizzle-fill`;
	}

	// Rain (5xx)
	if (id >= 500 && id < 600) {
		if (id === 511) return 'i-meteocons-sleet-fill';
		if (id >= 520 && id <= 531) return `i-meteocons-partly-cloudy-${timeOfDay}-rain-fill`;
		if (id === 500) return `i-meteocons-partly-cloudy-${timeOfDay}-rain-fill`;
		if (id >= 502 && id <= 504) return 'i-meteocons-extreme-rain-fill';
		return `i-meteocons-rain-fill`;
	}

	// Snow (6xx)
	if (id >= 600 && id < 700) {
		if (id >= 611 && id <= 616) return 'i-meteocons-sleet-fill';
		if (id === 600 || id === 620) return `i-meteocons-partly-cloudy-${timeOfDay}-snow-fill`;
		if (id === 602 || id === 622) return 'i-meteocons-extreme-snow-fill';
		return 'i-meteocons-snow-fill';
	}

	// Atmosphere (7xx)
	if (id >= 700 && id < 800) {
		switch (id) {
			case 701:
			case 741:
				return `i-meteocons-fog-${timeOfDay}-fill`;
			case 711:
				return 'i-meteocons-smoke-fill';
			case 721:
				return `i-meteocons-haze-${timeOfDay}-fill`;
			case 731:
			case 751:
			case 761:
				return 'i-meteocons-dust-wind-fill';
			case 762:
				return 'i-meteocons-smoke-fill';
			case 771:
				return 'i-meteocons-wind-fill';
			case 781:
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
			case 801:
			case 802:
				return `i-meteocons-partly-cloudy-${timeOfDay}-fill`;
			case 803:
				return `i-meteocons-overcast-${timeOfDay}-fill`;
			case 804:
				return 'i-meteocons-overcast-fill';
			default:
				return 'i-meteocons-cloudy-fill';
		}
	}

	return 'i-meteocons-not-available-fill';
}

/**
 * Weather Icons mapping for OpenWeatherMap condition IDs
 */
function generateWeatherIconClass(data: WeatherData): string {
	const id = data.weather[0].id;
	const isDay = isDaytime(data);

	// Thunderstorm (2xx)
	if (id >= 200 && id < 300) {
		if (id >= 200 && id <= 202) return isDay ? 'i-wi-day-storm-showers' : 'i-wi-night-alt-storm-showers';
		if (id >= 230 && id <= 232) return isDay ? 'i-wi-day-storm-showers' : 'i-wi-night-alt-storm-showers';
		return isDay ? 'i-wi-day-thunderstorm' : 'i-wi-night-alt-thunderstorm';
	}

	// Drizzle (3xx)
	if (id >= 300 && id < 400) {
		if (id >= 300 && id <= 302) return isDay ? 'i-wi-day-sprinkle' : 'i-wi-night-alt-sprinkle';
		return isDay ? 'i-wi-day-showers' : 'i-wi-night-alt-showers';
	}

	// Rain (5xx)
	if (id >= 500 && id < 600) {
		if (id >= 500 && id <= 501) return isDay ? 'i-wi-day-rain' : 'i-wi-night-alt-rain';
		if (id >= 502 && id <= 504) return isDay ? 'i-wi-day-rain-wind' : 'i-wi-night-alt-rain-wind';
		if (id === 511) return 'i-wi-sleet';
		if (id >= 520 && id <= 531) return isDay ? 'i-wi-day-showers' : 'i-wi-night-alt-showers';
		return isDay ? 'i-wi-day-rain' : 'i-wi-night-alt-rain';
	}

	// Snow (6xx)
	if (id >= 600 && id < 700) {
		if (id >= 600 && id <= 602) return isDay ? 'i-wi-day-snow' : 'i-wi-night-alt-snow';
		if (id >= 611 && id <= 613) return isDay ? 'i-wi-day-sleet' : 'i-wi-night-alt-sleet';
		if (id >= 615 && id <= 616) return isDay ? 'i-wi-day-rain-mix' : 'i-wi-night-alt-rain-mix';
		if (id >= 620 && id <= 622) return isDay ? 'i-wi-day-snow-wind' : 'i-wi-night-alt-snow-wind';
		return isDay ? 'i-wi-day-snow' : 'i-wi-night-alt-snow';
	}

	// Atmosphere (7xx)
	if (id >= 700 && id < 800) {
		switch (id) {
			case 701:
			case 741:
				return isDay ? 'i-wi-day-fog' : 'i-wi-night-fog';
			case 711:
				return 'i-wi-smoke';
			case 721:
				return isDay ? 'i-wi-day-haze' : 'i-wi-night-fog';
			case 731:
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

	// Clear (800)
	if (id === 800) {
		return isDay ? 'i-wi-day-sunny' : 'i-wi-night-clear';
	}

	// Clouds (80x)
	if (id > 800 && id < 900) {
		switch (id) {
			case 801:
				return isDay ? 'i-wi-day-sunny-overcast' : 'i-wi-night-alt-partly-cloudy';
			case 802:
				return isDay ? 'i-wi-day-cloudy' : 'i-wi-night-alt-cloudy';
			case 803:
				return isDay ? 'i-wi-day-cloudy-high' : 'i-wi-night-alt-cloudy-high';
			case 804:
				return 'i-wi-cloudy';
			default:
				return 'i-wi-cloudy';
		}
	}

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
	<div
		v-if="hasData"
		class="glass-widget flex-col text-cream uppercase"
		:class="[
			compact ? 'px-4 py-2' : 'px-6 py-3',
			{
				'gap-0': variant === 'compact',
				'gap-1': variant === 'standard',
				'gap-2': variant === 'detailed',
			},
		]">
		<!-- Primary Stats Row -->
		<div
			class="relative uppercase tracking-wide flex items-center gap-1.5 text-cream"
			:class="compact ? 'text-[10px]' : 'text-xs'">
			<span class="font-semibold">{{ formatTemp(weather!.main.temp) }}</span>
			<span class="text-cream">/</span>
			<span class="text-cream">{{ weather!.weather[0].main }}</span>
			<span
				class="glass-widget__icon rounded-full border border-cream/20 inline-flex items-center justify-center bg-cream/10 dark:bg-gray-700"
				:class="compact ? 'h-6 w-6 text-xs' : 'h-8 w-8'">
				<Icon :name="generateIconClass(weather!)" />
			</span>
		</div>

		<!-- Standard variant: adds feels like -->
		<div v-if="variant !== 'compact'" class="flex flex-col gap-0.5 text-[10px] text-cream uppercase">
			<span class="font-medium">Feels like {{ formatTemp(weather!.main.feels_like) }}</span>
			<span class="text-cream/70">{{ getConditionDescription(weather!) }}</span>
		</div>

		<!-- Location (optional) -->
		<div v-if="showLocation && variant !== 'compact'" class="text-[9px] tracking-wider text-cream/60 uppercase">
			{{ weather!.name }}
			<template v-if="weather!.sys.country">· {{ weather!.sys.country }}</template>
		</div>

		<!-- Detailed variant: adds all weather data (hide on compact mobile) -->
		<div
			v-if="variant === 'detailed' && !compact"
			class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('humidity')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Humidity</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ weather!.main.humidity }}%</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('wind')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Wind</span>
				<span class="ml-auto font-medium text-cream uppercase">
					{{ roundTo(weather!.wind.speed, 0) }} {{ unitSymbols.speed }} {{ getWindDirection(weather!.wind.deg) }}
				</span>
			</div>

			<div v-if="weather!.wind.gust" class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('gust')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Gusts</span>
				<span class="ml-auto font-medium text-cream uppercase">
					{{ roundTo(weather!.wind.gust, 0) }} {{ unitSymbols.speed }}
				</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('pressure')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Pressure</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ weather!.main.pressure }} hPa</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('visibility')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Visibility</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ formatVisibility(weather!.visibility) }}</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('thermometer')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">High / Low</span>
				<span class="ml-auto font-medium text-cream uppercase">
					{{ formatTemp(weather!.main.temp_max) }} / {{ formatTemp(weather!.main.temp_min) }}
				</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('sunrise')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Sunrise</span>
				<span class="ml-auto font-medium text-cream uppercase">
					{{ formatTime(weather!.sys.sunrise, weather!.timezone) }}
				</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('sunset')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Sunset</span>
				<span class="ml-auto font-medium text-cream uppercase">
					{{ formatTime(weather!.sys.sunset, weather!.timezone) }}
				</span>
			</div>

			<div class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('cloud')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Cloud Cover</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ weather!.clouds.all }}%</span>
			</div>

			<!-- Precipitation (if any) -->
			<div v-if="weather!.rain?.['1h']" class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('rain')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Rain (1h)</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ weather!.rain['1h'] }} mm</span>
			</div>

			<div v-if="weather!.snow?.['1h']" class="flex items-center gap-1.5 text-[11px]">
				<Icon :name="getUtilityIcon('snow')" class="glass-widget__detail-icon text-sm shrink-0" />
				<span class="text-cream uppercase">Snow (1h)</span>
				<span class="ml-auto font-medium text-cream uppercase">{{ weather!.snow['1h'] }} mm</span>
			</div>
		</div>
	</div>

	<!-- Error State -->
	<div
		v-else
		class="glass-widget flex-row items-center gap-2 text-cream uppercase"
		:class="compact ? 'px-4 py-2' : 'px-6 py-3'">
		<Icon :name="animated ? 'i-meteocons-not-available-fill' : 'i-wi-na'" class="text-lg" />
		<span class="text-xs">Weather unavailable</span>
	</div>
</template>
