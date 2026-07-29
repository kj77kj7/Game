/** 개발용 치트 바. debug 모드가 아니면 아무것도 그리지 않는다 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';

import { useGame } from '../../app/hooks/useGame';
import { color, font, space } from '../theme/tokens';

/**
 * 19턴을 매번 0세부터 굴리면 고등기 화면을 한 번 보는 데 몇 분이 걸린다.
 * 나이를 건너뛰고 자금·슬롯을 채울 수 있어야 화면을 보면서 고치는 게 가능해진다.
 *
 * `dev`가 null이면 렌더 자체를 하지 않으므로 운영 빌드에는 흔적이 남지 않는다.
 */
export function DebugBar(): ReactElement | null {
  const { state, dev } = useGame();
  if (dev === null || state === null) return null;

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <Chip label="+자금" onPress={() => dev.grantFunds(5000)} />
        <Chip label="+슬롯" onPress={() => dev.grantSlots(3)} />
        <Chip label="유아 5" onPress={() => dev.jumpToAge(5)} />
        <Chip label="초등 8" onPress={() => dev.jumpToAge(8)} />
        <Chip label="중등 14" onPress={() => dev.jumpToAge(14)} />
        <Chip label="고등 17" onPress={() => dev.jumpToAge(17)} />
      </View>
    </View>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }): ReactElement {
  return (
    <Pressable style={styles.chip} onPress={onPress} accessibilityRole="button">
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 겹쳐 그리면 하단 메뉴 라벨을 덮는다. 흐름 안에서 아래에 쌓는다
  root: { alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.xs,
    width: '100%',
    backgroundColor: 'rgba(46, 42, 38, 0.9)',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  chip: {
    backgroundColor: 'rgba(255, 253, 249, 0.15)',
    borderRadius: 6,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  label: { color: color.textInverse, fontSize: font.caption },
});
