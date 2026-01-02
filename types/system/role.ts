import type {User} from './user.js';

/**
 * Directus Policy (v11+)
 * Policies define access levels and are attached to roles.
 */
export interface Policy {
	/** Unique identifier for the policy. */
	id: string;
	/** Name of the policy. */
	name: string;
	/** The policy's icon. */
	icon?: string;
	/** Description of the policy. */
	description?: string | null;
	/** Array of IP addresses that are allowed to connect to the API with this policy. */
	ip_access?: string[] | null;
	/** Whether or not this policy enforces the use of 2FA. */
	enforce_tfa?: boolean;
	/** Admin access. If true, skips all permission checks. */
	admin_access: boolean;
	/** Whether users with this policy can use the app. */
	app_access: boolean;
}

/**
 * Role-Policy junction record
 */
export interface RolePolicy {
	id: string;
	role: string;
	user?: string | null;
	sort?: number;
	policy: Policy;
}

export interface Role {
	/** Unique identifier for the role. */
	id: string;
	/** Name of the role. */
	name: string;
	/** The role's icon. */
	icon: string;
	/** Description of the role. */
	description: string | null;
	/** Array of IP addresses that are allowed to connect to the API as a user of this role. */
	ip_access: string[];
	/** Whether or not this role enforces the use of 2FA. */
	enforce_tfa: boolean;
	/**
	 * Admin role. If true, skips all permission checks.
	 * Note: In Directus v11+, this is derived from policies. The server extracts it for backwards compatibility.
	 */
	admin_access: boolean;
	/** The users in the role are allowed to use the app. */
	app_access: boolean;
	users: string | User[];
	/** Policies attached to this role (Directus v11+) */
	policies?: RolePolicy[];
}
