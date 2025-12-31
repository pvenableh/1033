<template>
	<div class="sell-sheet bg-cream min-h-screen">
		<!-- Hero Section -->
		<section ref="heroRef" class="hero min-h-screen flex flex-col justify-center items-center relative px-6 lg:px-16">
			<!-- Hero Background Image -->
			<div class="absolute inset-0 z-0">
				<div class="hero-image w-full h-full bg-gray-200 flex items-center justify-center opacity-0">
					<div class="text-center p-8 max-w-lg">
						<div class="w-16 h-16 mx-auto mb-4 border-2 border-gray-400 rounded-full flex items-center justify-center">
							<UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400" />
						</div>
						<p class="text-sm text-gray-500 font-medium mb-2">HERO IMAGE</p>
						<p class="text-xs text-gray-400 leading-relaxed">
							Suggested: Twilight exterior shot of 1033 Lenox showing the white stucco facade, black steel railings, and
							palm trees. Warm interior lights glowing from units. Alternatively: Wide shot of the tree-lined street
							with the building as focal point.
						</p>
					</div>
				</div>
				<div class="absolute inset-0 bg-gradient-to-b from-cream/80 via-cream/60 to-cream"></div>
			</div>

			<div class="hero-content text-center relative z-10">
				<p class="hero-address text-xs tracking-[0.3em] uppercase text-gray-500 mb-8 opacity-0">
					Miami Beach · Flamingo Park
				</p>
				<h1
					class="hero-title font-serif text-[clamp(3.5rem,12vw,8rem)] font-light tracking-tight leading-[0.9] mb-8 opacity-0">
					1033 Lenox
				</h1>
				<div class="hero-divider w-16 h-px bg-gold mx-auto mb-8 opacity-0 scale-x-0"></div>
				<p
					class="hero-tagline font-serif text-[clamp(1.125rem,2.5vw,1.5rem)] italic font-light text-gray-500 opacity-0">
					The Smarter Side of South Beach
				</p>
			</div>
			<div
				class="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 scroll-indicator z-10">
				<span class="text-[0.625rem] tracking-[0.2em] uppercase text-gray-500">Scroll</span>
				<div class="w-px h-10 bg-gradient-to-b from-gold to-transparent scroll-line"></div>
			</div>
		</section>

		<!-- Intro Section -->
		<section ref="introRef" class="section py-24 lg:py-32 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-5xl mx-auto">
				<p
					class="intro-text font-serif text-[clamp(1.25rem,3vw,1.75rem)] leading-relaxed font-light text-gray-800 text-center max-w-3xl mx-auto mb-16 opacity-0">
					1033 Lenox is a 28-unit boutique residence in the heart of Miami Beach's Flamingo Park neighborhood.
					One-bedrooms only. Oversized balconies. No crowded hallways, no lobby lines—just smart, private living for
					those who know the difference.
				</p>

				<!-- Intro Image Grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 intro-images">
					<div class="aspect-[4/3] bg-gray-200 flex items-center justify-center opacity-0 intro-image">
						<div class="text-center p-6">
							<div
								class="w-12 h-12 mx-auto mb-3 border-2 border-gray-400 rounded-full flex items-center justify-center">
								<UIcon name="i-heroicons-photo" class="w-6 h-6 text-gray-400" />
							</div>
							<p class="text-sm text-gray-500 font-medium mb-2">COURTYARD VIEW</p>
							<p class="text-xs text-gray-400 leading-relaxed">
								Central courtyard with mature palm trees, dappled sunlight, and glimpse of the open-air breezeways.
								Conveys intimate community feel.
							</p>
						</div>
					</div>
					<div class="aspect-[4/3] bg-gray-200 flex items-center justify-center opacity-0 intro-image">
						<div class="text-center p-6">
							<div
								class="w-12 h-12 mx-auto mb-3 border-2 border-gray-400 rounded-full flex items-center justify-center">
								<UIcon name="i-heroicons-photo" class="w-6 h-6 text-gray-400" />
							</div>
							<p class="text-sm text-gray-500 font-medium mb-2">BALCONY LIFESTYLE</p>
							<p class="text-xs text-gray-400 leading-relaxed">
								5'×20' balcony styled with modern outdoor furniture, plants, morning coffee scene. Show the generous
								depth and livable outdoor space.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Anti High-Rise Section -->
		<section ref="antiHighriseRef" class="section py-24 lg:py-32 px-6 lg:px-16">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="font-serif text-sm text-gold">01</span>
						<span class="text-xs tracking-wider uppercase text-gray-500">Philosophy</span>
					</div>
					<div class="content-main">
						<div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12">
							<div class="max-w-xl">
								<h2
									class="section-title font-serif text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
									The Anti-High-Rise
								</h2>
								<p class="section-body text-[1.0625rem] leading-relaxed text-gray-600 mb-8 opacity-0">
									Skip the elevator lines, the endless hallways, and the anonymous lobby. 1033 Lenox offers what the
									towers can't—an intimate, design-forward residence in the heart of South Beach where you actually know
									your neighbors.
								</p>
								<p
									class="section-tagline font-serif text-lg italic text-gold-dark pt-8 border-t border-divider opacity-0">
									Boutique scale. Big beach lifestyle.
								</p>
							</div>
							<div class="aspect-[3/4] bg-gray-200 flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-6">
									<div
										class="w-12 h-12 mx-auto mb-3 border-2 border-gray-400 rounded-full flex items-center justify-center">
										<UIcon name="i-heroicons-photo" class="w-6 h-6 text-gray-400" />
									</div>
									<p class="text-sm text-gray-500 font-medium mb-2">BREEZEWAY DETAIL</p>
									<p class="text-xs text-gray-400 leading-relaxed">
										Open-air breezeway showing crisp white stucco against blue sky. Emphasize the light, air, and
										architectural simplicity. Person walking casually adds human scale.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Location Section -->
		<section ref="locationRef" class="section py-24 lg:py-32 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="font-serif text-sm text-gold">02</span>
						<span class="text-xs tracking-wider uppercase text-gray-500">Location</span>
					</div>
					<div class="content-main max-w-4xl">
						<h2
							class="section-title font-serif text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Coveted Location
						</h2>
						<p class="section-body text-[1.0625rem] leading-relaxed text-gray-600 mb-8 opacity-0">
							Nestled on a tree-lined street in one of SoBe's most desirable residential pockets—walkable to everything,
							removed from nothing.
						</p>

						<!-- Location Image -->
						<div class="aspect-[21/9] bg-gray-200 flex items-center justify-center mb-8 opacity-0 section-image">
							<div class="text-center p-6">
								<div
									class="w-12 h-12 mx-auto mb-3 border-2 border-gray-400 rounded-full flex items-center justify-center">
									<UIcon name="i-heroicons-map" class="w-6 h-6 text-gray-400" />
								</div>
								<p class="text-sm text-gray-500 font-medium mb-2">NEIGHBORHOOD MAP OR AERIAL</p>
								<p class="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
									Stylized map showing 1033 Lenox in relation to the beach, bay, Flamingo Park, Whole Foods, and Lincoln
									Road. Or: Drone shot showing the tree-lined residential character with beach/bay visible in distance.
								</p>
							</div>
						</div>

						<div
							class="walk-times grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 py-12 my-8 border-y border-divider">
							<div v-for="(item, index) in walkTimes" :key="index" class="walk-item text-center opacity-0">
								<span class="font-serif text-5xl font-light leading-none block text-gray-800">{{ item.minutes }}</span>
								<span class="text-xs tracking-wide uppercase text-gold-dark block mb-1">min</span>
								<span class="text-sm text-gray-500 block">{{ item.destination }}</span>
							</div>
						</div>

						<!-- Location Detail Images -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
							<div
								v-for="(loc, index) in locationImages"
								:key="index"
								class="aspect-square bg-gray-200 flex items-center justify-center opacity-0 location-image">
								<div class="text-center p-3">
									<UIcon :name="loc.icon" class="w-6 h-6 text-gray-400 mx-auto mb-2" />
									<p class="text-xs text-gray-500 font-medium">{{ loc.title }}</p>
									<p class="text-[10px] text-gray-400 mt-1">{{ loc.desc }}</p>
								</div>
							</div>
						</div>

						<p class="section-tagline font-serif text-lg italic text-gold-dark pt-8 border-t border-divider opacity-0">
							Leave the car. Live the neighborhood.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Design Section -->
		<section ref="designRef" class="section py-24 lg:py-32 px-6 lg:px-16">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="font-serif text-sm text-gold">03</span>
						<span class="text-xs tracking-wider uppercase text-gray-500">Design</span>
					</div>
					<div class="content-main max-w-4xl">
						<h2
							class="section-title font-serif text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Thoughtfully Designed
						</h2>

						<!-- Design Image Grid -->
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
							<div class="aspect-[4/5] bg-gray-200 flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-4">
									<UIcon name="i-heroicons-photo" class="w-6 h-6 text-gray-400 mx-auto mb-2" />
									<p class="text-xs text-gray-500 font-medium mb-1">EXTERIOR DETAIL</p>
									<p class="text-[10px] text-gray-400">
										Black steel railing detail against white stucco. Clean modernist lines.
									</p>
								</div>
							</div>
							<div
								class="aspect-[4/5] bg-gray-200 flex items-center justify-center opacity-0 section-image md:col-span-2">
								<div class="text-center p-4">
									<UIcon name="i-heroicons-photo" class="w-6 h-6 text-gray-400 mx-auto mb-2" />
									<p class="text-xs text-gray-500 font-medium mb-1">INTERIOR LIVING SPACE</p>
									<p class="text-[10px] text-gray-400">
										Bright, modern 1BR interior showing open layout, natural light flooding in from balcony doors.
										Staged with sophisticated, minimal furnishings.
									</p>
								</div>
							</div>
						</div>

						<div class="feature-grid grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
							<div
								v-for="(feature, index) in designFeatures"
								:key="index"
								:class="['feature-item flex gap-4 items-start opacity-0', feature.wide ? 'sm:col-span-2' : '']">
								<div class="feature-icon w-6 h-6 flex-shrink-0 text-gold-dark">
									<UIcon :name="feature.icon" class="w-6 h-6" />
								</div>
								<p class="text-[0.9375rem] leading-relaxed text-gray-600">{{ feature.text }}</p>
							</div>
						</div>

						<p class="section-tagline font-serif text-lg italic text-gold-dark pt-8 border-t border-divider opacity-0">
							Boutique scale. Architectural edge.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Turnkey Section -->
		<section ref="turnkeyRef" class="section py-24 lg:py-32 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="font-serif text-sm text-gold">04</span>
						<span class="text-xs tracking-wider uppercase text-gray-500">Investment</span>
					</div>
					<div class="content-main max-w-4xl">
						<h2
							class="section-title font-serif text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-4 opacity-0">
							Turnkey
						</h2>
						<p class="section-subtitle text-sm tracking-[0.15em] uppercase text-gold-dark mb-8 opacity-0">
							Fully Renovated — All New
						</p>
						<p class="section-body text-[1.0625rem] leading-relaxed text-gray-600 mb-8 opacity-0">
							40-year recertification complete. No looming assessments. No deferred maintenance. Just move in.
						</p>

						<!-- Renovation Before/After or Detail Images -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
							<div class="aspect-square bg-gray-200 flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-3">
									<UIcon name="i-heroicons-window" class="w-6 h-6 text-gray-400 mx-auto mb-2" />
									<p class="text-[10px] text-gray-500 font-medium">IMPACT WINDOWS</p>
									<p class="text-[9px] text-gray-400">Hurricane-rated</p>
								</div>
							</div>
							<div class="aspect-square bg-gray-200 flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-3">
									<UIcon name="i-heroicons-bolt" class="w-6 h-6 text-gray-400 mx-auto mb-2" />
									<p class="text-[10px] text-gray-500 font-medium">ELECTRICAL</p>
									<p class="text-[9px] text-gray-400">Complete upgrade</p>
								</div>
							</div>
							<div class="aspect-square bg-gray-200 flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-3">
									<UIcon name="i-heroicons-home-modern" class="w-6 h-6 text-gray-400 mx-auto mb-2" />
									<p class="text-[10px] text-gray-500 font-medium">NEW ROOF</p>
									<p class="text-[9px] text-gray-400">2024 installation</p>
								</div>
							</div>
							<div class="aspect-square bg-gray-200 flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-3">
									<UIcon name="i-heroicons-arrows-up-down" class="w-6 h-6 text-gray-400 mx-auto mb-2" />
									<p class="text-[10px] text-gray-500 font-medium">ELEVATOR</p>
									<p class="text-[9px] text-gray-400">New cab interior</p>
								</div>
							</div>
						</div>

						<div class="improvements bg-white/80 p-6 my-8 opacity-0">
							<p class="text-xs tracking-[0.15em] uppercase text-gold-dark mb-4">Recent Capital Improvements</p>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
								<span
									v-for="(item, index) in improvements"
									:key="index"
									class="text-[0.9375rem] text-gray-600 py-2 border-b border-divider">
									{{ item }}
								</span>
							</div>
						</div>

						<p class="section-tagline font-serif text-lg italic text-gold-dark pt-8 border-t border-divider opacity-0">
							This is rare: a boutique SoBe building with the hard work behind it.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Security Section -->
		<section ref="securityRef" class="section py-24 lg:py-32 px-6 lg:px-16">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="font-serif text-sm text-gold">05</span>
						<span class="text-xs tracking-wider uppercase text-gray-500">Security</span>
					</div>
					<div class="content-main">
						<div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12">
							<div class="max-w-xl">
								<h2
									class="section-title font-serif text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
									Secure & Connected
								</h2>

								<div class="security-features flex flex-col gap-0 my-8">
									<div
										v-for="(feature, index) in securityFeatures"
										:key="index"
										class="security-item flex items-center gap-4 py-4 border-b border-divider opacity-0">
										<div class="security-icon w-5 h-5 flex-shrink-0 text-gold-dark">
											<UIcon :name="feature.icon" class="w-5 h-5" />
										</div>
										<span class="text-[0.9375rem] text-gray-600">{{ feature.text }}</span>
									</div>
								</div>

								<p
									class="section-tagline font-serif text-lg italic text-gold-dark pt-8 border-t border-divider opacity-0">
									Peace of mind, built in.
								</p>
							</div>
							<div class="aspect-[3/4] bg-gray-200 flex items-center justify-center opacity-0 section-image">
								<div class="text-center p-6">
									<div
										class="w-12 h-12 mx-auto mb-3 border-2 border-gray-400 rounded-full flex items-center justify-center">
										<UIcon name="i-heroicons-finger-print" class="w-6 h-6 text-gray-400" />
									</div>
									<p class="text-sm text-gray-500 font-medium mb-2">ENTRY SYSTEM</p>
									<p class="text-xs text-gray-400 leading-relaxed">
										Close-up of the sleek facial recognition entry panel at the main gate. Modern, unobtrusive design.
										Evening shot with subtle lighting works well.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Amenities Section -->
		<section ref="amenitiesRef" class="section py-24 lg:py-32 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="font-serif text-sm text-gold">06</span>
						<span class="text-xs tracking-wider uppercase text-gray-500">Amenities</span>
					</div>
					<div class="content-main max-w-4xl">
						<h2
							class="section-title font-serif text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Amenities With Intention
						</h2>

						<!-- Amenities Image -->
						<div class="aspect-[16/9] bg-gray-200 flex items-center justify-center mb-8 opacity-0 section-image">
							<div class="text-center p-6">
								<div
									class="w-12 h-12 mx-auto mb-3 border-2 border-gray-400 rounded-full flex items-center justify-center">
									<UIcon name="i-heroicons-sun" class="w-6 h-6 text-gray-400" />
								</div>
								<p class="text-sm text-gray-500 font-medium mb-2">COURTYARD & GROUNDS</p>
								<p class="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
									Wide shot of the sunlit central courtyard with palm trees, well-maintained landscaping. Perhaps a
									resident relaxing or walking through. Morning light preferred.
								</p>
							</div>
						</div>

						<div class="amenities-list grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 my-8">
							<div
								v-for="(amenity, index) in amenities"
								:key="index"
								class="amenity-item flex items-center gap-4 py-3 opacity-0">
								<span class="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0"></span>
								<span class="text-[0.9375rem] text-gray-600">{{ amenity }}</span>
							</div>
						</div>

						<p class="section-tagline font-serif text-lg italic text-gold-dark pt-8 border-t border-divider opacity-0">
							Everything you need. Nothing you don't.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Investment Section -->
		<section ref="investmentRef" class="section py-24 lg:py-32 px-6 lg:px-16">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-16">
					<div class="content-label flex flex-col gap-2 opacity-0">
						<span class="font-serif text-sm text-gold">07</span>
						<span class="text-xs tracking-wider uppercase text-gray-500">Value</span>
					</div>
					<div class="content-main max-w-2xl">
						<h2
							class="section-title font-serif text-[clamp(2rem,5vw,3rem)] font-normal tracking-tight leading-tight mb-8 opacity-0">
							Smart Investment
						</h2>

						<div class="investment-points flex flex-col gap-4 my-8">
							<p
								v-for="(point, index) in investmentPoints"
								:key="index"
								class="text-base text-gray-600 pl-8 relative opacity-0 investment-point">
								<span class="absolute left-0 top-2 w-1.5 h-1.5 bg-gold rounded-full"></span>
								{{ point }}
							</p>
						</div>

						<p class="section-tagline font-serif text-lg italic text-gold-dark pt-8 border-t border-divider opacity-0">
							The numbers make sense. So does the lifestyle.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Pet Section -->
		<section ref="petsRef" class="section py-16 lg:py-24 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-2xl mx-auto">
				<div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
					<div class="text-center md:text-left">
						<h3 class="pet-title font-serif text-2xl font-normal mb-4 opacity-0">Pet Friendly</h3>
						<p class="pet-policy text-base text-gray-600 mb-4 opacity-0">One approved pet per residence</p>
						<p class="pet-tagline font-serif italic text-gold-dark opacity-0">Because the best roommates wear fur.</p>
					</div>
					<div
						class="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center opacity-0 section-image mx-auto md:mx-0">
						<div class="text-center p-2">
							<UIcon name="i-heroicons-heart" class="w-8 h-8 text-gray-400 mx-auto mb-1" />
							<p class="text-[9px] text-gray-400">Happy dog on balcony or in courtyard</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Lifestyle Gallery Section -->
		<section ref="galleryRef" class="section py-24 lg:py-32 px-6 lg:px-16">
			<div class="max-w-6xl mx-auto">
				<div class="text-center mb-12">
					<p class="text-xs tracking-[0.3em] uppercase text-gray-500 mb-4 opacity-0 gallery-label">
						The Flamingo Park Lifestyle
					</p>
					<h2 class="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-normal text-gray-800 opacity-0 gallery-title">
						Active Living, Steps Away
					</h2>
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div
						v-for="(item, index) in lifestyleImages"
						:key="index"
						:class="['bg-gray-200 flex items-center justify-center opacity-0 gallery-image', item.span]">
						<div class="text-center p-4">
							<UIcon :name="item.icon" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
							<p class="text-xs text-gray-500 font-medium mb-1">{{ item.title }}</p>
							<p class="text-[10px] text-gray-400">{{ item.desc }}</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- CTA Section -->
		<section ref="ctaRef" class="section relative py-32 lg:py-40 px-6 lg:px-16 bg-gray-900 text-cream overflow-hidden">
			<!-- CTA Background Image -->
			<div class="absolute inset-0 z-0 opacity-30">
				<div class="w-full h-full bg-gray-700 flex items-center justify-center">
					<div class="text-center p-8">
						<UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-500 mx-auto mb-3" />
						<p class="text-xs text-gray-400">
							Evening/twilight exterior with warm window glow. Or: Beach sunset with building silhouette.
						</p>
					</div>
				</div>
			</div>

			<div class="max-w-3xl mx-auto text-center relative z-10">
				<h2 class="cta-headline font-serif text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight mb-8 opacity-0">
					This Isn't Condo Living.
					<br />
					It's a Lifestyle Upgrade.
				</h2>
				<p class="cta-body text-[1.0625rem] leading-relaxed text-white/70 mb-12 opacity-0">
					For the discerning buyer who values character over square footage, community over anonymity, and smart design
					over status symbols—welcome home.
				</p>
				<div class="cta-divider w-16 h-px bg-gold mx-auto mb-12 opacity-0 scale-x-0"></div>
				<p class="cta-address text-sm tracking-wide text-white/50 opacity-0">
					1033 Lenox Avenue · Miami Beach, FL 33139
				</p>
			</div>
		</section>

		<!-- Footer -->
		<footer class="py-8 px-6 lg:px-16 text-center border-t border-divider">
			<p class="text-xs text-gray-500 tracking-wide">© 2025 1033 Lenox · Flamingo Park · Miami Beach</p>
		</footer>
	</div>
