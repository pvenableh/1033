#!/usr/bin/env node

/**
 * Budget Setup Script — ALL YEARS (2022–2026)
 * Lenox Plaza Association, Inc.
 *
 * Creates clean budget data for all fiscal years with:
 * - fiscal_years records
 * - fiscal_year_budgets records (revenue, expenses, assessment totals)
 * - budget_categories with colors
 * - budget_items with vendor_patterns + keywords for auto-categorization
 *
 * Data Sources:
 *   2022: Profit & Loss statement (actuals, not budget)
 *   2023: 2023 Budget Year Projections.xlsx
 *   2024: 2024 Budget LenoxPlaza
 *   2025: 2025 Operating Budget CSV + Proposal PDF
 *   2026: 2026 Budget PDF (adopted DEC 2025)
 *
 * Usage:
 *   node scripts/setup-budgets-all.mjs                 # Create/update all years
 *   node scripts/setup-budgets-all.mjs --clean          # Delete existing budget data first
 *   node scripts/setup-budgets-all.mjs --year=2024      # Only one year
 *   node scripts/setup-budgets-all.mjs --clean --year=2025 --year=2026
 */

import {createDirectus, rest, authentication, readItems, createItem, updateItem, deleteItems} from '@directus/sdk';
import * as readline from 'readline';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
function prompt(q) {
	const rl = readline.createInterface({input: process.stdin, output: process.stdout});
	return new Promise((res) => {
		rl.question(q, (a) => {
			rl.close();
			res(a);
		});
	});
}

// ============================================================
// SHARED VENDOR PATTERNS & KEYWORDS
// These get reused across years — only amounts change
// ============================================================
const VP = {
	waste: {
		vendor_patterns: ['Waste Connections', 'WASTE CO', 'Better Waste', 'WASTE MGMT', 'WASTE MANAGEMENT'],
		keywords: ['waste', 'trash', 'garbage', 'refuse', 'sanitation'],
	},
	laundry: {
		vendor_patterns: ['Wash Multifamily', 'WASH MULTI', 'Laundry Systems'],
		keywords: ['laundry', 'wash multifamily', 'washer', 'dryer'],
	},
	landscaping: {
		vendor_patterns: ['Guitirez', 'GUITIREZ', 'Lawn Maintenance'],
		keywords: ['landscaping', 'lawn', 'mowing', 'gardening'],
	},
	janitorial: {
		vendor_patterns: ['Jani King', 'JANI KING', 'Cleaning Services'],
		keywords: ['janitorial', 'cleaning', 'janitor', 'supplies'],
	},
	mgmtVTE: {
		vendor_patterns: ['VTE', 'V.T.E', 'VTE Management', 'FPMS'],
		keywords: ['management fee', 'hoa management', 'property management'],
	},
	elevMaint: {
		vendor_patterns: ['Maveric', 'MAVERIC', 'Maverick', 'Brouss', 'BROUSS', 'Brouss Elevator'],
		keywords: ['elevator maintenance', 'elevator service', 'lift service'],
	},
	elevPhone: {
		vendor_patterns: ['1-Touch', '1 Touch', 'One Touch', '1TOUCH'],
		keywords: ['elevator phone', 'phone line', '1-touch'],
	},
	pest: {
		vendor_patterns: ['Pest Control', 'Terminix', 'Orkin', 'Exterminator'],
		keywords: ['pest', 'exterminator', 'termite', 'roach', 'bug'],
	},
	elevInsp: {
		vendor_patterns: ['Maveric', 'MAVERIC', 'Elevator Inspection'],
		keywords: ['elevator inspection', 'annual inspection'],
	},
	fire: {
		vendor_patterns: ['A Plus Fire', 'A+ Fire', 'APLUS FIRE', 'A1 Fire', 'Hector'],
		keywords: ['fire equipment', 'fire extinguisher', 'fire alarm', 'fire inspection'],
	},
	fpl: {
		vendor_patterns: ['FPL', 'Florida Power', 'FLORIDA POWER & LIGHT'],
		keywords: ['electricity', 'electric', 'power', 'fpl', 'kilowatt'],
	},
	water: {
		vendor_patterns: ['Miami Beach', 'CITY OF MIAMI', 'Miami-Dade Water', 'MIAMI BEACH WATER'],
		keywords: ['water', 'sewer', 'utility', 'miami beach'],
	},
	gas: {
		vendor_patterns: ['Teco', 'TECO', 'PEOPLES GAS', 'People Gas', 'Teco/People'],
		keywords: ['gas', 'teco', 'peoples gas', 'natural gas'],
	},
	internet: {
		vendor_patterns: ['Breezeline', 'BREEZELINE', 'Atlantic Broadband'],
		keywords: ['internet', 'broadband', 'wifi', 'breezeline'],
	},
	buildIns: {
		vendor_patterns: ['Citizens', 'CITIZENS', 'Insurance', 'Ipfs', 'IPFS'],
		keywords: ['insurance', 'premium', 'coverage', 'policy', 'citizens', 'property insurance'],
	},
	floodIns: {vendor_patterns: ['Flood', 'NFIP', 'FEMA'], keywords: ['flood insurance', 'flood', 'nfip']},
	bankFees: {
		vendor_patterns: ['Chase', 'CHASE BANK', 'Bank Fee', 'Service Charge'],
		keywords: ['bank fee', 'service charge', 'monthly fee', 'account fee'],
	},
	postage: {vendor_patterns: ['USPS', 'FedEx', 'UPS'], keywords: ['postage', 'mail', 'shipping', 'stamps']},
	cpaAudit: {vendor_patterns: ['CPA', 'Accountant', 'Audit'], keywords: ['audit', 'cpa', 'review fees', 'accounting']},
	cpaTax: {
		vendor_patterns: ['Tax Filing', 'CPA', 'Tax Return'],
		keywords: ['tax filing', 'tax return', 'annual tax', '1120'],
	},
	legal: {
		vendor_patterns: ['Law Office', 'Attorney', 'Legal', 'Esq'],
		keywords: ['legal', 'attorney', 'lawyer', 'law firm', 'counsel'],
	},
	misc: {
		vendor_patterns: ['Home Depot', 'Lowes', 'Amazon'],
		keywords: ['misc', 'miscellaneous', 'tools', 'supplies', 'hardware'],
	},
	office: {vendor_patterns: ['Staples', 'Office Depot'], keywords: ['office', 'printing', 'paper', 'ink', 'toner']},
	dbpr: {
		vendor_patterns: ['DBPR', 'Florida License', 'Division of Corporations'],
		keywords: ['dbpr', 'llc renewal', 'business license'],
	},
	boir: {vendor_patterns: ['FinCEN', 'BOIR'], keywords: ['boir', 'beneficial ownership', 'fincen']},
	validation: {
		vendor_patterns: ['Miami Beach Permit', 'Validation'],
		keywords: ['validation permit', 'miami beach permit'],
	},
	licenses: {
		vendor_patterns: ['Miami Beach Code', 'Building Dept'],
		keywords: ['license', 'permit', 'violation', 'code enforcement'],
	},
	certFire: {
		vendor_patterns: ['Certificate of Use', 'Fire Fee'],
		keywords: ['certificate of use', 'fire fee', 'business tax receipt'],
	},
	elevCert: {
		vendor_patterns: ['Elevator Certificate', 'Monitoring Fee'],
		keywords: ['elevator certificate', 'monitoring fee', 'jurisdictional'],
	},
	sunbiz: {
		vendor_patterns: ['Sunbiz', 'Division of Corporations', 'sunbiz.org'],
		keywords: ['sunbiz', 'annual report', 'corporation renewal'],
	},
	treeTrim: {vendor_patterns: ['Tree Service', 'Arborist'], keywords: ['tree trimming', 'tree removal', 'arborist']},
	gateRepair: {
		vendor_patterns: ['Gate Repair', 'Access Control', 'C&Cc'],
		keywords: ['gate', 'access control', 'fob', 'keypad', 'entry'],
	},
	elevFix: {
		vendor_patterns: ['Maveric', 'MAVERIC', 'Elevator Repair'],
		keywords: ['elevator fix', 'elevator repair', 'elevator violation'],
	},
	security: {
		vendor_patterns: ['Camera', 'Security', 'Surveillance', 'Sebnostics'],
		keywords: ['camera', 'security', 'surveillance', 'cctv', 'dvr'],
	},
	plumbing: {vendor_patterns: ['Plumber', 'Plumbing'], keywords: ['plumbing', 'plumber', 'pipe', 'leak', 'drain']},
	electrical: {
		vendor_patterns: ['Electrician', 'Electric'],
		keywords: ['electrical', 'electrician', 'wiring', 'outlet', 'breaker'],
	},
	roof: {vendor_patterns: ['IKAAN', 'Roofing'], keywords: ['roof', 'roofing', 'leak', 'shingle', 'ikaan']},
	reserves: {vendor_patterns: ['Reserve Study', 'Reserve Advisor'], keywords: ['reserve study', 'reserve analysis']},
	gateMonthly: {
		vendor_patterns: ['Gate Access', 'Access Control'],
		keywords: ['gate monthly', 'access control fee', 'gate service'],
	},
	depreciation: {vendor_patterns: [], keywords: ['depreciation', 'accumulated depreciation']},
	online: {vendor_patterns: [], keywords: ['online', 'web service', 'subscription']},
	phone: {vendor_patterns: [], keywords: ['phone', 'telephone']},
	mbTax: {vendor_patterns: ['Miami Beach Tax'], keywords: ['miami beach tax', 'tax renewal']},
	building: {
		vendor_patterns: ['Building', 'Contractor', 'Construction'],
		keywords: ['building', 'construction', 'structural', 'concrete'],
	},
};

