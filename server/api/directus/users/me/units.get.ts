/**
 * GET /api/directus/users/me/units
 *
 * Fetch current user's units with related pets and vehicles.
 * Uses admin client to fetch all related data.
 */

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

  const config = useRuntimeConfig();
  const directusUrl = config.public.directusUrl || config.public.adminUrl;
  const staticToken = config.staticToken;

  if (!directusUrl || !staticToken) {
    console.error('units.get: Missing Directus configuration');
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Server configuration error',
    });
  }

  try {
    // First, get the user with their person_id
    console.log('units.get: Fetching user with person_id...');
    const userResponse = await $fetch<{ data: any }>(`${directusUrl}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${staticToken}`,
      },
      query: {
        fields: 'id,person_id',
      },
    });

    const user = userResponse.data;
    console.log('units.get: user =', JSON.stringify(user));

    if (!user.person_id) {
      // User has no associated person record
      console.log('units.get: No person_id, returning empty units');
      return { units: [] };
    }

    // Get the person ID (handle both object and primitive)
    const personId = typeof user.person_id === 'object' ? user.person_id.id : user.person_id;
    console.log('units.get: personId =', personId);

    // Fetch units where this person is a resident using direct API call
    // The filter syntax for M2M: filter[people][people_id][_eq]=personId
    console.log('units.get: Fetching units for personId =', personId);

    const unitsResponse = await $fetch<{ data: any[] }>(`${directusUrl}/items/units`, {
      headers: {
        Authorization: `Bearer ${staticToken}`,
      },
      query: {
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
        ].join(','),
        'filter[people][people_id][_eq]': personId,
      },
    });

    const units = unitsResponse.data || [];
    console.log('units.get: Found', units.length, 'units');

    // Format the response to match what the frontend expects
    const formattedUnits = units.map(unit => ({
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
    }, null, 2));

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error?.message || 'Failed to fetch user units',
    });
  }
});
