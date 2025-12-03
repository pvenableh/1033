export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();

	// Try the original token from your first curl example
	const apiToken =
		'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjoiODYyNzk2MTU1MDUxODgyODIiLCJ1dWlkIjoiN2M1ZTE3YjUtOGJhNS00NmE2LWFmNjAtMzM3MTAyM2Q4ZTNmIiwiZXhwIjoyMDA5MTg1NTI0fQ.kg9OW4qBpbV-84qn2Pa7RF2x0Z-_mmsPKZGbfj0Lfuw';

	try {
		const response = await $fetch('https://admin.swiftpass.io/api/v1/sites/', {
			headers: {
				'api-token': apiToken,
				'Content-Type': 'application/json',
			},
			params: {
				page: 1,
				per_page: 50,
			},
		});

		return response;
	} catch (error) {
		// Return more detailed error info
		return {
			error: true,
			message: error.message,
			statusCode: error.response?.status,
			data: error.data,
		};
	}
});
