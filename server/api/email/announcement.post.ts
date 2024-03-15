import sgMail from '@sendgrid/mail';

sgMail.setApiKey('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');

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const recipients = body.data.recipients;
	const messages = [];
	const files = body.data.attachments;
	let attachments = [];

	if (files.length > 0) {
		const fetchAndConvertFiles = async () => {
			return Promise.all(
				files.map(async (file) => {
					const response = await fetch('https://admin.1033lenox.com/assets/' + file.directus_files_id.id);
					const arrayBuffer = await response.arrayBuffer(); // Use arrayBuffer() instead of buffer()
					const buffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
					const base64 = buffer.toString('base64');
					return {
						filename: file.directus_files_id.title,
						type: file.directus_files_id.type,
						content: base64,
						disposition: 'attachment',
					};
				}),
			);
		};

		attachments = await fetchAndConvertFiles();
	}

	await recipients.forEach((element) => {
		if (element.people_id.email && element.people_id.unit.length > 0) {
			const message = {
				personalizations: [
					{
						to: [
							{
								email: element.people_id.email,
							},
						],
						bcc: [
							{
								email: 'huestudios.com@gmail.com',
							},
						],
					},
				],
				from: {
					email: 'mail@1033lenox.com',
					name: '1033 Lenox',
				},
				template_id: 'd-035e7712976d45aaa5143d8a1042aee7',
				replyTo: {
					email: 'lenoxplazaboard@gmail.com',
					name: '1033 Lenox',
				},
				subject: 'Attention ' + element.people_id.first_name + ': ' + body.data.data.title,
				content: [
					{
						type: 'text/html',
						value: '&nbsp;',
					},
				],
				dynamicTemplateData: {
					first_name: element.people_id.first_name,
					unit: element.people_id.unit[0].units_id.number,
					title: body.data.data.title,
					subtitle: body.data.data.subtitle,
					urgent: body.data.data.urgent,
					content: body.data.data.content,
					url: body.data.data.url,
					closing: body.data.data.closing,
				},
				categories: ['1033 Lenox', 'announcements'],
			};

			if (attachments.length > 0) {
				message.attachments = attachments;
			}

			messages.push(message);
		}
	});

	const sgRequest = await sgMail
		.send(messages)
		.then((res) => {
			console.log(res);
			console.log('emails sent successfully!');
			return attachments;
		})
		.catch((error) => {
			console.log(error);
			return error;
		});
});
