<template>
	<div class="documents-page bg-cream min-h-screen">
		<!-- Hero Section -->
		<section class="py-16 lg:py-24 px-6 lg:px-16 bg-cream-alt">
			<div class="max-w-5xl mx-auto">
				<div class="page-header text-center opacity-0">
					<p class="text-xs tracking-[0.3em] uppercase mb-4 text-gold-dark">Resource Center</p>
					<h1
						class="font-serif text-[clamp(2.5rem,6vw,4rem)] font-light tracking-tight leading-tight mb-6 text-gray-800">
						Documents
					</h1>
					<div class="w-16 h-px bg-gold mx-auto mb-6"></div>
					<p class="font-serif text-lg italic text-gray-500 max-w-xl mx-auto">
						Meeting minutes, financial reports, and important association documents
					</p>
				</div>
			</div>
		</section>

		<!-- Category Navigation -->
		<section class="py-8 px-6 lg:px-16 border-b border-divider">
			<div class="max-w-5xl mx-auto">
				<nav class="flex flex-wrap gap-4 justify-center">
					<button
						v-for="cat in categories"
						:key="cat.id"
						@click="activeCategory = cat.id"
						class="category-btn px-4 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-300 border"
						:class="activeCategory === cat.id
							? 'border-gold bg-gold text-white'
							: 'border-divider text-gray-500 hover:border-gold-dark hover:text-gold-dark'">
						{{ cat.label }}
						<span v-if="cat.count > 0" class="ml-1 opacity-70">({{ cat.count }})</span>
					</button>
				</nav>
			</div>
		</section>

		<!-- Documents Content -->
		<section class="py-16 lg:py-24 px-6 lg:px-16">
			<div class="max-w-5xl mx-auto">

				<!-- General Documents Section -->
				<div v-if="activeCategory === 'all' || activeCategory === 'general'" class="document-section mb-16">
					<div class="section-header mb-8 opacity-0">
						<div class="flex items-center gap-3 mb-2">
							<UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gold-dark" />
							<p class="text-xs tracking-[0.3em] uppercase text-gold-dark">General</p>
						</div>
						<h2 class="font-serif text-2xl font-light text-gray-800">Association Documents</h2>
						<div class="w-12 h-px bg-gold mt-3"></div>
					</div>

					<div v-if="generalDocuments.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<a
							v-for="(doc, index) in generalDocuments"
							:key="'doc-' + index"
							:href="'https://admin.1033lenox.com/assets/' + doc.fileId"
							target="_blank"
							class="document-card group block bg-white p-5 border border-divider hover:border-gold transition-all duration-300 opacity-0">
							<div class="flex items-center gap-4">
								<div
									class="flex-shrink-0 w-10 h-10 rounded-full border border-divider group-hover:border-gold group-hover:bg-gold flex items-center justify-center transition-all duration-300">
									<UIcon
										name="i-heroicons-document-arrow-down"
										class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
								</div>
								<div class="flex-1 min-w-0">
									<h3
										class="font-serif text-base font-normal text-gray-800 leading-snug group-hover:text-gold-dark transition-colors duration-300 truncate">
										{{ doc.title }}
									</h3>
									<p v-if="doc.description" class="text-xs text-gray-500 mt-1 truncate">{{ doc.description }}</p>
								</div>
								<span v-if="doc.type" class="text-[10px] tracking-[0.15em] uppercase text-gold-dark flex-shrink-0">
									{{ doc.type }}
								</span>
							</div>
						</a>
					</div>

					<div v-else class="text-center py-10 bg-white border border-divider">
						<UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-300 mx-auto mb-3" />
						<p class="font-serif text-gray-500">No general documents available yet</p>
						<p class="text-xs text-gray-400 mt-1">Documents will appear here as they are added</p>
					</div>
				</div>

				<!-- Meeting Minutes & Agendas Section -->
				<div v-if="activeCategory === 'all' || activeCategory === 'meetings'" class="document-section mb-16">
					<div class="section-header mb-8 opacity-0">
						<div class="flex items-center gap-3 mb-2">
							<UIcon name="i-heroicons-calendar" class="w-5 h-5 text-gold-dark" />
							<p class="text-xs tracking-[0.3em] uppercase text-gold-dark">Meetings</p>
						</div>
						<h2 class="font-serif text-2xl font-light text-gray-800">Meeting Minutes & Agendas</h2>
						<div class="w-12 h-px bg-gold mt-3"></div>
					</div>

					<div v-if="meetingDocuments.length" class="space-y-3">
						<div
							v-for="(meeting, index) in meetingDocuments"
							:key="'meeting-' + index"
							class="document-card bg-white border border-divider p-5 opacity-0">
							<div class="flex flex-col sm:flex-row sm:items-center gap-3">
								<div class="flex-1 min-w-0">
									<h3 class="font-serif text-base font-normal text-gray-800">
										{{ meeting.title || 'Board Meeting' }}
									</h3>
									<p class="text-xs text-gray-500 mt-1">
										{{ formatMeetingDate(meeting.date) }}
										<span v-if="meeting.category" class="ml-2 text-gold-dark">{{ meeting.category }}</span>
									</p>
								</div>
								<div class="flex items-center gap-2 flex-shrink-0">
									<a
										v-if="meeting.agendaFileId"
										:href="'https://admin.1033lenox.com/assets/' + meeting.agendaFileId"
										target="_blank"
										class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase border border-divider hover:border-gold hover:text-gold-dark transition-all duration-300">
										<UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5" />
										Agenda
									</a>
									<a
										v-if="meeting.minutesFileId"
										:href="'https://admin.1033lenox.com/assets/' + meeting.minutesFileId"
										target="_blank"
										class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider uppercase border border-divider hover:border-gold hover:text-gold-dark transition-all duration-300">
										<UIcon name="i-heroicons-clipboard-document-list" class="w-3.5 h-3.5" />
										Minutes
									</a>
								</div>
							</div>
						</div>
					</div>

					<div v-else class="text-center py-10 bg-white border border-divider">
						<UIcon name="i-heroicons-calendar" class="w-8 h-8 text-gray-300 mx-auto mb-3" />
						<p class="font-serif text-gray-500">No meeting documents available</p>
					</div>
				</div>

				<!-- Financial Reports Section -->
				<div v-if="activeCategory === 'all' || activeCategory === 'financial'" class="document-section mb-16">
					<div class="section-header mb-8 opacity-0">
						<div class="flex items-center gap-3 mb-2">
							<UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-gold-dark" />
							<p class="text-xs tracking-[0.3em] uppercase text-gold-dark">Financial</p>
						</div>
						<h2 class="font-serif text-2xl font-light text-gray-800">Financial Reports</h2>
						<div class="w-12 h-px bg-gold mt-3"></div>
					</div>

					<div v-if="financialReports.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<a
							v-for="(report, index) in financialReports"
							:key="'report-' + index"
							:href="'https://admin.1033lenox.com/assets/' + report.fileId"
							target="_blank"
							class="document-card group block bg-white p-5 border border-divider hover:border-gold transition-all duration-300 opacity-0">
							<div class="flex items-center gap-4">
								<div
									class="flex-shrink-0 w-10 h-10 rounded-full border border-divider group-hover:border-gold group-hover:bg-gold flex items-center justify-center transition-all duration-300">
									<UIcon
										name="i-heroicons-chart-bar"
										class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
								</div>
								<div class="flex-1 min-w-0">
									<h3
										class="font-serif text-base font-normal text-gray-800 leading-snug group-hover:text-gold-dark transition-colors duration-300 truncate">
										{{ report.title }}
									</h3>
									<p class="text-xs text-gray-500 mt-1">
										<span v-if="report.categoryLabel" class="text-gold-dark">{{ report.categoryLabel }}</span>
										<span v-if="report.categoryLabel && report.year"> · </span>
										<span v-if="report.year">{{ report.year }}</span>
									</p>
								</div>
								<span class="text-[10px] tracking-[0.15em] uppercase text-gold-dark flex-shrink-0">
									{{ report.fileType ? report.fileType.split('/').pop() : 'PDF' }}
								</span>
							</div>
						</a>
					</div>

					<div v-else class="text-center py-10 bg-white border border-divider">
						<UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-gray-300 mx-auto mb-3" />
						<p class="font-serif text-gray-500">No financial reports available</p>
					</div>
				</div>

			</div>
		</section>
	</div>
