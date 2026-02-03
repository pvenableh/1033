<template>
	<div class="sell-sheet t-bg min-h-screen">
		<!-- Hero Section -->
		<section ref="heroRef" class="hero min-h-screen flex flex-col justify-center items-center relative px-6">
			<!-- Widgets wrapper -->
			<div class="hero-widget-wrapper absolute z-20 opacity-0 hero-widgets bottom-32 left-0 right-0 lg:bottom-20 mb-4">
				<!-- Mobile: Text-only greeting -->
				<div class="lg:hidden mb-2 pl-4">
					<WidgetsGreeting :name="user?.first_name" guestGreeting="Welcome" :showDate="false" :textOnly="true" />
				</div>

				<!-- Desktop only: Glass greeting above widgets -->
				<div class="hidden lg:block pl-6 mb-1">
					<WidgetsGreeting :name="user?.first_name" guestGreeting="Welcome" :showDate="false" />
				</div>

				<!-- Scrollable widget container -->
				<div class="widget-container widget-container--responsive pl-4 lg:pl-6">
					<WidgetsWeather variant="standard" :compact="true" :showLocation="true" />

					<!-- Mobile: compact location widget -->
					<WidgetsLocation variant="standard" :compact="true" :maxLocations="2" class="lg:hidden" />
					<!-- Medium+: narrow location widget (single column, keeps widget compact) -->
					<WidgetsLocation variant="narrow" :compact="false" :maxLocations="4" class="hidden lg:flex" />
					<WidgetsAnnouncements variant="standard" :compact="true" />
					<WidgetsBuilding variant="standard" :compact="true" />
				</div>
			</div>

			<!-- Hero Background Image -->
			<div class="fixed inset-0 z-0 hero-bg-container">
				<div
					class="hero-image w-full h-full flex items-center justify-center opacity-0"
					style="
						background-image: url('https://admin.1033lenox.com/assets/42b3290e-063e-4412-bf1c-a083498d1887?key=xlarge');
						background-size: cover;
						background-position: center 20%;
					">
					<!-- <div class="text-center p-8 max-w-lg hidden">
						<div class="w-16 h-16 mx-auto mb-4 border-2 border-gray-400 rounded-full flex items-center justify-center">
							<UIcon name="i-heroicons-photo" class="w-8 h-8 t-text-muted" />
						</div>
						<p class="text-sm t-text-tertiary font-medium mb-2">HERO IMAGE</p>
						<p class="text-xs t-text-muted leading-relaxed">
							Suggested: Twilight exterior shot of 1033 Lenox showing the white stucco facade, black steel railings, and
							palm trees. Warm interior lights glowing from units. Alternatively: Wide shot of the tree-lined street
							with the building as focal point.
						</p>
					</div> -->
				</div>
				<div class="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40"></div>
			</div>

			<div class="hero-content text-center relative z-10 lg:-mt-32">
				<p
					class="-mt-44 lg:mt-0 hero-address text-xs tracking-[0.3em] lg:tracking-[0.6em] uppercase mb-6 lg:mb-12 opacity-0 text-cream-alt">
					Miami Beach · Flamingo Park
				</p>
				<h1 class="sr-only">1033 Lenox — Boutique Condo and Apartment Building in Miami Beach</h1>
				<NewLogo
					class="hero-title mx-auto mb-6 backdrop:lg:mb-8 opacity-0 w-52 sm:w-72 md:w-[375px] lg:w-[425px] xl:w-[525px]"
					fill="#ffffff"
					stroke="#ffffff"
					aria-hidden="true" />
				<div class="hero-divider w-16 h-px t-bg-accent mx-auto mb-4 lg:mb-8 opacity-0 scale-x-0"></div>
				<p class="hero-tagline t-heading text-[clamp(1.125rem,2.5vw,2rem)] italic font-light text-cream-alt opacity-0">
					The Smart Life in South Beach
				</p>
			</div>
			<div
				class="hidden absolute bottom-16 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-0 scroll-indicator z-10">
				<span class="text-[0.625rem] tracking-[0.2em] uppercase t-text-tertiary">Scroll to discover</span>
				<div class="w-px h-10 bg-gradient-to-b from-gold to-transparent scroll-line"></div>
			</div>
		</section>

		<!-- Intro Section -->
		<section ref="introRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-section-alt">
			<div class="max-w-6xl mx-auto text-left">
				<h2
					class="intro-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
					Boutique Living
				</h2>
				<p
					class="intro-text t-body text-[clamp(1.0625rem,3vw,1.35rem)] leading-relaxed font-light t-text text-left t-text-secondary mb-16 opacity-0">
					1033 Lenox is a 28-unit boutique residence in the heart of Miami Beach's Flamingo Park neighborhood.
					One-bedrooms only. Oversized balconies. No crowded hallways, no lobby lines—just smart, private living for
					those who know the difference.
				</p>

				<!-- Intro Image Grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 intro-images">
					<div
						class="aspect-[4/3] flex items-end justify-end opacity-0 intro-image bg-cover bg-center bg-no-repeat bg-black/30 bg-blend-darken"
						style="
							background-image: url('https://admin.1033lenox.com/assets/e5733a3c-3572-40f3-8142-5bc0bc1d11f2?key=large');
						">
						<div class="text-left p-6">
							<!-- <div class="w-12 h-12 mx-auto mb-3 border-2 border-cream rounded-full flex items-center justify-center">
								<UIcon name="i-heroicons-photo" class="w-6 h-6 text-cream" />
							</div> -->
							<p class="text-sm text-cream font-medium mb-2">COURTYARD VIEW</p>
							<p class="text-xs text-cream-alt leading-relaxed">
								Central courtyard with mature palm trees, dappled sunlight, and open-air breezeways. Intimate community
								feel.
							</p>
						</div>
					</div>
					<div
						class="aspect-[4/3] flex items-end justify-end opacity-0 intro-image bg-contain bg-center bg-no-repeat bg-black/30 bg-blend-darken"
						style="
							background-image: url('https://admin.1033lenox.com/assets/96694a83-b515-429c-83f5-98ed197f79de?key=large');
						">
						<div class="text-left p-6">
							<!-- <div class="w-12 h-12 mx-auto mb-3 border-2 border-cream rounded-full flex items-center justify-center">
								<UIcon name="i-heroicons-photo" class="w-6 h-6 text-cream" />
							</div> -->
							<p class="text-sm text-cream font-medium mb-2">BALCONY LIFESTYLE</p>
							<p class="text-xs text-cream-alt leading-relaxed">
								5' x 20' balcony for outdoor furniture, plants, and morning coffee. Generous depth and livable outdoor
								space.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Anti High-Rise Section -->
		<section ref="antiHighriseRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">01</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Philosophy</span>
					</div>
					<div class="content-main min-w-0 overflow-hidden">
						<div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12">
							<div class="max-w-xl">
								<h2
									class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
									The Anti-High-Rise
								</h2>
								<p class="section-body text-[1.0625rem] leading-relaxed t-text-secondary mb-8 opacity-0">
									Skip the elevator lines, the endless hallways, and the anonymous lobby. 1033 Lenox offers what the
									towers can't—an intimate, design-forward residence in the heart of South Beach where you actually know
									your neighbors.
								</p>
								<p
									class="section-tagline t-heading text-lg italic t-text-accent-tertiary pt-8 border-t t-border-divider opacity-0">
									Boutique scale. Big beach lifestyle.
								</p>
							</div>
							<div
								class="aspect-[3/4] flex items-end justify-end opacity-0 section-image bg-contain bg-center bg-no-repeat bg-black/30 bg-blend-darken"
								style="
									background-image: url('https://admin.1033lenox.com/assets/d4c23c5a-f15f-4d76-9afc-4cddd20eecca?key=large');
								">
								<div class="w-full text-left p-6">
									<!-- <div
										class="w-12 h-12 mx-auto mb-3 border-2 border-cream rounded-full flex items-center justify-center">
										<UIcon name="i-heroicons-photo" class="w-6 h-6 text-cream" />
									</div> -->
									<p class="text-sm text-cream font-medium mb-2 uppercase">Immediate Access to air</p>
									<p class="text-xs text-cream-alt leading-relaxed">
										Open-air breezeway with bright white against clear blue sky. Light, air, and simplicity.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Location Section -->
		<section ref="locationRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg-alt">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">02</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Location</span>
					</div>
					<div class="content-main max-w-4xl min-w-0 overflow-hidden">
						<h2
							class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Coveted Location
						</h2>
						<p class="section-body text-[1.0625rem] leading-relaxed t-text-secondary mb-8 opacity-0">
							Nestled on a tree-lined street in one of SoBe's most desirable residential pockets—walkable to everything,
							removed from nothing.
						</p>

						<!-- Location Image -->
						<div
							class="aspect-[21/12] flex items-end justify-start mb-8 opacity-0 section-image bg-cover bg-no-repeat bg-black/30 bg-blend-darken"
							style="
								background-image: url('https://admin.1033lenox.com/assets/41765099-b2fa-4ddd-abe7-8f328f43e085?key=large');
								background-position: center -80px;
							">
							<div class="text-left p-6">
								<!-- <div
									class="w-12 h-12 mx-auto mb-3 border-2 border-gray-400 rounded-full flex items-center justify-center">
									<UIcon name="i-heroicons-map" class="w-6 h-6 t-text-muted" />
								</div> -->
								<p class="text-sm text-cream font-medium mb-2">NEIGHBORHOOD MEET BEACH</p>
								<p class="text-xs text-cream-alt leading-relaxed max-w-md mx-auto">
									Historic neighborhood charm meets coastal living. Tree-lined residential streets just blocks from the
									beach, bay, Linocln Road and Ocean Drive.
								</p>
							</div>
						</div>

						<div
							class="walk-times grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 py-12 my-8 border-y t-border-divider">
							<div v-for="(item, index) in walkTimes" :key="index" class="walk-item text-center opacity-0">
								<span class="t-heading text-5xl font-light leading-none block t-text">{{ item.minutes }}</span>
								<span class="text-xs tracking-wide uppercase t-text-accent-tertiary block mb-1">min</span>
								<span class="text-sm t-text-tertiary block">{{ item.destination }}</span>
							</div>
						</div>

						<!-- Location Detail Images -->
						<!-- <div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
							<div
								v-for="(loc, index) in locationImages"
								:key="index"
								class="aspect-square t-bg-subtle flex items-center justify-center opacity-0 location-image">
								<div class="text-center p-3">
									<UIcon :name="loc.icon" class="w-6 h-6 t-text-muted mx-auto mb-2" />
									<p class="text-xs t-text-tertiary font-medium">{{ loc.title }}</p>
									<p class="text-[10px] t-text-muted mt-1">{{ loc.desc }}</p>
								</div>
							</div>
						</div> -->
						<!-- Lifestyle Gallery Section -->

						<div ref="galleryRef" class="max-w-6xl mx-auto">
							<div class="text-left mb-12">
								<p class="text-xs tracking-[0.3em] uppercase t-text-tertiary mb-4 opacity-0 gallery-label">
									The Flamingo Park Lifestyle
								</p>
								<h2 class="t-heading text-[clamp(1.75rem,4vw,2.5rem)] font-normal t-text opacity-0 gallery-title">
									Active Living, Steps Away
								</h2>
							</div>

							<!-- Mobile: 2 column grid -->
							<div class="grid grid-cols-2 gap-4 md:hidden">
								<div
									v-for="(item, index) in lifestyleImages"
									:key="index"
									class="aspect-square bg-black/30 bg-blend-darken flex items-center justify-center opacity-0 gallery-image bg-cover bg-center"
									:style="item.image ? `background-image: url('${item.image}');` : ''">
									<div class="text-center p-4">
										<UIcon :name="item.icon" class="w-8 h-8 text-cream mx-auto mb-2" />
										<p class="text-xs text-cream font-medium mb-1">{{ item.title }}</p>
										<p class="text-[10px] text-cream-alt">{{ item.desc }}</p>
									</div>
								</div>
							</div>
							<!-- Medium+: Marquee component -->
							<div class="hidden md:block overflow-hidden">
								<Marquee
									:images="
										lifestyleImages.map((item) => ({
											src: item.image,
											alt: item.title,
											caption: item.title,
											description: item.desc,
										}))
									"
									:pause-on-hover="true"
									direction="left"
									:speed="60"
									:image-height="280"
									:gap="8"
									:show-captions="true" />
							</div>
						</div>

						<p
							class="section-tagline t-heading text-lg italic t-text-accent-tertiary pt-8 border-t t-border-divider opacity-0">
							Leave the car. Live the neighborhood.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Design Section -->
		<section ref="designRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">03</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Design</span>
					</div>
					<div class="content-main max-w-4xl min-w-0 overflow-hidden">
						<h2
							class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Thoughtfully Designed
						</h2>

						<!-- Design Image Grid -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
							<div
								class="aspect-[4/5] flex items-center justify-center opacity-0 section-image bg-cover bg-no-repeat bg-blend-darken"
								style="
									background-image: url('https://admin.1033lenox.com/assets/09f44cd5-f438-4d71-a546-7541c5fdad99?key=large');
								">
								<div class="text-center p-4">
									<!-- <UIcon name="i-heroicons-photo" class="w-6 h-6 t-text-muted mx-auto mb-2" /> -->
									<!-- <p class="text-xs t-text-tertiary font-medium mb-1">EXTERIOR DETAIL</p>
									<p class="text-[10px] t-text-muted">
										Black steel railing detail against white stucco. Clean modernist lines.
									</p> -->
								</div>
							</div>
							<div
								class="aspect-[10/6.1] flex items-center justify-center opacity-0 section-image md:col-span-2 bg-cover bg-no-repeat bg-blend-darken bg-center"
								style="
									background-image: url('https://admin.1033lenox.com/assets/a1a81a1b-cc26-46cf-a09b-c58438498731?key=large');
								">
								<div class="text-center p-4">
									<!-- <UIcon name="i-heroicons-photo" class="w-6 h-6 t-text-muted mx-auto mb-2" /> -->
									<!-- <p class="text-xs t-text-tertiary font-medium mb-1">INTERIOR LIVING SPACE</p>
									<p class="text-[10px] t-text-muted">
										Bright, modern 1BR interior showing open layout, natural light flooding in from balcony doors.
										Staged with sophisticated, minimal furnishings.
									</p> -->
								</div>
							</div>
						</div>

						<div class="feature-grid grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
							<div
								v-for="(feature, index) in designFeatures"
								:key="index"
								:class="['feature-item flex gap-4 items-start opacity-0', feature.wide ? 'sm:col-span-2' : '']">
								<div class="feature-icon w-6 h-6 flex-shrink-0 t-text-accent-tertiary">
									<UIcon :name="feature.icon" class="w-6 h-6" />
								</div>
								<p class="text-[0.9375rem] leading-relaxed t-text-secondary">{{ feature.text }}</p>
							</div>
						</div>

						<p
							class="section-tagline t-heading text-lg italic t-text-accent-tertiary pt-8 border-t t-border-divider opacity-0">
							Boutique scale. Architectural edge.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Turnkey Section -->
		<section ref="turnkeyRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg-alt">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">04</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Investment</span>
					</div>
					<div class="content-main max-w-4xl min-w-0 overflow-hidden">
						<h2
							class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-4 opacity-0">
							All New
						</h2>
						<p class="section-subtitle text-sm tracking-[0.15em] uppercase t-text-accent-tertiary mb-8 opacity-0">
							Fully Renovated — Turnkey
						</p>
						<p class="section-body text-[1.0625rem] leading-relaxed t-text-secondary mb-8 opacity-0">
							40-year recertification complete. No looming assessments. No deferred maintenance. Just move in.
						</p>

						<!-- Renovation Before/After or Detail Images -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
							<div class="aspect-square t-bg-subtle flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-3">
									<UIcon name="i-heroicons-window" class="w-6 h-6 t-text-muted mx-auto mb-2" />
									<p class="text-[10px] t-text-tertiary font-medium">IMPACT WINDOWS</p>
									<p class="text-[9px] t-text-muted">Hurricane-rated</p>
								</div>
							</div>
							<div class="aspect-square t-bg-subtle flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-3">
									<UIcon name="i-heroicons-bolt" class="w-6 h-6 t-text-muted mx-auto mb-2" />
									<p class="text-[10px] t-text-tertiary font-medium">ELECTRICAL</p>
									<p class="text-[9px] t-text-muted">Complete upgrade</p>
								</div>
							</div>
							<div class="aspect-square t-bg-subtle flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-3">
									<UIcon name="i-heroicons-home-modern" class="w-6 h-6 t-text-muted mx-auto mb-2" />
									<p class="text-[10px] t-text-tertiary font-medium">NEW ROOF</p>
									<p class="text-[9px] t-text-muted">2024 installation</p>
								</div>
							</div>
							<div class="aspect-square t-bg-subtle flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-3">
									<UIcon name="i-heroicons-arrows-up-down" class="w-6 h-6 t-text-muted mx-auto mb-2" />
									<p class="text-[10px] t-text-tertiary font-medium">ELEVATOR</p>
									<p class="text-[9px] t-text-muted">New cab interior</p>
								</div>
							</div>
						</div>

						<div class="improvements bg-white/80 dark:bg-[var(--theme-bg-tertiary)] p-6 my-8 opacity-0">
							<p class="text-xs tracking-[0.15em] uppercase t-text-accent-tertiary mb-4">Recent Capital Improvements</p>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
								<span
									v-for="(item, index) in improvements"
									:key="index"
									class="text-[0.9375rem] t-text-secondary py-2 border-b t-border-divider">
									{{ item }}
								</span>
							</div>
						</div>

						<p
							class="section-tagline t-heading text-lg italic t-text-accent-tertiary pt-8 border-t t-border-divider opacity-0">
							This is rare: a boutique SoBe building with the hard work behind it.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Security Section -->
		<section ref="securityRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">05</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Security</span>
					</div>
					<div class="content-main min-w-0 overflow-hidden">
						<div class="grid grid-cols-1 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12">
							<div class="max-w-xl">
								<h2
									class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
									Secure & Connected
								</h2>

								<div class="security-features flex flex-col gap-0 my-8">
									<div
										v-for="(feature, index) in securityFeatures"
										:key="index"
										class="security-item flex items-center gap-4 py-4 border-b t-border-divider opacity-0">
										<div class="security-icon w-5 h-5 flex-shrink-0 t-text-accent-tertiary">
											<UIcon :name="feature.icon" class="w-5 h-5" />
										</div>
										<span class="text-[0.9375rem] t-text-secondary">{{ feature.text }}</span>
									</div>
								</div>

								<p class="section-tagline t-heading text-lg italic t-text-accent-tertiary pt-8 opacity-0">
									Peace of mind, built in.
								</p>
							</div>
							<div
								class="aspect-[3/4] lg:aspect-video bg-black/30 bg-blend-darken bg-cover bg-no-repeat flex items-end justify-start opacity-0 section-image"
								style="
									background-image: url('https://admin.1033lenox.com/assets/6f5f0c1f-1b7f-45ea-9f79-f4c763a7bbbd?key=large');
								">
								<div class="text-left p-6">
									<!-- <div
										class="w-12 h-12 mx-auto mb-3 border-2 border-cream rounded-full flex items-center justify-center">
										<UIcon name="i-heroicons-finger-print" class="w-6 h-6 text-cream" />
									</div> -->
									<p class="text-sm text-cream font-medium mb-2">ENTRY SYSTEM</p>
									<p class="text-xs text-cream-alt leading-relaxed">
										Sleek Swiftlane facial recognition entry panel at the main gate. Modern, unobtrusive, and secure.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
		<section ref="investmentRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg-alt">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">06</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Value</span>
					</div>
					<div class="content-main max-w-2xl min-w-0 overflow-hidden">
						<h2
							class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Smart Investment
						</h2>

						<div class="investment-points flex flex-col gap-4 my-8">
							<p
								v-for="(point, index) in investmentPoints"
								:key="index"
								class="text-base t-text-secondary pl-8 relative opacity-0 investment-point">
								<span class="absolute left-0 top-2 w-1.5 h-1.5 t-bg-accent rounded-full"></span>
								{{ point }}
							</p>
						</div>

						<p
							class="section-tagline t-heading text-lg italic t-text-accent-tertiary pt-8 border-t t-border-divider opacity-0">
							The numbers make sense. So does the lifestyle.
						</p>
					</div>
				</div>
			</div>
		</section>
		<!-- Amenities Section -->
		<section ref="amenitiesRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">07</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Amenities</span>
					</div>
					<div class="content-main max-w-4xl min-w-0 overflow-hidden">
						<h2
							class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Amenities With Intention
						</h2>

						<!-- Amenities Image -->
						<div
							class="aspect-[16/9] flex items-end justify-start mb-8 opacity-0 bg-black/20 bg-blend-darken bg-cover bg-no-repeat bg-center section-image"
							style="
								background-image: url('https://admin.1033lenox.com/assets/59989d04-a7ec-4621-9f83-6343a6d42057?key=large');
							">
							<div class="text-left p-6">
								<!-- <div
									class="w-12 h-12 mx-auto mb-3 border-2 border-gray-400 rounded-full flex items-center justify-center">
									<UIcon name="i-heroicons-sun" class="w-6 h-6 t-text-muted" />
								</div> -->
								<p class="text-sm text-cream font-medium mb-2">COURTYARD & GROUNDS</p>
								<p class="text-xs text-cream-alt leading-relaxed max-w-md mx-auto">
									Sunlit central courtyard with palm trees, upgraded elevator, and plenty of outdoor space.
								</p>
							</div>
						</div>

						<div class="amenities-list grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 my-8">
							<div
								v-for="(amenity, index) in amenities"
								:key="index"
								class="amenity-item flex items-center gap-4 py-3 opacity-0">
								<span class="w-1.5 h-1.5 t-bg-accent rounded-full flex-shrink-0"></span>
								<span class="text-[0.9375rem] t-text-secondary">{{ amenity }}</span>
							</div>
						</div>

						<p
							class="section-tagline t-heading text-lg italic t-text-accent-tertiary pt-8 border-t t-border-divider opacity-0">
							Everything you need. Nothing you don't.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Community Engagement Section -->
		<section ref="communityRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg-alt">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">08</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">Community</span>
					</div>
					<div class="content-main max-w-4xl min-w-0 overflow-hidden">
						<h2
							class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Shape What's Next
						</h2>
						<p class="section-body text-[1.0625rem] leading-relaxed t-text-secondary mb-8 opacity-0">
							Our shared spaces are ready for reimagining. For the right residents—those with vision, expertise, and the
							desire to leave their mark—this is an opportunity to help craft something exceptional.
						</p>

						<div class="community-spaces grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
							<div
								v-for="(space, index) in communitySpaces"
								:key="index"
								class="community-space-item p-6 t-bg-subtle opacity-0">
								<div class="flex items-start gap-4">
									<div class="community-icon w-8 h-8 flex-shrink-0 t-text-accent-tertiary">
										<UIcon :name="space.icon" class="w-8 h-8" />
									</div>
									<div>
										<p class="text-sm font-medium t-text mb-2">{{ space.name }}</p>
										<p class="text-[0.875rem] leading-relaxed t-text-secondary">{{ space.vision }}</p>
									</div>
								</div>
							</div>
						</div>

						<div class="community-cta t-bg-subtle p-6 my-8 opacity-0">
							<p class="text-sm tracking-[0.15em] uppercase t-text-accent-tertiary mb-4">Get Involved</p>
							<p class="text-[0.9375rem] t-text-secondary leading-relaxed">
								We welcome professionals who value a local, active lifestyle and want to contribute to building a more
								thoughtful community. Your energy and vision could help shape spaces that serve residents for decades to
								come.
							</p>
						</div>

						<p
							class="section-tagline t-heading text-lg italic t-text-accent-tertiary pt-8 border-t t-border-divider opacity-0">
							The canvas is ready. The community awaits.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Pet Section -->
		<!-- <section ref="petsRef" class="section py-24 lg:py-32 px-6 lg:px-16 bg-cream">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm t-text-accent">07</span>
						<span class="text-xs tracking-wider uppercase t-text-tertiary">Fun Friends</span>
					</div>
					<div class="content-main max-w-4xl min-w-0 overflow-hidden">
						<div class="max-w-2xl mx-auto">
							<div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
								<div class="text-center md:text-left">
									<h3 class="pet-title t-heading text-2xl font-normal mb-4 opacity-0">Pet Friendly</h3>
									<p class="pet-policy text-base t-text-secondary mb-4 opacity-0">One approved pet per residence</p>
									<p class="pet-tagline t-heading italic t-text-accent-tertiary opacity-0">
										Because the best roommates wear fur.
									</p>
								</div>
								<div
									class="w-32 h-32 bg-black/30 bg-blend-darken bg-cover bg-center bg-no-repeat rounded-full flex items-center justify-center opacity-0 section-image mx-auto md:mx-0"
									style="
										background-image: url('https://admin.1033lenox.com/assets/e01de531-5ace-45e6-921b-c5edf494a810?key=medium');
									">
									<div class="text-center p-2">
										<UIcon name="i-heroicons-heart" class="w-8 h-8 text-cream mx-auto mb-1" />
										<p class="text-[9px] text-cream">Happy dog. Happy life.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section> -->

		<!-- Investment Section -->

		<!-- FAQ Section -->
		<section ref="faqRef" class="section py-24 lg:py-32 px-6 lg:px-16 t-bg">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="t-heading text-sm lg:text-[26px] lg:leading-6 t-text-accent">09</span>
						<span class="text-xs lg:text-sm lg:leading-3 tracking-wider uppercase t-text-tertiary">FAQ</span>
					</div>
					<div class="content-main max-w-4xl min-w-0 overflow-hidden">
						<h2
							class="section-title t-heading text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Common Questions
						</h2>
						<div class="faq-list flex flex-col gap-0">
							<details
								v-for="(faq, index) in faqs"
								:key="index"
								class="faq-item border-b t-border-divider opacity-0 group">
								<summary
									class="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
									<span class="text-[0.9375rem] font-medium t-text">{{ faq.question }}</span>
									<UIcon
										name="i-heroicons-chevron-down"
										class="w-5 h-5 t-text-tertiary flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
								</summary>
								<p class="text-[0.9375rem] leading-relaxed t-text-secondary pb-5 pl-0">
									{{ faq.answer }}
								</p>
							</details>
						</div>
					</div>
				</div>
			</div>
		</section>

		<AvailableListings />
		<Marquee
			v-if="marqueeImages.length"
			:images="marqueeImages"
			:pause-on-hover="false"
			direction="left"
			:speed="100"
			:image-height="250"
			:gap="2" />
		<!-- CTA Section -->
		<section ref="ctaRef" class="section relative py-32 lg:py-40 px-6 lg:px-16 bg-gray-900 text-cream overflow-hidden">
			<!-- CTA Background Image -->
			<div
				class="absolute inset-0 z-0 opacity-30 bg-black/30 bg-blend-darken bg-cover bg-center bg-no-repeat flex items-center justify-center"
				style="
					background-image: url('https://admin.1033lenox.com/assets/77698749-5fbf-4bbd-8e40-210b672a56e6?key=large');
				">
				<!-- <div class="w-full h-full bg-gray-700 flex items-center justify-center">
					<div class="text-center p-8">
						<UIcon name="i-heroicons-photo" class="w-12 h-12 t-text-tertiary mx-auto mb-3" />
						<p class="text-xs t-text-muted">
							Evening/twilight exterior with warm window glow. Or: Beach sunset with building silhouette.
						</p>
					</div>
				</div> -->
			</div>

			<div class="max-w-3xl mx-auto text-center relative z-10">
				<h2 class="cta-headline t-heading text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight mb-8 opacity-0">
					This Isn't Condo Living.
					<br />
					It's a Lifestyle Upgrade.
				</h2>
				<p class="cta-body text-[1.0625rem] leading-relaxed text-cream mb-12 opacity-0">
					For the discerning buyer who values character over square footage, community over anonymity, and smart design
					over status symbols—welcome home.
				</p>
				<div class="cta-divider w-16 h-px t-bg-accent mx-auto mb-12 opacity-0 scale-x-0"></div>
				<p class="cta-address text-sm tracking-wide text-cream-alt opacity-0 mb-12 uppercase">
					1033 Lenox Avenue · Miami Beach, FL 33139
				</p>
				<LayoutBottomSheet
					max-width="max-w-none"
					max-height="max-h-[80vh]"
					content-class="px-4 py-4"
					:show-handle="true"
					:close-on-click-outside="true"
					:swipe-threshold="30">
					<!-- Custom trigger button -->
					<template #trigger="{toggle}">
						<FormVButton type="submit" variant="outline" @click="toggle">Submit Inquiry</FormVButton>
					</template>

					<!-- Main content -->
					<div>
						<Inquiry />
					</div>
				</LayoutBottomSheet>
			</div>
		</section>
	</div>
