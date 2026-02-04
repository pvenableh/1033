<script setup lang="ts">
import { ref, computed } from "vue";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, ShieldAlert } from "lucide-vue-next";

definePageMeta({
  layout: "default",
  middleware: ["auth", "role"],
});

useSeoMeta({
  title: 'Invite User - Admin',
});

const config = useRuntimeConfig();
const toast = useToast();
const { isAdmin } = useRoles();

const emailError = ref<string | null>(null);
const checkingEmail = ref(false);

const inviteSuccess = ref(false);
const invitedEmail = ref("");

// Fetch roles using server API endpoint
const { data: rolesData, pending: rolesPending } = useLazyFetch<any[]>(
  "/api/directus/roles",
  {
    server: false,
    default: () => [],
  }
);

// Fetch units using server API endpoint
const { data: unitsData, pending: unitsPending } = useLazyFetch<any[]>(
  "/api/directus/items",
  {
    method: "POST",
    body: {
      collection: "units",
      operation: "list",
      query: {
        fields: ["id", "number"],
        filter: { status: { _eq: "published" } },
        sort: ["number"],
      },
    },
    server: false,
    default: () => [],
  }
);

const roles = computed(() => rolesData.value || []);
const units = computed(() => unitsData.value || []);

const roleOptions = computed(() => {
  return roles.value.map((role: any) => ({
    value: role.id,
    label: role.name,
  }));
});

const unitOptions = computed(() => {
  return units.value
    .map((unit: any) => ({
      value: unit.id,
      label: unit.number,
    }))
    .sort((a: any, b: any) => parseInt(a.label) - parseInt(b.label));
});

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.string().min(1, "Please select a role"),
  unit_id: z.string().or(z.number()).optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const formSchema = toTypedSchema(inviteSchema);

const { handleSubmit, isSubmitting, setFieldError, resetForm } =
  useForm<InviteFormValues>({
    validationSchema: formSchema,
    initialValues: {
      email: "",
      first_name: "",
      last_name: "",
      role: "",
      unit_id: "",
    },
  });

