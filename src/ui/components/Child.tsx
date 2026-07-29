/** 캐릭터 레이어 합성 */

import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';

import type { ConsumptionTier, StressBand } from '../../core/types';
import { color, radius } from '../theme/tokens';

/**
 * 전신이 아니라 반신으로 세운다.
 *
 * 반신 초상화 한 장을 파츠 교체로 돌려쓰는 게 그림 수를 늘리지 않으면서
 * 표정·성장·의상 변화를 다 표현하는 방법이다 (조사 문서 §2-2).
 * 지금은 단색 도형이지만 레이어 경계를 미리 그대로 맞춰둬서,
 * 아트가 나오면 각 View를 Image로 바꾸는 것으로 끝난다.
 *
 * 캐릭터 조형(머리 실루엣·눈 모양·의상 디자인)은 원작에서 가져오지 않는다.
 * 여기서 정하는 건 '레이어를 어떻게 쌓는가'뿐이다 (조사 문서 §2-4).
 */

/** 의상 티어가 바뀌면 스프라이트가 반영된다. 지금은 색으로만 드러난다 */
const TIER_CLOTH: Record<ConsumptionTier, string> = {
  1: '#B9AFA2',
  2: '#9FB0A8',
  3: '#8E9BB5',
  4: '#C2A25E',
};

/** 표정 파츠. 기분 등급 하나로만 갈린다 — 조합이 늘면 아트 물량이 곱으로 늘어난다 */
const EYE_HEIGHT: Record<StressBand, number> = {
  stable: 10,
  tired: 8,
  overload: 5,
  limit: 3,
};

const MOUTH_WIDTH: Record<StressBand, number> = {
  stable: 22,
  tired: 16,
  overload: 12,
  limit: 10,
};

/** 나이대별 스프라이트 교체 지점. 4~5단계면 충분하다 (설계서 §14) */
function scaleOf(age: number): number {
  // 차이를 작게 두면 나이가 올라간 게 화면에서 안 읽힌다.
  // 실제 성장 곡선보다 과장하는 편이 낫다 — 플레이어가 알아채야 의미가 있다.
  if (age <= 5) return 0.7;
  if (age <= 12) return 0.88;
  return 1.05;
}

export function Child({
  age,
  clothingTier,
  mood,
}: {
  age: number;
  clothingTier: ConsumptionTier;
  mood: StressBand;
}): ReactElement {
  const scale = scaleOf(age);

  return (
    <View style={styles.root}>
      {/* 배경 원도 같이 커져야 한다. 고정 크기로 두면 큰 아이가 원을 뚫고 나간다 */}
      <View style={[styles.backdrop, { width: 220 * scale, height: 220 * scale }]} />

      <View style={[styles.figure, { transform: [{ scale }] }]}>
        <View style={styles.hairBack} />

        <View style={styles.face}>
          <View style={styles.hairFront} />

          <View style={styles.eyes}>
            <View style={[styles.eye, { height: EYE_HEIGHT[mood] }]} />
            <View style={[styles.eye, { height: EYE_HEIGHT[mood] }]} />
          </View>

          <View style={styles.blushRow}>
            <View style={styles.blush} />
            <View style={styles.blush} />
          </View>

          <View style={[styles.mouth, { width: MOUTH_WIDTH[mood] }]} />
        </View>

        <View style={[styles.body, { backgroundColor: TIER_CLOTH[clothingTier] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'flex-end' },

  /** 장소를 나타내는 단순 배경. 배경은 장소별 1장으로 재사용한다 (설계서 §14) */
  backdrop: {
    position: 'absolute',
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: color.accentSoft,
  },

  figure: { alignItems: 'center' },

  hairBack: {
    position: 'absolute',
    top: 4,
    width: 116,
    height: 130,
    borderRadius: radius.pill,
    backgroundColor: color.hair,
  },
  face: {
    width: 100,
    height: 108,
    borderRadius: 50,
    backgroundColor: color.skin,
    alignItems: 'center',
    marginTop: 10,
  },
  hairFront: {
    position: 'absolute',
    top: -2,
    width: 104,
    height: 34,
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    backgroundColor: color.hair,
  },
  eyes: { flexDirection: 'row', gap: 20, marginTop: 46 },
  eye: { width: 10, borderRadius: radius.sm, backgroundColor: color.text },
  blushRow: { flexDirection: 'row', gap: 44, marginTop: 4 },
  blush: { width: 14, height: 6, borderRadius: radius.pill, backgroundColor: color.blush },
  mouth: { height: 4, borderRadius: radius.pill, backgroundColor: color.text, marginTop: 6 },

  body: {
    width: 128,
    height: 96,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    marginTop: -6,
  },
});