</template>

<script setup>
import {ref, onMounted, onUnmounted} from 'vue';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

import {readSingleton} from '~/composables/useDirectusItems';

const {user} = useDirectusAuth();
const {getImageUrl} = useDirectusFiles();

// Fetch the features singleton with the featured_images relation
const {data: features} = await useAsyncData('features', () =>
	readSingleton('features', {
		fields: ['featured_images.directus_files_id', 'featured_images.sort_new'],
	})
);

// Transform to array of image URLs sorted by sort_new
const marqueeImages = computed(() => {
	if (!features.value?.featured_images) return [];

	return features.value.featured_images
		.slice() // create a copy to avoid mutating original
		.sort((a, b) => (a.sort_new ?? 999) - (b.sort_new ?? 999))
		.map((item) => ({
			src: getImageUrl(item.directus_files_id, {
				height: 300,
				format: 'webp',
				quality: 80,
			}),
			alt: `Featured image ${item.sort_new}`,
		}));
});

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Section refs
const heroRef = ref(null);
const introRef = ref(null);
const antiHighriseRef = ref(null);
const locationRef = ref(null);
const designRef = ref(null);
const turnkeyRef = ref(null);
const securityRef = ref(null);
const amenitiesRef = ref(null);
const investmentRef = ref(null);
const communityRef = ref(null);
const petsRef = ref(null);
const faqRef = ref(null);
const galleryRef = ref(null);
const ctaRef = ref(null);

