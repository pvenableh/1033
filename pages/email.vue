<template>
  <div class="relative max-w-4xl px-6 pt-12 pb-24 mx-auto space-y-8">
    <button @click.prevent="sendEmail()">Send</button>
    <button @click.prevent="sendHello()">Send</button>
    <div class="w-full">{{ response }}</div>
  </div>
</template>

<script setup>
const response = ref({})
const loading = ref(false)
const email = ref('')
const content = ref({
            email: 'contact@huestudios.com',
            first_name: 'Peter',
            unit: '314',
            title: "Mandatory Access to All Units",
            subtitle: "Submit a Copy of Your Keys by Feb 17, 2023",
            urgent: true,
            content: "<p>As you have seen and experienced, we have began our 40 Year Certification Work in order that we can stay open.</p>\n<p>We <strong>will need access to all units MULTIPLE TIMES</strong> to perform electrical, plumbing, structural, mold, etc... services from now into the next the few months.</p>\n<p>In order to perform this time sensitive and expensive work, we ask that each resident submit a copy of the key to the front door in the case the days the contractors are here or you are not available.</p>\n<p><strong>We will give all residents a 24 hour notice</strong>, and that is best we can do. This is going to be very labor intensive and there will be A LOT OF WORK ahead and we cannot get behind schedule because this will cost more on all the owners. Contractors need to complete the work according to the agreements.</p>\n<p><strong>All keys will be locked in a safe and only used if it is absolutely necessary</strong> if you are not available or away. We will reach out to residents for permission to enter within the 24 hour window, however, if we don't get a response to confirm that you will be home or that we can enter, we as the association have the right to enter as per our Bylaws (see below), our legal team, and because it has been voted by the board on Feb 10th, 2023.</p>\n<p><a href=\"https://admin.1033lenox.com/assets/1d454dca-c6ca-4330-aa35-17827eeec026\" target=\"_blank\" rel=\"noopener\"><img style=\"display: block; margin-left: auto; margin-right: auto;\" src=\"https://admin.1033lenox.com/assets/1d454dca-c6ca-4330-aa35-17827eeec026?key=medium\" alt=\"Mandatory Access By Law\" /></a></p>\n<p>In the days that the contractors are scheduled to enter residences, we also ask that you put away your valuables and secure your pets.</p>\n<p>Please submit a copy of your key to our Secretary Camila Hoffman unit 314 by Feb 17th, 2023.</p>\n<p>We appreciate your cooperation in advance as we work together to restore our building.</p>",
})
function sendHello() {
    $fetch('/api/test', { method: 'post', body: { content: 'Peter' }}).then(function(res) {
        console.log(res)
    })
}
async function sendEmail() {
  loading.value = true
  const { data } = await useFetch('/api/email/announcement', {
    method: 'POST',
    body: content.value
  })
  console.log(data)
  response.value = data.value
  loading.value = false
}
</script>
