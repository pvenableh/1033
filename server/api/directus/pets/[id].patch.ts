/**
 * PATCH /api/directus/pets/:id
 *
 * Update an existing pet.
 * Users can only update pets in units they belong to.
 * Updates set status back to 'draft' pending re-approval.
 */
import { getUserDirectus, readItems, readItem, updateItem } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const petId = getRouterParam(event, 'id');
  if (!petId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Pet ID is required',
    });
  }

  const body = await readBody(event);

  if (!body || Object.keys(body).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Update data is required',
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

    // Get the pet to find its unit
    const pet = await client.request(
      readItem('pets', petId, {
        fields: ['id', 'unit_id'],
      } as any)
    );

    if (!pet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Pet not found',
      });
    }

    const unitId = typeof pet.unit_id === 'object' ? pet.unit_id.id : pet.unit_id;

    // Verify user belongs to this unit
    const units = await client.request(
      readItems('units', {
        filter: {
          id: { _eq: unitId },
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
        message: 'You do not have access to this pet',
      });
    }

    // Allowed fields for update
    const allowedFields = ['name', 'category', 'breed', 'weight'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Set status back to draft for re-approval
    updateData.status = 'draft';

    const updatedPet = await client.request(updateItem('pets', petId, updateData));

    return updatedPet;
  } catch (error: any) {
    console.error('Update pet error:', error);

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
      message: 'Failed to update pet',
    });
  }
});