// Data
const walkTimes = [
	{minutes: '6', destination: 'to the Ocean'},
	{minutes: '2', destination: 'to the Bay'},
	{minutes: '1', destination: 'to Whole Foods'},
	{minutes: '1', destination: 'to Flamingo Park'},
	{minutes: '7', destination: 'to Lincoln Road'},
	{minutes: '5', destination: 'to Ocean Drive'},
];

const locationImages = [
	{icon: 'i-heroicons-sun', title: 'BEACH', desc: 'Ocean access'},
	{icon: 'i-heroicons-building-storefront', title: 'WHOLE FOODS', desc: '1 block'},
	{icon: 'i-heroicons-ticket', title: 'FLAMINGO PARK', desc: 'Track & courts'},
	{icon: 'i-heroicons-shopping-bag', title: 'LINCOLN ROAD', desc: 'Dining & shops'},
	{icon: 'i-heroicons-sparkles', title: 'OCEAN DRIVE', desc: 'Dining & Nightlife'},
];

const designFeatures = [
	{icon: 'i-heroicons-building-office-2', text: '28 residences—an exclusive, owner-focused community'},
	{icon: 'i-heroicons-home', text: 'Spacious 1BR / 1-2 BA floorplans'},
	{icon: 'i-heroicons-view-columns', text: 'Expansive private balconies with modern black steel railings'},
	{icon: 'i-heroicons-sun', text: 'Open-air breezeways framed by crisp white stucco and blue sky'},
	{
		icon: 'i-heroicons-squares-2x2',
		text: 'Subtropical modernist design with Mediterranean sensibility—clean lines, courtyard-centered layout, light, air, and community',
		wide: true,
	},
];

