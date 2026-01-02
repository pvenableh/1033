import type {
	Navigation,
	SEO,
	ChatConfig,
	Event,
	Metric,
} from './meta';
import type {
	Channel,
	ChannelMember,
	ChannelMessage,
	ChannelMessageMention,
	ChannelMessageFile,
} from './channels';
import type {
	Comment,
	CommentMention,
	CommentFile,
} from './comments';
import type {Category, Form, Post, Team, Testimonial} from './content';
import type {Inbox, HelpArticle, HelpCollection, HelpFeedback} from './help';
import type {File, User} from './system';
import type {
	Conversation,
	Message,
	Contact,
	Organization,
	OrganizationAddress,
	OrganizationContact,
	OsActivity,
	OsActivityContact,
	OsDealContact,
	OsDeal,
	OsDealStage,
	OsEmailTemplate,
	OsExpense,
	OsInvoiceItem,
	OsInvoice,
	OsItem,
	OsPayment,
	OsPaymentTerm,
	OsProjectContact,
	OsProjectFile,
	OsProject,
	OsProjectTemplate,
	OsSettings,
	OsSubscription,
	OsTaskFile,
	OsTask,
	OsTaxRate,
} from './os';

/** Directus Schema for SDK */
export interface Schema {
	// Content
	categories: Category[];
	forms: Form[];
	posts: Post[];
	team: Team[];
	testimonials: Testimonial[];

	// OS
	contacts: Contact[];
	organizations: Organization[];
	organization_addresses: OrganizationAddress[];
	organizations_contacts: OrganizationContact[];
	os_activities: OsActivity[];
	os_activity_contacts: OsActivityContact[];
	os_deal_contacts: OsDealContact[];
	os_deals: OsDeal[];
	os_deal_stages: OsDealStage[];
	os_email_templates: OsEmailTemplate[];
	os_expenses: OsExpense[];
	os_invoice_items: OsInvoiceItem[];
	os_invoices: OsInvoice[];
	os_items: OsItem[];
	os_payments: OsPayment[];
	os_payment_terms: OsPaymentTerm[];
	os_project_contacts: OsProjectContact[];
	os_project_files: OsProjectFile[];
	os_projects: OsProject[];
	os_project_templates: OsProjectTemplate[];
	os_settings: OsSettings;
	os_subscriptions: OsSubscription[];
	os_task_files: OsTaskFile[];
	os_tasks: OsTask[];
	os_tax_rates: OsTaxRate[];

	// Help
	help_collections: HelpCollection[];
	help_articles: HelpArticle[];
	help_feedback: HelpFeedback[];
	inbox: Inbox[];
	conversations: Conversation[];
	messages: Message[];

	// Meta
	navigation: Navigation[];
	seo: SEO[];
	chat_config: ChatConfig;

	// Data
	metrics: Metric[];
	events: Event[];

	// System
	directus_files: File[];
	directus_users: User[];

	// Channels
	channels: Channel[];
	channel_members: ChannelMember[];
	channel_messages: ChannelMessage[];
	channel_message_mentions: ChannelMessageMention[];
	channel_message_files: ChannelMessageFile[];

	// Comments
	comments: Comment[];
	comment_mentions: CommentMention[];
	comment_files: CommentFile[];
}
