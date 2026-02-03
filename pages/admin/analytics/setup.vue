<script setup lang="ts">
definePageMeta({
	layout: 'default',
	middleware: ['auth', 'role'],
});

useSeoMeta({
	title: 'Analytics Setup Guide - Admin',
	description: 'Learn how to set up and configure Google Analytics 4 dashboards for comprehensive tracking',
});

const {isAdmin, isBoardMember} = useRoles();

const canAccessAnalytics = computed(() => isAdmin.value || isBoardMember.value);

const sections = [
	{
		id: 'api-setup',
		title: 'GA4 Data API Setup',
		icon: 'i-heroicons-server',
	},
	{
		id: 'events',
		title: 'Events Being Tracked',
		icon: 'i-heroicons-cursor-arrow-rays',
	},
	{
		id: 'ga4-setup',
		title: 'GA4 Dashboard Setup',
		icon: 'i-heroicons-chart-bar',
	},
	{
		id: 'custom-reports',
		title: 'Custom Reports',
		icon: 'i-heroicons-document-chart-bar',
	},
	{
		id: 'conversions',
		title: 'Conversion Tracking',
		icon: 'i-heroicons-flag',
	},
	{
		id: 'code-usage',
		title: 'Code Usage Examples',
		icon: 'i-heroicons-code-bracket',
	},
];

const activeSection = ref('api-setup');

const trackedEvents = [
	{
		event: 'page_view',
		description: 'Tracks every page navigation',
		parameters: ['page_title', 'page_location', 'page_path', 'page_referrer'],
		automatic: true,
	},
	{
		event: 'scroll',
		description: 'Tracks scroll depth at 25%, 50%, 75%, 90%, 100%',
		parameters: ['percent_scrolled', 'page_path', 'page_title'],
		automatic: true,
	},
	{
		event: 'click',
		description: 'Tracks clicks on buttons, links, and elements with data-track',
		parameters: ['element_id', 'element_text', 'element_type', 'link_url', 'outbound'],
		automatic: true,
	},
	{
		event: 'outbound_click',
		description: 'Tracks clicks to external websites',
		parameters: ['link_url', 'link_domain', 'page_path'],
		automatic: true,
	},
	{
		event: 'form_start',
		description: 'Tracks when a user first interacts with a form',
		parameters: ['form_id', 'form_name', 'form_length'],
		automatic: true,
	},
	{
		event: 'form_submit',
		description: 'Tracks successful form submissions',
		parameters: ['form_id', 'form_name', 'total_time_ms', 'completion_rate'],
		automatic: true,
	},
	{
		event: 'form_abandon',
		description: 'Tracks when users leave without submitting',
		parameters: ['form_id', 'completed_fields', 'last_field'],
		automatic: false,
	},
	{
		event: 'user_engagement',
		description: 'Tracks active time on page (every 30 seconds)',
		parameters: ['engagement_time_msec', 'total_time_on_page'],
		automatic: true,
	},
	{
		event: 'timing_complete',
		description: 'Tracks total time spent on a page',
		parameters: ['name', 'value', 'page_path'],
		automatic: true,
	},
	{
		event: 'navigation',
		description: 'Tracks user navigation flow between pages',
		parameters: ['from_page', 'to_page', 'navigation_method'],
		automatic: true,
	},
	{
		event: 'view_item',
		description: 'Tracks when content enters the viewport',
		parameters: ['content_id', 'content_type', 'visibility_percent'],
		automatic: false,
	},
	{
		event: 'file_download',
		description: 'Tracks file downloads',
		parameters: ['file_name', 'file_extension'],
		automatic: false,
	},
	{
		event: 'search',
		description: 'Tracks site search queries',
		parameters: ['search_term', 'search_results'],
		automatic: false,
	},
	{
		event: 'cta_click',
		description: 'Tracks call-to-action button clicks',
		parameters: ['cta_name', 'cta_location'],
		automatic: false,
	},
	{
		event: 'conversion',
		description: 'Tracks goal completions',
		parameters: ['conversion_name', 'value'],
		automatic: false,
	},
	{
		event: 'user_identified',
		description: 'Tracks when a user is identified (login/session restore)',
		parameters: ['user_id', 'user_email', 'method'],
		automatic: true,
	},
	{
		event: 'user_logout',
		description: 'Tracks when a user logs out',
		parameters: ['user_id'],
		automatic: true,
	},
];

