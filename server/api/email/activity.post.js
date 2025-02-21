export default defineEventHandler(async (event) => {
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

		// Get Directus instance
		const directus = useDirectus();

		for (const eventData of filteredEvents) {
			const email = eventData.email;

			// Check if user exists
			const person = await directus.items('people').readByQuery({
				filter: { email: { _eq: email } },
			});

			if (!person?.data || person.data.length === 0) {
				console.warn(`User not found: ${email}`);
				continue;
			}

			// Log email activity in Directus
			await directus.items('email_activity').createOne({
				person: person.data[0]?.id,
				event: eventData.event,
				email: email,
				sg_message_id: eventData.sg_message_id,
				announcement: eventData.announcement_id,
			});
		}

		return { message: 'Processed successfully' };
	} catch (error) {
		console.error('Error processing SendGrid webhook:', error);
		return { error: error.message };
	}
});
