/**
 * POST /api/ai/generate-tasks
 *
 * Uses Claude to generate a to-do list for the logged-in user
 * and optionally a financial summary based on current data.
 *
 * Request body:
 * {
 *   include_financial_summary?: boolean
 *   context?: string  // optional additional context
 * }
 */

import { callClaude, extractClaudeText, isClaudeConfigured } from '~/server/utils/claude'
import { useDirectusAdmin, readItems } from '~/server/utils/directus'

// Extend Vercel timeout for AI endpoints (Hobby plan max: 60s)
export const config = {
  maxDuration: 60,
}

export default defineEventHandler(async (event) => {
  // Check Claude is configured
  if (!isClaudeConfigured()) {
    throw createError({
      statusCode: 503,
      message: 'AI service is not configured',
    })
  }

  // Require authentication
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }

  const body = await readBody(event)
  const includeFinancial = body.include_financial_summary === true
  const additionalContext = body.context || ''

  const client = useDirectusAdmin()
  const userId = session.user.id
  const userName = `${session.user.first_name || ''} ${session.user.last_name || ''}`.trim()

  // Gather context data in parallel
  const [openTasks, openRequests, activeProjects, recentAnnouncements] = await Promise.all([
    // Current open tasks assigned to user
    client.request(
      readItems('tasks', {
        filter: {
          status: { _eq: 'published' },
          assigned_to: { _eq: userId },
          task_status: { _in: ['open', 'in_progress', 'on_hold'] },
        },
        fields: ['id', 'title', 'task_status', 'priority', 'due_date', 'category'],
        sort: ['-priority', 'due_date'],
        limit: 25,
      } as any)
    ).catch(() => []),

    // Open requests that need attention
    client.request(
      readItems('requests', {
        filter: {
          status: { _in: ['new', 'in progress'] },
        },
        fields: ['id', 'status', 'category', 'priority', 'subject', 'name', 'date_created'],
        sort: ['-date_created'],
        limit: 15,
      } as any)
    ).catch(() => []),

    // Active projects
    client.request(
      readItems('projects', {
        filter: {
          status: { _eq: 'published' },
          actual_end_date: { _null: true },
        },
        fields: ['id', 'name', 'start_date', 'target_end_date'],
        sort: ['target_end_date'],
        limit: 10,
      } as any)
    ).catch(() => []),

    // Recent announcements
    client.request(
      readItems('announcements', {
        filter: {
          status: { _eq: 'sent' },
        },
        fields: ['id', 'title', 'date_sent'],
        sort: ['-date_sent'],
        limit: 5,
      } as any)
    ).catch(() => []),
  ])

  // Build financial context if requested
  let financialContext = ''
  if (includeFinancial) {
    try {
      const [transactions, budgetItems, accounts] = await Promise.all([
        client.request(
          readItems('transactions', {
            filter: {
              status: { _eq: 'published' },
              fiscal_year: { _eq: new Date().getFullYear() },
            },
            fields: ['id', 'transaction_date', 'description', 'amount', 'transaction_type'],
            sort: ['-transaction_date'],
            limit: 50,
          } as any)
        ).catch(() => []),

        client.request(
          readItems('budget_items', {
            filter: {
              status: { _eq: 'published' },
              fiscal_year: { _eq: new Date().getFullYear() },
            },
            fields: ['description', 'yearly_budget'],
            limit: 30,
          } as any)
        ).catch(() => []),

        client.request(
          readItems('accounts', {
            filter: { status: { _eq: 'published' } },
            fields: ['account_name', 'account_type'],
          } as any)
        ).catch(() => []),
      ])

      // Calculate totals
      const totalExpenses = (transactions as any[])
        .filter((t: any) => t.transaction_type === 'withdrawal')
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0)

      const totalIncome = (transactions as any[])
        .filter((t: any) => t.transaction_type === 'deposit')
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0)

      const totalBudgeted = (budgetItems as any[])
        .reduce((sum: number, b: any) => sum + (b.yearly_budget || 0), 0)

      financialContext = `
FINANCIAL DATA (${new Date().getFullYear()}):
- Accounts: ${(accounts as any[]).map((a: any) => `${a.account_name} (${a.account_type})`).join(', ')}
- YTD Income: $${totalIncome.toLocaleString()}
- YTD Expenses: $${totalExpenses.toLocaleString()}
- Net: $${(totalIncome - totalExpenses).toLocaleString()}
- Annual Budget: $${totalBudgeted.toLocaleString()}
- Budget Utilization: ${totalBudgeted > 0 ? Math.round((totalExpenses / totalBudgeted) * 100) : 0}%
`
    } catch (e) {
      financialContext = '\nFinancial data could not be loaded.\n'
    }
  }

  // Build the prompt
  const systemPrompt = `You are an AI assistant for 1033 Lenox Park, a condominium association. Generate a concise JSON response with actionable tasks.

Respond ONLY with valid JSON:
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "low|medium|high|urgent",
      "category": "maintenance|follow_up|inspection|communication|financial|administrative|other",
      "suggested_due_date": "YYYY-MM-DD"
    }
  ],
  "financial_summary": "string or null"
}`

  const userMessage = `Generate a to-do list for ${userName}. Today: ${new Date().toISOString().split('T')[0]}

OPEN TASKS (${(openTasks as any[]).length}):
${(openTasks as any[]).map((t: any) => `- [${t.task_status}] ${t.title} (P: ${t.priority || '-'}, Due: ${t.due_date || '-'})`).join('\n') || 'None'}

REQUESTS (${(openRequests as any[]).length}):
${(openRequests as any[]).map((r: any) => `- [${r.status}] ${r.subject} (${r.category || '-'}, P: ${r.priority || '-'}, From: ${r.name || '?'})`).join('\n') || 'None'}

PROJECTS (${(activeProjects as any[]).length}):
${(activeProjects as any[]).map((p: any) => `- ${p.name} (End: ${p.target_end_date || '-'})`).join('\n') || 'None'}

ANNOUNCEMENTS:
${(recentAnnouncements as any[]).map((a: any) => `- ${a.title} (${a.date_sent})`).join('\n') || 'None'}
${financialContext}${additionalContext ? `\nCONTEXT: ${additionalContext}` : ''}

Do not duplicate existing tasks. Focus on gaps and actionable items.`

  try {
    const response = await callClaude({
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 4096,
    })

    const text = extractClaudeText(response)

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const result = JSON.parse(jsonMatch[0])

    return {
      success: true,
      tasks: result.tasks || [],
      financial_summary: includeFinancial ? (result.financial_summary || null) : null,
      usage: response.usage,
    }
  } catch (e: any) {
    console.error('AI task generation error:', e)
    throw createError({
      statusCode: 500,
      message: e.message || 'Failed to generate tasks',
    })
  }
})
