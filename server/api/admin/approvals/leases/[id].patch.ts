/**
 * PATCH /api/admin/approvals/leases/:id
 *
 * Update the status of a lease (approve or reject).
 * Requires leases approval permission.
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

  const leaseId = getRouterParam(event, 'id');
  if (!leaseId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Lease ID is required',
    });
  }

  const body = await readBody(event);
  const { status } = body;

  if (!status || !['published', 'draft', 'archived', 'expired'].includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Valid status is required (published, draft, archived, or expired)',
    });
  }

  // Check approval permission
  await requireApprovalPermission(session, 'leases');

  try {
    const client = useDirectusAdmin();

    const updatedLease = await client.request(
      updateItem('leases', leaseId, { status })
    );

    return {
      success: true,
      lease: updatedLease,
      message: status === 'published' ? 'Lease approved successfully' : `Lease status updated to ${status}`,
    };
  } catch (error: any) {
    console.error('Error updating lease status:', error);

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || 'Internal Server Error',
      message: error?.message || 'Failed to update lease status',
    });
  }
});
