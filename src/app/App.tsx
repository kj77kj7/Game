/** 앱 진입점. Granite 페이지에서 이것 하나만 렌더하면 된다 */

import { useMemo } from 'react';
import { SafeAreaProvider } from '@granite-js/native/react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';

import type { Platform } from '../platform';
import { createTossPlatform } from '../platform-toss';
import { DebugBar } from '../ui/components/DebugBar';
import { GameScreen } from '../ui/screens/GameScreen';
import { color } from '../ui/theme/tokens';
import { GameProvider } from './GameProvider';

/**
 * 스캐폴드가 만드는 페이지 파일과 충돌하지 않도록 진입점을 여기 둔다.
 * `npm create granite-app`이 만든 페이지에서 `<App adGroupId="..." />` 한 줄만 쓰면 된다.
 *
 * `adGroupId`는 앱인토스 콘솔에 등록한 광고 그룹 ID다. 코드에 박지 않는다.
 * `debug`는 개발 중에만 켠다 — 켜져 있으면 화면 위에 치트 바가 붙는다.
 *
 * `platform`을 넘기면 그걸 쓴다. 테스트에서 `createMockPlatform()`을 끼우기 위한 구멍이고,
 * 안 넘기면 앱인토스 구현체를 만든다 — 운영 경로에서는 이 인자를 쓰지 않는다.
 */
export function App({
  adGroupId,
  debug = false,
  platform,
}: {
  adGroupId: string;
  debug?: boolean;
  platform?: Platform;
}): ReactElement {
  // 매 렌더마다 새로 만들면 GameProvider의 effect가 계속 재실행된다.
  const resolved = useMemo(
    () => platform ?? createTossPlatform(adGroupId),
    [platform, adGroupId],
  );

  return (
    <SafeAreaProvider>
      <GameProvider platform={resolved} debug={debug}>
        <View style={styles.root}>
          <GameScreen onExit={resolved.close} />
          <DebugBar />
        </View>
      </GameProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
