/**
 * GET /api/directus/users/me/units
 *
 * Fetch current user's units with related pets and vehicles.
 * Uses admin client to fetch all related data.
 */
import { useDirectusAdmin, readItems, readUser } from '~/server/utils/directus';

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

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'User ID not found in session',
    });
  }

  try {
    const client = useDirectusAdmin();

    // First, get the user with their person_id
    const user = await client.request(
      readUser(userId, {
        fields: ['id', 'person_id'],
      } as any)
    );

    if (!user.person_id) {
      // User has no associated person record
      return { units: [] };
    }

    // Get the person ID (handle both object and primitive)
    const personId = typeof user.person_id === 'object' ? user.person_id.id : user.person_id;

    // Fetch units where this person is a resident
    // Units have a many-to-many relationship with people through units_people junction
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
          people: {
            people_id: {
              _eq: personId,
            },
          },
        },
      } as any)
    );

    // Format the response to match what the frontend expects
    const formattedUnits = (units as any[]).map(unit => ({
      units_id: unit,
    }));

    return { units: formattedUnits };
  } catch (error: any) {
    console.error('Fetch user units error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to fetch user units',
    });
  }
});