// Helper to build an item with vendor data
function item(code, desc, monthly, yearly, vpKey) {
	const vp = VP[vpKey] || {vendor_patterns: [], keywords: []};
	return {
		item_code: code,
		description: desc,
		monthly_budget: monthly,
		yearly_budget: yearly || monthly * 12,
		vendor_patterns: vp.vendor_patterns,
		keywords: vp.keywords,
	};
}

// 2022 removed — only a P&L existed, no formal budget. Can be added later if needed.

// ============================================================
// 2023 — Budget Projections
// From: 2023 Budget Year Projections.xlsx PDF
// Total Expenses: $173,793 | Revenue: $173,904 | $499/unit/month
// ============================================================
const BUDGET_2023 = {
	year: 2023,
	fiscal_year_budget: {
		name: '2023 Operating Budget',
		total_revenue: 173904.0,
		total_expenses: 173793.0,
		net_operating: 111.0,
		unit_count: 28,
		monthly_assessment: 499.0,
		is_active: false,
		notes:
			'From 2023 Budget Year Projections. Assessment: $499/unit/month. Flood insurance included in general policy.',
	},
	categories: [
		{
			category_name: 'Insurance',
			color: '#8B5CF6',
			description: 'Building & flood insurance',
			items: [
				item('building-insurance', 'Building & Flood Insurance', 9700.0, 116400.0, 'buildIns'),
				item('flood-insurance', 'Flood Insurance (separate)', 0.0, 0.0, 'floodIns'),
			],
		},
		{
			category_name: 'Utilities',
			color: '#F59E0B',
			description: 'Water, electric, gas',
			items: [
				item('water-sewer', 'City of Miami Beach Water/Sewer', 2500.0, 30000.0, 'water'),
				item('electricity-fpl', 'FPL Electricity', 250.0, 3000.0, 'fpl'),
				item('gas-teco', 'TECO Gas', 350.0, 4200.0, 'gas'),
			],
		},
		{
			category_name: 'Contract Services',
			color: '#3B82F6',
			description: 'Recurring vendor contracts',
			items: [
				item('elevator-maintenance', 'Brouss Elevator Maintenance', 160.0, 1920.0, 'elevMaint'),
				item('laundry-lease', 'Wash Multifamily Lease', 240.0, 2880.0, 'laundry'),
				item('waste-trash-removal', 'Better Waste - Trash Removal', 480.0, 5760.0, 'waste'),
				item('pest-control', 'Exterminator', 70.0, 840.0, 'pest'),
				item('lawn-landscaping', 'Lawn Maintenance', 120.0, 1440.0, 'landscaping'),
				item('fire-equipment', 'A1 Fire Alarm Inspections', 29.17, 350.0, 'fire'),
			],
		},
		{
			category_name: 'Administrative',
			color: '#10B981',
			description: 'Legal, accounting, office, bank fees',
			items: [
				item('legal-fees', 'Legal Services - Attorneys', 300.0, 3600.0, 'legal'),
				item('bank-fees', 'Bank Charges (regular + assessment)', 10.0, 120.0, 'bankFees'),
				item('office-supplies', 'Office Supplies', 5.0, 60.0, 'office'),
				item('postage-mail', 'Stamps USPS', 5.0, 60.0, 'postage'),
				item('reserves-study', 'Reserves to Savings', 0.0, 0.0, 'reserves'),
			],
		},
		{
			category_name: 'Regulatory',
			color: '#EC4899',
			description: 'Permits, inspections, government fees',
			items: [
				item('elevator-inspection', 'Elevator Inspections', 29.5, 354.0, 'elevInsp'),
				item('cpa-bookkeeping', 'Accounting Bookkeeping', 0.0, 0.0, 'cpaAudit'),
				item('cpa-taxes', 'Income Tax Returns', 46.0, 552.0, 'cpaTax'),
				item('dbpr-renewal', 'DBPR Corp Business LLC Renewal', 9.33, 112.0, 'dbpr'),
				item('sunbiz-renewal', 'Sunbiz Renewal Corp', 12.5, 150.0, 'sunbiz'),
				item('cert-of-use-fire', 'Miami Beach Tax Renewal', 7.08, 85.0, 'mbTax'),
				item('licenses-permits', 'Permits and Fees', 0.0, 0.0, 'licenses'),
			],
		},
		{
			category_name: 'Maintenance',
			color: '#EF4444',
			description: 'Ad-hoc repairs and maintenance',
			items: [
				item('gate-access-repairs', 'Gate Repairs', 0.0, 0.0, 'gateRepair'),
				item('electrical-repairs', 'Electrical Repairs and Supplies', 40.0, 480.0, 'electrical'),
				item('security-cameras', 'Cameras Maintenance', 30.0, 360.0, 'security'),
				item('plumbing-repairs', 'Roof and Plumbing', 50.0, 600.0, 'plumbing'),
				item('misc-expenses', 'Locks, Keys and Remote Controls', 10.0, 120.0, 'misc'),
				item('janitorial-services', 'Cleaning Services', 0.0, 0.0, 'janitorial'),
			],
		},
	],
};

