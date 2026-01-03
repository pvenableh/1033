/**
 * Server-side approval permission utilities
 *
 * Checks if users have permission to approve pets, vehicles, or leases.
 */
import { useDirectusAdmin, readItems, hasAdminAccess } from './directus';

export type ApprovalCategory = 'pets' | 'vehicles' | 'leases';

/**
 * Check if a user has permission to approve items in a category
 *
 * Permission hierarchy:
 * 1. Admins can always approve
 * 2. Board members can always approve (unless explicitly denied)
 * 3. Users with specific approval permission can approve
 */
export async function canApprove(
  session: any,
  category: ApprovalCategory
): Promise<boolean> {
  if (!session?.user) {
    return false;
  }

  // Admins can always approve
  if (hasAdminAccess(session)) {
    return true;
  }

  // Check if user is a board member
  const isBoardMember = await checkBoardMembership(session);
  if (isBoardMember) {
    return true;
  }

  // Check granular approval permission
  const hasApprovalPermission = await checkApprovalPermission(session, category);
  return hasApprovalPermission;
}

/**
 * Check if user is an active board member
 */
async function checkBoardMembership(session: any): Promise<boolean> {
  const personId = session.user.person_id;
  if (!personId) {
    return false;
  }

  try {
    const client = useDirectusAdmin();
    const now = new Date().toISOString();

    // Check for active board membership
    const boardMembers = await client.request(
      readItems('board_member', {
        filter: {
          person: { _eq: personId },
          status: { _eq: 'published' },
          _or: [
            { start: { _null: true } },
            { start: { _lte: now } },
          ],
          _and: [
            {
              _or: [
                { finish: { _null: true } },
                { finish: { _gte: now } },
              ],
            },
          ],
        },
        limit: 1,
      })
    );

    return (boardMembers as any[]).length > 0;
  } catch (error) {
    console.error('Error checking board membership:', error);
    return false;
  }
}

/**
 * Check if user has granular approval permission for a category
 */
async function checkApprovalPermission(
  session: any,
  category: ApprovalCategory
): Promise<boolean> {
  const personId = session.user.person_id;
  if (!personId) {
    return false;
  }

  try {
    const client = useDirectusAdmin();

    // Get user's permission record
    const permissions = await client.request(
      readItems('user_permissions', {
        filter: {
          person_id: { _eq: personId },
          status: { _eq: 'published' },
        },
        fields: [`${category}_approve`],
        limit: 1,
      })
    );

    if (!permissions || (permissions as any[]).length === 0) {
      return false;
    }

    const permissionKey = `${category}_approve` as const;
    return (permissions as any[])[0][permissionKey] === true;
  } catch (error) {
    console.error('Error checking approval permission:', error);
    return false;
  }
}

/**
 * Require approval permission or throw an error
 */
export async function requireApprovalPermission(
  session: any,
  category: ApprovalCategory
): Promise<void> {
  const allowed = await canApprove(session, category);
  if (!allowed) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: `You do not have permission to approve ${category}`,
    });
  }
}
