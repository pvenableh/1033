/**
 * POST /api/admin/anomaly-review
 *
 * Reviews transactions for likely duplicates and anomalies, then (optionally)
 * asks Claude to triage the candidates and write a short rationale + severity
 * for each genuine concern.
 *
 * Pipeline:
 *   1. Deterministic candidate detection (cheap, always runs):
 *        - duplicates: same account + amount + date
 *        - amount outliers: withdrawals far above the category's typical size
 *        - existing fund-mixing / violation flags
 *   2. AI triage (optional): sends the candidates to Claude, which confirms
 *      which are real concerns and explains why.
 *
 * Read-only by default. With `flag: true`, concerning transactions (medium/high
 * severity) have their `review_status` set to 'flagged' for board follow-up.
 *
 * Body:
 *   - fiscal_year: number   — required
 *   - account_id?: string   — limit to one account
 *   - use_ai?: boolean      — run the Claude triage pass (default true)
 *   - model?: string        — Claude model selector ('sonnet' | 'opus' | 'haiku')
 *   - limit?: number        — max candidates sent to AI (default 80, max 150)
 *   - flag?: boolean        — write review_status='flagged' on concerns (default false)
 *
 * Requires admin/board member access.
 */
import {
	hasAdminAccess,
	useDirectusAdmin,
	readItems,
	updateItems,
} from '~/server/utils/directus';
import {
	isClaudeConfigured,
	callClaude,
	extractClaudeText,
	resolveExtractionModel,
} from '~/server/utils/claude';

defineRouteMeta({ maxDuration: 60 });
export const config = { maxDuration: 60 };

type Severity = 'low' | 'medium' | 'high';

interface AnomalyFinding {
	transaction_id: number;
	date: string;
	description: string;
	vendor: string;
	amount: number;
	type: string;
	detected_by: string; // 'duplicate' | 'outlier' | 'violation' | combos
	concern: boolean;
	severity: Severity;
	reason: string;
	flagged: boolean;
}

interface AnomalyResult {
	success: boolean;
	fiscal_year: number;
	scanned: number;
	candidates: number;
	concerns: number;
	flagged: number;
	ai_used: boolean;
	ai_model_used?: string;
	ai_token_usage?: { input: number; output: number };
	findings: AnomalyFinding[];
	errors: string[];
}

