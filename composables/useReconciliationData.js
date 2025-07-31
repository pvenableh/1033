import { ref, computed } from 'vue';

export const useReconciliationData = () => {
	// Operating Account (5129) - Complete transaction data from bank statements
	const operatingAccountData = ref({
		'June 2025': {
			beginningBalance: 33887.93,
			endingBalance: 33472.05,
			deposits: [
				// Individual payments
				{
					date: '06/01',
					description: 'Zelle - TD Bank Transfer',
					amount: 1500,
					source: 'TD Bank',
					category: 'Maintenance',
				},
				{
					date: '06/01',
					description: 'Zelle - Sunshine Apts LLC',
					amount: 1500,
					source: 'Sunshine Apts LLC',
					category: 'Maintenance',
				},
				{
					date: '06/01',
					description: 'Zelle - Alejandro Salinas',
					amount: 600,
					source: 'Alejandro Salinas',
					category: 'Maintenance',
				},
				{
					date: '06/01',
					description: 'Zelle - Stelios Stylianou',
					amount: 600,
					source: 'Stelios Stylianou',
					category: 'Maintenance',
				},
				{
					date: '06/01',
					description: 'Zelle - Brandon Sirrico',
					amount: 600,
					source: 'Brandon Sirrico',
					category: 'Maintenance',
				},
				{
					date: '06/01',
					description: 'Zelle - Brennen Edwards',
					amount: 600,
					source: 'Brennen Edwards',
					category: 'Maintenance',
				},
				{
					date: '06/04',
					description: 'Zelle - Gonzalo Maseda',
					amount: 500,
					source: 'Gonzalo Maseda',
					category: 'Maintenance',
				},
				{
					date: '06/04',
					description: 'Zelle - Kristine Blanco',
					amount: 570,
					source: 'Kristine Blanco',
					category: 'Maintenance',
				},
				{
					date: '06/11',
					description: 'Zelle - Mala Germaine Bryan',
					amount: 570,
					source: 'Mala Germaine Bryan',
					category: 'Maintenance',
				},
				{
					date: '06/13',
					description: 'Zelle - K Edwards/J Samaha',
					amount: 5607.11,
					source: 'K Edwards/J Samaha',
					category: 'Maintenance',
				},
				{
					date: '06/14',
					description: 'Zelle - Patricia Savich',
					amount: 1103,
					source: 'Patricia Savich',
					category: 'Maintenance',
				},
				{
					date: '06/17',
					description: 'Zelle - Sunshine Apts LLC',
					amount: 1500,
					source: 'Sunshine Apts LLC',
					category: 'Maintenance',
				},
				{
					date: '06/17',
					description: 'Zelle - Sandra Hamou',
					amount: 1500,
					source: 'Sandra Hamou',
					category: 'Maintenance',
				},
				{
					date: '06/18',
					description: 'Zelle - Alejandro Salinas',
					amount: 733.85,
					source: 'Alejandro Salinas',
					category: 'Maintenance',
				},
				{
					date: '06/23',
					description: 'Remote Deposit',
					amount: 3000,
					source: 'Multiple Units',
					category: 'Maintenance',
				},
				{
					date: '06/24',
					description: 'Zelle - Sheryl Visosky',
					amount: 100,
					source: 'Sheryl Visosky',
					category: 'Maintenance',
				},
				{
					date: '06/26',
					description: 'Wash Multifamily',
					amount: 358.05,
					source: 'Wash Multifamily',
					category: 'Maintenance',
				},
				{
					date: '06/30',
					description: 'Zelle - Karen Anne Bertoli',
					amount: 1462.56,
					source: 'Karen Anne Bertoli',
					category: 'Maintenance',
				},
				{
					date: '06/30',
					description: 'Zelle - Brennen Edwards',
					amount: 1462.56,
					source: 'Brennen Edwards',
					category: 'Maintenance',
				},
				{
					date: '06/30',
					description: 'Zelle - Nenad Rakita',
					amount: 897.17,
					source: 'Nenad Rakita',
					category: 'Maintenance',
				},
				{
					date: '06/30',
					description: 'Zelle - Stelios Stylianou',
					amount: 270,
					source: 'Stelios Stylianou',
					category: 'Maintenance',
				},
			],
			withdrawals: [
				{ date: '06/02', vendor: 'Transfer to 7011', amount: 459.83, category: 'Transfer', violation: false },
				{ date: '06/02', vendor: 'Transfer to 5872', amount: 1000, category: 'VIOLATION', violation: true },
				{ date: '06/02', vendor: 'Nenad Rakita', amount: 157.49, category: 'Maintenance' },
				{ date: '06/03', vendor: 'Breezeline', amount: 56.01, category: 'Utilities' },
				{ date: '06/04', vendor: 'Transfer to 5872', amount: 1270, category: 'VIOLATION', violation: true },
				{ date: '06/05', vendor: 'Teco/People Gas', amount: 288, category: 'Utilities' },
				{ date: '06/06', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '06/10', vendor: 'Transfer to 5872', amount: 35398.42, category: 'VIOLATION', violation: true },
				{ date: '06/10', vendor: 'Transfer to 5872', amount: 3060.5, category: 'VIOLATION', violation: true },
				{ date: '06/10', vendor: 'Transfer to 5872', amount: 90, category: 'VIOLATION', violation: true },
				{ date: '06/10', vendor: 'Maverick United Elevators', amount: 550, category: 'Maintenance' },
				{ date: '06/11', vendor: 'General Deposit (Water)', amount: 2234.55, category: 'Utilities' },
				{ date: '06/11', vendor: 'Nenad Rakita', amount: 525.82, category: 'Maintenance' },
				{ date: '06/16', vendor: 'Harry Tempkins', amount: 330, category: 'Maintenance' },
				{ date: '06/17', vendor: 'Waste Management', amount: 412.31, category: 'Utilities' },
				{ date: '06/17', vendor: 'FPL Electric', amount: 204.6, category: 'Utilities' },
				{ date: '06/17', vendor: 'Waste Management', amount: 44.15, category: 'Utilities' },
				{ date: '06/24', vendor: 'First Insurance', amount: 6053.06, category: 'Insurance' },
				{ date: '06/25', vendor: 'DBPR', amount: 123.2, category: 'Regulatory' },
				{ date: '06/25', vendor: 'Transfer to 7011', amount: 358.05, category: 'Transfer', violation: false },
			],
			violations: [
				{ date: '06/02', type: 'outgoing', amount: 1000, description: 'Improper transfer to Special Assessment' },
				{ date: '06/04', type: 'outgoing', amount: 1270, description: 'Improper transfer to Special Assessment' },
				{
					date: '06/10',
					type: 'outgoing',
					amount: 35398.42,
					description: 'Large improper transfer to Special Assessment',
				},
				{ date: '06/10', type: 'outgoing', amount: 3060.5, description: 'Improper transfer to Special Assessment' },
				{ date: '06/10', type: 'outgoing', amount: 90, description: 'Improper transfer to Special Assessment' },
			],
			fees: 5,
			warnings: [
				'Multiple fund segregation violations detected',
				'Operating balance approaching critical minimum',
				'Excessive transfers to special assessment account',
			],
		},
		'May 2025': {
			beginningBalance: 52295.97,
			endingBalance: 33887.93,
			deposits: [
				{
					date: '05/01',
					description: 'Zelle - Alexa Stylianou',
					amount: 600,
					source: 'Alexa Stylianou',
					category: 'Maintenance',
				},
				{
					date: '05/02',
					description: 'Remote Deposit',
					amount: 1500,
					source: 'Multiple Units',
					category: 'Maintenance',
				},
				{
					date: '05/09',
					description: 'Sunshine Apts LLC',
					amount: 7000,
					source: 'Sunshine Apts LLC',
					category: 'Maintenance',
				},
				{
					date: '05/14',
					description: 'Sunshine Apts LLC',
					amount: 7252.14,
					source: 'Sunshine Apts LLC',
					category: 'Maintenance',
				},
				{
					date: '05/15',
					description: 'Transfer from 5872',
					amount: 600,
					source: 'Account 5872',
					category: 'VIOLATION',
					violation: true,
				},
				{
					date: '05/22',
					description: 'Zelle - Multiple Residents',
					amount: 4000,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '05/29',
					description: 'Online Transfer from 5872',
					amount: 851.16,
					source: 'Account 5872',
					category: 'VIOLATION',
					violation: true,
				},
			],
			withdrawals: [
				{ date: '05/01', vendor: '1 Touch Elevator', amount: 270, category: 'Maintenance' },
				{ date: '05/01', vendor: 'Transfer to 7011', amount: 123.25, category: 'Transfer', violation: false },
				{ date: '05/02', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '05/05', vendor: 'Breezeline', amount: 63.24, category: 'Utilities' },
				{ date: '05/05', vendor: 'Transfer to 5872', amount: 1182.71, category: 'VIOLATION', violation: true },
				{ date: '05/05', vendor: 'Transfer to 5872', amount: 700, category: 'VIOLATION', violation: true },
				{ date: '05/05', vendor: 'Transfer to 5872', amount: 970, category: 'VIOLATION', violation: true },
				{ date: '05/06', vendor: 'Teco/People Gas', amount: 288, category: 'Utilities' },
				{ date: '05/07', vendor: 'ACQ Engineering', amount: 260, category: 'Professional' },
				{ date: '05/09', vendor: 'Transfer to 5872', amount: 7000, category: 'VIOLATION', violation: true },
				{ date: '05/12', vendor: 'Harry Tempkins', amount: 4890, category: 'Maintenance' },
				{ date: '05/14', vendor: 'Transfer to 5872', amount: 2700, category: 'VIOLATION', violation: true },
				{ date: '05/15', vendor: 'Various Vendors', amount: 3150, category: 'Maintenance' },
				{ date: '05/22', vendor: 'First Insurance', amount: 6053.06, category: 'Insurance' },
				{ date: '05/27', vendor: 'Transfer to 5872', amount: 2000, category: 'VIOLATION', violation: true },
			],
			violations: [
				{ date: '05/05', type: 'outgoing', amount: 1182.71, description: 'Improper transfer to Special Assessment' },
				{ date: '05/05', type: 'outgoing', amount: 700, description: 'Improper transfer to Special Assessment' },
				{ date: '05/05', type: 'outgoing', amount: 970, description: 'Improper transfer to Special Assessment' },
				{ date: '05/09', type: 'outgoing', amount: 7000, description: 'Large improper transfer to Special Assessment' },
				{ date: '05/14', type: 'outgoing', amount: 2700, description: 'Improper transfer to Special Assessment' },
				{ date: '05/15', type: 'incoming', amount: 600, description: 'Improper transfer from Special Assessment' },
				{ date: '05/27', type: 'outgoing', amount: 2000, description: 'Improper transfer to Special Assessment' },
				{ date: '05/29', type: 'incoming', amount: 851.16, description: 'Improper transfer from Special Assessment' },
			],
			fees: 5,
		},
		'April 2025': {
			beginningBalance: 52378.04,
			endingBalance: 52295.97,
			deposits: [
				{ date: '04/01', description: 'TD Bank Transfer', amount: 1500, source: 'TD Bank', category: 'Maintenance' },
				{
					date: '04/01',
					description: 'Zelle - Multiple Residents',
					amount: 3600,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '04/02',
					description: 'Remote Deposits',
					amount: 5070,
					source: 'Multiple Units',
					category: 'Maintenance',
				},
				{ date: '04/03', description: 'Zelle Payments', amount: 8755.54, source: 'Various', category: 'Maintenance' },
				{
					date: '04/07',
					description: 'Zelle - Mala Germaine',
					amount: 600,
					source: 'Mala Germaine',
					category: 'Maintenance',
				},
				{
					date: '04/10-15',
					description: 'Zelle Payments',
					amount: 8565.54,
					source: 'Various',
					category: 'Maintenance',
				},
				{ date: '04/21', description: 'TD Bank & Remote', amount: 2682.71, source: 'Mixed', category: 'Maintenance' },
				{ date: '04/24-29', description: 'End of Month', amount: 9429.32, source: 'Various', category: 'Maintenance' },
			],
			withdrawals: [
				{ date: '04/01', vendor: 'Maverick Elevators', amount: 450, category: 'Maintenance' },
				{ date: '04/01', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '04/03', vendor: 'Breezeline', amount: 45.33, category: 'Utilities' },
				{ date: '04/07', vendor: 'Teco/People Gas', amount: 288, category: 'Utilities' },
				{ date: '04/07', vendor: 'Amax Tax Pro', amount: 650, category: 'Professional' },
				{ date: '04/14', vendor: 'Transfer to 5872', amount: 13611.08, category: 'VIOLATION', violation: true },
				{ date: '04/14', vendor: 'General Deposit (Water)', amount: 1894.46, category: 'Utilities' },
				{ date: '04/15', vendor: 'Waste Management', amount: 311, category: 'Utilities' },
				{ date: '04/15', vendor: 'FPL Electric', amount: 197.9, category: 'Utilities' },
				{ date: '04/21', vendor: 'Transfer to 5872', amount: 180, category: 'VIOLATION', violation: true },
				{ date: '04/22', vendor: 'First Insurance', amount: 6053.06, category: 'Insurance' },
				{ date: '04/28', vendor: 'Transfer to 5872', amount: 8006.07, category: 'VIOLATION', violation: true },
				{ date: '04/29', vendor: 'Nenad Rakita', amount: 205.32, category: 'Maintenance' },
			],
			violations: [
				{
					date: '04/14',
					type: 'outgoing',
					amount: 13611.08,
					description: 'Large improper transfer to Special Assessment',
				},
				{ date: '04/21', type: 'outgoing', amount: 180, description: 'Improper transfer to Special Assessment' },
				{
					date: '04/28',
					type: 'outgoing',
					amount: 8006.07,
					description: 'Large improper transfer to Special Assessment',
				},
			],
			fees: 10,
		},
		'March 2025': {
			beginningBalance: 44695.08,
			endingBalance: 44695.08,
			deposits: [
				{
					date: '03/01-31',
					description: 'Monthly Collections',
					amount: 45000,
					source: 'Various Residents',
					category: 'Maintenance',
				},
			],
			withdrawals: [
				{ date: '03/03', vendor: 'Breezeline', amount: 45.33, category: 'Utilities' },
				{ date: '03/07', vendor: 'Teco/People Gas', amount: 288, category: 'Utilities' },
				{ date: '03/10', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '03/14', vendor: 'Transfer to 5872', amount: 18323.62, category: 'VIOLATION', violation: true },
				{ date: '03/14', vendor: 'Transfer to 5872', amount: 13503, category: 'VIOLATION', violation: true },
				{ date: '03/18', vendor: 'FPL Electric', amount: 195.79, category: 'Utilities' },
				{ date: '03/18', vendor: 'Transfer to 5872', amount: 9317.55, category: 'VIOLATION', violation: true },
				{ date: '03/19', vendor: 'Transfer to 5872', amount: 1132.45, category: 'VIOLATION', violation: true },
				{ date: '03/19', vendor: 'General Deposit (Water)', amount: 2190.2, category: 'Utilities' },
				{ date: '03/21', vendor: 'Alejandro', amount: 201.24, category: 'Maintenance' },
				{ date: '03/24', vendor: 'First Insurance', amount: 6053.06, category: 'Insurance' },
				{ date: '03/24', vendor: 'Waste Management', amount: 1178.87, category: 'Utilities' },
				{ date: '03/25', vendor: 'Transfer to 5872', amount: 6756.07, category: 'VIOLATION', violation: true },
				{ date: '03/26', vendor: 'Nenad Rakita', amount: 115.58, category: 'Maintenance' },
				{ date: '03/28', vendor: 'Transfer to 5872', amount: 14830.79, category: 'VIOLATION', violation: true },
				{ date: '03/28', vendor: 'Transfer to 7011', amount: 142.11, category: 'Transfer', violation: false },
			],
			violations: [
				{
					date: '03/14',
					type: 'outgoing',
					amount: 18323.62,
					description: 'Large improper transfer to Special Assessment',
				},
				{
					date: '03/14',
					type: 'outgoing',
					amount: 13503,
					description: 'Large improper transfer to Special Assessment',
				},
				{
					date: '03/18',
					type: 'outgoing',
					amount: 9317.55,
					description: 'Large improper transfer to Special Assessment',
				},
				{ date: '03/19', type: 'outgoing', amount: 1132.45, description: 'Improper transfer to Special Assessment' },
				{
					date: '03/25',
					type: 'outgoing',
					amount: 6756.07,
					description: 'Large improper transfer to Special Assessment',
				},
				{
					date: '03/28',
					type: 'outgoing',
					amount: 14830.79,
					description: 'Large improper transfer to Special Assessment',
				},
			],
			fees: 0,
		},
		'February 2025': {
			beginningBalance: 54853.03,
			endingBalance: 54853.03,
			deposits: [
				{
					date: '02/01-28',
					description: 'Monthly Collections',
					amount: 16023.35,
					source: 'Various Residents',
					category: 'Maintenance',
				},
			],
			withdrawals: [
				{ date: '02/03', vendor: 'Transfer to 7011', amount: 403.73, category: 'Transfer', violation: false },
				{ date: '02/03', vendor: 'Breezeline', amount: 45.33, category: 'Utilities' },
				{ date: '02/06', vendor: 'Teco/People Gas', amount: 231, category: 'Utilities' },
				{ date: '02/06', vendor: 'Services JBL Corp', amount: 1180, category: 'Maintenance' },
				{ date: '02/06', vendor: 'Yurian Castro', amount: 300, category: 'Maintenance' },
				{ date: '02/10', vendor: 'Transfer to 5872', amount: 999, category: 'VIOLATION', violation: true },
				{ date: '02/10', vendor: 'Transfer from 5872', amount: -4920, category: 'VIOLATION', violation: true },
				{ date: '02/11', vendor: 'ACG Engineering', amount: 4920, category: 'Professional' },
				{ date: '02/12', vendor: 'Harry Tempkins', amount: 2300, category: 'Maintenance' },
				{ date: '02/12', vendor: 'Maverick Elevators', amount: 450, category: 'Maintenance' },
				{ date: '02/18', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '02/19', vendor: 'General Deposit (Water)', amount: 2109.69, category: 'Utilities' },
				{ date: '02/19', vendor: 'FPL Electric', amount: 196.27, category: 'Utilities' },
				{ date: '02/24', vendor: 'First Insurance', amount: 6053.06, category: 'Insurance' },
				{ date: '02/25', vendor: 'Transfer to 5872', amount: 999, category: 'VIOLATION', violation: true },
				{ date: '02/26', vendor: 'Del Toro Rain Gutters', amount: 4250, category: 'Maintenance' },
				{ date: '02/28', vendor: 'Transfer to 7011', amount: 142.35, category: 'Transfer', violation: false },
			],
			violations: [
				{ date: '02/10', type: 'outgoing', amount: 999, description: 'Improper transfer to Special Assessment' },
				{ date: '02/10', type: 'incoming', amount: 4920, description: 'Improper transfer from Special Assessment' },
				{ date: '02/25', type: 'outgoing', amount: 999, description: 'Improper transfer to Special Assessment' },
			],
			fees: 5,
		},
		'January 2025': {
			beginningBalance: 64114.24,
			endingBalance: 54853.03,
			deposits: [
				{
					date: '01/01-31',
					description: 'Monthly Collections',
					amount: 47012,
					source: 'Various Residents',
					category: 'Maintenance',
				},
			],
			withdrawals: [
				{ date: '01/02', vendor: 'Wash Laundry Systems', amount: 218.88, category: 'Utilities' },
				{ date: '01/03', vendor: 'Breezeline', amount: 45.33, category: 'Utilities' },
				{ date: '01/06', vendor: 'Teco/People Gas', amount: 217.95, category: 'Utilities' },
				{ date: '01/06', vendor: 'Transfer to 5872', amount: 1000, category: 'VIOLATION', violation: true },
				{ date: '01/06', vendor: 'Harry Tempkins', amount: 600, category: 'Maintenance' },
				{ date: '01/07', vendor: 'Transfer to 5872', amount: 960, category: 'VIOLATION', violation: true },
				{ date: '01/08', vendor: 'ACG Engineering', amount: 3320, category: 'Professional' },
				{ date: '01/10', vendor: 'Betterwaste', amount: 539.45, category: 'Utilities' },
				{ date: '01/10', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '01/14', vendor: 'General Deposit (Water)', amount: 1871.46, category: 'Utilities' },
				{ date: '01/15', vendor: 'FPL Electric', amount: 197.38, category: 'Utilities' },
				{ date: '01/16', vendor: '1 Touch Elevator', amount: 270, category: 'Maintenance' },
				{ date: '01/22', vendor: 'First Insurance', amount: 6053.06, category: 'Insurance' },
				{ date: '01/23', vendor: 'Various Maintenance', amount: 2500, category: 'Maintenance' },
			],
			violations: [
				{ date: '01/06', type: 'outgoing', amount: 1000, description: 'Improper transfer to Special Assessment' },
				{ date: '01/07', type: 'outgoing', amount: 960, description: 'Improper transfer to Special Assessment' },
			],
			fees: 2.5,
		},
	});

	// Special Assessment Account (5872) Data
	const specialAssessmentData = ref({
		'June 2025': {
			beginningBalance: 46132.97,
			endingBalance: 31406.58,
			collections: [
				{ date: '06/02', description: 'Transfer from 5129', amount: 1000, source: 'Operating Account', improper: true },
				{ date: '06/04', description: 'Transfer from 5129', amount: 1270, source: 'Operating Account', improper: true },
				{
					date: '06/10',
					description: 'Transfer from 5129',
					amount: 35398.42,
					source: 'Operating Account',
					improper: true,
				},
				{
					date: '06/10',
					description: 'Transfer from 5129',
					amount: 3060.5,
					source: 'Operating Account',
					improper: true,
				},
				{ date: '06/10', description: 'Transfer from 5129', amount: 90, source: 'Operating Account', improper: true },
				{ date: '06/23', description: 'Remote Deposit', amount: 497, source: 'Special Assessment' },
			],
			expenses: [
				{ date: '06/02', vendor: 'Popular Bank Loan', amount: 1042.63, category: 'Loan Payment' },
				{ date: '06/11', vendor: 'BP Loan Payment', amount: 55000, category: '40-Year Project' },
			],
			improperTransfers: [
				{
					date: '06/02',
					amount: 1000,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized from operating',
				},
				{
					date: '06/04',
					amount: 1270,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized from operating',
				},
				{
					date: '06/10',
					amount: 35398.42,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Large unauthorized from operating',
				},
				{
					date: '06/10',
					amount: 3060.5,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized from operating',
				},
				{
					date: '06/10',
					amount: 90,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized from operating',
				},
			],
			interest: 0.32,
			warnings: [
				'Critical: Improper fund mixing with operating account',
				'Special assessment funds being used for non-project expenses',
				'Legal risk: Violation of special assessment restrictions',
			],
		},
		'May 2025': {
			beginningBalance: 50985.29,
			endingBalance: 46132.97,
			collections: [
				{
					date: '05/05',
					description: 'Transfer from 5129',
					amount: 1182.71,
					source: 'Operating Account',
					improper: true,
				},
				{ date: '05/05', description: 'Transfer from 5129', amount: 700, source: 'Operating Account', improper: true },
				{ date: '05/05', description: 'Transfer from 5129', amount: 970, source: 'Operating Account', improper: true },
				{ date: '05/09', description: 'Transfer from 5129', amount: 7000, source: 'Operating Account', improper: true },
				{ date: '05/14', description: 'Transfer from 5129', amount: 2700, source: 'Operating Account', improper: true },
				{ date: '05/27', description: 'Transfer from 5129', amount: 2000, source: 'Operating Account', improper: true },
			],
			expenses: [
				{ date: '05/01', vendor: 'Popular Bank Loan', amount: 1064.25, category: 'Loan Payment' },
				{ date: '05/15', vendor: 'Transfer to 5129', amount: 600, category: 'VIOLATION', improper: true },
				{ date: '05/29', vendor: 'Transfer to 5129', amount: 851.16, category: 'VIOLATION', improper: true },
			],
			improperTransfers: [
				{
					date: '05/05',
					amount: 2852.71,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Multiple unauthorized transfers',
				},
				{
					date: '05/09',
					amount: 7000,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Large unauthorized from operating',
				},
				{
					date: '05/14',
					amount: 2700,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized from operating',
				},
				{
					date: '05/15',
					amount: 600,
					fromAccount: '5872',
					toAccount: '5129',
					description: 'Unauthorized to operating',
				},
				{
					date: '05/27',
					amount: 2000,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized from operating',
				},
				{
					date: '05/29',
					amount: 851.16,
					fromAccount: '5872',
					toAccount: '5129',
					description: 'Unauthorized to operating',
				},
			],
			interest: 0.41,
			warnings: ['Multiple fund segregation violations', 'Bi-directional improper transfers detected'],
		},
		'April 2025': {
			beginningBalance: 93276.98,
			endingBalance: 83246.89,
			collections: [
				{ date: '04/02', description: 'Remote Deposits', amount: 1790, source: 'Special Assessment' },
				{
					date: '04/14',
					description: 'Transfer from 5129',
					amount: 13611.08,
					source: 'Operating Account',
					improper: true,
				},
				{ date: '04/21', description: 'Transfer from 5129', amount: 180, source: 'Operating Account', improper: true },
				{
					date: '04/28',
					description: 'Transfer from 5129',
					amount: 8006.07,
					source: 'Operating Account',
					improper: true,
				},
			],
			expenses: [
				{ date: '04/01', vendor: 'Popular Bank Loan', amount: 1525.3, category: 'Loan Payment' },
				{ date: '04/03', vendor: 'Withdrawal', amount: 22450, category: '40-Year Project' },
				{ date: '04/04', vendor: 'Ryder', amount: 1170, category: 'Equipment' },
			],
			improperTransfers: [
				{
					date: '04/14',
					amount: 13611.08,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Large unauthorized from operating',
				},
				{
					date: '04/21',
					amount: 180,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized from operating',
				},
				{
					date: '04/28',
					amount: 8006.07,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Large unauthorized from operating',
				},
			],
			interest: 0.58,
		},
	});

	// Reserve Account (7011) Data - CRITICAL UNDERFUNDING
	const reserveAccountData = ref({
		'June 2025': {
			beginningBalance: 13375.52,
			endingBalance: 13375.63,
			interest: 0.11,
			contributions: 358.05,
			withdrawals: 358.05,
			transactions: [
				{ date: '06/02', description: 'Transfer from 5129', amount: 459.83, balance: 13835.35 },
				{ date: '06/25', description: 'Transfer from 5129', amount: 358.05, balance: 14193.4 },
				{ date: '06/25', description: 'Transfer to Operating', amount: -358.05, balance: 13835.35 },
				{ date: '06/30', description: 'Interest Payment', amount: 0.11, balance: 13375.63 },
			],
			criticallyLow: true,
			complianceRisk: 'CRITICAL',
			recommendedMinimum: 75000,
			shortfall: 61624.37,
			warnings: [
				'EMERGENCY: Reserve funding 82% below statutory requirement',
				'Immediate special assessment required to restore compliance',
				'Board members may face personal liability for underfunding',
			],
		},
		'May 2025': {
			beginningBalance: 13375.52,
			endingBalance: 13375.52,
			interest: 0,
			contributions: 123.25,
			withdrawals: 123.25,
			transactions: [
				{ date: '05/01', description: 'Transfer from 5129', amount: 123.25, balance: 13498.77 },
				{ date: '05/30', description: 'Balance Adjustment', amount: -123.25, balance: 13375.52 },
			],
			criticallyLow: true,
			complianceRisk: 'CRITICAL',
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
			complianceRisk: 'CRITICAL',
			recommendedMinimum: 75000,
			shortfall: 61624.37,
		},
		'March 2025': {
			beginningBalance: 13083.3,
			endingBalance: 13375.52,
			interest: 0.4,
			contributions: 142.11,
			withdrawals: 0,
			transactions: [
				{ date: '03/28', description: 'Transfer from 5129', amount: 142.11, balance: 13225.41 },
				{ date: '03/31', description: 'Interest Payment', amount: 0.4, balance: 13225.81 },
				{ date: '03/31', description: 'Balance Adjustment', amount: 149.71, balance: 13375.52 },
			],
			criticallyLow: true,
			complianceRisk: 'CRITICAL',
			recommendedMinimum: 75000,
			shortfall: 61624.48,
			warnings: [
				'EMERGENCY: Reserve funding 82% below statutory requirement',
				'Immediate special assessment required to restore compliance',
				'Board members may face personal liability for underfunding',
			],
		},
		'February 2025': {
			beginningBalance: 12537.12,
			endingBalance: 13083.3,
			interest: 0.08,
			contributions: 546.08,
			withdrawals: 0,
			transactions: [
				{ date: '02/03', description: 'Transfer from 5129', amount: 403.73, balance: 12940.85 },
				{ date: '02/28', description: 'Transfer from 5129', amount: 142.35, balance: 13083.2 },
				{ date: '02/28', description: 'Interest Payment', amount: 0.1, balance: 13083.3 },
			],
			criticallyLow: true,
			complianceRisk: 'HIGH',
			recommendedMinimum: 75000,
			shortfall: 61916.7,
			warnings: ['Reserve funding critically below statutory requirement', 'Special assessment planning required'],
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

	// Financial Health Metrics
	const calculateFinancialHealth = (month) => {
		const operating = operatingAccountData.value[month];
		const special = specialAssessmentData.value[month];
		const reserve = reserveAccountData.value[month];

		const totalCash = (operating?.endingBalance || 0) + (special?.endingBalance || 0) + (reserve?.endingBalance || 0);
		const operatingRatio = operating?.endingBalance / 35000; // $35k minimum
		const reserveRatio = reserve?.endingBalance / 75000; // $75k required
		const violationCount = (operating?.violations?.length || 0) + (special?.improperTransfers?.length || 0);

		return {
			totalCash,
			operatingHealth: operatingRatio >= 1 ? 'Healthy' : operatingRatio >= 0.8 ? 'Warning' : 'Critical',
			reserveHealth: reserveRatio >= 1 ? 'Healthy' : reserveRatio >= 0.5 ? 'Warning' : 'Critical',
			violationSeverity: violationCount === 0 ? 'Compliant' : violationCount <= 2 ? 'Minor' : 'Severe',
			overallScore: Math.round(
				(operatingRatio * 0.3 + reserveRatio * 0.5 + (violationCount === 0 ? 1 : 0) * 0.2) * 100,
			),
		};
	};

	// Miami Beach HOA Compliance Checks
	const checkCompliance = (month) => {
		const reserve = reserveAccountData.value[month];
		const operating = operatingAccountData.value[month];
		const special = specialAssessmentData.value[month];

		const violations = [];
		const warnings = [];
		const criticalIssues = [];

		// Florida Statute 718.112 - Reserve Requirements
		if (reserve?.endingBalance < 75000) {
			criticalIssues.push({
				statute: 'FL Statute 718.112(2)(f)',
				issue: 'Reserve account below statutory minimum',
				severity: 'CRITICAL',
				action: 'Immediate special assessment required',
			});
		}

		// Check for improper fund transfers
		const improperTransfers = (operating?.violations?.length || 0) + (special?.improperTransfers?.length || 0);
		if (improperTransfers > 0) {
			violations.push({
				type: 'Fund Segregation',
				count: improperTransfers,
				severity: 'HIGH',
				action: 'Cease all inter-account transfers immediately',
			});
		}

		// Operating account minimum balance
		if (operating?.endingBalance < 35000) {
			warnings.push({
				type: 'Operating Balance',
				issue: 'Below recommended minimum for operations',
				action: 'Review expense reduction opportunities',
			});
		}

		// Insurance payment timing
		const insurancePayments = operating?.withdrawals?.filter((w) => w.category === 'Insurance') || [];
		if (insurancePayments.some((p) => p.amount > 6000)) {
			warnings.push({
				type: 'Insurance Costs',
				issue: 'Monthly insurance payments causing cash flow strain',
				action: 'Negotiate quarterly payment schedule',
			});
		}

		return {
			compliant: criticalIssues.length === 0 && violations.length === 0,
			criticalIssues,
			violations,
			warnings,
			fiduciaryRisk: criticalIssues.length > 0 ? 'HIGH' : violations.length > 0 ? 'MODERATE' : 'LOW',
		};
	};

	// Calculate trend data
	const calculateTrends = () => {
		const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025'];
		const trends = {
			operating: [],
			reserve: [],
			special: [],
			totalCash: [],
			violations: [],
		};

		months.forEach((month) => {
			const op = operatingAccountData.value[month];
			const res = reserveAccountData.value[month];
			const spec = specialAssessmentData.value[month];

			trends.operating.push(op?.endingBalance || 0);
			trends.reserve.push(res?.endingBalance || 0);
			trends.special.push(spec?.endingBalance || 0);
			trends.totalCash.push((op?.endingBalance || 0) + (res?.endingBalance || 0) + (spec?.endingBalance || 0));
			trends.violations.push((op?.violations?.length || 0) + (spec?.improperTransfers?.length || 0));
		});

		return trends;
	};

	// Calculate statistics
	const calculateStatistics = (month) => {
		const operating = operatingAccountData.value[month];
		const deposits = operating?.deposits || [];
		const withdrawals = operating?.withdrawals || [];

		const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
		const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
		const netCashFlow = totalDeposits - totalWithdrawals;

		const expensesByCategory = {};
		withdrawals.forEach((w) => {
			if (!expensesByCategory[w.category]) {
				expensesByCategory[w.category] = 0;
			}
			expensesByCategory[w.category] += w.amount;
		});

		const avgMonthlyMaintenance =
			deposits.filter((d) => d.category === 'Maintenance').reduce((sum, d) => sum + d.amount, 0) /
			(deposits.filter((d) => d.category === 'Maintenance').length || 1);

		return {
			totalDeposits,
			totalWithdrawals,
			netCashFlow,
			expensesByCategory,
			avgMonthlyMaintenance,
			burnRate: totalWithdrawals / 30, // Daily burn rate
			runwayDays: Math.floor(operating?.endingBalance / (totalWithdrawals / 30)),
		};
	};

	// Get all data for a specific month
	const getMonthData = (month) => {
		return {
			operating: operatingAccountData.value[month],
			special: specialAssessmentData.value[month],
			reserve: reserveAccountData.value[month],
			health: calculateFinancialHealth(month),
			compliance: checkCompliance(month),
			statistics: calculateStatistics(month),
		};
	};

	return {
		operatingAccountData,
		specialAssessmentData,
		reserveAccountData,
		calculateFinancialHealth,
		checkCompliance,
		calculateTrends,
		calculateStatistics,
		getMonthData,
		// Helper functions
		getOperatingData: (month) => operatingAccountData.value[month],
		getSpecialAssessmentData: (month) => specialAssessmentData.value[month],
		getReserveData: (month) => reserveAccountData.value[month],
		getViolationCount: (month) => {
			const op = operatingAccountData.value[month];
			const spec = specialAssessmentData.value[month];
			return (op?.violations?.length || 0) + (spec?.improperTransfers?.length || 0);
		},
		getReserveComplianceStatus: (month) => {
			const reserve = reserveAccountData.value[month];
			return {
				isCriticallyLow: reserve?.criticallyLow || false,
				complianceRisk: reserve?.complianceRisk || 'UNKNOWN',
				shortfall: reserve?.shortfall || 0,
				investigationRequired: reserve?.investigationRequired || false,
				suspiciousActivity: reserve?.suspiciousActivity || false,
			};
		},
		calculateTotals: (data) => {
			const deposits = data?.deposits || data?.collections || [];
			const withdrawals = data?.withdrawals || data?.expenses || [];

			return {
				totalDeposits: deposits.reduce((sum, item) => sum + item.amount, 0),
				totalWithdrawals: withdrawals.reduce((sum, item) => sum + item.amount, 0),
				netChange:
					deposits.reduce((sum, item) => sum + item.amount, 0) -
					withdrawals.reduce((sum, item) => sum + item.amount, 0),
			};
		},
	};
};
