import {createDirectus, rest, createItem, staticToken} from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.1033lenox.com';
const DIRECTUS_TOKEN = 'cb66quXi2vneyEhG8OtAFJ1jOIO31Pff';

console.log('🧪 Testing Single Activity Creation\n');

if (!DIRECTUS_TOKEN) {
	console.error('❌ DIRECTUS_TOKEN not set!');
	console.log('Usage: DIRECTUS_TOKEN=your-token node test-create-activity.js\n');
	process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

// Sample activity object matching your Swiftlane data
const testActivity = {
	status: 'published',
	type: 'access',
	vendor: 'Swiftlane',
	vendor_id: 'test_' + Date.now(),
	timestamp: new Date().toISOString(),
	name: 'Test Person',
	subject: 'Test Subject',
	access_point_name: 'Main Door',
	access_status: 'Granted',
	access_type: 'Face Unlock',
	pass_name: 'Test Pass',
	image: null,
	raw_data: {test: true},
	person: null,
};

console.log('📝 Attempting to create test activity:');
console.log(JSON.stringify(testActivity, null, 2));
console.log('');

try {
	const result = await client.request(createItem('activity', testActivity));

	console.log('✅ SUCCESS! Activity created with ID:', result.id);
	console.log('\nThis means:');
	console.log('  ✅ Token has CREATE permission');
	console.log('  ✅ All field names are correct');
	console.log('  ✅ Field types match');
	console.log('\nThe import script should work. Try running it again.\n');
} catch (error) {
	console.error('❌ FAILED to create activity\n');

	console.error('Error Message:', error.message || 'No message');

	if (error.errors) {
		console.error('\nDirectus Errors:');
		console.error(JSON.stringify(error.errors, null, 2));
	}

	if (error.response) {
		console.error('\nResponse Details:');
		console.error(error.response);
	}

	console.log('\n💡 Common Issues and Solutions:\n');

	console.log('1️⃣  Field Type Mismatch');
	console.log('   Problem: A field expects a different data type');
	console.log('   Example: "timestamp" expects datetime but got string');
	console.log('   Fix: Check your Directus collection schema\n');

	console.log('2️⃣  Missing Required Field');
	console.log('   Problem: A required field is missing or null');
	console.log('   Fix: Make fields optional in Directus or provide values\n');

	console.log("3️⃣  Field Doesn't Exist");
	console.log("   Problem: Field name in script doesn't match Directus");
	console.log('   Fix: Check spelling and compare with collection fields\n');

	console.log('4️⃣  Permission Issue');
	console.log("   Problem: Token doesn't have CREATE permission");
	console.log('   Fix: Edit token in Directus, add CREATE to activity\n');

	console.log('5️⃣  JSON Field Issue');
	console.log('   Problem: "raw_data" field type mismatch');
	console.log('   Fix: Ensure raw_data is JSON type in Directus\n');

	console.log('🔧 Next Steps:');
	console.log('  1. Read the error message above carefully');
	console.log('  2. Go to Directus → Settings → Data Model → activity');
	console.log("  3. Check each field's type and settings");
	console.log('  4. Fix any mismatches');
	console.log('  5. Run this test script again\n');

	process.exit(1);
}
