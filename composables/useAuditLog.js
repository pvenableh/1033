// composables/useAuditLog.js
// Audit trail logging for HOA financial compliance

export const useAuditLog = () => {
	const auditLogsCollection = useDirectusItems('audit_logs');
	const { user } = useDirectusAuth();

	// State
	const loading = ref(false);
	const error = ref(null);
	const logs = ref([]);

	// Fetch audit logs
	const fetchLogs = async (filters = {}) => {
		loading.value = true;
		error.value = null;

		try {
			const filter = {};

			if (filters.collection) {
				filter.collection = { _eq: filters.collection };
			}

			if (filters.itemId) {
				filter.item_id = { _eq: filters.itemId };
			}

			if (filters.action) {
				filter.action = { _eq: filters.action };
			}

			if (filters.userId) {
				filter.user_id = { _eq: filters.userId };
			}

			if (filters.startDate) {
				filter.date_created = { _gte: filters.startDate };
			}

			if (filters.endDate) {
				filter.date_created = {
					...filter.date_created,
					_lte: filters.endDate,
				};
			}

			const data = await auditLogsCollection.list({
				filter: Object.keys(filter).length > 0 ? filter : undefined,
				sort: ['-date_created'],
				fields: ['*', 'user_id.first_name', 'user_id.last_name', 'user_id.email'],
				limit: filters.limit || 100,
			});

			logs.value = data || [];
		} catch (e) {
			error.value = e.message || 'Error fetching audit logs';
			console.error('Error fetching audit logs:', e);
		} finally {
			loading.value = false;
		}
	};

	// Create an audit log entry
	// Convert an object to Array<{ value: string }> format for Directus storage
	const serializeValues = (values) => {
		if (!values) return null;
		if (Array.isArray(values)) return values;
		return Object.entries(values).map(([key, val]) => ({
			value: `${key}: ${JSON.stringify(val)}`,
		}));
	};

	// Parse Array<{ value: string }> back to an object for display
	const deserializeValues = (values) => {
		if (!values) return null;
		if (!Array.isArray(values)) return values;
		const obj = {};
		for (const item of values) {
			const str = item.value || '';
			const colonIdx = str.indexOf(': ');
			if (colonIdx > -1) {
				const key = str.substring(0, colonIdx);
				try {
					obj[key] = JSON.parse(str.substring(colonIdx + 2));
				} catch {
					obj[key] = str.substring(colonIdx + 2);
				}
			}
		}
		return obj;
	};

	const logAction = async (action, collection, itemId, options = {}) => {
		try {
			const logEntry = {
				action,
				collection,
				item_id: itemId,
				user_id: user.value?.id,
				old_values: options.oldValues ? serializeValues(options.oldValues) : null,
				new_values: options.newValues ? serializeValues(options.newValues) : null,
				ip_address: options.ipAddress || null,
				user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
				notes: options.notes || null,
			};

			const result = await auditLogsCollection.create(logEntry);
			return result;
		} catch (e) {
			console.error('Error creating audit log:', e);
			// Don't throw - audit logging should not break the main operation
			return null;
		}
	};

	// Log a create action
	const logCreate = async (collection, itemId, newValues, notes = null) => {
		return logAction('create', collection, itemId, { newValues, notes });
	};

	// Log an update action
	const logUpdate = async (collection, itemId, oldValues, newValues, notes = null) => {
		return logAction('update', collection, itemId, { oldValues, newValues, notes });
	};

	// Log a delete action
	const logDelete = async (collection, itemId, oldValues, notes = null) => {
		return logAction('delete', collection, itemId, { oldValues, notes });
	};

	// Log a reconciliation action
	const logReconcile = async (transactionId, notes = null) => {
		return logAction('reconcile', 'transactions', transactionId, { notes });
	};

	// Log an approval action
	const logApprove = async (collection, itemId, notes = null) => {
		return logAction('approve', collection, itemId, { notes });
	};

	// Log user login
	const logLogin = async () => {
		if (!user.value?.id) return null;
		return logAction('login', 'directus_users', parseInt(user.value.id) || 0, {
			notes: 'User logged in',
		});
	};

	// Log user logout
	const logLogout = async () => {
		if (!user.value?.id) return null;
		return logAction('logout', 'directus_users', parseInt(user.value.id) || 0, {
			notes: 'User logged out',
		});
	};

	// Get logs for a specific item
	const getItemHistory = async (collection, itemId) => {
		await fetchLogs({ collection, itemId, limit: 50 });
		return logs.value;
	};

	// Get recent activity
	const getRecentActivity = async (limit = 20) => {
		await fetchLogs({ limit });
		return logs.value;
	};

	// Get user activity
	const getUserActivity = async (userId, limit = 50) => {
		await fetchLogs({ userId, limit });
		return logs.value;
	};

	// Format log entry for display
	const formatLogEntry = (log) => {
		const actionLabels = {
			create: 'Created',
			update: 'Updated',
			delete: 'Deleted',
			login: 'Logged in',
			logout: 'Logged out',
			approve: 'Approved',
			reconcile: 'Reconciled',
		};

		const collectionLabels = {
			transactions: 'Transaction',
			budget_categories: 'Budget Category',
			budget_items: 'Budget Item',
			monthly_statements: 'Monthly Statement',
			reconciliation_notes: 'Reconciliation Note',
			compliance_alerts: 'Compliance Alert',
			reserve_studies: 'Reserve Study',
			reserve_components: 'Reserve Component',
			assessment_ledger: 'Assessment Entry',
			directus_users: 'User Account',
		};

		const userName = log.user_id
			? `${log.user_id.first_name || ''} ${log.user_id.last_name || ''}`.trim() || log.user_id.email
			: 'System';

		return {
			id: log.id,
			action: actionLabels[log.action] || log.action,
			collection: collectionLabels[log.collection] || log.collection,
			itemId: log.item_id,
			user: userName,
			timestamp: log.date_created,
			notes: log.notes,
			changes: formatChanges(log.old_values, log.new_values),
		};
	};

	// Format changes between old and new values
	const formatChanges = (oldValues, newValues) => {
		if (!oldValues && !newValues) return [];

		// Deserialize from Directus Array<{ value: string }> format
		const oldObj = deserializeValues(oldValues) || {};
		const newObj = deserializeValues(newValues) || {};

		const changes = [];
		const allKeys = new Set([
			...Object.keys(oldObj),
			...Object.keys(newObj),
		]);

		// Fields to ignore in change display
		const ignoredFields = ['date_updated', 'user_updated', 'date_created', 'user_created'];

		for (const key of allKeys) {
			if (ignoredFields.includes(key)) continue;

			const oldVal = oldObj[key];
			const newVal = newObj[key];

			if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
				changes.push({
					field: key,
					oldValue: oldVal,
					newValue: newVal,
				});
			}
		}

		return changes;
	};

	// Computed: Formatted logs
	const formattedLogs = computed(() => {
		return logs.value.map(formatLogEntry);
	});

	// Computed: Activity summary
	const activitySummary = computed(() => {
		const summary = {
			total: logs.value.length,
			byAction: {},
			byCollection: {},
			byUser: {},
		};

		for (const log of logs.value) {
			summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;
			summary.byCollection[log.collection] = (summary.byCollection[log.collection] || 0) + 1;

			const userId = typeof log.user_id === 'object' ? log.user_id?.id : log.user_id;
			if (userId) {
				summary.byUser[userId] = (summary.byUser[userId] || 0) + 1;
			}
		}

		return summary;
	});

	// Action options for filtering
	const actionOptions = [
		{ label: 'All Actions', value: null },
		{ label: 'Created', value: 'create' },
		{ label: 'Updated', value: 'update' },
		{ label: 'Deleted', value: 'delete' },
		{ label: 'Logged In', value: 'login' },
		{ label: 'Logged Out', value: 'logout' },
		{ label: 'Approved', value: 'approve' },
		{ label: 'Reconciled', value: 'reconcile' },
	];

	// Collection options for filtering
	const collectionOptions = [
		{ label: 'All Collections', value: null },
		{ label: 'Transactions', value: 'transactions' },
		{ label: 'Budget Categories', value: 'budget_categories' },
		{ label: 'Budget Items', value: 'budget_items' },
		{ label: 'Monthly Statements', value: 'monthly_statements' },
		{ label: 'Reconciliation Notes', value: 'reconciliation_notes' },
		{ label: 'Compliance Alerts', value: 'compliance_alerts' },
		{ label: 'Reserve Studies', value: 'reserve_studies' },
		{ label: 'Assessment Ledger', value: 'assessment_ledger' },
		{ label: 'Users', value: 'directus_users' },
	];

	return {
		// State
		loading,
		error,
		logs: readonly(logs),

		// Fetch
		fetchLogs,
		getItemHistory,
		getRecentActivity,
		getUserActivity,

		// Logging functions
		logAction,
		logCreate,
		logUpdate,
		logDelete,
		logReconcile,
		logApprove,
		logLogin,
		logLogout,

		// Formatting
		formatLogEntry,
		formatChanges,

		// Computed
		formattedLogs,
		activitySummary,

		// Options
		actionOptions,
		collectionOptions,
	};
};
