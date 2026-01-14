<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-vue-next";

const { user } = useDirectusAuth();
const { updateProfile } = useDirectusUser();
const toast = useToast();

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const formSchema = toTypedSchema(profileSchema);

const { handleSubmit, isSubmitting, setValues } = useForm<ProfileFormValues>({
  validationSchema: formSchema,
  initialValues: {
    first_name: "",
    last_name: "",
    email: "",
  },
});

// Initialize form state when user data is available
watchEffect(() => {
  if (user.value) {
    setValues({
      first_name: (user.value as any).first_name || "",
      last_name: (user.value as any).last_name || "",
      email: (user.value as any).email || "",
    });
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    await updateProfile({
      first_name: values.first_name,
      last_name: values.last_name,
    });

    toast.add({
      icon: "i-heroicons-check-circle-solid",
      title: "Success!",
      description: "Profile updated.",
      color: "green",
    });

    // Refresh user session to get updated data
    const { refreshUser } = useDirectusAuth();
    await refreshUser();
  } catch (error: any) {
    console.error(error);
    toast.add({
      icon: "i-heroicons-exclamation-triangle",
      title: "Error",
      description: error.message || "Failed to update profile",
      color: "red",
    });
  }
});
</script>

<template>
  <div class="px-10 account__profile">
    <h2>Profile</h2>
    <form @submit="onSubmit" class="grid gap-4">
      <VeeField v-slot="{ field, errors }" name="first_name">
        <FormCustomInput
          id="first_name"
          label="First Name"
          type="text"
          placeholder="First Name"
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
          placeholder="Last Name"
          v-bind="field"
          :error-message="errors[0]"
          variant="underline"
        />
      </VeeField>

      <VeeField v-slot="{ field, errors }" name="email">
        <FormCustomInput
          id="email"
          label="Email"
          type="email"
          placeholder="Email"
          v-bind="field"
          :error-message="errors[0]"
          variant="underline"
          disabled
        />
      </VeeField>

      <Button class="w-full mt-4" type="submit" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ isSubmitting ? "Updating..." : "Update Profile" }}
      </Button>
    </form>
  </div>
</template>