const codeExamples = [
	{
		title: 'Basic Event Tracking',
		description: 'Track a simple custom event',
		code: `<script setup>
const analytics = useAnalytics();

function handleButtonClick() {
  analytics.trackEvent('button_click', {
    button_name: 'subscribe',
    button_location: 'header'
  });
}
<\/script>`,
	},
	{
		title: 'Click Tracking Directive',
		description: 'Use the v-track-click directive for declarative tracking',
		code: `<template>
  <!-- Simple label -->
  <button v-track-click="'signup_button'">
    Sign Up
  </button>

  <!-- Custom event with parameters -->
  <button v-track-click="{
    event: 'cta_click',
    label: 'Get Started',
    category: 'homepage'
  }">
    Get Started
  </button>
</template>`,
	},
	{
		title: 'Form Analytics',
		description: 'Track detailed form interactions',
		code: `<script setup>
const formAnalytics = useFormAnalytics({
  formId: 'contact-form',
  formName: 'Contact Form',
  trackFieldInteractions: true,
  trackValidationErrors: true,
  trackAbandonmentOnUnload: true
});

function handleFocus(fieldName: string) {
  formAnalytics.trackFieldFocus(fieldName, 'text');
}

function handleBlur(fieldName: string, hasValue: boolean) {
  formAnalytics.trackFieldBlur(fieldName, hasValue);
}

function handleSubmit() {
  formAnalytics.trackFormSubmit({
    submission_type: 'contact'
  });
}
<\/script>`,
	},
	{
		title: 'View Tracking Directive',
		description: 'Track when elements come into view',
		code: `<template>
  <!-- Track section visibility -->
  <section v-track-view="'hero_section'">
    Hero Content
  </section>

  <!-- Track with custom parameters -->
  <div v-track-view="{
    content_id: 'feature-1',
    content_type: 'feature',
    content_name: 'AI Assistant'
  }">
    Feature Content
  </div>
</template>`,
	},
	{
		title: 'Outbound Link Tracking',
		description: 'Track clicks to external websites',
		code: `<script setup>
const analytics = useAnalytics();

function handleExternalLink(url: string) {
  analytics.trackOutboundLink(url, {
    link_text: 'View on GitHub'
  });
}
<\/script>`,
	},
	{
		title: 'File Download Tracking',
		description: 'Track document downloads',
		code: `<script setup>
const analytics = useAnalytics();

function handleDownload(fileName: string, fileType: string) {
  analytics.trackDownload(fileName, fileType, {
    document_category: 'financial_reports'
  });
}
<\/script>`,
	},
	{
		title: 'User Identification (Automatic)',
		description: 'Users are automatically identified when logged in. The analytics plugin tracks user_id, email, name, and role.',
		code: `// AUTOMATIC: No code needed!
// The analytics plugin automatically identifies users when:
// 1. User logs in (watches auth state)
// 2. App loads with existing session

// User properties tracked automatically:
// - user_id: Directus user ID
// - user_email: User's email address
// - user_name: Full name (first + last)
// - user_first_name: First name only
// - user_role: User's role in the system

// Events tracked:
// - user_identified: When user is identified
// - user_logout: When user logs out`,
	},
	{
		title: 'Manual User Identification',
		description: 'For custom user identification scenarios',
		code: `<script setup>
const analytics = useAnalytics();

// Identify user manually
analytics.identifyUser({
  id: 'user-123',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin'
});

// Clear identity on logout
analytics.clearUserIdentity();
<\/script>`,
	},
];
</script>