const improvements = [
	'Complete concrete restoration',
	'Complete electrical infrastructure',
	'Hurricane-impact windows & doors',
	'New roof',
	'New elevator cab',
	'Modern railings & exterior finishes',
	'New garage and asphalt',
	'New security systems',
	'New access control',
	'New laundry facilities',
	'New gates (early 2026)',
];

const securityFeatures = [
	{icon: 'i-heroicons-face-smile', text: 'Facial recognition entry system'},
	{icon: 'i-heroicons-video-camera', text: 'Building-wide camera coverage including elevator'},
	{icon: 'i-heroicons-light-bulb', text: 'Well-lit walkways and secured garage'},
	{icon: 'i-heroicons-bell-alert', text: 'Doorbell cameras on 98% of residences'},
	{
		icon: 'i-heroicons-device-tablet',
		text: 'Owner/resident portal for real-time documents, financials, and communications',
	},
];

const amenities = [
	'Sunlit central courtyard with palm trees',
	'Upgraded elevator',
	'Clubhouse',
	'On-site laundry',
	'Storage room',
	'Bike rack',
	'Deeded garage parking (1 space per residence)',
	'Beautiful front yards',
];

const investmentPoints = [
	'Competitively priced insurance',
	'Flood Insurance coverage',
	'Fully hurricane-certified',
	'Reasonably priced HOA for Miami Beach',
	'Transparent financials via owner portal',
];

