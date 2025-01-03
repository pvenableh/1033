import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const recipients = body.data.recipients;

	const messages = recipients
		.map((element) => {
			if (!element.people_id.email) return null;

			const unit = element.people_id.unit?.[0]?.units_id.number || null;
			const spot = element.people_id.unit?.[0]?.units_id.parking_spot || null;
			const vehicles =
				element.people_id.unit?.[0]?.units_id.vehicles?.map((vehicle) => ({
					make: vehicle.make,
					model: vehicle.model,
					color: vehicle.color,
					license_plate: vehicle.license_plate,
				})) || [];

			return {
				personalizations: [
					{
						to: [{ email: element.people_id.email }],
						bcc: [{ email: 'huestudios.com@gmail.com' }],
					},
				],
				from: {
					email: 'mail@1033lenox.com',
					name: '1033 Lenox',
				},
				template_id: 'd-ef1bd1a336a341e6a85751e04227b9d3',
				replyTo: {
					email: 'lenoxplazaboard@gmail.com',
					name: '1033 Lenox',
				},
				dynamicTemplateData: {
					first_name: element.people_id.first_name,
					unit,
					vehicles,
					title: body.data.data.title,
					subtitle: body.data.data.subtitle,
					urgent: body.data.data.urgent,
					content: body.data.data.content,
					url: body.data.data.url,
					closing: body.data.data.closing,
					spot,
				},
				categories: ['1033 Lenox', 'announcements'],
			};
		})
		.filter(Boolean);

	try {
		await sgMail.send(messages);
		return { success: true, message: 'Emails sent successfully' };
	} catch (error) {
		console.error('SendGrid Error:', error.response?.body || error.message);
		return { success: false, message: error.message };
	}
});
