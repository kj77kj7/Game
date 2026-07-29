/** 소비 티어 설정 — 의식주와 여행 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';

import { CONSUMPTION_BALANCE } from '../../core/data/balance';
import { CONSUMPTION_META } from '../../core/data/consumption';
import { fitOf } from '../../core/engine';
import type { AgeStage, ConsumptionTier, UpkeepCategory } from '../../core/types';
import { color, font, radius, space } from '../theme/tokens';

const TIERS: readonly ConsumptionTier[] = [1, 2, 3, 4];
const UPKEEP: readonly UpkeepCategory[] = ['food', 'clothing', 'housing'];

/** 적정선에서 벗어난 방향을 한 글자로. 숫자는 내보내지 않는다 (설계서 §12) */
const FIT_MARK = { lack: '부족', fit: '적당', excess: '과함' } as const;

/**
 * 적정선이 나이에 따라 움직인다는 걸 화면이 직접 말해준다 (설계서 §6-4).
 *
 * 안 알려주면 플레이어는 한 번 맞춰놓고 잊는다. 그러면 이 시스템이 존재할 이유가 없어진다.
 * 다만 "몇 티어가 적정"이라고 못박지 않고 현재 선택이 어느 쪽으로 치우쳤는지만 보여준다 —
 * 정답을 띄우면 역U자 곡선이 그냥 체크리스트가 된다.
 */
export function WardrobeSheet({
  stage,
  current,
  funds,
  slots,
  onSetTier,
  onTravel,
}: {
  stage: AgeStage;
  current: Record<UpkeepCategory, ConsumptionTier>;
  funds: number;
  slots: number;
  onSetTier: (category: UpkeepCategory, tier: ConsumptionTier) => void;
  onTravel: (tier: ConsumptionTier) => void;
}): ReactElement {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {UPKEEP.map((category) => {
        const meta = CONSUMPTION_META[category];
        const selected = current[category];

        return (
          <View key={category} style={styles.block}>
            <View style={styles.head}>
              <Text style={styles.category}>{meta.label}</Text>
              <Text
                style={[
                  styles.fitMark,
                  fitOf(selected, stage) !== 'fit' && styles.offTarget,
                ]}
              >
                {FIT_MARK[fitOf(selected, stage)]}
              </Text>
            </View>

            {TIERS.map((tier) => (
              <Pressable
                key={tier}
                style={[styles.row, selected === tier && styles.selected]}
                onPress={() => onSetTier(category, tier)}
                accessibilityRole="button"
              >
                <Text style={[styles.tierLabel, selected === tier && styles.selectedLabel]}>
                  {meta.tiers[tier - 1]}
                </Text>
                <Text style={styles.upkeep}>
                  매 해 {CONSUMPTION_BALANCE[category].cost[tier - 1]}
                </Text>
              </Pressable>
            ))}
          </View>
        );
      })}

      <View style={styles.block}>
        <View style={styles.head}>
          <Text style={styles.category}>{CONSUMPTION_META.travel.label}</Text>
          {/* 여행만 슬롯을 쓴다. 그래야 "학원 대신 여행"이 선택이 된다 (설계서 §6-4) */}
          <Text style={styles.note}>슬롯 1칸</Text>
        </View>

        {TIERS.map((tier) => {
          const cost = CONSUMPTION_BALANCE.travel.cost[tier - 1] ?? 0;
          const disabled = slots <= 0 || funds < cost;

          return (
            <Pressable
              key={tier}
              style={[styles.row, disabled && styles.disabled]}
              disabled={disabled}
              onPress={() => onTravel(tier)}
              accessibilityRole="button"
            >
              <Text style={styles.tierLabel}>{CONSUMPTION_META.travel.tiers[tier - 1]}</Text>
              <Text style={styles.upkeep}>{cost}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.lg, paddingVertical: space.sm },
  block: { gap: space.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs },
  category: { color: color.text, fontSize: font.title, fontWeight: '700' },
  fitMark: { color: color.textWeak, fontSize: font.caption, fontWeight: '600' },
  offTarget: { color: color.accent },
  note: { color: color.textWeak, fontSize: font.caption },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  selected: { borderColor: color.accent },
  disabled: { opacity: 0.4 },
  tierLabel: { color: color.text, fontSize: font.body },
  selectedLabel: { fontWeight: '700' },
  upkeep: { color: color.textWeak, fontSize: font.caption },
});
