/**
 * PATCH /api/directus/vehicles/:id
 *
 * Update an existing vehicle.
 * Users can only update vehicles in units they belong to.
 * Updates set status back to 'draft' pending re-approval.
 */
import { useDirectusAdmin, readUser, readItems, readItem, updateItem } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const vehicleId = getRouterParam(event, 'id');
  if (!vehicleId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Vehicle ID is required',
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

    // Get the vehicle to find its unit
    const vehicle = await client.request(
      readItem('vehicles', vehicleId, {
        fields: ['id', 'unit_id'],
      } as any)
    );

    if (!vehicle) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Vehicle not found',
      });
    }

    const unitId = typeof vehicle.unit_id === 'object' ? vehicle.unit_id.id : vehicle.unit_id;

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
        message: 'You do not have access to this vehicle',
      });
    }

    // Allowed fields for update
    const allowedFields = ['make', 'model', 'year', 'color', 'license_plate', 'state', 'category'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Set status back to draft for re-approval
    updateData.status = 'draft';

    const updatedVehicle = await client.request(updateItem('vehicles', vehicleId, updateData));

    return updatedVehicle;
  } catch (error: any) {
    console.error('Update vehicle error:', error);

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
      message: 'Failed to update vehicle',
    });
  }
});
