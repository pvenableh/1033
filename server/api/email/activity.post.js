import { createDirectus, rest, readItems, createItem } from '@directus/sdk';

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();

	try {
		const body = await readBody(event); // Read incoming webhook payload

		if (!Array.isArray(body)) {
			throw new Error('Invalid payload format');
		}

		// Filter events where category includes "1033 Lenox"
		const filteredEvents = body.filter((entry) => entry.category?.includes('1033 Lenox'));

		if (filteredEvents.length === 0) {
			return { message: 'No matching events found' };
		}

		const client = createDirectus(config.public.directusUrl).with(
			rest({
				headers: {
					Authorization: `Bearer ${config.public.staticToken}`,
				},
			}),
		);

		console.log('Hey Peter.....from the other side.');

		const blockedEmails = ['huestudios.com@gmail.com'];

		for (const eventData of filteredEvents) {
			const email = eventData.email;

			if (blockedEmails.includes(email)) {
				console.log(`Skipping blocked email address: ${email}`);
				continue;
			}

			let clickedUrl = null;
			if (eventData.event === 'click' || eventData.event === 'clicked') {
				clickedUrl = eventData.url; // This contains the clicked link
				console.log(`User ${email} clicked: ${clickedUrl}`);
			}

			// Try to find the person by email
			let personId = null;
			try {
				const persons = await client.request(
					readItems('people', {
						filter: { email: { _eq: email } },
					}),
				);

				if (persons && persons.length > 0) {
					personId = persons[0].id;
					console.log(`Person found with ID: ${personId}`);
				} else {
					console.warn(`User not found: ${email}`);
				}
			} catch (error) {
				console.error(`Error fetching person with email ${email}:`, error);
			}

			// Create email activity regardless of whether person exists or not
			try {
				const emailActivity = await client.request(
					createItem('email_activity', {
						status: 'published',
						person: personId, // Will be null if person not found
						event: eventData.event,
						email: email,
						sg_message_id: eventData.sg_message_id,
						announcement: eventData.announcement_id,
						clicked_url: clickedUrl,
					}),
				);
				console.log(`Created email activity: ${emailActivity.id}`);
			} catch (error) {
				console.error(`Error creating email activity for ${email}:`, error);
			}
		}

		return { message: 'Processed successfully' };
	} catch (error) {
		console.error('Error processing SendGrid webhook:', error);
		return { error: error.message };
	}
});
