import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * SendGrid Dynamic Template Variables for Access Request Emails
 *
 * ADMIN NOTIFICATION TEMPLATE:
 * Template ID: (create in SendGrid and add below)
 *
 * Available variables:
 * {{first_name}}      - Requester's first name
 * {{last_name}}       - Requester's last name
 * {{full_name}}       - Requester's full name
 * {{email}}           - Requester's email address
 * {{phone}}           - Requester's phone number (or "Not provided")
 * {{unit_number}}     - Unit number they're requesting access for
 * {{residency_type}}  - "Owner", "Tenant", or "Property Manager"
 * {{date_submitted}}  - Formatted date/time of request
 * {{admin_url}}       - Direct link to Directus users admin
 *
 * USER CONFIRMATION TEMPLATE:
 * Template ID: (create in SendGrid and add below)
 *
 * Available variables:
 * {{first_name}}      - User's first name
 * {{last_name}}       - User's last name
 * {{full_name}}       - User's full name
 * {{email}}           - User's email address
 * {{unit_number}}     - Unit number requested
 * {{residency_type}}  - "Owner", "Tenant", or "Property Manager"
 * {{date_submitted}}  - Formatted date/time of request
 */

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();

	try {
		const requestData = await readBody(event);

		// Format the date
		const dateSubmitted = new Date()
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

		// Common template data
		const baseTemplateData = {
			first_name: requestData.first_name,
			last_name: requestData.last_name,
			full_name: `${requestData.first_name} ${requestData.last_name}`,
			email: requestData.email,
			phone: requestData.phone || 'Not provided',
			unit_number: requestData.unit_number,
			residency_type: requestData.residency_type,
			date_submitted: dateSubmitted,
		};

		// Admin notification email
		const adminMessage = {
			from: {
				email: 'mail@1033lenox.com',
				name: '1033 Lenox',
			},
			personalizations: [
				{
					to: [{name: '1033 Lenox Board', email: 'lenoxplazaboard@gmail.com'}],
					bcc: [{email: 'huestudios.com@gmail.com'}],
				},
			],
			template_id: config.sendgridAccessRequestAdminTemplate,
			dynamicTemplateData: {
				...baseTemplateData,
				admin_url: 'https://admin.1033lenox.com/admin/content/directus_users',
			},
			categories: ['1033 Lenox', 'access-requests'],
		};

		// User confirmation email
		const userMessage = {
			from: {
				email: 'mail@1033lenox.com',
				name: '1033 Lenox',
			},
			personalizations: [
				{
					to: [{name: `${requestData.first_name} ${requestData.last_name}`, email: requestData.email}],
				},
			],
			replyTo: {
				email: 'lenoxplazaboard@gmail.com',
				name: '1033 Lenox',
			},
			template_id: config.sendgridAccessRequestUserTemplate,
			dynamicTemplateData: baseTemplateData,
			categories: ['1033 Lenox', 'access-requests'],
		};

		await sgMail.send([adminMessage, userMessage]);
		return {success: true};
	} catch (error) {
		console.error('SendGrid error:', error.response?.body || error.message);
		return {
			success: false,
			error: error.message,
		};
	}
});
