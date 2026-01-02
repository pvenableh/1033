/**
 * POST /api/directus/users/invite
 *
 * Invite a new user (admin only).
 *
 * This endpoint uses Directus's built-in inviteUser function, which sends
 * an email through Directus's configured email provider.
 *
 * ============================================================================
 * DIRECTUS EMAIL TEMPLATE VARIABLES
 * ============================================================================
 *
 * Configure the invite template in Directus Admin → Settings → Email Templates
 * The "User Invite" template supports these Liquid template variables:
 *
 * {{url}}              - Full invite URL with token (e.g., https://yoursite.com/auth/user-invite?token=abc123)
 * {{email}}            - Invited user's email address
 * {{project.name}}     - Your Directus project name
 * {{project.url}}      - Your Directus project URL
 * {{project.logo}}     - Your Directus project logo URL
 *
 * ============================================================================
 * SENDGRID DYNAMIC TEMPLATE VARIABLES (for custom implementation)
 * ============================================================================
 *
 * If you switch to a custom SendGrid invite email (server/api/email/invite.post.js),
 * these variables would be available from the invite form:
 *
 * {{first_name}}       - Invited user's first name
 * {{last_name}}        - Invited user's last name
 * {{full_name}}        - Invited user's full name
 * {{email}}            - Invited user's email address
 * {{role_name}}        - Name of the assigned role
 * {{unit_number}}      - Unit number (if assigned)
 * {{invite_url}}       - Full invite URL with token
 * {{date_invited}}     - Formatted date/time of invitation
 * {{inviter_name}}     - Name of admin who sent the invite (optional)
 *
 * Example SendGrid template usage:
 *   Subject: "You've been invited to 1033 Lenox"
 *   Body: "Hello {{first_name}}, click here to accept: {{invite_url}}"
 *
 * ============================================================================
 */
import { useDirectusAdmin, inviteUser } from '~/server/utils/directus';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Check if user has admin access
  const isAdmin = session.user.role?.admin_access === true;
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Admin access required',
    });
  }

  const body = await readBody(event);

  if (!body.email || typeof body.email !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Email is required',
    });
  }

  if (!body.role || typeof body.role !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Role is required',
    });
  }

  try {
    const client = useDirectusAdmin();
    const config = useRuntimeConfig();

    const inviteUrl = body.invite_url || `${config.public.siteUrl}/auth/accept-invite`;

    await client.request(inviteUser(body.email, body.role, inviteUrl));

    return {
      success: true,
      message: 'Invitation sent successfully.',
    };
  } catch (error: any) {
    console.error('Invite user error:', error);

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
      message: 'Failed to send invitation',
    });
  }
});