export default defineEventHandler(async (event): Promise<AnomalyResult> => {
	const session = await getUserSession(event);
	if (!session?.user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Authentication required' });
	}
	if (!hasAdminAccess(session)) {
		throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Admin access required' });
	}

	const body = await readBody(event);
	const fiscalYear = body?.fiscal_year;
	const accountId = body?.account_id || null;
	const useAi = body?.use_ai !== false;
	const aiLimit = Math.min(Math.max(Number(body?.limit) || 80, 1), 150);
	const flag = body?.flag === true;

	if (!fiscalYear) {
		throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'fiscal_year is required' });
	}

	const client = useDirectusAdmin();

	const result: AnomalyResult = {
		success: true,
		fiscal_year: fiscalYear,
		scanned: 0,
		candidates: 0,
		concerns: 0,
		flagged: 0,
		ai_used: false,
		findings: [],
		errors: [],
	};

	try {
		const txFilter: any = { fiscal_year: { year: { _eq: fiscalYear } } };
		if (accountId) txFilter.account_id = { _eq: accountId };

		const transactions = await client.request(
			readItems('transactions', {
				filter: txFilter,
				fields: [
					'id', 'transaction_date', 'description', 'vendor', 'amount',
					'transaction_type', 'account_id', 'category_id.category_name',
					'is_violation', 'violation_type', 'review_status',
				],
				sort: ['transaction_date'],
				limit: -1,
			})
		);
		result.scanned = transactions.length;

		// --- 1. Deterministic candidate detection ---
		const candidates = new Map<number, { tx: any; reasons: Set<string> }>();
		const addCandidate = (tx: any, reason: string) => {
			let c = candidates.get(tx.id);
			if (!c) {
				c = { tx, reasons: new Set() };
				candidates.set(tx.id, c);
			}
			c.reasons.add(reason);
		};

		// Duplicates: same account + amount + date
		const dupGroups = new Map<string, any[]>();
		for (const tx of transactions) {
			const acct = typeof tx.account_id === 'object' ? tx.account_id?.id : tx.account_id;
			const amount = Math.abs(parseFloat(tx.amount) || 0);
			if (amount === 0) continue;
			const key = `${acct}|${amount.toFixed(2)}|${tx.transaction_date}`;
			if (!dupGroups.has(key)) dupGroups.set(key, []);
			dupGroups.get(key)!.push(tx);
		}
		for (const group of dupGroups.values()) {
			if (group.length > 1) group.forEach((tx) => addCandidate(tx, 'duplicate'));
		}

		// Outliers: per-category median of withdrawal sizes; flag >5x median and >$1000
		const byCategory = new Map<string, number[]>();
		for (const tx of transactions) {
			if (tx.transaction_type !== 'withdrawal') continue;
			const cat = (typeof tx.category_id === 'object' ? tx.category_id?.category_name : '') || 'uncategorized';
			const amount = Math.abs(parseFloat(tx.amount) || 0);
			if (!byCategory.has(cat)) byCategory.set(cat, []);
			byCategory.get(cat)!.push(amount);
		}
		const medianByCategory = new Map<string, number>();
		for (const [cat, amounts] of byCategory) {
			const sorted = [...amounts].sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
			medianByCategory.set(cat, median);
		}
		for (const tx of transactions) {
			if (tx.transaction_type !== 'withdrawal') continue;
			const cat = (typeof tx.category_id === 'object' ? tx.category_id?.category_name : '') || 'uncategorized';
			const amount = Math.abs(parseFloat(tx.amount) || 0);
			const median = medianByCategory.get(cat) || 0;
			if (median > 0 && amount > median * 5 && amount > 1000) {
				addCandidate(tx, 'outlier');
			}
		}

		// Existing violation/fund-mixing flags
		for (const tx of transactions) {
			if (tx.is_violation) addCandidate(tx, 'violation');
		}

		result.candidates = candidates.size;

		// Seed findings from deterministic detection (default severity by signal)
		const candidateList = Array.from(candidates.values());
		const findingsById = new Map<number, AnomalyFinding>();
		for (const { tx, reasons } of candidateList) {
			const detectedBy = Array.from(reasons).join('+');
			// Without AI, treat duplicates/violations as medium concerns, outliers as low
			const baseSeverity: Severity = reasons.has('duplicate') || reasons.has('violation') ? 'medium' : 'low';
			findingsById.set(tx.id, {
				transaction_id: tx.id,
				date: tx.transaction_date || '',
				description: tx.description || '',
				vendor: tx.vendor || '',
				amount: Math.abs(parseFloat(tx.amount) || 0),
				type: tx.transaction_type || '',
				detected_by: detectedBy,
				concern: !useAi, // if no AI triage, surface all candidates as concerns
				severity: baseSeverity,
				reason: reasons.has('duplicate')
					? 'Same account, amount, and date as another transaction — possible double entry.'
					: reasons.has('violation')
						? `Flagged: ${tx.violation_type || 'policy violation'}.`
						: 'Unusually large for its category.',
				flagged: false,
			});
		}

		// --- 2. AI triage (optional) ---
		if (useAi && candidateList.length > 0) {
			if (!isClaudeConfigured()) {
				result.errors.push('AI triage requested but ANTHROPIC_API_KEY is not configured. Returning deterministic candidates.');
				for (const f of findingsById.values()) f.concern = true;
			} else {
				try {
					await runAiTriage({
						candidates: candidateList.slice(0, aiLimit),
						medianByCategory,
						model: resolveExtractionModel(body?.model),
						result,
						findingsById,
					});
					if (candidateList.length > aiLimit) {
						result.errors.push(
							`AI triage reviewed the first ${aiLimit} of ${candidateList.length} candidates. Narrow by account or run again.`
						);
					}
				} catch (aiErr: any) {
					result.errors.push(`AI triage failed: ${aiErr.message}. Returning deterministic candidates.`);
					for (const f of findingsById.values()) f.concern = true;
				}
			}
		}

		result.findings = Array.from(findingsById.values());
		result.concerns = result.findings.filter((f) => f.concern).length;

		// --- 3. Optional flagging ---
		if (flag) {
			const toFlag = result.findings.filter((f) => f.concern && (f.severity === 'high' || f.severity === 'medium'));
			if (toFlag.length > 0) {
				try {
					await client.request(
						updateItems('transactions', toFlag.map((f) => f.transaction_id), { review_status: 'flagged' })
					);
					toFlag.forEach((f) => (f.flagged = true));
					result.flagged = toFlag.length;
				} catch (err: any) {
					result.errors.push(`Failed to flag transactions: ${err.message}`);
				}
			}
		}

		// Sort: concerns first, then by severity, then amount
		const sevRank: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
		result.findings.sort((a, b) => {
			if (a.concern !== b.concern) return a.concern ? -1 : 1;
			if (sevRank[a.severity] !== sevRank[b.severity]) return sevRank[b.severity] - sevRank[a.severity];
			return b.amount - a.amount;
		});

		return result;
	} catch (err: any) {
		console.error('Anomaly-review error:', err);
		throw createError({
			statusCode: 500,
			statusMessage: 'Internal Server Error',
			message: `Anomaly review failed: ${err.message}`,
		});
	}
});

