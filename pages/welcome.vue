<script setup lang="ts">
definePageMeta({
	layout: 'default',
});

useSeoMeta({
	title: 'Welcome Home - 1033 Lenox',
	description:
		'Welcome to 1033 Lenox — Your guide to boutique living in Miami Beach. Building amenities, rules, parking, and everything you need to know as a new resident.',
});

const {user, loggedIn} = useDirectusAuth();

// Fetch personalized data if logged in
const personData = ref<any>(null);
const unitData = ref<any>(null);
const vehiclesData = ref<any[]>([]);
const petsData = ref<any[]>([]);
const loading = ref(false);

const peopleCollection = useDirectusItems('people', {requireAuth: false});
const unitsCollection = useDirectusItems('units', {requireAuth: false});

async function fetchPersonalData() {
	if (!loggedIn.value || !user.value?.person_id) return;

	loading.value = true;
	try {
		// Fetch person record
		const person = await peopleCollection.get(user.value.person_id, {
			fields: [
				'id',
				'first_name',
				'last_name',
				'email',
				'phone',
				'category',
				'unit.units_id.id',
				'unit.units_id.number',
				'unit.units_id.parking_spot',
				'unit.units_id.mailbox',
				'unit.units_id.vehicles.*',
				'unit.units_id.pets.*',
			],
		});

		personData.value = person;

		// Extract unit data from the junction
		if (person?.unit?.length > 0) {
			const unitJunction = person.unit[0];
			const unit = typeof unitJunction.units_id === 'object' ? unitJunction.units_id : null;
			if (unit) {
				unitData.value = unit;
				vehiclesData.value = (unit.vehicles || []).filter((v: any) => typeof v === 'object');
				petsData.value = (unit.pets || []).filter((p: any) => typeof p === 'object');
			}
		}
	} catch (e) {
		// Silently fail — the page degrades to public mode
		console.error('Failed to fetch personalized data:', e);
	} finally {
		loading.value = false;
	}
}

// Fetch data on mount if logged in
onMounted(() => {
	fetchPersonalData();
});

// Reactive display name
const displayName = computed(() => {
	if (personData.value?.first_name) return personData.value.first_name;
	if (user.value?.first_name) return user.value.first_name;
	return null;
});

