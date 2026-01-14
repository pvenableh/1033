<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { refDebounced } from "@vueuse/core";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X } from "lucide-vue-next";

const submitError = ref<string | null>(null);
const submitSuccess = ref(false);

const residencyTypes = [
  { label: "Owner (I own a unit)", value: "Owner" },
  { label: "Tenant (I rent/lease a unit)", value: "Tenant" },
  { label: "Property Manager", value: "Property Manager" },
];

// Fetch units using server endpoint
const { data: unitsData, pending: unitsPending } = useLazyFetch<any[]>(
  "/api/public/units",
  {
    server: false,
    default: () => [],
  }
);

const units = computed(() => unitsData.value || []);

const unitOptions = computed(() => {
  return units.value
    .map((unit: any) => ({
      value: unit.id,
      label: unit.number,
    }))
    .sort((a: any, b: any) => parseInt(a.label) - parseInt(b.label));
});

const accessRequestSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z.string().optional(),
    unit_id: z
      .number({ required_error: "Please select a unit" })
      .or(z.string().min(1, "Please select a unit")),
    residency_type: z.string().min(1, "Please select your residency type"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
    agreement: z.boolean().refine((val) => val === true, {
      message: "You must confirm your residency",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type AccessRequestFormValues = z.infer<typeof accessRequestSchema>;

const formSchema = toTypedSchema(accessRequestSchema);

const { handleSubmit, isSubmitting, setFieldError, values } =
  useForm<AccessRequestFormValues>({
    validationSchema: formSchema,
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      unit_id: "",
      residency_type: "",
      password: "",
      confirm_password: "",
      agreement: false,
    },
  });

const passwordValue = ref("");
const debouncedPassword = refDebounced(passwordValue, 300);

const passwordRequirements = ref([
  { label: "At least 8 characters", met: false },
  { label: "One uppercase letter", met: false },
  { label: "One lowercase letter", met: false },
  { label: "One number", met: false },
]);

watch(debouncedPassword, (newPassword) => {
  const reqs = passwordRequirements.value;
  if (reqs[0]) reqs[0].met = newPassword.length >= 8;
  if (reqs[1]) reqs[1].met = /[A-Z]/.test(newPassword);
  if (reqs[2]) reqs[2].met = /[a-z]/.test(newPassword);
  if (reqs[3]) reqs[3].met = /[0-9]/.test(newPassword);
});

const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const response: any = await $fetch("/api/public/check-email", {
      method: "POST",
      body: { email },
    });
    return response.exists;
  } catch (error) {
    console.error("Failed to validate email uniqueness:", error);
    return false;
  }
};

const onSubmit = handleSubmit(async (formValues) => {
  submitError.value = null;

  // Check if email already exists
  const emailExists = await checkEmailExists(formValues.email);
  if (emailExists) {
    setFieldError("email", "This email is already registered");
    return;
  }

  try {
    // Get the unit number from the selected unit
    const unitId =
      typeof formValues.unit_id === "string"
        ? parseInt(formValues.unit_id)
        : formValues.unit_id;
    const selectedUnit = units.value.find((u: any) => u.id === unitId);
    const unitNumber = selectedUnit?.number;

    // Create user via server endpoint
    await $fetch("/api/public/access-request", {
      method: "POST",
      body: {
        first_name: formValues.first_name,
        last_name: formValues.last_name,
        email: formValues.email,
        phone: formValues.phone,
        password: formValues.password,
        unit_id: unitId,
        unit_number: unitNumber,
        residency_type: formValues.residency_type,
      },
    });

    submitSuccess.value = true;

    // Notify admins via email
    try {
      await $fetch("/api/email/access-request", {
        method: "POST",
        body: {
          first_name: formValues.first_name,
          last_name: formValues.last_name,
          email: formValues.email,
          phone: formValues.phone,
          unit_number: unitNumber,
          residency_type: formValues.residency_type,
        },
      });
    } catch (emailError) {
      // Don't fail registration if email fails
      console.error("Failed to send notification email:", emailError);
    }
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.data?.message) {
      submitError.value = error.data.message;
    } else if (error.data?.errors?.[0]?.message) {
      submitError.value = error.data.errors[0].message;
    } else {
      submitError.value = "Failed to submit access request. Please try again.";
    }
  }
});
</script>

