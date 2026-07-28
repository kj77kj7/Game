/** 캐릭터 레이어 합성 */

import { View, StyleSheet } from 'react-native';
import type { ReactElement } from 'react';

import type { ConsumptionTier } from '../../core/types';
import { color, radius } from '../theme/tokens';

/**
 * 아트가 아직 없어서 단색 도형으로 세워둔다.
 *
 * 레이어를 지금부터 나눠두는 이유: 나중에 스프라이트를 끼울 때
 * 몸·상의·하의를 각각 갈아끼우면 되도록 구조를 먼저 맞춰놓는 것이다 (설계서 §14).
 * 의상 티어가 바뀌면 색이 바뀌는 것도 "갈아입히면 반영된다"의 최소 형태다.
 */
const TIER_TOP: Record<ConsumptionTier, string> = {
  1: '#9AA7B8',
  2: '#5B8DEF',
  3: '#7C5CFC',
  4: '#F5C24B',
};

/** 나이대별로 키가 자란다. 스프라이트 교체 지점과 같은 구간을 쓴다 */
function bodyHeight(age: number): number {
  if (age <= 5) return 120;
  if (age <= 12) return 160;
  return 200;
}

export function Child({
  age,
  clothingTier,
}: {
  age: number;
  clothingTier: ConsumptionTier;
}): ReactElement {
  const height = bodyHeight(age);

  return (
    <View style={[styles.root, { height }]}>
      <View style={[styles.head, { backgroundColor: color.skin }]} />
      <View
        style={[
          styles.top,
          { backgroundColor: TIER_TOP[clothingTier], height: height * 0.35 },
        ]}
      />
      <View style={[styles.bottom, { height: height * 0.3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'flex-end' },
  head: { width: 56, height: 56, borderRadius: radius.pill },
  top: { width: 72, borderRadius: radius.md, marginTop: 4 },
  bottom: { width: 56, borderRadius: radius.sm, backgroundColor: color.clothBottom, marginTop: 4 },
});
