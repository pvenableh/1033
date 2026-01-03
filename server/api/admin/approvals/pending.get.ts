/**
 * GET /api/admin/approvals/pending
 *
 * Get all pending items (pets, vehicles, leases) awaiting approval.
 * Requires approval permission for at least one category.
 */
import { useDirectusAdmin, readItems, hasAdminAccess } from '~/server/utils/directus';
import { canApprove } from '~/server/utils/approvalPermissions';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Check if user has any approval permissions
  const canApprovePets = await canApprove(session, 'pets');
  const canApproveVehicles = await canApprove(session, 'vehicles');
  const canApproveLeases = await canApprove(session, 'leases');

  if (!canApprovePets && !canApproveVehicles && !canApproveLeases) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'You do not have permission to view pending approvals',
    });
  }

  try {
    const client = useDirectusAdmin();
    const result: {
      pets: any[];
      vehicles: any[];
      leases: any[];
      permissions: {
        pets: boolean;
        vehicles: boolean;
        leases: boolean;
      };
    } = {
      pets: [],
      vehicles: [],
      leases: [],
      permissions: {
        pets: canApprovePets,
        vehicles: canApproveVehicles,
        leases: canApproveLeases,
      },
    };

    // Fetch pending pets if user has permission
    if (canApprovePets) {
      const pets = await client.request(
        readItems('pets', {
          filter: {
            status: { _eq: 'draft' },
          },
          fields: [
            'id',
            'name',
            'category',
            'breed',
            'weight',
            'status',
            'date_created',
            'unit_id.id',
            'unit_id.number',
          ],
          sort: ['-date_created'],
        })
      );
      result.pets = pets as any[];
    }

    // Fetch pending vehicles if user has permission
    if (canApproveVehicles) {
      const vehicles = await client.request(
        readItems('vehicles', {
          filter: {
            status: { _eq: 'draft' },
          },
          fields: [
            'id',
            'make',
            'model',
            'year',
            'color',
            'license_plate',
            'state',
            'category',
            'status',
            'date_created',
            'unit_id.id',
            'unit_id.number',
          ],
          sort: ['-date_created'],
        })
      );
      result.vehicles = vehicles as any[];
    }

    // Fetch pending leases if user has permission
    if (canApproveLeases) {
      const leases = await client.request(
        readItems('leases', {
          filter: {
            status: { _eq: 'draft' },
          },
          fields: [
            'id',
            'start',
            'finish',
            'status',
            'date_created',
            'person.id',
            'person.first_name',
            'person.last_name',
            'file',
          ],
          sort: ['-date_created'],
        })
      );
      result.leases = leases as any[];
    }

    return result;
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error);

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || 'Internal Server Error',
      message: error?.message || 'Failed to fetch pending approvals',
    });
  }
});