async function checkEmailExists(email: string): Promise<boolean> {
  if (!email) return false;

  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
  if (!emailRegex.test(email)) return false;

  checkingEmail.value = true;
  emailError.value = null;

  try {
    const response: any = await $fetch("/api/directus/users", {
      method: "POST",
      body: {
        operation: "check-email",
        email,
      },
    });

    if (response.exists) {
      emailError.value = `This email is already registered (status: ${response.user.status})`;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to check email:", error);
    return false;
  } finally {
    checkingEmail.value = false;
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  emailError.value = null;

  // Check if email already exists
  const emailExists = await checkEmailExists(formValues.email);
  if (emailExists) {
    setFieldError("email", emailError.value || "Email already registered");
    return;
  }

  try {
    // Get the unit number from the selected unit
    const unitId =
      typeof formValues.unit_id === "string" && formValues.unit_id
        ? parseInt(formValues.unit_id)
        : formValues.unit_id;
    const selectedUnit = units.value.find((u: any) => u.id === unitId);
    const unitNumber = selectedUnit?.number;

    // Create user with 'invited' status using server API endpoint
    await $fetch("/api/directus/users", {
      method: "POST",
      body: {
        operation: "create",
        data: {
          email: formValues.email,
          first_name: formValues.first_name,
          last_name: formValues.last_name,
          role: formValues.role,
          status: "invited",
          description: unitId
            ? JSON.stringify({ unit_id: unitId, unit_number: unitNumber })
            : null,
        },
      },
    });

    // Send invite email via server API endpoint
    await $fetch("/api/directus/users/invite", {
      method: "POST",
      body: {
        email: formValues.email,
        role: formValues.role,
        invite_url: `${config.public.siteUrl}/auth/user-invite`,
      },
    });

    invitedEmail.value = formValues.email;
    inviteSuccess.value = true;

    toast.add({
      title: "Invite Sent",
      description: `Invitation email sent to ${formValues.email}`,
      color: "green",
    });

    // Reset form
    resetForm();
    emailError.value = null;
  } catch (error: any) {
    console.error("Failed to send invite:", error);
    toast.add({
      title: "Error",
      description:
        error.data?.message ||
        error.data?.errors?.[0]?.message ||
        "Failed to send invite",
      color: "red",
    });
  }
});

function resetInviteForm() {
  inviteSuccess.value = false;
  invitedEmail.value = "";
  emailError.value = null;
  resetForm();
}
</script>

<template>
  <div class="admin-page t-bg min-h-full">
    <div class="container mx-auto px-6 py-8">
      <div class="max-w-lg mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <NuxtLink
            to="/admin/users"
            class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
          >
            <Icon name="i-heroicons-arrow-left" class="w-4 h-4" />
            Back to Users
          </NuxtLink>
          <h1 class="text-2xl font-bold">Invite User</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Send an invitation to a new resident
          </p>
        </div>

        <!-- Access Denied -->
        <div v-if="!isAdmin" class="text-center py-12">
          <ShieldAlert class="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
        </div>

        <!-- Success Message -->
        <Card v-else-if="inviteSuccess" class="p-6">
          <div class="text-center py-8">
            <CheckCircle class="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 class="text-xl font-semibold mb-2">Invitation Sent</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              An invitation email has been sent to
              <strong>{{ invitedEmail }}</strong
              >. They will receive instructions to complete their registration.
            </p>
            <div class="flex gap-3 justify-center">
              <Button variant="outline" @click="resetInviteForm">
                Send Another Invite
              </Button>
              <Button as-child>
                <NuxtLink to="/admin/users">View All Users</NuxtLink>
              </Button>
            </div>
          </div>
        </Card>

        <!-- Invite Form -->
        <Card v-else class="p-6">
          <form @submit="onSubmit" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <VeeField v-slot="{ field, errors }" name="first_name">
                <FormCustomInput
                  id="first_name"
                  label="First Name"
                  type="text"
                  placeholder="John"
                  v-bind="field"
                  :error-message="errors[0]"
                  variant="underline"
                />
              </VeeField>

              <VeeField v-slot="{ field, errors }" name="last_name">
                <FormCustomInput
                  id="last_name"
                  label="Last Name"
                  type="text"
                  placeholder="Doe"
                  v-bind="field"
                  :error-message="errors[0]"
                  variant="underline"
                />
              </VeeField>
            </div>

            <VeeField v-slot="{ field, errors }" name="email">
              <FormCustomInput
                id="email"
                label="Email"
                type="email"
                placeholder="john@example.com"
                v-bind="field"
                :error-message="errors[0] || emailError"
                variant="underline"
                @blur="checkEmailExists(String(field.value || ''))"
              />
            </VeeField>

            <VeeField v-slot="{ field, errors }" name="unit_id">
              <div class="space-y-2">
                <Label for="unit_id" class="text-sm font-medium leading-none">
                  Unit
                </Label>
                <Select
                  id="unit_id"
                  :model-value="field.value"
                  :options="unitOptions"
                  placeholder="Select a unit"
                  :disabled="unitsPending"
                  @update:model-value="field.onChange"
                />
                <p v-if="errors[0]" class="text-sm text-destructive">
                  {{ errors[0] }}
                </p>
              </div>
            </VeeField>

            <VeeField v-slot="{ field, errors }" name="role">
              <div class="space-y-2">
                <Label for="role" class="text-sm font-medium leading-none">
                  Role <span class="text-destructive">*</span>
                </Label>
                <Select
                  id="role"
                  :model-value="field.value"
                  :options="roleOptions"
                  placeholder="Select a role"
                  :disabled="rolesPending"
                  @update:model-value="field.onChange"
                />
                <p v-if="errors[0]" class="text-sm text-destructive">
                  {{ errors[0] }}
                </p>
              </div>
            </VeeField>

            <Button
              type="submit"
              class="w-full"
              :disabled="isSubmitting || checkingEmail"
            >
              <Loader2
                v-if="isSubmitting || checkingEmail"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ isSubmitting ? "Sending..." : "Send Invitation" }}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  </div>
</template>
