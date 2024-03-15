import sgMail from '@sendgrid/mail';
import axios from 'axios';

sgMail.setApiKey('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');

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const recipients = body.data.recipients;

	let attachment: {
		content: string;
		filename: string; // You might want to dynamically determine or set a meaningful filename
		type: string; // Set the MIME type based on your file's type
		disposition: string;
		content_id: string;
	} | null = null;

	const messages = [];

	async function getFileBase64(url: string) {
		const response = await axios.get(url, {
			responseType: 'arraybuffer',
		});

		console.log(response);
		return Buffer.from(response.data).toString('base64');
	}

	async function createAttachmentObject(url: string) {
		const base64Data = await getFileBase64(url);
		console.log(base64Data);
		return {
			content: base64Data,
			filename: 'filename.pdf', // You might want to dynamically determine or set a meaningful filename
			type: 'application/pdf', // Set the MIME type based on your file's type
			disposition: 'attachment',
			content_id: 'myContentId', // Optional: Use if you want to reference the content in your email's HTML body
		};
	}

	if (body.data.data.attachment) {
		const file = 'https://admin.1033lenox.com/assets/' + body.data.data.attachment;
		attachment = await createAttachmentObject(file);

		// attachment = [
		// 	{
		// 		content: file64,
		// 		filename: 'index.pdf',
		// 		type: 'application/pdf',
		// 		disposition: 'attachment',
		// 	},
		// ];
	}

	recipients.forEach((element) => {
		if (element.people_id.email && element.people_id.unit.length > 0) {
			messages.push({
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
					name: 'Lenox Plaza Board',
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
				attachments: [attachment],
			});
		}
	});

	sgMail.send(messages).then(
		() => {},
		(error) => {
			console.error(error);

			if (error.response) {
				console.error(error.response.body);
				const error = error.response.body;
			}
		},
	);
});
