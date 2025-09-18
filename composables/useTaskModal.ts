import {ref} from 'vue';

const isOpen = ref(false);
const taskModalData = ref(null);
const taskModalAction = ref('create');

function openModal(data: null, action: any) {
	taskModalData.value = data;
	taskModalAction.value = action;
	isOpen.value = true;
}

function closeModal() {
	isOpen.value = false;
	taskModalData.value = null;
}

export {isOpen, taskModalData, taskModalAction, openModal, closeModal};
