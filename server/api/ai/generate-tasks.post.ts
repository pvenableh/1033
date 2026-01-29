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
        fields: ['id', 'title', 'task_status', 'priority', 'due_date', 'category', 'related_collection', 'related_id'],
        sort: ['-priority', 'due_date'],
        limit: 50,
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
        limit: 30,
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
        limit: 20,
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
            fields: ['id', 'transaction_date', 'description', 'amount', 'transaction_type', 'vendor'],
            sort: ['-transaction_date'],
            limit: 100,
          } as any)
        ).catch(() => []),

        client.request(
          readItems('budget_items', {
            filter: {
              status: { _eq: 'published' },
              fiscal_year: { _eq: new Date().getFullYear() },
            },
            fields: ['item_code', 'description', 'monthly_budget', 'yearly_budget'],
            limit: 50,
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
- Recent transactions: ${(transactions as any[]).slice(0, 10).map((t: any) => `${t.transaction_date}: ${t.description} ($${Math.abs(t.amount || 0)})`).join('; ')}
`
    } catch (e) {
      financialContext = '\nFinancial data could not be loaded.\n'
    }
  }

  // Build the prompt
  const systemPrompt = `You are an AI assistant for 1033 Lenox Park, a condominium association. You help board members and staff manage tasks efficiently.

You will generate a structured JSON response with two sections:
1. "tasks" - A prioritized to-do list based on the current state of requests, projects, and existing tasks
2. "financial_summary" - A brief financial summary (only if financial data is provided)

For tasks, consider:
- Unresolved requests that need follow-up tasks created
- Overdue or approaching-deadline tasks that need attention
- Projects that may need check-ins or action items
- Routine administrative tasks based on the time of year
- Any gaps in current task coverage

Each task should have: title, description, priority (low/medium/high/urgent), category (maintenance/follow_up/inspection/communication/financial/administrative/other), and suggested_due_date (ISO format).

Respond ONLY with valid JSON in this format:
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "low|medium|high|urgent",
      "category": "maintenance|follow_up|inspection|communication|financial|administrative|other",
      "suggested_due_date": "YYYY-MM-DD",
      "related_collection": "string or null",
      "related_id": "string or null"
    }
  ],
  "financial_summary": "string or null"
}`

  const userMessage = `Generate a to-do list for ${userName} based on the following data:

CURRENT OPEN TASKS (${(openTasks as any[]).length}):
${(openTasks as any[]).map((t: any) => `- [${t.task_status}] ${t.title} (Priority: ${t.priority || 'none'}, Due: ${t.due_date || 'none'})`).join('\n') || 'No current tasks'}

OPEN REQUESTS (${(openRequests as any[]).length}):
${(openRequests as any[]).map((r: any) => `- [${r.status}] ${r.subject} (Category: ${r.category || 'none'}, Priority: ${r.priority || 'none'}, From: ${r.name || 'Unknown'}, Created: ${r.date_created || 'unknown'})`).join('\n') || 'No open requests'}

ACTIVE PROJECTS (${(activeProjects as any[]).length}):
${(activeProjects as any[]).map((p: any) => `- ${p.name} (Started: ${p.start_date}, Target End: ${p.target_end_date || 'none'})`).join('\n') || 'No active projects'}

RECENT ANNOUNCEMENTS:
${(recentAnnouncements as any[]).map((a: any) => `- ${a.title} (${a.date_sent})`).join('\n') || 'No recent announcements'}
${financialContext}
${additionalContext ? `\nADDITIONAL CONTEXT:\n${additionalContext}` : ''}

Today's date: ${new Date().toISOString().split('T')[0]}

Generate practical, actionable tasks. Do not duplicate existing open tasks. Focus on gaps and items that need attention.`

  try {
    const response = await callClaude({
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
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
