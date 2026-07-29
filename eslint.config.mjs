import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.tmp-test/**', '*.{cjs,js}'] },
  { files: ['pages/**/*.{ts,jsx,tsx}', 'src/**/*.{ts,jsx,tsx}'] },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  pluginReact.configs.flat.recommended,
  // React 17+ 자동 JSX 변환을 쓰므로 `import React`가 필요 없다.
  // 이걸 빼면 파일마다 쓰지도 않는 React import를 넣어야 하고, 그건 no-unused-vars와 싸운다.
  pluginReact.configs.flat['jsx-runtime'],

  // 미리보기 캡처 스크립트는 브라우저가 아니라 Node에서 돈다.
  {
    files: ['web/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly' },
    },
  },

  {
    rules: {
      // 나머지 연산자로 키를 덜어내는 패턴(TurnState 만들 때)을 위해 ignoreRestSiblings를 켠다.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },

  // core/가 플랫폼 API를 전혀 모르게 유지하면 이식은 어댑터 교체로 끝난다 (설계서 §17).
  // 이 규칙이 한 번 깨지면 core/가 react-native에 묶여 플레이스토어 이식이 불가능해지고,
  // 밸런싱 시뮬레이션도 RN 런타임 없이는 못 돌린다. 그래서 경고가 아니라 error다.
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react-native', 'react-native/*'],
              message: 'core/는 순수 TypeScript다. 렌더링이 필요하면 ui/에서 호출할 것.',
            },
            {
              group: ['@apps-in-toss/*', '@granite-js/*', '@toss/*', 'expo', 'expo-*'],
              message: 'core/는 SDK를 몰라야 한다. platform/ 인터페이스를 경유할 것.',
            },
            {
              group: ['**/platform', '**/platform/*', '**/platform-toss', '**/platform-toss/*'],
              message: 'core/는 platform/ 인터페이스에도 의존하지 않는다. 방향은 platform → core 한쪽뿐이다.',
            },
          ],
        },
      ],
    },
  },
];
