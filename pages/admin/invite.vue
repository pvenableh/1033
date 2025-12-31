<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: ['auth', 'role'],
});

const config = useRuntimeConfig();
const toast = useToast();
const { isAdmin } = useRoles();

const loading = ref(false);
const roles = ref<any[]>([]);
const units = ref<any[]>([]);
const emailError = ref<string | null>(null);
const checkingEmail = ref(false);

const state = reactive({
  email: '',
  first_name: '',
  last_name: '',
  role: null as string | null,
  unit_id: null as number | null,
});

const inviteSuccess = ref(false);
const invitedEmail = ref('');

const unitOptions = computed(() => {
  return units.value
    .map((unit) => ({
      id: unit.id,
      label: unit.number,
    }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label));
});

async function fetchRoles() {
  try {
    const response: any = await $fetch(`${config.public.adminUrl}/roles`, {
      params: {
        fields: 'id,name,description',
        sort: 'name',
      },
      headers: {
        Authorization: `Bearer ${config.public.staticToken}`,
      },
    });
    roles.value = response.data || [];
  } catch (error) {
    console.error('Failed to fetch roles:', error);
  }
}

async function fetchUnits() {
  try {
    const response: any = await $fetch(`${config.public.adminUrl}/items/units`, {
      params: {
        fields: 'id,number',
        filter: JSON.stringify({ status: { _eq: 'published' } }),
        sort: 'number',
      },
      headers: {
        Authorization: `Bearer ${config.public.staticToken}`,
      },
    });
    units.value = response.data || [];
  } catch (error) {
    console.error('Failed to fetch units:', error);
  }
}

async function checkEmailExists(email: string): Promise<boolean> {
  if (!email) return false;

  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
  if (!emailRegex.test(email)) return false;

  checkingEmail.value = true;
  emailError.value = null;

  try {
    const response: any = await $fetch(
      `${config.public.adminUrl}/users`,
      {
        params: {
          filter: JSON.stringify({ email: { _eq: email } }),
          fields: 'id,email,status',
        },
        headers: {
          Authorization: `Bearer ${config.public.staticToken}`,
        },
      }
    );

    if (response.data && response.data.length > 0) {
      const existingUser = response.data[0];
      emailError.value = `This email is already registered (status: ${existingUser.status})`;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to check email:', error);
    return false;
  } finally {
    checkingEmail.value = false;
  }
}

async function sendInvite() {
  if (!state.email || !state.role) return;

  loading.value = true;
  emailError.value = null;

  try {
    // Check if email already exists
    const emailExists = await checkEmailExists(state.email);
    if (emailExists) {
      loading.value = false;
      return;
    }

    // Get the unit number from the selected unit
    const selectedUnit = units.value.find(u => u.id === state.unit_id);
    const unitNumber = selectedUnit?.number;

    // Create user with 'invited' status
    await $fetch(`${config.public.adminUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.public.staticToken}`,
      },
      body: {
        email: state.email,
        first_name: state.first_name,
        last_name: state.last_name,
        role: state.role,
        status: 'invited',
        description: state.unit_id ? JSON.stringify({ unit_id: state.unit_id, unit_number: unitNumber }) : null,
      },
    });

    // Send invite email via Directus
    await $fetch(`${config.public.adminUrl}/users/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.public.staticToken}`,
      },
      body: {
        email: state.email,
        role: state.role,
        invite_url: `${config.public.siteUrl}/auth/user-invite`,
      },
    });

    invitedEmail.value = state.email;
    inviteSuccess.value = true;

    toast.add({
      title: 'Invite Sent',
      description: `Invitation email sent to ${state.email}`,
      color: 'green',
    });

    // Reset form
    state.email = '';
    state.first_name = '';
    state.last_name = '';
    state.role = null;
    state.unit_id = null;
    emailError.value = null;
  } catch (error: any) {
    console.error('Failed to send invite:', error);
    toast.add({
      title: 'Error',
      description: error.data?.errors?.[0]?.message || 'Failed to send invite',
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  inviteSuccess.value = false;
  invitedEmail.value = '';
  emailError.value = null;
}

onMounted(() => {
  fetchRoles();
  fetchUnits();
});
</script>

<template>
  <div class="container mx-auto px-6 py-8">
    <div class="max-w-lg mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink to="/admin/users" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Back to Users
        </NuxtLink>
        <h1 class="text-2xl font-bold">Invite User</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Send an invitation to a new resident
        </p>
      </div>

      <!-- Access Denied -->
      <div v-if="!isAdmin" class="text-center py-12">
        <UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
      </div>

      <!-- Success Message -->
      <UCard v-else-if="inviteSuccess">
        <div class="text-center py-8">
          <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold mb-2">Invitation Sent</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            An invitation email has been sent to <strong>{{ invitedEmail }}</strong>.
            They will receive instructions to complete their registration.
          </p>
          <div class="flex gap-3 justify-center">
            <UButton variant="soft" @click="resetForm">
              Send Another Invite
            </UButton>
            <UButton to="/admin/users">
              View All Users
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Invite Form -->
      <UCard v-else>
        <UForm :state="state" class="space-y-6" @submit="sendInvite">
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="First Name" name="first_name">
              <UInput
                v-model="state.first_name"
                placeholder="John"
                icon="i-heroicons-user" />
            </UFormGroup>
            <UFormGroup label="Last Name" name="last_name">
              <UInput
                v-model="state.last_name"
                placeholder="Doe" />
            </UFormGroup>
          </div>

          <UFormGroup label="Email" name="email" required :error="emailError">
            <UInput
              v-model="state.email"
              type="email"
              placeholder="john@example.com"
              icon="i-heroicons-envelope"
              :loading="checkingEmail"
              @blur="checkEmailExists(state.email)" />
          </UFormGroup>

          <UFormGroup label="Unit" name="unit_id">
            <USelectMenu
              v-model="state.unit_id"
              :options="unitOptions"
              value-attribute="id"
              option-attribute="label"
              placeholder="Select a unit"
              :loading="units.length === 0"
              searchable
              searchable-placeholder="Search units...">
              <template #leading>
                <UIcon name="i-heroicons-home" class="w-5 h-5 text-gray-400" />
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup label="Role" name="role" required>
            <USelectMenu
              v-model="state.role"
              :options="roles"
              value-attribute="id"
              option-attribute="name"
              placeholder="Select a role">
              <template #option="{ option }">
                <div>
                  <p class="font-medium">{{ option.name }}</p>
                  <p v-if="option.description" class="text-xs text-gray-500">{{ option.description }}</p>
                </div>
              </template>
            </USelectMenu>
          </UFormGroup>

          <UButton
            type="submit"
            :loading="loading"
            :disabled="!state.email || !state.role || !!emailError"
            block
            size="lg">
            Send Invitation
          </UButton>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