const fullName = computed(() => {
	if (personData.value) return `${personData.value.first_name || ''} ${personData.value.last_name || ''}`.trim();
	if (user.value) return `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim();
	return null;
});

// Section numbering — adjusts based on whether personalized section is shown
const showPersonalSection = computed(() => loggedIn.value && personData.value);
const sectionOffset = computed(() => (showPersonalSection.value ? 1 : 0));
function sectionNum(base: number) {
	return String(base + sectionOffset.value).padStart(2, '0');
}
</script>

<template>
	<div class="welcome-page min-h-screen">
		<!-- Hero Section -->
		<section class="relative overflow-hidden">
			<div
				class="w-full h-[400px] md:h-[500px] bg-cover bg-center bg-no-repeat flex items-center justify-center"
				style="
					background-image: url('https://admin.1033lenox.com/assets/48693e40-9f54-45e7-83cb-3c537b7effda?key=large-png');
				">
				<div class="absolute inset-0 bg-black/40"></div>
				<div class="max-w-2xl mx-auto text-center z-10">
					<p class="text-xs tracking-[0.3em] uppercase t-text-accent mb-4">Miami Beach · Flamingo Park</p>
					<h1 class="t-heading text-4xl md:text-5xl font-normal leading-tight text-white mb-4">Welcome Home</h1>
					<div class="w-16 h-px t-bg-accent mx-auto mb-6"></div>
					<p class="t-heading text-lg italic t-text-accent">The Smart Life in South Beach</p>
				</div>
			</div>
		</section>

		<!-- Welcome Header -->
		<!-- <section class="t-section py-12 md:py-16 px-6">
			<div class="max-w-2xl mx-auto text-center">
				<p class="text-xs tracking-[0.3em] uppercase t-text-accent mb-4">Miami Beach · Flamingo Park</p>
				<h1 class="t-heading text-4xl md:text-5xl font-normal leading-tight t-text mb-4">Welcome Home</h1>
				<div class="w-16 h-px t-bg-accent mx-auto mb-6"></div>
				<p class="t-heading text-lg italic t-text-tertiary">The Smart Life in South Beach</p>
			</div>
		</section> -->

		<!-- Personalized Welcome Message -->
		<section class="t-section px-6 py-12 md:py-16">
			<div class="max-w-2xl mx-auto text-center">
				<p class="t-body text-base leading-relaxed t-text-secondary">
					<span v-if="displayName">Hello {{ displayName }},</span>
					Welcome to 1033 Lenox
				</p>
				<p class="t-body text-base leading-relaxed t-text-secondary mt-3">
					We are a 28-unit boutique residence in the heart of Miami Beach's Flamingo Park neighborhood. We're glad to
					have you as part of our community.
				</p>
				<p class="t-body text-base leading-relaxed t-text-secondary mt-3">
					This page contains important information about your unit, building rules, and community resources. Please
					review it carefully and keep it for your records.
				</p>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- SECTION: YOUR DIRECTORY LISTING (only if logged in with data) -->
		<!-- ================================================================ -->
		<section v-if="showPersonalSection" class="t-section-alt py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">01</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">
							Your Information
						</span>
					</div>
					<div class="content-main min-w-0 overflow-x-clip">
						<h2 class="t-heading text-2xl md:text-3xl font-normal t-text mb-2">Directory Listing</h2>
						<div class="w-10 h-px t-bg-accent mb-4"></div>
						<p class="t-body text-sm leading-relaxed t-text-secondary mb-8">
							Below is your registered information on file. Please verify that everything is accurate. If you need to
							make any updates, contact management.
						</p>

						<!-- Person Info Card -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<h3 class="t-heading text-xl t-text mb-1">{{ fullName }}</h3>
							<p class="text-[10px] tracking-[0.15em] uppercase t-text-accent mb-4">
								{{ personData?.category || 'Resident' }}
							</p>
							<div class="w-full h-px t-divider-bg mb-4"></div>

							<!-- Unit -->
							<div class="mb-4" v-if="unitData?.number">
								<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-1">Unit</p>
								<p class="text-lg font-bold t-text">{{ unitData.number }}</p>
							</div>

							<!-- Parking Spot -->
							<div class="mb-4" v-if="unitData?.parking_spot">
								<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-1">Assigned Parking Spot</p>
								<p class="text-lg font-bold t-text">#{{ unitData.parking_spot }}</p>
							</div>

							<!-- Mailbox -->
							<div class="mb-4" v-if="unitData?.mailbox">
								<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-1">Assigned Mailbox</p>
								<p class="text-lg font-bold t-text">#{{ unitData.mailbox }}</p>
							</div>

							<!-- Email -->
							<div class="mb-4" v-if="personData?.email">
								<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-1">Email on File</p>
								<p class="text-sm t-text">{{ personData.email }}</p>
							</div>

							<!-- Phone -->
							<div v-if="personData?.phone">
								<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-1">Phone on File</p>
								<p class="text-sm t-text">{{ personData.phone }}</p>
							</div>
						</div>

						<!-- Vehicles Card -->
						<div v-if="vehiclesData.length > 0" class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-3">Registered Vehicles</p>
							<div v-for="vehicle in vehiclesData" :key="vehicle.id" class="t-bg-alt p-3 px-4 mb-2 last:mb-0">
								<p class="text-base font-semibold t-text">{{ vehicle.make }} {{ vehicle.model }}</p>
								<p class="text-sm t-text-tertiary mt-1">
									<span v-if="vehicle.color">Color: {{ vehicle.color }} ·</span>
									Plate: {{ vehicle.license_plate }}
								</p>
							</div>
						</div>

						<!-- Pets Card -->
						<div v-if="petsData.length > 0" class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-3">Registered Pets</p>
							<div v-for="pet in petsData" :key="pet.id" class="t-bg-alt p-3 px-4 mb-2 last:mb-0">
								<p class="text-base font-semibold t-text">{{ pet.name }}</p>
								<p class="text-sm t-text-tertiary mt-1">
									{{ pet.category }}
									<span v-if="pet.breed">· {{ pet.breed }}</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- SECTION: BUILDING AMENITIES -->
		<!-- ================================================================ -->
		<section class="t-section py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">{{ sectionNum(1) }}</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">First Floor</span>
					</div>
					<div class="content-main min-w-0 overflow-x-clip">
						<h2 class="t-heading text-2xl md:text-3xl font-normal t-text mb-2">Building Amenities</h2>
						<div class="w-10 h-px t-bg-accent mb-4"></div>
						<p class="t-body text-sm leading-relaxed t-text-secondary mb-8">
							Our building has several shared spaces on the first floor.
						</p>

						<div class="t-card-flat rounded-none p-6 md:p-7">
							<div class="text-sm leading-[2.2]">
								<p>
									<span class="font-bold t-text-accent">Room 104</span>
									<span class="t-text">&ensp;Trash & Recycling Room</span>
								</p>
								<p>
									<span class="font-bold t-text-accent">Room 103</span>
									<span class="t-text">&ensp;Laundry Room</span>
								</p>
								<p>
									<span class="font-bold t-text-accent">Room 102</span>
									<span class="t-text">&ensp;Storage</span>
									<span class="text-xs italic t-text-tertiary">(not currently open — stay tuned)</span>
								</p>
								<p>
									<span class="font-bold t-text-accent">Room 101</span>
									<span class="t-text">&ensp;Clubhouse</span>
									<span class="text-xs italic t-text-tertiary">(board meetings — under development)</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- SECTION: LAUNDRY ROOM -->
		<!-- ================================================================ -->
		<section class="t-section-alt py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">{{ sectionNum(2) }}</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Amenities</span>
					</div>
					<div class="content-main min-w-0 overflow-x-clip">
						<h2 class="t-heading text-2xl md:text-3xl font-normal t-text mb-2">Laundry Room</h2>
						<div class="w-10 h-px t-bg-accent mb-8"></div>

						<!-- Access Code -->
						<div class="t-bg-alt border-l-3 t-border-accent p-5 md:p-7 mb-3">
							<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-1">Access Code</p>
							<p class="t-heading text-3xl font-bold t-text">2501#</p>
						</div>

						<!-- Wash Connect -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text-accent mb-3">Wash Connect App</p>
							<p class="t-body text-sm leading-relaxed t-text-secondary mb-3">
								Our laundry machines operate through the
								<strong>Wash Connect</strong>
								app. Download it from the App Store or Google Play, create an account, and add a payment method. You'll
								be able to start and pay for machines directly from your phone.
							</p>
							<p class="t-body text-sm t-text-secondary mb-4">
								We ask that you please wipe down the machines after each use.
							</p>
							<div class="space-y-1 text-sm">
								<a
									href="https://apps.apple.com/us/app/wash-connect/id1469627109"
									target="_blank"
									class="t-link underline font-semibold block">
									Download for iPhone →
								</a>
								<a
									href="https://play.google.com/store/apps/details?id=com.wash.connect&hl=en_US"
									target="_blank"
									class="t-link underline font-semibold block">
									Download for Android →
								</a>
								<a
									href="https://www.wash.com/wash-connect-help/"
									target="_blank"
									class="t-link underline font-semibold block">
									Wash Connect Help Center →
								</a>
							</div>
						</div>

						<!-- Usage Guidelines -->
						<div class="mt-4">
							<p class="t-body text-sm leading-relaxed t-text-secondary mb-2">
								The laundromat is for
								<strong>Lenox Plaza residents only</strong>
								. Please do not share the access code with anyone who does not live at the property.
							</p>
							<p class="t-body text-sm t-text-secondary mb-2"><strong>Additional Guidelines:</strong></p>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>· Keep washer doors open when not in use</li>
								<li>· Close the entrance door when finished</li>
							</ul>
						</div>

						<p class="t-body text-xs italic t-text-tertiary mt-4">
							All laundry room activities are monitored by 24-hour video camera.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- SECTION: TRASH & RECYCLING -->
		<!-- ================================================================ -->
		<section class="t-section py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">{{ sectionNum(3) }}</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">
							Building Operations
						</span>
					</div>
					<div class="content-main min-w-0 overflow-x-clip">
						<h2 class="t-heading text-2xl md:text-3xl font-normal t-text mb-2">Trash & Recycling</h2>
						<div class="w-10 h-px t-bg-accent mb-4"></div>
						<p class="t-body text-xs italic t-text-tertiary mb-8">
							The trash room is under 24-hour video surveillance.
						</p>

						<!-- Access Code -->
						<div class="t-bg-elevated border-l-3 t-border-accent p-5 md:p-7 mb-3">
							<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-1">Access Code</p>
							<p class="t-heading text-3xl font-bold t-text">2501#</p>
						</div>

						<!-- Trash -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text-accent mb-3">Trash</p>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>
									· All trash must be placed in the large dumpster —
									<strong>lids must remain down at all times</strong>
								</li>
								<li>
									· Pickup schedule:
									<strong>Monday, Wednesday, and Friday</strong>
								</li>
								<li>· At no time should trash be placed outside the bin in the trash room</li>
							</ul>
						</div>

						<!-- Recycling -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text-accent mb-3">Recycling</p>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>
									· All recycling boxes must be
									<strong>broken down</strong>
									and placed in the recycling bin
								</li>
								<li>· If the recycle bin is full, place items in the trash bin</li>
								<li>· At no time should recycled items be left outside of the bins</li>
							</ul>
						</div>

						<!-- Large Item Disposal -->
						<div class="t-card-flat rounded-none p-6 md:p-7">
							<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text-accent mb-3">Large Item Disposal</p>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>
									· Large items (furniture, appliances, etc.) are
									<strong>NOT to be disposed in the trash room or bin</strong>
								</li>
								<li>· Residents are responsible for disposing of large items at the city dump</li>
								<li>
									·
									<strong>Every 1st weekend of each month:</strong>
									drop off large items at the city dumpster at 140 MacArthur Causeway
								</li>
							</ul>
							<a
								href="https://www.miamibeachfl.gov/city-hall/public-works/sanitation-division/"
								target="_blank"
								class="t-link underline text-sm mt-3 inline-block">
								Miami Beach Sanitation Department →
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- SECTION: PARKING -->
		<!-- ================================================================ -->
		<section class="t-section-alt py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">{{ sectionNum(4) }}</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Parking</span>
					</div>
					<div class="content-main min-w-0 overflow-x-clip">
						<h2 class="t-heading text-2xl md:text-3xl font-normal t-text mb-2">Garage & Parking</h2>
						<div class="w-10 h-px t-bg-accent mb-8"></div>

						<!-- Assigned Spot (personalized) -->
						<div v-if="unitData?.parking_spot" class="t-bg-alt border-l-3 t-border-accent p-5 md:p-7 mb-3">
							<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-1">Your Assigned Spot</p>
							<p class="t-heading text-3xl font-bold t-text">Spot #{{ unitData.parking_spot }}</p>
						</div>

						<!-- Parking Rules -->
						<div class="mb-6">
							<p class="t-body text-sm leading-relaxed t-text-secondary mb-2">
								There is
								<strong>one parking space per unit</strong>
								. Please keep the following rules in mind:
							</p>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>
									· All vehicles must be
									<strong>registered with the board</strong>
								</li>
								<li>
									· Work vans and motorcycles are
									<strong>not allowed</strong>
									in the garage
								</li>
								<li>· No mechanical work on vehicles in the garage</li>
								<li>· Parking spots must be kept clean</li>
								<li>· No storage of objects or items in the garage</li>
							</ul>
						</div>

						<!-- Parking Map -->
						<div>
							<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-2">Parking Map</p>
							<NuxtImg
								src="81a4cf9a-88cc-4215-9d21-5a82e91ab276"
								alt="1033 Lenox Parking Map"
								class="w-full border t-border"
								format="png" />
							<a
								href="https://admin.1033lenox.com/assets/81a4cf9a-88cc-4215-9d21-5a82e91ab276?key=xlarge"
								target="_blank"
								class="t-link underline text-xs italic mt-2 inline-block">
								View full parking map →
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- SECTION: STREET PARKING (Zone 2) -->
		<!-- ================================================================ -->
		<section class="t-section py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">{{ sectionNum(5) }}</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Street Parking</span>
					</div>
					<div class="content-main min-w-0 overflow-x-clip">
						<h2 class="t-heading text-2xl md:text-3xl font-normal t-text mb-2">Zone 2 Resident Parking</h2>
						<div class="w-10 h-px t-bg-accent mb-8"></div>

						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text-accent mb-3">Neighborly Tip</p>
							<p class="t-body text-sm leading-relaxed t-text-secondary mb-4">
								ZONE 2 on the beach is the most extensive — so if you want to go to Lincoln Rd you can park pretty
								close, or Ocean Drive. And when you pay for ParkMobile it is a fraction of the price.
							</p>
							<p class="t-body text-sm leading-relaxed t-text-secondary mb-4">
								As a Miami Beach resident, you can apply for a discounted resident parking permit that gives you
								significant savings on metered street parking throughout Zone 2.
							</p>
							<div class="space-y-2 text-sm">
								<a
									href="https://www.miamibeachfl.gov/city-hall/parking/residents-only/resident-parking-discounts/"
									target="_blank"
									class="t-link underline font-semibold block">
									Resident Parking Discounts Info →
								</a>
								<a
									href="https://cmb.my.site.com/permit/s/"
									target="_blank"
									class="t-link underline font-semibold block">
									Apply Online for Resident Permit →
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- SECTION: RULES & REGULATIONS -->
		<!-- ================================================================ -->
		<section class="t-section-alt py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">{{ sectionNum(6) }}</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Community</span>
					</div>
					<div class="content-main min-w-0 overflow-x-clip">
						<h2 class="t-heading text-2xl md:text-3xl font-normal t-text mb-2">Rules & Regulations</h2>
						<div class="w-10 h-px t-bg-accent mb-4"></div>
						<p class="t-body text-sm leading-relaxed t-text-secondary mb-8">
							Below is a summary of key rules. A full copy of the rules and regulations was provided with your welcome
							packet.
						</p>

						<!-- Unit Usage -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<h3 class="t-heading text-base t-text mb-2">Unit Usage</h3>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>· Maximum of 2 persons per unit (2 adults, or 1 adult and a child)</li>
								<li>· Units may not be used for commercial work where patrons visit</li>
							</ul>
						</div>

						<!-- Pets -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<h3 class="t-heading text-base t-text mb-2">Pets</h3>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>· One pet per unit allowed</li>
								<li>· All pets must have proper documentation and be approved by the board</li>
								<li>· Pets must be leashed at all times and may not use the premises as a bathroom</li>
							</ul>
						</div>

						<!-- Balcony -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<h3 class="t-heading text-base t-text mb-2">Balcony</h3>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>· No decorations on walls or ceilings</li>
								<li>· No storage containers on the balcony</li>
								<li>· Furniture must not be taller than the railing</li>
								<li>
									·
									<strong>No hanging items</strong>
									over the balcony railings — this is a violation
								</li>
							</ul>
						</div>

						<!-- Rentals -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<h3 class="t-heading text-base t-text mb-2">Rentals & Short-Term</h3>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>· All tenants must go through the approval process with required documentation</li>
								<li>
									· Absolutely
									<strong>no Airbnb or short-term rentals</strong>
								</li>
							</ul>
						</div>

						<!-- Bikes -->
						<div class="t-card-flat rounded-none p-6 md:p-7">
							<h3 class="t-heading text-base t-text mb-2">Bikes</h3>
							<ul class="t-body text-sm leading-relaxed t-text-secondary list-none space-y-1">
								<li>· Maximum of 2 bikes per unit on the bike racks</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- SECTION: SWIFTLANE ACCESS CONTROL -->
		<!-- ================================================================ -->
		<section class="t-section py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">{{ sectionNum(7) }}</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Security</span>
					</div>
					<div class="content-main min-w-0 overflow-x-clip">
						<h2 class="t-heading text-2xl md:text-3xl font-normal t-text mb-2">Swiftlane Access Control</h2>
						<div class="w-10 h-px t-bg-accent mb-8"></div>

						<!-- Swiftlane Image -->
						<NuxtImg
							src="6f5f0c1f-1b7f-45ea-9f79-f4c763a7bbbd"
							alt="Swiftlane Access Control Setup"
							class="w-full border t-border mb-4"
							format="png" />

						<p class="t-body text-sm leading-relaxed t-text-secondary mb-4">
							1033 Lenox uses
							<strong>Swiftlane</strong>
							— a facial recognition and mobile access system — for building entry. You will receive an email invitation
							from
							<strong>verification@swiftlane.com</strong>
							to set up your account.
						</p>

						<!-- Quick Setup -->
						<div class="t-bg border-l-3 t-border-accent p-5 md:p-7 mb-4">
							<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-1">Workspace</p>
							<p class="t-heading text-xl font-bold t-text mb-3">1033lenox</p>
							<p class="text-[10px] tracking-[0.15em] uppercase t-text-tertiary mb-2">Quick Setup</p>
							<ol class="t-body text-sm leading-relaxed t-text-secondary list-decimal list-inside space-y-1">
								<li>Download the Swiftlane app from the App Store or Google Play</li>
								<li>
									Enter workspace:
									<strong>1033lenox</strong>
								</li>
								<li>Enter the email from your invite</li>
								<li>Check your email for the verification code</li>
								<li>Enter the code and accept terms</li>
								<li>Optionally set up Face ID and enable Bluetooth</li>
							</ol>
						</div>

						<p class="t-body text-sm italic t-text-tertiary mb-6">
							Facial recognition and visitor passes include a free 30-day trial. After that, the optional subscription
							is $21.99/year per user. PIN and mobile app access are always free.
						</p>

						<!-- CTA Button -->
						<div class="text-center">
							<a
								href="https://www.1033lenox.com/announcements/email/swiftlane-onboarding-guide"
								class="t-btn inline-block px-8 py-3.5 text-xs font-bold tracking-[0.15em] uppercase no-underline">
								Full Setup Guide & Downloads
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- SECTION: GETTING CONNECTED -->
		<!-- ================================================================ -->
		<section class="t-section-alt py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">{{ sectionNum(8) }}</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">
							Getting Started
						</span>
					</div>
					<div class="content-main min-w-0 overflow-x-clip">
						<h2 class="t-heading text-2xl md:text-3xl font-normal t-text mb-2">Getting Connected</h2>
						<div class="w-10 h-px t-bg-accent mb-8"></div>

						<!-- WiFi -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<h3 class="t-heading text-base t-text mb-2">WiFi</h3>
							<p class="t-body text-sm leading-relaxed t-text-secondary">
								You can contact
								<strong>Verizon</strong>
								or
								<strong>Breezeline</strong>
								for your personal WiFi connection.
							</p>
						</div>

						<!-- WhatsApp Group -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<h3 class="t-heading text-base t-text mb-2">WhatsApp Group</h3>
							<p class="t-body text-sm leading-relaxed t-text-secondary">
								You will be added to our building's WhatsApp group, which we use for important updates, announcements,
								and community communication. Please keep an eye out for your invitation.
							</p>
						</div>

						<!-- You're In The System -->
						<div class="t-card-flat rounded-none p-6 md:p-7 mb-3">
							<h3 class="t-heading text-base t-text mb-2">You're in the System</h3>
							<p class="t-body text-sm leading-relaxed t-text-secondary">
								Your information has been entered into our building management system, so you're all set from an
								administrative standpoint. You will receive emails with community updates, announcements, and more.
							</p>
						</div>

						<!-- Stay in Touch -->
						<div class="t-card-flat rounded-none p-6 md:p-7">
							<h3 class="t-heading text-base t-text mb-2">Stay in Touch</h3>
							<p class="t-body text-sm leading-relaxed t-text-secondary">
								The Board is here to help. If you ever have questions, concerns, or need assistance with anything
								related to the building, please don't hesitate to reach out to us directly.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ================================================================ -->
		<!-- CONTACT & FOOTER -->
		<!-- ================================================================ -->
		<section class="t-section py-12 md:py-16 px-6">
			<div class="max-w-2xl mx-auto text-center">
				<p class="text-[10px] tracking-[0.3em] uppercase t-text-accent mb-4">Questions?</p>
				<p class="t-body text-sm leading-relaxed t-text-secondary mb-2">
					For any questions, concerns, or to update your information, please contact management:
				</p>
				<a href="mailto:lenoxplazaboard@gmail.com" class="t-link underline text-sm">lenoxplazaboard@gmail.com</a>

				<!-- Board Signature -->
				<div class="w-full h-px t-divider-bg my-8"></div>
				<p class="t-heading text-sm t-text text-left">
					Sincerely,
					<br />
					Lenox Plaza Association Board of Directors
				</p>

				<!-- Board Members -->
				<div class="grid grid-cols-2 gap-x-4 gap-y-3 mt-6 text-left">
					<div>
						<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text">Camila Hoffman</p>
						<p class="text-[8px] tracking-[0.1em] uppercase t-text-tertiary">President</p>
					</div>
					<div>
						<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text">Alejandro Salinas</p>
						<p class="text-[8px] tracking-[0.1em] uppercase t-text-tertiary">Vice-President</p>
					</div>
					<div>
						<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text">Peter Wyatt</p>
						<p class="text-[8px] tracking-[0.1em] uppercase t-text-tertiary">Secretary</p>
					</div>
					<div>
						<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text">Nenad Rakita</p>
						<p class="text-[8px] tracking-[0.1em] uppercase t-text-tertiary">Treasurer</p>
					</div>
					<div>
						<p class="text-[10px] font-bold tracking-[0.15em] uppercase t-text">Nidia Cortes</p>
						<p class="text-[8px] tracking-[0.1em] uppercase t-text-tertiary">Board Member</p>
					</div>
				</div>

				<!-- Footer Links -->
				<div class="w-full h-px t-divider-bg mt-8 mb-6"></div>
				<!-- <div class="flex items-center justify-center gap-8 mb-4">
					<a href="https://1033lenox.com" class="text-[10px] font-bold tracking-[0.3em] t-text no-underline">
						1033LENOX.COM
					</a>
					<a href="tel:786-395-3049" class="text-[10px] font-bold tracking-[0.3em] t-text no-underline">786.395.3049</a>
				</div>
				<p class="text-[8px] font-bold tracking-[0.3em] t-text-muted">&copy; 2026 LENOX PLAZA ASSOCIATION INC.</p>

				
				<div class="mt-8">
					<a href="https://1033lenox.com" target="_blank">
						<NuxtImg
							src="22f2b886-0804-4fa4-9661-27da9d2ce6a6"
							alt="1033 Lenox Ave Building"
							class="mx-auto w-48 md:w-56"
							format="png" />
					</a>
				</div> -->
			</div>
		</section>
	</div>
</template>

<style scoped>
.border-l-3 {
	border-left-width: 3px;
	border-left-style: solid;
}

/* Sticky content labels on large screens */
.content-label {
	@media (min-width: theme('screens.lg')) {
		position: sticky;
		top: 8rem;
		align-self: start;
		height: fit-content;
	}
}
</style>
