<template>
	<div class="w-full flex items-center justify-center flex-col">
		<div class="w-full h-4 email__border"></div>
		<div class="w-full flex items-center justify-center flex-col email">
			<div class="w-full flex items-center justify-center email__header">
				<a href="https://1033lenox.com" class="inline-block">
					<img src="https://admin.1033lenox.com/assets/61e1a568-679d-4965-9527-c89009ee2486?key=large" />
				</a>
			</div>
			<div class="w-full flex items-center justify-center flex-col email__body" v-if="email">
				<div class="flex flex-row items-center justify-center mb-6">
					<p>🛡</p>
					<p
						class="text-center px-2"
						style="
							font-weight: 900;
							line-height: 1.1em;
							font-size: 10px;
							text-transform: uppercase;
							letter-spacing: 0.07em;
						"
					>
						Official Communication of the Lenox Plaza Association
					</p>
					<p>🛡</p>
				</div>
				<h3 class="email__title" :class="{ red: email.urgent }">
					<span v-if="email.urgent">🚨</span>
					<span v-else></span>
					{{ email.title }}
				</h3>
				<h5 class="email__subtitle">{{ email.subtitle }}</h5>
				<div class="w-full email__content">
					<p>{{ email.greeting }}</p>
					<div v-html="email.content"></div>

					<div class="w-full flex flex-row flex-wrap items-start signature">
						<p class="w-full font-bold greeting">{{ email.closing }}</p>
						<p class="w-full font-bold greeting">Lenox Plaza Association Board of Directors ☀️</p>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Peter Wyatt
							<span class="icon peter">🕶</span>
							<span class="title">President</span>
						</p>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Alejandro Salinas
							<span class="icon">🏍</span>
							<span class="title">Vice-President</span>
						</p>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Camila Hoffman
							<span class="icon">✨</span>
							<span class="title">Secretary</span>
						</p>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Nenad Rakita
							<span class="icon">🏊‍♂️</span>
							<span class="title">Treasurer</span>
						</p>
						<p class="tracking-wide font-bold uppercase w-full sm:w-1/2">
							Cecilia V. Demattos
							<span class="icon">🪴</span>
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
						src="https://admin.1033lenox.com/assets/a7e9ae99-656a-4c18-aeea-f96071ddcb57?key=large"
						alt="1033 Lenox Ave Building"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
const { params } = useRoute();

definePageMeta({
	layout: 'email',
});

const email = ref(null);
const url = 'https://admin.1033lenox.com/items/announcements?filter[url][_eq]=' + params.url;

const { data: announcement } = await useFetch(url);

email.value = announcement.value.data[0];
</script>
<style>
.email {
	max-width: 600px;
	line-height: 1.4em;
	font-size: 15px;
	padding: 0 10px;
	color: var(--black);

	@media (min-width: 400px) {
	}

	&__border {
		background: #555555;
	}

	&__header {
		img {
			max-width: 370px;
			padding: 20px 10px 10px;

			@media (min-width: 400px) {
				max-width: 400px;
			}
		}
	}

	&__body {
		padding: 20px 0px;
	}

	&__title {
		line-height: 1.2em;
		font-size: 16px;
		text-transform: uppercase;
		font-family: var(--font-bold) !important;
		font-weight: 900;
		@apply text-center tracking-wide;
	}

	&__title.red {
		color: var(--red);
	}

	&__subtitle {
		line-height: 1.2em;
		font-size: 12px;
		text-transform: uppercase;
		padding-bottom: 20px;
		padding-top: 10px;
		font-family: var(--font-bold) !important;
		font-weight: 900;
		@apply text-center tracking-wide;
	}

	&__content {
		padding: 20px 0px 20px;
		border-top: thin solid #999;
		border-bottom: thin solid #999;
		line-height: 1.4em !important;

		p {
			padding: 10px 0px 10px;
			line-height: 1.6em;
			font-weight: 600;
			/* font-family: var(--bold-font); */
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
			list-style-type: disc;
			padding: 2px 0px;
		}
	}

	.signature {
		.greeting {
			/* line-height: 1em; */
			font-size: 15px;
			/* margin-bottom: 0px;
      padding-bottom: 0px; */
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
			}
		}
	}

	&__footer {
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
}
</style>
