<template>
	<div v-if="email" class="max-w-2xl mx-auto bg-white">
		<!-- Setup Instructions -->
		<div
			class="my-8 bg-cover bg-center bg-no-repeat h-[200px] flex items-center justify-center bg-blend-darken bg-[rgba(0,0,0,0.5)] text-white"
			style="
				background-image: url('https://admin.1033lenox.com/assets/9c983bb2-8bc8-4836-8a6d-314efdd68b78?key=large-png');
			"
		>
			<p style="text-transform: uppercase; margin-top: 0px; letter-spacing: 0.1em; font-size: 28px; line-height: 30p">
				Setting Up Swiftlane
			</p>
		</div>
		<div class="px-0 mb-8">
			<h3 class="text-center uppercase font-bold text-gray-700 text-lg mb-4">How to setup the Swiftlane App</h3>
			<p class="text-center text-gray-600 mb-2 max-w-lg mx-auto">📋Here is a simple list of steps to get started:</p>

			<ol class="text-sm text-gray-700 space-y-3 max-w-md mx-auto leading-relaxed">
				<li>
					You will receive an email invite from Swiftlane (verification@swiftlane.com) to
					{{ email.email || 'your email' }}
				</li>
				<li>
					Note the workspace and email in the invite:
					<ul class="ml-4 mt-2 space-y-1">
						<li>
							Workspace:
							<strong>1033lenox</strong>
						</li>
						<li>
							Email:
							<strong>{{ email.email || 'your email' }}</strong>
						</li>
					</ul>
				</li>
				<li>
					Download the Swiftlane app from the
					<a href="https://apps.apple.com/us/app/swiftlane-id/id1465204078" style="color: #3a1deb; font-weight: bold">
						Apple
					</a>
					or
					<a
						href="https://play.google.com/store/apps/details?id=com.swiftlane.employee"
						style="color: #3a1deb; font-weight: bold"
					>
						Google
					</a>
					store
				</li>
				<li>
					Enter the workspace name:
					<strong>1033lenox</strong>
				</li>
				<li>
					Enter the email from the invite:
					<strong>{{ email.email || 'your email' }}</strong>
				</li>
				<li>Check your email for verification code</li>
				<li>Enter verification code in the app</li>
				<li>Review and accept terms and policies</li>
				<li>
					<span class="text-green-600 font-bold text-xs">[OPTIONAL]</span>
					Setup Face ID if you want
				</li>
				<li>
					<span class="text-green-600 font-bold text-xs">[OPTIONAL]</span>
					Enable bluetooth and camera [for video intercom calls]
				</li>
			</ol>

			<div class="text-left text-gray-600 text-sm mt-6 space-y-3 max-w-[480px] mx-auto leading-relaxed">
				<p>
					Each user can choose to be called via phone number [with no video intercom calls] or via the app [enables
					video intercom calls].
				</p>
				<p>
					Please note, active tenants and owners will all receive an invitation. Owners who don't live here will not be
					listed on the directory, but will have Swiftlane access.
				</p>
			</div>
		</div>

		<!-- Free Trial Section -->
		<div class="bg-[#3A1DEB] text-white p-8 mb-8">
			<h3 class="text-center text-2xl font-bold uppercase tracking-wide mb-4">
				Facial Recognition +
				<br />
				Passcodes Free Trial
			</h3>
			<div class="text-left mx-auto space-y-2 leading-relaxed max-w-[310px]">
				<p>Every user has a free 30-day trial to use the facial recognition and visitor passes features.</p>
				<p>
					After that, each user can choose to subscribe to $21.99/year per user. This is not required for pin and app
					access.
				</p>
			</div>
		</div>

		<!-- App Links Section -->
		<div class="px-0 mb-8">
			<h3 class="text-center text-2xl font-bold uppercase tracking-wide text-gray-700 mb-6">Swiftlane Links</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<!-- Apple Store -->
				<div class="text-center">
					<a href="https://apps.apple.com/us/app/swiftlane-id/id1465204078" target="_blank">
						<img
							src="https://admin.1033lenox.com/assets/0785f18e-de67-43d6-ae69-3127d55d6ddc"
							alt="Download on App Store"
							class="mx-auto w-32 mb-4"
						/>
					</a>
				</div>

				<!-- Google Play -->
				<div class="text-center">
					<a href="https://play.google.com/store/apps/details?id=com.swiftlane.employee" target="_blank">
						<img
							src="https://admin.1033lenox.com/assets/187e19fb-d808-4789-9909-e5bf55fa4374"
							alt="Get it on Google Play"
							class="mx-auto w-32 mb-4"
						/>
					</a>
				</div>

				<!-- Video Instructions -->
				<div class="text-center">
					<a href="https://www.youtube.com/watch?v=y9uaGc9V0RQ" target="_blank">
						<img
							src="https://admin.1033lenox.com/assets/70e32a52-4553-483e-bed3-2983be75ed6b"
							alt="Video Instructions"
							class="mx-auto w-20 mb-2"
						/>
						<div class="text-xs uppercase font-bold text-[#3A1DEB] tracking-wide">Video Instructions</div>
					</a>
				</div>

				<!-- PDF Instructions -->
				<div class="text-center">
					<a href="https://admin.1033lenox.com/assets/ea67a298-9c7c-49a7-8843-3983ac11d302" target="_blank">
						<img
							src="https://admin.1033lenox.com/assets/76fc96c1-69ed-4d6c-b047-3ee11baa4d5c"
							alt="PDF Instructions"
							class="mx-auto w-20 mb-2"
						/>
						<div class="text-xs uppercase font-bold text-[#3A1DEB] tracking-wide">PDF Instructions</div>
					</a>
				</div>
			</div>
		</div>

		<!-- Instructions Preview -->
		<div class="px-0 mb-6">
			<div class="border-2 border-[#3A1DEB] rounded-sm p-4">
				<a href="https://admin.1033lenox.com/assets/ea67a298-9c7c-49a7-8843-3983ac11d302" target="_blank">
					<img
						src="https://admin.1033lenox.com/assets/f8aa337f-dbd7-4436-b487-b1f45e19f187?key=large-png"
						alt="Setup Instructions Preview"
						class="w-full"
					/>
				</a>
			</div>
		</div>

		<!-- Thank You Message -->
		<div class="px-0 py-0 mb-0">
			<div class="text-sm text-gray-600 leading-relaxed">
				<div class="text-base leading-5" v-html="email.content"></div>
				<p>
					We thank you for your support and patience as we work together in enhancing the security of 1033 Lenox and
					building our community.
				</p>
			</div>
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
/* Custom styles for responsive design */
@media (max-width: 640px) {
	.grid-cols-1.md\:grid-cols-2 {
		grid-template-columns: 1fr;
	}
}

/* Ensure proper link styling */
a {
	color: #3a1deb;
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}
</style>
