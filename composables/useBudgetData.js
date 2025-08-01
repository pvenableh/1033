// composables/useBudgetData.js
// 2025 Operating Budget - Lenox Plaza Association HOA
// Miami Beach, Florida - Correct Account Structure:
// 5129: Operating Account (day-to-day expenses)
// 7011: Reserve Account (general reserves)
// 5872: 40-Year Special Assessment Account (recertification project only)

export const useBudgetData = () => {
	// Budget data extracted from 2025 Operating Budget.csv
	const budget2025 = {
		// Main expense categories matching reconciliation data structure
		categories: {
			Insurance: {
				monthly: 7131.59, // Building Insurance: $6,354.17 + Flood Insurance: $777.42
				yearly: 85579.08,
				items: [
					{ name: 'Building Insurance', monthly: 6354.17, yearly: 76250.0, vendor: 'First Insurance' },
					{ name: 'Flood Insurance', monthly: 777.42, yearly: 9329.0, vendor: 'TBD' },
				],
			},
			Professional: {
				monthly: 1703.67, // Management: $700 + CPA: $420 + Legal: $500 + Taxes: $67 + BOIR: $16.67
				yearly: 20444.0,
				items: [
					{ name: 'Management Fees - VTE', monthly: 700.0, yearly: 8400.0, vendor: 'VTE Consulting LLC' },
					{ name: 'CPA Audit & Review Fees', monthly: 420.0, yearly: 5040.0, vendor: 'TBD' },
					{ name: 'Legal Fees', monthly: 500.0, yearly: 6000.0, vendor: 'TBD' },
					{ name: 'CPA Taxes Filing', monthly: 67.0, yearly: 804.0, vendor: 'TBD' },
					{ name: 'Miami Beach BOIR Report', monthly: 16.67, yearly: 200.0, vendor: 'Miami Beach' },
				],
			},
			Utilities: {
				monthly: 2586.0, // Water: $2000 + Electric: $220 + Gas: $320 + Internet: $46
				yearly: 31032.0,
				items: [
					{ name: 'Water & Sewer', monthly: 2000.0, yearly: 24000.0, vendor: 'Miami Beach Water' },
					{ name: 'Electricity - FPL', monthly: 220.0, yearly: 2640.0, vendor: 'FPL' },
					{ name: 'Gas - Teco', monthly: 320.0, yearly: 3840.0, vendor: 'Teco/People Gas' },
					{ name: 'Internet - Breezeline', monthly: 46.0, yearly: 552.0, vendor: 'Breezeline FL' },
				],
			},
			Maintenance: {
				monthly: 2770.0, // Waste: $453 + Janitorial: $900 + Elevator: $150 + Laundry: $220 + Landscaping: $240 + Pest: $150 + etc
				yearly: 33240.0,
				items: [
					{ name: 'Janitorial Services and Supplies', monthly: 900.0, yearly: 10800.0, vendor: 'TBD' },
					{ name: 'Waste/Trash Removal', monthly: 453.0, yearly: 5436.0, vendor: 'Waste Management' },
					{ name: 'Lawn & Landscaping', monthly: 240.0, yearly: 2880.0, vendor: 'Gutierrez Landscaping' },
					{ name: 'Laundry Lease', monthly: 220.0, yearly: 2640.0, vendor: 'Wash Multifamily Systems' },
					{ name: 'Elevator Maintenance', monthly: 150.0, yearly: 1800.0, vendor: 'Maverick Elevators' },
					{ name: 'Pest Control', monthly: 150.0, yearly: 1800.0, vendor: 'TBD' },
					{ name: 'Security Cameras & Equipment', monthly: 625.0, yearly: 7500.0, vendor: 'TBD' },
					{ name: 'Fire Equipment', monthly: 62.5, yearly: 750.0, vendor: 'A Plus Fire' },
					{ name: 'Plumbing Repairs', monthly: 50.0, yearly: 600.0, vendor: 'Various' },
					{ name: 'Electrical Repairs', monthly: 40.0, yearly: 480.0, vendor: 'Various' },
					{ name: 'Gate & Access Control', monthly: 50.0, yearly: 600.0, vendor: 'Various' },
				],
			},
			Other: {
				monthly: 588.83, // Bank fees: $20 + Elevator phone: $90 + Permits: $various + Office supplies: $20 + Misc: $100
				yearly: 7066.0,
				items: [
					{ name: 'Elevator Phone Line', monthly: 90.0, yearly: 1080.0, vendor: '1-Touch Elevator' },
					{ name: 'Annual Elevator Inspection', monthly: 37.5, yearly: 450.0, vendor: 'Maverick' },
					{ name: 'Miami Beach Validation Permit', monthly: 17.0, yearly: 204.0, vendor: 'Miami Beach' },
					{ name: 'Miami Beach Elevator Certificate', monthly: 40.0, yearly: 418.0, vendor: 'Miami Beach' },
					{ name: 'Sunbiz Renewal Corp', monthly: 25.0, yearly: 300.0, vendor: 'Florida Sunbiz' },
					{ name: 'DBPR Corp Business LLC Renewal', monthly: 10.0, yearly: 120.0, vendor: 'DBPR' },
					{ name: 'Bank Fees', monthly: 20.0, yearly: 240.0, vendor: 'Chase Bank' },
					{ name: 'Office Supplies & Printing', monthly: 20.0, yearly: 240.0, vendor: 'Various' },
					{ name: 'Miami Beach Fire Alarms Certificate', monthly: 8.58, yearly: 103.0, vendor: 'Miami Beach' },
					{ name: 'Licenses & Work Permits', monthly: 50.0, yearly: 600.0, vendor: 'Various' },
					{ name: 'Miscellaneous Expenses', monthly: 100.0, yearly: 1200.0, vendor: 'Various' },
				],
			},
		},

		// Totals
		totals: {
			monthly: 14779.09, // Sum of all categories
			yearly: 177349.08, // Sum of all yearly amounts
		},

		// Revenue projections - CORRECTED
		revenue: {
			assessmentIncome: {
				monthly: 14364.0, // $513 × 28 units
				yearly: 172368.0,
				description: 'Regular HOA assessments: $513/unit × 28 units',
			},
			laundryIncome: {
				monthly: 100.0, // Estimated from total other income
				yearly: 1200.0,
				description: 'Laundry machine revenue',
			},
			otherIncome: {
				monthly: 320.0, // Keys, applications, estoppel fees, etc.
				yearly: 3840.0,
				description: 'Keys, applications, estoppel fees, misc income',
			},
			total: {
				monthly: 14784.0, // $177,408 ÷ 12
				yearly: 177408.0,
			},
		},

		// Net operating projection - CORRECTED
		netOperating: {
			monthly: 4.91, // $14,784 - $14,779 (Revenue - Expenses)
			yearly: 58.92, // Essentially break-even budget
		},
	};

	// Helper functions for budget analysis
	const getBudgetByCategory = (category) => {
		return budget2025.categories[category] || null;
	};

	const getTotalBudget = () => {
		return budget2025.totals;
	};

	const calculateVariance = (category, actualAmount) => {
		const budgetedAmount = budget2025.categories[category]?.monthly || 0;
		const variance = actualAmount - budgetedAmount;
		const percentVariance = budgetedAmount > 0 ? ((variance / budgetedAmount) * 100).toFixed(1) : '0.0';

		return {
			budgeted: budgetedAmount,
			actual: actualAmount,
			variance: variance,
			percentVariance: parseFloat(percentVariance),
			status: variance > 0 ? 'OVER BUDGET' : variance < 0 ? 'UNDER BUDGET' : 'ON TARGET',
			statusColor: variance > 0 ? 'red' : variance < 0 ? 'green' : 'gray',
		};
	};

	const getBudgetUtilization = (category, actualSpent, monthsElapsed = 1) => {
		const monthlyBudget = budget2025.categories[category]?.monthly || 0;
		const expectedSpent = monthlyBudget * monthsElapsed;
		const utilization = expectedSpent > 0 ? (actualSpent / expectedSpent) * 100 : 0;

		return {
			expectedSpent,
			actualSpent,
			utilization: parseFloat(utilization.toFixed(1)),
			remainingBudget: Math.max(0, expectedSpent - actualSpent),
		};
	};

	// Miami Beach specific considerations
	const miamiBenchSpecificItems = {
		floodInsurance: {
			required: true,
			reason: 'Coastal location requires flood insurance',
			budgeted: 777.42,
		},
		elevatorRequirements: {
			monthlyMaintenance: 150.0,
			phoneLineQuarterly: 90.0,
			annualInspection: 450.0,
			certificates: 40.0,
		},
		permits: {
			validationPermit: 17.0,
			fireAlarmsCertificate: 8.58,
			elevatorCertificate: 40.0,
		},
	};

	return {
		budget2025,
		getBudgetByCategory,
		getTotalBudget,
		calculateVariance,
		getBudgetUtilization,
		miamiBenchSpecificItems,

		// Category mapping for reconciliation data
		categoryMapping: {
			Insurance: 'Insurance',
			Management: 'Professional',
			Professional: 'Professional',
			Utilities: 'Utilities',
			Maintenance: 'Maintenance',
			Regulatory: 'Other',
			Banking: 'Other',
			Other: 'Other',
		},
	};
};
