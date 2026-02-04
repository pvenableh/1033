<template>
	<div class="w-full flex items-center justify-center flex-col">
		<div class="w-full h-4 email__border"></div>
		<div class="w-full flex items-center justify-center flex-col email">
			<div class="w-full flex items-center justify-center email__header">
				<a href="https://1033lenox.com" class="inline-block">
					<img src="https://admin.1033lenox.com/assets/3f1e971f-4d12-4d2d-b877-c4a54acdb741?key=large" />
				</a>
			</div>
			<div class="w-full flex items-center justify-center flex-col email__body" v-if="email">
				<div
					class="py-1 px-2 flex flex-row items-center justify-center bg-gray-100 shadow-inner mb-10 rounded-full hidden">
					<p>🛡</p>
					<p
						class="text-center px-2"
						style="
							font-weight: 900;
							line-height: 1.1em;
							font-size: 9px;
							text-transform: uppercase;
							letter-spacing: 0.05em;
						">
						Official Communication of the Lenox Plaza Association
					</p>
					<p>🛡</p>
				</div>
				<h3 class="email__title" :class="{red: email.urgent}">
					<span v-if="email.urgent">🚨</span>
					<span v-else></span>
					{{ email.title }}
				</h3>
				<h5 class="email__subtitle">{{ email.subtitle }}</h5>
				<div class="w-full mb-8 email__content">
					<p
						v-if="
							email.sendgrid_template_id !== 'd-272f3a32855b4c73aa557f88cbf0aec5' ||
							'd-493fe8a32f8140a8af63fdbda70af7b0'
						">
						{{ email.greeting }}
					</p>
					<AnnouncementsSwiftlaneEmail
						:email="email"
						v-if="email.sendgrid_template_id === 'd-6160b4b2faa74529a27f6c2ec90191f9'" />
					<AnnouncementsSwiftlaneGuide
						:email="email"
						v-else-if="email.sendgrid_template_id === 'd-272f3a32855b4c73aa557f88cbf0aec5'" />
					<AnnouncementsSwiftlaneInstalled
						:email="email"
						v-else-if="email.sendgrid_template_id === 'd-493fe8a32f8140a8af63fdbda70af7b0'" />

					<div v-else v-html="email.content"></div>

					<div class="w-full flex flex-row flex-wrap items-start signature">
						<p class="w-full font-bold greeting">{{ email.closing }}</p>

						<p
							v-if="email.sendgrid_template_id === 'd-5ae6a4c8bc8b4743969c23c0dca559f9'"
							class="w-full font-bold greeting mb-0">
							Camila Hoffman
							<span class="icon" style="font-size: 12px; margin-left: 2px; display: inline-block">✨</span>
							<span class="title tracking-wider" style="display: block; font-size: 7px; line-height: 12px">
								President
							</span>
						</p>
						<p v-else class="w-full font-bold greeting">Lenox Plaza Association Board of Directors ☀️</p>
					</div>
					<div class="w-full flex flex-row flex-wrap items-start board-signature">
						<h5 class="text-[9px] uppercase tracking-wide w-full mt-2 font-bold opacity-50">Board of Directors:</h5>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Camila Hoffman
							<span class="icon">✨</span>
							<span class="title">President</span>
						</p>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Alejandro Salinas
							<span class="icon">🏍</span>
							<span class="title">Vice-President</span>
						</p>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Peter Wyatt
							<span class="icon peter">🕶</span>
							<span class="title">Secretary</span>
						</p>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Nenad Rakita
							<span class="icon">🏊‍♂️</span>
							<span class="title">Treasurer</span>
						</p>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Nidia Cortes
							<span class="icon">🪴</span>
							<span class="title">Board Member</span>
						</p>
					</div>
				</div>
			</div>
			<div class="w-full text-center email__footer">
				<a href="https://1033lenox.com" class="font-bold tracking-wide uppercase" target="_blank">1033lenox.com</a>
				<h5 class="font-bold tracking-wide uppercase">
					&copy; {{ new Date().getFullYear() }} LENOX PLAZA ASSOCIATION INC.
				</h5>
				<div class="w-full">
					<img
						src="https://admin.1033lenox.com/assets/22f2b886-0804-4fa4-9661-27da9d2ce6a6?key=large"
						alt="1033 Lenox Ave Building" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
