<template>
	<div class="documents-page min-h-screen" :style="{ backgroundColor: 'var(--theme-bg-primary)' }">
		<!-- Page Header — frosted glass bar -->
		<header class="page-header-wrap sticky top-0 z-20">
			<div class="page-header-glass">
				<div class="max-w-5xl mx-auto px-6 lg:px-16 py-4">
					<div class="page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 opacity-0">
						<div>
							<h1 class="font-serif text-2xl font-light tracking-tight" style="color: var(--theme-text-primary)">
								Documents
							</h1>
							<p class="text-[13px] mt-1" style="color: var(--theme-text-secondary)">
								Meeting minutes, financial reports &amp; association documents
							</p>
						</div>
						<nav class="flex flex-wrap gap-2">
							<button
								v-for="cat in categories"
								:key="cat.id"
								@click="switchCategory(cat.id)"
								class="category-pill"
								:class="activeCategory === cat.id ? 'is-active' : ''">
								{{ cat.label }}
								<span v-if="cat.count > 0" class="pill-count">{{ cat.count }}</span>
							</button>
						</nav>
					</div>
				</div>
			</div>
		</header>

		<!-- Documents Content -->
		<section class="px-6 lg:px-16 pt-6 pb-16">
			<div class="max-w-5xl mx-auto">

				<!-- General Documents Section -->
				<Transition name="section" mode="out-in">
					<div v-if="activeCategory === 'all' || activeCategory === 'general'" key="general" class="document-section mb-12">
						<div class="section-label opacity-0">
							<div class="label-dot"></div>
							<span>Association Documents</span>
						</div>

						<div v-if="generalDocuments.length" class="card-grid">
							<a
								v-for="(doc, index) in generalDocuments"
								:key="'doc-' + index"
								:href="'https://admin.1033lenox.com/assets/' + doc.fileId"
								target="_blank"
								class="doc-card group opacity-0">
								<div class="card-inner">
									<div class="card-icon">
										<UIcon name="i-heroicons-document-arrow-down" class="w-4 h-4" />
									</div>
									<div class="card-body">
										<h3 class="card-title">{{ doc.title }}</h3>
										<p v-if="doc.description" class="card-subtitle">{{ doc.description }}</p>
									</div>
									<span v-if="doc.type" class="card-badge">{{ doc.type }}</span>
								</div>
							</a>
						</div>

						<div v-else class="empty-state">
							<UIcon name="i-heroicons-document" class="w-5 h-5 empty-icon" />
							<p>No documents available yet</p>
						</div>
					</div>
				</Transition>

				<!-- Meeting Minutes & Agendas Section -->
				<Transition name="section" mode="out-in">
					<div v-if="activeCategory === 'all' || activeCategory === 'meetings'" key="meetings" class="document-section mb-12">
						<div class="section-label opacity-0">
							<div class="label-dot"></div>
							<span>Meeting Minutes &amp; Agendas</span>
						</div>

						<div v-if="meetingDocuments.length" class="space-y-2">
							<div
								v-for="(meeting, index) in meetingDocuments"
								:key="'meeting-' + index"
								class="meeting-card opacity-0">
								<div class="flex flex-col sm:flex-row sm:items-center gap-3">
									<div class="flex-1 min-w-0">
										<h3 class="card-title">
											{{ meeting.title || 'Board Meeting' }}
										</h3>
										<p class="card-subtitle">
											{{ formatMeetingDate(meeting.date) }}
											<span v-if="meeting.category" class="meeting-tag">{{ meeting.category }}</span>
										</p>
									</div>
									<div class="flex items-center gap-2 flex-shrink-0">
										<a
											v-if="meeting.agendaFileId"
											:href="'https://admin.1033lenox.com/assets/' + meeting.agendaFileId"
											target="_blank"
											class="file-link">
											<UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5" />
											Agenda
										</a>
										<a
											v-if="meeting.minutesFileId"
											:href="'https://admin.1033lenox.com/assets/' + meeting.minutesFileId"
											target="_blank"
											class="file-link">
											<UIcon name="i-heroicons-clipboard-document-list" class="w-3.5 h-3.5" />
											Minutes
										</a>
									</div>
								</div>
							</div>
						</div>

						<div v-else class="empty-state">
							<UIcon name="i-heroicons-calendar" class="w-5 h-5 empty-icon" />
							<p>No meeting documents available</p>
						</div>
					</div>
				</Transition>

				<!-- Financial Reports Section -->
				<Transition name="section" mode="out-in">
					<div v-if="activeCategory === 'all' || activeCategory === 'financial'" key="financial" class="document-section mb-12">
						<div class="section-label opacity-0">
							<div class="label-dot"></div>
							<span>Financial Reports</span>
						</div>

						<div v-if="financialReports.length" class="card-grid">
							<a
								v-for="(report, index) in financialReports"
								:key="'report-' + index"
								:href="'https://admin.1033lenox.com/assets/' + report.fileId"
								target="_blank"
								class="doc-card group opacity-0">
								<div class="card-inner">
									<div class="card-icon">
										<UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
									</div>
									<div class="card-body">
										<h3 class="card-title">{{ report.title }}</h3>
										<p class="card-subtitle">
											<span v-if="report.categoryLabel" class="cat-label">{{ report.categoryLabel }}</span>
											<span v-if="report.categoryLabel && report.year"> · </span>
											<span v-if="report.year">{{ report.year }}</span>
										</p>
									</div>
									<span class="card-badge">
										{{ report.fileType ? report.fileType.split('/').pop() : 'PDF' }}
									</span>
								</div>
							</a>
						</div>

						<div v-else class="empty-state">
							<UIcon name="i-heroicons-chart-bar" class="w-5 h-5 empty-icon" />
							<p>No financial reports available</p>
						</div>
					</div>
				</Transition>

			</div>
		</section>
	</div>