// ============================================================
// 2024 — Budget
// From: 2024_Budget_LenoxPlaza.pdf
// Total Expenses: $323,850.60 | Revenue: $324,024.00 | $647/unit + $302 SA24-INS
// ============================================================
const BUDGET_2024 = {
	year: 2024,
	fiscal_year_budget: {
		name: '2024 Operating Budget',
		total_revenue: 324024.0,
		total_expenses: 323850.6,
		net_operating: 173.4,
		unit_count: 28,
		monthly_assessment: 647.0,
		is_active: false,
		notes:
			'Assessment: $647/unit + $302/unit special assessment (SA24-INS) for insurance. Total revenue includes $101,472 SA24-INS. Insurance jumped to $227k due to market conditions.',
	},
	categories: [
		{
			category_name: 'Insurance',
			color: '#8B5CF6',
			description: 'Building & flood insurance — major cost driver in 2024',
			items: [
				item('building-insurance', 'Building Insurance', 17979.0, 215748.0, 'buildIns'),
				item('flood-insurance', 'Flood Insurance', 962.55, 11550.6, 'floodIns'),
			],
		},
		{
			category_name: 'Utilities',
			color: '#F59E0B',
			description: 'Water, electric, gas',
			items: [
				item('water-sewer', 'Water & Sewer - Miami Beach', 2300.0, 27600.0, 'water'),
				item('electricity-fpl', 'Electricity - FPL', 250.0, 3000.0, 'fpl'),
				item('gas-teco', 'Gas - Teco', 350.0, 4200.0, 'gas'),
			],
		},
		{
			category_name: 'Contract Services',
			color: '#3B82F6',
			description: 'Recurring vendor contracts',
			items: [
				item('laundry-lease', 'Wash Multifamily Lease', 220.0, 2640.0, 'laundry'),
				item('lawn-landscaping', 'Lawn Maintenance & Landscaping', 240.0, 2880.0, 'landscaping'),
				item('management-fees-vte', 'Management Fees - FPMS', 1500.0, 18000.0, 'mgmtVTE'),
				item('elevator-maintenance', 'Elevator Maintenance - Brouss', 160.0, 1920.0, 'elevMaint'),
				item('waste-trash-removal', 'Waste/Trash Removal - Better Waste', 519.0, 6228.0, 'waste'),
				item('janitorial-services', 'Janitorial Services and Supplies', 240.0, 2880.0, 'janitorial'),
				item('fire-equipment', 'Fire Equipment - A Plus Fire', 62.5, 750.0, 'fire'),
				item('pest-control', 'Pest Control', 80.0, 960.0, 'pest'),
				item('elevator-phone', 'Elevator Phone Line - 1-Touch', 90.0, 1080.0, 'elevPhone'),
			],
		},
		{
			category_name: 'Administrative',
			color: '#10B981',
			description: 'Legal, accounting, office, bank fees',
			items: [
				item('legal-fees', 'Legal and Professional Fees', 800.0, 9600.0, 'legal'),
				item('bank-fees', 'Bank Fees', 10.0, 120.0, 'bankFees'),
				item('postage-mail', 'Postage & Mail', 0.0, 0.0, 'postage'),
				item('office-supplies', 'Office Supplies', 0.0, 0.0, 'office'),
				item('cpa-bookkeeping', 'CPA Accounting and Bookkeeping Fees', 0.0, 0.0, 'cpaAudit'),
				item('cpa-taxes', 'CPA Taxes & Review Fees', 400.0, 4800.0, 'cpaAudit'),
				item('cpa-tax-filing', 'CPA Taxes Filing - Annual', 50.0, 600.0, 'cpaTax'),
				item('misc-expenses', 'Misc Expenses', 100.0, 1200.0, 'misc'),
				item('office-print', 'Printing & Reproduction', 20.0, 240.0, 'office'),
				item('bad-debt', 'Bad Debt', 0.0, 0.0, 'misc'),
				item('reserves-study', '2024 Reserves Study', 0.0, 0.0, 'reserves'),
			],
		},
		{
			category_name: 'Regulatory',
			color: '#EC4899',
			description: 'Permits, inspections, government fees',
			items: [
				item('licenses-permits', 'Licenses and Permits', 200.0, 2400.0, 'licenses'),
				item('elevator-certificate', 'Miami Beach Elevator Certificate', 32.0, 384.0, 'elevCert'),
				item('dbpr-renewal', 'DBPR Corp Business LLC Renewal', 10.0, 120.0, 'dbpr'),
				item('sunbiz-renewal', 'Sunbiz Renewal Corp', 12.5, 150.0, 'sunbiz'),
				item('cert-of-use-fire', 'Miami Beach Tax Renewal', 10.0, 120.0, 'mbTax'),
			],
		},
		{
			category_name: 'Maintenance',
			color: '#EF4444',
			description: 'Ad-hoc repairs',
			items: [
				item('elevator-inspection', 'Elevator Repairs & Inspection', 50.0, 600.0, 'elevInsp'),
				item('gate-access-repairs', 'Gate & Access Control Repairs', 50.0, 600.0, 'gateRepair'),
				item('security-cameras', 'Security Cameras & Equipment', 50.0, 600.0, 'security'),
				item('roof-repairs', 'Roof Repairs', 0.0, 0.0, 'roof'),
				item('tree-trimming', 'Tree Trimming', 150.0, 1800.0, 'treeTrim'),
				item('plumbing-repairs', 'Plumbing Repairs', 50.0, 600.0, 'plumbing'),
				item('electrical-repairs', 'Electrical Repairs', 40.0, 480.0, 'electrical'),
			],
		},
	],
};

