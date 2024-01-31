import { ref } from 'vue';

export const showModal = ref(false)

export function toggleModal() {
	showModal.value = !showModal.value
}
export function closeModal() {
	showModal.value = false
}
export function openModal() {
	showModal.value = true
}
