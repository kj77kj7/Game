/** 웹 미리보기용 Safe Area 대체. 실기기 인셋과는 무관하다 */

import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';

// granite의 safe-area 모듈은 네이티브 뷰를 요구한다.
// 웹에는 노치가 없으므로 그냥 통과시킨다 — 인셋 검증은 실기기 몫이다.
export function SafeAreaProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function SafeAreaView({ children, style }: PropsWithChildren<ViewProps>) {
  return <View style={style}>{children}</View>;
}