// ============================================================
// 2025 — Budget (from 2025_Operating_Budget.csv)
// Total Expenses: $177,296 | Revenue: $177,408 | $513/unit/month
// ============================================================
const BUDGET_2025 = {
	year: 2025,
	fiscal_year_budget: {
		name: '2025 Operating Budget',
		total_revenue: 177408.0,
		total_expenses: 177296.0,
		net_operating: 112.0,
		unit_count: 28,
		monthly_assessment: 513.0,
		is_active: true,
		notes:
			'Assessment: $513/unit/month. Insurance dropped from $227k to $76k after Citizen switch. Management fees reduced from $1,500 to $700 (VTE). Security cameras $7,500 one-time capital purchase.',
	},
	categories: [
		{
			category_name: 'Contract Services',
			color: '#3B82F6',
			description: 'Recurring vendor contracts',
			items: [
				item('waste-trash-removal', 'Waste/Trash Removal - Waste Co.', 453.0, 5436.0, 'waste'),
				item('laundry-lease', 'Laundry Lease - Wash Multifamily Systems', 220.0, 2640.0, 'laundry'),
				item('lawn-landscaping', 'Lawn & Landscaping - Guitirez Landsc.', 240.0, 2880.0, 'landscaping'),
				item('janitorial-services', 'Janitorial Services and Supplies', 900.0, 10800.0, 'janitorial'),
				item('management-fees-vte', 'Management Fees - VTE', 700.0, 8400.0, 'mgmtVTE'),
				item('elevator-maintenance', 'Elevator Maintenance - Maveric', 150.0, 1800.0, 'elevMaint'),
				item('elevator-phone', 'Elevator Phone Line - 1-Touch', 90.0, 1080.0, 'elevPhone'),
				item('pest-control', 'Pest Control', 150.0, 1800.0, 'pest'),
				item('elevator-inspection', 'Annual Elevator Inspection - Maveric', 37.5, 450.0, 'elevInsp'),
				item('fire-equipment', 'Fire Equipment - A Plus Fire', 62.5, 750.0, 'fire'),
			],
		},
		{
			category_name: 'Utilities',
			color: '#F59E0B',
			description: 'Monthly utility bills',
			items: [
				item('electricity-fpl', 'Electricity - FPL', 220.0, 2640.0, 'fpl'),
				item('water-sewer', 'Water & Sewer - Miami Beach Water', 2000.0, 24000.0, 'water'),
				item('gas-teco', 'Gas - Teco', 320.0, 3840.0, 'gas'),
				item('internet-breezeline', 'Internet - Breezeline', 46.0, 552.0, 'internet'),
			],
		},
		{
			category_name: 'Insurance',
			color: '#8B5CF6',
			description: 'Building and flood insurance',
			items: [
				item('building-insurance', 'Building Insurance', 6354.17, 76250.0, 'buildIns'),
				item('flood-insurance', 'Flood Insurance', 777.42, 9329.0, 'floodIns'),
			],
		},
		{
			category_name: 'Administrative',
			color: '#10B981',
			description: 'General admin, legal, accounting',
			items: [
				item('bank-fees', 'Bank Fees', 20.0, 240.0, 'bankFees'),
				item('postage-mail', 'Postage & Mail', 0.0, 0.0, 'postage'),
				item('cpa-audit', 'CPA Audit & Review Fees', 420.0, 5040.0, 'cpaAudit'),
				item('cpa-taxes', 'CPA Taxes Filing - Annual', 67.0, 804.0, 'cpaTax'),
				item('reserves-study', '2025 Reserves Study', 0.0, 0.0, 'reserves'),
				item('legal-fees', 'Legal Fees', 500.0, 6000.0, 'legal'),
				item('misc-expenses', 'Misc Expenses', 100.0, 1200.0, 'misc'),
				item('cpa-bookkeeping', 'CPA Accounting and Bookkeeping Fees', 0.0, 0.0, 'cpaAudit'),
				item('office-supplies', 'Office Supplies, Printing & Reproduction', 20.0, 240.0, 'office'),
				item('bad-debt', 'Bad Debt', 0.0, 0.0, 'misc'),
			],
		},
		{
			category_name: 'Regulatory',
			color: '#EC4899',
			description: 'Miami Beach permits, DBPR, Sunbiz',
			items: [
				item('dbpr-renewal', 'DBPR Corp Business LLC Renewal', 10.0, 120.0, 'dbpr'),
				item('miami-beach-boir', 'Miami Beach BOIR', 16.67, 200.0, 'boir'),
				item('miami-beach-validation', 'Miami Beach Validation Permit', 17.0, 204.0, 'validation'),
				item('licenses-permits', 'Licenses, Work Permits and Violations', 50.0, 600.0, 'licenses'),
				item('cert-of-use-fire', 'Miami Beach Certificate of Use - Fire', 8.58, 103.0, 'certFire'),
				item('elevator-certificate', 'Miami Beach Elevator Certificate Fee', 40.0, 418.0, 'elevCert'),
				item('sunbiz-renewal', 'Sunbiz Renewal Corp', 25.0, 300.0, 'sunbiz'),
			],
		},
		{
			category_name: 'Maintenance',
			color: '#EF4444',
			description: 'Ad-hoc repairs and maintenance',
			items: [
				item('tree-trimming', 'Tree Trimming', 0.0, 0.0, 'treeTrim'),
				item('gate-access-repairs', 'Gate & Access Control Repairs', 50.0, 600.0, 'gateRepair'),
				item('elevator-fixes', 'Elevator Fixes - Maveric', 0.0, 0.0, 'elevFix'),
				item('security-cameras', 'Security Cameras & Equipment', 625.0, 7500.0, 'security'),
				item('plumbing-repairs', 'Plumbing Repairs', 50.0, 600.0, 'plumbing'),
				item('electrical-repairs', 'Electrical Repairs', 40.0, 480.0, 'electrical'),
				item('roof-repairs', 'Roof Repairs', 0.0, 0.0, 'roof'),
			],
		},
	],
};

