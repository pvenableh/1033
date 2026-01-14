<script setup lang="ts">
import { ref } from "vue";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-vue-next";

const { login } = useDirectusAuth();
const route = useRoute();
const login_error = ref<string | null>(null);
const emailChecking = ref(false);

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const formSchema = toTypedSchema(loginSchema);

const { handleSubmit, isSubmitting, setFieldError } = useForm<LoginFormValues>({
  validationSchema: formSchema,
  initialValues: {
    email: "",
    password: "",
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
    return true; // Allow submission if check fails
  } finally {
    emailChecking.value = false;
  }
};

const onSubmit = handleSubmit(async (values) => {
  login_error.value = null;

  // Check if email exists before attempting login
  const emailExists = await checkEmailExists(values.email);
  if (!emailExists) {
    setFieldError("email", "This email is not registered.");
    return;
  }

  try {
    await login({ email: values.email, password: values.password });

    if (route.query.redirect) {
      const path = decodeURIComponent(route.query.redirect as string);
      await navigateTo(path);
    } else {
      await navigateTo("/");
    }
  } catch (err: any) {
    if (err?.errors?.length) {
      login_error.value = err.errors[0].message;
    } else if (err?.data?.errors?.length) {
      login_error.value = err.data.errors[0].message;
    } else {
      login_error.value = err?.message || "Login failed. Please try again.";
    }
  }
});
</script>

<template>
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
    class="w-full"
  >
    <Alert
      v-if="login_error"
      class="my-4"
      variant="destructive"
    >
      {{ login_error }}
    </Alert>

    <form @submit="onSubmit" class="grid gap-4">
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

      <VeeField v-slot="{ field, errors }" name="password">
        <FormCustomInput
          id="password"
          label="Password"
          type="password"
          placeholder="********"
          v-bind="field"
          :error-message="errors[0]"
          variant="underline"
        />
      </VeeField>

      <Button
        type="submit"
        class="w-full"
        :disabled="isSubmitting || emailChecking"
      >
        <Loader2
          v-if="isSubmitting || emailChecking"
          class="mr-2 h-4 w-4 animate-spin"
        />
        {{ isSubmitting ? "Signing in..." : "Sign In" }}
      </Button>
    </form>
  </div>
</template>