const {params} = useRoute();

definePageMeta({
	layout: 'email',
});

useSeoMeta({
	title: 'Announcement - 1033 Lenox',
});

const {data: email} = await useAsyncData(`announcement-${params.url}`, async () => {
	const results = await $fetch('/api/directus/items', {
		method: 'POST',
		body: {
			collection: 'announcements',
			operation: 'list',
			query: {
				filter: {
					url: {_eq: params.url},
				},
				fields: ['*'],
			},
		},
	});
	return results?.[0] || null;
});
// Even though `email.value` might be initially undefined,
// `useSeoMeta` will update reactively once `email.value` is ready.
useSeoMeta({
	title: () =>
		email.value?.title ? `${email.value.title}: ${email.value.subtitle} - 1033 Lenox` : '1033 Lenox Announcement',
	description: () => email.value?.summary || 'An announcement from 1033 Lenox.',
	ogTitle: () =>
		email.value?.title ? `${email.value.title}: ${email.value.subtitle} - 1033 Lenox` : '1033 Lenox Announcement',
	ogDescription: () => email.value?.summary || 'An announcement from 1033 Lenox.',
});
</script>
<style>
@reference "~/assets/css/tailwind.css";

.email {
	max-width: 600px;
	line-height: 1.4em;
	font-size: 15px;
	padding: 0 10px;
	color: var(--black);
	h3 {
		font-size: 20px;
		line-height: 22px;
		font-weight: 600;
		margin: 8px 0px 2px;
	}

	.signature {
		.greeting {
			font-size: 15px;
			line-height: 1.25em;
		}

		p {
			font-size: 10px;

			.icon {
				font-size: 12px;
				margin-left: 2px;
				@apply inline-block;
			}

			.title {
				display: block;
				font-size: 7px;
				line-height: 12px;
				@apply uppercase tracking-wide;
			}
		}
	}

	.board-signature {
		@apply border-t border-[#999999] mt-8 pt-4 flex flex-row flex-wrap;

		p {
			font-size: 10px;

			.icon {
				font-size: 12px;
				margin-left: 2px;
				@apply inline-block;
			}

			.title {
				display: block;
				font-size: 7px;
				line-height: 12px;
			}
		}
	}
}

.email__border {
	background: #555555;
}

.email__header {
	img {
		max-width: 175px;
		padding: 20px 0px 10px;
	}
}

.email__body {
	padding: 20px 0px;
}

.email__title {
	line-height: 1.2em;
	font-size: 16px;
	text-transform: uppercase;
	font-family: var(--font-bold) !important;
	font-weight: 900;
	@apply text-center tracking-wide;
}

.email__title.red {
	color: var(--red);
}

.email__subtitle {
	line-height: 1.2em;
	font-size: 12px;
	text-transform: uppercase;
	padding-bottom: 20px;
	padding-top: 10px;
	font-family: var(--font-bold) !important;
	font-weight: 900;
	@apply text-center tracking-wide;
}

.email__content {
	padding: 20px 0px 20px;
	border-top: thin solid #999;
	border-bottom: thin solid #999;
	line-height: 1.4em !important;

	p {
		padding: 10px 0px 10px;
		line-height: 1.6em;
		font-weight: 600;
	}

	a:link,
	a:visited {
		color: var(--blue) !important;
	}

	a:hover {
		color: var(--gray);
	}

	ul,
	ol {
		padding-left: 30px !important;
	}

	b,
	strong {
		font-family: var(--font-bold) !important;
		font-weight: 900;
	}

	li {
		padding: 2px 0px;
		font-weight: 600;
		@apply list-disc;
	}
}

.email__footer {
	padding: 20px 0px 0px;
	font-size: 10px;

	h5 {
		margin-top: 10px;
	}

	img {
		margin: 40px auto 0px;
		max-width: 250px;
	}
}
</style>