/**
 * Ask Claude to triage deterministic candidates: confirm genuine concerns and
 * write a one-line rationale + severity for each. Mutates `result` and the
 * findings map in place.
 */
async function runAiTriage(opts: {
	candidates: Array<{ tx: any; reasons: Set<string> }>;
	medianByCategory: Map<string, number>;
	model: string;
	result: AnomalyResult;
	findingsById: Map<number, AnomalyFinding>;
}): Promise<void> {
	const { candidates, medianByCategory, model, result, findingsById } = opts;

	const lines = candidates
		.map(({ tx, reasons }) => {
			const cat = (typeof tx.category_id === 'object' ? tx.category_id?.category_name : '') || 'uncategorized';
			return JSON.stringify({
				id: tx.id,
				date: tx.transaction_date || '',
				description: tx.description || '',
				vendor: tx.vendor || '',
				amount: Math.abs(parseFloat(tx.amount) || 0),
				type: tx.transaction_type || '',
				category: cat,
				category_median: Math.round(medianByCategory.get(cat) || 0),
				signals: Array.from(reasons),
			});
		})
		.join('\n');

	const systemPrompt = `You are an auditor for 1033 Lenox Park, a condominium HOA in Miami Beach, FL. You review flagged bank transactions and decide which are genuine concerns a board treasurer should investigate.

Concerns include: duplicate/double payments, unusually large payments for their category, payments to the wrong fund (fund mixing), and miscategorized or suspicious entries. Many flagged items are legitimate (e.g., a large annual insurance premium, or two same-day payments to different real payees). Use judgment.

For each transaction return:
- concern: true only if a treasurer should actually investigate it
- severity: "low" | "medium" | "high"
- reason: one concise sentence explaining the concern (or why it's fine)

Return ONLY a JSON object, no markdown fences.`;

	const userPrompt = `Candidate transactions (one JSON object per line; "signals" shows why it was pre-flagged):
${lines}

Return JSON of this exact shape:
{"reviews": [{"id": <id>, "concern": <true|false>, "severity": "low|medium|high", "reason": "<one sentence>"}]}

Include one entry for every id above.`;

	const response = await callClaude({
		system: systemPrompt,
		messages: [{ role: 'user', content: userPrompt }],
		model,
		maxTokens: 4096,
	});

	result.ai_used = true;
	result.ai_model_used = response.model || model;
	result.ai_token_usage = { input: response.usage.input_tokens, output: response.usage.output_tokens };

	let text = extractClaudeText(response).trim();
	if (text.startsWith('```')) {
		text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
	}
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		result.errors.push('AI triage returned no parseable JSON; showing deterministic candidates.');
		for (const f of findingsById.values()) f.concern = true;
		return;
	}
	let parsed: any;
	try {
		parsed = JSON.parse(jsonMatch[0]);
	} catch {
		result.errors.push('AI triage returned invalid JSON; showing deterministic candidates.');
		for (const f of findingsById.values()) f.concern = true;
		return;
	}

	const reviews: any[] = Array.isArray(parsed) ? parsed : parsed.reviews || [];
	const validSeverities: Severity[] = ['low', 'medium', 'high'];
	for (const r of reviews) {
		const id = Number(r?.id);
		const finding = findingsById.get(id);
		if (!finding) continue;
		finding.concern = r?.concern === true;
		if (validSeverities.includes(r?.severity)) finding.severity = r.severity;
		if (typeof r?.reason === 'string' && r.reason.trim()) finding.reason = r.reason.trim();
	}
}
