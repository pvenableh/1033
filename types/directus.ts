export interface Account {
	/** @primaryKey */
	id: number;
	user_created?: string | null;
	user_updated?: string | null;
	date_created?: string | null;
	date_updated?: string | null;
	status?: 'published' | 'draft' | 'archived' | null;
	sort?: number | null;
	/** @description Chase account number (5129, 7011, 5872) @required */
	account_number: string;
	/** @required */
	account_name: string;
	/** @required */
	account_type: 'operating' | 'reserve' | 'special';
	color?: string | null;
	description?: string | null;
}

export interface Activity {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	type?: 'access' | 'video' | 'website' | 'email' | null;
	name?: string | null;
	person?: People | string | null;
	subject?: string | null;
	access_point_name?: string | null;
	access_status?: string | null;
	access_type?: string | null;
	pass_name?: string | null;
	timestamp?: string | null;
	raw_data?: Record<string, any> | null;
	image?: DirectusFile | string | null;
	vendor_id?: string | null;
	vendor?: string | null;
	photo_path?: string | null;
}

export interface Announcement {
	/** @primaryKey */
	id: number;
	status?: 'sent' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	title?: string | null;
	url?: string | null;
	tags?: string[] | null;
	content?: string | null;
	subtitle?: string | null;
	urgent?: boolean | null;
	date_sent?: string | null;
	sections?: 'json' | null;
	greeting?: string | null;
	closing?: string | null;
	template?: 'Generic' | 'Parking' | null;
	private?: 'Private' | null;
	sendgrid_template_id?: string | null;
	attachments?: AnnouncementsFile[] | string[];
	recipients?: AnnouncementsPeople[] | string[];
	activity?: EmailActivity[] | string[];
	bounces?: AnnouncementsEmailActivity[] | string[];
}

export interface AnnouncementsEmailActivity {
	/** @primaryKey */
	id: number;
	announcements_id?: Announcement | string | null;
	email_activity_id?: EmailActivity | string | null;
}

export interface AnnouncementsFile {
	/** @primaryKey */
	id: number;
	announcements_id?: Announcement | string | null;
	directus_files_id?: DirectusFile | string | null;
}

export interface AnnouncementsPeople {
	/** @primaryKey */
	id: number;
	announcements_id?: Announcement | string | null;
	people_id?: People | string | null;
	sort?: number | null;
}

export interface AssessmentLedger {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	unit_id?: Unit | string | null;
	month?: '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | null;
	amount_due?: number | null;
	amount_paid?: number | null;
	payment_date?: string | null;
	due_date?: string | null;
	late_fee?: number | null;
	payment_status?: 'current' | 'late' | 'deliquent' | 'lien' | 'collections' | null;
	days_past_due?: number | null;
	transaction_id?: Transaction | string | null;
	notes?: string | null;
	fiscal_year?: FiscalYear | string | null;
}

export interface Assessment {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	title?: string | null;
	description?: string | null;
	documents?: AssessmentsFile[] | string[];
}

export interface AssessmentsFile {
	/** @primaryKey */
	id: number;
	assessments_id?: Assessment | string | null;
	directus_files_id?: DirectusFile | string | null;
}

export interface AuditLog {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	/** @description e.g., transactions, budget_items */
	collection?: string | null;
	item_id?: number | null;
	action?: 'create' | 'update' | 'delete' | 'approve' | 'reconcile' | null;
	user_id?: DirectusUser | string | null;
	old_values?: Array<{ value: string }> | null;
	new_values?: Array<{ value: string }> | null;
	ip_address?: string | null;
	user_agent?: string | null;
	notes?: string | null;
}

export interface BoardMember {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	person?: People | string | null;
	title?: 'President' | `Vice President` | 'Secretary' | 'Treasurer' | `Board Member` | null;
	start?: string | null;
	finish?: string | null;
	bio?: string | null;
	experience?: string | null;
	image?: DirectusFile | string | null;
	year?: '2024' | '2023' | '2022' | '2021' | null;
	icon?: string | null;
}

export interface BudgetAdmendment {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	/** @required */
	fiscal_year_budget_id: FiscalYearBudget | string;
	/** @required */
	budget_item_id: BudgetItem | string;
	/** @required */
	effective_date: string;
	/** @required */
	original_annual_amount: number;
	/** @required */
	amended_annual_amount: number;
	original_monthly_amount?: number | null;
	amended_monthly_amount?: number | null;
	reason?: string | null;
	amendment_type?: 'rate_change' | 'new_expense' | 'removed_expense' | 'reallocation' | 'emergency' | 'correction' | null;
	supporting_document?: DirectusFile | string | null;
	is_approved?: boolean | null;
	approved_by?: DirectusUser | string | null;
	approved_date?: string | null;
	board_meeting_reference?: string | null;
}

export interface BudgetCategory {
	/** @primaryKey */
	id: number;
	user_created?: string | null;
	user_updated?: string | null;
	date_created?: string | null;
	date_updated?: string | null;
	status?: 'published' | 'draft' | 'archived' | null;
	sort?: number | null;
	/** @description Insurance, Professional, Utilities, Maintenance, etc. @required */
	category_name: string;
	monthly_budget?: number | null;
	yearly_budget?: number | null;
	/** @description Color for charts and reports */
	color?: string | null;
	description?: string | null;
	fiscal_year_budget_id?: FiscalYearBudget | string | null;
	/** @required */
	fiscal_year: FiscalYear | string;
}

export interface BudgetItem {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	/** @description Unique identifier (e.g., waste-removal, janitorial) @required */
	item_code: string;
	/** @description Full description of the budget item @required */
	description: string;
	/** @description Vendor name patterns for auto-matching transactions */
	vendor_patterns?: string[] | null;
	/** @description Monthly budgeted amount @required */
	monthly_budget: number;
	/** @description Annual budgeted amount @required */
	yearly_budget: number;
	category_id?: BudgetCategory | string | null;
	/** @description Links to vendors collection */
	vendor_id?: number | null;
	keywords?: string[] | null;
	fiscal_year_budget_id?: FiscalYearBudget | string | null;
	/** @required */
	fiscal_year: FiscalYear | string;
}

export interface ByLaws {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	document?: string | null;
	test?: 'json' | null;
	file?: DirectusFile | string | null;
}

