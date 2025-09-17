<template>
	<div v-if="email" class="max-w-2xl mx-auto bg-white">
		<!-- Introduction -->
		<div class="px-0 text-gray-600 mb-6">
			<p class="text-base leading-5 mb-3">
				We highly value security and are always looking to improve this feature for our community.🔒
			</p>
			<p>
				This is why the Board conducted a comprehensive evaluation of multiple security systems (
				<a href="https://1033lenox.com/access-control" style="color: #00bfff; font-weight: bold">
					view full comparison analysis
				</a>
				) and selected
				<a href="https://swiftlane.com/" style="color: #00bfff; font-weight: bold" target="_blank">
					<strong>Swiftlane</strong>
				</a>
				as our new access control solution.
			</p>
			<p>
				This investment demonstrates our
				<strong>commitment to enhancing building security</strong>
				with the most advanced access control technology available.
			</p>
			<p>
				A
				<strong>follow-up email</strong>
				will be sent to each owner and current tenants with
				<strong style="color: #00bfff">onboarding instructions</strong>
				. The process is simple and managed by each user.
			</p>
			<p>Please note, the previous Linear panel was beyond repair and needed to be replaced.</p>
			<div class="text-base leading-5" v-html="email.content"></div>
		</div>

		<!-- SwiftReader Intercom Section -->
		<div class="px-0 mb-6">
			<div class="text-center mb-6">
				<h3 class="text-lg font-bold text-gray-600">🚀📱 INTRODUCING SWIFTREADER X INTERCOM</h3>
			</div>

			<!-- Product Images -->
			<div class="bg-gray-50 border border-blue-500 p-0 mb-6">
				<div class="grid grid-cols-1 md:grid-cols-2">
					<div class="text-center p-6">
						<img
							src="https://admin.1033lenox.com/assets/aefbb2a4-cc01-460d-a79b-2a627e80df38?key=medium-png"
							alt="SwiftReader X Intercom System"
							class="w-full max-w-xs mx-auto mb-3"
						/>
						<p class="text-sm font-bold text-[var(--blue)]">8" HD Video Intercom Display</p>
					</div>
					<div class="text-center p-6">
						<img
							src="https://admin.1033lenox.com/assets/6f5f0c1f-1b7f-45ea-9f79-f4c763a7bbbd?key=medium-png"
							alt="SwiftReader X Features"
							class="w-full max-w-xs mx-auto mb-3"
						/>
						<p class="text-sm font-bold text-[var(--blue)]">Advanced Security Features</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Why SwiftLane Selected -->
		<div class="px-0 mb-6">
			<h3 class="text-lg font-bold text-gray-600 text-center mb-6">🏆 WHY SWIFTLANE WAS SELECTED:</h3>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div class="bg-blue-50 p-4 text-center">
					<div class="text-[var(--blue)] font-bold text-sm mb-2">
						🤖 ONLY SYSTEM
						<br />
						WITH
					</div>
					<div class="font-bold text-gray-600 text-sm mb-1">Facial Recognition</div>
					<div class="text-gray-600 text-sm">AI Loiter Detection</div>
				</div>
				<div class="bg-blue-50 p-4 text-center">
					<div class="text-[var(--blue)] font-bold text-sm mb-2">↔️ EXPANDABLE SYSTEM</div>
					<div class="font-bold text-gray-600 text-sm mb-1">Vehicle Access</div>
					<div class="text-gray-600 text-sm">Smart Locks</div>
				</div>
				<div class="bg-blue-50 p-4 text-center">
					<div class="text-[var(--blue)] font-bold text-sm mb-2">🛡️ MAXIMUM SECURITY</div>
					<div class="font-bold text-gray-600 text-sm mb-1">IK10 Vandal Proof</div>
					<div class="text-gray-600 text-sm">+ Insurance Coverage</div>
				</div>
			</div>
		</div>

		<!-- Due Diligence Comparison -->
		<div class="px-0 mb-6">
			<h3 class="text-lg font-bold text-gray-600 text-center mb-4">⚖️📊 DUE DILIGENCE COMPARISON</h3>

			<div class="text-center mb-4">
				<p class="text-sm text-gray-600">
					📊
					<a href="https://1033lenox.com/access-control" class="text-[var(--blue)] font-bold hover:underline">
						View Complete Comparison Analysis
					</a>
				</p>
			</div>

			<div class="overflow-x-auto mb-6">
				<table class="w-full border-collapse text-xs">
					<thead>
						<tr class="bg-[var(--blue)] text-white">
							<th class="border border-white p-2 font-bold text-left">FEATURE</th>
							<th class="border border-white p-2 font-bold text-center">UNIFI G3</th>
							<th class="border border-white p-2 font-bold text-center bg-blue-700">✅ SWIFTLANE</th>
							<th class="border border-white p-2 font-bold text-center">AMAZON KEY</th>
						</tr>
					</thead>
					<tbody>
						<tr class="bg-gray-50">
							<td class="border border-[var(--blue)] p-2 font-bold">Facial Recognition</td>
							<td class="border border-[var(--blue)] p-2 text-center">❌ None</td>
							<td class="border border-[var(--blue)] p-2 text-center bg-blue-50 font-bold">✅ $21.99/year</td>
							<td class="border border-[var(--blue)] p-2 text-center">❌ None</td>
						</tr>
						<tr>
							<td class="border border-[var(--blue)] p-2 font-bold">Monthly Costs</td>
							<td class="border border-[var(--blue)] p-2 text-center">$0</td>
							<td class="border border-[var(--blue)] p-2 text-center bg-blue-50 font-bold">$26 - $30</td>
							<td class="border border-[var(--blue)] p-2 text-center">$80 - $120</td>
						</tr>
						<tr class="bg-gray-50">
							<td class="border border-[var(--blue)] p-2 font-bold">Data Ownership</td>
							<td class="border border-[var(--blue)] p-2 text-center">100% Building</td>
							<td class="border border-[var(--blue)] p-2 text-center bg-blue-50 font-bold">100% Building</td>
							<td class="border border-[var(--blue)] p-2 text-center">❌ Amazon Owns</td>
						</tr>
						<tr>
							<td class="border border-[var(--blue)] p-2 font-bold">Delivery Management</td>
							<td class="border border-[var(--blue)] p-2 text-center">Manual Only</td>
							<td class="border border-[var(--blue)] p-2 text-center bg-blue-50 font-bold">
								UPS/FedEx/Amazon + Photos
							</td>
							<td class="border border-[var(--blue)] p-2 text-center">Amazon Only</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<!-- SwiftLane Security Features -->
		<div class="px-0 mb-6">
			<h3 class="text-lg font-bold text-gray-600 text-center mb-6">🔒 SWIFTLANE SECURITY FEATURES:</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Access Methods -->
				<div class="text-center">
					<div class="text-blue-700 font-bold text-base mb-3">🔐 5 ACCESS METHODS</div>
					<div class="grid grid-cols-5 gap-1 text-xs">
						<div class="bg-white border border-gray-300 p-2 text-center">
							👤
							<br />
							<small>FACE</small>
						</div>
						<div class="bg-white border border-gray-300 p-2 text-center">
							📱
							<br />
							<small>MOBILE</small>
						</div>
						<div class="bg-white border border-gray-300 p-2 text-center">
							🔢
							<br />
							<small>PIN</small>
						</div>
						<div class="bg-white border border-gray-300 p-2 text-center">
							🎤
							<br />
							<small>VOICE</small>
						</div>
						<div class="bg-white border border-gray-300 p-2 text-center">
							☎️
							<br />
							<small>CALL</small>
						</div>
					</div>
				</div>

				<!-- AI Security Monitoring -->
				<div>
					<div class="text-[var(--blue)] font-bold text-base mb-3 text-center">🤖 AI SECURITY MONITORING</div>
					<ul class="text-sm text-gray-700 space-y-1 text-left">
						<li>Real-time loiter detection</li>
						<li>Continuous video recording</li>
						<li>Instant security alerts</li>
						<li>Unlimited cloud storage</li>
					</ul>
				</div>

				<!-- Smart Delivery Hub -->
				<div>
					<div class="text-blue-800 font-bold text-base mb-3 text-center">📦 SMART DELIVERY HUB</div>
					<ul class="text-sm text-gray-700 space-y-1 text-left">
						<li>UPS/FedEx Pins + Amazon Key</li>
						<li>Photo documentation</li>
						<li>Secure package handling</li>
						<li>Delivery notifications</li>
					</ul>
				</div>

				<!-- Advanced Connectivity -->
				<div>
					<div class="text-blue-900 font-bold text-base mb-3 text-center">📶 ADVANCED CONNECTIVITY</div>
					<ul class="text-sm text-gray-700 space-y-1 text-left">
						<li>Cellular backup system</li>
						<li>No phone line needed</li>
						<li>Saves $480/year</li>
						<li>Enterprise encryption</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Resident Information -->
		<div class="bg-[var(--blue)] text-white p-6 mb-6">
			<h3 class="text-lg font-bold text-center mb-4">📲 RESIDENT INFORMATION:</h3>

			<div class="mb-4">
				<h4 class="font-bold text-sm mb-2">✅ WHAT'S INCLUDED FOR ALL RESIDENTS:</h4>
				<ul class="text-sm space-y-1">
					<li>Mobile app with video calling</li>
					<li>HD video intercom communication</li>
					<li>Smart delivery management</li>
					<li>Complete system training</li>
					<li>24/7 technical support</li>
				</ul>
			</div>

			<div>
				<h4 class="font-bold text-sm mb-2">💡 OPTIONAL UPGRADE:</h4>
				<ul class="text-sm space-y-1">
					<li>
						<strong>Facial Recognition:</strong>
						$21.99/year per resident (completely optional)
					</li>
					<li>AI-powered recognition technology</li>
					<li>Hands-free building access</li>
				</ul>
			</div>
		</div>

		<!-- Installation Date -->
		<div class="text-center py-6 mx-0 mb-6 rounded">
			<div class="text-xl font-bold text-gray-700 mb-2">📅 INSTALLATION: SEPTEMBER 17-18, 2025</div>
			<div class="text-base font-bold text-gray-700">10:00 AM - 4:00 PM | Minimal Building Disruption Expected</div>
		</div>

		<!-- Questions/Contact -->
		<div class="border border-gray-300 p-4 mx-0 mb-6">
			<div class="text-center font-bold text-gray-700 mb-4 text-sm">QUESTIONS OR CONCERNS?</div>
			<div class="text-sm text-gray-600">
				<p class="font-semibold text-center mb-0 -ml-10">Building Management:</p>
				<ul class="text-left max-w-[200px] space-y-0.5 mx-auto">
					<li>Valentin T. Escribano</li>
					<li>VTE Consulting</li>
					<li>305-603-7879</li>
					<li>valentin@vteconsultingllc.com</li>
				</ul>
			</div>
		</div>

		<!-- Thank You Message -->
		<div class="px-0 py-6 mb-6">
			<p class="text-[var(--blue)] font-bold text-base mb-3">
				Thank you for your patience during this security enhancement!
			</p>
			<p class="text-gray-700 text-sm">
				We thank you for your support and patience as we work together in enhancing the security of 1033 Lenox and
				building our community.
			</p>
		</div>
	</div>
</template>

<script setup>
const props = defineProps({
	email: {
		type: Object,
		required: true,
	},
});
</script>

<style scoped>
/* Custom styles for responsive tables */
@media (max-width: 640px) {
	.overflow-x-auto table {
		font-size: 10px;
	}

	.grid-cols-5 > div {
		font-size: 10px;
		padding: 4px;
	}
}

/* Ensure proper link styling */
a {
	color: var(--blue);
	text-decoration: underline;
}

a:hover {
	text-decoration: underline;
}
</style>
