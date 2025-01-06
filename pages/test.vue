<template>
	<div class="parking-lot-container">
		<div class="parking-lot">
			<div class="column reversed">
				<div
					v-for="n in [28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17]"
					:key="n"
					class="spot"
					:class="{ occupied: getSpotInfo(n)?.vehicles.length > 0 }"
					@click="showSpotDetails(n)"
				>
					<span class="spot__number">{{ n }}</span>
					<span v-if="getSpotInfo(n)" class="spot__label">Unit {{ getSpotInfo(n)?.unit }}</span>
					<span class="spot__vehicles">{{ getSpotInfo(n)?.vehicles.length }} Vehicles</span>
				</div>
			</div>
			<div class="column">
				<div
					v-for="n in [16, 15]"
					:key="n"
					class="spot"
					:class="{ occupied: getSpotInfo(n)?.vehicles.length > 0 }"
					@click="showSpotDetails(n)"
				>
					<span class="spot__number">{{ n }}</span>
					<span v-if="getSpotInfo(n)" class="spot__label">Unit {{ getSpotInfo(n)?.unit }}</span>
					<span class="spot__vehicles">{{ getSpotInfo(n)?.vehicles.length }} Vehicles</span>
				</div>
			</div>
			<div class="column">
				<div
					v-for="n in [13, 14]"
					:key="n"
					class="spot"
					:class="{ occupied: getSpotInfo(n)?.vehicles.length > 0 }"
					@click="showSpotDetails(n)"
				>
					<span class="spot__number">{{ n }}</span>
					<span v-if="getSpotInfo(n)" class="spot__label">Unit {{ getSpotInfo(n)?.unit }}</span>
					<span class="spot__vehicles">{{ getSpotInfo(n)?.vehicles.length }} Vehicles</span>
				</div>
			</div>
			<div class="column">
				<div
					v-for="n in [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]"
					:key="n"
					class="spot"
					:class="{ occupied: getSpotInfo(n)?.vehicles.length > 0 }"
					@click="showSpotDetails(n)"
				>
					<span class="spot__number">{{ n }}</span>
					<span v-if="getSpotInfo(n)" class="spot__label">Unit {{ getSpotInfo(n)?.unit }}</span>
					<span class="spot__vehicles">{{ getSpotInfo(n)?.vehicles.length }} Vehicles</span>
				</div>
			</div>
			<div class="center-area">
				<h3 class="tracking-[0.92em] uppercase text-[12px] font-bold border-b border-gray-50">1033 LENOX</h3>
				<p class="tracking-[0.6em] uppercase text-[22px] font-bold">PARKING</p>
			</div>
			<div class="north-gate">NORTH GATE</div>
			<div class="south-gate">SOUTH GATE</div>
		</div>
		<div
			v-if="isSpotDetailsVisible"
			ref="spotDetailsRef"
			class="spot-details transition-transform duration-300 ease-out uppercase"
		>
			<div class="spot-details__inner">
				<UButton icon="heroicons:x-mark" @click="closeSpotDetails" :ui="{ rounded: 'full' }" />
				<div class="flex flex-col md:flex-row w-full items-start justify-start text-[18px]">
					<h3 class="w-full md:w-1/2">
						Parking Spot:
						<strong class="font-bold">{{ selectedSpot.number }}</strong>
					</h3>
					<p v-if="selectedSpot.unit" class="w-full md:w-1/2">Unit: {{ selectedSpot.unit }}</p>
					<p v-else class="w-full md:w-1/2">No Unit Assigned</p>
				</div>
				<div class="flex flex-col md:flex-row w-full items-start justify-start text-[12px]">
					<div v-if="selectedSpot.vehicles.length" class="w-full md:w-1/2">
						<h4>Vehicles:</h4>
						<ul>
							<li v-for="vehicle in selectedSpot.vehicles" :key="vehicle.license_plate">
								{{ vehicle.make }} {{ vehicle.model }} {{ vehicle.license_plate }}
							</li>
						</ul>
					</div>
					<p v-else class="w-full md:w-1/2">No Vehicles Assigned</p>

					<div v-if="selectedSpot.residents.length" class="w-full md:w-1/2">
						<h4>Residents:</h4>
						<ul>
							<li v-for="resident in selectedSpot.residents" :key="resident.email">
								{{ resident.first_name }} {{ resident.last_name }}
							</li>
						</ul>
					</div>
					<p v-else class="w-full md:w-1/2">No Residents Assigned</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import gsap from 'gsap';
const { readItems } = useDirectusItems();
import { onClickOutside } from '@vueuse/core';
const selectedSpot = ref(null);
const isSpotDetailsVisible = ref(false);
const spotDetailsRef = ref(null);