</template>

<script setup>
import {onMounted, onUnmounted, nextTick} from 'vue';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Analytics
const analytics = useAnalytics();

definePageMeta({
	layout: 'default',
	middleware: ['auth'],
});

useSeoMeta({
	title: 'Documents - 1033 Lenox',
});

const activeCategory = ref('all');

// Month name lookup
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---- Fetch General Documents ----
const documentsCollection = useDirectusItems('documents');
let rawDocuments = [];
try {
	rawDocuments = await documentsCollection.list({
		fields: ['id', 'title', 'description', 'status', 'category', 'file.id', 'file.title', 'file.type', 'sort'],
		filter: {status: {_eq: 'published'}},
		sort: ['sort', '-date_created'],
	});
} catch (e) {
	rawDocuments = [];
}

const generalDocuments = computed(() => {
	if (!rawDocuments || !rawDocuments.length) return [];
	return rawDocuments
		.filter((doc) => doc.file?.id)
		.map((doc) => ({
			title: doc.title || doc.file?.title || 'Document',
			description: doc.description || '',
			fileId: doc.file.id,
			type: doc.file.type ? doc.file.type.split('/').pop() : '',
		}));
});

// ---- Fetch Meeting Documents (minutes & agendas) ----
const meetingsCollection = useDirectusItems('meetings');
const rawMeetings = await meetingsCollection.list({
	fields: [
		'id',
		'title',
		'date',
		'category',
		'files.directus_files_id.id',
		'files.directus_files_id.tags',
		'files.directus_files_id.title',
	],
	filter: {status: {_eq: 'published'}},
	sort: ['-date'],
});

const meetingDocuments = computed(() => {
	if (!rawMeetings || !rawMeetings.length) return [];
	return rawMeetings
		.filter((m) => m.files && m.files.length > 0)
		.map((meeting) => {
			const agendaFile = meeting.files.find(
				(f) => f.directus_files_id?.tags?.includes('Agenda')
			);
			const minutesFile = meeting.files.find(
				(f) => f.directus_files_id?.tags?.includes('Minutes')
			);

			return {
				title: meeting.title,
				date: meeting.date,
				category: meeting.category,
				agendaFileId: agendaFile?.directus_files_id?.id || null,
				minutesFileId: minutesFile?.directus_files_id?.id || null,
			};
		})
		.filter((m) => m.agendaFileId || m.minutesFileId);
});

// ---- Fetch Financial Reports ----
const financialDocsCollection = useDirectusItems('financial_documents');
let rawFinancialDocs = [];
try {
	rawFinancialDocs = await financialDocsCollection.list({
		fields: [
			'id',
			'title',
			'category',
			'period',
			'report_date',
			'description',
			'fiscal_year.year',
			'file.id',
			'file.title',
			'file.type',
		],
		filter: {
			status: { _eq: 'published' },
			file: { _nnull: true },
		},
		sort: ['-fiscal_year.year', '-period', '-report_date'],
	});
} catch (e) {
	rawFinancialDocs = [];
}

const categoryLabels = {
	monthly_report: 'Monthly Report',
	annual_report: 'Annual Report',
	budget: 'Budget',
	reserve_study: 'Reserve Study',
	compliance: 'Compliance',
	assessment: 'Assessment',
	tax_filing: 'Tax Filing',
	audit: 'Audit',
	other: 'Other',
};

