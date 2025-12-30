import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default defineEventHandler(async (event) => {
	try {
		const requestData = await readBody(event);

		// Format the date
		const dateCreated = new Date()
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

		// Admin notification email
		const adminMessage = {
			from: {
				email: 'mail@1033lenox.com',
				name: '1033 Lenox',
			},
			personalizations: [
				{
					to: [{name: '1033 Lenox Board', email: 'lenoxplazaboard@gmail.com'}],
					bcc: [
						{email: 'huestudios.com@gmail.com'},
					],
				},
			],
			subject: `New Access Request: ${requestData.first_name} ${requestData.last_name}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">New Access Request</h2>
					<p>A new user has requested access to the 1033 Lenox portal.</p>

					<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
						<tr style="background: #f5f5f5;">
							<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Name</td>
							<td style="padding: 12px; border: 1px solid #ddd;">${requestData.first_name} ${requestData.last_name}</td>
						</tr>
						<tr>
							<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Email</td>
							<td style="padding: 12px; border: 1px solid #ddd;">${requestData.email}</td>
						</tr>
						<tr style="background: #f5f5f5;">
							<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
							<td style="padding: 12px; border: 1px solid #ddd;">${requestData.phone || 'Not provided'}</td>
						</tr>
						<tr>
							<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Unit Number</td>
							<td style="padding: 12px; border: 1px solid #ddd;">${requestData.unit_number}</td>
						</tr>
						<tr style="background: #f5f5f5;">
							<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Residency Type</td>
							<td style="padding: 12px; border: 1px solid #ddd;">${requestData.residency_type}</td>
						</tr>
						<tr>
							<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Requested</td>
							<td style="padding: 12px; border: 1px solid #ddd;">${dateCreated}</td>
						</tr>
					</table>

					<p style="margin-top: 20px;">
						<a href="https://admin.1033lenox.com/admin/content/directus_users"
						   style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
							Review in Directus
						</a>
					</p>

					<p style="color: #666; font-size: 14px; margin-top: 30px;">
						To approve this user, change their status from "Draft" to "Active" and assign the appropriate role (Member, Board Member, etc.) in Directus.
					</p>
				</div>
			`,
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
			subject: 'Access Request Received - 1033 Lenox',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">Access Request Received</h2>

					<p>Hi ${requestData.first_name},</p>

					<p>Thank you for requesting access to the 1033 Lenox resident portal. We have received your request and it is pending review by our building management.</p>

					<p>You will receive an email notification once your account has been approved.</p>

					<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<p style="margin: 0;"><strong>Request Details:</strong></p>
						<ul style="margin: 10px 0 0 0; padding-left: 20px;">
							<li>Unit: ${requestData.unit_number}</li>
							<li>Residency Type: ${requestData.residency_type}</li>
							<li>Submitted: ${dateCreated}</li>
						</ul>
					</div>

					<p>If you have any questions, please contact the building management.</p>

					<p style="color: #666; font-size: 14px; margin-top: 30px;">
						Best regards,<br>
						1033 Lenox HOA
					</p>
				</div>
			`,
			categories: ['1033 Lenox', 'access-requests'],
		};

		await sgMail.send([adminMessage, userMessage]);
		return {success: true};
	} catch (error) {
		console.error('SendGrid error:', error);
		return {
			success: false,
			error: error.message,
		};
	}
});
