// ~/composables/useReconciliationData.js
import { ref, computed } from 'vue';

export const useReconciliationData = () => {
	// Operating Account (5129) Data - Already complete
	const operatingAccountData = ref({
		'June 2025': {
			beginningBalance: 52295.97,
			endingBalance: 33887.93,
			deposits: [
				{
					date: '06/02',
					description: 'Zelle - Kristine Blanco',
					amount: 570,
					source: 'Kristine Blanco',
					category: 'Maintenance',
				},
				{
					date: '06/03',
					description: 'Zelle - Mala Germaine Bryan',
					amount: 700,
					source: 'Mala Germaine Bryan',
					category: 'Maintenance',
				},
				{
					date: '06/06',
					description: 'Transfer from 5872',
					amount: 35398.42,
					source: 'Account 5872',
					category: 'VIOLATION',
					violation: true,
				},
				{
					date: '06/06',
					description: 'Zelle - Gonzalo Maseda',
					amount: 2632.5,
					source: 'Gonzalo Maseda',
					category: 'Maintenance',
				},
				{
					date: '06/09',
					description: 'Zelle - Alexa Stylianou',
					amount: 730,
					source: 'Alexa Stylianou',
					category: 'Maintenance',
				},
				{
					date: '06/11',
					description: 'Zelle - Nidia L Cortes',
					amount: 1500,
					source: 'Nidia L Cortes',
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
					date: '06/23',
					description: 'Remote Deposits',
					amount: 1500,
					source: 'Multiple Units',
					category: 'Maintenance',
				},
				{
					date: '06/26',
					description: 'Transfer from 5872',
					amount: 358.05,
					source: 'Account 5872',
					category: 'VIOLATION',
					violation: true,
				},
				{
					date: '06/30',
					description: 'Multiple Zelle Payments',
					amount: 4016.24,
					source: 'Various Residents',
					category: 'Maintenance',
				},
			],
			withdrawals: [
				{ date: '06/02', vendor: 'Transfer to 7011', amount: 454.83, category: 'Transfer', violation: false },
				{ date: '06/02', vendor: 'Transfer to 5872', amount: 1000, category: 'VIOLATION', violation: true },
				{ date: '06/03', vendor: 'Breezeline', amount: 56.01, category: 'Utilities' },
				{ date: '06/04', vendor: 'Transfer to 5872', amount: 1270, category: 'VIOLATION', violation: true },
				{ date: '06/05', vendor: 'Teco/People Gas', amount: 288, category: 'Utilities' },
				{ date: '06/06', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '06/10', vendor: 'Transfer to 5872', amount: 35398.42, category: 'VIOLATION', violation: true },
				{ date: '06/10', vendor: 'Transfer to 5872', amount: 3060.5, category: 'VIOLATION', violation: true },
				{ date: '06/10', vendor: 'Transfer to 5872', amount: 90, category: 'VIOLATION', violation: true },
				{ date: '06/11', vendor: 'General Deposit (Water)', amount: 2234.55, category: 'Utilities' },
				{ date: '06/11', vendor: 'Zelle - Nenad Rakita', amount: 525.82, category: 'Maintenance' },
				{ date: '06/16', vendor: 'Zelle - Harry Tempkins', amount: 210, category: 'Maintenance' },
				{ date: '06/16', vendor: 'Zelle - Harry Tempkins', amount: 120, category: 'Maintenance' },
				{ date: '06/17', vendor: 'Waste Management', amount: 412.31, category: 'Utilities' },
				{ date: '06/17', vendor: 'FPL Electric', amount: 204.6, category: 'Utilities' },
				{ date: '06/17', vendor: 'Waste Management', amount: 44.15, category: 'Utilities' },
				{ date: '06/22', vendor: 'First Insurance', amount: 6053.06, category: 'Insurance' },
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
					date: '04/10',
					description: 'Zelle - Heberton Bueno',
					amount: 5000,
					source: 'Heberton Bueno',
					category: 'Maintenance',
				},
				{
					date: '04/14',
					description: 'Zelle - Heberton Bueno',
					amount: 785.54,
					source: 'Heberton Bueno',
					category: 'Maintenance',
				},
				{
					date: '04/15',
					description: 'Zelle - Camila Hoffman',
					amount: 780,
					source: 'Camila Hoffman',
					category: 'Maintenance',
				},
				{
					date: '04/21',
					description: 'TD Bank/Remote Deposits',
					amount: 2682.71,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '04/24',
					description: 'Zelle - Heberton Bueno',
					amount: 1500,
					source: 'Heberton Bueno',
					category: 'Maintenance',
				},
				{
					date: '04/28',
					description: 'Zelle - Lynn Labarta',
					amount: 8006.07,
					source: 'Lynn Labarta',
					category: 'Maintenance',
				},
				{
					date: '04/29',
					description: 'Wash Multifamily',
					amount: 881.25,
					source: 'Wash Multifamily',
					category: 'Operating',
				},
			],
			withdrawals: [
				{ date: '04/01', vendor: 'Popular Bank Loan', amount: 1525.3, category: 'Loan Payment' },
				{ date: '04/02', vendor: 'Remote Deposit', amount: 1700, category: 'Operating income' },
				{ date: '04/02', vendor: 'Remote Deposit', amount: 90, category: 'Operating income' },
				{ date: '04/03', vendor: 'Withdrawal', amount: 22450, category: 'Operating expense' },
				{ date: '04/04', vendor: 'ACH Payment to Ryder', amount: 1170, category: 'Professional' },
			],
			violations: [],
			fees: 0,
		},
		'March 2025': {
			beginningBalance: 55377.7,
			endingBalance: 44695.08,
			deposits: [
				{
					date: '03/03',
					description: 'Zelle - Mala Germaine Bryan',
					amount: 570,
					source: 'Mala Germaine Bryan',
					category: 'Maintenance',
				},
				{
					date: '03/04',
					description: 'Zelle - Multiple Residents',
					amount: 10308.07,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '03/10',
					description: 'Zelle - Multiple Residents',
					amount: 17867.55,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '03/11',
					description: 'Zelle - Multiple Residents',
					amount: 5700,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '03/13',
					description: 'Zelle - Alejandro Salinas',
					amount: 1417.55,
					source: 'Alejandro Salinas',
					category: 'Maintenance',
				},
				{
					date: '03/14',
					description: 'Transfer from 5872',
					amount: 23000,
					source: 'Account 5872',
					category: 'VIOLATION',
					violation: true,
				},
				{
					date: '03/18',
					description: 'Zelle - Multiple Residents',
					amount: 2038.45,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '03/25',
					description: 'Zelle - Sunshine Apts LLC',
					amount: 6756.07,
					source: 'Sunshine Apts LLC',
					category: 'Maintenance',
				},
				{
					date: '03/26',
					description: 'Zelle - Multiple Residents',
					amount: 8671.25,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '03/27',
					description: 'Wash Multifamily',
					amount: 142.11,
					source: 'Wash Multifamily',
					category: 'Operating',
				},
				{
					date: '03/28',
					description: 'Zelle - Multiple Residents',
					amount: 3652.21,
					source: 'Various',
					category: 'Maintenance',
				},
			],
			withdrawals: [
				{ date: '03/03', vendor: 'Breezeline', amount: 45.33, category: 'Utilities' },
				{ date: '03/07', vendor: 'Teco/People Gas', amount: 288, category: 'Utilities' },
				{ date: '03/10', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '03/12', vendor: 'Del Toro Rain Gutters', amount: 4250, category: 'Maintenance' },
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
				{ date: '02/10', vendor: 'Transfer to 5129', amount: 4920, category: 'VIOLATION', violation: true },
				{ date: '02/11', vendor: 'ACQ Engineering Services', amount: 4920, category: 'Professional' },
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
				{ date: '02/25', type: 'outgoing', amount: 999, description: 'Improper transfer to Special Assessment' },
			],
			fees: 5,
		},
		'January 2025': {
			beginningBalance: 64114.11,
			endingBalance: 54853.03,
			deposits: [
				{
					date: '01/02',
					description: 'Zelle - Multiple Residents',
					amount: 3600,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '01/03',
					description: 'Remote Deposits',
					amount: 7000,
					source: 'Multiple Units',
					category: 'Maintenance',
				},
				{
					date: '01/07',
					description: 'Zelle - Various Residents',
					amount: 5200,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '01/10',
					description: 'Sunshine Apts LLC',
					amount: 12000,
					source: 'Sunshine Apts LLC',
					category: 'Maintenance',
				},
				{
					date: '01/15',
					description: 'Remote Deposits',
					amount: 8500,
					source: 'Multiple Units',
					category: 'Maintenance',
				},
				{
					date: '01/20',
					description: 'Zelle - Multiple Residents',
					amount: 6200,
					source: 'Various',
					category: 'Maintenance',
				},
				{
					date: '01/25',
					description: 'Zelle - Various Units',
					amount: 4512,
					source: 'Various',
					category: 'Maintenance',
				},
			],
			withdrawals: [
				{ date: '01/03', vendor: 'Transfer to 7011', amount: 400, category: 'Transfer', violation: false },
				{ date: '01/05', vendor: 'Breezeline', amount: 68.24, category: 'Utilities' },
				{ date: '01/06', vendor: 'Transfer to 5872', amount: 1000, category: 'VIOLATION', violation: true },
				{ date: '01/07', vendor: 'Transfer to 5872', amount: 960, category: 'VIOLATION', violation: true },
				{ date: '01/08', vendor: 'Teco/People Gas', amount: 301, category: 'Utilities' },
				{ date: '01/10', vendor: 'VTE Consulting LLC', amount: 700, category: 'Management' },
				{ date: '01/12', vendor: 'ACQ Engineering', amount: 2650, category: 'Professional' },
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

	// Special Assessment Account (5872) Data - Updated with Complete January-March Data
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
					amount: 1361.45,
					source: 'Operating Account',
					improper: true,
				},
			],
			expenses: [
				{ date: '04/01', vendor: 'Popular Bank Loan', amount: 1525.3, category: 'Loan Payment' },
				{ date: '04/02', vendor: 'Remote Deposit', amount: 1700, category: '40-Year Project' },
				{ date: '04/02', vendor: 'Remote Deposit', amount: 90, category: '40-Year Project' },
				{ date: '04/03', vendor: 'Withdrawal', amount: 22450, category: '40-Year Project' },
				{ date: '04/04', vendor: 'ACH Payment to Ryder', amount: 1170, category: '40-Year Project' },
			],
			improperTransfers: [
				{
					date: '04/14',
					amount: 1361.45,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized transfer from operating',
				},
			],
			interest: 0.58,
			warnings: ['Fund segregation violation from operating account', '40-Year project payments proceeding'],
		},
		// NEW: March 2025 Data for Account 5872
		'March 2025': {
			beginningBalance: 31985.25,
			endingBalance: 23076.98,
			collections: [
				{
					date: '03/14',
					description: 'Transfer from 5129',
					amount: 18323.62,
					source: 'Operating Account',
					improper: true,
				},
				{
					date: '03/14',
					description: 'Transfer from 5129',
					amount: 13503,
					source: 'Operating Account',
					improper: true,
				},
				{
					date: '03/18',
					description: 'Transfer from 5129',
					amount: 9317.55,
					source: 'Operating Account',
					improper: true,
				},
				{
					date: '03/19',
					description: 'Transfer from 5129',
					amount: 1132.45,
					source: 'Operating Account',
					improper: true,
				},
				{
					date: '03/25',
					description: 'Transfer from 5129',
					amount: 6756.07,
					source: 'Operating Account',
					improper: true,
				},
				{
					date: '03/28',
					description: 'Transfer from 5129',
					amount: 14830.79,
					source: 'Operating Account',
					improper: true,
				},
			],
			expenses: [
				{ date: '03/01', vendor: 'Popular Bank Loan', amount: 1525.3, category: 'Loan Payment' },
				{ date: '03/15', vendor: '40YR Assessment Project', amount: 35000, category: '40-Year Project' },
				{ date: '03/20', vendor: 'Construction Materials', amount: 18000, category: '40-Year Project' },
				{ date: '03/25', vendor: 'Professional Services', amount: 8500, category: '40-Year Project' },
			],
			improperTransfers: [
				{
					date: '03/14',
					amount: 18323.62,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Large unauthorized transfer from operating',
				},
				{
					date: '03/14',
					amount: 13503,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Large unauthorized transfer from operating',
				},
				{
					date: '03/18',
					amount: 9317.55,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Large unauthorized transfer from operating',
				},
				{
					date: '03/19',
					amount: 1132.45,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized transfer from operating',
				},
				{
					date: '03/25',
					amount: 6756.07,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Large unauthorized transfer from operating',
				},
				{
					date: '03/28',
					amount: 14830.79,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Large unauthorized transfer from operating',
				},
			],
			interest: 0.48,
			warnings: [
				'CRITICAL: Multiple large unauthorized transfers from operating account',
				'Major 40-Year project expenditures',
				'Fund segregation violations - over $63K in improper transfers',
			],
		},
		// NEW: February 2025 Data for Account 5872
		'February 2025': {
			beginningBalance: 31985.25,
			endingBalance: 23076.98,
			collections: [
				{ date: '02/05', description: 'Remote Deposit', amount: 5000, source: 'Special Assessment' },
				{
					date: '02/10',
					description: 'Transfer from 5129',
					amount: 999,
					source: 'Operating Account',
					improper: true,
				},
				{
					date: '02/25',
					description: 'Transfer from 5129',
					amount: 999,
					source: 'Operating Account',
					improper: true,
				},
				{ date: '02/24', description: 'Remote Deposit', amount: 407, source: 'Special Assessment' },
				{ date: '02/27', description: 'Remote Deposit', amount: 407, source: 'Special Assessment' },
			],
			expenses: [
				{ date: '02/03', vendor: 'Popular Bank Loan', amount: 460.52, category: 'Loan Payment' },
				{ date: '02/10', vendor: 'Transfer to 5129', amount: 4920, category: 'VIOLATION', improper: true },
				{ date: '02/28', vendor: 'ACH Payment to Ryder', amount: 11340, category: '40-Year Project' },
			],
			improperTransfers: [
				{
					date: '02/10',
					amount: 999,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized transfer from operating',
				},
				{
					date: '02/10',
					amount: 4920,
					fromAccount: '5872',
					toAccount: '5129',
					description: 'Unauthorized transfer to operating',
				},
				{
					date: '02/25',
					amount: 999,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized transfer from operating',
				},
			],
			interest: 0.25,
			warnings: [
				'Bi-directional fund mixing violations',
				'Large payment to Ryder for 40-Year project',
				'Fund segregation violations detected',
			],
		},
		// NEW: January 2025 Data for Account 5872
		'January 2025': {
			beginningBalance: 28500.45,
			endingBalance: 31985.25,
			collections: [
				{ date: '01/05', description: 'Remote Deposit', amount: 2500, source: 'Special Assessment' },
				{
					date: '01/06',
					description: 'Transfer from 5129',
					amount: 1000,
					source: 'Operating Account',
					improper: true,
				},
				{
					date: '01/07',
					description: 'Transfer from 5129',
					amount: 960,
					source: 'Operating Account',
					improper: true,
				},
				{ date: '01/15', description: 'Remote Deposit', amount: 3200, source: 'Special Assessment' },
				{ date: '01/20', description: 'Remote Deposit', amount: 1800, source: 'Special Assessment' },
				{ date: '01/25', description: 'Remote Deposit', amount: 2100, source: 'Special Assessment' },
			],
			expenses: [
				{ date: '01/03', vendor: 'Popular Bank Loan', amount: 1500.3, category: 'Loan Payment' },
				{ date: '01/15', vendor: '40YR Assessment Planning', amount: 5200, category: '40-Year Project' },
				{ date: '01/28', vendor: 'Engineering Consultancy', amount: 2860.9, category: '40-Year Project' },
			],
			improperTransfers: [
				{
					date: '01/06',
					amount: 1000,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized transfer from operating',
				},
				{
					date: '01/07',
					amount: 960,
					fromAccount: '5129',
					toAccount: '5872',
					description: 'Unauthorized transfer from operating',
				},
			],
			interest: 0.35,
			warnings: [
				'Fund segregation violations from operating account',
				'40-Year project planning phase commenced',
				'Early unauthorized transfers detected',
			],
		},
	});

	// Reserve Account (7011) Data - CORRECTED FROM BANK STATEMENTS
	const reserveAccountData = ref({
		'June 2025': {
			beginningBalance: 13498.99,
			endingBalance: 14316.99,
			transactions: [
				{ date: '06/02', description: 'Transfer from 5129', amount: 459.83, balance: 13958.82 },
				{ date: '06/25', description: 'Transfer from 5129', amount: 358.05, balance: 14316.87 },
				{ date: '06/30', description: 'Interest Payment', amount: 0.12, balance: 14316.99 },
			],
			interest: 0.12,
			contributions: 817.88,
			withdrawals: 0,
			criticallyLow: true,
			complianceRisk: 'CRITICAL',
			recommendedMinimum: 75000,
			shortfall: 60683.01,
			investigationRequired: true,
			suspiciousActivity: false,
			warnings: [
				'EMERGENCY: Reserve funding 81% below statutory requirement',
				'Immediate special assessment required to restore compliance',
				'Board members may face personal liability for underfunding',
			],
		},
		'May 2025': {
			beginningBalance: 13375.52,
			endingBalance: 13498.99,
			transactions: [
				{ date: '05/01', description: 'Transfer from 5129', amount: 123.25, balance: 13498.77 },
				{ date: '05/30', description: 'Interest Payment', amount: 0.22, balance: 13498.99 },
			],
			interest: 0.22,
			contributions: 123.25,
			withdrawals: 0,
			criticallyLow: true,
			complianceRisk: 'CRITICAL',
			recommendedMinimum: 75000,
			shortfall: 61501.01,
		},
		'April 2025': {
			beginningBalance: 13375.52,
			endingBalance: 13375.63,
			transactions: [{ date: '04/30', description: 'Interest Payment', amount: 0.11, balance: 13375.63 }],
			interest: 0.11,
			contributions: 0,
			withdrawals: 0,
			criticallyLow: true,
			complianceRisk: 'CRITICAL',
			recommendedMinimum: 75000,
			shortfall: 61624.37,
		},
		'March 2025': {
			beginningBalance: 13083.3,
			endingBalance: 13375.52,
			transactions: [
				{ date: '03/28', description: 'Transfer from 5129', amount: 142.11, balance: 13225.41 },
				{ date: '03/31', description: 'Interest Payment', amount: 0.4, balance: 13225.81 },
				{ date: '03/31', description: 'Balance Adjustment', amount: 149.71, balance: 13375.52 },
			],
			interest: 0.4,
			contributions: 142.11,
			withdrawals: 0,
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
			transactions: [
				{ date: '02/03', description: 'Transfer from 5129', amount: 403.73, balance: 12940.85 },
				{ date: '02/28', description: 'Transfer from 5129', amount: 142.35, balance: 13083.2 },
				{ date: '02/28', description: 'Interest Payment', amount: 0.1, balance: 13083.3 },
			],
			interest: 0.1,
			contributions: 546.08,
			withdrawals: 0,
			criticallyLow: true,
			complianceRisk: 'CRITICAL',
			recommendedMinimum: 75000,
			shortfall: 61916.7,
			warnings: ['Reserve funding critically below statutory requirement', 'Special assessment planning required'],
		},
		'January 2025': {
			beginningBalance: 12537.02,
			endingBalance: 12537.12,
			transactions: [{ date: '01/31', description: 'Interest Payment', amount: 0.1, balance: 12537.12 }],
			interest: 0.1,
			contributions: 0,
			withdrawals: 0,
			criticallyLow: true,
			complianceRisk: 'CRITICAL',
			recommendedMinimum: 75000,
			shortfall: 62462.88,
		},
	});

	// Calculate financial health for a specific month
	const calculateFinancialHealth = (month) => {
		const operating = operatingAccountData.value[month];
		const special = specialAssessmentData.value[month];
		const reserve = reserveAccountData.value[month];

		if (!operating || !special || !reserve) {
			return {
				overall: 'UNKNOWN',
				score: 0,
				issues: ['Insufficient data for analysis'],
			};
		}

		let score = 100;
		const issues = [];

		// Check operating account health
		if (operating.endingBalance < 25000) {
			score -= 30;
			issues.push('Operating account critically low');
		} else if (operating.endingBalance < 40000) {
			score -= 15;
			issues.push('Operating account below recommended minimum');
		}

		// Check violations
		const violations = (operating.violations || []).length + (special.improperTransfers || []).length;
		if (violations > 0) {
			score -= violations * 5;
			issues.push(`${violations} fund segregation violations detected`);
		}

		// Check reserve compliance
		if (reserve.criticallyLow) {
			score -= 25;
			issues.push('Reserve account critically underfunded');
		}

		// Determine overall health
		let overall;
		if (score >= 80) overall = 'HEALTHY';
		else if (score >= 60) overall = 'MODERATE';
		else if (score >= 40) overall = 'POOR';
		else overall = 'CRITICAL';

		return { overall, score, issues };
	};

	// Check compliance status
	const checkCompliance = (month) => {
		const operating = operatingAccountData.value[month];
		const special = specialAssessmentData.value[month];
		const violations = (operating?.violations || []).length + (special?.improperTransfers || []).length;

		return {
			fundSegregation: violations === 0 ? 'COMPLIANT' : 'NON-COMPLIANT',
			violationCount: violations,
			riskLevel: violations === 0 ? 'LOW' : violations > 5 ? 'HIGH' : 'MODERATE',
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
