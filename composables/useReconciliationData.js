import { ref, computed } from 'vue';

// In a real application, this would fetch from your API
// This composable manages all reconciliation data across months

export const useReconciliationData = () => {
	// Operating Account (5129) Data
	const operatingAccountData = ref({
		'June 2025': {
			beginningBalance: 52295.97,
			endingBalance: 33887.93,
			deposits: [
				{ date: '06/01', description: 'Zelle Payment - Alexa Stylianou', amount: 600, source: 'Alexa Stylianou' },
				{ date: '06/02', description: 'Remote Online Deposit', amount: 1500, source: 'Multiple Units' },
				{ date: '06/09', description: 'Sunshine Apts LLC', amount: 7000, source: 'Sunshine Apts LLC' },
				{ date: '06/14', description: 'Sunshine Apts LLC', amount: 7252.14, source: 'Sunshine Apts LLC' },
				{ date: '06/15', description: 'Online Transfer from ...5872', amount: 600, source: 'Account 5872' },
			],
			withdrawals: [
				{ date: '06/05', vendor: 'First Insurance Funding', amount: 9659.42, category: 'Insurance' },
				{ date: '06/10', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '06/15', vendor: 'ACE Engineering', amount: 2500, category: 'Maintenance' },
				{ date: '06/20', vendor: 'Harry Tempkins', amount: 1200, category: 'Maintenance' },
				{ date: '06/20', vendor: 'FPL Electric', amount: 197.38, category: 'Utilities' },
				{ date: '06/25', vendor: 'Transfer to ...5872', amount: 4852.71, category: 'VIOLATION' },
			],
			violations: [
				{ date: '06/15', type: 'incoming', amount: 600, description: 'Transfer from Special Assessment' },
				{ date: '06/25', type: 'outgoing', amount: 4852.71, description: 'Transfer to Special Assessment' },
			],
		},
		'May 2025': {
			beginningBalance: 54853.0,
			endingBalance: 52295.97,
			deposits: [
				{ date: '05/01', description: 'Monthly Maintenance Fees', amount: 15000, source: 'Various Residents' },
				{ date: '05/05', description: 'Late Fees', amount: 450, source: 'Penalty Charges' },
				{ date: '05/10', description: 'Laundry Income', amount: 320, source: 'Coin Laundry' },
				{ date: '05/15', description: 'Transfer from ...5872', amount: 3650, source: 'Account 5872' },
			],
			withdrawals: [
				{ date: '05/05', vendor: 'First Insurance Funding', amount: 9659.42, category: 'Insurance' },
				{ date: '05/10', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '05/15', vendor: 'Waste Management', amount: 453, category: 'Contract Services' },
				{ date: '05/20', vendor: 'Del Toro Gutters', amount: 3500, category: 'Maintenance' },
				{ date: '05/25', vendor: 'Transfer to ...5872', amount: 2852.71, category: 'VIOLATION' },
			],
			violations: [
				{ date: '05/15', type: 'incoming', amount: 3650, description: 'Transfer from Special Assessment' },
				{ date: '05/25', type: 'outgoing', amount: 2852.71, description: 'Transfer to Special Assessment' },
			],
		},
		'April 2025': {
			beginningBalance: 44695.0,
			endingBalance: 54853.0,
			deposits: [
				{ date: '04/01', description: 'Monthly Maintenance Fees', amount: 22000, source: 'Various Residents' },
				{ date: '04/15', description: 'Late Fees', amount: 750, source: 'Penalty Charges' },
				{ date: '04/20', description: 'Laundry Income', amount: 400, source: 'Coin Laundry' },
			],
			withdrawals: [
				{ date: '04/05', vendor: 'First Insurance Funding', amount: 9659.42, category: 'Insurance' },
				{ date: '04/10', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '04/15', vendor: 'ACE Engineering', amount: 1500, category: 'Professional' },
				{ date: '04/20', vendor: 'FPL Electric', amount: 182.58, category: 'Utilities' },
			],
			violations: [],
		},
	});

	// Special Assessment Account (5872) Data
	const specialAssessmentData = ref({
		'June 2025': {
			beginningBalance: 50000,
			endingBalance: 45000,
			collections: [
				{ date: '06/05', source: 'Unit 301', amount: 2500, verified: true },
				{ date: '06/10', source: 'Unit 405', amount: 2500, verified: true },
				{ date: '06/15', source: 'Unit 202', amount: 2500, verified: false },
				{ date: '06/20', source: 'Unit 108', amount: 1000, verified: true },
			],
			expenses: [
				{
					date: '06/05',
					vendor: 'ACE Engineering',
					description: 'Structural inspection Phase 2',
					amount: 5000,
					compliant: true,
				},
				{
					date: '06/10',
					vendor: 'City of Miami Beach',
					description: 'Building permits',
					amount: 2500,
					compliant: true,
				},
				{ date: '06/15', vendor: 'VTE Consulting', description: 'Management fee', amount: 700, compliant: false },
				{
					date: '06/20',
					vendor: 'Concrete Solutions',
					description: 'Balcony repairs Unit 301',
					amount: 4500,
					compliant: true,
				},
			],
			improperTransfers: [
				{ date: '06/15', direction: 'From Operating', amount: 600, action: 'Reverse' },
				{ date: '06/25', direction: 'From Operating', amount: 4852.71, action: 'Reverse' },
			],
		},
		'May 2025': {
			beginningBalance: 55000,
			endingBalance: 50000,
			collections: [
				{ date: '05/01', source: 'Unit 101', amount: 2500, verified: true },
				{ date: '05/15', source: 'Unit 203', amount: 2500, verified: true },
			],
			expenses: [
				{
					date: '05/10',
					vendor: 'Engineering Consultants',
					description: 'Initial assessment',
					amount: 3000,
					compliant: true,
				},
				{ date: '05/20', vendor: 'Permit Expediter', description: 'Permit filing', amount: 1500, compliant: true },
			],
			improperTransfers: [
				{ date: '05/15', direction: 'To Operating', amount: 3650, action: 'Document' },
				{ date: '05/25', direction: 'From Operating', amount: 2852.71, action: 'Reverse' },
			],
		},
		'April 2025': {
			beginningBalance: 55000,
			endingBalance: 55000,
			collections: [],
			expenses: [],
			improperTransfers: [],
		},
	});

	// Reserve Account (7011) Data
	const reserveAccountData = ref({
		'June 2025': {
			beginningBalance: 95037.01,
			endingBalance: 95037.01,
			interest: 0,
			contributions: 0,
			withdrawals: 0,
			transactions: [],
		},
		'May 2025': {
			beginningBalance: 95037.01,
			endingBalance: 95037.01,
			interest: 0,
			contributions: 0,
			withdrawals: 0,
			transactions: [],
		},
		'April 2025': {
			beginningBalance: 95037.01,
			endingBalance: 95037.01,
			interest: 0,
			contributions: 0,
			withdrawals: 0,
			transactions: [],
		},
	});

	// Helper functions
	const getOperatingData = (month) => {
		return operatingAccountData.value[month] || operatingAccountData.value['June 2025'];
	};

	const getSpecialAssessmentData = (month) => {
		return specialAssessmentData.value[month] || specialAssessmentData.value['June 2025'];
	};

	const getReserveData = (month) => {
		return reserveAccountData.value[month] || reserveAccountData.value['June 2025'];
	};

	// Calculate totals
	const calculateTotals = (data) => {
		const deposits = data.deposits || data.collections || [];
		const withdrawals = data.withdrawals || data.expenses || [];

		const totalDeposits = deposits.reduce((sum, item) => sum + item.amount, 0);
		const totalWithdrawals = withdrawals.reduce((sum, item) => sum + item.amount, 0);

		return {
			totalDeposits,
			totalWithdrawals,
			netChange: totalDeposits - totalWithdrawals,
		};
	};

	// Check for violations
	const getViolationCount = (month) => {
		const operating = getOperatingData(month);
		const special = getSpecialAssessmentData(month);

		const operatingViolations = operating.violations?.length || 0;
		const specialViolations = special.improperTransfers?.length || 0;

		return operatingViolations + specialViolations;
	};

	return {
		operatingAccountData,
		specialAssessmentData,
		reserveAccountData,
		getOperatingData,
		getSpecialAssessmentData,
		getReserveData,
		calculateTotals,
		getViolationCount,
	};
};