export interface CashFlowProjection {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	account_id?: Account | string | null;
	projected_beginning_balance?: number | null;
	projected_income?: number | null;
	projected_expenses?: number | null;
	projected_ending_balance?: number | null;
	actual_beginning_balance?: number | null;
	actual_income?: number | null;
	actual_expenses?: number | null;
	actual_ending_balance?: number | null;
	variance?: number | null;
	notes?: string | null;
	month?: '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | null;
	fiscal_year?: FiscalYear | string | null;
}

export interface ChannelMember {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	channel_id?: Channel | string | null;
	user_id?: DirectusUser | string | null;
	invited_by?: DirectusUser | string | null;
	role?: 'member' | 'moderator' | null;
	notifications_enabled?: boolean | null;
	last_read_at?: string | null;
}

export interface ChannelMessageFile {
	/** @primaryKey */
	id: number;
	sort?: number | null;
	message_id?: ChannelMessage | string | null;
	directus_files_id?: DirectusFile | string | null;
}

export interface ChannelMessageMention {
	/** @primaryKey */
	id: number;
	date_created?: string | null;
	message_id?: ChannelMessage | string | null;
	user_id?: DirectusUser | string | null;
	notified?: boolean | null;
}

export interface ChannelMessage {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	channel_id?: Channel | string | null;
	content?: string | null;
	is_edited?: boolean | null;
	parent_id?: ChannelMessage | string | null;
	mentions?: ChannelMessageMention[] | string[];
	files?: ChannelMessageFile[] | string[];
}

export interface Channel {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	name?: string | null;
	description?: string | null;
	icon?: string | null;
	is_private?: boolean | null;
	members?: ChannelMember[] | string[];
}

export interface CommentFile {
	/** @primaryKey */
	id: number;
	sort?: number | null;
	date_created?: string | null;
	comment_id?: Comment | string | null;
	directus_files_id?: DirectusFile | string | null;
}

export interface CommentMention {
	/** @primaryKey */
	id: number;
	date_created?: string | null;
	user_id?: DirectusUser | string | null;
	comment_id?: Comment | string | null;
	notified?: boolean | null;
}

export interface Comment {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	content?: string | null;
	target_collection?: string | null;
	target_id?: string | null;
	parent_id?: Comment | string | null;
	is_edited?: boolean | null;
	is_resolved?: boolean | null;
	mentions?: CommentMention[] | string[];
	files?: CommentFile[] | string[];
}

export interface ComplianceAlert {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	alert_type?: 'fund_mixing' | 'reserve_withdrawal' | 'budget_overage' | 'delinquency' | 'compliance' | 'approval_required' | null;
	severity?: 'info' | 'warning' | 'critical' | null;
	title?: string | null;
	description?: string | null;
	transaction_id?: Transaction | string | null;
	account_id?: Account | string | null;
	amount?: number | null;
	is_acknowledged?: boolean | null;
	acknowledged_by?: DirectusUser | string | null;
	acknowledged_date?: string | null;
	is_resolved?: boolean | null;
	resolved_by?: DirectusUser | string | null;
	resolved_date?: string | null;
	resolution_notes?: string | null;
	requires_board_action?: boolean | null;
	board_resolution?: string | null;
}

export interface Corporation {
	/** @primaryKey */
	id: number;
	files?: CorporationFile[] | string[];
}

export interface CorporationFile {
	/** @primaryKey */
	id: number;
	corporation_id?: Corporation | string | null;
	directus_files_id?: DirectusFile | string | null;
	sort?: number | null;
}

export interface EmailActivity {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	person?: People | string | null;
	announcement?: Announcement | string | null;
	event?: string | null;
	sg_message_id?: string | null;
	email?: string | null;
	clicked_url?: string | null;
}

export interface Features {
	/** @primaryKey */
	id: string;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	featured_images?: FeaturesFile[] | string[];
}

export interface FeaturesFile {
	/** @primaryKey */
	id: number;
	features_id?: Feature | string | null;
	directus_files_id?: DirectusFile | string | null;
	sort?: number | null;
	sort_new?: number | null;
}

export interface FiscalYearBudget {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	name?: string | null;
	is_active?: boolean | null;
	total_revenue?: number | null;
	total_expenses?: number | null;
	net_operating?: number | null;
	unit_count?: number | null;
	monthly_assessment?: number | null;
	approved_date?: string | null;
	approved_by?: DirectusUser | string | null;
	/** @required */
	fiscal_year: FiscalYear | string;
	categories?: BudgetCategory[] | string[];
	items?: BudgetItem[] | string[];
	amendments?: BudgetAdmendment[] | string[];
}

export interface FiscalYear {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	year?: number | null;
	start_date?: string | null;
	end_date?: string | null;
}

export interface JunctionDirectusUsersUnit {
	/** @primaryKey */
	id: number;
	directus_users_id?: DirectusUser | string | null;
	units_id?: Unit | string | null;
	sort?: number | null;
}

export interface Lease {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived' | 'expired';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	file?: DirectusFile | string | null;
	/** @required */
	start: string;
	/** @required */
	finish: string;
	person?: People | string | null;
}

export interface Meeting {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	/** @required */
	date: string;
	time?: string | null;
	description?: string | null;
	title?: string | null;
	agenda?: string | null;
	minutes?: string | null;
	video_link?: string | null;
	url?: string | null;
	category?: `Board Meeting` | null;
	location?: `Community Room` | 'Zoom' | null;
	files?: MeetingsFile[] | string[];
	presentations?: MeetingsPresentation[] | string[];
	people?: MeetingsPeople[] | string[];
}

export interface MeetingsFile {
	/** @primaryKey */
	id: number;
	meetings_id?: Meeting | string | null;
	directus_files_id?: DirectusFile | string | null;
	sort?: number | null;
}

export interface MeetingsPeople {
	/** @primaryKey */
	id: number;
	meetings_id?: Meeting | string | null;
	people_id?: People | string | null;
	sort?: number | null;
}

export interface MeetingsPresentation {
	/** @primaryKey */
	id: number;
	meetings_id?: Meeting | string | null;
	presentations_id?: Presentation | string | null;
}

