<script setup lang="ts">
import { useField, useForm } from 'vee-validate';
import * as yup from 'yup';
import confetti from 'canvas-confetti';

const props = defineProps<{
  // When a resident is signed in, the page passes their account details so the
  // identity fields are pre-filled and locked (one less thing to type).
  prefill?: { name?: string; email?: string } | null;
}>();

const emit = defineEmits<{ submitted: [] }>();

// IDEA_CATEGORIES is a named export of useIdeas.ts (auto-imported by Nuxt).
const { submit, lookupResident } = useIdeas();
const toast = useToast();

const isAuthed = computed(() => !!props.prefill?.email);

const isSubmitting = ref(false);
const submitted = ref(false);
const verified = ref(false);
const checkingResident = ref(false);

// ---- Images -------------------------------------------------------------
const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

interface Preview {
  file: File;
  url: string;
}
const previews = ref<Preview[]>([]);

const addFiles = (fileList: FileList | null) => {
  if (!fileList) return;
  for (const file of Array.from(fileList)) {
    if (previews.value.length >= MAX_FILES) {
      toast.add({ title: 'Limit reached', description: `Up to ${MAX_FILES} images.`, color: 'red' });
      break;
    }
    if (!ALLOWED.includes(file.type)) {
      toast.add({ title: 'Unsupported file', description: `${file.name} is not an image.`, color: 'red' });
      continue;
    }
    if (file.size > MAX_BYTES) {
      toast.add({ title: 'Too large', description: `${file.name} exceeds 8 MB.`, color: 'red' });
      continue;
    }
    previews.value.push({ file, url: URL.createObjectURL(file) });
  }
};

const onFileInput = (e: Event) => {
  addFiles((e.target as HTMLInputElement).files);
  (e.target as HTMLInputElement).value = '';
};

const removeImage = (idx: number) => {
  URL.revokeObjectURL(previews.value[idx].url);
  previews.value.splice(idx, 1);
};

onBeforeUnmount(() => previews.value.forEach((p) => URL.revokeObjectURL(p.url)));

// ---- Form ---------------------------------------------------------------
const validationSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  unit_number: yup.string().required('Unit is required'),
  category: yup.string().required('Pick a category'),
  title: yup.string().required('A short title is required').max(120, 'Keep the title under 120 characters'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Please add a little more detail')
    .max(2000, 'Description cannot exceed 2000 characters'),
});

const { handleSubmit, resetForm } = useForm({ validationSchema });
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: unit_number, errorMessage: unitError } = useField<string>('unit_number');
const { value: category, errorMessage: categoryError } = useField<string>('category');
const { value: title, errorMessage: titleError } = useField<string>('title');
const { value: description, errorMessage: descriptionError } = useField<string>('description');

// Resident match on email blur → autofill + verified badge
const checkResident = async () => {
  verified.value = false;
  if (!email.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) return;
  checkingResident.value = true;
  try {
    const match = await lookupResident(email.value);
    if (match.matched) {
      verified.value = true;
      if (!name.value && (match.first_name || match.last_name)) {
        name.value = `${match.first_name || ''} ${match.last_name || ''}`.trim();
      }
      if (match.unit_number) unit_number.value = match.unit_number;
    }
  } finally {
    checkingResident.value = false;
  }
};

// Pre-fill identity for signed-in residents, then resolve their unit + verified
// badge via the normal resident lookup.
const applyPrefill = async () => {
  if (!props.prefill) return;
  if (props.prefill.name) name.value = props.prefill.name;
  if (props.prefill.email) {
    email.value = props.prefill.email;
    await checkResident();
  }
};
onMounted(applyPrefill);

const onSubmit = handleSubmit(async (values) => {
  isSubmitting.value = true;
  try {
    await submit(
      {
        name: values.name,
        email: values.email,
        unit_number: values.unit_number,
        category: values.category,
        title: values.title,
        description: values.description,
      },
      previews.value.map((p) => p.file)
    );
    confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
    submitted.value = true;
    emit('submitted');
  } catch (error: any) {
    console.error('Idea submit error:', error);
    toast.add({
      title: 'Submission failed',
      description: error?.data?.message || 'Please try again in a moment.',
      color: 'red',
    });
  } finally {
    isSubmitting.value = false;
  }
});

