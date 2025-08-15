<template>
	<div class="min-h-screen bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Header -->
			<div class="text-center mb-12">
				<h1 class="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider">ACCESS CONTROL SYSTEM COMPARISON</h1>
				
				<div class="text-sm text-gray-500 uppercase tracking-widest">
					THREE-WAY COMPARISON: UNIFI VS SWIFTLANE VS AMAZON KEY
				</div>
			</div>
<!-- Product Information Cards -->
			<div class="grid lg:grid-cols-3 gap-8 mb-12">
				<!-- UniFi -->
				<UCard class="text-center border border-gray-300 rounded-sm bg-white">
					<div
						@click="showSelectedImage('0fc7187b-6e83-48e0-b3e3-45fdcf1bfca6')"
						class="w-full h-48 flex items-center justify-center mb-4 cursor-pointer"
					>
						<NuxtImg src="0fc7187b-6e83-48e0-b3e3-45fdcf1bfca6" class="object-contain h-48 w-auto dark:brightness-90" />
					</div>
					<div
						@click="showSelectedImage('ef8d28d1-7ad6-47ec-9e7a-4373ad9cb9d7')"
						class="w-full h-48 flex items-center justify-center mb-4 cursor-pointer"
					>
						<NuxtImg src="ef8d28d1-7ad6-47ec-9e7a-4373ad9cb9d7" class="object-cover h-48 w-auto dark:brightness-90" />
					</div>
					<h3 class="text-lg font-bold text-purple-800 uppercase tracking-wide mb-4">UNIFI G3 INTERCOM</h3>
					<div class="space-y-3">
						<UButton
							color="purple"
							variant="outline"
							class="w-full mb-14"
							to="https://ui.com/physical-security/door-access/intercoms"
							target="_blank"
						>
							VIEW PRODUCT DETAILS
						</UButton>
						<UButton
							color="purple"
							variant="solid"
							class="w-full font-bold uppercase"
							to="https://admin.1033lenox.com/assets/4d3b8941-86ce-4e66-b363-814369ecf7f5"
							target="_blank"
						>
							📄 VIEW PROPOSAL PDF
						</UButton>
					</div>
				</UCard>

				<!-- Swiftlane -->
				<UCard class="text-center border border-gray-300 rounded-sm bg-white">
					<div
						@click="showSelectedImage('aefbb2a4-cc01-460d-a79b-2a627e80df38')"
						class="w-full h-48 flex items-center justify-center mb-4 cursor-pointer"
					>
						<NuxtImg src="aefbb2a4-cc01-460d-a79b-2a627e80df38" class="object-cover h-48 w-full dark:brightness-90" />
					</div>
					<div
						@click="showSelectedImage('9e63d591-d814-439a-b68f-a9de7945c979')"
						class="w-full h-48 flex items-center justify-center mb-4 cursor-pointer"
					>
						<NuxtImg src="9e63d591-d814-439a-b68f-a9de7945c979" class="object-cover h-48 w-full dark:brightness-90" />
					</div>
					<h3 class="text-lg font-bold text-blue-500 uppercase tracking-wide mb-4">SWIFTLANE SYSTEM</h3>
					<div class="space-y-3">
						<UButton
							color="blue"
							variant="outline"
							class="w-full"
							to="https://swiftlane.com/video-intercom/"
							target="_blank"
						>
							VIDEO INTERCOM
						</UButton>
						<UButton
							color="blue"
							variant="outline"
							class="w-full"
							to="https://swiftlane.com/vehicle-access-control/"
							target="_blank"
						>
							VEHICLE ACCESS
						</UButton>
						<UButton
							color="blue"
							variant="solid"
							class="w-full font-bold uppercase"
							to="https://admin.1033lenox.com/cca32f22-0e92-447c-8c60-7afddbef5ad3"
							target="_blank"
						>
							📄 VIEW PROPOSAL PDF
						</UButton>
					</div>
				</UCard>

				<!-- Amazon Key -->
				<UCard class="text-center border border-gray-300 rounded-sm bg-white">
					<div
						@click="showSelectedImage('f2db37c1-82cb-48c7-b3cd-162fcfbc120b')"
						class="w-full h-48 flex items-center justify-center mb-4 cursor-pointer"
					>
						<NuxtImg src="f2db37c1-82cb-48c7-b3cd-162fcfbc120b" class="object-cover h-48 w-full dark:brightness-90" />
					</div>
					<div
						@click="showSelectedImage('af92f11a-0601-44d1-9988-8d8a93adfe5b')"
						class="w-full h-48 flex items-center justify-center mb-4 cursor-pointer"
					>
						<NuxtImg src="af92f11a-0601-44d1-9988-8d8a93adfe5b" class="object-cover h-48 w-full dark:brightness-90" />
					</div>
					<h3 class="text-lg font-bold text-orange-800 uppercase tracking-wide mb-4">AMAZON KEY SYSTEM</h3>
					<div class="space-y-3">
						<UButton
							color="orange"
							variant="outline"
							class="w-full mb-14"
							to="https://www.amazon.com/b/node=207294570011"
							target="_blank"
						>
							VIEW AMAZON KEY
						</UButton>
						<UButton
							color="orange"
							variant="solid"
							class="w-full !opacity-20 font-bold uppercase"
							disabled
							target="_blank"
						>
							📄 VIEW PROPOSAL PDF
						</UButton>
					</div>
				</UCard>
			</div>
			<UModal v-model="isOpen" fullscreen>
				<div class="p-1 !rounded-none flex items-center justify-center relative h-full w-full">
					<UIcon
						@click="isOpen = false"
						name="i-heroicons-x-circle"
						class="cursor-pointer h-8 w-8 absolute shadow-lg right-[10px] top-[10px] text-white bg-black rounded-full"
					/>
					<NuxtImg :src="selectedImage" class="h-[90svh] w-auto" />
				</div>
			</UModal>
			<!-- Executive Summary -->
			<UCard class="mb-12 border border-gray-900 border-l-8 border-l-gray-900 rounded-sm bg-white">
				<template #header>
					<div class="flex items-center gap-3">
						<UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-gray-900" />
						<h2 class="text-2xl font-bold uppercase tracking-wide">EXECUTIVE SUMMARY</h2>
					</div>
				</template>

				<div class="grid md:grid-cols-3 gap-8">
					<div>
						<h4 class="font-bold text-gray-900 mb-3 uppercase tracking-wide">📱 YOUR REQUIREMENTS</h4>
						<ul class="space-y-2 text-sm text-gray-800 font-medium">
							<li>• Mobile app for tenants</li>
							<li>• Facial recognition access (Swiftlane offers per-user)</li>
							<li>• Cloud management for admins</li>
							<li>• Two garage gate access</li>
						</ul>
					</div>
					<div>
						<h4 class="font-bold text-gray-900 mb-3 uppercase tracking-wide">✅ KEY FINDINGS</h4>
						<ul class="space-y-2 text-sm text-gray-800 font-medium">
							<li>
								•
								<strong>Swiftlane offers facial recognition</strong>
								via per-user model
							</li>
							<li>
								•
								<strong>Amazon Key integrates with existing Linear panel</strong>
							</li>
							<li>• UniFi most cost-effective with no monthly fees</li>
							<li>
								•
								<strong>UniFi & Swiftlane save $40/month</strong>
								- no phone line required
							</li>
						</ul>
					</div>
					<div>
						<h4 class="font-bold text-gray-900 mb-3 uppercase tracking-wide">⚠️ CONSIDERATIONS</h4>
						<ul class="space-y-2 text-sm text-gray-800 font-medium">
							<li>• UniFi & Amazon: No facial recognition available</li>
							<li>• Swiftlane facial recognition: Per-user payment model</li>
							<li>• Amazon Key: Security vulnerabilities documented</li>
							<li>• All systems require professional assessment</li>
						</ul>
					</div>
				</div>
			</UCard>

			<!-- Requirements Matrix -->
			<UCard class="mb-12 border border-gray-300 rounded-sm bg-white">
				<template #header>
					<div class="flex items-center gap-3">
						<UIcon name="i-heroicons-check-badge" class="w-8 h-8 text-gray-900" />
						<h2 class="text-2xl font-bold uppercase tracking-wide">REQUIREMENTS COMPLIANCE</h2>
					</div>
				</template>

				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b-4 border-gray-300">
								<th class="text-left py-4 px-6 font-bold uppercase tracking-wide">REQUIREMENT</th>
								<th class="text-center py-4 px-6 font-bold text-purple-800 uppercase tracking-wide">UNIFI G3</th>
								<th class="text-center py-4 px-6 font-bold text-blue-500 uppercase tracking-wide">SWIFTLANE</th>
								<th class="text-center py-4 px-6 font-bold text-orange-800 uppercase tracking-wide">AMAZON KEY</th>
							</tr>
						</thead>
						<tbody>
							<tr class="border-b border-gray-200">
								<td class="py-4 px-6 font-semibold text-gray-900">Mobile App for Tenants</td>
								<td class="text-center py-4 px-6">
									<UBadge color="yellow" variant="solid" class="font-bold uppercase">Basic UniFi Identity</UBadge>
								</td>
								<td class="text-center py-4 px-6">
									<UBadge color="green" variant="solid" class="font-bold uppercase">Comprehensive</UBadge>
								</td>
								<td class="text-center py-4 px-6">
									<UBadge color="orange" variant="solid" class="font-bold uppercase">Ring App Only</UBadge>
								</td>
							</tr>
							<tr class="border-b border-gray-200">
								<td class="py-4 px-6 font-semibold text-gray-900">Facial Recognition</td>
								<td class="text-center py-4 px-6">
									<UBadge color="red" variant="solid" class="font-bold uppercase">None</UBadge>
								</td>
								<td class="text-center py-4 px-6">
									<UBadge color="green" variant="solid" class="font-bold uppercase">
										Available - $21.99/year per user
									</UBadge>
								</td>
								<td class="text-center py-4 px-6">
									<UBadge color="red" variant="solid" class="font-bold uppercase">None</UBadge>
								</td>
							</tr>
							<tr class="border-b border-gray-200">
								<td class="py-4 px-6 font-semibold text-gray-900">Cloud Management</td>
								<td class="text-center py-4 px-6">
									<UBadge color="green" variant="solid" class="font-bold uppercase">Professional</UBadge>
								</td>
								<td class="text-center py-4 px-6">
									<UBadge color="green" variant="solid" class="font-bold uppercase">Enterprise</UBadge>
								</td>
								<td class="text-center py-4 px-6">
									<UBadge color="yellow" variant="solid" class="font-bold uppercase">Ring Dashboard</UBadge>
								</td>
							</tr>
							<tr class="border-b border-gray-200">
								<td class="py-4 px-6 font-semibold text-gray-900">Security Concerns</td>
								<td class="text-center py-4 px-6">
									<UBadge color="green" variant="solid" class="font-bold uppercase">Enterprise Grade</UBadge>
								</td>
								<td class="text-center py-4 px-6">
									<UBadge color="green" variant="solid" class="font-bold uppercase">High Security</UBadge>
								</td>
								<td class="text-center py-4 px-6">
									<UBadge color="red" variant="solid" class="font-bold uppercase">Documented Vulnerabilities</UBadge>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</UCard>

			<!-- Cost Analysis -->
			<UCard class="mb-12 border border-gray-300 rounded-sm bg-white">
				<template #header>
					<div class="flex items-center gap-3">
						<UIcon name="i-heroicons-currency-dollar" class="w-8 h-8 text-gray-900" />
						<h2 class="text-2xl font-bold uppercase tracking-wide">COST BREAKDOWN ANALYSIS</h2>
					</div>
				</template>

				<div class="mb-6">
					<label class="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
						SELECT TIMEFRAME FOR COMPARISON:
					</label>
					<UTabs v-model="selectedTimeframe" :items="timeframeOptions" class="w-full" />
				</div>

				<div class="grid lg:grid-cols-3 gap-8 mt-8">
					<!-- UniFi System -->
					<UCard class="border border-purple-200 rounded-sm bg-white">
						<template #header>
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-bold text-purple-800 uppercase tracking-wide">UNIFI SYSTEM</h3>
								<UBadge color="purple" variant="solid" class="font-bold uppercase">ONE-TIME ONLY</UBadge>
							</div>
						</template>

						<div class="space-y-3">
							<h4 class="font-bold text-purple-800 text-sm uppercase tracking-wide">ONE-TIME COSTS:</h4>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Hardware + Installation:</span>
								<span class="font-bold text-gray-900">${{ unifiProposal.phase1.cost.toLocaleString() }}</span>
							</div>
							<UDivider />
							<h4 class="font-bold text-purple-800 text-sm uppercase tracking-wide">ONGOING COSTS:</h4>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Monthly fees:</span>
								<span class="font-bold text-green-600">$0</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Annual recurring:</span>
								<span class="font-bold text-green-600">$0</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Phone line required:</span>
								<span class="font-bold text-green-600">No</span>
							</div>
							<div class="flex justify-between text-green-600 font-bold">
								<span>Monthly savings:</span>
								<span>$40 (no phone line)</span>
							</div>

							<UDivider />
							<div class="flex justify-between text-lg font-bold">
								<span class="text-gray-900">{{ calculateTotalCost.months }}-MONTH TOTAL:</span>
								<span class="text-purple-800">${{ calculateTotalCost.unifi.toLocaleString() }}</span>
							</div>
							<div class="text-sm text-orange-500 font-bold mt-8 italic">
								<strong>Note:</strong>
								No ongoing costs, but system may become outdated and require updates in 1-2 years
							</div>
						</div>
					</UCard>

					<!-- Swiftlane System -->
					<UCard class="border border-blue-200 rounded-sm bg-white">
						<template #header>
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-bold text-blue-500 uppercase tracking-wide">SWIFTLANE</h3>
								<UBadge color="blue" variant="solid" class="font-bold uppercase">FACIAL RECOGNITION AVAILABLE</UBadge>
							</div>
						</template>

						<div class="space-y-3">
							<h4 class="font-bold text-blue-500 text-sm uppercase tracking-wide">ONE-TIME COSTS:</h4>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Hardware:</span>
								<span class="font-bold text-gray-900">${{ swiftlaneProposal.hardware.total.toLocaleString() }}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Installation:</span>
								<span class="font-bold text-gray-900">${{ swiftlaneProposal.installation.toLocaleString() }}</span>
							</div>
							<UDivider />
							<h4 class="font-bold text-blue-500 text-sm uppercase tracking-wide">ONGOING COSTS:</h4>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Base monthly cost:</span>
								<span class="font-bold text-gray-900">
									${{ swiftlaneProposal.subscription.monthly.toLocaleString() }}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">With {{ discountLabel }} discount:</span>
								<span class="font-bold text-green-600">
									${{ Math.round(swiftlaneProposal.subscription.monthly * discountMultiplier).toLocaleString() }}
								</span>
							</div>

							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Phone line required:</span>
								<span class="font-bold text-green-600">No</span>
							</div>
							<div class="flex justify-between text-green-600 font-bold">
								<span>Monthly savings:</span>
								<span>$40 (no phone line)</span>
							</div>
							<div class="flex justify-between text-green-600">
								<span class="text-gray-800 font-medium">Facial Recognition:</span>
								<span class="font-bold">$21.99/year per resident</span>
							</div>
							<UDivider />
							<div class="flex justify-between text-lg font-bold">
								<span class="text-gray-900">{{ calculateTotalCost.months }}-MONTH TOTAL:</span>
								<span class="text-blue-500">${{ calculateTotalCost.swiftlane.toLocaleString() }}</span>
							</div>
							<div class="flex justify-between mt-8">
								<span class="text-gray-800 font-medium">Annual recurring cost:</span>
								<span class="font-bold text-blue-600">
									${{ (Math.round(swiftlaneProposal.subscription.monthly * discountMultiplier) * 12).toLocaleString() }}
								</span>
							</div>
							<div class="flex justify-between mt-2">
								<span class="text-gray-800 font-medium">{{ timeframePeriodLabel }} total recurring:</span>
								<span class="font-bold text-blue-600">
									${{ recurringCostComparison.swiftlaneTotal.toLocaleString() }}
								</span>
							</div>
							<div class="flex justify-between mt-2 text-green-600" v-if="recurringCostComparison.savings > 0">
								<span class="font-medium">{{ timeframePeriodLabel }} savings vs Amazon Key:</span>
								<span class="font-bold">${{ recurringCostComparison.savings.toLocaleString() }}</span>
							</div>
						</div>
					</UCard>

					<!-- Amazon Key System -->
					<UCard class="border border-orange-200 rounded-sm bg-white">
						<template #header>
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-bold text-orange-800 uppercase tracking-wide">AMAZON KEY</h3>
								<UBadge color="orange" variant="solid" class="font-bold uppercase">LINEAR INTEGRATION</UBadge>
							</div>
						</template>

						<div class="space-y-3">
							<h4 class="font-bold text-orange-800 text-sm uppercase tracking-wide">ONE-TIME COSTS:</h4>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Activation Fees:</span>
								<span class="font-bold text-gray-900">${{ amazonKeyProposal.activationFees.toLocaleString() }}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Installation (Linear integration):</span>
								<span class="font-bold text-gray-900">${{ amazonKeyProposal.installation.toLocaleString() }}</span>
							</div>
							<UDivider />
							<h4 class="font-bold text-orange-800 text-sm uppercase tracking-wide">ONGOING COSTS:</h4>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Monthly subscription:</span>
								<span class="font-bold text-gray-900">${{ amazonKeyProposal.monthlyFee.toLocaleString() }}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Phone line monthly:</span>
								<span class="font-bold text-red-600">$40</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-800 font-medium">Total monthly:</span>
								<span class="font-bold text-gray-900">${{ (amazonKeyProposal.monthlyFee + 40).toLocaleString() }}</span>
							</div>

							<UDivider />
							<div class="flex justify-between text-lg font-bold">
								<span class="text-gray-900">{{ calculateTotalCost.months }}-MONTH TOTAL:</span>
								<span class="text-orange-800">${{ calculateTotalCost.amazonKey.toLocaleString() }}</span>
							</div>
							<div class="flex justify-between mt-8">
								<span class="text-gray-800 font-medium">Annual recurring cost:</span>
								<span class="font-bold text-orange-600">
									${{ ((amazonKeyProposal.monthlyFee + 40) * 12).toLocaleString() }}
								</span>
							</div>
							<div class="flex justify-between mt-2">
								<span class="text-gray-800 font-medium">{{ timeframePeriodLabel }} total recurring:</span>
								<span class="font-bold text-orange-600">
									${{ recurringCostComparison.amazonKeyTotal.toLocaleString() }}
								</span>
							</div>
						</div>
					</UCard>
				</div>

				<UAlert
					color="blue"
					variant="solid"
					class="mt-6 font-bold uppercase"
					icon="i-heroicons-cog-6-tooth"
					title="AMAZON KEY LINEAR INTEGRATION ADVANTAGE"
					description="Amazon Key Virtual Key + Intercom Boost can integrate directly with your existing Linear access panel as an add-on, significantly reducing installation costs and complexity. However, requires maintaining existing phone line infrastructure at $40/month."
				/>

				<UAlert
					color="green"
					variant="solid"
					class="mt-6 font-bold uppercase"
					icon="i-heroicons-face-smile"
					title="SWIFTLANE FACIAL RECOGNITION ADVANTAGE"
					description="Swiftlane is the ONLY system offering facial recognition. With their innovative per-resident model, tenants who want facial recognition can pay $21.99/year individually, making it budget-friendly and optional for residents."
				/>

				<UAlert
					color="blue"
					variant="solid"
					class="mt-6 font-bold uppercase"
					icon="i-heroicons-shield-check"
					title="SWIFTLANE COMPREHENSIVE FEATURES"
					description="Complete solution: Full-screen video calls, Face/Mobile/PIN/Voice unlock options, IK10 vandal resistance with replacement insurance, cellular internet fallback, property management integrations, real-time monitoring, and comprehensive delivery management for UPS/FedEx/Amazon with PIN generation and photo logging."
				/>

				<UAlert
					color="blue"
					variant="solid"
					class="mt-6 font-bold uppercase"
					icon="i-heroicons-calculator"
					title="PHONE LINE SAVINGS"
					description="UniFi and Swiftlane systems save $40/month by eliminating phone line requirements. Over 5 years, this represents $2,400 in additional savings versus Amazon Key."
				/>

				<UAlert
					color="green"
					variant="solid"
					class="mt-6 font-bold uppercase"
					icon="i-heroicons-percent-badge"
					title="SWIFTLANE BULK PAYMENT DISCOUNTS"
					description="Swiftlane offers significant discounts for longer commitments on their $40/month base rate: 5% (annual), 10% (3-year), 15% (5-year). Current pricing reflects the selected timeframe discount."
				/>

				<UAlert
					color="amber"
					variant="solid"
					class="mt-6 font-bold uppercase"
					icon="i-heroicons-exclamation-triangle"
					title="SECURITY WARNING"
					description="Amazon Key has documented security vulnerabilities including AWS cloud service exploits and data privacy concerns. Consider security implications for building access control."
				/>
			</UCard>

			

			<!-- Detailed Feature Comparison -->
			<UAccordion :items="accordionItems" multiple class="space-y-6" default-open>
				<!-- Feature Comparison -->
				<template #features>
					<UCard class="border border-gray-300 rounded-sm bg-white">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b-4 border-gray-300">
										<th class="text-left py-4 px-6 font-bold uppercase tracking-wide">FEATURE</th>
										<th class="text-center py-4 px-6 font-bold text-purple-800 uppercase tracking-wide">UNIFI G3</th>
										<th class="text-center py-4 px-6 font-bold text-blue-500 uppercase tracking-wide">SWIFTLANE</th>
										<th class="text-center py-4 px-6 font-bold text-orange-800 uppercase tracking-wide">AMAZON KEY</th>
									</tr>
								</thead>
								<tbody>
									<tr class="border-b border-gray-200">
										<td class="py-4 px-6 font-semibold text-gray-900">Real-Time Monitoring</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-yellow-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Basic activity logs</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Full real-time monitoring & alerts</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-yellow-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Ring app notifications only</div>
										</td>
									</tr>

									<tr class="border-b border-gray-200">
										<td class="py-4 px-6 font-semibold text-gray-900">Delivery Management</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-x-circle" class="w-6 h-6 text-red-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Manual access only</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">
												UPS/FedEx/Amazon PIN generation + photo logging
											</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-yellow-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Amazon deliveries only</div>
										</td>
									</tr>

									<tr class="border-b border-gray-200">
										<td class="py-4 px-6 font-semibold text-gray-900">Facial Recognition</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-x-circle" class="w-6 h-6 text-red-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Not available</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">$21.99/year per user</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-x-circle" class="w-6 h-6 text-red-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Not available</div>
										</td>
									</tr>

									<tr class="border-b border-gray-200">
										<td class="py-4 px-6 font-semibold text-gray-900">Security Features</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-yellow-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Standard security</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">
												IK10 vandal resistance + insurance, cellular fallback
											</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Known vulnerabilities</div>
										</td>
									</tr>

									<tr class="border-b border-gray-200">
										<td class="py-4 px-6 font-semibold text-gray-900">Access Methods</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-yellow-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Mobile app, cards</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Face, Mobile, PIN, Voice, Landline</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-yellow-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Ring app, codes</div>
										</td>
									</tr>

									<tr class="border-b border-gray-200">
										<td class="py-4 px-6 font-semibold text-gray-900">Installation Type</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-wifi" class="w-6 h-6 text-purple-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Wired (PoE)</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-signal" class="w-6 h-6 text-blue-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Wireless/Wired + cellular backup</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-puzzle-piece" class="w-6 h-6 text-orange-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">Integrates with Linear</div>
										</td>
									</tr>

									<tr class="border-b border-gray-200">
										<td class="py-4 px-6 font-semibold text-gray-900">Monthly Costs</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">No ongoing fees</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-yellow-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">
												${{ Math.round(swiftlaneProposal.subscription.monthly * discountMultiplier) }}/month (with
												discount)
											</div>
										</td>
										<td class="text-center py-4 px-6">
											<UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-red-500 mx-auto" />
											<div class="text-xs text-gray-700 mt-1 font-medium">$90/month (includes phone line)</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</UCard>
				</template>

				<!-- Decision Matrix -->
				<template #decision-matrix>
					<div class="grid md:grid-cols-1 gap-8">
						<UCard class="border border-blue-300 rounded-sm bg-white">
							<template #header>
								<h3 class="text-xl font-bold text-blue-500 uppercase tracking-wide">
									SWIFTLANE: FACIAL RECOGNITION & SECURITY LEADER
								</h3>
							</template>

							<div class="space-y-6">
								<!-- <div class="text-2xl font-bold text-blue-500 uppercase tracking-wide hidden">
									ONLY SWIFTLANE OFFERS FACIAL RECOGNITION + ADVANCED SECURITY
								</div> -->
								<p class="font-medium font-bold text-[18px] leading-[24px] mb-4">
									Swiftlane's innovative per-user facial recognition model allows residents to opt-in individually, plus
									offers the highest security features including IK10 vandal resistance and loiter monitoring.
								</p>

								<div class="grid md:grid-cols-3 gap-6 mt-6">
									<div>
										<h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-0.5">
											<UIcon name="i-heroicons-bolt-solid" class="w-5 h-5 text-blue-500" />
											SWIFTLANE ADVANTAGES
										</h4>
										<ul class="space-y-1 text-sm text-gray-900 font-semibold">
											<li class="flex items-start gap-0.5">
												•
												<UIcon name="i-heroicons-star-solid" class="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
												<span><strong>Only facial recognition option</strong></span>
											</li>
											<li>• IK10 vandal-resistant rating</li>
											<li>• Loiter monitoring with AI alerts</li>
											<li>• Unlimited cloud video storage</li>
											<li class="flex items-start gap-0.5">
												•
												<UIcon name="i-heroicons-bolt-solid" class="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
												<span>No phone line required (saves $40/month)</span>
											</li>
											<li>• 15% discount for 5-year commitment</li>
										</ul>
									</div>
									<div>
										<h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">💰 COST COMPARISON (5-YEAR)</h4>
										<ul class="space-y-1 text-sm text-gray-900 font-semibold">
											<li>
												•
												<strong>Amazon Key:</strong>
												${{ calculateTotalCost.amazonKey.toLocaleString() }} (includes phone line)
											</li>
											<li>
												•
												<strong>UniFi:</strong>
												$4,875 one-time
											</li>
											<li>
												•
												<strong>Swiftlane:</strong>
												${{ calculateTotalCost.swiftlane.toLocaleString() }} (no phone line)
											</li>
											<li class="flex items-start gap-0.5">
												• Phone line savings: $2,400 over 5 years
												<UIcon name="i-heroicons-star-solid" class="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
											</li>
										</ul>
									</div>
									<div>
										<h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">🛡️ SECURITY FEATURES</h4>
										<ul class="space-y-1 text-sm text-gray-900 font-semibold">
											<li>• IK10 vandal-resistant housing</li>
											<li>• Real-time loiter detection</li>
											<li>• Continuous video capture</li>
											<li>• Unlimited cloud storage</li>
											<li>• Encrypted data transmission</li>
										</ul>
									</div>
								</div>
							</div>
						</UCard>

						<div class="grid md:grid-cols-3 gap-8 mt-8">
							<UCard class="border border-purple-300 rounded-sm bg-white">
								<template #header>
									<h3 class="text-xl font-bold text-purple-800 uppercase tracking-wide">BUDGET CHOICE: UNIFI G3</h3>
								</template>

								<div class="space-y-4">
									<p class="text-gray-700 font-medium">
										Best value for basic intercom needs without facial recognition.
									</p>

									<div>
										<h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-0.5">
											<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
											ADVANTAGES
										</h4>
										<ul class="space-y-1 text-sm text-gray-900 font-semibold">
											<li class="flex items-start gap-0.5">
												• Lowest total cost ($4,875)
												<UIcon name="i-heroicons-star-solid" class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
											</li>
											<li>• No monthly fees</li>
											<li>• No phone line required</li>
											<li class="flex items-start gap-0.5">
												• Saves $40/month vs Amazon Key
												<UIcon name="i-heroicons-bolt-solid" class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
											</li>
											<li>• Enterprise-grade security</li>
											<li>• Installation included</li>
										</ul>
									</div>
								</div>
							</UCard>

							<UCard class="border border-orange-300 rounded-sm bg-white">
								<template #header>
									<h3 class="text-xl font-bold text-orange-800 uppercase tracking-wide">
										LINEAR INTEGRATION: AMAZON KEY
									</h3>
								</template>

								<div class="space-y-4">
									<p class="text-gray-700 font-medium">
										Leverages existing Linear system but requires maintaining phone line costs.
									</p>

									<div>
										<h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-0.5">
											<UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
											ADVANTAGES
										</h4>
										<ul class="space-y-1 text-sm text-gray-900 font-semibold">
											<li>• Integrates with existing Linear panel</li>
											<li>• Uses current phone line infrastructure</li>
											<li>• Minimal installation disruption</li>
											<li>• Ring app convenience</li>
										</ul>
										<h4 class="font-bold text-gray-900 mb-2 mt-4 uppercase tracking-wide flex items-center gap-0.5">
											<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
											ONGOING COSTS
										</h4>
										<ul class="space-y-1 text-sm text-gray-900 font-semibold">
											<li>• $50/month subscription</li>
											<li>• $40/month phone line</li>
											<li class="flex items-start gap-0.5">
												• Total: $90/month
												<UIcon name="i-heroicons-bolt-solid" class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
											</li>
										</ul>
									</div>
								</div>
							</UCard>

							<UCard class="border border-green-300 rounded-sm bg-white">
								<template #header>
									<h3 class="text-xl font-bold text-green-800 uppercase tracking-wide">MONTHLY SAVINGS</h3>
								</template>

								<div class="space-y-4">
									<p class="text-gray-700 font-medium">
										UniFi and Swiftlane eliminate phone line costs, saving significant money long-term.
									</p>

									<div>
										<h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-0.5">
											<UIcon name="i-heroicons-currency-dollar" class="w-5 h-5 text-green-500" />
											PHONE LINE SAVINGS
										</h4>
										<ul class="space-y-1 text-sm text-gray-900 font-semibold">
											<li>• UniFi: $0/month (saves $40)</li>
											<li>• Swiftlane: $0/month (saves $40)</li>
											<li>• Amazon Key: $40/month phone line</li>
											<li class="flex items-start gap-0.5">
												• 5-year savings: $2,400
												<UIcon name="i-heroicons-star-solid" class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
											</li>
										</ul>
									</div>
								</div>
							</UCard>
						</div>

						<UCard class="mt-8 border border-gray-300 rounded-sm bg-white">
							<template #header>
								<h4 class="font-bold text-gray-900 uppercase tracking-wide">RECOMMENDATION MATRIX:</h4>
							</template>
							<div class="grid md:grid-cols-3 gap-8">
								<div>
									<h5 class="font-bold text-blue-500 mb-2 uppercase tracking-wide">CHOOSE SWIFTLANE IF:</h5>
									<ul class="space-y-1 text-sm text-gray-900 font-semibold">
										<li class="flex items-start gap-0.5">
											• Facial recognition is important to you
											<UIcon name="i-heroicons-star-solid" class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
										</li>
										<li>• You want the highest security features</li>
										<li>• Budget allows for higher monthly costs</li>
										<li class="flex items-start gap-0.5">
											• You want to eliminate phone line costs
											<UIcon name="i-heroicons-bolt-solid" class="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
										</li>
										<li>• Advanced video monitoring is needed</li>
									</ul>
								</div>
								<div>
									<h5 class="font-bold text-purple-800 mb-2 uppercase tracking-wide">CHOOSE UNIFI IF:</h5>
									<ul class="space-y-1 text-sm text-gray-900 font-semibold">
										<li class="flex items-start gap-0.5">
											• Budget is the primary concern
											<UIcon name="i-heroicons-star-solid" class="w-4 h-4 text-green-300 mt-0.5 flex-shrink-0" />
										</li>
										<li>• You prefer one-time payment</li>
										<li>• Basic intercom features are sufficient</li>
										<li>• You want enterprise-grade security</li>
										<li>• No ongoing monthly fees preferred</li>
									</ul>
								</div>
								<div>
									<h5 class="font-bold text-orange-800 mb-2 uppercase tracking-wide">CHOOSE AMAZON KEY IF:</h5>
									<ul class="space-y-1 text-sm text-gray-900 font-semibold">
										<li>• You want to keep existing Linear system</li>
										<li>• Minimal installation disruption preferred</li>
										<li>• Ring app convenience appeals to residents</li>
										<li>• You can accept ongoing phone line costs</li>
										<li>• Security trade-offs are acceptable</li>
									</ul>
								</div>
							</div>
						</UCard>
						<!-- Security & Service Quality Concerns -->
						<UCard class="mb-12 border border-red-300 rounded-sm bg-white">
							<template #header>
								<div class="flex items-center gap-3">
									<UIcon name="i-heroicons-shield-exclamation" class="w-8 h-8 text-red-600" />
									<h2 class="text-2xl font-bold uppercase tracking-wide text-red-800">AMAZON KEY SECURITY CONCERNS</h2>
								</div>
							</template>

							<div class="grid md:grid-cols-2 gap-8">
								<div>
									<h4 class="font-bold text-red-800 mb-3 uppercase tracking-wide">DOCUMENTED VULNERABILITIES</h4>
									<ul class="space-y-2 text-sm">
										<li>
											•
											<strong>AWS Cloud Service Exploits:</strong>
											Multiple CVE reports in 2024-2025
										</li>
										<li>
											•
											<strong>Buffer Overflow Issues:</strong>
											Client VPN vulnerabilities allowing elevated privileges
										</li>
										<li>
											•
											<strong>Data Privacy Concerns:</strong>
											All resident data stored within Amazon ecosystem
										</li>
										<li>
											•
											<strong>Limited Control:</strong>
											Property managers have minimal data visibility
										</li>
									</ul>
								</div>
								<div>
									<h4 class="font-bold text-red-800 mb-3 uppercase tracking-wide">SERVICE LIMITATIONS</h4>
									<ul class="space-y-2 text-sm">
										<li>
											•
											<strong>Amazon-Centric Design:</strong>
											Optimized primarily for Amazon deliveries
										</li>
										<li>
											•
											<strong>Ring App Dependency:</strong>
											Requires residents to use Amazon's Ring app
										</li>
										<li>
											•
											<strong>Limited Integration:</strong>
											Poor compatibility with third-party property management systems
										</li>
										<li>
											•
											<strong>Ongoing Costs:</strong>
											Subscription + phone line = $90/month total
										</li>
									</ul>
								</div>
							</div>
						</UCard>
					</div>
				</template>
			</UAccordion>
		</div>
	</div>
