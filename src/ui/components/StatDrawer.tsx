/** 세부 스탯 드릴다운 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';

import { MAJOR_IDS, MAJOR_LABEL } from '../../core/data/majors';
import { TALENT_FIELDS } from '../../core/data/talents';
import { majorFits } from '../../core/engine';
import { statGrade } from '../../core/state';
import type { StatKey } from '../../core/types';
import { STAT_LABEL, color, font, radius, space } from '../theme/tokens';

/**
 * 탭해야 보이는 화면이다. 기본 화면에는 세부 스탯도 계열도 없다 (설계서 §12).
 *
 * 자립성·자존감은 여기에도 넣지 않는다. 아이 대사로만 드러나야 한다 —
 * 게이지로 보여주는 순간 플레이어는 대사를 안 읽고 숫자만 관리한다.
 */
const HIDDEN_FROM_DRAWER: readonly StatKey[] = ['esteem', 'independence'];

export function StatDrawer({ stats }: { stats: Record<StatKey, number> }): ReactElement {
  const fits = majorFits(stats);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>계열 적합도</Text>
      {MAJOR_IDS.map((id) => (
        <Row key={id} label={MAJOR_LABEL[id]} grade={statGrade(fits[id])} />
      ))}

      <Text style={styles.heading}>세부 능력</Text>
      {TALENT_FIELDS.map((t) => (
        <Row key={t.field} label={t.label} grade={statGrade(stats[t.field])} />
      ))}

      <Text style={styles.heading}>기질</Text>
      {(['health', 'sociability'] as const)
        .filter((key) => !HIDDEN_FROM_DRAWER.some((hidden) => hidden === key))
        .map((key) => (
          <Row key={key} label={STAT_LABEL[key]} grade={statGrade(stats[key])} />
        ))}
    </ScrollView>
  );
}

function Row({ label, grade }: { label: string; grade: string }): ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.grade}>{grade}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.xs, paddingVertical: space.sm },
  heading: {
    color: color.textWeak,
    fontSize: font.caption,
    marginTop: space.lg,
    marginBottom: space.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: color.surface,
    borderRadius: radius.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  label: { color: color.text, fontSize: font.body },
  grade: { color: color.accent, fontSize: font.body, fontWeight: '600' },
});