export interface MonthlyReconciliationReport {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	/** @required */
	account_id: Account | string;
	report_month?: '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | null;
	statement_beginning_balance?: number | null;
	statement_ending_balance?: number | null;
	calculated_beginning_balance?: number | null;
	calculated_ending_balance?: number | null;
	reconciliation_difference?: number | null;
	reconciliation_status?: 'pending' | 'in_progress' | 'reconciled' | 'discrepency' | null;
	total_deposits?: number | null;
	total_withdrawals?: number | null;
	total_transfer_in?: number | null;
	total_transfers_out?: number | null;
	total_fees?: number | null;
	transactions_reconciled?: number | null;
	transactions_pending?: number | null;
	transactions_disputed?: number | null;
	completed_date?: string | null;
	completed_by?: DirectusUser | string | null;
	notes?: string | null;
	pdf_report?: DirectusFile | string | null;
	/** @required */
	fiscal_year: FiscalYear | string;
}

export interface MonthlyStatement {
	/** @primaryKey */
	id: number;
	user_created?: string | null;
	user_updated?: string | null;
	date_created?: string | null;
	date_updated?: string | null;
	status?: 'published' | 'draft' | 'archived' | null;
	sort?: number | null;
	/** @required */
	account_id: Account | string;
	/** @required */
	statement_month: '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12';
	beginning_balance?: number | null;
	ending_balance?: number | null;
	/** @description Upload the PDF statement from Chase */
	pdf_statement?: string | null;
	reconciled?: boolean | null;
	reconciled_by?: string | null;
	reconciled_date?: string | null;
	/** @required */
	fiscal_year: FiscalYear | string;
}

export interface Newsletter {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	title?: string | null;
	url?: string | null;
	code?: string | null;
	link?: string | null;
}

export interface Notice {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	title?: string | null;
	content?: string | null;
	published_at?: string | null;
	expires_at?: string | null;
	pinned?: boolean | null;
	type?: 'announcement' | 'update' | 'alert' | 'maintenance' | null;
	visibility?: 'public' | 'residents' | 'board' | 'staff' | null;
}

export interface People {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	category?: 'Owner' | 'Tenant' | 'Vendor' | `Property Manager` | null;
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
	phone?: string | null;
	url?: string | null;
	image?: DirectusFile | string | null;
	mailing_address?: string | null;
	show_in_directory?: boolean | null;
	directory_display?: string | null;
	is_resident?: boolean | null;
	is_owner?: boolean | null;
	user?: DirectusUser | string | null;
	unit?: UnitsPeople[] | string[];
	leases?: Lease[] | string[];
	board_member?: BoardMember[] | string[];
	permissions?: UserPermission[] | string[];
}

export interface PeopleUnit {
	/** @primaryKey */
	id: number;
	people_id?: People | string | null;
	units_id?: Unit | string | null;
}

export interface Pet {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	category?: 'Dog' | 'Cat' | null;
	name?: string | null;
	image?: DirectusFile | string | null;
	breed?: string | null;
	weight?: string | null;
	unit_id?: Unit | string | null;
	records?: PetsFile[] | string[];
}

export interface PetsFile {
	/** @primaryKey */
	id: number;
	pets_id?: Pet | string | null;
	directus_files_id?: DirectusFile | string | null;
}

export interface Presentation {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	title?: string | null;
	url?: string | null;
	description?: string | null;
	slides?: PresentationsFile[] | string[];
}

export interface PresentationsFile {
	/** @primaryKey */
	id: number;
	presentations_id?: Presentation | string | null;
	directus_files_id?: DirectusFile | string | null;
}

export interface ProjectCategory {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	name?: string | null;
	color?: string | null;
	/** @description e.g., i-heroicons-folder */
	icon?: string | null;
}

export interface ProjectEventCategory {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	name?: string | null;
	color?: string | null;
	text_color?: string | null;
	icon?: string | null;
}

export interface ProjectEventFile {
	/** @primaryKey */
	id: number;
	sort?: number | null;
	project_event_id?: ProjectEvent | string | null;
	directus_files_id?: DirectusFile | string | null;
}

export interface ProjectEvent {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	/** @required */
	project_id: Project | string;
	/** @required */
	title: string;
	description?: string | null;
	/** @required */
	event_date: string;
	category_id?: ProjectCategory | string | null;
	is_milestone?: boolean | null;
	tasks?: ProjectTask[] | string[];
	files?: ProjectEventFile[] | string[];
	spawned_projects?: Project[] | string[];
}

export interface Project {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived' | 'active' | 'paused' | 'completed';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	/** @required */
	name: string;
	description?: string | null;
	color?: string | null;
	icon?: string | null;
	/** @required */
	start_date: string;
	target_end_date?: string | null;
	actual_end_date?: string | null;
	category_id?: ProjectCategory | string | null;
	parent_id?: Project | string | null;
	parent_event_id?: ProjectEvent | string | null;
	member_visible?: boolean | null;
	events?: ProjectEvent[] | string[];
	children?: Project[] | string[];
}

export interface ProjectTask {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	/** @required */
	event_id: ProjectEvent | string;
	title?: string | null;
	description?: string | null;
	assignee_id?: DirectusUser | string | null;
	completed?: boolean | null;
	completed_at?: string | null;
	completed_by?: DirectusUser | string | null;
	due_date?: string | null;
	priority?: 'low' | 'medium' | 'high' | null;
	watchers?: ProjectTaskWatcher[] | string[];
}

export interface ProjectTaskWatcher {
	/** @primaryKey */
	id: number;
	sort?: number | null;
	date_created?: string | null;
	task_id?: ProjectTask | string | null;
	user_id?: DirectusUser | string | null;
}

export interface Reaction {
	/** @primaryKey */
	id: number;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	/** @description The ID of the item being reacted to @required */
	item_id: string;
	/** @description The type of content this reaction is for @required */
	collection: 'channel_messages' | 'commments';
	reaction_type?: ReactionType | string | null;
}

export interface ReactionType {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	name?: string | null;
	emoji?: string | null;
	icon?: string | null;
	icon_family?: 'emoji' | 'heroicons' | 'lucide' | null;
}