</template>

<script setup>
const isOpen = ref(false);
const selectedImage = ref();
function showSelectedImage(image) {
	isOpen.value = true;
	selectedImage.value = image;
}
// Page metadata
useHead({
	title: 'Access Control System Comparison - Lenox Building 1033',
	meta: [
		{
			name: 'description',
			content:
				'Comprehensive comparison of UniFi G3, Swiftlane, and Amazon Key access control systems with security analysis',
		},
	],
});

// Reactive data
const selectedTimeframe = ref(2); // Default to 5 year (index 2)

// Static data
const timeframeOptions = [
	{ key: 0, label: '1 YEAR' },
	{ key: 1, label: '3 YEARS' },
	{ key: 2, label: '5 YEARS' },
];

const accordionItems = [
	{
		key: 'features',
		label: 'DETAILED FEATURE COMPARISON',
		icon: 'i-heroicons-bolt',
		slot: 'features',
	},
	{
		key: 'decision-matrix',
		label: 'RECOMMENDATION & NEXT STEPS',
		icon: 'i-heroicons-light-bulb',
		slot: 'decision-matrix',
	},
];

const unifiProposal = {
	vendor: 'S. Florida Telecom',
	system: 'UniFi G3 Intercom',
	contact: 'Frank Checa (305-793-0586)',
	phase1: {
		cost: 4875,
		includes: [
			'UniFi Enterprise Main 8 Reader Main Control Hub',
			'UniFi G3 Video Intercom Directory Unit',
			'Electric Door Strike (Main Pedestrian Gate)',
			'Wiring from Equipment Closet to Intercom and Strike',
			'Management Software Setup Via Browser',
			'Door Access via Smartphone setup',
		],
		notes: 'Access Cards available at additional cost (10 cards for $30.00)',
	},
	monthlyFees: 0,
	installation: 'Included',
};

