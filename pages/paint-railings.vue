<script setup>
const { readItems } = useDirectusItems();

const renderings = await readItems('renderings', {
	fields: ['*'],
});
</script>
<template>
	<div class="flex items-center justify-center flex-col renderings">
		<div
			v-for="(item, index) in renderings"
			:key="index"
			class="flex items-center justify-center flex-col renderings__item"
		>
			<h3 class="renderings__item-title">{{ item.title }}</h3>
			<h4 class="renderings__item-subtitle">
				<span class="">Building Color:</span>
				{{ item.building_color }}
			</h4>
			<h4 class="renderings__item-subtitle">
				<span class="">Gate Color:</span>
				{{ item.gate_color }}
			</h4>
			<h4 class="renderings__item-subtitle">
				<span class="">Cost:</span>
				${{ item.cost }} / unit
			</h4>
			<h4 v-if="item.extra_cost" class="renderings__item-subtitle">
				<span class="">Extra Cost:</span>
				{{ item.extra_cost }}
			</h4>

			<img :src="'https://admin.1033lenox.com/assets/' + item.image + '?key=large'" :alt="item.title" />
		</div>
	</div>
</template>
<style lang="postcss">
.renderings {
	&__title {
		@apply uppercase;
	}
	&__subtitle {
		@apply uppercase;
	}
}
</style>