export interface ReconciliationNote {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	transaction_id?: Transaction | string | null;
	note?: string | null;
	note_type?: 'general' | 'reconciliation' | 'discrepency' | 'approval' | 'inquiry' | null;
	is_resolved?: boolean | null;
	resolved_date?: string | null;
	resolved_by?: DirectusUser | string | null;
}

export interface Rendering {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	title?: string | null;
	building_color?: string | null;
	gate_color?: string | null;
	image?: DirectusFile | string | null;
	cost?: string | null;
	extra_cost?: string | null;
	description?: string | null;
	railings_color?: string | null;
}

export interface Request {
	/** @primaryKey */
	id: string;
	status?: 'new' | `in progress` | 'completed' | 'cancelled';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	category?: 'maintenance' | 'violation' | 'suggestion' | 'question' | 'inquiry' | 'volunteer' | null;
	priority?: 'emergency' | 'high' | 'medium' | 'low' | null;
	subject?: string | null;
	description?: string | null;
	allow_access?: boolean | null;
	contact_preference?: 'phone' | 'email' | `Text Message` | null;
	name?: string | null;
	email?: string | null;
	unit?: Unit | string | null;
	phone?: string | null;
}

export interface ReserveComponent {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	reserve_study_id?: ReserveStudy | string | null;
	/** @description e.g., "Roof", "Elevator" */
	name?: string | null;
	category?: 'building' | 'mechanical' | 'electrical' | 'plumbing' | 'exterior' | 'common_area' | 'safety' | 'other' | null;
	useful_life_years?: number | null;
	remaining_life_years?: number | null;
	placed_in_service_year?: number | null;
	replacement_year?: number | null;
	replacement_cost?: number | null;
	condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | null;
	last_inspection_date?: string | null;
	notes?: string | null;
}

export interface Reserf {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	amount?: number | null;
	date?: string | null;
}

export interface ReserveStudy {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	study_date?: string | null;
	current_balance?: number | null;
	recommended_balance?: number | null;
	percent_funded?: number | null;
	annual_contribution?: number | null;
	monthly_contribution_per_unit?: number | null;
	study_document?: DirectusFile | string | null;
	notes?: string | null;
	fiscal_year?: FiscalYear | string | null;
	components?: ReserveComponent[] | string[];
}

export interface Rule {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	title?: string | null;
	description?: string | null;
	bylaw?: string | null;
	url?: string | null;
}

export interface Task {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	title?: string | null;
	description?: string | null;
	task_status?: 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | null;
	priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
	due_date?: string | null;
	completed_at?: string | null;
	category?: 'maintenance' | 'follow_up' | 'inspection' | 'communication' | 'financial' | 'administrative' | 'other' | null;
	related_collection?: string | null;
	related_id?: string | null;
	notes?: string | null;
	ai_generated?: boolean | null;
	completed_by?: DirectusUser | string | null;
	assigned_to?: DirectusUser | string | null;
}

export interface Transaction {
	/** @primaryKey */
	id: number;
	user_created?: string | null;
	user_updated?: string | null;
	date_created?: string | null;
	date_updated?: string | null;
	status?: 'published' | 'draft' | 'archived' | null;
	sort?: number | null;
	/** @required */
	account_id: Account | string;
	/** @required */
	transaction_date: string;
	/** @description Original description from bank statement @required */
	description: string;
	/** @description Extracted or manually entered vendor name */
	vendor?: string | null;
	/** @required */
	amount: number;
	/** @required */
	transaction_type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'fee' | 'interest';
	/** @description Budget category - can be corrected by board members */
	category_id?: BudgetCategory | string | null;
	/** @description Marks fund segregation violations */
	is_violation?: boolean | null;
	violation_type?: 'fund_mixing' | 'unauthorized_transfer' | 'budget_overage' | 'missing_docs' | null;
	/** @description Notes from board members about this transaction */
	board_notes?: string | null;
	/** @description Was this automatically categorized vs manually reviewed? */
	auto_categorized?: boolean | null;
	statement_month?: '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | null;
	vendor_id?: Vendor | string | null;
	import_batch_id?: string | null;
	csv_source_line?: number | null;
	original_csv_data?: Record<string, any> | null;
	violation_severity?: string | null;
	budget_item_id?: BudgetItem | string | null;
	/** @description Links to the matching transfer transaction (e.g., transfer_out links to its transfer_in counterpart) */
	linked_transfer_id?: Transaction | string | null;
	reconciliation_status?: 'pending' | 'reconciled' | 'disputed' | null;
	reconciled_date?: string | null;
	reconciled_by?: DirectusUser | string | null;
	/** @required */
	fiscal_year: FiscalYear | string;
	reconciliation_notes?: ReconciliationNote[] | string[];
}

export interface Unit {
	/** @primaryKey @required */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	number?: string | null;
	occupant?: 'Owner' | 'Tenant' | null;
	parking_spot?: string | null;
	people?: UnitsPeople[] | string[];
	vehicles?: Vehicle[] | string[];
	pets?: Pet[] | string[];
}

export interface UnitsPeople {
	/** @primaryKey */
	id: number;
	units_id?: Unit | string | null;
	people_id?: People | string | null;
	sort?: number | null;
}