const units = await readItems('units', {
	fields: [
		'*,vehicles.make,vehicles.model,vehicles.license_plate,vehicles.color,people.people_id.status,people.people_id.first_name,people.people_id.last_name,people.people_id.category,people.people_id.phone,people.people_id.email',
	],
	filter: {
		status: {
			_eq: 'published',
		},
		people: {
			// Filter on the 'people' relation
			people_id: {
				// Filter on the 'people_id' related collection
				status: {
					// Filter on the 'status' field within 'people_id'
					_eq: 'published',
				},
			},
		},
	},
});

const getSpotInfo = computed(() => (spotNumber) => {
	console.log('spotNumber', spotNumber);
	const unit = units.find((u) => u.parking_spot === spotNumber?.toString());

	if (!unit) return null;

	return {
		number: spotNumber,
		unit: unit.number,
		vehicles:
			unit.vehicles?.filter(Boolean).map((v) => ({
				make: v.make,
				model: v.model,
				licensePlate: v.licensePlate,
				color: v.color,
			})) || [],
		residents:
			unit.people
				?.filter((p) => p?.people_id && p.people_id.status === 'published')
				.map((p) => ({
					first_name: p.people_id.first_name,
					last_name: p.people_id.last_name,
					category: p.people_id.category,
					phone: p.people_id.phone,
					email: p.people_id.email,
					status: p.people_id.status,
				})) || [],
	};
});

const tl = gsap.timeline({ paused: true });

const showSpotDetails = async (n) => {
	selectedSpot.value = getSpotInfo.value(n); // Set selected spot data
	isSpotDetailsVisible.value = true;

	await nextTick(); // Ensure DOM is updated

	gsap.fromTo(
		spotDetailsRef.value, // Target the details element
		{ y: '100vh' }, // Start state
		{ y: 0, duration: 0.2, ease: 'power3.bounce' }, // End state
	);
};

const closeSpotDetails = () => {
	gsap.to(spotDetailsRef.value, {
		y: '100vh', // Animate out of view

		duration: 0.2, // Match the opening duration
		ease: 'power3.out',
		onComplete: () => {
			isSpotDetailsVisible.value = false; // Hide after animation
			selectedSpot.value = null; // Clear selected spot
		},
	});
};

onClickOutside(spotDetailsRef, () => {
	if (isSpotDetailsVisible.value) closeSpotDetails();
});
</script>

<style scoped>
.parking-lot-container {
	display: flex;
	justify-content: center;
	align-items: center;
	@apply my-20;
}

.parking-lot {
	display: flex; /* Use flexbox for columns */
	gap: 2px;
	width: 80%;
	max-width: 800px;
	position: relative; /* For absolute positioning of center area and gates */
	@apply relative  border-gray-100 border;
}

.column {
	display: flex;
	flex-direction: column; /* Default: top to bottom */
	flex: 1;
	gap: 6px;
}

.column.reversed {
	flex-direction: column-reverse;
}

.column:nth-child(1),
.column:nth-child(3) {
	.spot {
		margin-right: 50px;
	}
}

.column:nth-child(2),
.column:nth-child(4) {
	.spot {
		margin-left: 50px;
	}
}

.spot {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	font-size: 14px;
	cursor: pointer;
	position: relative;
	overflow: hidden;

	height: 50px; /* Consistent spot height */
	@apply border border-gray-100 dark:border-gray-500;
	&__number {
		font-size: 12px;
		line-height: 14px;
		box-shadow: inset 0px 5px 10px rgba(0, 0, 0, 0.15);
		text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25);
		@apply absolute top-0 left-0 p-2  h-[30px] w-[30px] text-center font-bold bg-gray-400 text-white dark:text-white;
	}
	&__label {
		font-size: 12px;
		@apply uppercase;
	}
	&__vehicles {
		font-size: 9px;
		@apply uppercase font-bold;
	}
}

.spot.occupied {
	@apply bg-gray-200 dark:text-black;
}

.center-area {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 10px;
}

.north-gate {
	position: absolute;
	bottom: -25px;
	left: 20%;
	width: 15%;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 5px;
	font-size: 10px;
	@apply border-t border-gray-600;
}

.south-gate {
	position: absolute;
	bottom: -25px;
	right: 20%;
	width: 15%;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 5px;
	font-size: 10px;
	@apply border-t border-gray-600;
}
.spot-details {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 1rem;
	height: 100svh;
	transform: translateY(100%); /* Start hidden */
	z-index: 100;
	background: rgba(255, 255, 255, 0.25);
	backdrop-filter: blur(10px);
	/* transition:
		transform 0.3s ease-out,
		opacity 0.3s ease-out;*/
	@apply flex items-center justify-center flex-col shadow-lg rounded-lg;
	&__inner {
		max-width: 800px;
		@apply p-20 bg-white w-full mx-20 relative;
		h3,
		h4 {
			margin-bottom: 0.5rem;
		}

		ul {
			list-style-type: disc;
			padding-left: 1.5rem;
			margin-bottom: 1rem;
		}

		button {
			padding: 0.5rem 1rem;
			background-color: #f0f0f0;
			border: 1px solid #ccc;
			cursor: pointer;
		}
	}
}
</style>
