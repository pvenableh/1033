<script setup lang="ts">
import { ref } from "vue";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-vue-next";

const { requestPasswordReset } = useDirectusAuth();
const toast = useToast();
const emailChecking = ref(false);

const passwordRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type PasswordRequestFormValues = z.infer<typeof passwordRequestSchema>;

const formSchema = toTypedSchema(passwordRequestSchema);

const { handleSubmit, isSubmitting, setFieldError } =
  useForm<PasswordRequestFormValues>({
    validationSchema: formSchema,
    initialValues: {
      email: "",
    },
  });

const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    emailChecking.value = true;
    const response: any = await $fetch(
      `https://admin.1033lenox.com/users?filter[email][_eq]=${email}`
    );
    return response.data.length > 0;
  } catch (error) {
    console.error("Failed to validate email:", error);
    return false;
  } finally {
    emailChecking.value = false;
  }
};

const onSubmit = handleSubmit(async (values) => {
  // Check if email exists
  const emailExists = await checkEmailExists(values.email);
  if (!emailExists) {
    setFieldError("email", "This email is not registered.");
    return;
  }

  openScreen();
  await requestPasswordReset(
    values.email,
    "https://1033lenox.com/auth/password-reset"
  );
  closeScreen();
  toast.add({ title: "An email was sent to " + values.email + "." });
});
</script>

<template>
  <div class="w-full flex items-start justify-start flex-row password-request">
    <form @submit="onSubmit" class="w-full">
      <VeeField v-slot="{ field, errors }" name="email">
        <FormCustomInput
          id="email"
          label="Email"
          type="email"
          placeholder="name@domain.com"
          v-bind="field"
          :error-message="errors[0]"
          variant="underline"
          class="my-6"
        />
      </VeeField>

      <Button
        type="submit"
        class="w-full mb-6"
        :disabled="isSubmitting || emailChecking"
      >
        <Loader2
          v-if="isSubmitting || emailChecking"
          class="mr-2 h-4 w-4 animate-spin"
        />
        {{ isSubmitting ? "Sending..." : "Send Email" }}
      </Button>
    </form>
  </div>
</template>
