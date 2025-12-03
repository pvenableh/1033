export default defineEventHandler(async (event) => {
	const auth = 'Basic ' + Buffer.from('lenoxuser:lenox1033').toString('base64');
	const baseUrl = 'http://69.84.126.179:8000';

	// Test basic connectivity first
	const tests = [
		// Basic device info
		{url: `${baseUrl}/ISAPI/System/deviceInfo`, method: 'GET'},
		{url: `${baseUrl}/ISAPI/System/status`, method: 'GET'},

		// Snapshot endpoints
		{url: `${baseUrl}/ISAPI/Streaming/channels/101/picture`, method: 'GET'},
		{url: `${baseUrl}/ISAPI/Streaming/channels/1/picture`, method: 'GET'},
		{url: `${baseUrl}/ISAPI/Streaming/channels/102/picture`, method: 'GET'},
		{url: `${baseUrl}/Streaming/channels/101/picture`, method: 'GET'},

		// CGI endpoints
		{url: `${baseUrl}/cgi-bin/snapshot.cgi?channel=1`, method: 'GET'},
		{url: `${baseUrl}/onvif/snapshot`, method: 'GET'},
	];

	const results = [];

	for (const test of tests) {
		try {
			console.log('Testing:', test.url);

			const response = await fetch(test.url, {
				method: test.method,
				headers: {
					Authorization: auth,
					'User-Agent': 'Mozilla/5.0',
				},
				signal: AbortSignal.timeout(5000),
			});

			const contentType = response.headers.get('content-type');
			let body = null;

			if (contentType?.includes('json')) {
				body = await response.text();
			}

			results.push({
				url: test.url,
				status: response.status,
				statusText: response.statusText,
				contentType,
				success: response.ok,
				bodyPreview: body?.substring(0, 200),
			});
		} catch (err) {
			results.push({
				url: test.url,
				error: err.message,
				code: err.code,
				success: false,
			});
		}
	}

	return results;
});