const lifestyleImages = [
	{
		icon: 'i-heroicons-sun',
		title: 'BEACH MORNING',
		desc: 'Sunrise run on the sand',
		image: 'https://admin.1033lenox.com/assets/2713f5c4-2799-41b5-bf4c-fac49c1e002c?key=large',
	},
	{
		icon: 'i-heroicons-heart',
		title: 'FLAMINGO PARK',
		desc: 'Tennis, track, outdoor gyms',
		image: 'https://admin.1033lenox.com/assets/5a4cdbe6-01e9-4aff-b4ef-fb109012ce95?key=large',
	},
	{
		icon: 'i-heroicons-shopping-bag',
		title: 'LINCOLN ROAD',
		desc: 'Weekend brunch & shopping',
		image: 'https://admin.1033lenox.com/assets/ac56a2bd-27ca-4621-a262-2685fca8b88f?key=large',
	},
	{
		icon: 'i-heroicons-sparkles',
		title: 'BAY SUNSET',
		desc: 'Evening walks on the bay',
		image: 'https://admin.1033lenox.com/assets/29f0d3b2-9120-4db8-877f-8406b26cb43e?key=large',
	},
	{
		icon: 'i-lucide-apple',
		title: 'WHOLE FOODS',
		desc: 'Daily groceries, 1 block',
		image: 'https://admin.1033lenox.com/assets/fcefe508-24ed-45c7-92ed-9d3fae9f9d75?key=large',
	},
	{
		icon: 'i-lucide-tree-palm',
		title: 'OCEAN DRIVE',
		desc: 'Restaurants & nightlife',
		image: 'https://admin.1033lenox.com/assets/4278842d-e6ac-4ab2-b5fa-d4706632c0bc?key=large',
	},
];

