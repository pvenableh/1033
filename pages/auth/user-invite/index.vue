<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { jwtDecode } from "jwt-decode";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { refDebounced } from "@vueuse/core";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2, Check, X, CheckCircle, AlertTriangle } from "lucide-vue-next";

definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: 'Complete Registration - 1033 Lenox',
});

const route = useRoute();

// State
const error = ref<string | null>(null);
const success = ref(false);

// Token handling
const token = computed(() => (route.query.token as string) || "");
const decodedToken = computed(() => {
  if (!token.value) return null;
  try {
    return jwtDecode<{ email: string; exp: number }>(token.value);
  } catch {
    return null;
  }
});

const decodedEmail = computed(() => decodedToken.value?.email || "");
const expiresAt = computed(() => {
  if (!decodedToken.value?.exp) return null;
  return new Date(decodedToken.value.exp * 1000);
});

const isValid = computed(() => {
  if (!decodedToken.value || !expiresAt.value) return false;
  return expiresAt.value > new Date();
});

// Form validation
const userInviteSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type UserInviteFormValues = z.infer<typeof userInviteSchema>;

const formSchema = toTypedSchema(userInviteSchema);

const { handleSubmit, isSubmitting } = useForm<UserInviteFormValues>({
  validationSchema: formSchema,
  initialValues: {
    password: "",
    confirmPassword: "",
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

// Submit handler
const onSubmit = handleSubmit(async (values) => {
  error.value = null;

  try {
    await $fetch("/api/directus/users/accept-invite", {
      method: "POST",
      body: {
        token: token.value,
        password: values.password,
      },
    });

    success.value = true;
  } catch (err: any) {
    if (err?.data?.message) {
      error.value = err.data.message;
    } else if (err?.message) {
      error.value = err.message;
    } else {
      error.value =
        "Failed to set password. The invitation may be invalid or expired.";
    }
  }
});
</script>

<template>
  <div class="flex items-center justify-center flex-col min-h-screen px-4 text-foreground">
    <div
      v-motion="{
        initial: {
          y: -100,
          opacity: 0,
        },
        enter: {
          y: 0,
          opacity: 1,
        },
      }"
      class="w-full max-w-md"
    >
      <!-- Success State -->
      <div v-if="success" class="text-center">
        <CheckCircle class="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 class="text-2xl font-bold mb-2">Welcome to 1033 Lenox!</h2>
        <p class="text-muted-foreground mb-6">
          Your account has been set up successfully. You can now sign in with
          your new password.
        </p>
        <Button as-child class="w-full">
          <NuxtLink to="/auth/signin">Sign In</NuxtLink>
        </Button>
      </div>

      <!-- Expired Token State -->
      <div v-else-if="!isValid" class="text-center">
        <AlertTriangle class="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 class="text-2xl font-bold mb-2">Link Expired</h2>
        <p class="text-muted-foreground mb-6">
          This invitation link has expired. Please contact an administrator to
          request a new invitation.
        </p>
        <Button variant="outline" as-child class="w-full">
          <NuxtLink to="/auth/signin">Go to Sign In</NuxtLink>
        </Button>
      </div>

      <!-- Form State -->
      <div v-else>
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold mb-2">Set Your Password</h2>
          <p class="text-muted-foreground">
            Welcome, <span class="font-medium">{{ decodedEmail }}</span>!
          </p>
          <p v-if="expiresAt" class="text-xs text-muted-foreground mt-1">
            Link expires {{ getRelativeTime(expiresAt) }}
          </p>
        </div>

        <Alert v-if="error" class="mb-4" variant="destructive">
          {{ error }}
        </Alert>

        <form @submit="onSubmit" class="grid gap-4">
          <VeeField v-slot="{ field, errors }" name="password">
            <FormCustomInput
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
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

          <VeeField v-slot="{ field, errors }" name="confirmPassword">
            <FormCustomInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              v-bind="field"
              :error-message="errors[0]"
              variant="underline"
            />
          </VeeField>

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            {{ isSubmitting ? "Setting password..." : "Set Password" }}
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>
