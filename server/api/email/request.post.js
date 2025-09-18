import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();

	try {
		const requestData = await readBody(event);

		// Format the date
		const dateCreated = new Date(requestData.date_created)
			.toLocaleString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				hour12: true,
				timeZone: 'America/New_York',
			})
			.replace(',', '')
			.replace(',', ' @');

		// Format category mapping
		const categoryFormats = {
			question: 'Question',
			maintenance: 'Maintenance Request',
			violation: 'Violation Report',
			inquiry: 'Inquiry',
			suggestion: 'Suggestion',
			volunteer: 'Volunteer',
		};

		const firstName = requestData?.name?.split(' ')[0];

		const formattedCategory = categoryFormats[requestData.category] || '';
		if (!formattedCategory) return;

		// Main notification email data
		const mainTemplateData = {
			id: requestData.id,
			category: requestData.category || 'N/A',
			formattedCategory,
			priority: requestData.priority?.toUpperCase() || 'N/A',
			subject: requestData.subject || 'N/A',
			description: requestData.description || 'No description provided',
			dateSubmitted: dateCreated,
			contactInfo: {
				name: requestData.name || 'N/A',
				email: requestData.email || 'N/A',
				unit: requestData.unit || 'N/A',
				phone: requestData.phone || 'N/A',
			},
			preference: requestData.preference || 'Not specified',
			name: requestData.name,
			unit: requestData.unit,
		};

		// User confirmation email data
		const userTemplateData = {
			name: firstName || requestData.name,
			category: requestData.category,
			dateSubmitted: dateCreated,
		};

		const messages = [
			{
				templateId: 'd-19d84186e63f49d69f543016d8d65617',
				dynamicTemplateData: mainTemplateData,
				personalizations: [
					{
						to: [{name: '1033 Lenox Board', email: 'lenoxplazaboard@gmail.com'}],
						bcc: [
							{email: 'huestudios.com@gmail.com'},
							{email: 'valentin@vteconsultingllc.com'},
							{email: 'camila@huestudios.com'},
						],
					},
				],
				from: {
					email: 'mail@1033lenox.com',
					name: '1033 Lenox',
				},
				categories: ['1033 Lenox', 'requests'],
			},
			{
				from: {
					email: 'mail@1033lenox.com',
					name: '1033 Lenox',
				},
				personalizations: [
					{
						to: [{name: firstName || requestData.name, email: requestData.email}],
						bcc: [{email: 'huestudios.com@gmail.com'}],
					},
				],
				templateId: 'd-4222ef386310401583b8c55c384432f8',
				dynamicTemplateData: userTemplateData,
				categories: ['1033 Lenox', 'requests'],
			},
		];

		await sgMail.send(messages);
		return {success: true};
	} catch (error) {
		console.error('SendGrid error:', error);
		return {
			success: false,
			error: error.message,
		};
	}
});