export interface UserPermission {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived' | null;
	user_created?: string | null;
	date_created?: string | null;
	user_updated?: string | null;
	date_updated?: string | null;
	/** @description Allow create on projects */
	projects_create?: boolean | null;
	/** @description Allow read on projects */
	projects_read?: boolean | null;
	/** @description Allow update on projects */
	projects_update?: boolean | null;
	/** @description Allow delete on projects */
	projects_delete?: boolean | null;
	/** @description Allow create on channels */
	channels_create?: boolean | null;
	/** @description Allow read on channels */
	channels_read?: boolean | null;
	/** @description Allow update on channels */
	channels_update?: boolean | null;
	/** @description Allow delete on channels */
	channels_delete?: boolean | null;
	/** @description Allow create on financials */
	financials_create?: boolean | null;
	/** @description Allow read on financials */
	financials_read?: boolean | null;
	/** @description Allow update on financials */
	financials_update?: boolean | null;
	/** @description Allow delete on financials */
	financials_delete?: boolean | null;
	/** @description Allow create on announcements */
	announcements_create?: boolean | null;
	/** @description Allow read on announcements */
	announcements_read?: boolean | null;
	/** @description Allow update on announcements */
	announcements_update?: boolean | null;
	/** @description Allow delete on announcements */
	announcements_delete?: boolean | null;
	/** @description Allow create on meetings */
	meetings_create?: boolean | null;
	/** @description Allow read on meetings */
	meetings_read?: boolean | null;
	/** @description Allow update on meetings */
	meetings_update?: boolean | null;
	/** @description Allow delete on meetings */
	meetings_delete?: boolean | null;
	/** @description Allow create on documents */
	documents_create?: boolean | null;
	/** @description Allow read on documents */
	documents_read?: boolean | null;
	/** @description Allow update on documents */
	documents_update?: boolean | null;
	/** @description Allow delete on documents */
	documents_delete?: boolean | null;
	/** @description Allow create on units & people */
	units_create?: boolean | null;
	/** @description Allow read on units & people */
	units_read?: boolean | null;
	/** @description Allow update on units & people */
	units_update?: boolean | null;
	/** @description Allow delete on units & people */
	units_delete?: boolean | null;
	/** @description Allow create on requests */
	requests_create?: boolean | null;
	/** @description Allow read on requests */
	requests_read?: boolean | null;
	/** @description Allow update on requests */
	requests_update?: boolean | null;
	/** @description Allow delete on requests */
	requests_delete?: boolean | null;
	/** @description Allow create on vendors */
	vendors_create?: boolean | null;
	/** @description Allow read on vendors */
	vendors_read?: boolean | null;
	/** @description Allow update on vendors */
	vendors_update?: boolean | null;
	/** @description Allow delete on vendors */
	vendors_delete?: boolean | null;
	/** @required */
	person_id: People | string;
	pets_approve?: boolean | null;
	vehicles_approve?: boolean | null;
	leases_approve?: boolean | null;
	notices_approved?: boolean | null;
	announcements_approved?: boolean | null;
}

export interface Vehicle {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	make?: string | null;
	model?: string | null;
	license_plate?: string | null;
	state?: string | null;
	image?: DirectusFile | string | null;
	unit_id?: Unit | string | null;
	color?: string | null;
	parking_spot?: string | null;
	rental_agreement?: DirectusFile | string | null;
	category?: 'Car' | 'Scooter' | 'Motorcycle' | 'Van' | null;
	year?: string | null;
}

export interface Vendor {
	/** @primaryKey */
	id: number;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	title?: string | null;
	category?: 'Construction' | 'IT' | 'Landscape' | 'Cleaning' | 'Plumber' | 'HVAC' | 'Painter' | 'Locksmith' | null;
	website?: string | null;
	phone?: string | null;
	email?: string | null;
	logo?: DirectusFile | string | null;
	address_line_1?: string | null;
	address_line_2?: string | null;
	city?: string | null;
	state?: string | null;
	zip?: string | null;
	/** @description Keywords for auto-matching transactions (e.g., 'First Insurance', 'FIC') */
	matching_keywords?: string[] | null;
	auto_created?: boolean | null;
	created_from_import?: boolean | null;
	people?: VendorsPeople[] | string[];
	projects?: VendorsProject[] | string[];
}

export interface VendorsPeople {
	/** @primaryKey */
	id: number;
	vendors_id?: Vendor | string | null;
	people_id?: People | string | null;
	sort?: number | null;
}

export interface VendorsProject {
	/** @primaryKey */
	id: number;
	vendors_id?: Vendor | string | null;
	sort?: number | null;
}

export interface ViolationReport {
	/** @primaryKey */
	id: number;
	user_created?: string | null;
	user_updated?: string | null;
	date_created?: string | null;
	date_updated?: string | null;
	status?: 'published' | 'draft' | 'archived' | null;
	sort?: number | null;
	/** @required */
	report_month: '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12';
	violation_count?: number | null;
	total_violation_amount?: number | null;
	compliance_status?: 'compliant' | 'minor_issues' | 'critical_violations' | null;
	board_actions_required?: string | null;
	generated_by?: string | null;
	/** @required */
	fiscal_year: FiscalYear | string;
}

export interface Vote {
	/** @primaryKey */
	id: string;
	status?: 'published' | 'draft' | 'archived';
	sort?: number | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	user_updated?: DirectusUser | string | null;
	date_updated?: string | null;
	option?: string | null;
	unit?: string | null;
	person?: string | null;
}

export interface DirectusAccess {
	/** @primaryKey */
	id: string;
	role?: DirectusRole | string | null;
	user?: DirectusUser | string | null;
	policy?: DirectusPolicy | string;
	sort?: number | null;
}

export interface DirectusActivity {
	/** @primaryKey */
	id: number;
	action?: string;
	user?: DirectusUser | string | null;
	timestamp?: string;
	ip?: string | null;
	user_agent?: string | null;
	collection?: string;
	item?: string;
	origin?: string | null;
	revisions?: DirectusRevision[] | string[];
}

export interface DirectusCollection {
	/** @primaryKey */
	collection: string;
	icon?: string | null;
	note?: string | null;
	display_template?: string | null;
	hidden?: boolean;
	singleton?: boolean;
	translations?: Array<{ language: string; translation: string; singular: string; plural: string }> | null;
	archive_field?: string | null;
	archive_app_filter?: boolean;
	archive_value?: string | null;
	unarchive_value?: string | null;
	sort_field?: string | null;
	accountability?: 'all' | 'activity' | null | null;
	color?: string | null;
	item_duplication_fields?: 'json' | null;
	sort?: number | null;
	group?: DirectusCollection | string | null;
	collapse?: string;
	preview_url?: string | null;
	versioning?: boolean;
}

export interface DirectusComment {
	/** @primaryKey */
	id: string;
	collection?: DirectusCollection | string;
	item?: string;
	comment?: string;
	date_created?: string | null;
	date_updated?: string | null;
	user_created?: DirectusUser | string | null;
	user_updated?: DirectusUser | string | null;
}

