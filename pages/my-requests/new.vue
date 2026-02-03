<script setup lang="ts">
import { useForm } from 'vee-validate';
import * as yup from 'yup';

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});

useSeoMeta({
  title: 'Submit a Request - 1033 Lenox',
  description: 'Submit a request to the board',
});

const { user } = useDirectusAuth();
const { createItem } = useDirectusItems();
const toast = useToast();
const router = useRouter();

// Get user's unit
const { data: userUnits } = await useAsyncData('user-units', async () => {
  if (!user.value?.id) return [];
  try {
    const { readItems } = useDirectusItems();
    const persons = await readItems('persons', {
      filter: { user: { _eq: user.value.id } },
      fields: ['id', 'unit.id', 'unit.unit_number'],
    });
    return persons?.[0]?.unit ? [persons[0].unit] : [];
  } catch {
    return [];
  }
});

// Form validation schema
const schema = yup.object({
  category: yup.string().required('Please select a category'),
  subject: yup.string().required('Subject is required').min(5, 'Subject must be at least 5 characters'),
  description: yup.string().required('Description is required').min(20, 'Please provide more details (at least 20 characters)'),
  priority: yup.string().default('medium'),
  contact_preference: yup.string().default('email'),
});

const { handleSubmit, errors, defineField, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    category: '',
    subject: '',
    description: '',
    priority: 'medium',
    contact_preference: 'email',
  },
});

const [category, categoryAttrs] = defineField('category');
const [subject, subjectAttrs] = defineField('subject');
const [description, descriptionAttrs] = defineField('description');
const [priority, priorityAttrs] = defineField('priority');
const [contact_preference, contactPrefAttrs] = defineField('contact_preference');

// Categories
const categories = [
  { value: 'maintenance', label: 'Maintenance', icon: 'i-heroicons-wrench-screwdriver', description: 'Report maintenance issues or repairs needed' },
  { value: 'suggestion', label: 'Suggestion', icon: 'i-heroicons-light-bulb', description: 'Share ideas or suggestions for improvement' },
  { value: 'question', label: 'Question', icon: 'i-heroicons-question-mark-circle', description: 'Ask a question about the building or policies' },
  { value: 'violation', label: 'Report Concern', icon: 'i-heroicons-exclamation-triangle', description: 'Report a rule violation or concern' },
  { value: 'volunteer', label: 'Volunteer', icon: 'i-heroicons-hand-raised', description: 'Offer to help with community initiatives' },
  { value: 'inquiry', label: 'General Inquiry', icon: 'i-heroicons-chat-bubble-left-right', description: 'Other inquiries or requests' },
];

// Priority options
const priorities = [
  { value: 'low', label: 'Low', description: 'Not urgent' },
  { value: 'medium', label: 'Medium', description: 'Normal priority' },
  { value: 'high', label: 'High', description: 'Important' },
  { value: 'emergency', label: 'Emergency', description: 'Urgent - requires immediate attention' },
];

// Contact preferences
const contactPreferences = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'Text Message', label: 'Text Message' },
];

