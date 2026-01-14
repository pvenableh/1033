<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const props = defineProps<{
  id?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  modelValue?: string | number;
  errorMessage?: string;
  class?: HTMLAttributes["class"];
  variant?: "default" | "underline";
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
}>();

const inputClasses = computed(() => {
  const base = "w-full";
  if (props.variant === "underline") {
    return cn(
      base,
      "border-0 border-b-2 rounded-none px-0 shadow-none focus-visible:ring-0",
      props.errorMessage
        ? "border-destructive focus-visible:border-destructive"
        : "border-input focus-visible:border-primary"
    );
  }
  return cn(
    base,
    props.errorMessage
      ? "border-destructive focus-visible:ring-destructive"
      : ""
  );
});
</script>

<template>
  <div :class="cn('space-y-2', props.class)">
    <div class="flex items-center justify-between">
      <slot name="label">
        <Label v-if="label" :for="id" class="text-sm font-medium leading-none">
          {{ label }}
        </Label>
      </slot>
      <slot name="label-end" />
    </div>

    <Input
      :id="id"
      :type="type || 'text'"
      :placeholder="placeholder"
      :model-value="modelValue"
      :class="inputClasses"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <slot name="after" />

    <p
      v-if="errorMessage"
      class="text-sm text-destructive"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>
