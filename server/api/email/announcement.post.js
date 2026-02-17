import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * POST /api/email/announcement
 *
 * Unified email endpoint for ALL announcement types.
 * The announcement's `template` field controls which dynamic data is included,
 * and `sendgrid_template_id` controls which SendGrid template is used.
 *
 * ============================================================================
 * TEMPLATE ROUTING
 * ============================================================================
 *
 * template field        | sendgrid_template_id              | Extra data
 * ----------------------|-----------------------------------|---------------------------
 * "Generic"             | (default) d-035e7712976d45aaa5143 | title, subtitle, content, closing
 * "Parking"             | (default) d-035e7712976d45aaa5143 | title, subtitle, content, closing, vehicles, spot
 * "Welcome"             | d-b2bb8a47af7045a7a79f32761affda05| All person/unit data (see below)
 * (any custom)          | (whatever is set)                 | Base data + template-specific enrichment
 *
 * The "Welcome" template enriches each recipient with:
 *   - last_name, category, phone
 *   - mailbox (from units collection)
 *   - vehicles array (filtered to published)
 *   - pets array (filtered to published)
 *
 * ============================================================================
 * CC OPTIONS
 * ============================================================================
 *
 * cc_board (boolean)      — CCs lenoxplazaboard@gmail.com
 * cc_management (boolean) — CCs valentin@vteconsultingllc.com, office@vteconsultingllc.com
 *
 * ============================================================================
 * DIRECTUS FLOW SETUP
 * ============================================================================
 *
 * The Directus Flow stays the same — it calls:
 *   POST https://www.1033lenox.com/api/email/announcement
 *
 * To send a welcome email:
 *   1. Create an announcement in Directus with:
 *      - template: "Welcome"
 *      - sendgrid_template_id: "d-b2bb8a47af7045a7a79f32761affda05"
 *      - title: "Welcome to 1033 Lenox" (used as subject fallback)
 *   2. Add recipients (the new owner/tenant)
 *   3. Send via the Flow or admin UI — same as any other announcement
 *
 * The endpoint detects template === "Welcome" and fetches the extra
 * person/unit data needed for the welcome template automatically.
 *
 * ============================================================================
 * EXPECTED PAYLOAD (from Directus Flow or admin UI)
 * ============================================================================
 *
 * {
 *   "data": {
 *     "data": {
 *       "id": 42,
 *       "title": "Welcome to 1033 Lenox",
 *       "subtitle": "...",
 *       "content": "...",
 *       "template": "Welcome",
 *       "sendgrid_template_id": "d-b2bb8a47af7045a7a79f32761affda05",
 *       "urgent": false,
 *       "closing": "...",
 *       "url": "welcome-to-1033-lenox",
 *       "cc_board": true,
 *       "cc_management": false
 *     },
 *     "recipients": [
 *       {
 *         "people_id": {
 *           "id": 59,
 *           "email": "sbhamou@gmail.com",
 *           "first_name": "Mickael",
 *           "last_name": "Ohana",
 *           "category": "Owner",
 *           "phone": "(917) 833-4576",
 *           "unit": [{
 *             "units_id": {
 *               "number": "201",
 *               "parking_spot": "1",
 *               "mailbox": "201",
 *               "vehicles": [...],
 *               "pets": [...]
 *             }
 *           }]
 *         }
 *       }
 *     ]
 *   }
 * }
 *
 * ============================================================================
 */

// Default template for generic/parking announcements
const DEFAULT_TEMPLATE_ID = 'd-035e7712976d45aaa5143d8a1042aee7';

// Known template IDs for convenience (can be overridden per-announcement)
const TEMPLATE_IDS = {
	Welcome: 'd-b2bb8a47af7045a7a79f32761affda05',
};

/**
 * Build dynamic template data based on announcement template type.
 *
 * - Generic/Parking: announcement content + basic person data
 * - Welcome: full person profile (unit, parking, mailbox, vehicles, pets)
 */
