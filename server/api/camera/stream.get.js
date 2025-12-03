export default defineEventHandler(async (event) => {
	const res = event.node.res;

	const snapshotUrl = 'http://69.84.126.179:8000/ISAPI/Streaming/channels/101/picture';
	const auth = 'Basic ' + Buffer.from('lenoxuser:lenox1033').toString('base64');

	console.log('Attempting to fetch:', snapshotUrl);

	// First, test if we can connect at all
	try {
		const testResponse = await fetch(snapshotUrl, {
			headers: {
				Authorization: auth,
			},
		});

		console.log('Response status:', testResponse.status);
		console.log('Response headers:', Object.fromEntries(testResponse.headers));

		if (!testResponse.ok) {
			return {
				error: 'HTTP Error',
				status: testResponse.status,
				statusText: testResponse.statusText,
				body: await testResponse.text(),
			};
		}

		// If successful, return the image
		const buffer = await testResponse.arrayBuffer();

		res.writeHead(200, {
			'Content-Type': 'image/jpeg',
			'Content-Length': buffer.byteLength,
		});

		res.end(Buffer.from(buffer));
	} catch (err) {
		console.error('Detailed error:', err);
		return {
			error: err.message,
			code: err.code,
			cause: err.cause?.message,
			stack: err.stack,
		};
	}
});