const financialReports = computed(() => {
	if (!rawFinancialDocs || !rawFinancialDocs.length) return [];
	return rawFinancialDocs
		.filter((doc) => doc.file?.id)
		.map((doc) => {
			const year = doc.fiscal_year?.year || '';
			const catLabel = categoryLabels[doc.category] || doc.category || '';
			return {
				id: doc.id,
				title: doc.title || `${catLabel} - ${year}`,
				category: doc.category,
				categoryLabel: catLabel,
				period: doc.period,
				year,
				description: doc.description,
				fileId: doc.file.id,
				fileType: doc.file.type,
				reportDate: doc.report_date,
			};
		});
});

// ---- Category counts ----
const categories = computed(() => [
	{id: 'all', label: 'All', count: generalDocuments.value.length + meetingDocuments.value.length + financialReports.value.length},
	{id: 'general', label: 'General', count: generalDocuments.value.length},
	{id: 'meetings', label: 'Meetings', count: meetingDocuments.value.length},
	{id: 'financial', label: 'Financial', count: financialReports.value.length},
]);

function formatMeetingDate(dateStr) {
	if (!dateStr) return '';
	const [year, month, day] = dateStr.split('-');
	return new Date(year, month - 1, day).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	});
}

// Category switching with animated card re-entrance
function switchCategory(id) {
	if (id === activeCategory.value) return;
	activeCategory.value = id;

	analytics.trackEvent('documents_category_filter', { category: id });

	// Re-animate cards after Vue re-renders the new section
	nextTick(() => {
		animateCards();
	});
}

function animateCards() {
	// Section labels
	gsap.fromTo('.section-label',
		{opacity: 0, x: -8},
		{opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08}
	);

	// Document cards
	const cards = document.querySelectorAll('.doc-card, .meeting-card');
	gsap.fromTo(cards,
		{opacity: 0, y: 12, scale: 0.98},
		{
			opacity: 1,
			y: 0,
			scale: 1,
			duration: 0.45,
			ease: 'power2.out',
			stagger: 0.04,
		}
	);
}

let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		// Header entrance
		gsap.fromTo('.page-header',
			{opacity: 0, y: 6},
			{opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.05}
		);

		// Initial card animations
		animateCards();
	});
});

onUnmounted(() => {
	if (ctx) ctx.revert();
});
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

/* ============================================
   Page Foundation
   ============================================ */

.documents-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

/* ============================================
   Frosted Glass Header
   ============================================ */

.page-header-glass {
	background: rgba(253, 252, 250, 0.72);
	backdrop-filter: blur(20px) saturate(1.8);
	-webkit-backdrop-filter: blur(20px) saturate(1.8);
	border-bottom: 1px solid rgba(229, 224, 216, 0.5);
	box-shadow: 0 1px 3px rgba(139, 115, 85, 0.04);
}

@media (prefers-color-scheme: dark) {
	.page-header-glass {
		background: rgba(28, 25, 21, 0.72);
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}
}

/* ============================================
   Category Pills — iOS segmented control feel
   ============================================ */

