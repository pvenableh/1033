import {createDirectus, rest, readItems, createItem, staticToken, uploadFiles} from '@directus/sdk';

// Configuration
const NUXT_APP_URL = 'https://1033lenox.com';
const DIRECTUS_URL = 'https://admin.1033lenox.com';
const DIRECTUS_TOKEN = 'cb66quXi2vneyEhG8OtAFJ1jOIO31Pff';

const EVENTS_PER_PAGE = 50;
const MAX_PAGES = 100;

// Photo handling configuration
const UPLOAD_PHOTOS_TO_DIRECTUS = 'true'; // Set to 'true' to upload photos
const DIRECTUS_FOLDER_ID = '80e44b8e-2e1d-4b9b-9ae8-fd7adc81df38'; // Optional - Directus folder UUID
const VERBOSE_MATCHING = 'true'; // Set to 'true' to see person matching details

// Initialize Directus client (will be set up in main function after token check)
let client;

/**
 * Test Directus connection
 */
async function testConnection() {
	try {
		console.log('🔍 Testing Directus connection...');

		const test = await client.request(
			readItems('activity', {
				limit: 1,
			})
		);

		console.log('✅ Connection successful!\n');
		return true;
	} catch (error) {
		console.error('❌ Connection failed!');
		console.error('Error details:', {
			message: error.message || 'Unknown error',
			errors: error.errors,
		});
		console.log('\nPossible issues:');
		console.log('  1. Invalid DIRECTUS_TOKEN');
		console.log('  2. Token doesn\'t have permission to read "activity" collection');
		console.log('  3. Network/firewall issue\n');
		return false;
	}
}

/**
 * Fetch existing vendor_id values from Directus to avoid duplicates
 */
async function getExistingVendorIds() {
	console.log('📊 Fetching existing vendor IDs from Directus...');

	try {
		const activities = await client.request(
			readItems('activity', {
				filter: {
					vendor: {_eq: 'Swiftlane'},
					vendor_id: {_nnull: true},
				},
				fields: ['vendor_id'],
				limit: -1,
			})
		);

		const vendorIds = new Set(activities.map((a) => a.vendor_id).filter(Boolean));
		console.log(`✅ Found ${vendorIds.size} existing Swiftlane events in Directus`);
		return vendorIds;
	} catch (error) {
		console.error('❌ Error fetching existing vendor IDs:', error);
		console.error('Error details:', {
			message: error.message,
			errors: error.errors,
		});
		return new Set();
	}
}

/**
 * Extract person name from employee_name field
 * Handles cases like "John Doe's guest" or "Jane Smith's Visitor"
 */
function extractPersonName(employeeName) {
	if (!employeeName) return null;

	// Check for guest/visitor patterns
	const guestPattern = /^(.+?)'s?\s+(guest|visitor|Guest|Visitor)$/i;
	const match = employeeName.match(guestPattern);

	if (match) {
		return match[1].trim(); // Return the person's name before "'s guest"
	}

	// Check for unrecognized face message
	if (employeeName.toLowerCase().includes('face was not recognized')) {
		return null; // No name to extract
	}

	// Return as-is if no pattern matches
	return employeeName;
}

/**
 * Download photo from URL and upload to Directus
 * Returns the Directus file ID or null
 */
