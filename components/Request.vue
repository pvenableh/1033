<script setup lang="ts">
/**
 * Request Component
 * Wrapper around RequestForm for maintenance/general requests
 * Requires authentication
 */

const emit = defineEmits(['submitted']);

const categories = [
  { value: 'maintenance', label: 'Maintenance', icon: 'i-heroicons-wrench-screwdriver', description: 'Report maintenance issues or repairs needed' },
  { value: 'suggestion', label: 'Suggestion', icon: 'i-heroicons-light-bulb', description: 'Share ideas or suggestions for improvement' },
  { value: 'question', label: 'Question', icon: 'i-heroicons-question-mark-circle', description: 'Ask a question about the building or policies' },
  { value: 'violation', label: 'Report Concern', icon: 'i-heroicons-exclamation-triangle', description: 'Report a rule violation or concern' },
  { value: 'volunteer', label: 'Volunteer', icon: 'i-heroicons-hand-raised', description: 'Offer to help with community initiatives' },
  { value: 'inquiry', label: 'General Inquiry', icon: 'i-heroicons-chat-bubble-left-right', description: 'Other inquiries or requests' },
];

const handleSubmitted = (request: any) => {
  emit('submitted', request);
};
</script>

<template>
  <div class="w-full">
    <RequestForm
      form-id="maintenance-request-form"
      form-name="Maintenance Request Form"
      title="Submit a Request"
      subtitle="Send a request to the board. You'll be able to track its status and communicate via messages."
      :category-options="categories"
      :show-unit="false"
      :show-phone="false"
      :show-contact-preference="true"
      :show-priority="true"
      :require-auth="true"
      submit-label="Submit Request"
      @submitted="handleSubmitted"
    />
  </div>
</template>