</template>

<script setup>
import {ref, onMounted, onUnmounted} from 'vue';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

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
const petsRef = ref(null);
const galleryRef = ref(null);
const ctaRef = ref(null);

// Data
const walkTimes = [
	{minutes: '6', destination: 'to the Ocean'},
	{minutes: '2', destination: 'to the Bay'},
	{minutes: '1', destination: 'to Whole Foods'},
	{minutes: '1', destination: 'to Flamingo Park'},
	{minutes: '7', destination: 'to Lincoln Road'},
];

const locationImages = [
	{icon: 'i-heroicons-sun', title: 'BEACH', desc: 'Ocean access'},
	{icon: 'i-heroicons-building-storefront', title: 'WHOLE FOODS', desc: '1 block'},
	{icon: 'i-heroicons-ticket', title: 'FLAMINGO PARK', desc: 'Track & courts'},
	{icon: 'i-heroicons-shopping-bag', title: 'LINCOLN ROAD', desc: 'Dining & shops'},
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
	'Clubhouse',
	'On-site laundry',
	'Storage room',
	'Bike rack',
	'Deeded garage parking (1 space per residence)',
	'Beautiful front yards',
];

const investmentPoints = [
	'Comprehensive coverage via Citizens + flood insurance',
	'Fully hurricane-certified',
	'Transparent financials via owner portal',
];

