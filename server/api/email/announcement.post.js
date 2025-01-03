/* eslint-disable no-undef */
import sgMail from '@sendgrid/mail';

sgMail.setApiKey('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');

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const recipients = body.data.recipients;
	const messages = [];

	let templateId;

	if (body.data.template === 'Parking') {
		templateId = 'd-ef1bd1a336a341e6a85751e04227b9d3';
	} else {
		templateId = 'd-035e7712976d45aaa5143d8a1042aee7';
	}

	for (const element of recipients) {
		if (element.people_id.email) {
			let unit = null;
			let vehicles = [];

			// Check if the unit exists and has vehicles
			if (element.people_id.unit.length > 0) {
				unit = element.people_id.unit[0].units_id.number;

				if (element.people_id.unit[0].units_id.vehicles.length > 0) {
					// Extract and format vehicle data
					vehicles = element.people_id.unit[0].units_id.vehicles.map((vehicle) => ({
						make: vehicle.make,
						model: vehicle.model,
						color: vehicle.color,
						license_plate: vehicle.license_plate,
						parking_spot: vehicle.parking_spot,
					}));
				}
			}

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
				template_id: templateId,
				replyTo: {
					email: 'lenoxplazaboard@gmail.com',
					name: '1033 Lenox',
				},
				subject: `Attention ${element.people_id.first_name}: ${body.data.data.title}`,
				content: [
					{
						type: 'text/html',
						value: '&nbsp;',
					},
				],
				dynamicTemplateData: {
					first_name: element.people_id.first_name,
					unit: unit,
					vehicles: vehicles,
					title: body.data.data.title,
					subtitle: body.data.data.subtitle,
					urgent: body.data.data.urgent,
					content: body.data.data.content,
					url: body.data.data.url,
					closing: body.data.data.closing,
				},
				categories: ['1033 Lenox', 'announcements'],
			};

			messages.push(message);
		}
	}

	try {
		await sgMail.send(messages);
		return { success: true, message: 'Email sent successfully' };
	} catch (error) {
		return { success: false, message: error.message };
	}
});
