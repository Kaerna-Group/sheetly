import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Inline plugin: bans raw Tailwind color utilities that should be replaced
// with semantic design-system tokens (bg-surface, text-text, border-border…).
// Exceptions live in app/src/app/styles/ (token definitions) and are
// implicitly excluded because those files are .css, not .ts/.tsx.
const colorBanPlugin = {
  rules: {
    'no-hardcoded-colors': {
      create(context) {
        const banned = [
          /\bbg-white\b/,
          /\bbg-zinc-\d+/,
          /\bbg-slate-\d+/,
          /\btext-zinc-\d+/,
          /\btext-red-\d+/,
          /\btext-green-\d+/,
          /\btext-indigo-\d+/,
          /\bborder-zinc-\d+/,
          /\bring-red-\d+/,
          /\bring-indigo-\d+/,
          /\bhover:bg-zinc-\d+/,
        ];

        function check(node, value) {
          for (const re of banned) {
            const match = re.exec(value);
            if (match) {
              context.report({
                node,
                message: `Hardcoded color "${match[0]}" is not allowed. Use a semantic token instead (e.g. bg-surface, text-text, border-border).`,
              });
              return;
            }
          }
        }

        return {
          Literal(node) {
            if (typeof node.value === 'string') check(node, node.value);
          },
          TemplateLiteral(node) {
            for (const q of node.quasis) check(q, q.value.raw);
          },
        };
      },
    },
  },
};

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'color-ban': colorBanPlugin },
    rules: {
      'color-ban/no-hardcoded-colors': 'error',
    },
  },
]);