// ============================================================
// 2026 — Budget (from 2026_Budget_DEC_2025.pdf)
// Total Expenses: $176,399 | Revenue: $177,839 | $533.33/unit/month
// ============================================================
const BUDGET_2026 = {
	year: 2026,
	fiscal_year_budget: {
		name: '2026 Operating Budget',
		total_revenue: 177838.92,
		total_expenses: 176399.0,
		net_operating: 1439.92,
		unit_count: 28,
		monthly_assessment: 533.33,
		is_active: false,
		notes: `2026 Operating Budget - Adopted DEC 2025
Key changes: Assessment $513→$533.33. Legal $500→$1,000/mo. Water $2,000→$2,300/mo.
NEW: Gate & Access Control $60/mo. Elevator Fixes $1,800 allocation.
Removed: Security cameras (one-time 2025). Laundry/Other income → Reserves.`,
	},
	categories: [
		{
			category_name: 'Contract Services',
			color: '#3B82F6',
			description: 'Recurring vendor contracts',
			items: [
				item('waste-trash-removal', 'Waste/Trash Removal - Waste Co.', 500.0, 6000.0, 'waste'),
				item('laundry-lease', 'Laundry Lease - Wash Multifamily Systems', 312.0, 3744.0, 'laundry'),
				item('janitorial-services', 'Janitorial Services - Jani King', 450.0, 5400.0, 'janitorial'),
				item('management-fees-vte', 'Management Fees - VTE', 700.0, 8400.0, 'mgmtVTE'),
				item('elevator-maintenance', 'Elevator Maintenance - Maveric', 150.0, 1800.0, 'elevMaint'),
				item('elevator-phone', 'Elevator Phone Line - 1-Touch', 90.0, 1080.0, 'elevPhone'),
				item('pest-control', 'Pest Control', 150.0, 1800.0, 'pest'),
				item('elevator-inspection', 'Annual Elevator Inspection - Maveric', 37.5, 450.0, 'elevInsp'),
				item('fire-equipment', 'Fire Equipment - A Plus Fire', 62.5, 750.0, 'fire'),
			],
		},
		{
			category_name: 'Utilities',
			color: '#F59E0B',
			description: 'Monthly utility bills + gate access',
			items: [
				item('electricity-fpl', 'Electricity - FPL', 220.0, 2640.0, 'fpl'),
				item('water-sewer', 'Water & Sewer - Miami Beach Water', 2300.0, 27600.0, 'water'),
				item('gas-teco', 'Gas - Teco', 350.0, 4200.0, 'gas'),
				item('internet-breezeline', 'Internet - Breezeline', 46.0, 552.0, 'internet'),
				item('gate-access-monthly', 'Gate & Access Control Monthly Fee', 60.0, 720.0, 'gateMonthly'),
			],
		},
		{
			category_name: 'Insurance',
			color: '#8B5CF6',
			description: 'Building and flood insurance',
			items: [
				item('building-insurance', 'Building Insurance', 6500.0, 78000.0, 'buildIns'),
				item('flood-insurance', 'Flood Insurance', 916.67, 11000.0, 'floodIns'),
			],
		},
		{
			category_name: 'Administrative',
			color: '#10B981',
			description: 'General admin, legal, accounting',
			items: [
				item('bank-fees', 'Bank Fees', 20.0, 240.0, 'bankFees'),
				item('postage-mail', 'Postage & Mail', 0.0, 0.0, 'postage'),
				item('reserves-study', '2026 Reserves Study', 0.0, 0.0, 'reserves'),
				item('cpa-audit', 'CPA Audit & Review Fees', 0.0, 0.0, 'cpaAudit'),
				item('cpa-taxes', 'CPA Taxes Filing - Annual', 67.0, 804.0, 'cpaTax'),
				item('legal-fees', 'Legal Fees', 1000.0, 12000.0, 'legal'),
				item('misc-expenses', 'Misc Expenses', 100.0, 1200.0, 'misc'),
				item('cpa-bookkeeping', 'CPA Accounting and Bookkeeping Fees', 0.0, 0.0, 'cpaAudit'),
				item('office-supplies', 'Office Supplies, Printing & Reproduction', 20.0, 240.0, 'office'),
			],
		},
		{
			category_name: 'Regulatory',
			color: '#EC4899',
			description: 'Miami Beach permits, DBPR, Sunbiz',
			items: [
				item('dbpr-renewal', 'DBPR Corp Business LLC Renewal', 10.0, 120.0, 'dbpr'),
				item('miami-beach-boir', 'Miami Beach BOIR', 16.67, 200.0, 'boir'),
				item('miami-beach-validation', 'Miami Beach Validation Permit', 17.0, 204.0, 'validation'),
				item('licenses-permits', 'Licenses, Work Permits and Violations', 150.0, 1800.0, 'licenses'),
				item('cert-of-use-fire', 'Miami Beach Certificate of Use - Fire', 8.58, 103.0, 'certFire'),
				item('elevator-certificate', 'Miami Beach Elevator Certificate Fee', 40.0, 480.0, 'elevCert'),
				item('sunbiz-renewal', 'Sunbiz Renewal Corp', 6.0, 72.0, 'sunbiz'),
			],
		},
		{
			category_name: 'Maintenance',
			color: '#EF4444',
			description: 'Ad-hoc repairs',
			items: [
				item('tree-trimming', 'Tree Trimming', 0.0, 0.0, 'treeTrim'),
				item('gate-access-repairs', 'Gate & Access Control Repairs', 50.0, 600.0, 'gateRepair'),
				item('elevator-fixes', 'Elevator Fixes - Maveric', 150.0, 1800.0, 'elevFix'),
				item('plumbing-repairs', 'Plumbing Repairs', 100.0, 1200.0, 'plumbing'),
				item('electrical-repairs', 'Electrical Repairs', 50.0, 600.0, 'electrical'),
				item('roof-repairs', 'Roof Repairs', 50.0, 600.0, 'roof'),
			],
		},
	],
};

