/**
 * POST /api/directus/pets
 *
 * Create a new pet for the authenticated user.
 * Users can only create pets in units they belong to.
 * New pets are created with 'draft' status pending approval.
 */
import { getUserDirectus, readItems, createItem } from '~/server/utils/directus';

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

  // Get person_id from session
  const rawPersonId = session.user.person_id;
  const personId = typeof rawPersonId === 'object' && rawPersonId !== null ? rawPersonId.id : rawPersonId;

  if (!personId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'User has no associated person record',
    });
  }

  try {
    // Use the authenticated user's own Directus client
    const client = await getUserDirectus(event);

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
      })
    );

    if (!units || (units as any[]).length === 0) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'You do not have access to this unit',
      });
    }

    // Create the pet with draft status (pending approval)
    const petData = {
      name: body.name || null,
      category: body.category || 'Dog',
      breed: body.breed || null,
      weight: body.weight || null,
      unit_id: body.unit_id,
      status: 'draft', // Pending approval
    };

    const pet = await client.request(createItem('pets', petData));

    return pet;
  } catch (error: any) {
    console.error('Create pet error:', error);

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
      message: 'Failed to create pet',
    });
  }
});