export interface DirectusField {
	/** @primaryKey */
	id: number;
	collection?: DirectusCollection | string;
	field?: string;
	special?: string[] | null;
	interface?: string | null;
	options?: 'json' | null;
	display?: string | null;
	display_options?: 'json' | null;
	readonly?: boolean;
	hidden?: boolean;
	sort?: number | null;
	width?: string | null;
	translations?: 'json' | null;
	note?: string | null;
	conditions?: 'json' | null;
	required?: boolean | null;
	group?: DirectusField | string | null;
	validation?: 'json' | null;
	validation_message?: string | null;
	searchable?: boolean;
}

export interface DirectusFile {
	/** @primaryKey */
	id: string;
	storage?: string;
	filename_disk?: string | null;
	filename_download?: string;
	title?: string | null;
	type?: string | null;
	folder?: DirectusFolder | string | null;
	uploaded_by?: DirectusUser | string | null;
	created_on?: string;
	modified_by?: DirectusUser | string | null;
	modified_on?: string;
	charset?: string | null;
	filesize?: number | null;
	width?: number | null;
	height?: number | null;
	duration?: number | null;
	embed?: string | null;
	description?: string | null;
	location?: string | null;
	tags?: string[] | null;
	metadata?: 'json' | null;
	focal_point_x?: number | null;
	focal_point_y?: number | null;
	tus_id?: string | null;
	tus_data?: 'json' | null;
	uploaded_on?: string | null;
}

export interface DirectusFolder {
	/** @primaryKey */
	id: string;
	name?: string;
	parent?: DirectusFolder | string | null;
}

export interface DirectusMigration {
	/** @primaryKey */
	version: string;
	name?: string;
	timestamp?: string | null;
}

export interface DirectusPermission {
	/** @primaryKey */
	id: number;
	collection?: string;
	action?: string;
	permissions?: 'json' | null;
	validation?: 'json' | null;
	presets?: 'json' | null;
	fields?: string[] | null;
	policy?: DirectusPolicy | string;
}

export interface DirectusPolicy {
	/** @primaryKey */
	id: string;
	/** @required */
	name: string;
	icon?: string;
	description?: string | null;
	ip_access?: string[] | null;
	enforce_tfa?: boolean;
	admin_access?: boolean;
	app_access?: boolean;
	permissions?: DirectusPermission[] | string[];
	users?: DirectusAccess[] | string[];
	roles?: DirectusAccess[] | string[];
}

export interface DirectusPreset {
	/** @primaryKey */
	id: number;
	bookmark?: string | null;
	user?: DirectusUser | string | null;
	role?: DirectusRole | string | null;
	collection?: string | null;
	search?: string | null;
	layout?: string | null;
	layout_query?: 'json' | null;
	layout_options?: 'json' | null;
	refresh_interval?: number | null;
	filter?: 'json' | null;
	icon?: string | null;
	color?: string | null;
}

export interface DirectusRelation {
	/** @primaryKey */
	id: number;
	many_collection?: string;
	many_field?: string;
	one_collection?: string | null;
	one_field?: string | null;
	one_collection_field?: string | null;
	one_allowed_collections?: string[] | null;
	junction_field?: string | null;
	sort_field?: string | null;
	one_deselect_action?: string;
}

export interface DirectusRevision {
	/** @primaryKey */
	id: number;
	activity?: DirectusActivity | string;
	collection?: string;
	item?: string;
	data?: 'json' | null;
	delta?: 'json' | null;
	parent?: DirectusRevision | string | null;
	version?: DirectusVersion | string | null;
}

export interface DirectusRole {
	/** @primaryKey */
	id: string;
	/** @required */
	name: string;
	icon?: string;
	description?: string | null;
	parent?: DirectusRole | string | null;
	children?: DirectusRole[] | string[];
	policies?: DirectusAccess[] | string[];
	users?: DirectusUser[] | string[];
}

export interface DirectusSession {
	/** @primaryKey */
	token: string;
	user?: DirectusUser | string | null;
	expires?: string;
	ip?: string | null;
	user_agent?: string | null;
	share?: DirectusShare | string | null;
	origin?: string | null;
	next_token?: string | null;
}

export interface DirectusSettings {
	/** @primaryKey */
	id: number;
	project_name?: string;
	project_url?: string | null;
	project_color?: string;
	project_logo?: DirectusFile | string | null;
	public_foreground?: DirectusFile | string | null;
	public_background?: DirectusFile | string | null;
	public_note?: string | null;
	auth_login_attempts?: number | null;
	auth_password_policy?: null | `/^.{8,}$/` | `/(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{';'?>.<,])(?!.*\\s).*$/` | null;
	storage_asset_transform?: 'all' | 'none' | 'presets' | null;
	storage_asset_presets?: Array<{ key: string; fit: 'contain' | 'cover' | 'inside' | 'outside'; width: number; height: number; quality: number; withoutEnlargement: boolean; format: 'auto' | 'jpeg' | 'png' | 'webp' | 'tiff' | 'avif'; transforms: 'json' }> | null;
	custom_css?: string | null;
	storage_default_folder?: DirectusFolder | string | null;
	basemaps?: Array<{ name: string; type: 'raster' | 'tile' | 'style'; url: string; tileSize: number; attribution: string }> | null;
	mapbox_key?: string | null;
	module_bar?: 'json' | null;
	project_descriptor?: string | null;
	default_language?: string;
	custom_aspect_ratios?: Array<{ text: string; value: number }> | null;
	public_favicon?: DirectusFile | string | null;
	default_appearance?: 'auto' | 'light' | 'dark';
	default_theme_light?: string | null;
	theme_light_overrides?: 'json' | null;
	default_theme_dark?: string | null;
	theme_dark_overrides?: 'json' | null;
	report_error_url?: string | null;
	report_bug_url?: string | null;
	report_feature_url?: string | null;
	public_registration?: boolean;
	public_registration_verify_email?: boolean;
	public_registration_role?: DirectusRole | string | null;
	public_registration_email_filter?: 'json' | null;
	visual_editor_urls?: Array<{ url: string }> | null;
	project_id?: string | null;
	mcp_enabled?: boolean;
	mcp_allow_deletes?: boolean;
	mcp_prompts_collection?: string | null;
	mcp_system_prompt_enabled?: boolean;
	mcp_system_prompt?: string | null;
	project_owner?: string | null;
	project_usage?: string | null;
	org_name?: string | null;
	product_updates?: boolean | null;
	project_status?: string | null;
	ai_openai_api_key?: string | null;
	ai_anthropic_api_key?: string | null;
	ai_system_prompt?: string | null;
}

