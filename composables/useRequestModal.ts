export const useRequestModal = () => {
	const isOpen = useState('requestModalOpen', () => false);

	const open = () => {
		isOpen.value = true;
	};

	const close = () => {
		isOpen.value = false;
	};

	return {
		isOpen,
		open,
		close,
	};
};
