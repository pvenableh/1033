module.exports = {
	// Match your .editorconfig tab preference
	useTabs: true,
	tabWidth: 2,

	// HTML/Vue whitespace settings
	htmlWhitespaceSensitivity: 'ignore',
	printWidth: 120,
	singleQuote: true,
	proseWrap: 'preserve', // Changed from 'always'

	// Vue-friendly settings
	bracketSameLine: true,
	bracketSpacing: false,
	trailingComma: 'es5',

	// File-specific overrides
	overrides: [
		{
			files: '*.vue',
			options: {
				// Prettier 3.x has built-in Vue support
				parser: 'vue',
				htmlWhitespaceSensitivity: 'ignore',
			},
		},
		{
			files: '*.{yml,yaml}',
			options: {
				useTabs: false,
				tabWidth: 2,
			},
		},
	],
};
