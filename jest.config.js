// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('@granite-js/react-native/jest').config({
  rootDir: __dirname,
  moduleNameMapper: {
    '@babel/runtime(.*)': `${path.dirname(require.resolve('@babel/runtime/package.json'))}$1`,
  },
});

// granite의 config()는 rootDir이 있으면 넘긴 testMatch를 무시하고 기본값으로 되돌린다.
// 그래서 호출한 뒤에 덮어쓴다.
//
// jest는 렌더 테스트(.test.tsx)만 가져간다.
// core/의 순수 로직 테스트는 .test.ts로 node:test가 돌린다 (npm test).
// RN 런타임 없이 도는 게 core/ 격리의 증거라, 그쪽을 jest로 끌고 오지 않는다.
module.exports = {
  ...config,
  testMatch: [path.join(__dirname, '**/*.test.tsx')],
  testPathIgnorePatterns: [...config.testPathIgnorePatterns, '/\\.tmp-test/'],
};
