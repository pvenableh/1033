<script setup>
const props = defineProps({
	tenant: {
		type: Object,
		default: null,
	},
});

const activeLease = computed(() => {
	if (props.tenant.leases) {
		return props.tenant.leases.find((lease) => {
			return new Date(lease.start) <= new Date() && new Date(lease.finish) >= new Date();
		});
	} else {
		return null;
	}
});
</script>
<template>
	<div class="tenants">
		<h3 class="uppercase tracking-wide text-sm">
			<span class="opacity-50">Tenant:</span>
			{{ tenant.first_name }} {{ tenant.last_name }}
		</h3>
		<p class="uppercase tracking-wide text-sm">
			<span v-if="tenant.email" class="opacity-50">Email:</span>
			{{ tenant.email }}
		</p>
		<p class="uppercase tracking-wide text-sm">
			<span v-if="tenant.phone" class="opacity-50">Phone:</span>
			{{ tenant.phone }}
		</p>
		<p v-if="tenant.leases && activeLease" class="tracking-wide uppercase text-sm">
			<span class="opacity-50">Lease:</span>
			Expires on {{ getFriendlyDateTwo(activeLease.finish) }}
		</p>
		<p v-else class="tracking wide text-red uppercase font-bold text-sm">No Lease!</p>
		<a
			v-if="tenant.leases && activeLease"
			:href="'https://admin.1033lenox.com/assets/' + activeLease.file"
			class="mt-2 btn"
			target="_blank">
			View Lease Document
		</a>
	</div>
</template>
<style></style>