const swiftlaneProposal = {
	vendor: 'Swiftlane',
	system: 'SwiftReader X + Garage Gates',
	hardware: {
		total: 5410, // Updated from actual purchase order
		items: [
			{
				name: 'SwiftReader X (8" Video Intercom)',
				price: 2125,
				features: ['Mobile access', 'Video Intercom', 'Surface Mount'],
			},
			{
				name: 'SwiftTag Reader (UHF + Bluetooth)',
				price: 1350,
				features: ['Vehicle/gate access', 'Wall/pole mounting'],
			},
			{ name: '100 Encrypted Garage Tags', price: 400, features: ['Self-destroying', 'Secure & encrypted'] },
			{ name: 'Door Controller V5.2', price: 325, features: ['2 card readers', '4 relays'] },
			{ name: 'Power Supply & Enclosure', price: 575, features: ['Trove1 enclosure'] },
			{ name: 'Offline ACU', price: 410, features: ['Local credential storage'] },
			{ name: 'Switch & Shipping', price: 225, features: ['8-port PoE+ switch'] },
		],
	},
	subscription: {
		monthly: 40, // Base monthly cost before discounts
		breakdown: [
			{ name: 'Video Intercom + Mobile Unlock + Face Unlock + Visitor Passes', price: 30 },
			{ name: 'Card Reader/Gate Entrance', price: 10 },
		],
	},
	facialRecognition: {
		included: false,
		costPerResident: 21.99,
		note: 'Optional add-on - residents pay individually',
	},
	installation: 1000, // Fixed installation cost
};

