<script setup>
const props = defineProps({
	user: {
		type: Object,
		default: null,
	},
});

function getBoardMemberByYear(obj, targetYear) {
	if (Array.isArray(obj)) {
		// If it's an array, recursively check each element
		for (let i = 0; i < obj.length; i++) {
			const result = getBoardMemberByYear(obj[i], targetYear);

			if (result) {
				return result; // If a matching object is found, return it
			}
		}

		return null; // If no matching object is found in the array
	} else if (typeof obj === 'object' && obj !== null) {
		// If it's an object, recursively check each property
		for (let key in obj) {
			if (key === 'board_member' && Array.isArray(obj[key]) && obj[key].length > 0) {
				// Check if 'board_member' array has an object with the target year
				const matchingMember = obj[key].find((member) => member.year === targetYear);
				return matchingMember || null; // Return the matching member or null if not found
			} else {
				const result = getBoardMemberByYear(obj[key], targetYear);

				if (result) {
					return result; // If a matching object is found, return it
				}
			}
		}

		return null; // If no matching object is found in the object
	}

	return null; // If it's neither an array nor an object
}

const boardMember = getBoardMemberByYear(props.user, '2023');
</script>
<template>
	<div class="grid grid-flow-row-dense grid-cols-2 gap-x-4 gap-y-12 lg:gap-y-20 lg:gap-x-10 dashboard">
		<div class="col-span-2 mt-8">
			<h2 class="text-3xl">
				{{ greetUser() }}
				<span class="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-600 font-bold">
					{{ user.first_name }}.
				</span>
			</h2>
		</div>
		<InsightsBoardMember :board-member="boardMember" class="col-span-2 lg:col-span-1" v-if="boardMember" />
		<InsightsPerson :user="user" class="col-span-2 lg:col-span-1" />
		<InsightsReserves class="col-span-2 lg:col-span-1" />
		<InsightsNewsletter class="col-span-2 lg:col-span-1" />
		<InsightsMeetings class="col-span-2 lg:col-span-1" />
		<InsightsAnnouncements class="col-span-2 lg:col-span-1" />
		<InsightsBoard class="col-span-2" />
		<InsightsUnits class="col-span-2" />
	</div>
</template>

<style>
.insight {
	@media (min-width: theme('screens.lg')) {
		min-height: 300px;
	}

	&__label {
		font-size: 12px;
		line-height: 15px;
		@apply uppercase tracking-wider border-b;
	}

	&__title {
		font-size: 48px;
		background: linear-gradient(75deg, var(--pink), var(--purple));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		@apply font-bold;
	}

	&__subtitle {
		font-size: 12px;
		line-height: 15px;
		@apply uppercase tracking-wider mb-6;
	}

	&__link {
		font-size: 12px;
		line-height: 15px;
		/* color: var(--white);
		background: var(--blue); */
		@apply font-bold uppercase tracking-wider px-6 py-2;

		span {
			margin-bottom: -2px;
			@apply inline-block;
		}
	}

	&__button {
		font-size: 10px;
		line-height: 14px;
		color: var(--white);
		background: var(--grey);
		@apply font-bold uppercase tracking-wider px-4 py-1 rounded-xl;

		span {
			margin-bottom: -2px;
			@apply inline-block;
		}
	}
}
</style>
