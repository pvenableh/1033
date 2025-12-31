/**
 * DELETE /api/directus/pets/:id
 *
 * Delete a pet.
 * Users can only delete pets in units they belong to.
 */
import { useDirectusAdmin, readUser, readItems, readItem, deleteItem } from '~/server/utils/directus';

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
      } as any)
    );

    if (!units || (units as any[]).length === 0) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'You do not have access to this pet',
      });
    }

    await client.request(deleteItem('pets', petId));

    return { success: true };
  } catch (error: any) {
    console.error('Delete pet error:', error);

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
      message: 'Failed to delete pet',
    });
  }
});
