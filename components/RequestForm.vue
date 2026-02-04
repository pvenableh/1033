<script setup lang="ts">
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';
import confetti from 'canvas-confetti';

// Props for configuration
interface Props {
  // Form identification
  formId?: string;
  formName?: string;

  // Category configuration
  category?: string; // Fixed category (e.g., 'question', 'inquiry')
  categoryOptions?: { value: string; label: string; icon?: string; description?: string }[];

  // Subject configuration
  subjectOptions?: string[]; // If provided, shows a select; otherwise shows text input

  // Field visibility
  showUnit?: boolean;
  showPhone?: boolean;
  showContactPreference?: boolean;
  showPriority?: boolean;

  // For authenticated users
  requireAuth?: boolean;

  // Display
  title?: string;
  subtitle?: string;
  submitLabel?: string;

  // Callbacks
  onSuccess?: (request: any) => void;
}

const props = withDefaults(defineProps<Props>(), {
  formId: 'request-form',
  formName: 'Request Form',
  showUnit: true,
  showPhone: false,
  showContactPreference: false,
  showPriority: false,
  requireAuth: false,
  title: 'Submit a Request',
  subtitle: 'Complete the form below to submit your request.',
  submitLabel: 'Submit',
});

const emit = defineEmits(['submitted', 'reset']);

// Composables
const { user } = useDirectusAuth();
const unitsCollection = useDirectusItems('units', { requireAuth: false });
const requestsCollection = useDirectusItems('requests', { requireAuth: false });
const toast = useToast();
const router = useRouter();

// State
const isSubmitting = ref(false);
const panel = ref<'form' | 'success'>('form');
const direction = ref<'forward' | 'backward'>('forward');
const submittedData = ref<any>(null);

// Form analytics (optional)
const formAnalytics = useFormAnalytics({
  formId: props.formId,
  formName: props.formName,
  trackFieldInteractions: true,
  trackValidationErrors: true,
  trackAbandonmentOnUnload: true,
});

// Confetti helper
function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const launchConfetti = () => {
  confetti({
    angle: randomInRange(55, 125),
    spread: randomInRange(50, 70),
    particleCount: randomInRange(50, 100),
    origin: { y: 0.6 },
  });
};

// Build validation schema dynamically based on props
const buildValidationSchema = () => {
  const schema: Record<string, any> = {
    subject: yup.string().required('Subject is required'),
    description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  };

  // Name and email required for public forms
  if (!props.requireAuth) {
    schema.name = yup.string().required('Name is required');
    schema.email = yup.string().email('Please enter a valid email').required('Email is required');
  }

  // Category required if options provided
  if (props.categoryOptions && props.categoryOptions.length > 0) {
    schema.category = yup.string().required('Please select a category');
  }

  // Optional fields
  if (props.showUnit) {
    schema.unit = props.requireAuth ? yup.string() : yup.string();
  }
  if (props.showPhone) {
    schema.phone = yup.string();
  }
  if (props.showContactPreference) {
    schema.contact_preference = yup.string().required('Please select a contact preference');
  }
  if (props.showPriority) {
    schema.priority = yup.string();
  }

  return yup.object(schema);
};

const validationSchema = buildValidationSchema();

// Initialize form
const { handleSubmit, resetForm } = useForm({
  validationSchema,
  initialValues: {
    name: '',
    email: '',
    phone: '',
    unit: '',
    category: props.category || '',
    subject: '',
    description: '',
    contact_preference: 'email',
    priority: 'medium',
  },
});

// Setup fields
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: phone } = useField<string>('phone');
const { value: unit, errorMessage: unitError } = useField<string>('unit');
const { value: category, errorMessage: categoryError } = useField<string>('category');
const { value: subject, errorMessage: subjectError } = useField<string>('subject');
const { value: description, errorMessage: descriptionError } = useField<string>('description');
const { value: contact_preference, errorMessage: preferenceError } = useField<string>('contact_preference');
const { value: priority } = useField<string>('priority');

// Load units for dropdown
const units = ref<any[]>([]);
const loadingUnits = ref(true);

