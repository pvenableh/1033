// composables/useComplianceAlerts.js
// Fund segregation alerts and compliance monitoring for HOA

export const useComplianceAlerts = () => {
	const complianceAlertsCollection = useDirectusItems('compliance_alerts');
	const transactionsCollection = useDirectusItems('transactions');
	const accountsCollection = useDirectusItems('accounts');

	const { user } = useDirectusAuth();

	// State
	const loading = ref(false);
	const saving = ref(false);
	const error = ref(null);
	const alerts = ref([]);
	const accounts = ref([]);

	// Account IDs (based on your system)
	const ACCOUNT_IDS = {
		OPERATING: 1, // Account 5129
		RESERVE: 2, // Account 7011
		SPECIAL_ASSESSMENT: 3, // Account 5872
	};

	// Fetch accounts
	const fetchAccounts = async () => {
		try {
			const data = await accountsCollection.list({ fields: ['*'] });
			accounts.value = data || [];
		} catch (e) {
			console.error('Error fetching accounts:', e);
		}
	};

	// Fetch alerts
	const fetchAlerts = async (filters = {}) => {
		loading.value = true;
		error.value = null;

		try {
			const filter = { status: { _eq: 'published' } };

			if (filters.unresolved) {
				filter.is_resolved = { _eq: false };
			}

			if (filters.alertType) {
				filter.alert_type = { _eq: filters.alertType };
			}

			if (filters.severity) {
				filter.severity = { _eq: filters.severity };
			}

			const data = await complianceAlertsCollection.list({
				filter,
				sort: ['-date_created'],
				fields: ['*', 'transaction_id.*', 'account_id.*', 'acknowledged_by.*', 'resolved_by.*'],
			});

			alerts.value = data || [];
		} catch (e) {
			error.value = e.message || 'Error fetching alerts';
			console.error('Error fetching alerts:', e);
		} finally {
			loading.value = false;
		}
	};

	// Create an alert
	const createAlert = async (alertData) => {
		saving.value = true;
		error.value = null;

		try {
			const result = await complianceAlertsCollection.create({
				alert_type: alertData.alert_type,
				severity: alertData.severity,
				title: alertData.title,
				description: alertData.description,
				transaction_id: alertData.transaction_id,
				account_id: alertData.account_id,
				amount: alertData.amount,
				is_acknowledged: false,
				is_resolved: false,
				requires_board_action: alertData.requires_board_action || false,
				status: 'published',
			});

			alerts.value.unshift(result);
			return result;
		} catch (e) {
			error.value = e.message || 'Error creating alert';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Acknowledge an alert
	const acknowledgeAlert = async (alertId) => {
		saving.value = true;

		try {
			const result = await complianceAlertsCollection.update(alertId, {
				is_acknowledged: true,
				acknowledged_by: user.value?.id,
				acknowledged_date: new Date().toISOString(),
			});

			const index = alerts.value.findIndex((a) => a.id === alertId);
			if (index !== -1) {
				alerts.value[index] = result;
			}

			return result;
		} catch (e) {
			error.value = e.message || 'Error acknowledging alert';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Resolve an alert
	const resolveAlert = async (alertId, resolutionNotes, boardResolution = null) => {
		saving.value = true;

		try {
			const result = await complianceAlertsCollection.update(alertId, {
				is_resolved: true,
				resolved_by: user.value?.id,
				resolved_date: new Date().toISOString(),
				resolution_notes: resolutionNotes,
				board_resolution: boardResolution,
			});

			const index = alerts.value.findIndex((a) => a.id === alertId);
			if (index !== -1) {
				alerts.value[index] = result;
			}

			return result;
		} catch (e) {
			error.value = e.message || 'Error resolving alert';
			throw e;
		} finally {
			saving.value = false;
		}
	};

	// Analyze a transaction for compliance issues
	const analyzeTransaction = (transaction) => {
		const issues = [];
		const accountId = typeof transaction.account_id === 'object'
			? transaction.account_id?.id
			: transaction.account_id;
		const amount = Math.abs(parseFloat(transaction.amount) || 0);
		const description = (transaction.description || '').toLowerCase();

		// Check for fund mixing indicators
		if (transaction.violation_type === 'fund_mixing' || transaction.is_violation) {
			issues.push({
				alert_type: 'fund_mixing',
				severity: 'critical',
				title: 'Fund Mixing Detected',
				description: `Transaction flagged for potential fund mixing: ${transaction.description}`,
				requires_board_action: true,
			});
		}

		// Check for transfers FROM restricted accounts TO operating
		if (
			(accountId === ACCOUNT_IDS.OPERATING && transaction.transaction_type === 'deposit') ||
			(accountId === ACCOUNT_IDS.OPERATING && transaction.transaction_type === 'transfer_in')
		) {
			// Check if this appears to be from reserve or special assessment
			if (
				description.includes('reserve') ||
				description.includes('7011') ||
				description.includes('special') ||
				description.includes('5872')
			) {
				issues.push({
					alert_type: 'fund_mixing',
					severity: 'critical',
					title: 'Potential Restricted Fund Transfer to Operating',
					description: `Deposit to operating account may be from restricted funds: ${transaction.description}`,
					requires_board_action: true,
				});
			}
		}

		// Check for reserve withdrawals
		if (
			accountId === ACCOUNT_IDS.RESERVE &&
			(transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'transfer_out')
		) {
			issues.push({
				alert_type: 'reserve_withdrawal',
				severity: 'warning',
				title: 'Reserve Fund Withdrawal',
				description: `Withdrawal from reserve account requires documentation: ${transaction.description} - $${amount.toFixed(2)}`,
				requires_board_action: amount > 5000,
			});
		}

		// Check for special assessment withdrawals (40-year recertification)
		if (
			accountId === ACCOUNT_IDS.SPECIAL_ASSESSMENT &&
			(transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'transfer_out')
		) {
			// Check if it's for approved purpose
			const approvedKeywords = ['recertification', '40-year', 'milestone', 'structural', 'engineering'];
			const isApproved = approvedKeywords.some((k) => description.includes(k));

			if (!isApproved) {
				issues.push({
					alert_type: 'fund_mixing',
					severity: 'critical',
					title: 'Special Assessment Withdrawal - Verify Purpose',
					description: `Withdrawal from 40-Year Special Assessment account: ${transaction.description}. Verify this is for approved recertification expenses.`,
					requires_board_action: true,
				});
			}
		}

		// Check for large transactions requiring approval
		if (amount > 10000 && transaction.transaction_type === 'withdrawal') {
			issues.push({
				alert_type: 'approval_required',
				severity: 'warning',
				title: 'Large Transaction - Verify Approval',
				description: `Transaction over $10,000 requires board approval: ${transaction.description} - $${amount.toFixed(2)}`,
				requires_board_action: true,
			});
		}

		return issues;
	};

	// Scan transactions for compliance issues
	const scanTransactionsForIssues = async (fiscalYear) => {
		loading.value = true;

		try {
			const transactions = await transactionsCollection.list({
				filter: { fiscal_year: { _eq: fiscalYear } },
				fields: ['*'],
				limit: -1,
			});

			const newAlerts = [];

			for (const transaction of transactions || []) {
				const issues = analyzeTransaction(transaction);

				for (const issue of issues) {
					// Check if alert already exists for this transaction
					const existingAlert = alerts.value.find(
						(a) =>
							a.transaction_id === transaction.id &&
							a.alert_type === issue.alert_type &&
							!a.is_resolved
					);

					if (!existingAlert) {
						const alert = await createAlert({
							...issue,
							transaction_id: transaction.id,
							account_id: typeof transaction.account_id === 'object'
								? transaction.account_id?.id
								: transaction.account_id,
							amount: transaction.amount,
						});
						newAlerts.push(alert);
					}
				}
			}

			return newAlerts;
		} catch (e) {
			error.value = e.message || 'Error scanning transactions';
			throw e;
		} finally {
			loading.value = false;
		}
	};

	// Check a pending transfer for compliance before execution
	const checkTransferCompliance = (fromAccountId, toAccountId, amount, description) => {
		const issues = [];

		// Special Assessment -> Operating (CRITICAL)
		if (fromAccountId === ACCOUNT_IDS.SPECIAL_ASSESSMENT && toAccountId === ACCOUNT_IDS.OPERATING) {
			issues.push({
				severity: 'critical',
				message: 'BLOCKED: Cannot transfer from Special Assessment to Operating account. Florida Chapter 720.303(6) prohibits commingling restricted funds.',
				blocked: true,
			});
		}

		// Reserve -> Operating (requires documentation)
		if (fromAccountId === ACCOUNT_IDS.RESERVE && toAccountId === ACCOUNT_IDS.OPERATING) {
			issues.push({
				severity: 'warning',
				message: 'Reserve to Operating transfer requires board resolution and documentation per Florida HOA statutes.',
				blocked: false,
				requiresApproval: true,
			});
		}

		// Operating -> Special Assessment (OK but verify)
		if (fromAccountId === ACCOUNT_IDS.OPERATING && toAccountId === ACCOUNT_IDS.SPECIAL_ASSESSMENT) {
			issues.push({
				severity: 'info',
				message: 'Transfer to Special Assessment account. Ensure this is for 40-Year Recertification project expenses.',
				blocked: false,
			});
		}

		// Large transfers
		if (amount > 10000) {
			issues.push({
				severity: 'warning',
				message: `Transfer of $${amount.toFixed(2)} exceeds $10,000 threshold. Board approval may be required.`,
				blocked: false,
				requiresApproval: true,
			});
		}

		return {
			isBlocked: issues.some((i) => i.blocked),
			requiresApproval: issues.some((i) => i.requiresApproval),
			issues,
		};
	};

	// Computed: Unresolved alerts
	const unresolvedAlerts = computed(() => {
		return alerts.value.filter((a) => !a.is_resolved);
	});

	// Computed: Critical alerts
	const criticalAlerts = computed(() => {
		return alerts.value.filter((a) => a.severity === 'critical' && !a.is_resolved);
	});

	// Computed: Alerts requiring board action
	const boardActionRequired = computed(() => {
		return alerts.value.filter((a) => a.requires_board_action && !a.is_resolved);
	});

	// Computed: Alert counts by type
	const alertCounts = computed(() => {
		const counts = {
			total: unresolvedAlerts.value.length,
			critical: 0,
			warning: 0,
			info: 0,
			byType: {},
		};

		for (const alert of unresolvedAlerts.value) {
			counts[alert.severity]++;
			counts.byType[alert.alert_type] = (counts.byType[alert.alert_type] || 0) + 1;
		}

		return counts;
	});

	// Alert type options
	const alertTypeOptions = [
		{ label: 'Fund Mixing', value: 'fund_mixing', color: 'red' },
		{ label: 'Reserve Withdrawal', value: 'reserve_withdrawal', color: 'orange' },
		{ label: 'Budget Overage', value: 'budget_overage', color: 'yellow' },
		{ label: 'Delinquency', value: 'delinquency', color: 'purple' },
		{ label: 'Compliance Issue', value: 'compliance', color: 'blue' },
		{ label: 'Approval Required', value: 'approval_required', color: 'gray' },
	];

	// Severity options
	const severityOptions = [
		{ label: 'Info', value: 'info', color: 'blue' },
		{ label: 'Warning', value: 'warning', color: 'yellow' },
		{ label: 'Critical', value: 'critical', color: 'red' },
	];

	// Get severity color
	const getSeverityColor = (severity) => {
		const option = severityOptions.find((o) => o.value === severity);
		return option?.color || 'gray';
	};

	// Get alert type label
	const getAlertTypeLabel = (type) => {
		const option = alertTypeOptions.find((o) => o.value === type);
		return option?.label || type;
	};

	return {
		// State
		loading,
		saving,
		error,
		alerts: readonly(alerts),
		accounts: readonly(accounts),

		// Constants
		ACCOUNT_IDS,

		// Fetch
		fetchAccounts,
		fetchAlerts,

		// CRUD
		createAlert,
		acknowledgeAlert,
		resolveAlert,

		// Analysis
		analyzeTransaction,
		scanTransactionsForIssues,
		checkTransferCompliance,

		// Computed
		unresolvedAlerts,
		criticalAlerts,
		boardActionRequired,
		alertCounts,

		// Options
		alertTypeOptions,
		severityOptions,

		// Helpers
		getSeverityColor,
		getAlertTypeLabel,
	};
};
