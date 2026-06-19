/**
 * useIdeas — public community-ideas board.
 *
 * Reads are public (status = published only, enforced server-side). Submission
 * goes through the public items endpoint, which forces status=pending and
 * re-verifies the resident match server-side — so nothing here is trusted for
 * moderation/verification; the server is the authority.
 */

export interface IdeaImage {
  directus_files_id: string | { id: string };
}

export interface Idea {
  id: string;
  status: string;
  title: string;
  category: string | null;
  description: string;
  name: string | null;
  unit_number: string | null;
  verified_resident: boolean;
  images?: IdeaImage[];
  date_created: string;
}

export interface IdeaSubmission {
  name: string;
  email: string;
  unit_number?: string;
  category: string;
  title: string;
  description: string;
}

export interface ResidentMatch {
  matched: boolean;
  person_id?: number;
  first_name?: string;
  last_name?: string;
  unit_id?: number | null;
  unit_number?: string;
}

// Keep these in sync with IDEA_CATEGORIES in scripts/setup-ideas.mjs
export const IDEA_CATEGORIES = [
  'Lobby',
  'Rooftop',
  'Gym / Fitness',
  'Pool Deck',
  'Co-work Space',
  'Bike / Storage',
  'Lounge / Social',
  'Other',
];

export function useIdeas() {
  // requireAuth: false → routed through the public (admin-token) path server-side
  const ideas = useDirectusItems<Idea>('ideas', { requireAuth: false });

  /** Look up an email against the resident roster (for autofill + verified badge). */
  const lookupResident = async (email: string): Promise<ResidentMatch> => {
    try {
      return await $fetch<ResidentMatch>('/api/residents/lookup', {
        method: 'POST',
        body: { email },
      });
    } catch {
      return { matched: false };
    }
  };

  /** Upload image files; returns Directus file ids. */
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (!files.length) return [];
    const form = new FormData();
    files.forEach((f) => form.append('file', f));
    const result = await $fetch<any[]>('/api/ideas/upload', { method: 'POST', body: form });
    return (Array.isArray(result) ? result : [result]).map((f) => f.id);
  };

  /** Submit a new idea (uploads images first, then creates the pending record). */
  const submit = async (data: IdeaSubmission, files: File[] = []): Promise<Idea> => {
    const fileIds = await uploadImages(files);
    return await ideas.create({
      name: data.name,
      email: data.email,
      unit_number: data.unit_number || null,
      category: data.category,
      title: data.title,
      description: data.description,
      // o2m junction rows; server forces status/verification/person/unit
      images: fileIds.map((id) => ({ directus_files_id: id })),
    } as any);
  };

  /** The signed-in user's own submissions (all statuses, incl. pending). */
  const listMine = async (): Promise<Idea[]> => {
    return await $fetch<Idea[]>('/api/ideas/mine');
  };

  /** Published ideas for the public feed, newest first, optionally by category. */
  const listPublished = async (category?: string | null): Promise<Idea[]> => {
    const filter: Record<string, any> = { status: { _eq: 'published' } };
    if (category) filter.category = { _eq: category };
    return await ideas.list({
      filter,
      fields: [
        'id',
        'title',
        'category',
        'description',
        'name',
        'unit_number',
        'verified_resident',
        'date_created',
        'images.directus_files_id',
      ],
      sort: ['-date_created'],
      limit: 100,
    });
  };

  return { lookupResident, uploadImages, submit, listPublished, listMine };
}
