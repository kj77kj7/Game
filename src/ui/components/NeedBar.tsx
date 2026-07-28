/** 돌봄 니즈 게이지 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';

import { STAT_RANGE } from '../../core/data/balance';
import { useCareTick } from '../../app/hooks/useCareTick';
import type { NeedKey } from '../../core/types';
import { color, font, radius, space } from '../theme/tokens';

/**
 * 이 컴포넌트만 1초 틱을 구독한다. 부모(GameScreen)는 턴이 바뀔 때만 다시 그려진다.
 *
 * 게이지가 비어도 벌점은 없다. 비었다는 표시는 "채우면 보너스"의 안내일 뿐이다 (설계서 §1).
 * 여기에 경고색이나 흔들림을 넣으면 방치가 벌처럼 읽히므로 넣지 않았다.
 */
export function NeedBar({
  moodLabel,
  onFill,
}: {
  /** 스트레스를 뒤집은 등급 표기. 숫자가 아니다 (설계서 §8) */
  moodLabel: string;
  onFill: (need: NeedKey) => void;
}): ReactElement | null {
  const live = useCareTick();
  if (live === null) return null;

  return (
    <View style={styles.row}>
      <Gauge label="허기" ratio={live.hunger / STAT_RANGE.max} tint={color.hunger} onPress={() => onFill('hunger')} />
      <View style={styles.mood}>
        <Text style={styles.caption}>기분</Text>
        <Text style={styles.moodValue}>{moodLabel}</Text>
      </View>
      <Gauge label="청결" ratio={live.hygiene / STAT_RANGE.max} tint={color.hygiene} onPress={() => onFill('hygiene')} />
    </View>
  );
}

function Gauge({
  label,
  ratio,
  tint,
  onPress,
}: {
  label: string;
  ratio: number;
  tint: string;
  onPress: () => void;
}): ReactElement {
  const width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%` as const;

  return (
    <Pressable style={styles.gauge} onPress={onPress} accessibilityRole="button">
      <Text style={styles.caption}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width, backgroundColor: tint }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  gauge: { flex: 1, gap: space.xs },
  mood: { alignItems: 'center', gap: space.xs, minWidth: 64 },
  moodValue: { color: color.mood, fontSize: font.body, fontWeight: '600' },
  caption: { color: color.textWeak, fontSize: font.caption },
  track: {
    height: 8,
    backgroundColor: color.line,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: radius.pill },
});
