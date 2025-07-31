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
				{ date: '06/05', source: 'Unit 205', amount: 2500, description: 'Monthly assessment payment' },
				{ date: '06/10', source: 'Unit 311', amount: 1800, description: 'Monthly assessment payment' },
				{ date: '06/15', source: 'Unit 406', amount: 2200, description: 'Monthly assessment payment' },
			],
			expenses: [
				{ date: '06/08', vendor: 'ACE Engineering', amount: 3500, category: 'Professional Services' },
				{ date: '06/20', vendor: 'Concrete Specialists', amount: 8000, category: '40-Year Repairs' },
			],
			improperTransfers: [
				{
					date: '06/15',
					amount: 600,
					fromAccount: '5872',
					toAccount: '5129',
					description: 'Unauthorized transfer to operating',
				},
				{
					date: '06/25',
					amount: 4852.71,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized transfer from operating',
				},
			],
		},
	});

	// Reserve Account (7011) Data - CORRECTED FROM BANK STATEMENTS
	const reserveAccountData = ref({
		'June 2025': {
			beginningBalance: 13375.52,
			endingBalance: 13375.63,
			interest: 0.11,
			contributions: 0,
			withdrawals: 0,
			transactions: [{ date: '06/30', description: 'Interest Payment', amount: 0.11, balance: 13375.63 }],
			// Critical status flags
			criticallyLow: true,
			complianceRisk: 'HIGH',
			recommendedMinimum: 75000,
			shortfall: 61624.37,
		},
		'May 2025': {
			beginningBalance: 13375.52,
			endingBalance: 13375.52,
			interest: 0,
			contributions: 0,
			withdrawals: 0,
			transactions: [],
			criticallyLow: true,
			complianceRisk: 'HIGH',
			recommendedMinimum: 75000,
			shortfall: 61624.48,
		},
		'April 2025': {
			beginningBalance: 13375.52,
			endingBalance: 13375.63,
			interest: 0.11,
			contributions: 0,
			withdrawals: 0,
			transactions: [{ date: '04/30', description: 'Interest Payment', amount: 0.11, balance: 13375.63 }],
			criticallyLow: true,
			complianceRisk: 'HIGH',
			recommendedMinimum: 75000,
			shortfall: 61624.37,
		},
		'March 2025': {
			beginningBalance: 93276.98,
			endingBalance: 13375.52,
			interest: 0.4,
			contributions: 0,
			withdrawals: 80302.86, // Large withdrawal occurred - INVESTIGATION REQUIRED
			transactions: [
				{ date: '03/31', description: 'Interest Payment', amount: 0.4, balance: 93276.98 },
				{
					date: '03/25',
					description: 'LARGE WITHDRAWAL - INVESTIGATION REQUIRED',
					amount: -80302.86,
					balance: 13375.52,
				},
			],
			criticallyLow: true,
			complianceRisk: 'CRITICAL',
			recommendedMinimum: 75000,
			shortfall: 61624.48,
			investigationRequired: true,
			suspiciousActivity: true,
		},
		'February 2025': {
			beginningBalance: 93276.98,
			endingBalance: 93276.98,
			interest: 0,
			contributions: 0,
			withdrawals: 0,
			transactions: [],
			criticallyLow: false,
			complianceRisk: 'LOW',
			recommendedMinimum: 75000,
			shortfall: 0,
		},
		'January 2025': {
			beginningBalance: 12537.02,
			endingBalance: 12537.12,
			interest: 0.1,
			contributions: 0,
			withdrawals: 0,
			transactions: [{ date: '01/31', description: 'Interest Payment', amount: 0.1, balance: 12537.12 }],
			criticallyLow: true,
			complianceRisk: 'HIGH',
			recommendedMinimum: 75000,
			shortfall: 62462.88,
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

	// Get reserve compliance status
	const getReserveComplianceStatus = (month) => {
		const reserveData = getReserveData(month);
		return {
			isCriticallyLow: reserveData.criticallyLow,
			complianceRisk: reserveData.complianceRisk,
			shortfall: reserveData.shortfall,
			investigationRequired: reserveData.investigationRequired || false,
			suspiciousActivity: reserveData.suspiciousActivity || false,
		};
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
		getReserveComplianceStatus,
	};
};
