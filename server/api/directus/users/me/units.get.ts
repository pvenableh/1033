/**
 * GET /api/directus/users/me/units
 *
 * Fetch current user's units with related pets and vehicles.
 * Uses admin client to fetch all related data.
 */
import { useDirectusAdmin, readUser, readItems } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const userId = session.user.id;
  console.log('units.get: userId =', userId);

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'User ID not found in session',
    });
  }

  try {
    // Get the admin Directus client
    const adminClient = useDirectusAdmin();

    // First, get the user with their person_id
    console.log('units.get: Fetching user with person_id...');
    const user = await adminClient.request(
      readUser(userId, {
        fields: ['id', 'person_id'],
      })
    );

    console.log('units.get: user =', JSON.stringify(user));

    if (!user.person_id) {
      // User has no associated person record
      console.log('units.get: No person_id, returning empty units');
      return { units: [] };
    }

    // Get the person ID (handle both object and primitive)
    const personId = typeof user.person_id === 'object' ? (user.person_id as any).id : user.person_id;
    console.log('units.get: personId =', personId);

    // Query the junction table to get unit IDs for this person
    console.log('units.get: Fetching junction table for personId =', personId);

    const junctionData = await adminClient.request(
      readItems('units_people', {
        fields: ['units_id'],
        filter: {
          people_id: { _eq: personId },
        },
      })
    );

    console.log('units.get: Junction data =', JSON.stringify(junctionData));

    if (!junctionData || junctionData.length === 0) {
      console.log('units.get: No units found for this person');
      return { units: [] };
    }

    // Get the unit IDs
    const unitIds = junctionData.map((j: any) => j.units_id).filter(Boolean);
    console.log('units.get: Unit IDs =', unitIds);

    if (unitIds.length === 0) {
      return { units: [] };
    }

    // Fetch the full unit data with pets and vehicles
    const units = await adminClient.request(
      readItems('units', {
        fields: [
          'id',
          'number',
          'parking_spot',
          'occupant',
          'status',
          'people.id',
          'people.people_id.id',
          'people.people_id.first_name',
          'people.people_id.last_name',
          'people.people_id.phone',
          'pets.id',
          'pets.name',
          'pets.category',
          'pets.breed',
          'pets.weight',
          'pets.image',
          'pets.status',
          'vehicles.id',
          'vehicles.make',
          'vehicles.model',
          'vehicles.year',
          'vehicles.color',
          'vehicles.license_plate',
          'vehicles.state',
          'vehicles.category',
          'vehicles.parking_spot',
          'vehicles.status',
        ],
        filter: {
          id: { _in: unitIds },
        },
      })
    );

    console.log('units.get: Found', units?.length || 0, 'units');

    // Format the response to match what the frontend expects
    const formattedUnits = (units || []).map((unit: any) => ({
      units_id: unit,
    }));

    return { units: formattedUnits };
  } catch (error: any) {
    console.error('Fetch user units error:', error);
    console.error('Error details:', JSON.stringify({
      message: error?.message,
      errors: error?.errors,
      data: error?.data,
      statusCode: error?.statusCode,
      statusMessage: error?.statusMessage,
      responseStatus: error?.response?.status,
    }, null, 2));

    // Get the status code from various possible locations
    const statusCode = error?.statusCode || error?.response?.status || error?.status;
    const errorMessage = error?.errors?.[0]?.message || error?.message || 'Failed to fetch user units';

    // Handle specific Directus error codes
    if (statusCode === 403) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'You do not have permission to access this resource. Please contact an administrator.',
      });
    }

    if (statusCode === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'Authentication required. Please log in again.',
      });
    }

    // For any other error, throw a properly formatted H3 error
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: statusCode ? 'Error' : 'Internal Server Error',
      message: errorMessage,
    });
  }
});