// ============================================================
// ALL BUDGETS
// ============================================================
const ALL_BUDGETS = [BUDGET_2023, BUDGET_2024, BUDGET_2025, BUDGET_2026];

// ============================================================
// MAIN
// ============================================================
async function main() {
	console.log('🏗️  Budget Setup — Lenox Plaza Association (All Years)\n');

	const args = process.argv.slice(2);
	const doClean = args.includes('--clean');
	const yearArgs = args.filter((a) => a.startsWith('--year=')).map((a) => parseInt(a.split('=')[1]));

	const budgets = yearArgs.length > 0 ? ALL_BUDGETS.filter((b) => yearArgs.includes(b.year)) : ALL_BUDGETS;

	console.log(`Years to process: ${budgets.map((b) => b.year).join(', ')}`);
	if (doClean) console.log('⚠️  --clean flag: will delete existing budget data before creating\n');

	const directusUrl = process.env.DIRECTUS_URL || (await prompt('Directus URL: '));
	const email = process.env.DIRECTUS_EMAIL || (await prompt('Admin Email: '));
	const password = process.env.DIRECTUS_PASSWORD || (await prompt('Admin Password: '));

	const client = createDirectus(directusUrl).with(authentication()).with(rest());

	try {
		await client.login({email, password});
		console.log('✅ Authenticated\n');
	} catch (e) {
		console.error('❌ Auth failed:', e?.errors?.[0]?.message || e?.message);
		process.exit(1);
	}

	// ---- DIAGNOSTIC: Test what category_id format works ----
	console.log('🔍 Diagnosing category_id field...\n');

	// Check if there are ANY existing budget items with a category_id set
	try {
		const existingWithCat = await client.request(
			readItems('budget_items', {
				filter: {category_id: {_nnull: true}},
				fields: ['id', 'item_code', 'category_id'],
				limit: 3,
			})
		);
		if (existingWithCat.length > 0) {
			console.log('   Existing budget_items with category_id:');
			for (const item of existingWithCat) {
				console.log(
					`      id=${item.id}, item_code=${item.item_code}, category_id=${JSON.stringify(item.category_id)} (type: ${typeof item.category_id})`
				);
			}
		} else {
			console.log('   No existing budget_items with category_id set.');
		}
	} catch (e) {
		console.log('   Could not query existing items:', e.message);
	}

	// Check existing budget_categories to see their ID format
	try {
		const existingCats = await client.request(
			readItems('budget_categories', {
				fields: ['id', 'category_name'],
				limit: 5,
			})
		);
		console.log('   Existing budget_categories:');
		for (const cat of existingCats) {
			console.log(`      id=${JSON.stringify(cat.id)} (type: ${typeof cat.id}), name=${cat.category_name}`);
		}
	} catch (e) {
		console.log('   Could not query categories:', e.message);
	}

	// Try to read the field info via Directus schema endpoint
	try {
		const token = client.getToken ? await client.getToken() : null;
		const authHeader = token || '';

		// Try multiple auth approaches
		for (const authVal of [authHeader, `Bearer ${authHeader}`]) {
			if (!authVal) continue;
			const resp = await fetch(`${directusUrl}/fields/budget_items/category_id`, {
				headers: {Authorization: authVal.startsWith('Bearer') ? authVal : `Bearer ${authVal}`},
			});
			if (resp.ok) {
				const fieldData = await resp.json();
				const schema = fieldData.data?.schema || {};
				console.log(`\n   📋 Field schema from API:`);
				console.log(`      data_type: ${schema.data_type}`);
				console.log(`      numeric_precision: ${schema.numeric_precision}`);
				console.log(`      is_nullable: ${schema.is_nullable}`);
				console.log(`      foreign_key_table: ${schema.foreign_key_table}`);
				break;
			}
		}
	} catch (e) {
		// silent
	}

	console.log('\n   🧪 TEST: Creating test items with increasing field complexity...');

	// Test A: minimal
	try {
		const a = await client.request(
			createItem('budget_items', {
				item_code: '_test_a',
				description: 'test minimal',
				monthly_budget: 0,
				yearly_budget: 0,
				status: 'draft',
			})
		);
		console.log(`   ✅ A (minimal): OK (ID: ${a.id})`);
		await client.request(deleteItems('budget_items', [a.id]));
	} catch (e) {
		console.log(`   ❌ A (minimal): ${e?.errors?.[0]?.message}`);
	}

	// Test B: with fiscal_year
	try {
		const b = await client.request(
			createItem('budget_items', {
				item_code: '_test_b',
				description: 'test + fiscal_year',
				monthly_budget: 0,
				yearly_budget: 0,
				status: 'draft',
				fiscal_year: 3,
			})
		);
		console.log(`   ✅ B (+fiscal_year): OK (ID: ${b.id})`);
		await client.request(deleteItems('budget_items', [b.id]));
	} catch (e) {
		console.log(`   ❌ B (+fiscal_year): ${e?.errors?.[0]?.message}`);
	}

	// Test C: with fiscal_year_budget_id (UUID)
	const anyFYB = await client.request(readItems('fiscal_year_budgets', {limit: 1, fields: ['id']}));
	const testFybId = anyFYB.length > 0 ? anyFYB[0].id : null;
	if (testFybId) {
		try {
			const c = await client.request(
				createItem('budget_items', {
					item_code: '_test_c',
					description: 'test + fyb_id',
					monthly_budget: 0,
					yearly_budget: 0,
					status: 'draft',
					fiscal_year: 3,
					fiscal_year_budget_id: testFybId,
				})
			);
			console.log(`   ✅ C (+fiscal_year_budget_id): OK (ID: ${c.id})`);
			await client.request(deleteItems('budget_items', [c.id]));
		} catch (e) {
			console.log(`   ❌ C (+fiscal_year_budget_id): ${e?.errors?.[0]?.message}`);
		}
	}

	// Test D: with vendor_patterns array
	try {
		const d = await client.request(
			createItem('budget_items', {
				item_code: '_test_d',
				description: 'test + vendor_patterns',
				monthly_budget: 0,
				yearly_budget: 0,
				status: 'draft',
				vendor_patterns: ['Test1', 'Test2'],
			})
		);
		console.log(`   ✅ D (+vendor_patterns): OK (ID: ${d.id})`);
		await client.request(deleteItems('budget_items', [d.id]));
	} catch (e) {
		console.log(`   ❌ D (+vendor_patterns): ${e?.errors?.[0]?.message}`);
	}

	// Test E: with keywords array
	try {
		const e2 = await client.request(
			createItem('budget_items', {
				item_code: '_test_e',
				description: 'test + keywords',
				monthly_budget: 0,
				yearly_budget: 0,
				status: 'draft',
				keywords: ['test', 'keyword'],
			})
		);
		console.log(`   ✅ E (+keywords): OK (ID: ${e2.id})`);
		await client.request(deleteItems('budget_items', [e2.id]));
	} catch (e) {
		console.log(`   ❌ E (+keywords): ${e?.errors?.[0]?.message}`);
	}

	// Test F: with real amounts
	try {
		const f = await client.request(
			createItem('budget_items', {
				item_code: '_test_f',
				description: 'test + real amounts',
				monthly_budget: 9700,
				yearly_budget: 116400,
				status: 'draft',
			})
		);
		console.log(`   ✅ F (+real amounts 9700/116400): OK (ID: ${f.id})`);
		await client.request(deleteItems('budget_items', [f.id]));
	} catch (e) {
		console.log(`   ❌ F (+real amounts): ${e?.errors?.[0]?.message}`);
	}

	// Test G: everything except category_id
	try {
		const g = await client.request(
			createItem('budget_items', {
				item_code: '_test_g',
				description: 'test full minus cat',
				monthly_budget: 9700,
				yearly_budget: 116400,
				status: 'draft',
				fiscal_year: 3,
				fiscal_year_budget_id: testFybId,
				vendor_patterns: ['Citizens', 'CITIZENS'],
				keywords: ['insurance', 'premium'],
			})
		);
		console.log(`   ✅ G (full minus category_id): OK (ID: ${g.id})`);
		await client.request(deleteItems('budget_items', [g.id]));
	} catch (e) {
		console.log(`   ❌ G (full minus category_id): ${e?.errors?.[0]?.message}`);
	}

	console.log('');

	// ---- GLOBAL CLEAN: Delete ALL budget data to reset auto-increment IDs ----
	if (doClean) {
		console.log('🧹 GLOBAL CLEAN: Removing ALL budget data to reset IDs...\n');

		// Delete all budget items first (they reference categories)
		const allItems = await client.request(readItems('budget_items', {fields: ['id'], limit: -1}));
		if (allItems.length) {
			await client.request(
				deleteItems(
					'budget_items',
					allItems.map((i) => i.id)
				)
			);
			console.log(`   🗑️  Deleted ${allItems.length} budget items`);
		}

		// Delete all budget categories
		const allCats = await client.request(readItems('budget_categories', {fields: ['id'], limit: -1}));
		if (allCats.length) {
			await client.request(
				deleteItems(
					'budget_categories',
					allCats.map((c) => c.id)
				)
			);
			console.log(`   🗑️  Deleted ${allCats.length} budget categories`);
		}

		// Delete all fiscal year budgets
		const allFYB = await client.request(readItems('fiscal_year_budgets', {fields: ['id'], limit: -1}));
		if (allFYB.length) {
			await client.request(
				deleteItems(
					'fiscal_year_budgets',
					allFYB.map((b) => b.id)
				)
			);
			console.log(`   🗑️  Deleted ${allFYB.length} fiscal year budgets`);
		}

		console.log('   ✅ All budget data cleaned.\n');
		await delay(500);
	}

	const summary = [];

	for (const budget of budgets) {
		console.log(`\n${'═'.repeat(60)}`);
		console.log(`📊 ${budget.year} — ${budget.fiscal_year_budget.name}`);
		console.log(`${'═'.repeat(60)}`);

		// 1. Ensure fiscal_years record
		let fyList = await client.request(
			readItems('fiscal_years', {
				filter: {year: {_eq: budget.year}},
				limit: 1,
			})
		);
		let fyId;
		if (fyList.length > 0) {
			fyId = fyList[0].id;
			console.log(`\n   fiscal_years: exists (ID: ${fyId})`);
		} else {
			const fy = await client.request(
				createItem('fiscal_years', {
					year: budget.year,
					start_date: `${budget.year}-01-01`,
					end_date: `${budget.year}-12-31`,
					status: 'published',
				})
			);
			fyId = fy.id;
			console.log(`\n   fiscal_years: ✅ created (ID: ${fyId})`);
		}

		// (Cleaning is handled globally above)

		// 3. fiscal_year_budgets record
		const existFYB = await client.request(
			readItems('fiscal_year_budgets', {filter: {fiscal_year: {_eq: fyId}}, limit: 1})
		);
		let fybId;
		if (existFYB.length > 0) {
			fybId = existFYB[0].id;
			await client.request(
				updateItem('fiscal_year_budgets', fybId, {...budget.fiscal_year_budget, fiscal_year: fyId, status: 'published'})
			);
			console.log(`   fiscal_year_budgets: updated (ID: ${fybId})`);
		} else {
			const fyb = await client.request(
				createItem('fiscal_year_budgets', {...budget.fiscal_year_budget, fiscal_year: fyId, status: 'published'})
			);
			fybId = fyb.id;
			console.log(`   fiscal_year_budgets: ✅ created (ID: ${fybId})`);
		}

		// 4. Categories + Items
		let catCount = 0,
			itemCount = 0;

		for (const cat of budget.categories) {
			const catMonthly = cat.items.reduce((s, i) => s + i.monthly_budget, 0);
			const catYearly = cat.items.reduce((s, i) => s + i.yearly_budget, 0);

			const existCat = await client.request(
				readItems('budget_categories', {
					filter: {fiscal_year: {_eq: fyId}, category_name: {_eq: cat.category_name}},
					limit: 1,
				})
			);

			let catId;
			if (existCat.length > 0) {
				catId = existCat[0].id;
				await client.request(
					updateItem('budget_categories', catId, {
						monthly_budget: catMonthly,
						yearly_budget: catYearly,
						color: cat.color,
						description: cat.description,
						fiscal_year_budget_id: fybId,
					})
				);
			} else {
				const nc = await client.request(
					createItem('budget_categories', {
						fiscal_year: fyId,
						fiscal_year_budget_id: fybId,
						category_name: cat.category_name,
						monthly_budget: catMonthly,
						yearly_budget: catYearly,
						color: cat.color,
						description: cat.description,
						status: 'published',
					})
				);
				catId = nc.id;
				catCount++;

				// Verify the category actually exists and is readable
				await delay(500);
				const verify = await client.request(
					readItems('budget_categories', {
						filter: {id: {_eq: catId}},
						fields: ['id', 'category_name'],
						limit: 1,
					})
				);
				if (verify.length === 0) {
					console.error(`   ❌ Category ${catId} created but NOT found on read-back!`);
				} else {
					console.log(`      ✓ Verified category ${catId} exists in DB`);
				}
			}
			console.log(`   📁 ${cat.category_name}: $${catYearly.toLocaleString()}/yr (${cat.items.length} items)`);
			console.log(`      🔍 DEBUG: catId = ${catId} (type: ${typeof catId})`);

			for (const itm of cat.items) {
				const existItm = await client.request(
					readItems('budget_items', {
						filter: {fiscal_year: {_eq: fyId}, item_code: {_eq: itm.item_code}},
						limit: 1,
					})
				);

				// Build payload WITHOUT category_id first, then set it after creation
				const basePayload = {
					fiscal_year: fyId,
					fiscal_year_budget_id: fybId,
					item_code: itm.item_code,
					description: itm.description,
					monthly_budget: itm.monthly_budget,
					yearly_budget: itm.yearly_budget,
					vendor_patterns: itm.vendor_patterns,
					keywords: itm.keywords,
					status: 'published',
				};

				if (existItm.length > 0) {
					try {
						await client.request(
							updateItem('budget_items', existItm[0].id, {
								description: itm.description,
								monthly_budget: itm.monthly_budget,
								yearly_budget: itm.yearly_budget,
								vendor_patterns: itm.vendor_patterns,
								keywords: itm.keywords,
								category_id: catId,
								fiscal_year_budget_id: fybId,
							})
						);
					} catch (updateErr) {
						console.log(`      ⚠️  SDK update failed for ${itm.item_code}, trying raw PATCH...`);
						const token = await client.getToken();
						const patchResp = await fetch(`${directusUrl}/items/budget_items/${existItm[0].id}`, {
							method: 'PATCH',
							headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
							body: JSON.stringify({category_id: catId}),
						});
						if (!patchResp.ok) {
							const errText = await patchResp.text();
							console.error(`      ❌ Raw PATCH also failed: ${errText}`);
						}
					}
				} else {
					try {
						// Try with category_id included
						await client.request(createItem('budget_items', {...basePayload, category_id: catId}));
						itemCount++;
					} catch (err) {
						// If category_id fails, create without it, then PATCH category_id via raw API
						console.log(`      ⚠️  Direct create failed for ${itm.item_code}, trying two-step with raw PATCH...`);
						try {
							const created = await client.request(createItem('budget_items', basePayload));
							await delay(300);
							const token = await client.getToken();
							const patchResp = await fetch(`${directusUrl}/items/budget_items/${created.id}`, {
								method: 'PATCH',
								headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
								body: JSON.stringify({category_id: catId}),
							});
							if (patchResp.ok) {
								itemCount++;
								console.log(`      ✅ Two-step worked for ${itm.item_code} (ID: ${created.id})`);
							} else {
								const errText = await patchResp.text();
								console.error(`      ❌ Raw PATCH failed for ${itm.item_code}: ${errText}`);
								// Item was created without category — still count it but warn
								itemCount++;
								console.log(`      ⚠️  Item created WITHOUT category_id — needs manual fix`);
							}
						} catch (err2) {
							console.error(
								`      ❌ FAILED creating ${itm.item_code}: ${err2?.errors?.[0]?.message || err2?.message}`
							);
							throw err2;
						}
					}
				}
			}
		}

		const totalItems = budget.categories.reduce((s, c) => s + c.items.length, 0);
		summary.push({
			year: budget.year,
			expenses: budget.fiscal_year_budget.total_expenses,
			revenue: budget.fiscal_year_budget.total_revenue,
			assessment: budget.fiscal_year_budget.monthly_assessment,
			categories: budget.categories.length,
			items: totalItems,
			newCats: catCount,
			newItems: itemCount,
		});
	}

	// Print summary table
	console.log(`\n\n${'═'.repeat(75)}`);
	console.log('📊 BUDGET SETUP SUMMARY');
	console.log(`${'═'.repeat(75)}`);
	console.log('Year  | Expenses      | Revenue       | $/Unit/Mo | Cats | Items | New');
	console.log('------|---------------|---------------|-----------|------|-------|------');
	for (const s of summary) {
		console.log(
			`${s.year}  | $${s.expenses.toLocaleString().padStart(11)} | $${s.revenue.toLocaleString().padStart(11)} | $${s.assessment.toFixed(2).padStart(7)} | ${String(s.categories).padStart(4)} | ${String(s.items).padStart(5)} | ${s.newCats}c/${s.newItems}i`
		);
	}
	console.log(`${'═'.repeat(75)}`);

	console.log(`
✅ All done! Next steps:
  1. Budget Management page → verify each year's data
  2. Import bank statements for each year/account
  3. Run Auto-Categorize (uses vendor_patterns + keywords)
  4. Dashboard → Budget vs Actual in real time
  `);
}

main().catch(console.error);