<template>
	<div class="admin-page bg-white dark:bg-gray-900 min-h-full">
		<div class="container mx-auto px-6 py-8">
			<!-- Header -->
			<div class="mb-8">
				<NuxtLink
					to="/admin/analytics"
					class="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 mb-4">
					<UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-2" />
					Back to Analytics
				</NuxtLink>
				<h1 class="text-2xl font-bold">Analytics Setup Guide</h1>
				<p class="text-gray-600 dark:text-gray-400 mt-2">
					Complete documentation for the analytics tracking system and GA4 dashboard configuration
				</p>
			</div>

			<div v-if="!canAccessAnalytics" class="text-center py-12">
				<UIcon name="i-heroicons-shield-exclamation" class="w-16 h-16 text-red-500 mx-auto mb-4" />
				<h2 class="text-xl font-semibold mb-2">Access Denied</h2>
				<p class="text-gray-600 dark:text-gray-400">You do not have permission to view analytics.</p>
			</div>

			<div v-else class="flex flex-col lg:flex-row gap-8">
				<!-- Sidebar Navigation -->
				<div class="lg:w-64 flex-shrink-0">
					<nav class="sticky top-24 space-y-1">
						<button
							v-for="section in sections"
							:key="section.id"
							class="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors"
							:class="
								activeSection === section.id
									? 'bg-primary-500 text-white'
									: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
							"
							@click="activeSection = section.id">
							<UIcon :name="section.icon" class="w-5 h-5 mr-3" />
							{{ section.title }}
						</button>
					</nav>
				</div>

				<!-- Main Content -->
				<div class="flex-1 max-w-4xl">
					<!-- GA4 Data API Setup -->
					<section v-show="activeSection === 'api-setup'" class="space-y-6">
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
							<h2 class="text-xl font-semibold mb-4">GA4 Data API Configuration</h2>
							<p class="text-gray-600 dark:text-gray-400 mb-6">
								Configure the Google Analytics 4 Data API to enable live analytics data in the dashboard.
								This allows the application to fetch metrics directly from GA4.
							</p>

							<div class="space-y-8">
								<!-- Step 1: Install Package -->
								<div>
									<h3 class="font-semibold text-lg mb-3 flex items-center">
										<span class="w-7 h-7 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center mr-3">1</span>
										Install the GA4 Data API Package
									</h3>
									<p class="text-gray-600 dark:text-gray-400 mb-3 ml-10">
										Install the official Google Analytics Data API client library:
									</p>
									<pre class="ml-10 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>npm install @google-analytics/data</code></pre>
								</div>

								<!-- Step 2: Create Service Account -->
								<div>
									<h3 class="font-semibold text-lg mb-3 flex items-center">
										<span class="w-7 h-7 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center mr-3">2</span>
										Create a Service Account in Google Cloud
									</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-10">
										<li>
											Go to
											<a href="https://console.cloud.google.com" target="_blank" class="text-primary-500 underline">
												Google Cloud Console
											</a>
										</li>
										<li>Create a new project or select an existing one</li>
										<li>Navigate to <strong>IAM & Admin &gt; Service Accounts</strong></li>
										<li>Click <strong>Create Service Account</strong></li>
										<li>Give it a name (e.g., "ga4-data-api")</li>
										<li>Skip the optional permissions step</li>
										<li>Click <strong>Done</strong> to create the account</li>
										<li>Click on the newly created service account</li>
										<li>Go to the <strong>Keys</strong> tab</li>
										<li>Click <strong>Add Key &gt; Create new key</strong></li>
										<li>Select <strong>JSON</strong> and click <strong>Create</strong></li>
										<li>Save the downloaded JSON file securely</li>
									</ol>
								</div>

								<!-- Step 3: Enable the API -->
								<div>
									<h3 class="font-semibold text-lg mb-3 flex items-center">
										<span class="w-7 h-7 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center mr-3">3</span>
										Enable the Google Analytics Data API
									</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-10">
										<li>
											Go to
											<a href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com" target="_blank" class="text-primary-500 underline">
												Analytics Data API
											</a>
											in Google Cloud Console
										</li>
										<li>Make sure you have the correct project selected</li>
										<li>Click <strong>Enable</strong></li>
									</ol>
								</div>

								<!-- Step 4: Add to GA4 -->
								<div>
									<h3 class="font-semibold text-lg mb-3 flex items-center">
										<span class="w-7 h-7 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center mr-3">4</span>
										Add Service Account to GA4 Property
									</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-10">
										<li>
											Go to
											<a href="https://analytics.google.com" target="_blank" class="text-primary-500 underline">
												Google Analytics
											</a>
										</li>
										<li>Navigate to <strong>Admin</strong> (gear icon at bottom left)</li>
										<li>Under Property, click <strong>Property Access Management</strong></li>
										<li>Click the <strong>+</strong> button and select <strong>Add users</strong></li>
										<li>
											Enter the service account email from the JSON file
											<br />
											<span class="text-sm text-gray-500">(looks like: name@project-id.iam.gserviceaccount.com)</span>
										</li>
										<li>Set the role to <strong>Viewer</strong></li>
										<li>Click <strong>Add</strong></li>
									</ol>
								</div>

								<!-- Step 5: Get Property ID -->
								<div>
									<h3 class="font-semibold text-lg mb-3 flex items-center">
										<span class="w-7 h-7 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center mr-3">5</span>
										Get Your GA4 Property ID
									</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-10">
										<li>In Google Analytics, go to <strong>Admin</strong></li>
										<li>Under Property, click <strong>Property Settings</strong></li>
										<li>The <strong>Property ID</strong> is shown at the top (e.g., 123456789)</li>
										<li>Note this ID for the next step</li>
									</ol>
								</div>

								<!-- Step 6: Set Environment Variables -->
								<div>
									<h3 class="font-semibold text-lg mb-3 flex items-center">
										<span class="w-7 h-7 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center mr-3">6</span>
										Set Environment Variables
									</h3>
									<p class="text-gray-600 dark:text-gray-400 mb-3 ml-10">
										Add the following variables to your <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env</code> file:
									</p>
									<pre class="ml-10 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code># Your GA4 Property ID (prefix with "properties/")