export interface DirectusUser {
	/** @primaryKey */
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
	password?: string | null;
	location?: string | null;
	title?: string | null;
	description?: string | null;
	tags?: string[] | null;
	avatar?: DirectusFile | string | null;
	language?: string | null;
	tfa_secret?: string | null;
	status?: 'draft' | 'invited' | 'unverified' | 'active' | 'suspended' | 'archived';
	role?: DirectusRole | string | null;
	token?: string | null;
	last_access?: string | null;
	last_page?: string | null;
	provider?: string;
	external_identifier?: string | null;
	auth_data?: 'json' | null;
	email_notifications?: boolean | null;
	appearance?: null | 'auto' | 'light' | 'dark' | null;
	theme_dark?: string | null;
	theme_light?: string | null;
	theme_light_overrides?: 'json' | null;
	theme_dark_overrides?: 'json' | null;
	text_direction?: 'auto' | 'ltr' | 'rtl';
	person_id?: People | string | null;
	units?: JunctionDirectusUsersUnit[] | string[];
	policies?: DirectusAccess[] | string[];
}

export interface DirectusWebhook {
	/** @primaryKey */
	id: number;
	name?: string;
	method?: null;
	url?: string;
	status?: 'active' | 'inactive';
	data?: boolean;
	actions?: 'create' | 'update' | 'delete';
	collections?: string[];
	headers?: Array<{ header: string; value: string }> | null;
	was_active_before_deprecation?: boolean;
	migrated_flow?: DirectusFlow | string | null;
}

export interface DirectusDashboard {
	/** @primaryKey */
	id: string;
	name?: string;
	icon?: string;
	note?: string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	color?: string | null;
	panels?: DirectusPanel[] | string[];
}

export interface DirectusPanel {
	/** @primaryKey */
	id: string;
	dashboard?: DirectusDashboard | string;
	name?: string | null;
	icon?: string | null;
	color?: string | null;
	show_header?: boolean;
	note?: string | null;
	type?: string;
	position_x?: number;
	position_y?: number;
	width?: number;
	height?: number;
	options?: 'json' | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
}

export interface DirectusNotification {
	/** @primaryKey */
	id: number;
	timestamp?: string | null;
	status?: string | null;
	recipient?: DirectusUser | string;
	sender?: DirectusUser | string | null;
	subject?: string;
	message?: string | null;
	collection?: string | null;
	item?: string | null;
}

export interface DirectusShare {
	/** @primaryKey */
	id: string;
	name?: string | null;
	collection?: DirectusCollection | string;
	item?: string;
	role?: DirectusRole | string | null;
	password?: string | null;
	user_created?: DirectusUser | string | null;
	date_created?: string | null;
	date_start?: string | null;
	date_end?: string | null;
	times_used?: number | null;
	max_uses?: number | null;
}

export interface DirectusFlow {
	/** @primaryKey */
	id: string;
	name?: string;
	icon?: string | null;
	color?: string | null;
	description?: string | null;
	status?: string;
	trigger?: string | null;
	accountability?: string | null;
	options?: 'json' | null;
	operation?: DirectusOperation | string | null;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
	operations?: DirectusOperation[] | string[];
}

export interface DirectusOperation {
	/** @primaryKey */
	id: string;
	name?: string | null;
	key?: string;
	type?: string;
	position_x?: number;
	position_y?: number;
	options?: 'json' | null;
	resolve?: DirectusOperation | string | null;
	reject?: DirectusOperation | string | null;
	flow?: DirectusFlow | string;
	date_created?: string | null;
	user_created?: DirectusUser | string | null;
}

export interface DirectusTranslation {
	/** @primaryKey */
	id: string;
	/** @required */
	language: string;
	/** @required */
	key: string;
	/** @required */
	value: string;
}

export interface DirectusVersion {
	/** @primaryKey */
	id: string;
	key?: string;
	name?: string | null;
	collection?: DirectusCollection | string;
	item?: string;
	hash?: string | null;
	date_created?: string | null;
	date_updated?: string | null;
	user_created?: DirectusUser | string | null;
	user_updated?: DirectusUser | string | null;
	delta?: 'json' | null;
}

export interface DirectusExtension {
	folder?: string;
	enabled?: boolean;
	/** @primaryKey */
	id: string;
	source?: string;
	bundle?: string | null;
}

