/** 앱 진입점. Granite 페이지에서 이것 하나만 렌더하면 된다 */

import { SafeAreaProvider } from '@granite-js/native/react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';

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
 */
export function App({
  adGroupId,
  debug = false,
}: {
  adGroupId: string;
  debug?: boolean;
}): ReactElement {
  const platform = createTossPlatform(adGroupId);

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