<template>
  <div
    v-motion="{
      initial: { y: -100, opacity: 0 },
      enter: { y: 0, opacity: 1 },
    }"
    class="w-full"
  >
    <Alert v-if="submitError" class="my-4" variant="destructive">
      {{ submitError }}
    </Alert>

    <Alert v-if="submitSuccess" class="my-4" variant="default">
      <p class="font-semibold">Request Submitted</p>
      <p class="text-sm">
        Your access request has been submitted. You will receive an email once
        approved.
      </p>
    </Alert>

    <form v-if="!submitSuccess" @submit="onSubmit" class="grid gap-4">
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
          placeholder="name@domain.com"
          v-bind="field"
          :error-message="errors[0]"
          variant="underline"
        />
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="phone">
        <FormCustomInput
          id="phone"
          label="Phone"
          type="tel"
          placeholder="(555) 555-5555"
          v-bind="field"
          :error-message="errors[0]"
          variant="underline"
        />
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="unit_id">
        <div class="space-y-2">
          <Label for="unit_id" class="text-sm font-medium leading-none">
            Unit
            <span class="text-xs text-muted-foreground ml-1"
              >(Your unit at 1033 Lenox)</span
            >
          </Label>
          <Select
            id="unit_id"
            :model-value="field.value"
            :options="unitOptions"
            placeholder="Select your unit"
            :disabled="unitsPending"
            @update:model-value="field.onChange"
          />
          <p v-if="errors[0]" class="text-sm text-destructive">
            {{ errors[0] }}
          </p>
        </div>
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="residency_type">
        <div class="space-y-2">
          <Label
            for="residency_type"
            class="text-sm font-medium leading-none"
          >
            Residency Type
          </Label>
          <Select
            id="residency_type"
            :model-value="field.value"
            :options="residencyTypes"
            placeholder="Select your residency type"
            @update:model-value="field.onChange"
          />
          <p v-if="errors[0]" class="text-sm text-destructive">
            {{ errors[0] }}
          </p>
        </div>
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="password">
        <FormCustomInput
          id="password"
          label="Password"
          type="password"
          placeholder="Create a password"
          v-bind="field"
          :error-message="errors[0]"
          variant="underline"
          @update:model-value="passwordValue = String($event)"
        >
          <template #after>
            <div class="mt-2 mb-3 space-y-1">
              <TransitionGroup
                enter-active-class="transition-all duration-200 ease-out"
                leave-active-class="transition-all duration-150 ease-in"
                enter-from-class="opacity-0 -translate-x-2"
                enter-to-class="opacity-100 translate-x-0"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 -translate-x-2"
              >
                <div
                  v-for="req in passwordRequirements"
                  :key="req.label"
                  class="flex items-center gap-2 text-xs"
                  :class="
                    req.met ? 'text-green-600' : 'text-muted-foreground'
                  "
                >
                  <Check v-if="req.met" class="h-3 w-3" />
                  <X v-else class="h-3 w-3" />
                  <span>{{ req.label }}</span>
                </div>
              </TransitionGroup>
            </div>
          </template>
        </FormCustomInput>
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="confirm_password">
        <FormCustomInput
          id="confirm_password"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          v-bind="field"
          :error-message="errors[0]"
          variant="underline"
        />
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="agreement">
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <Checkbox
              id="agreement"
              :checked="field.value"
              @update:checked="field.onChange"
            />
            <Label for="agreement" class="text-sm font-medium leading-none cursor-pointer">
              I confirm that I am a resident or owner at 1033 Lenox
            </Label>
          </div>
          <p v-if="errors[0]" class="text-sm text-destructive">
            {{ errors[0] }}
          </p>
        </div>
      </VeeField>

      <Button type="submit" class="w-full" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ isSubmitting ? "Submitting..." : "Request Access" }}
      </Button>
    </form>
  </div>
</template>