.category-pill {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.375rem 0.75rem;
	font-size: 11px;
	font-weight: 500;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	border-radius: 100px;
	border: 1px solid var(--theme-border-primary, #e5e0d8);
	color: var(--theme-text-secondary, #6c6c6c);
	background: transparent;
	cursor: pointer;
	transition:
		all 0.35s cubic-bezier(0.23, 1, 0.32, 1),
		transform 0.25s cubic-bezier(0.23, 1, 0.32, 1);
	-webkit-tap-highlight-color: transparent;
}

.category-pill:hover {
	border-color: var(--theme-accent-tertiary, #8b7355);
	color: var(--theme-accent-tertiary, #8b7355);
	transform: translateY(-1px);
}

.category-pill:active {
	transform: scale(0.97);
}

.category-pill.is-active {
	background: var(--theme-accent-primary, #c9a96e);
	border-color: var(--theme-accent-primary, #c9a96e);
	color: #fff;
	box-shadow:
		0 2px 8px rgba(201, 169, 110, 0.3),
		inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.pill-count {
	font-size: 10px;
	opacity: 0.7;
}

/* ============================================
   Section Labels — minimal, refined
   ============================================ */

.section-label {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: var(--theme-accent-tertiary, #8b7355);
}

.label-dot {
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: var(--theme-accent-primary, #c9a96e);
	flex-shrink: 0;
}

/* ============================================
   Card Grid
   ============================================ */

.card-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 0.5rem;
}

@media (min-width: 768px) {
	.card-grid {
		grid-template-columns: 1fr 1fr;
		gap: 0.625rem;
	}
}

/* ============================================
   Document Cards — glass morphism
   ============================================ */

.doc-card {
	display: block;
	text-decoration: none;
	border-radius: 0.625rem;
	background: rgba(255, 255, 255, 0.55);
	backdrop-filter: blur(12px) saturate(1.4);
	-webkit-backdrop-filter: blur(12px) saturate(1.4);
	border: 1px solid rgba(229, 224, 216, 0.6);
	box-shadow:
		0 1px 3px rgba(139, 115, 85, 0.04),
		inset 0 1px 0 rgba(255, 255, 255, 0.5);
	transition:
		transform 0.4s cubic-bezier(0.23, 1, 0.32, 1),
		box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1),
		border-color 0.4s cubic-bezier(0.23, 1, 0.32, 1);
	will-change: transform;
}

.doc-card:hover {
	transform: translateY(-2px) scale(1.005);
	border-color: rgba(201, 169, 110, 0.45);
	box-shadow:
		0 8px 24px rgba(139, 115, 85, 0.1),
		0 2px 6px rgba(139, 115, 85, 0.06),
		inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.doc-card:active {
	transform: translateY(0) scale(0.995);
	transition-duration: 0.15s;
}

.card-inner {
	display: flex;
	align-items: center;
	gap: 0.875rem;
	padding: 0.875rem 1rem;
}

.card-icon {
	flex-shrink: 0;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(201, 169, 110, 0.08);
	color: var(--theme-accent-tertiary, #8b7355);
	transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.doc-card:hover .card-icon {
	background: var(--theme-accent-primary, #c9a96e);
	color: #fff;
	box-shadow: 0 2px 8px rgba(201, 169, 110, 0.25);
}

.card-body {
	flex: 1;
	min-width: 0;
}

.card-title {
	font-size: 0.8125rem;
	font-weight: 500;
	line-height: 1.35;
	color: var(--theme-text-primary, #454545);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	transition: color 0.3s ease;
}

.doc-card:hover .card-title {
	color: var(--theme-accent-tertiary, #8b7355);
}

.card-subtitle {
	font-size: 0.6875rem;
	color: var(--theme-text-secondary, #6c6c6c);
	margin-top: 0.125rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.cat-label {
	color: var(--theme-accent-tertiary, #8b7355);
}

.card-badge {
	flex-shrink: 0;
	font-size: 9px;
	font-weight: 600;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: var(--theme-accent-tertiary, #8b7355);
	opacity: 0.7;
}

/* ============================================
   Meeting Cards — glass variant
   ============================================ */

.meeting-card {
	border-radius: 0.625rem;
	padding: 0.875rem 1rem;
	background: rgba(255, 255, 255, 0.55);
	backdrop-filter: blur(12px) saturate(1.4);
	-webkit-backdrop-filter: blur(12px) saturate(1.4);
	border: 1px solid rgba(229, 224, 216, 0.6);
	box-shadow:
		0 1px 3px rgba(139, 115, 85, 0.04),
		inset 0 1px 0 rgba(255, 255, 255, 0.5);
	transition:
		transform 0.4s cubic-bezier(0.23, 1, 0.32, 1),
		box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1),
		border-color 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.meeting-card:hover {
	transform: translateY(-1px);
	border-color: rgba(201, 169, 110, 0.35);
	box-shadow:
		0 6px 18px rgba(139, 115, 85, 0.08),
		inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.meeting-tag {
	margin-left: 0.5rem;
	color: var(--theme-accent-tertiary, #8b7355);
	font-weight: 500;
}

.file-link {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.375rem 0.625rem;
	font-size: 11px;
	font-weight: 500;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	text-decoration: none;
	color: var(--theme-text-secondary, #6c6c6c);
	border-radius: 6px;
	border: 1px solid rgba(229, 224, 216, 0.7);
	background: rgba(255, 255, 255, 0.4);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.file-link:hover {
	border-color: var(--theme-accent-primary, #c9a96e);
	color: var(--theme-accent-tertiary, #8b7355);
	background: rgba(201, 169, 110, 0.06);
	transform: translateY(-1px);
}

.file-link:active {
	transform: scale(0.97);
	transition-duration: 0.1s;
}

/* ============================================
   Empty State
   ============================================ */

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	padding: 2.5rem 1rem;
	border-radius: 0.625rem;
	background: rgba(255, 255, 255, 0.35);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	border: 1px dashed rgba(229, 224, 216, 0.6);
}

.empty-icon {
	color: var(--theme-border-primary, #e5e0d8);
}

.empty-state p {
	font-size: 0.8125rem;
	color: var(--theme-text-muted, #9a9a9a);
}

/* ============================================
   Section Transitions
   ============================================ */

.section-enter-active {
	transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.section-leave-active {
	transition: all 0.2s cubic-bezier(0.65, 0, 0.45, 1);
}

.section-enter-from {
	opacity: 0;
	transform: translateY(8px);
	filter: blur(4px);
}

.section-leave-to {
	opacity: 0;
	transform: translateY(-4px);
	filter: blur(4px);
}
</style>
