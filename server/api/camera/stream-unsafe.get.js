import https from 'https';

export default defineEventHandler(async (event) => {
	const snapshotUrl = 'http://69.84.126.179:8000/ISAPI/Streaming/channels/101/picture';
	const auth = 'Basic ' + Buffer.from('lenoxuser:lenox1033').toString('base64');

	try {
		// Create custom agent that ignores SSL errors
		const agent = new https.Agent({
			rejectUnauthorized: false,
		});

		const response = await fetch(snapshotUrl, {
			headers: {
				Authorization: auth,
				'User-Agent': 'Node.js',
			},
			agent: snapshotUrl.startsWith('https') ? agent : undefined,
		});

		console.log('Status:', response.status);

		if (!response.ok) {
			const text = await response.text();
			return {
				error: 'Failed',
				status: response.status,
				body: text,
			};
		}

		const buffer = await response.arrayBuffer();

		return {
			success: true,
			size: buffer.byteLength,
			contentType: response.headers.get('content-type'),
		};
	} catch (err) {
		return {
			error: err.message,
			code: err.code,
			cause: err.cause,
		};
	}
});
