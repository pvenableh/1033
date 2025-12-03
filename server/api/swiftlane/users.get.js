export default defineEventHandler(async (event) => {
	const apiToken =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiODk1MDY4NjQ2NzcyMzAzMjMwIiwidXVpZCI6ImJiOTg1YTZkLTZmMDgtNDUzYi1iNzE3LWE2ZGVlMjE0ZjU0NyIsImV4cCI6MjA3NTEwOTM2MX0.0FqJtSMaSVgkl2rXWbdavTuDRgeESdaFx5LTMK7Kc1Y';

	try {
		// Exact example from docs - /users/ not /tenants/
		const response = await $fetch('https://admin.swiftlane.com/api/v1/users/', {
			headers: {
				'api-token': apiToken,
				'Content-Type': 'application/json',
			},
			params: {
				page: 1,
				per_page: 50,
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
