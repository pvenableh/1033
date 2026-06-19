/**
 * usePolls — public community polls.
 *
 * Listing is public (open/closed polls, never drafts). Voting and results go
 * through dedicated server endpoints that handle cookie/IP/person dedup.
 */

export interface PollOption {
  id: string;
  label: string;
  sort?: number;
}

export interface Poll {
  id: string;
  status: 'draft' | 'open' | 'closed';
  question: string;
  description: string | null;
  category: string | null;
  closes_at: string | null;
  options: PollOption[];
}

export interface PollResults {
  counts: Record<string, number>;
  total: number;
  alreadyVoted: boolean;
  votedOption: string | null;
}

export function usePolls() {
  const polls = useDirectusItems<Poll>('polls', { requireAuth: false });

  /** Open + closed polls (drafts excluded), with their options. */
  const listVisible = async (category?: string | null): Promise<Poll[]> => {
    const filter: Record<string, any> = { status: { _in: ['open', 'closed'] } };
    if (category) filter.category = { _eq: category };
    return await polls.list({
      filter,
      fields: ['id', 'status', 'question', 'description', 'category', 'closes_at', 'options.id', 'options.label', 'options.sort'],
      sort: ['sort', '-date_created'],
      limit: 50,
    });
  };

  /** Current results + whether this browser already voted. */
  const getResults = async (pollId: string): Promise<PollResults> => {
    return await $fetch<PollResults>('/api/polls/results', { params: { poll: pollId } });
  };

  /**
   * Cast a vote. Passing the submitter email (if known) upgrades dedup to
   * per-resident. Throws a 409 with results in error.data if already voted.
   */
  const vote = async (pollId: string, optionId: string, email?: string): Promise<PollResults> => {
    return await $fetch<PollResults>('/api/polls/vote', {
      method: 'POST',
      body: { poll: pollId, option: optionId, email },
    });
  };

  return { listVisible, getResults, vote };
}
