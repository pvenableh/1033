export interface ChatConfig {
	/** Would you like to enable the chat / messenger widget on the site? */
	enabled?: boolean | null;
	hours?: {[key: string]: any} | null;
	id?: string;
	modules?: {[key: string]: any} | null;
	require_email?: string | null;
}