const lifestyleImages = [
	{
		icon: 'i-heroicons-sun',
		title: 'BEACH MORNING',
		desc: 'Sunrise run on the sand',
		span: 'aspect-[4/3] md:col-span-2 md:row-span-2',
	},
	{icon: 'i-heroicons-heart', title: 'FLAMINGO PARK', desc: 'Tennis, track, outdoor gyms', span: 'aspect-square'},
	{icon: 'i-heroicons-shopping-bag', title: 'LINCOLN ROAD', desc: 'Weekend brunch & shopping', span: 'aspect-square'},
	{icon: 'i-heroicons-sparkles', title: 'BAY SUNSET', desc: 'Evening walks on the bay', span: 'aspect-square'},
	{icon: 'i-heroicons-cake', title: 'WHOLE FOODS', desc: 'Daily groceries, 1 block', span: 'aspect-square'},
];

// GSAP animations
let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		// Hero animations
		const heroTl = gsap.timeline({delay: 0.3});
		heroTl
			.to('.hero-image', {opacity: 1, duration: 1.2, ease: 'power2.out'})
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
		animateSection(introRef, ['.intro-text', '.intro-image']);

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

		// Investment section
		animateSection(investmentRef, ['.content-label', '.section-title', '.investment-point', '.section-tagline']);

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
useHead({
	title: '1033 Lenox | Boutique Residence in Miami Beach',
	meta: [
		{
			name: 'description',
			content:
				"28-unit boutique residence in Miami Beach's Flamingo Park neighborhood. One-bedrooms only. Oversized balconies. The smarter side of South Beach.",
		},
	],
});
</script>

<style scoped>
.sell-sheet {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

/* Smooth scroll behavior */
:deep(html) {
	scroll-behavior: smooth;
}
</style>