const amazonKeyProposal = {
	vendor: 'Amazon',
	system: 'Key Access Control System (Add-on to Linear)',
	installation: 500, // Installation cost for Linear integration
	activationFees: 998, // Virtual Key ($399) + Intercom Boost ($599)
	monthlyFee: 50, // Virtual Key ($20) + Intercom Boost ($30)
	phoneLineFee: 40, // Monthly phone line cost
	models: [
		{
			name: 'Virtual Key + Intercom Boost',
			description: 'Integrates with existing Linear access panel',
			price: '$998 activation',
		},
	],
	integration: {
		linear: true,
		description: 'Works with existing Linear telephone entry systems',
		phoneLineRequired: 'Uses existing Linear phone connection',
		installation: 'Minimal - adds to existing system',
	},
	notes: 'Integrates with existing Linear system - no replacement needed',
};

// Computed properties
const discountMultiplier = computed(() => {
	switch (selectedTimeframe.value) {
		case 0:
			return 0.95; // 5% annual discount (1 year)
		case 1:
			return 0.9; // 10% 3-year discount
		case 2:
			return 0.85; // 15% 5-year discount
		default:
			return 1;
	}
});

const discountLabel = computed(() => {
	switch (selectedTimeframe.value) {
		case 0:
			return '5%';
		case 1:
			return '10%';
		case 2:
			return '15%';
		default:
			return '0%';
	}
});