export interface Schema {
	accounts: Account[];
	activity: Activity[];
	announcements: Announcement[];
	announcements_email_activity: AnnouncementsEmailActivity[];
	announcements_files: AnnouncementsFile[];
	announcements_people: AnnouncementsPeople[];
	assessment_ledger: AssessmentLedger[];
	assessments: Assessment[];
	assessments_files: AssessmentsFile[];
	audit_logs: AuditLog[];
	board_member: BoardMember[];
	budget_admendments: BudgetAdmendment[];
	budget_categories: BudgetCategory[];
	budget_items: BudgetItem[];
	by_laws: ByLaws;
	cash_flow_projections: CashFlowProjection[];
	channel_members: ChannelMember[];
	channel_message_files: ChannelMessageFile[];
	channel_message_mentions: ChannelMessageMention[];
	channel_messages: ChannelMessage[];
	channels: Channel[];
	comment_files: CommentFile[];
	comment_mentions: CommentMention[];
	comments: Comment[];
	compliance_alerts: ComplianceAlert[];
	corporation: Corporation;
	corporation_files: CorporationFile[];
	email_activity: EmailActivity[];
	features: Features;
	features_files: FeaturesFile[];
	fiscal_year_budgets: FiscalYearBudget[];
	fiscal_years: FiscalYear[];
	junction_directus_users_units: JunctionDirectusUsersUnit[];
	leases: Lease[];
	meetings: Meeting[];
	meetings_files: MeetingsFile[];
	meetings_people: MeetingsPeople[];
	meetings_presentations: MeetingsPresentation[];
	monthly_reconciliation_reports: MonthlyReconciliationReport[];
	monthly_statements: MonthlyStatement[];
	newsletters: Newsletter[];
	notices: Notice[];
	people: People[];
	people_units: PeopleUnit[];
	pets: Pet[];
	pets_files: PetsFile[];
	presentations: Presentation[];
	presentations_files: PresentationsFile[];
	project_categories: ProjectCategory[];
	project_event_categories: ProjectEventCategory[];
	project_event_files: ProjectEventFile[];
	project_events: ProjectEvent[];
	projects: Project[];
	project_tasks: ProjectTask[];
	project_task_watchers: ProjectTaskWatcher[];
	reactions: Reaction[];
	reaction_types: ReactionType[];
	reconciliation_notes: ReconciliationNote[];
	renderings: Rendering[];
	requests: Request[];
	reserve_components: ReserveComponent[];
	reserves: Reserf[];
	reserve_studies: ReserveStudy[];
	rules: Rule[];
	tasks: Task[];
	transactions: Transaction[];
	units: Unit[];
	units_people: UnitsPeople[];
	user_permissions: UserPermission[];
	vehicles: Vehicle[];
	vendors: Vendor[];
	vendors_people: VendorsPeople[];
	vendors_projects: VendorsProject[];
	violation_reports: ViolationReport[];
	votes: Vote[];
	directus_access: DirectusAccess[];
	directus_activity: DirectusActivity[];
	directus_collections: DirectusCollection[];
	directus_comments: DirectusComment[];
	directus_fields: DirectusField[];
	directus_files: DirectusFile[];
	directus_folders: DirectusFolder[];
	directus_migrations: DirectusMigration[];
	directus_permissions: DirectusPermission[];
	directus_policies: DirectusPolicy[];
	directus_presets: DirectusPreset[];
	directus_relations: DirectusRelation[];
	directus_revisions: DirectusRevision[];
	directus_roles: DirectusRole[];
	directus_sessions: DirectusSession[];
	directus_settings: DirectusSettings;
	directus_users: DirectusUser[];
	directus_webhooks: DirectusWebhook[];
	directus_dashboards: DirectusDashboard[];
	directus_panels: DirectusPanel[];
	directus_notifications: DirectusNotification[];
	directus_shares: DirectusShare[];
	directus_flows: DirectusFlow[];
	directus_operations: DirectusOperation[];
	directus_translations: DirectusTranslation[];
	directus_versions: DirectusVersion[];
	directus_extensions: DirectusExtension[];
}

export enum CollectionNames {
	accounts = 'accounts',
	activity = 'activity',
	announcements = 'announcements',
	announcements_email_activity = 'announcements_email_activity',
	announcements_files = 'announcements_files',
	announcements_people = 'announcements_people',
	assessment_ledger = 'assessment_ledger',
	assessments = 'assessments',
	assessments_files = 'assessments_files',
	audit_logs = 'audit_logs',
	board_member = 'board_member',
	budget_admendments = 'budget_admendments',
	budget_categories = 'budget_categories',
	budget_items = 'budget_items',
	by_laws = 'by_laws',
	cash_flow_projections = 'cash_flow_projections',
	channel_members = 'channel_members',
	channel_message_files = 'channel_message_files',
	channel_message_mentions = 'channel_message_mentions',
	channel_messages = 'channel_messages',
	channels = 'channels',
	comment_files = 'comment_files',
	comment_mentions = 'comment_mentions',
	comments = 'comments',
	compliance_alerts = 'compliance_alerts',
	corporation = 'corporation',
	corporation_files = 'corporation_files',
	email_activity = 'email_activity',
	features = 'features',
	features_files = 'features_files',
	fiscal_year_budgets = 'fiscal_year_budgets',
	fiscal_years = 'fiscal_years',
	junction_directus_users_units = 'junction_directus_users_units',
	leases = 'leases',
	meetings = 'meetings',
	meetings_files = 'meetings_files',
	meetings_people = 'meetings_people',
	meetings_presentations = 'meetings_presentations',
	monthly_reconciliation_reports = 'monthly_reconciliation_reports',
	monthly_statements = 'monthly_statements',
	newsletters = 'newsletters',
	notices = 'notices',
	people = 'people',
	people_units = 'people_units',
	pets = 'pets',
	pets_files = 'pets_files',
	presentations = 'presentations',
	presentations_files = 'presentations_files',
	project_categories = 'project_categories',
	project_event_categories = 'project_event_categories',
	project_event_files = 'project_event_files',
	project_events = 'project_events',
	projects = 'projects',
	project_tasks = 'project_tasks',
	project_task_watchers = 'project_task_watchers',
	reactions = 'reactions',
	reaction_types = 'reaction_types',
	reconciliation_notes = 'reconciliation_notes',
	renderings = 'renderings',
	requests = 'requests',
	reserve_components = 'reserve_components',
	reserves = 'reserves',
	reserve_studies = 'reserve_studies',
	rules = 'rules',
	tasks = 'tasks',
	transactions = 'transactions',
	units = 'units',
	units_people = 'units_people',
	user_permissions = 'user_permissions',
	vehicles = 'vehicles',
	vendors = 'vendors',
	vendors_people = 'vendors_people',
	vendors_projects = 'vendors_projects',
	violation_reports = 'violation_reports',
	votes = 'votes',
	directus_access = 'directus_access',
	directus_activity = 'directus_activity',
	directus_collections = 'directus_collections',
	directus_comments = 'directus_comments',
	directus_fields = 'directus_fields',
	directus_files = 'directus_files',
	directus_folders = 'directus_folders',
	directus_migrations = 'directus_migrations',
	directus_permissions = 'directus_permissions',
	directus_policies = 'directus_policies',
	directus_presets = 'directus_presets',
	directus_relations = 'directus_relations',
	directus_revisions = 'directus_revisions',
	directus_roles = 'directus_roles',
	directus_sessions = 'directus_sessions',
	directus_settings = 'directus_settings',
	directus_users = 'directus_users',
	directus_webhooks = 'directus_webhooks',
	directus_dashboards = 'directus_dashboards',
	directus_panels = 'directus_panels',
	directus_notifications = 'directus_notifications',
	directus_shares = 'directus_shares',
	directus_flows = 'directus_flows',
	directus_operations = 'directus_operations',
	directus_translations = 'directus_translations',
	directus_versions = 'directus_versions',
	directus_extensions = 'directus_extensions'
}