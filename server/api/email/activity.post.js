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

		const directus = createDirectus(config.public.adminUrl).with(rest()).with(authentication());

		await directus.setToken(config.public.staticToken);

		const testItems = await directus.request(readItems('announcements'));
		console.log(testItems);

		for (const eventData of filteredEvents) {
			const email = eventData.email;

			const persons = await directus.request(
				readItems('people', {
					filter: { email: { _eq: email } },
				}),
			);

			if (!persons || persons.length === 0) {
				console.warn(`User not found: ${email}`);
				continue;
			}

			const person = persons[0];
			// Log email activity in Directus (access person.data directly)
			await directus.request(
				createItem('email_activity', {
					person: person.data.id, // Access id directly
					event: eventData.event,
					email: email,
					sg_message_id: eventData.sg_message_id,
					announcement: eventData.announcement_id,
				}),
			);
		}

		return { message: 'Processed successfully' };
	} catch (error) {
		console.error('Error processing SendGrid webhook:', error);
		return { error: error.message };
	}
});
