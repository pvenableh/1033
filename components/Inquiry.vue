<script setup>
/**
 * Inquiry Component
 * Wrapper around RequestForm for inquiry submissions
 * Used on index pages in bottom sheets
 */

const subjectOptions = ['General', 'Purchase / Sale', 'Rental', 'Other'];
</script>

<template>
  <div class="w-full max-w-[650px] py-6 px-4 mx-auto bg-background">
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
