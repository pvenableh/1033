<script setup>
useSeoMeta({
  title: 'Ask a Question - 1033 Lenox',
  description: 'Submit a question about the 40-year inspection',
});

const subjectOptions = ['Structural', 'Electrical', 'Paint', 'Windows and Doors', 'Other'];
</script>

<template>
  <div class="w-full max-w-[650px] px-4 py-10 mx-auto">
    <RequestForm
      form-id="question-form"
      form-name="40YR Question Form"
      category="question"
      title="40YR Question Submission"
      subtitle="Complete the form below to submit a question for the general contractor to review."
      :subject-options="subjectOptions"
      :show-unit="true"
      :show-phone="false"
      :show-contact-preference="false"
      :require-auth="false"
      submit-label="Submit Question"
    />
  </div>
</template>
