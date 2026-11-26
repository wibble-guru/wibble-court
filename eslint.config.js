import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'public', 'scripts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      prettier, // 포맷 관련 규칙은 Prettier 에 맡김
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // 진실 공개(대본 10부)는 결과 이후에만 import() 로 불러오는 별도 청크 — 본편이 정적으로 가져오면 초기 번들에 들어간다
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/data/truth/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/data/truth', '@/data/truth/*', '**/data/truth', '**/data/truth/*'],
              allowTypeImports: true,
              message: '진실 공개 데이터는 import() 로만 불러오세요 (별도 청크, 대본 11.1).',
            },
            {
              group: ['@/../tests/*', '**/tests/**'],
              message: '게임 코드는 테스트 코드(tests/)를 가져오지 않습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    // 위 규칙에서 빠지는 진실 공개 폴더에도 테스트 코드 가져오기는 막는다
    files: ['src/data/truth/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/../tests/*', '**/tests/**'],
              message: '게임 코드는 테스트 코드(tests/)를 가져오지 않습니다.',
            },
          ],
        },
      ],
    },
  },
]);
