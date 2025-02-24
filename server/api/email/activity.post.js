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
				// Add authorization headers manually
				headers: {
					Authorization: `Bearer ${config.public.staticToken}`,
				},
			}),
		);

		console.log('Hey Peter.....from the other side.');

		for (const eventData of filteredEvents) {
			const email = eventData.email;

			const persons = await client.request(
				readItems('people', {
					filter: { email: { _eq: email } },
				}),
			);

			if (!persons || persons.length === 0) {
				console.warn(`User not found: ${email}`);
				continue;
			}

			const person = persons[0];
			console.log(person);
			// Log email activity in Directus (access person.data directly)
			await client.request(
				createItem('email_activity', {
					person: person?.id, // Access id directly
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