function buildTemplateData(template, announcementData, person, unitData) {
	// Base data — always included regardless of template
	const base = {
		email: person.email,
		first_name: person.first_name,
		unit: unitData.number,
		spot: unitData.parkingSpot,
	};

	// Template-specific enrichment
	switch (template) {
		case 'Welcome':
			return {
				...base,
				// Person details
				last_name: person.last_name,
				category: person.category,
				phone: person.phone,
				// Unit details
				mailbox: unitData.mailbox,
				// Vehicles — only published
				vehicles: (unitData.vehicles ?? [])
					.filter((v) => v.status === 'published')
					.map((v) => ({
						make: v.make,
						model: v.model,
						color: v.color,
						license_plate: v.license_plate,
					})),
				// Pets — only published
				pets: (unitData.pets ?? [])
					.filter((p) => p.status === 'published')
					.map((p) => ({
						name: p.name,
						category: p.category,
						breed: p.breed,
					})),
			};

		case 'Parking':
			return {
				...base,
				// Announcement content
				title: announcementData.title,
				subtitle: announcementData.subtitle,
				urgent: announcementData.urgent,
				content: announcementData.content,
				url: announcementData.url,
				closing: announcementData.closing,
				// Parking-specific: include vehicles
				vehicles: (unitData.vehicles ?? []).map((v) => ({
					make: v.make,
					model: v.model,
					color: v.color,
					license_plate: v.license_plate,
				})),
			};

		case 'Generic':
		default:
			return {
				...base,
				// Announcement content
				title: announcementData.title,
				subtitle: announcementData.subtitle,
				urgent: announcementData.urgent,
				content: announcementData.content,
				url: announcementData.url,
				closing: announcementData.closing,
				// Generic still passes vehicles for backwards compatibility
				vehicles: (unitData.vehicles ?? []).map((v) => ({
					make: v.make,
					model: v.model,
					color: v.color,
					license_plate: v.license_plate,
				})),
			};
	}
}

/**
 * Build CC list based on announcement flags.
 */
function buildCcList(announcementData) {
	const cc = [];
	if (announcementData.cc_board) {
		cc.push({email: 'lenoxplazaboard@gmail.com'});
	}
	if (announcementData.cc_management) {
		cc.push({email: 'valentin@vteconsultingllc.com'});
		cc.push({email: 'office@vteconsultingllc.com'});
	}
	return cc;
}

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const recipients = body.data.recipients;
	const announcementData = body.data.data;
	const template = announcementData.template || 'Generic';

	// Resolve SendGrid template ID:
	// 1. Explicit sendgrid_template_id on the announcement (highest priority)
	// 2. Known template ID mapping by template name
	// 3. Default generic template
	const templateId = announcementData.sendgrid_template_id || TEMPLATE_IDS[template] || DEFAULT_TEMPLATE_ID;

	// Build CC list once (same for all recipients)
	const cc = buildCcList(announcementData);

	const messages = recipients
		.map((element) => {
			const person = element.people_id;
			if (!person?.email) return null;

			// Extract unit data
			const unitRaw = person.unit?.[0]?.units_id;
			const unitData = {
				number: unitRaw?.number ?? null,
				parkingSpot: unitRaw?.parking_spot ?? null,
				mailbox: unitRaw?.mailbox ?? null,
				vehicles: unitRaw?.vehicles ?? [],
				pets: unitRaw?.pets ?? [],
			};

			// Build template-specific dynamic data
			const dynamicTemplateData = buildTemplateData(template, announcementData, person, unitData);

			// Build personalizations with optional CC
			const personalizations = {
				to: [{email: person.email}],
				bcc: [{email: 'huestudios.com@gmail.com'}],
			};
			if (cc.length > 0) {
				personalizations.cc = cc;
			}

			return {
				personalizations: [personalizations],
				from: {
					email: 'mail@1033lenox.com',
					name: '1033 Lenox',
				},
				template_id: templateId,
				replyTo: {
					email: 'lenoxplazaboard@gmail.com',
					name: '1033 Lenox',
				},
				dynamicTemplateData,
				custom_args: {
					announcement_id: String(announcementData.id),
					recipient_email: person.email,
					template_type: template,
				},
				categories: ['1033 Lenox', template === 'Welcome' ? 'welcome' : 'announcements'],
			};
		})
		.filter(Boolean);

	if (messages.length === 0) {
		return {success: false, message: 'No valid recipients with email addresses'};
	}

	try {
		await sgMail.send(messages);
		return {
			success: true,
			message: `${messages.length} email(s) sent successfully`,
			template_used: templateId,
			template_type: template,
		};
	} catch (error) {
		console.error('SendGrid Error:', error.response?.body || error.message);
		return {success: false, message: error.message};
	}
});