const faqs = [
	{
		question: 'How many units are in the building?',
		answer:
			'1033 Lenox is a boutique 28-unit condominium. All residences are one-bedroom apartments with oversized balconies.',
	},
	{
		question: 'Is parking included?',
		answer: 'Yes. Every residence comes with one deeded garage parking space in the secured parking garage.',
	},
	{
		question: 'Are pets allowed at 1033 Lenox?',
		answer: 'Yes, 1033 Lenox is pet-friendly. One approved pet is allowed per residence.',
	},
	{
		question: 'Has the building passed its 40-year recertification?',
		answer:
			'Almost yes. The 40-year recertification is just about fully complete with no pending assessments or deferred maintenance. The building is turnkey ready.',
	},
	{
		question: 'What security features does the building have?',
		answer:
			'The building features facial recognition entry via Swiftlane, building-wide camera coverage including the elevator, secured and well-lit walkways, and doorbell cameras installed on 98% of residences.',
	},
	{
		question: 'How far is 1033 Lenox from the beach?',
		answer:
			"It's a 6-minute walk to the ocean and a 2-minute walk to the bay. Whole Foods is one block away, and Flamingo Park is one block in the other direction.",
	},
	{
		question: 'Is the building hurricane certified?',
		answer:
			'Yes. 1033 Lenox is fully hurricane-certified with impact windows and doors throughout every unit and in all common areas.',
	},
	{
		question: 'What renovations have been completed?',
		answer:
			'Recent capital improvements include complete concrete restoration, full electrical infrastructure upgrade, hurricane-impact windows and doors, new roof, new elevator cab, modern railings, new garage and asphalt, new security systems, new access control, and new laundry facilities.',
	},
];

