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

const state = reactive({
  email: '',
  first_name: '',
  last_name: '',
  role: null as string | null,
  unit_number: '',
});

const inviteSuccess = ref(false);
const invitedEmail = ref('');

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

async function sendInvite() {
  if (!state.email || !state.role) return;

  loading.value = true;

  try {
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
        description: state.unit_number ? JSON.stringify({ unit_number: state.unit_number }) : null,
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
    state.unit_number = '';
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
}

onMounted(() => {
  fetchRoles();
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

          <UFormGroup label="Email" name="email" required>
            <UInput
              v-model="state.email"
              type="email"
              placeholder="john@example.com"
              icon="i-heroicons-envelope" />
          </UFormGroup>

          <UFormGroup label="Unit Number" name="unit_number">
            <UInput
              v-model="state.unit_number"
              placeholder="101"
              icon="i-heroicons-home" />
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
            :disabled="!state.email || !state.role"
            block
            size="lg">
            Send Invitation
          </UButton>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
