/**
 * POST /api/directus/vehicles
 *
 * Create a new vehicle for the authenticated user.
 * Users can only create vehicles in units they belong to.
 * New vehicles are created with 'draft' status pending approval.
 */
import { useDirectusAdmin, readUser, readItems, createItem } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const body = await readBody(event);

  if (!body.unit_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Unit ID is required',
    });
  }

  const userId = session.user.id;

  try {
    const client = useDirectusAdmin();

    // Get user's person_id
    const user = await client.request(
      readUser(userId, {
        fields: ['id', 'person_id'],
      } as any)
    );

    if (!user.person_id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'User has no associated person record',
      });
    }

    const personId = typeof user.person_id === 'object' ? user.person_id.id : user.person_id;

    // Verify user belongs to this unit
    const units = await client.request(
      readItems('units', {
        filter: {
          id: { _eq: body.unit_id },
          people: {
            people_id: { _eq: personId },
          },
        },
        limit: 1,
      } as any)
    );

    if (!units || (units as any[]).length === 0) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'You do not have access to this unit',
      });
    }

    // Create the vehicle with draft status (pending approval)
    const vehicleData = {
      make: body.make || null,
      model: body.model || null,
      year: body.year || null,
      color: body.color || null,
      license_plate: body.license_plate || null,
      state: body.state || null,
      category: body.category || null,
      unit_id: body.unit_id,
      status: 'draft', // Pending approval
    };

    const vehicle = await client.request(createItem('vehicles', vehicleData));

    return vehicle;
  } catch (error: any) {
    console.error('Create vehicle error:', error);

    if (error.statusCode) {
      throw error;
    }

    if (error?.errors?.[0]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: error.errors[0].message,
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to create vehicle',
    });
  }
});