const communitySpaces = [
	{
		icon: 'i-heroicons-building-library',
		name: 'The Clubhouse',
		vision:
			'A blank canvas awaiting transformation—envision a modern fitness studio paired with a focused co-working space.',
	},
	{
		icon: 'i-heroicons-archive-box',
		name: 'Storage Evolution',
		vision: 'Climate-controlled personal storage with premium lockers—secure space for what matters.',
	},
	{
		icon: 'i-heroicons-sparkles',
		name: 'Adventure Room',
		vision: 'Dedicated secure storage for bikes, paddle boards, and beach gear—supporting the active lifestyle.',
	},
	{
		icon: 'i-heroicons-sun',
		name: 'Courtyard Revival',
		vision: 'Curated seating areas, lush vegetation, and perhaps a fountain—an urban oasis refined.',
	},
];

// GSAP animations
let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		// Hero animations
		const heroTl = gsap.timeline({delay: 0.3});
		heroTl
			.to('.hero-image', {opacity: 1, duration: 1.2, ease: 'power2.out'})
			.fromTo(
				'.hero-widget-wrapper',
				{opacity: 0, y: 30},
				{opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'},
				'-=0.8'
			)
			.to('.hero-address', {opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'}, '-=0.6')
			.to('.hero-title', {opacity: 1, y: 0, duration: 1, ease: 'power3.out'}, '-=0.4')
			.to('.hero-divider', {opacity: 1, scaleX: 1, duration: 0.6, ease: 'power3.out'}, '-=0.4')
			.to('.hero-tagline', {opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'}, '-=0.3')
			.to('.scroll-indicator', {opacity: 1, duration: 0.6, ease: 'power3.out'}, '-=0.2');

		// Scroll line animation
		gsap.to('.scroll-line', {
			scaleY: 0.7,
			opacity: 0.5,
			duration: 1.5,
			repeat: -1,
			yoyo: true,
			ease: 'power2.inOut',
		});

		// Hero content parallax effect - content scrolls down slowly as user scrolls
		gsap.to('.hero-content', {
			y: 350,
			ease: 'none',
			scrollTrigger: {
				trigger: heroRef.value,
				start: 'top top',
				end: 'bottom top',
				scrub: true,
			},
		});

		gsap.to('.hero-widget-wrapper', {
			y: 350,
			ease: 'none',
			scrollTrigger: {
				trigger: heroRef.value,
				start: 'top top',
				end: 'bottom top',
				scrub: true,
			},
		});

		// Fade out scroll indicator on scroll
		gsap.fromTo(
			'.scroll-indicator',
			{opacity: 1, y: 0},
			{
				opacity: 0,
				y: 30,
				ease: 'none',
				scrollTrigger: {
					trigger: heroRef.value,
					start: 'top top',
					end: '20% top',
					scrub: true,
				},
			}
		);

		// Section animations helper
		const animateSection = (sectionRef, selectors) => {
			if (!sectionRef.value) return;

			selectors.forEach((selector) => {
				const elements = sectionRef.value.querySelectorAll(selector);
				elements.forEach((el, elIndex) => {
					gsap.fromTo(
						el,
						{opacity: 0, y: 30},
						{
							opacity: 1,
							y: 0,
							duration: 0.8,
							ease: 'power3.out',
							scrollTrigger: {
								trigger: el,
								start: 'top 85%',
								toggleActions: 'play none none none',
							},
							delay: elIndex * 0.1,
						}
					);
				});
			});
		};

		// Intro section
		animateSection(introRef, ['.intro-title', '.intro-text', '.intro-image']);

		// Anti High-Rise section
		animateSection(antiHighriseRef, [
			'.content-label',
			'.section-title',
			'.section-body',
			'.section-tagline',
			'.section-image',
		]);

		// Location section
		animateSection(locationRef, [
			'.content-label',
			'.section-title',
			'.section-body',
			'.section-image',
			'.walk-item',
			'.location-image',
			'.section-tagline',
		]);

		// Design section
		animateSection(designRef, [
			'.content-label',
			'.section-title',
			'.section-image',
			'.feature-item',
			'.section-tagline',
		]);

		// Turnkey section
		animateSection(turnkeyRef, [
			'.content-label',
			'.section-title',
			'.section-subtitle',
			'.section-body',
			'.section-image',
			'.improvements',
			'.section-tagline',
		]);

		// Security section
		animateSection(securityRef, [
			'.content-label',
			'.section-title',
			'.security-item',
			'.section-tagline',
			'.section-image',
		]);

		// Amenities section
		animateSection(amenitiesRef, [
			'.content-label',
			'.section-title',
			'.section-image',
			'.amenity-item',
			'.section-tagline',
		]);

		// Community section
		animateSection(communityRef, [
			'.content-label',
			'.section-title',
			'.section-body',
			'.community-space-item',
			'.community-cta',
			'.section-tagline',
		]);

		// Investment section
		animateSection(investmentRef, ['.content-label', '.section-title', '.investment-point', '.section-tagline']);

		// FAQ section
		animateSection(faqRef, ['.content-label', '.section-title', '.faq-item']);

		// Pets section
		animateSection(petsRef, ['.pet-title', '.pet-policy', '.pet-tagline', '.section-image']);

		// Gallery section
		if (galleryRef.value) {
			gsap.fromTo(
				galleryRef.value.querySelector('.gallery-label'),
				{opacity: 0, y: 20},
				{
					opacity: 1,
					y: 0,
					duration: 0.6,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: galleryRef.value,
						start: 'top 80%',
					},
				}
			);
			gsap.fromTo(
				galleryRef.value.querySelector('.gallery-title'),
				{opacity: 0, y: 20},
				{
					opacity: 1,
					y: 0,
					duration: 0.6,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: galleryRef.value,
						start: 'top 80%',
					},
					delay: 0.1,
				}
			);
			const galleryImages = galleryRef.value.querySelectorAll('.gallery-image');
			galleryImages.forEach((el, index) => {
				gsap.fromTo(
					el,
					{opacity: 0, y: 30},
					{
						opacity: 1,
						y: 0,
						duration: 0.6,
						ease: 'power3.out',
						scrollTrigger: {
							trigger: el,
							start: 'top 85%',
						},
						delay: index * 0.08,
					}
				);
			});
		}

		// CTA section
		if (ctaRef.value) {
			gsap.fromTo(
				ctaRef.value.querySelector('.cta-headline'),
				{opacity: 0, y: 40},
				{
					opacity: 1,
					y: 0,
					duration: 1,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: ctaRef.value,
						start: 'top 70%',
					},
				}
			);
			gsap.fromTo(
				ctaRef.value.querySelector('.cta-body'),
				{opacity: 0, y: 30},
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: ctaRef.value,
						start: 'top 70%',
					},
					delay: 0.2,
				}
			);
			gsap.fromTo(
				ctaRef.value.querySelector('.cta-divider'),
				{opacity: 0, scaleX: 0},
				{
					opacity: 1,
					scaleX: 1,
					duration: 0.6,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: ctaRef.value,
						start: 'top 70%',
					},
					delay: 0.4,
				}
			);
			gsap.fromTo(
				ctaRef.value.querySelector('.cta-address'),
				{opacity: 0},
				{
					opacity: 1,
					duration: 0.6,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: ctaRef.value,
						start: 'top 70%',
					},
					delay: 0.6,
				}
			);
		}
	});
});

