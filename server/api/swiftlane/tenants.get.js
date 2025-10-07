export default defineEventHandler(async (event) => {
	const apiToken =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiODk1MDY4NjQ2NzcyMzAzMjMwIiwidXVpZCI6Ijc1ZDg1OGMwLTg1MGYtNDkxYS04MGFjLTg0MGRjZTljYzdiNCIsImV4cCI6MjA3NTIxNzY2OX0.QyZZv0cMBnZzUL-njFTfNt1jsyCpzruMS2xPSuVY368';

	try {
		const response = await $fetch('https://admin.swiftlane.com/api/v1/tenants/?page=1&per_page=50', {
			headers: {
				'api-token': apiToken,
				'Content-Type': 'application/json',
			},
		});

		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: {
				status: error.response?.status,
				statusText: error.response?.statusText,
				message: error.message,
				data: error.response?._data,
			},
		};
	}
});