</template>

<script setup>
import {onMounted, onUnmounted} from 'vue';
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
// The 'documents' collection may not exist yet in Directus.
// When created, it should have: title, description, file (M2O to directus_files), status, category, sort
const documentsCollection = useDirectusItems('documents');
let rawDocuments = [];
try {
	rawDocuments = await documentsCollection.list({
		fields: ['id', 'title', 'description', 'status', 'category', 'file.id', 'file.title', 'file.type', 'sort'],
		filter: {status: {_eq: 'published'}},
		sort: ['sort', '-date_created'],
	});
} catch (e) {
	// Collection may not exist yet - that's OK
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
	{id: 'all', label: 'All Documents', count: generalDocuments.value.length + meetingDocuments.value.length + financialReports.value.length},
	{id: 'general', label: 'General', count: generalDocuments.value.length},
	{id: 'meetings', label: 'Meeting Documents', count: meetingDocuments.value.length},
	{id: 'financial', label: 'Financial Reports', count: financialReports.value.length},
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

// Track category changes
watch(activeCategory, (newCat) => {
	analytics.trackEvent('documents_category_filter', {
		category: newCat,
	});
});

let ctx;

onMounted(() => {
	ctx = gsap.context(() => {
		gsap.fromTo('.page-header', {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2});

		gsap.fromTo('.section-header', {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.3, stagger: 0.15});

		const cards = document.querySelectorAll('.document-card');
		cards.forEach((card, index) => {
			gsap.fromTo(
				card,
				{opacity: 0, y: 15},
				{
					opacity: 1,
					y: 0,
					duration: 0.5,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: card,
						start: 'top 92%',
						toggleActions: 'play none none none',
					},
					delay: (index % 4) * 0.06,
				}
			);
		});
	});
});

onUnmounted(() => {
	if (ctx) ctx.revert();
});
</script>

<style scoped>
@reference "~/assets/css/tailwind.css";

.documents-page {
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

.category-btn {
	min-width: fit-content;
}
</style>
