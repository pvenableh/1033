<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { jwtDecode } from "jwt-decode";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { refDebounced } from "@vueuse/core";
import { openScreen, closeScreen } from "~/composables/useScreen";

import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Eye, EyeOff } from "lucide-vue-next";

const { resetPassword } = useDirectusAuth();
const route = useRoute();
const toast = useToast();

const reset_token = ref(route.query.token ? (route.query.token as string) : "");
const decoded = ref<{ email: string; exp: number } | null>(null);
const expired = ref(false);
const expiredDate = ref<Date | null>(null);
const loading = ref(true);
const showPassword = ref(false);

const passwordResetSchema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

const formSchema = toTypedSchema(passwordResetSchema);

const { handleSubmit, isSubmitting } = useForm<PasswordResetFormValues>({
  validationSchema: formSchema,
  initialValues: {
    password: "",
  },
});

const passwordValue = ref("");
const debouncedPassword = refDebounced(passwordValue, 300);

const passwordRequirements = ref([
  { label: "At least 6 characters", met: false },
  { label: "One lowercase letter", met: false },
  { label: "One number", met: false },
]);

watch(debouncedPassword, (newPassword) => {
  const reqs = passwordRequirements.value;
  if (reqs[0]) reqs[0].met = newPassword.length >= 6;
  if (reqs[1]) reqs[1].met = /[a-z]/.test(newPassword);
  if (reqs[2]) reqs[2].met = /[0-9]/.test(newPassword);
});

onMounted(() => {
  if (reset_token.value) {
    try {
      decoded.value = jwtDecode(reset_token.value);
      if (decoded.value?.exp) {
        expiredDate.value = new Date(decoded.value.exp * 1000);
        if (expiredDate.value >= new Date()) {
          expired.value = true;
        }
      }
    } catch (e) {
      console.error("Failed to decode token:", e);
    }
    loading.value = false;
  } else {
    loading.value = false;
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    openScreen();
    await resetPassword(reset_token.value, values.password);
    toast.add({
      title: "Success",
      description: "Password reset successfully. Routing to login page.",
      color: "green",
    });
    setTimeout(() => {
      closeScreen();
      navigateTo("/auth/signin");
    }, 2000);
  } catch (error: any) {
    closeScreen();
    toast.add({
      title: "Error",
      description: error.message || "Failed to reset password",
      color: "red",
    });
  }
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="flex items-center justify-center flex-col min-h-[90svh] px-4 text-foreground">
    <transition name="fade" mode="out-in">
      <div v-if="expired" class="w-full max-w-md">
        <h3 class="text-xl font-semibold mb-1">
          Reset password for {{ decoded?.email }}.
        </h3>
        <h5
          v-if="expiredDate"
          class="uppercase italic text-xs font-bold mt-2 mb-6 text-muted-foreground"
        >
          Link expires in {{ getRelativeTime(expiredDate) }}
        </h5>

        <form @submit="onSubmit" class="space-y-4">
          <VeeField v-slot="{ field, errors }" name="password">
            <FormCustomInput
              id="password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter new password"
              v-bind="field"
              :error-message="errors[0]"
              variant="underline"
              @update:model-value="passwordValue = String($event)"
            >
              <template #label-end>
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground transition-colors"
                  @click="togglePassword"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </template>
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

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            {{ isSubmitting ? "Resetting..." : "Reset Password" }}
          </Button>
        </form>
      </div>

      <h5
        v-else-if="!loading && !expired && reset_token"
        class="uppercase italic text-xs font-bold"
      >
        This link has expired.
      </h5>
      <h5
        v-else-if="!loading && !reset_token"
        class="uppercase italic text-xs font-bold"
      >
        There was an error
      </h5>
      <h5 v-else-if="loading" class="uppercase tracking-wide text-xs font-bold">
        Loading
      </h5>
    </transition>
  </div>
</template>
