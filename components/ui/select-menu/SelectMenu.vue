<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'
import { cn } from '~/lib/utils'
import { Check, ChevronDown, Search } from 'lucide-vue-next'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
  avatar?: { src?: string; alt?: string }
}

const props = withDefaults(defineProps<{
  modelValue?: string | number | (string | number)[] | null
  options?: (string | Option)[]
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  multiple?: boolean
  disabled?: boolean
  class?: string
  by?: string
}>(), {
  options: () => [],
  placeholder: 'Select an option',
  searchPlaceholder: 'Search...',
  by: 'value',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[]]
}>()

const searchQuery = ref('')

const normalizedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return opt
  })
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return normalizedOptions.value
  const query = searchQuery.value.toLowerCase()
  return normalizedOptions.value.filter(opt =>
    opt.label.toLowerCase().includes(query)
  )
})

const selectedValue = computed({
  get: () => {
    if (props.multiple) {
      return Array.isArray(props.modelValue) ? props.modelValue.map(v => v?.toString()) : []
    }
    return props.modelValue?.toString() ?? ''
  },
  set: (val) => {
    if (props.multiple) {
      emit('update:modelValue', val as (string | number)[])
    } else {
      emit('update:modelValue', val as string | number)
    }
  }
})

const displayValue = computed(() => {
  if (props.multiple && Array.isArray(selectedValue.value)) {
    const selected = normalizedOptions.value.filter(o =>
      selectedValue.value.includes(o.value?.toString())
    )
    return selected.map(o => o.label).join(', ')
  }
  const option = normalizedOptions.value.find(o => o.value?.toString() === selectedValue.value)
  return option?.label ?? ''
})
</script>

<template>
  <ComboboxRoot
    v-model="selectedValue"
    v-model:search-term="searchQuery"
    :multiple="multiple"
    :disabled="disabled"
    class="relative"
  >
    <ComboboxAnchor
      :class="cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )"
    >
      <ComboboxInput
        v-if="searchable"
        :placeholder="displayValue || placeholder"
        class="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
      <span v-else class="flex-1 truncate text-left">
        {{ displayValue || placeholder }}
      </span>
      <ComboboxTrigger>
        <ChevronDown class="h-4 w-4 opacity-50" />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent
        class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      >
        <ComboboxViewport>
          <ComboboxEmpty class="py-6 text-center text-sm">
            No results found.
          </ComboboxEmpty>
          <ComboboxGroup>
            <ComboboxItem
              v-for="option in filteredOptions"
              :key="option.value"
              :value="option.value?.toString()"
              :disabled="option.disabled"
              class="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <ComboboxItemIndicator>
                  <Check class="h-4 w-4" />
                </ComboboxItemIndicator>
              </span>
              <img
                v-if="option.avatar?.src"
                :src="option.avatar.src"
                :alt="option.avatar.alt || option.label"
                class="mr-2 h-5 w-5 rounded-full"
              />
              {{ option.label }}
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
