/**
 * PATCH /api/admin/approvals/vehicles/:id
 *
 * Update the status of a vehicle (approve or reject).
 * Requires vehicles approval permission.
 */
import { useDirectusAdmin, updateItem } from '~/server/utils/directus';
import { requireApprovalPermission } from '~/server/utils/approvalPermissions';

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
  const { status } = body;

  if (!status || !['published', 'draft', 'archived'].includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Valid status is required (published, draft, or archived)',
    });
  }

  // Check approval permission
  await requireApprovalPermission(session, 'vehicles');

  try {
    const client = useDirectusAdmin();

    const updatedVehicle = await client.request(
      updateItem('vehicles', vehicleId, { status })
    );

    return {
      success: true,
      vehicle: updatedVehicle,
      message: status === 'published' ? 'Vehicle approved successfully' : `Vehicle status updated to ${status}`,
    };
  } catch (error: any) {
    console.error('Error updating vehicle status:', error);

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || 'Internal Server Error',
      message: error?.message || 'Failed to update vehicle status',
    });
  }
});
