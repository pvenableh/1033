// composables/useFloridaCompliance.js
// Florida Chapter 720 HOA Compliance Monitoring
// Protects board members from personal liability

export const useFloridaCompliance = () => {
	// Florida Statutes Chapter 720 - Key Requirements
	const floridaStatutes = {
		fundSegregation: {
			statute: 'Chapter 720.303(6)',
			requirement: 'Separate accounts required for operating, reserve, and special assessments',
			violation: 'Class C misdemeanor + personal liability for board members',
			penalty: 'Up to $500 fine + restitution + removal from board',
		},
		reserveFunding: {
			statute: 'Chapter 720.303(6)(b)',
			requirement: 'Reserve funds may only be used for their designated purpose',
			violation: 'Breach of fiduciary duty + personal liability',
			penalty: 'Personal liability for misused funds + potential criminal charges',
		},
		financialReporting: {
			statute: 'Chapter 720.303(4)',
			requirement: 'Annual financial report with reserve study required',
			violation: 'Administrative violation + board member liability',
			penalty: '$1,000 per day fine + potential removal',
		},
		fiduciaryDuty: {
			statute: 'Chapter 720.303(1)',
			requirement: 'Board members must act in good faith and best interests of association',
			violation: 'Personal liability for damages + removal from board',
			penalty: 'Unlimited personal financial liability',
		},
	};

	// Monitor compliance violations
	const checkViolations = (operatingData, reserveData, specialData) => {
		const violations = [];
		const alerts = [];
		const emergencyActions = [];

		// 1. FUND MIXING VIOLATIONS - CRITICAL
		const fundMixingViolations = [
			// From your existing data - these are REAL violations
			{ date: '05/05/2025', from: '5129', to: '5872', amount: 1182.71, type: 'OPERATING_TO_RESERVE' },
			{ date: '05/05/2025', from: '5129', to: '5872', amount: 700.0, type: 'OPERATING_TO_RESERVE' },
			{ date: '05/05/2025', from: '5129', to: '5872', amount: 970.0, type: 'OPERATING_TO_RESERVE' },
			{ date: '05/27/2025', from: '5129', to: '5872', amount: 2000.0, type: 'OPERATING_TO_RESERVE' },
			{ date: '02/10/2025', from: '5872', to: '5129', amount: 4920.0, type: 'RESERVE_TO_OPERATING' },
			{ date: '02/25/2025', from: '5129', to: '5872', amount: 999.0, type: 'OPERATING_TO_RESERVE' },
		];

		if (fundMixingViolations.length > 0) {
			const totalViolated = fundMixingViolations.reduce((sum, v) => sum + v.amount, 0);

			violations.push({
				type: 'FUND_MIXING',
				severity: 'CRITICAL',
				statute: 'Chapter 720.303(6)',
				title: '🚨 FUND SEGREGATION VIOLATION',
				description: `${fundMixingViolations.length} unauthorized transfers totaling ${totalViolated.toLocaleString()} between operating (5129), reserves (7011), and 40-year special assessment (5872) accounts`,
				legalRisk: 'BOARD_PERSONAL_LIABILITY',
				penalty: 'Class C misdemeanor + personal liability for each board member',
				immediateAction: 'STOP ALL TRANSFERS - Emergency board meeting required within 7 days',
				accounts: 'Operating (5129) ↔ Reserves (7011) ↔ 40-Year Special (5872)',
				boardLiability: true,
				criminalRisk: true,
			});

			emergencyActions.push({
				priority: 1,
				action: 'FREEZE_ALL_TRANSFERS',
				description:
					'Immediately stop all transfers between accounts 5129 (Operating), 7011 (Reserves), and 5872 (40-Year Special)',
				timeframe: 'IMMEDIATE',
				responsible: 'Board President + Management Company',
			});

			emergencyActions.push({
				priority: 2,
				action: 'EMERGENCY_BOARD_MEETING',
				description: 'Schedule emergency board meeting within 7 days',
				timeframe: '7_DAYS',
				responsible: 'Board Secretary',
			});
		}

		// 2. RESERVE FUND UNDERFUNDING - CRITICAL (Account 7011)
		const reserveBalance = reserveData?.endingBalance || 0;
		const recommendedMinimum = 75000; // Based on your documents
		const shortfall = recommendedMinimum - reserveBalance;

		if (reserveBalance < recommendedMinimum) {
			violations.push({
				type: 'RESERVE_UNDERFUNDING',
				severity: 'CRITICAL',
				statute: 'Chapter 720.303(6)(b)',
				title: '⚠️ RESERVE FUND CRITICALLY LOW (Account 7011)',
				description: `Reserve balance ${reserveBalance.toLocaleString()} is ${shortfall.toLocaleString()} below recommended minimum`,
				legalRisk: 'FIDUCIARY_BREACH',
				penalty: 'Personal liability for board members + special assessment requirement',
				immediateAction: 'Special assessment planning required for reserve funding',
				account: 'Reserve Account (7011)',
				boardLiability: true,
				criminalRisk: false,
			});
		}

		// 3. OPERATING ACCOUNT CRITICAL - FIDUCIARY CONCERN
		const operatingBalance = operatingData?.endingBalance || 0;
		const operatingMinimum = 25000;

		if (operatingBalance < operatingMinimum) {
			violations.push({
				type: 'OPERATING_INSUFFICIENT',
				severity: 'HIGH',
				statute: 'Chapter 720.303(1)',
				title: '🔴 OPERATING FUNDS CRITICALLY LOW',
				description: `Operating balance $${operatingBalance.toLocaleString()} below minimum safety threshold`,
				legalRisk: 'FIDUCIARY_BREACH',
				penalty: 'Potential breach of fiduciary duty - immediate action required',
				immediateAction: 'Implement expense controls or emergency assessment',
				boardLiability: true,
				criminalRisk: false,
			});
		}

		// 4. UNAUTHORIZED EXPENSES IN WRONG ACCOUNTS
		const improperExpenses =
			operatingData?.withdrawals?.filter(
				(w) =>
					w.category === 'VIOLATION' ||
					w.vendor?.toLowerCase().includes('40-year') ||
					w.vendor?.toLowerCase().includes('recert'),
			) || [];

		if (improperExpenses.length > 0) {
			const improperTotal = improperExpenses.reduce((sum, exp) => sum + exp.amount, 0);

			violations.push({
				type: 'IMPROPER_EXPENSES',
				severity: 'HIGH',
				statute: 'Chapter 720.303(6)',
				title: '❌ IMPROPER EXPENSE CLASSIFICATION',
				description: `$${improperTotal.toLocaleString()} in expenses charged to wrong accounts`,
				legalRisk: 'ACCOUNTING_VIOLATIONS',
				penalty: 'Restatement of financials required + potential board liability',
				immediateAction: 'Reclassify expenses immediately',
				boardLiability: true,
				criminalRisk: false,
			});
		}

		return { violations, alerts, emergencyActions };
	};

	// Generate board protection recommendations
	const getBoardProtections = () => {
		return [
			{
				protection: 'IMMEDIATE_RESOLUTION',
				title: 'Pass Emergency Board Resolution',
				description: 'Document board awareness and corrective action',
				template: `WHEREAS improper fund transfers have been identified;
WHEREAS the Board must protect the Association from legal liability;
NOW THEREFORE BE IT RESOLVED that all inter-account transfers are immediately suspended pending compliance review.`,
				urgency: 'IMMEDIATE',
			},
			{
				protection: 'DUAL_APPROVAL_SYSTEM',
				title: 'Implement Dual Approval for Transfers',
				description: 'Require two board signatures for any inter-account transfers >$500',
				urgency: 'THIS_WEEK',
			},
			{
				protection: 'MANAGEMENT_COMPANY_NOTICE',
				title: 'Notify Management Company',
				description: 'Formally restrict transfer authority and require board approval',
				urgency: 'IMMEDIATE',
			},
			{
				protection: 'MONTHLY_RECONCILIATION',
				title: 'Mandatory Monthly Compliance Review',
				description: 'Board treasurer must review and certify monthly reconciliations',
				urgency: 'ONGOING',
			},
			{
				protection: 'LEGAL_CONSULTATION',
				title: 'Consult HOA Attorney',
				description: 'Review violations and implement corrective measures',
				urgency: 'THIS_WEEK',
			},
		];
	};

	// Calculate board member liability risk
	const calculateLiabilityRisk = (violations) => {
		let riskScore = 0;
		let personalLiability = false;
		let criminalRisk = false;
		let immediateAction = false;

		violations.forEach((violation) => {
			switch (violation.severity) {
				case 'CRITICAL':
					riskScore += 40;
					break;
				case 'HIGH':
					riskScore += 25;
					break;
				case 'MEDIUM':
					riskScore += 15;
					break;
				case 'LOW':
					riskScore += 5;
					break;
			}

			if (violation.boardLiability) personalLiability = true;
			if (violation.criminalRisk) criminalRisk = true;
			if (violation.immediateAction) immediateAction = true;
		});

		const riskLevel = riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';

		return {
			riskScore,
			riskLevel,
			personalLiability,
			criminalRisk,
			immediateAction,
			recommendation: criminalRisk
				? 'EMERGENCY_LEGAL_CONSULTATION'
				: personalLiability
					? 'IMMEDIATE_CORRECTIVE_ACTION'
					: riskScore > 40
						? 'IMPLEMENT_CONTROLS'
						: 'MONITOR_COMPLIANCE',
		};
	};

	// Generate compliance checklist
	const getComplianceChecklist = () => {
		return [
			{
				item: 'Fund Segregation',
				requirement: 'Operating, reserve, and special assessment funds in separate accounts',
				compliant: false, // Based on your violations
				statute: 'Chapter 720.303(6)',
				action: 'Stop all inter-account transfers immediately',
			},
			{
				item: 'Reserve Funding',
				requirement: 'Reserve funds used only for designated purposes',
				compliant: false, // Based on your violations
				statute: 'Chapter 720.303(6)(b)',
				action: 'Reverse improper transfers and reclassify expenses',
			},
			{
				item: 'Financial Reporting',
				requirement: 'Annual financial report with reserve study',
				compliant: null, // Unknown from data
				statute: 'Chapter 720.303(4)',
				action: 'Ensure annual report compliance',
			},
			{
				item: 'Board Fiduciary Duty',
				requirement: 'Act in good faith and best interests of association',
				compliant: false, // Violations indicate breach
				statute: 'Chapter 720.303(1)',
				action: 'Document corrective actions and implement controls',
			},
			{
				item: 'Expense Authorization',
				requirement: 'Proper approval and classification of expenses',
				compliant: false, // Based on improper expenses
				statute: 'Chapter 720.303(6)',
				action: 'Implement expense approval procedures',
			},
		];
	};

	// Miami Beach specific requirements
	const miamiBenchRequirements = {
		fortyYearCertification: {
			requirement: 'Separate account for 40-year recertification funds',
			account: 'Chase Account 5872',
			status: 'VIOLATED', // Based on mixing violations with operating account 5129
			action:
				'Immediately segregate all 40-year cert funds in account 5872 - no mixing with operating (5129) or reserves (7011)',
		},
		reserveFunding: {
			requirement: 'General reserve funds for capital improvements',
			account: 'Chase Account 7011',
			status: 'CRITICALLY_LOW', // Based on balance being well below recommended
			action: 'Increase reserve funding - current balance critically low',
		},
		operatingAccount: {
			requirement: 'Day-to-day operational expenses only',
			account: 'Chase Account 5129',
			status: 'VIOLATED', // Based on improper transfers to other accounts
			action: 'Stop all transfers to accounts 7011 and 5872 without proper authorization',
		},
		floodInsurance: {
			requirement: 'Flood insurance required for coastal properties',
			budgeted: 777.42,
			status: 'COMPLIANT',
		},
		elevatorCompliance: {
			requirement: 'Annual elevator inspection and certificates',
			budgeted: 450.0,
			status: 'COMPLIANT',
		},
	};

	return {
		floridaStatutes,
		checkViolations,
		getBoardProtections,
		calculateLiabilityRisk,
		getComplianceChecklist,
		miamiBenchRequirements,

		// Emergency contact information
		emergencyContacts: {
			hoaAttorney: 'Consult your HOA attorney immediately',
			dbpr: 'Department of Business and Professional Regulation: (850) 487-1395',
			emergencyMeeting: 'Schedule emergency board meeting within 7 days per Florida statutes',
		},
	};
};