// Submit handler
const onSubmit = handleSubmit(async (values) => {
  try {
    const unitId = userUnits.value?.[0]?.id;

    const result = await createItem('requests', {
      ...values,
      name: `${user.value?.first_name || ''} ${user.value?.last_name || ''}`.trim(),
      email: user.value?.email,
      phone: user.value?.phone || '',
      unit: unitId || null,
      status: 'new',
    });

    // Send email notification
    try {
      await $fetch('/api/email/request', {
        method: 'POST',
        body: {
          subject: values.subject,
          description: values.description,
          category: values.category,
          name: `${user.value?.first_name || ''} ${user.value?.last_name || ''}`.trim(),
          email: user.value?.email,
          unit: userUnits.value?.[0]?.unit_number || 'N/A',
          contact_preference: values.contact_preference,
        },
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    toast.add({
      icon: 'i-heroicons-check-circle',
      title: 'Request Submitted',
      description: 'Your request has been sent to the board',
      color: 'green',
    });

    // Navigate to the new request
    router.push(`/my-requests/${result.id}`);
  } catch (error: any) {
    toast.add({
      icon: 'i-heroicons-exclamation-triangle',
      title: 'Submission Failed',
      description: error.message || 'Please try again',
      color: 'red',
    });
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <!-- Back button -->
    <NuxtLink
      to="/my-requests"
      class="inline-flex items-center gap-2 text-sm t-text-secondary hover:t-text mb-6"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
      Back to My Requests
    </NuxtLink>

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold t-text">Submit a Request</h1>
      <p class="text-sm t-text-secondary mt-1">
        Send a request to the board. You'll be able to track its status and communicate via messages.
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- Category Selection -->
      <div class="space-y-3">
        <label class="block text-sm font-medium t-text">
          Category <span class="text-destructive">*</span>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="cat in categories"
            :key="cat.value"
            type="button"
            @click="category = cat.value"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :class="category === cat.value
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'"
          >
            <UIcon :name="cat.icon" class="w-6 h-6 mb-2" :class="category === cat.value ? 'text-primary' : 't-text-muted'" />
            <p class="font-medium text-sm t-text">{{ cat.label }}</p>
            <p class="text-xs t-text-muted mt-1">{{ cat.description }}</p>
          </button>
        </div>
        <p v-if="errors.category" class="text-sm text-destructive">{{ errors.category }}</p>
      </div>

      <!-- Subject -->
      <div class="space-y-2">
        <label for="subject" class="block text-sm font-medium t-text">
          Subject <span class="text-destructive">*</span>
        </label>
        <input
          id="subject"
          v-model="subject"
          v-bind="subjectAttrs"
          type="text"
          placeholder="Brief summary of your request"
          class="w-full px-4 py-3 rounded-lg border border-border bg-background t-text focus:outline-none focus:ring-2 focus:ring-primary"
          :class="{ 'border-destructive': errors.subject }"
        />
        <p v-if="errors.subject" class="text-sm text-destructive">{{ errors.subject }}</p>
      </div>

      <!-- Description -->
      <div class="space-y-2">
        <label for="description" class="block text-sm font-medium t-text">
          Description <span class="text-destructive">*</span>
        </label>
        <textarea
          id="description"
          v-model="description"
          v-bind="descriptionAttrs"
          rows="5"
          placeholder="Provide details about your request..."
          class="w-full px-4 py-3 rounded-lg border border-border bg-background t-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          :class="{ 'border-destructive': errors.description }"
        ></textarea>
        <p v-if="errors.description" class="text-sm text-destructive">{{ errors.description }}</p>
      </div>

      <!-- Priority -->
      <div class="space-y-2">
        <label class="block text-sm font-medium t-text">Priority</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in priorities"
            :key="p.value"
            type="button"
            @click="priority = p.value"
            class="px-4 py-2 rounded-lg border transition-all"
            :class="priority === p.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border t-text-secondary hover:border-primary/50'"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- Contact Preference -->
      <div class="space-y-2">
        <label class="block text-sm font-medium t-text">Preferred Contact Method</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="pref in contactPreferences"
            :key="pref.value"
            type="button"
            @click="contact_preference = pref.value"
            class="px-4 py-2 rounded-lg border transition-all"
            :class="contact_preference === pref.value
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border t-text-secondary hover:border-primary/50'"
          >
            {{ pref.label }}
          </button>
        </div>
      </div>

      <!-- User Info Display -->
      <div class="bg-muted/50 rounded-lg p-4">
        <p class="text-sm font-medium t-text mb-2">Contact Information</p>
        <div class="space-y-1 text-sm t-text-secondary">
          <p>Name: {{ user?.first_name }} {{ user?.last_name }}</p>
          <p>Email: {{ user?.email }}</p>
          <p v-if="userUnits?.[0]">Unit: {{ userUnits[0].unit_number }}</p>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex gap-4 pt-4">
        <NuxtLink
          to="/my-requests"
          class="px-6 py-3 border border-border rounded-lg t-text hover:bg-muted transition-colors"
        >
          Cancel
        </NuxtLink>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
            Submitting...
          </span>
          <span v-else>Submit Request</span>
        </button>
      </div>
    </form>
  </div>
</template>
