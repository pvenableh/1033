<script setup>
useSeoMeta({
  title: 'Submit Inquiry - 1033 Lenox',
  description: 'Submit an inquiry to the 1033 Lenox Board',
});

const subjectOptions = ['General', 'Purchase / Sale', 'Rental', 'Other'];
</script>

<template>
  <div class="w-full max-w-[650px] px-4 py-10 mx-auto">
    <RequestForm
      form-id="inquiry-form"
      form-name="Inquiry Form"
      category="inquiry"
      title="Submit Your Inquiry"
      subtitle="Complete the form below to submit an inquiry to 1033 Lenox."
      :subject-options="subjectOptions"
      :show-unit="true"
      :show-phone="true"
      :show-contact-preference="true"
      :require-auth="false"
      submit-label="Submit Inquiry"
    />
  </div>
</template>