const calculateTotalCost = computed(() => {
	const months = selectedTimeframe.value === 0 ? 12 : selectedTimeframe.value === 1 ? 36 : 60;
	const swiftlaneMonthlyWithDiscount = Math.round(swiftlaneProposal.subscription.monthly * discountMultiplier.value);
	const swiftlaneTotal =
		swiftlaneProposal.hardware.total + swiftlaneProposal.installation + swiftlaneMonthlyWithDiscount * months;
	const unifiTotal = unifiProposal.phase1.cost;
	// Amazon Key now includes phone line costs
	const amazonKeyTotal =
		amazonKeyProposal.activationFees +
		amazonKeyProposal.installation +
		(amazonKeyProposal.monthlyFee + amazonKeyProposal.phoneLineFee) * months;

	return {
		swiftlane: swiftlaneTotal,
		unifi: unifiTotal,
		amazonKey: amazonKeyTotal,
		months,
		swiftlaneMonthlyWithDiscount,
	};
});

const timeframePeriodLabel = computed(() => {
	switch (selectedTimeframe.value) {
		case 0:
			return '1-Year';
		case 1:
			return '3-Year';
		case 2:
			return '5-Year';
		default:
			return '1-Year';
	}
});

const recurringCostComparison = computed(() => {
	const years = selectedTimeframe.value === 0 ? 1 : selectedTimeframe.value === 1 ? 3 : 5;
	const swiftlaneTotal = Math.round(swiftlaneProposal.subscription.monthly * discountMultiplier.value) * 12 * years;
	const amazonKeyTotal = (amazonKeyProposal.monthlyFee + 40) * 12 * years;
	const savings = amazonKeyTotal - swiftlaneTotal;

	return {
		swiftlaneTotal,
		amazonKeyTotal,
		savings,
		years,
	};
});
</script>

<style scoped>
table {
	font-size: 0.875rem;
}

@media (max-width: 768px) {
	table {
		font-size: 0.75rem;
	}
}

h1,
h2,
h3,
h4 {
	letter-spacing: 0.1em;
}

.tracking-wider {
	letter-spacing: 0.15em;
}

.tracking-widest {
	letter-spacing: 0.2em;
}
</style>