onUnmounted(() => {
	if (ctx) ctx.revert();
});

// SEO
const siteUrl = 'https://1033lenox.com';
const ogImage = 'https://admin.1033lenox.com/assets/7fef4bc4-9aad-4801-a430-670a2af7cbde';
const pageTitle = '1033 Lenox | Boutique Condo & Apartment Building in Miami Beach';
const pageDescription =
	"Boutique condo and apartment building in Miami Beach's Flamingo Park. 28-unit residence with oversized balconies, modern security, and walkable South Beach living. Fully renovated and turnkey ready.";

useHead({
	title: pageTitle,
	meta: [
		{name: 'description', content: pageDescription},
		{
			name: 'keywords',
			content:
				'boutique condo Miami Beach, apartment building Miami Beach, Miami Beach condos for sale, Flamingo Park condos, South Beach apartments, 1033 Lenox, boutique residence Miami Beach, one bedroom condo Miami Beach',
		},
	],
	link: [
		{rel: 'canonical', href: siteUrl},
		{
			rel: 'preload',
			as: 'image',
			href: 'https://admin.1033lenox.com/assets/42b3290e-063e-4412-bf1c-a083498d1887?key=xlarge',
		},
	],
});

useSeoMeta({
	ogType: 'website',
	ogTitle: pageTitle,
	ogDescription: pageDescription,
	ogImage: ogImage,
	ogImageAlt: '1033 Lenox - Boutique condo building in Miami Beach',
	ogUrl: siteUrl,
	ogSiteName: '1033 Lenox',
	ogLocale: 'en_US',
	twitterCard: 'summary_large_image',
	twitterTitle: pageTitle,
	twitterDescription: pageDescription,
	twitterImage: ogImage,
});

// JSON-LD Structured Data
useHead({
	script: [
		{
			type: 'application/ld+json',
			innerHTML: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'ApartmentComplex',
				name: '1033 Lenox',
				description: pageDescription,
				url: siteUrl,
				image: ogImage,
				address: {
					'@type': 'PostalAddress',
					streetAddress: '1033 Lenox Avenue',
					addressLocality: 'Miami Beach',
					addressRegion: 'FL',
					postalCode: '33139',
					addressCountry: 'US',
				},
				geo: {
					'@type': 'GeoCoordinates',
					latitude: 25.7743,
					longitude: -80.1408,
				},
				numberOfAccommodationUnits: 28,
				petsAllowed: true,
				amenityFeature: [
					{'@type': 'LocationFeatureSpecification', name: 'Central Courtyard', value: true},
					{'@type': 'LocationFeatureSpecification', name: 'Deeded Garage Parking', value: true},
					{'@type': 'LocationFeatureSpecification', name: 'On-Site Laundry', value: true},
					{'@type': 'LocationFeatureSpecification', name: 'Clubhouse', value: true},
					{'@type': 'LocationFeatureSpecification', name: 'Bike Storage', value: true},
					{'@type': 'LocationFeatureSpecification', name: 'Facial Recognition Security', value: true},
					{'@type': 'LocationFeatureSpecification', name: 'Impact Windows', value: true},
					{'@type': 'LocationFeatureSpecification', name: 'Oversized Balconies', value: true},
				],
			}),
		},
		{
			type: 'application/ld+json',
			innerHTML: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'LocalBusiness',
				'@id': `${siteUrl}/#organization`,
				name: '1033 Lenox Condominium Association',
				url: siteUrl,
				image: ogImage,
				address: {
					'@type': 'PostalAddress',
					streetAddress: '1033 Lenox Avenue',
					addressLocality: 'Miami Beach',
					addressRegion: 'FL',
					postalCode: '33139',
					addressCountry: 'US',
				},
				geo: {
					'@type': 'GeoCoordinates',
					latitude: 25.7743,
					longitude: -80.1408,
				},
				areaServed: {
					'@type': 'City',
					name: 'Miami Beach',
				},
			}),
		},
		{
			type: 'application/ld+json',
			innerHTML: JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'FAQPage',
				mainEntity: faqs.map((faq) => ({
					'@type': 'Question',
					name: faq.question,
					acceptedAnswer: {
						'@type': 'Answer',
						text: faq.answer,
					},
				})),
			}),
		},
	],
});
</script>

<style scoped>
.sell-sheet {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

/* Weather widget in hero - styled for dark background */
/* .hero-widgets {
	transform: translateY(-10px);
} */

/* Hero section clips the fixed background */
.hero {
	clip-path: inset(0);
}

/* Fixed background contained within hero via clip-path */
.hero-bg-container {
	position: fixed;
	inset: 0;
}

/* All sections after hero need proper stacking context */
.section {
	position: relative;
	z-index: 10;
}

/* Smooth scroll behavior */
:deep(html) {
	scroll-behavior: smooth;
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

/* Hide scrollbar while maintaining scroll functionality */
.scrollbar-hide {
	-ms-overflow-style: none; /* IE and Edge */
	scrollbar-width: none; /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
	display: none; /* Chrome, Safari, Opera */
}
</style>
