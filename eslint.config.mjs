// core/가 플랫폼 API를 전혀 모르게 유지하면 이식은 어댑터 교체로 끝난다 (설계서 §17).
// 이 규칙이 한 번 깨지면 core/가 react-native에 묶여 플레이스토어 이식이 불가능해지고,
// 밸런싱 시뮬레이션(Phase 7)도 RN 런타임 없이는 못 돌린다. 그래서 경고가 아니라 error다.
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/core/**/*.ts'],
    languageOptions: { parser: tsParser },
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
              group: ['@apps-in-toss/*', '@toss/*', 'expo', 'expo-*'],
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