onMounted(async () => {
  if (props.showUnit) {
    try {
      const result = await unitsCollection.list({
        fields: ['id', 'number', 'status'],
        filter: { status: { _eq: 'published' } },
      });
      units.value = result || [];
    } catch {
      units.value = [];
    } finally {
      loadingUnits.value = false;
    }
  } else {
    loadingUnits.value = false;
  }

  // Pre-fill for authenticated users
  if (props.requireAuth && user.value) {
    name.value = `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim();
    email.value = user.value.email || '';
  }
});

const formattedUnitOptions = computed(() => {
  return units.value
    .map((item) => ({
      value: String(item.id),
      label: item.number,
    }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label));
});

// Contact preference options - dynamic based on available contact info
const contactPreferenceOptions = computed(() => {
  const options = ['Email'];
  if (phone.value?.trim()) {
    options.push('Phone', 'Text');
  }
  return options;
});

// Priority options
const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'emergency', label: 'Emergency' },
];

// Panel navigation
const handleNext = () => {
  direction.value = 'forward';
  panel.value = 'success';
  launchConfetti();
};

const handleReset = () => {
  direction.value = 'backward';
  panel.value = 'form';
  resetForm();
  submittedData.value = null;
  formAnalytics.resetFormAnalytics();
  emit('reset');
};

// Form submission
const onSubmit = handleSubmit(async (values) => {
  try {
    isSubmitting.value = true;

    // Track form submission
    formAnalytics.trackFormSubmit({
      category: values.category || props.category,
      has_unit: !!values.unit,
    });

    // Determine final category
    const finalCategory = props.category || values.category;

    // Get unit number for email
    let unitNumber = values.unit;
    if (values.unit && props.showUnit) {
      const unitDetails = units.value.find((u) => String(u.id) === values.unit);
      unitNumber = unitDetails?.number || values.unit;
    }

    // Prepare request data
    const requestData = {
      name: props.requireAuth && user.value
        ? `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim()
        : values.name,
      email: props.requireAuth && user.value ? user.value.email : values.email,
      phone: values.phone || '',
      unit: values.unit || null,
      subject: values.subject,
      description: values.description,
      category: finalCategory,
      priority: values.priority || 'medium',
      contact_preference: values.contact_preference || 'email',
      status: 'new',
    };

    // Submit to Directus
    const request = await requestsCollection.create(requestData);

    // Send email notification
    try {
      await $fetch('/api/email/request', {
        method: 'POST',
        body: {
          id: request.id,
          name: requestData.name,
          email: requestData.email,
          phone: requestData.phone,
          unit: unitNumber || 'N/A',
          subject: requestData.subject,
          description: requestData.description,
          category: finalCategory,
          priority: requestData.priority,
          preference: requestData.contact_preference,
          date_created: request.date_created,
        },
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    // Store submitted data for success panel
    submittedData.value = {
      ...requestData,
      id: request.id,
    };

    // Show success toast
    toast.add({
      icon: 'i-heroicons-check-circle',
      title: 'Request Submitted',
      description: 'Your request has been submitted successfully.',
      color: 'green',
    });

    // Emit and callback
    emit('submitted', request);
    if (props.onSuccess) {
      props.onSuccess(request);
    }

    // Show success panel
    handleNext();
  } catch (error: any) {
    console.error('Error submitting request:', error);

    formAnalytics.trackFormError({
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    toast.add({
      icon: 'i-heroicons-exclamation-triangle',
      title: 'Error',
      description: 'There was an error submitting your request. Please try again.',
      color: 'red',
    });
  } finally {
    isSubmitting.value = false;
  }
});

// Get display name for category
const getCategoryLabel = (cat: string) => {
  if (props.categoryOptions) {
    const option = props.categoryOptions.find((o) => o.value === cat);
    return option?.label || cat;
  }
  return cat;
};
</script>

<template>
  <div class="w-full">
    <Transition
      :enter-active-class="'transition duration-300 ease-out'"
      :enter-from-class="direction === 'forward' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0'"
      :enter-to-class="'translate-x-0 opacity-100'"
      :leave-active-class="'transition duration-300 ease-in absolute w-full'"
      :leave-from-class="'translate-x-0 opacity-100'"
      :leave-to-class="direction === 'forward' ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'"
      mode="out-in"
    >
      <!-- Form Panel -->
      <div v-if="panel === 'form'" key="form-panel" class="w-full">
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold t-text uppercase tracking-wider">{{ title }}</h2>
          <p class="text-sm t-text-secondary mt-1">{{ subtitle }}</p>
        </div>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <!-- Category Selection (if options provided) -->
          <div v-if="categoryOptions && categoryOptions.length > 0" class="space-y-2">
            <label class="block text-sm font-medium t-text">
              Category <span class="text-destructive">*</span>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="cat in categoryOptions"
                :key="cat.value"
                type="button"
                @click="category = cat.value"
                class="p-4 rounded-lg border-2 text-left transition-all"
                :class="category === cat.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'"
              >
                <UIcon v-if="cat.icon" :name="cat.icon" class="w-6 h-6 mb-2" :class="category === cat.value ? 'text-primary' : 't-text-muted'" />
                <p class="font-medium text-sm t-text">{{ cat.label }}</p>
                <p v-if="cat.description" class="text-xs t-text-muted mt-1">{{ cat.description }}</p>
              </button>
            </div>
            <p v-if="categoryError" class="text-sm text-destructive">{{ categoryError }}</p>
          </div>

          <!-- Name and Email (for public forms) -->
          <div v-if="!requireAuth" class="grid sm:grid-cols-2 gap-4">
            <FormCustomInput
              label="Name"
              v-model="name"
              :error-message="nameError"
              variant="underline"
              required
            />
            <FormCustomInput
              label="Email"
              v-model="email"
              type="email"
              placeholder="name@domain.com"
              :error-message="emailError"
              variant="underline"
              required
            />
          </div>

          <!-- Phone and Contact Preference -->
          <div v-if="showPhone || showContactPreference" class="grid sm:grid-cols-2 gap-4">
            <FormCustomInput
              v-if="showPhone"
              label="Phone"
              v-model="phone"
              type="tel"
              placeholder="(555) 555-5555"
              variant="underline"
            />
            <FormGroup v-if="showContactPreference" label="Contact Preference" required :error="preferenceError">
              <Select
                v-model="contact_preference"
                :options="contactPreferenceOptions"
                placeholder="Select preference"
              />
            </FormGroup>
          </div>

          <!-- Subject (select or text input) -->
          <div class="grid sm:grid-cols-2 gap-4">
            <FormGroup v-if="subjectOptions && subjectOptions.length > 0" label="Subject" required :error="subjectError">
              <Select
                v-model="subject"
                :options="subjectOptions"
                placeholder="Select a subject"
              />
            </FormGroup>
            <FormCustomInput
              v-else
              label="Subject"
              v-model="subject"
              placeholder="Brief summary of your request"
              :error-message="subjectError"
              variant="underline"
              required
            />

            <!-- Unit Selection -->
            <FormGroup v-if="showUnit" label="Unit" :error="unitError">
              <Select
                v-model="unit"
                :options="formattedUnitOptions"
                placeholder="Select your unit"
                :loading="loadingUnits"
              />
            </FormGroup>
          </div>

          <!-- Priority -->
          <div v-if="showPriority" class="space-y-2">
            <label class="block text-sm font-medium t-text">Priority</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="p in priorityOptions"
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

          <!-- Description -->
          <FormGroup label="Description" required :error="descriptionError">
            <TipTap
              v-model="description"
              placeholder="Please provide detailed information about your request"
              :allow-uploads="false"
              rows="4"
            />
          </FormGroup>

          <!-- User Info Display (for authenticated users) -->
          <div v-if="requireAuth && user" class="bg-muted/50 rounded-lg p-4">
            <p class="text-sm font-medium t-text mb-2">Contact Information</p>
            <div class="space-y-1 text-sm t-text-secondary">
              <p>Name: {{ user.first_name }} {{ user.last_name }}</p>
              <p>Email: {{ user.email }}</p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-4">
            <Button type="button" color="gray" variant="soft" @click="handleReset">
              Reset
            </Button>
            <Button type="submit" color="primary" :loading="isSubmitting" :disabled="isSubmitting">
              {{ isSubmitting ? 'Submitting...' : submitLabel }}
            </Button>
          </div>
        </form>
      </div>

      <!-- Success Panel -->
      <div v-else key="success-panel" class="w-full min-h-[400px] flex items-center justify-center flex-col text-center">
        <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mb-4" />
        <h3 class="text-xl font-bold t-text uppercase tracking-wider">
          Thank you
          <span v-if="submittedData?.name" class="text-primary">
            {{ submittedData.name.split(' ')[0] }}
          </span>
        </h3>
        <p class="my-6 t-text-secondary max-w-md">
          Your
          <span class="font-semibold text-primary">
            {{ getCategoryLabel(submittedData?.category || category || 'request') }}
          </span>
          <span v-if="submittedData?.subject"> regarding "{{ submittedData.subject }}"</span>
          has been submitted successfully.
        </p>
        <p class="text-sm t-text-muted mb-6">
          We'll review your request and get back to you soon.
        </p>
        <div class="flex gap-4">
          <Button @click="handleReset" variant="soft" color="gray">
            Submit Another
          </Button>
          <NuxtLink
            v-if="submittedData?.id && requireAuth"
            :to="`/requests/${submittedData.id}`"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            View Request
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Transition styles are handled inline */
</style>
