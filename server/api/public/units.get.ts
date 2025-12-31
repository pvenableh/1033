/**
 * GET /api/public/units
 *
 * Public endpoint to fetch list of units for access request form.
 * No authentication required.
 */
import { useDirectusAdmin, readItems } from '~/server/utils/directus';

export default defineEventHandler(async () => {
  try {
    const client = useDirectusAdmin();

    const units = await client.request(
      readItems('units', {
        fields: ['id', 'number'],
        filter: { status: { _eq: 'published' } },
        sort: ['number'],
      } as any)
    );

    return units;
  } catch (error: any) {
    console.error('Fetch public units error:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Failed to fetch units',
    });
  }
});