const resetAll = () => {
  previews.value.forEach((p) => URL.revokeObjectURL(p.url));
  previews.value = [];
  verified.value = false;
  resetForm();
  submitted.value = false;
  // Re-apply identity for signed-in residents after a reset.
  applyPrefill();
};
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle>Share an idea</CardTitle>
      <CardDescription>
        Tell us how you'd like to see our shared spaces come to life. Submissions are reviewed before
        appearing on the board.
      </CardDescription>
    </CardHeader>

    <CardContent>
      <!-- Success state -->
      <div v-if="submitted" class="py-10 text-center space-y-4">
        <Icon name="lucide:party-popper" class="w-10 h-10 mx-auto text-primary" />
        <h3 class="text-lg font-semibold">
          Thanks{{ name ? `, ${name.split(' ')[0]}` : '' }}!
        </h3>
        <p class="text-sm text-muted-foreground max-w-sm mx-auto">
          Your idea was submitted and is awaiting review. Once approved it'll show up in the community feed.
        </p>
        <Button variant="outline" @click="resetAll">Submit another idea</Button>
      </div>

      <!-- Form -->
      <form v-else class="grid gap-4" @submit.prevent="onSubmit">
        <div class="grid sm:grid-cols-2 gap-4">
          <FormGroup label="Name" required :error="nameError">
            <Input v-model="name" placeholder="Your name" :disabled="isAuthed" />
          </FormGroup>
          <FormGroup label="Email" required :error="emailError" :hint="checkingResident ? 'Checking…' : ''">
            <div class="relative">
              <Input
                v-model="email"
                type="email"
                placeholder="name@domain.com"
                :disabled="isAuthed"
                @blur="checkResident" />
              <Badge
                v-if="verified"
                variant="solid"
                class="absolute right-2 top-1/2 -translate-y-1/2 gap-1 bg-emerald-600">
                <Icon name="lucide:badge-check" class="w-3 h-3" /> Verified
              </Badge>
            </div>
          </FormGroup>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <FormGroup label="Unit" required :error="unitError">
            <Input v-model="unit_number" placeholder="e.g. 502" />
          </FormGroup>
          <FormGroup label="Category" required :error="categoryError">
            <Select v-model="category" :options="IDEA_CATEGORIES" placeholder="Select a category" />
          </FormGroup>
        </div>

        <FormGroup label="Title" required :error="titleError">
          <Input v-model="title" placeholder="A short headline for your idea" />
        </FormGroup>

        <FormGroup label="Description" required :error="descriptionError">
          <Textarea v-model="description" :rows="5" placeholder="Describe the space and what you'd love to see." />
        </FormGroup>

        <!-- Images -->
        <FormGroup label="Images" description="Optional — up to 5 images (8 MB each).">
          <div class="flex flex-wrap gap-3">
            <div
              v-for="(p, idx) in previews"
              :key="p.url"
              class="relative w-20 h-20 rounded-md overflow-hidden border">
              <img :src="p.url" alt="preview" class="w-full h-full object-cover" />
              <button
                type="button"
                class="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                @click="removeImage(idx)">
                <Icon name="lucide:x" class="w-3 h-3" />
              </button>
            </div>
            <label
              v-if="previews.length < MAX_FILES"
              class="w-20 h-20 rounded-md border border-dashed flex items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted">
              <Icon name="lucide:image-plus" class="w-5 h-5" />
              <input type="file" accept="image/*" multiple class="hidden" @change="onFileInput" />
            </label>
          </div>
        </FormGroup>

        <div class="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" @click="resetAll">Reset</Button>
          <Button type="submit" :disabled="isSubmitting">
            <Icon v-if="isSubmitting" name="lucide:loader-circle" class="w-4 h-4 mr-1 animate-spin" />
            {{ isSubmitting ? 'Submitting…' : 'Submit idea' }}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>
