/**
 * PATCH /api/admin/approvals/pets/:id
 *
 * Update the status of a pet (approve or reject).
 * Requires pets approval permission.
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

  const petId = getRouterParam(event, 'id');
  if (!petId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Pet ID is required',
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
  await requireApprovalPermission(session, 'pets');

  try {
    const client = useDirectusAdmin();

    const updatedPet = await client.request(
      updateItem('pets', petId, { status })
    );

    return {
      success: true,
      pet: updatedPet,
      message: status === 'published' ? 'Pet approved successfully' : `Pet status updated to ${status}`,
    };
  } catch (error: any) {
    console.error('Error updating pet status:', error);

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || 'Internal Server Error',
      message: error?.message || 'Failed to update pet status',
    });
  }
});
