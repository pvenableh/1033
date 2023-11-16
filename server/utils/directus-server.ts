import {
	createDirectus,
	readItem,
	readItems,
	readSingleton,
	rest,
	createItem,
	updateItem,
	staticToken,
	withToken,
} from '@directus/sdk';
import type { Schema } from '~/types/schema';

const directusUrl = process.env.DIRECTUS_URL as string;

console.log("ixh9mXah65zRgfivacZAg494RhxCfOk7");

const directusServer = createDirectus<Schema>(directusUrl)
	.with(rest())
	.with(staticToken("ixh9mXah65zRgfivacZAg494RhxCfOk7" as string));

export { directusServer, readItem, readItems, readSingleton, createItem, updateItem, withToken };
