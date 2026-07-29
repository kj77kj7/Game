/**
 * SafeAreaProvider는 인셋을 실제로 측정할 때까지 children을 그리지 않는다.
 * 테스트 환경에는 레이아웃 이벤트가 없어서 화면이 영원히 비어 있다.
 *
 * Safe Area가 제대로 먹었는지는 실기기에서 눈으로 봐야 아는 값이라
 * 여기서는 통과만 시킨다. 이 목이 검증을 대신한다고 착각하지 말 것.
 *
 * jest.mock의 팩토리는 바깥 변수를 참조할 수 없어서 안에서 require한다.
 */
jest.mock('@granite-js/native/react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const react = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children?: unknown }) => children,
    SafeAreaView: ({ children, style }: { children?: unknown; style?: unknown }) =>
      react.createElement(View, { style }, children),
  };
});
