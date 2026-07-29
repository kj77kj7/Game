/** 앱 진입점. 플랫폼 구현체를 받아 게임을 조립한다 */

import { SafeAreaProvider } from '@granite-js/native/react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';

import type { Platform } from '../platform';
import { DebugBar } from '../ui/components/DebugBar';
import { GameScreen } from '../ui/screens/GameScreen';
import { color } from '../ui/theme/tokens';
import { GameProvider } from './GameProvider';

/**
 * 여기서 `platform-toss`를 import하지 않는다.
 *
 * import만 해도 SDK가 네이티브 모듈을 찾으러 가서, 토스 앱 밖에서는 그 자리에서 죽는다.
 * 목 구현체를 주입해도 소용없다 — 주입은 실행 시점이고 import는 그 전이다.
 * 그래서 구현체를 만드는 일은 진입점(pages/index.tsx)에만 둔다.
 *
 * 이 규칙이 지켜지는 한 App 아래 전부가 테스트에서 그대로 돌아간다.
 */
export function App({
  platform,
  debug = false,
}: {
  platform: Platform;
  debug?: boolean;
}): ReactElement {
  return (
    <SafeAreaProvider>
      <GameProvider platform={platform} debug={debug}>
        <View style={styles.root}>
          <GameScreen onExit={platform.close} />
          <DebugBar />
        </View>
      </GameProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
