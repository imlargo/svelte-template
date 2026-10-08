import prettier from 'eslint-config-prettier';
import fs from 'node:fs';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

/** Every slice under features/, so a slice can be forbidden from importing its siblings. */
const slices = fs
	.readdirSync(path.resolve(import.meta.dirname, 'src/lib/features'), { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name);

// Regexes, not globs: a glob starting with `#` reads as a gitignore comment.
const ENV = { group: ['$env/*'], message: 'Deprecated in SvelteKit 3: use $app/env.' };
const FEATURES = { regex: '^#lib/features/', message: 'This layer does not depend on features.' };
const COMPONENTS = { regex: '^#lib/components/', message: 'This layer does not render anything.' };
const CONFIG = { regex: '^#lib/config/', message: 'Config is passed in, not imported here.' };

/** A `no-restricted-imports` block for the files matching `files`. Later blocks replace the rule, so each carries ENV. */
function layer(files, patterns) {
	return {
		files,
		rules: { 'no-restricted-imports': ['error', { patterns: [ENV, ...patterns] }] }
	};
}

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{
		ignores: ['src/lib/components/ui/**']
	},
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},

	// ─── The architecture, as lint errors (see docs/architecture.md, "Import rules") ──
	{
		files: ['src/**'],
		rules: {
			// The logger is the single exit point for logs.
			'no-console': 'error',
			// Environment variables are declared in src/env.ts and read from $app/env.
			'no-restricted-properties': [
				'error',
				{ object: 'process', property: 'env', message: 'Read env from $app/env/*.' }
			],
			'no-restricted-syntax': [
				'error',
				{
					selector: 'MemberExpression[object.type="MetaProperty"][property.name="env"]',
					message: 'Read env from $app/env, never import.meta.env.'
				},
				{
					selector: 'CallExpression[callee.name="confirm"]',
					message: 'Use ConfirmDialog, not the native confirm().'
				}
			],
			'no-restricted-imports': ['error', { patterns: [ENV] }],
			// A file past this is doing more than one thing; extract a component or a hook.
			'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }]
		}
	},
	{
		files: ['src/**/*.svelte'],
		rules: { 'svelte/button-has-type': 'error' }
	},
	{
		files: ['src/lib/core/logger.ts'],
		rules: { 'no-console': 'off' }
	},
	{
		// Vendored: updated by copying a new version, never linted for size.
		files: ['src/lib/components/coral/**'],
		rules: { 'max-lines': 'off' }
	},
	layer(
		['src/lib/core/**'],
		[
			{
				regex: '^#lib/(?!core/)',
				message: 'core/ depends on nothing outside core/: pass it in, or use a setter.'
			}
		]
	),
	layer(
		['src/lib/types/**'],
		[{ regex: '^#lib/(?!types/)', message: 'types/ depends on nothing.' }]
	),
	layer(
		['src/lib/config/**'],
		[FEATURES, COMPONENTS, { regex: '^#lib/(hooks|utils)/', message: 'Config holds values.' }]
	),
	layer(['src/lib/hooks/**', 'src/lib/utils/**'], [FEATURES, COMPONENTS, CONFIG]),
	layer(['src/lib/components/blocks/**', 'src/lib/components/layout/**'], [FEATURES]),
	layer(['src/lib/server/**'], [FEATURES, COMPONENTS]),
	...slices.map((slice) =>
		layer(
			[`src/lib/features/${slice}/**`],
			[
				{
					regex: `^#lib/features/(?!${slice}/)`,
					message: 'A slice never imports another slice; share through #lib/types or #lib/core.'
				}
			]
		)
	)
);