GA4_PROPERTY_ID=properties/123456789

# The full JSON credentials from the service account key file
# Option 1: Paste the entire JSON (escape quotes if needed)
GOOGLE_ANALYTICS_CREDENTIALS='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"ga4-api@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}'

# Option 2: Base64 encode the JSON file contents
# GOOGLE_ANALYTICS_CREDENTIALS_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...</code></pre>
								</div>

								<!-- Verification -->
								<div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
									<h4 class="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
										<UIcon name="i-heroicons-check-circle" class="w-5 h-5 mr-2" />
										Verification
									</h4>
									<p class="text-sm text-green-700 dark:text-green-300 mb-2">
										After completing the setup, restart your development server. The analytics dashboard
										should now display live data from GA4. If the API isn't configured correctly, the
										dashboard will show placeholder values ("-") instead of errors.
									</p>
									<p class="text-sm text-green-700 dark:text-green-300">
										Check the server console for any authentication errors if data isn't loading.
									</p>
								</div>

								<!-- Troubleshooting -->
								<div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
									<h4 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
										<UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 mr-2" />
										Troubleshooting
									</h4>
									<ul class="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
										<li>Ensure the Analytics Data API is enabled in Google Cloud Console</li>
										<li>Verify the service account email has access to the GA4 property</li>
										<li>Check that the Property ID includes the "properties/" prefix</li>
										<li>Make sure the JSON credentials are properly formatted (no line breaks except in private_key)</li>
										<li>Wait a few minutes after granting access for permissions to propagate</li>
									</ul>
								</div>
							</div>
						</div>
					</section>

					<!-- Events Being Tracked -->
					<section v-show="activeSection === 'events'" class="space-y-6">
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
							<h2 class="text-xl font-semibold mb-4">Events Being Tracked</h2>
							<p class="text-gray-600 dark:text-gray-400 mb-6">
								The following events are automatically tracked by the analytics system. Events marked as "automatic"
								are tracked without any additional code.
							</p>

							<div class="space-y-4">
								<div
									v-for="event in trackedEvents"
									:key="event.event"
									class="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
									<div class="flex items-start justify-between mb-2">
										<div class="flex items-center">
											<code class="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-sm font-mono text-primary-600 dark:text-primary-400">
												{{ event.event }}
											</code>
											<span
												v-if="event.automatic"
												class="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
												Automatic
											</span>
											<span
												v-else
												class="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
												Manual
											</span>
										</div>
									</div>
									<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ event.description }}</p>
									<div class="flex flex-wrap gap-1">
										<span
											v-for="param in event.parameters"
											:key="param"
											class="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded font-mono">
											{{ param }}
										</span>
									</div>
								</div>
							</div>
						</div>
					</section>

					<!-- GA4 Dashboard Setup -->
					<section v-show="activeSection === 'ga4-setup'" class="space-y-6">
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
							<h2 class="text-xl font-semibold mb-4">Setting Up GA4 Dashboards</h2>

							<div class="space-y-6">
								<div>
									<h3 class="font-semibold text-lg mb-3">Step 1: Access Google Analytics</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
										<li>
											Go to
											<a href="https://analytics.google.com" target="_blank" class="text-primary-500 underline">
												analytics.google.com
											</a>
										</li>
										<li>Select your property (G-JTR8V7XBN1)</li>
										<li>Navigate to the Reports section</li>
									</ol>
								</div>

								<div>
									<h3 class="font-semibold text-lg mb-3">Step 2: View Event Reports</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
										<li>Go to Reports &gt; Engagement &gt; Events</li>
										<li>You'll see all tracked events with their counts</li>
										<li>Click on any event to see detailed parameters</li>
									</ol>
								</div>

								<div>
									<h3 class="font-semibold text-lg mb-3">Step 3: Create Custom Explorations</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
										<li>Go to Explore in the left sidebar</li>
										<li>Click "Blank" to create a new exploration</li>
										<li>Add dimensions like "Event name", "Page path"</li>
										<li>Add metrics like "Event count", "Total users"</li>
										<li>Drag dimensions and metrics to the canvas</li>
									</ol>
								</div>

								<div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
									<h4 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">
										Recommended Explorations to Create:
									</h4>
									<ul class="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
										<li>Scroll Depth by Page - shows which pages have best engagement</li>
										<li>Form Funnel Analysis - tracks form start to completion</li>
										<li>Click Heatmap - shows most clicked elements</li>
										<li>User Flow - visualizes navigation patterns</li>
										<li>Time on Page Analysis - identifies engaging content</li>
									</ul>
								</div>
							</div>
						</div>
					</section>

					<!-- Custom Reports -->
					<section v-show="activeSection === 'custom-reports'" class="space-y-6">
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
							<h2 class="text-xl font-semibold mb-4">Creating Custom Reports</h2>

							<div class="space-y-6">
								<div>
									<h3 class="font-semibold text-lg mb-3">Scroll Depth Report</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
										<li>Create new Exploration</li>
										<li>Add dimension: "Event name" (filter to "scroll")</li>
										<li>Add dimension: "percent_scrolled" (custom parameter)</li>
										<li>Add dimension: "Page path"</li>
										<li>Add metric: "Event count"</li>
										<li>Use a pivot table visualization</li>
									</ol>
								</div>

								<div>
									<h3 class="font-semibold text-lg mb-3">Form Analytics Report</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
										<li>Create new Exploration</li>
										<li>Add dimension: "Event name" (filter to form_start, form_submit, form_abandon)</li>
										<li>Add dimension: "form_id" (custom parameter)</li>
										<li>Add metric: "Event count"</li>
										<li>Use a funnel visualization</li>
									</ol>
								</div>

								<div>
									<h3 class="font-semibold text-lg mb-3">User Engagement Report</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
										<li>Create new Exploration</li>
										<li>Add dimension: "Page path"</li>
										<li>Add metrics: "Average engagement time", "Engaged sessions"</li>
										<li>Sort by engagement time descending</li>
									</ol>
								</div>
							</div>
						</div>
					</section>

					<!-- Conversion Tracking -->
					<section v-show="activeSection === 'conversions'" class="space-y-6">
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
							<h2 class="text-xl font-semibold mb-4">Setting Up Conversions</h2>

							<div class="space-y-6">
								<div>
									<h3 class="font-semibold text-lg mb-3">Mark Events as Conversions</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
										<li>Go to Admin &gt; Events</li>
										<li>Find the event you want to mark as conversion</li>
										<li>Toggle the "Mark as conversion" switch</li>
									</ol>
								</div>

								<div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
									<h4 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
										Recommended Conversions:
									</h4>
									<ul class="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
										<li><code>form_submit</code> - Track form completions</li>
										<li><code>conversion</code> - Track custom goal completions</li>
										<li><code>file_download</code> - Track important document downloads</li>
										<li><code>cta_click</code> - Track key call-to-action clicks</li>
									</ul>
								</div>

								<div>
									<h3 class="font-semibold text-lg mb-3">Create Audiences</h3>
									<ol class="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
										<li>Go to Admin &gt; Audiences</li>
										<li>Click "New audience"</li>
										<li>Define conditions based on events (e.g., users who completed form_submit)</li>
										<li>Save and use for remarketing or analysis</li>
									</ol>
								</div>
							</div>
						</div>
					</section>

					<!-- Code Usage Examples -->
					<section v-show="activeSection === 'code-usage'" class="space-y-6">
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
							<h2 class="text-xl font-semibold mb-4">Code Usage Examples</h2>
							<p class="text-gray-600 dark:text-gray-400 mb-6">
								Use these examples to implement tracking in your components.
							</p>

							<div class="space-y-6">
								<div
									v-for="example in codeExamples"
									:key="example.title"
									class="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
									<div class="p-4 border-b border-gray-200 dark:border-gray-600">
										<h3 class="font-semibold">{{ example.title }}</h3>
										<p class="text-sm text-gray-600 dark:text-gray-400">{{ example.description }}</p>
									</div>
									<pre
										class="p-4 overflow-x-auto text-sm bg-gray-900 text-gray-100"><code>{{ example.code }}</code></pre>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	</div>
</template>
