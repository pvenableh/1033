<script setup lang="ts">
import { useForm, Field as VeeField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-vue-next";

const { user } = useDirectusAuth();
const emit = defineEmits(["submitted"]);
const { $directus } = useNuxtApp();
const toast = useToast();

const categories = [
  { label: "Plumbing", value: "plumbing" },
  { label: "Electrical", value: "electrical" },
  { label: "HVAC", value: "hvac" },
  { label: "Appliance", value: "appliance" },
  { label: "Structural", value: "structural" },
  { label: "Pest Control", value: "pest_control" },
  { label: "Other", value: "other" },
];

const priorities = [
  { label: "Emergency", value: "emergency" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const contactMethods = [
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
  { label: "SMS", value: "sms" },
];

const requestSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  priority: z.string().default("medium"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  allowAccess: z.boolean().default(false),
  contactMethod: z.string().default("email"),
});

type RequestFormValues = z.infer<typeof requestSchema>;

const formSchema = toTypedSchema(requestSchema);

const { handleSubmit, isSubmitting, resetForm } = useForm<RequestFormValues>({
  validationSchema: formSchema,
  initialValues: {
    category: "",
    priority: "medium",
    subject: "",
    description: "",
    allowAccess: false,
    contactMethod: "email",
  },
});

const onSubmit = handleSubmit(async (values) => {
  try {
    // Submit to Directus
    await $directus.items("maintenance_requests").createOne({
      ...values,
      status: "new",
      tenant: (user.value as any)?.id,
    });

    toast.add({
      title: "Request Submitted",
      description: "Your maintenance request has been submitted successfully.",
      color: "green",
    });

    resetForm();
    emit("submitted");
  } catch (error) {
    console.error("Error submitting request:", error);
    toast.add({
      title: "Error",
      description:
        "There was an error submitting your request. Please try again.",
      color: "red",
    });
  }
});

const handleReset = () => {
  resetForm();
};
</script>

<template>
  <form @submit="onSubmit" class="space-y-6">
    <div class="space-y-4">
      <p>This is being submitted by {{ user }}</p>

      <!-- Request Category -->
      <VeeField v-slot="{ field, errors }" name="category">
        <div class="space-y-2">
          <Label for="category" class="text-sm font-medium leading-none">
            Request Category <span class="text-destructive">*</span>
          </Label>
          <Select
            id="category"
            :model-value="field.value"
            :options="categories"
            placeholder="Select a category"
            @update:model-value="field.onChange"
          />
          <p v-if="errors[0]" class="text-sm text-destructive">
            {{ errors[0] }}
          </p>
        </div>
      </VeeField>

      <!-- Priority -->
      <VeeField v-slot="{ field, errors }" name="priority">
        <div class="space-y-2">
          <Label for="priority" class="text-sm font-medium leading-none">
            Priority Level
          </Label>
          <Select
            id="priority"
            :model-value="field.value"
            :options="priorities"
            placeholder="Select priority"
            @update:model-value="field.onChange"
          />
          <p v-if="errors[0]" class="text-sm text-destructive">
            {{ errors[0] }}
          </p>
        </div>
      </VeeField>

      <!-- Subject -->
      <VeeField v-slot="{ field, errors }" name="subject">
        <FormCustomInput
          id="subject"
          label="Subject"
          type="text"
          placeholder="Brief description of the issue"
          v-bind="field"
          :error-message="errors[0]"
          variant="underline"
        />
      </VeeField>

      <!-- Description -->
      <VeeField v-slot="{ field, errors }" name="description">
        <div class="space-y-2">
          <Label for="description" class="text-sm font-medium leading-none">
            Description <span class="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            :model-value="field.value"
            placeholder="Please provide detailed information about your request"
            :rows="4"
            @update:model-value="field.onChange"
          />
          <p v-if="errors[0]" class="text-sm text-destructive">
            {{ errors[0] }}
          </p>
        </div>
      </VeeField>

      <!-- Access Permission -->
      <VeeField v-slot="{ field, errors }" name="allowAccess">
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <Checkbox
              id="allowAccess"
              :checked="field.value"
              @update:checked="field.onChange"
            />
            <Label
              for="allowAccess"
              class="text-sm font-medium leading-none cursor-pointer"
            >
              I give permission for maintenance to enter my unit when I'm not
              present
            </Label>
          </div>
          <p v-if="errors[0]" class="text-sm text-destructive">
            {{ errors[0] }}
          </p>
        </div>
      </VeeField>

      <!-- Preferred Contact Method -->
      <VeeField v-slot="{ field, errors }" name="contactMethod">
        <div class="space-y-2">
          <Label class="text-sm font-medium leading-none">
            Preferred Contact Method
          </Label>
          <RadioGroup
            :model-value="field.value"
            @update:model-value="field.onChange"
            class="flex gap-4"
          >
            <div
              v-for="method in contactMethods"
              :key="method.value"
              class="flex items-center space-x-2"
            >
              <RadioGroupItem :id="method.value" :value="method.value" />
              <Label :for="method.value" class="cursor-pointer">{{
                method.label
              }}</Label>
            </div>
          </RadioGroup>
          <p v-if="errors[0]" class="text-sm text-destructive">
            {{ errors[0] }}
          </p>
        </div>
      </VeeField>
    </div>

    <div class="flex justify-end space-x-3 pt-4">
      <Button type="button" variant="outline" @click="handleReset">
        Reset
      </Button>
      <Button type="submit" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ isSubmitting ? "Submitting..." : "Submit Request" }}
      </Button>
    </div>
  </form>
</template>
