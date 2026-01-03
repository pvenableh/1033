/**
 * GET /api/directus/users/me/units
 *
 * Fetch current user's units with related pets and vehicles.
 * Uses public client since units are publicly readable.
 * The person_id from session is used to filter units.
 */
import { getPublicDirectus, readItems } from '~/server/utils/directus';

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
  // Get person_id directly from session (stored during login)
  const personId = session.user.person_id;

  console.log('units.get: userId =', userId, 'personId =', personId);

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'User ID not found in session',
    });
  }

  // If no person_id in session, user has no associated person record
  if (!personId) {
    console.log('units.get: No person_id in session, returning empty units');
    return { units: [] };
  }

  try {
    // Use public Directus client since units are publicly readable
    const client = getPublicDirectus();

    // Fetch units where the current person is linked
    // Filter units by the people relationship to find the user's units
    console.log('units.get: Fetching units for personId =', personId);

    const units = await client.request(
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
          status: { _eq: 'published' },
          people: {
            people_id: {
              id: { _eq: personId },
            },
          },
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
