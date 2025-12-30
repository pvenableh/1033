<template>
  <div
    v-motion="{
      initial: { y: -100, opacity: 0 },
      enter: { y: 0, opacity: 1 },
    }"
    class="w-full">
    <UAlert
      v-if="submitError"
      type="error"
      class="my-4"
      :description="submitError"
      color="red"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle" />

    <UAlert
      v-if="submitSuccess"
      class="my-4"
      color="green"
      variant="subtle"
      icon="i-heroicons-check-circle"
      title="Request Submitted"
      description="Your access request has been submitted. You will receive an email once approved." />

    <UForm
      v-if="!submitSuccess"
      :validate="validate"
      :state="state"
      class="grid gap-4"
      @submit="submitRequest">
      <div class="grid grid-cols-2 gap-4">
        <UFormGroup label="First Name" name="first_name" required>
          <UInput
            v-model="state.first_name"
            name="first_name"
            size="lg"
            :loading="loading"
            icon="i-heroicons-user"
            placeholder="John" />
        </UFormGroup>
        <UFormGroup label="Last Name" name="last_name" required>
          <UInput
            v-model="state.last_name"
            name="last_name"
            size="lg"
            :loading="loading"
            placeholder="Doe" />
        </UFormGroup>
      </div>

      <UFormGroup label="Email" name="email" required>
        <UInput
          v-model="state.email"
          name="email"
          type="email"
          size="lg"
          :loading="loading"
          icon="i-heroicons-envelope"
          placeholder="name@domain.com" />
      </UFormGroup>

      <UFormGroup label="Phone" name="phone">
        <UInput
          v-model="state.phone"
          name="phone"
          type="tel"
          size="lg"
          :loading="loading"
          icon="i-heroicons-phone"
          placeholder="(555) 555-5555" />
      </UFormGroup>

      <UFormGroup label="Unit Number" name="unit_number" required hint="Your unit number at 1033 Lenox">
        <UInput
          v-model="state.unit_number"
          name="unit_number"
          size="lg"
          :loading="loading"
          icon="i-heroicons-home"
          placeholder="101" />
      </UFormGroup>

      <UFormGroup label="Residency Type" name="residency_type" required>
        <USelectMenu
          v-model="state.residency_type"
          :options="residencyTypes"
          size="lg"
          placeholder="Select your residency type" />
      </UFormGroup>

      <UFormGroup label="Password" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          size="lg"
          :loading="loading"
          icon="i-heroicons-lock-closed"
          placeholder="Create a password" />
      </UFormGroup>

      <UFormGroup label="Confirm Password" name="confirm_password" required>
        <UInput
          v-model="state.confirm_password"
          type="password"
          size="lg"
          :loading="loading"
          icon="i-heroicons-lock-closed"
          placeholder="Confirm your password" />
      </UFormGroup>

      <UFormGroup name="agreement">
        <UCheckbox
          v-model="state.agreement"
          name="agreement"
          label="I confirm that I am a resident or owner at 1033 Lenox" />
      </UFormGroup>

      <UButton
        type="submit"
        :loading="loading"
        :disabled="!isFormValid"
        size="lg"
        label="Request Access"
        trailing-icon="i-heroicons-arrow-right"
        block />
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { FormError } from '#ui/types';
import { createDirectus, rest, createUser } from '@directus/sdk';

const config = useRuntimeConfig();
const loading = ref(false);
const submitError = ref<string | null>(null);
const submitSuccess = ref(false);

const residencyTypes = [
  { label: 'Owner', value: 'owner' },
  { label: 'Resident/Tenant', value: 'resident' },
];

const state = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  unit_number: '',
  residency_type: null as { label: string; value: string } | null,
  password: '',
  confirm_password: '',
  agreement: false,
});

const isFormValid = computed(() => {
  return (
    state.first_name &&
    state.last_name &&
    state.email &&
    state.unit_number &&
    state.residency_type &&
    state.password &&
    state.confirm_password &&
    state.password === state.confirm_password &&
    state.agreement
  );
});

const validate = async (formState: typeof state): Promise<FormError[]> => {
  const errors: FormError[] = [];
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

  if (!formState.first_name) {
    errors.push({ path: 'first_name', message: 'First name is required' });
  }

  if (!formState.last_name) {
    errors.push({ path: 'last_name', message: 'Last name is required' });
  }

  if (!formState.email) {
    errors.push({ path: 'email', message: 'Email is required' });
  } else if (!emailRegex.test(formState.email)) {
    errors.push({ path: 'email', message: 'Please enter a valid email address' });
  }

  if (!formState.unit_number) {
    errors.push({ path: 'unit_number', message: 'Unit number is required' });
  }

  if (!formState.residency_type) {
    errors.push({ path: 'residency_type', message: 'Please select your residency type' });
  }

  if (!formState.password) {
    errors.push({ path: 'password', message: 'Password is required' });
  } else if (formState.password.length < 8) {
    errors.push({ path: 'password', message: 'Password must be at least 8 characters' });
  }

  if (formState.password !== formState.confirm_password) {
    errors.push({ path: 'confirm_password', message: 'Passwords do not match' });
  }

  if (!formState.agreement) {
    errors.push({ path: 'agreement', message: 'You must confirm your residency' });
  }

  // Check if email already exists
  if (formState.email && emailRegex.test(formState.email) && errors.filter(e => e.path === 'email').length === 0) {
    try {
      const response: any = await $fetch(
        `${config.public.adminUrl}/users?filter[email][_eq]=${formState.email}`,
        {
          headers: {
            Authorization: `Bearer ${config.public.staticToken}`,
          },
        }
      );

      if (response.data && response.data.length > 0) {
        errors.push({ path: 'email', message: 'This email is already registered' });
      }
    } catch (error) {
      // If we can't check, allow submission and let server handle it
      console.error('Failed to validate email uniqueness:', error);
    }
  }

  return errors;
};

async function submitRequest() {
  loading.value = true;
  submitError.value = null;

  try {
    // Create user via Directus API with 'Pending' role
    const response = await $fetch(`${config.public.adminUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.public.staticToken}`,
      },
      body: {
        first_name: state.first_name,
        last_name: state.last_name,
        email: state.email,
        phone: state.phone,
        password: state.password,
        status: 'draft', // Draft status until admin approves
        // The role should be set to 'Pending' role ID in Directus
        // You'll need to create this role in Directus and use its ID here
        // role: 'PENDING_ROLE_ID',
        // Store unit and residency type in user metadata or a related collection
        description: JSON.stringify({
          unit_number: state.unit_number,
          residency_type: state.residency_type?.value,
          requested_at: new Date().toISOString(),
        }),
      },
    });

    submitSuccess.value = true;

    // Optionally notify admins via email
    // await notifyAdmins();
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.data?.errors?.[0]?.message) {
      submitError.value = error.data.errors[0].message;
    } else {
      submitError.value = 'Failed to submit access request. Please try again.';
    }
  } finally {
    loading.value = false;
  }
}
</script>
