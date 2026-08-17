/**
 * GET /api/public/before-after
 *
 * Image ids for the public "Before & After" gallery on /feed.
 *
 * Needed because directus_files is a system collection: the generic
 * /api/directus/items route refuses those for unauthenticated callers, so the
 * page could only ever render images for a logged-in visitor. The folder id is
 * fixed here rather than taken from the query so this can't be used to
 * enumerate other folders, and only ids and dimensions are returned.
 */
import { useDirectusAdmin, getPublicDirectus, readFiles } from '~/server/utils/directus';

const FOLDER_ID = 'bb79dc04-20bc-444a-b790-ce74cfde9be4';

export interface GalleryImage {
	id: string;
	width: number | null;
	height: number | null;
	title: string | null;
}

export default defineEventHandler(async () => {
	let client;
	try {
		client = useDirectusAdmin();
	} catch {
		client = getPublicDirectus();
	}

	try {
		const rows = (await client.request(
			readFiles({
				fields: ['id', 'width', 'height', 'title', 'type'],
				filter: {
					folder: { _eq: FOLDER_ID },
					// Sibling `type` keys would overwrite each other, so both
					// conditions have to live inside _and.
					_and: [{ type: { _contains: 'image' } }, { type: { _ncontains: 'heic' } }],
				},
				sort: ['-uploaded_on'],
				limit: -1,
			} as any)
		)) as any[];

		return (rows || []).map<GalleryImage>((f) => ({
			id: f.id,
			width: f.width ?? null,
			height: f.height ?? null,
			title: f.title ?? null,
		}));
	} catch (error) {
		console.error('Fetch before/after gallery error:', error);
		// Degrade to an empty gallery rather than failing a public page.
		return [];
	}
});