async function uploadPhotoToDirectus(photoUrl) {
	if (!photoUrl || !UPLOAD_PHOTOS_TO_DIRECTUS) {
		return null;
	}

	try {
		// Download the photo
		const response = await fetch(photoUrl);
		if (!response.ok) {
			console.warn(`⚠️  Failed to download photo: ${response.status}`);
			return null;
		}

		// Get the image data as a blob
		const blob = await response.blob();

		// Extract filename from URL (before query params)
		const urlPath = photoUrl.split('?')[0];
		const filename = urlPath.split('/').pop() || `swiftlane-${Date.now()}.jpg`;

		// Create a File object from the blob
		const file = new File([blob], filename, {type: blob.type});

		// Create FormData and upload to Directus
		const formData = new FormData();
		formData.append('file', file);

		// Add folder if specified
		if (DIRECTUS_FOLDER_ID) {
			formData.append('folder', DIRECTUS_FOLDER_ID);
		}

		// Upload using fetch (Directus SDK uploadFiles can be tricky)
		const uploadResponse = await fetch(`${DIRECTUS_URL}/files`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${DIRECTUS_TOKEN}`,
			},
			body: formData,
		});

		if (!uploadResponse.ok) {
			console.warn(`⚠️  Failed to upload to Directus: ${uploadResponse.status}`);
			return null;
		}

		const result = await uploadResponse.json();
		return result.data.id; // Return the file ID
	} catch (error) {
		console.warn(`⚠️  Error uploading photo:`, error.message);
		return null;
	}
}

/**
 * Try to find a matching person in Directus by name
 * Handles: "Joyce Strombek Edwards" → "Joyce Edwards", middle names, etc.
 */
async function findPersonByName(name) {
	if (!name) return null;

	// Extract actual person name if it's a guest/visitor string
	const personName = extractPersonName(name);
	if (!personName) return null;

	try {
		const nameParts = personName
			.trim()
			.split(' ')
			.filter((part) => part.length > 0);
		const firstName = nameParts[0];
		const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

		if (VERBOSE_MATCHING) {
			console.log(`\n   🔍 Searching for: "${personName}"`);
			console.log(`      First: "${firstName}", Last: "${lastName}"`);
		}

		// Build a flexible search filter that tries multiple strategies
		const searchFilters = [];

		// Strategy 1: Exact first + exact last name match
		if (firstName && lastName) {
			searchFilters.push({
				_and: [{first_name: {_eq: firstName}}, {last_name: {_eq: lastName}}],
			});
		}

		// Strategy 2: First name exact + last name is contained in any part of the Swiftlane name
		// This handles middle names: "Joyce Strombek Edwards" matches "Joyce Edwards"
		if (firstName && lastName) {
			searchFilters.push({
				_and: [{first_name: {_eq: firstName}}, {last_name: {_contains: lastName}}],
			});
		}

		// Strategy 3: Try matching any word in the Swiftlane name to last name
		// Handles cases where middle name might be in Directus last_name field
		for (const part of nameParts) {
			if (part !== firstName && part.length > 2) {
				searchFilters.push({
					_and: [{first_name: {_eq: firstName}}, {last_name: {_eq: part}}],
				});
			}
		}

		// Strategy 4: First name match only (as fallback)
		// Only use if name has 2+ parts to avoid too many false matches
		if (nameParts.length >= 2) {
			searchFilters.push({
				first_name: {_eq: firstName},
			});
		}

		// Strategy 5: Partial matching on full name (last resort)
		if (nameParts.length >= 2) {
			searchFilters.push({
				_or: [{first_name: {_contains: firstName}}, {last_name: {_contains: lastName}}],
			});
		}

		// Search with all strategies
		const persons = await client.request(
			readItems('people', {
				filter: {
					_or: searchFilters,
				},
				limit: 5, // Get top 5 to pick best match
			})
		);

		if (persons && persons.length > 0) {
			if (VERBOSE_MATCHING) {
				console.log(`      ✅ Found ${persons.length} potential match(es):`);
				persons.forEach((p, i) => {
					console.log(`         ${i + 1}. ${p.first_name} ${p.last_name} (ID: ${p.id})`);
				});
			}

			// If multiple matches, try to pick the best one
			if (persons.length === 1) {
				if (VERBOSE_MATCHING) {
					console.log(`      → Selected: ${persons[0].first_name} ${persons[0].last_name}`);
				}
				return persons[0].id;
			}

			// Prioritize exact matches
			const exactMatch = persons.find((p) => p.first_name === firstName && p.last_name === lastName);
			if (exactMatch) {
				if (VERBOSE_MATCHING) {
					console.log(`      → Exact match! Selected: ${exactMatch.first_name} ${exactMatch.last_name}`);
				}
				return exactMatch.id;
			}

			// Next, try first name exact + last name in Swiftlane name
			const partialMatch = persons.find(
				(p) => p.first_name === firstName && personName.toLowerCase().includes(p.last_name.toLowerCase())
			);
			if (partialMatch) {
				if (VERBOSE_MATCHING) {
					console.log(`      → Partial match! Selected: ${partialMatch.first_name} ${partialMatch.last_name}`);
				}
				return partialMatch.id;
			}

			// Return first result if no better match found
			if (VERBOSE_MATCHING) {
				console.log(`      → Best guess: ${persons[0].first_name} ${persons[0].last_name}`);
			}
			return persons[0].id;
		}

		if (VERBOSE_MATCHING) {
			console.log(`      ❌ No match found for "${personName}"`);
		}

		return null;
	} catch (error) {
		console.warn(`⚠️  Error finding person for "${personName}":`, error.message);
		return null;
	}
}

/**
 * Fetch events from YOUR Nuxt endpoint (uses your existing working code!)
 */
async function fetchSwiftlaneEvents(page) {
	try {
		const response = await fetch(`${NUXT_APP_URL}/api/swiftlane/events?page=${page}&per_page=${EVENTS_PER_PAGE}`);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();

		// Your endpoint returns: { success: true, data: swiftlaneResponse }
		// The swiftlane response has: { data: { events_feed: [...] }, metadata: {...} }
		return data;
	} catch (error) {
		console.error(`❌ Error fetching Swiftlane events (page ${page}):`, error.message);
		throw error;
	}
}

/**
 * Map Swiftlane event to Directus activity format
 */
async function mapSwiftlaneToDirectus(event, existingIds) {
	// Skip if already imported
	if (event.id && existingIds.has(String(event.id))) {
		return null;
	}

	// Extract person name (handles "John's guest" patterns)
	const employeeName = event.employee_name;
	const extractedName = extractPersonName(employeeName);
	const personName = extractedName || event.subject;

	// Try to find matching person
	const personId = personName ? await findPersonByName(personName) : null;

	// Sanitize the event ID - convert to string
	const vendorId = event.id ? String(event.id) : null;

	// Ensure timestamp is valid ISO string
	let timestamp;
	try {
		timestamp = event.created_at ? new Date(event.created_at).toISOString() : new Date().toISOString();
	} catch (e) {
		timestamp = new Date().toISOString();
	}

	// Handle photo - either upload to Directus or save URL
	let imageValue = null;
	if (event.photo_path) {
		if (UPLOAD_PHOTOS_TO_DIRECTUS) {
			// Upload photo to Directus and get file ID
			imageValue = await uploadPhotoToDirectus(event.photo_path);
			// If upload fails, fall back to URL
			if (!imageValue) {
				imageValue = event.photo_path;
			}
		} else {
			// Just save the URL
			imageValue = event.photo_path;
		}
	}

	// Clean up raw_data - remove any circular references or problematic data
	let rawData;
	try {
		// Only store essential fields to avoid issues
		rawData = {
			id: event.id,
			employee_name: event.employee_name,
			extracted_name: extractedName, // Store the extracted name for reference
			subject: event.subject,
			access_point_name: event.access_point_name,
			access_status: event.access_status,
			access_type: event.access_type,
			pass_name: event.pass_name,
			photo_path: event.photo_path,
			created_at: event.created_at,
		};
	} catch (e) {
		rawData = {error: 'Could not serialize event data'};
	}

	// Map fields according to Directus schema
	const activity = {
		status: 'published',
		type: 'access',
		vendor: 'Swiftlane',
		vendor_id: vendorId,
		timestamp: timestamp,
		name: extractedName || event.employee_name || null, // Use extracted name if available
		subject: event.subject || null,
		access_point_name: event.access_point_name || null,
		access_status: event.access_status || null,
		access_type: event.access_type || null,
		pass_name: event.pass_name || null,
		image: imageValue,
		raw_data: rawData,
		person: personId,
	};

	return activity;
}

/**
 * Import events into Directus
 */
async function importEvents(events, existingIds) {
	let imported = 0;
	let skipped = 0;
	let errors = 0;
	let firstEventLogged = false;

	for (const event of events) {
		try {
			// Log first event for debugging
			if (!firstEventLogged && imported === 0 && skipped === 0) {
				console.log('\n   📋 Sample event from Swiftlane:');
				console.log('   ', JSON.stringify(event, null, 2).split('\n').join('\n   '));
				firstEventLogged = true;
			}

			const activity = await mapSwiftlaneToDirectus(event, existingIds);

			if (!activity) {
				skipped++;
				continue;
			}

			// Log first activity we're trying to create
			if (imported === 0 && skipped === 0) {
				console.log("\n   📝 Activity object we're creating:");
				console.log('   ', JSON.stringify(activity, null, 2).split('\n').join('\n   '));
			}

			await client.request(createItem('activity', activity));

			if (event.id) {
				existingIds.add(String(event.id));
			}

			imported++;

			if (imported % 10 === 0) {
				process.stdout.write(`\r   Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors}`);
			}
		} catch (error) {
			errors++;

			// Better error logging
			console.error(`\n❌ Error importing event ${event.id}:`);
			console.error(`   Message: ${error.message || 'No message'}`);

			if (error.errors) {
				console.error(`   Directus Errors:`, JSON.stringify(error.errors, null, 2));
			}

			// Log the activity object we tried to create (helpful for debugging)
			if (errors === 1) {
				console.error(`\n   📋 Event data that failed:`);
				console.error('   ', JSON.stringify(event, null, 2).split('\n').join('\n   '));

				try {
					const activity = await mapSwiftlaneToDirectus(event, new Set());
					console.error(`\n   📝 Activity object we tried to create:`);
					console.error('   ', JSON.stringify(activity, null, 2).split('\n').join('\n   '));
				} catch (e) {
					console.error('   Could not recreate activity object');
				}
			}

			// Stop after 3 errors to avoid flooding the console
			if (errors >= 3) {
				console.error(`\n⚠️  Stopping after 3 errors.`);
				console.error('   Check the error messages above to fix the issue.\n');
				throw new Error('Too many import errors');
			}
		}
	}

	return {imported, skipped, errors};
}

/**
 * Main import function
 */
async function main() {
	console.log('🚀 Starting Swiftlane historical event import...');
	console.log(`   Using Nuxt endpoint: ${NUXT_APP_URL}/api/swiftlane/events`);
	console.log(`   Photo handling: ${UPLOAD_PHOTOS_TO_DIRECTUS ? 'Upload to Directus' : 'Save URLs only'}`);
	if (UPLOAD_PHOTOS_TO_DIRECTUS && DIRECTUS_FOLDER_ID) {
		console.log(`   Upload folder: ${DIRECTUS_FOLDER_ID}`);
	}
	console.log('');

	// Check for Directus token
	if (!DIRECTUS_TOKEN) {
		console.error('❌ DIRECTUS_TOKEN environment variable not set!');
		console.log('   Usage: DIRECTUS_TOKEN=your-token node import-from-nuxt.js');
		process.exit(1);
	}

	// Initialize Directus client with authentication
	console.log('🔐 Connecting to Directus...');
	client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

	// Test connection
	const connected = await testConnection();
	if (!connected) {
		console.error('❌ Cannot proceed without valid Directus connection');
		process.exit(1);
	}

	try {
		// Step 1: Get existing vendor IDs
		const existingIds = await getExistingVendorIds();
		console.log('');

		// Step 2: Paginate through YOUR Nuxt endpoint
		let currentPage = 1;
		let hasMore = true;
		let totalImported = 0;
		let totalSkipped = 0;
		let totalErrors = 0;

		while (hasMore && currentPage <= MAX_PAGES) {
			console.log(`\n📄 Fetching page ${currentPage} from Nuxt endpoint...`);

			try {
				const response = await fetchSwiftlaneEvents(currentPage);

				// Your endpoint returns: { success: true, data: swiftlaneResponse }
				if (!response.success) {
					console.error('   ❌ Endpoint returned error:', response.error);
					break;
				}

				// Extract events from your endpoint's response structure
				// Your endpoint wraps: { success: true, data: { data: { events_feed: [...] } } }
				const events = response.data?.data?.events_feed || [];

				if (events.length === 0) {
					console.log('   No more events found');
					hasMore = false;
					break;
				}

				console.log(`   Found ${events.length} events`);

				// Import events from this page
				const result = await importEvents(events, existingIds);
				totalImported += result.imported;
				totalSkipped += result.skipped;
				totalErrors += result.errors;

				console.log(
					`\n   ✅ Page ${currentPage}: Imported ${result.imported}, Skipped ${result.skipped}, Errors ${result.errors}`
				);

				// Check if there are more pages
				hasMore = response.data?.metadata?.has_next || false;
				currentPage++;

				// Small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 500));
			} catch (error) {
				console.error(`\n❌ Error on page ${currentPage}:`, error.message);

				if (error.message.includes('ECONNREFUSED')) {
					console.error('\n💡 Make sure your Nuxt app is running!');
					console.error('   Start it with: npm run dev');
					process.exit(1);
				}

				console.log('   Continuing to next page...');
				currentPage++;
			}
		}

		// Final summary
		console.log('\n' + '='.repeat(50));
		console.log('📊 Import Complete!');
		console.log('='.repeat(50));
		console.log(`✅ Total Imported: ${totalImported}`);
		console.log(`⏭️  Total Skipped:  ${totalSkipped} (duplicates)`);
		console.log(`❌ Total Errors:   ${totalErrors}`);
		console.log(`📄 Pages Processed: ${currentPage - 1}`);
		console.log('='.repeat(50));
	} catch (error) {
		console.error('\n❌ Fatal error:', error);
		process.exit(1);
	}
}

// Run the script
main().catch(console.error);
