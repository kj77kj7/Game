/** 행동 선택지와 결과 미리보기 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';

import { ACTION_BALANCE, PREVIEW_STRONG } from '../../core/data/balance';
import { ACTION_META } from '../../core/data/actions';
import { TALENT_FIELDS } from '../../core/data/talents';
import type { ActionBalance, ActionId, StatDelta, SubjectStat } from '../../core/types';
import { STAT_LABEL, color, font, radius, space } from '../theme/tokens';

const ACTION_IDS = Object.keys(ACTION_META).filter(isActionId);

function isActionId(key: string): key is ActionId {
  return key in ACTION_META;
}

function labelOf(key: string): string | null {
  const talent = TALENT_FIELDS.find((t) => t.field === key);
  if (talent) return talent.label;

  if (key in STAT_LABEL) {
    const labels: Record<string, string> = STAT_LABEL;
    return labels[key] ?? null;
  }
  return null;
}

/**
 * 방향만 보여주고 수치는 감춘다 (설계서 §12).
 *
 * 뭘 잃는지 알면서 고르는 게 트레이드오프다. 모르고 고르는 건 운이고, 운은 재미가 없다.
 * 그래서 스트레스처럼 "잃는 것"을 먼저 자르지 않고 최대 3개 안에 같이 담는다.
 */
export function previewOf(id: ActionId): string[] {
  const balance: ActionBalance = ACTION_BALANCE[id];
  const merged: StatDelta = { ...balance.effects };
  const chips: string[] = [];

  for (const [key, amount] of Object.entries(merged)) {
    if (typeof amount !== 'number' || amount === 0) continue;

    const label = labelOf(key);
    if (label === null) continue;

    // 기분은 스트레스를 뒤집은 표기라 화살표 방향도 뒤집는다.
    const rising = key === 'stress' ? amount < 0 : amount > 0;
    const strong = Math.abs(amount) >= PREVIEW_STRONG;
    const arrow = (rising ? '▲' : '▼').repeat(strong ? 2 : 1);

    chips.push(`${label} ${arrow}`);
  }

  if (balance.dynamic) chips.unshift(`선택 과목 ▲${balance.dynamic.delta >= PREVIEW_STRONG ? '▲' : ''}`);

  return chips.slice(0, 3);
}

const SUBJECT_CHOICES: readonly { key: SubjectStat; label: string }[] = [
  { key: 'korean', label: '국어' },
  { key: 'english', label: '영어' },
  { key: 'math', label: '수학' },
  { key: 'science', label: '과학' },
  { key: 'socialStudies', label: '사회' },
];

/** 이 행동이 플레이어에게 과목을 고르게 하는가 */
function needsSubject(id: ActionId): boolean {
  const balance: ActionBalance = ACTION_BALANCE[id];
  return balance.dynamic?.pick === 'chosen';
}

export function ActionSheet({
  age,
  funds,
  slots,
  onPick,
}: {
  age: number;
  funds: number;
  slots: number;
  onPick: (id: ActionId, subject?: SubjectStat) => void;
}): ReactElement {
  const available = ACTION_IDS.filter((id) => age >= ACTION_BALANCE[id].unlockAge);

  // 학습지·보습학원은 과목을 고르지 않으면 아무 과목도 오르지 않는다.
  // 목록에서 바로 누르게 두면 스트레스만 올리고 끝나므로, 과목을 고른 뒤에야 실행된다.
  const [pendingSubjectFor, setPendingSubjectFor] = useState<ActionId | null>(null);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {available.map((id) => {
        const cost = ACTION_BALANCE[id].cost;
        const disabled = slots <= 0 || funds < cost;
        const choosing = pendingSubjectFor === id;

        return (
          <View key={id}>
            <Pressable
              style={[styles.row, disabled && styles.disabled, choosing && styles.choosing]}
              disabled={disabled}
              onPress={() => {
                if (needsSubject(id)) setPendingSubjectFor(choosing ? null : id);
                else onPick(id);
              }}
              accessibilityRole="button"
            >
              <View style={styles.left}>
                <Text style={styles.label}>{ACTION_META[id].label}</Text>
                <Text style={styles.preview}>{previewOf(id).join(' · ')}</Text>
              </View>
              <Text style={styles.cost}>{cost === 0 ? '무료' : `${cost}`}</Text>
            </Pressable>

            {choosing && (
              <View style={styles.subjects}>
                {SUBJECT_CHOICES.map((subject) => (
                  <Pressable
                    key={subject.key}
                    style={styles.subjectChip}
                    onPress={() => {
                      setPendingSubjectFor(null);
                      onPick(id, subject.key);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.subjectLabel}>{subject.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.sm, paddingVertical: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  disabled: { opacity: 0.4 },
  choosing: { borderWidth: 2, borderColor: color.accent },
  subjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingTop: space.sm,
    paddingHorizontal: space.sm,
  },
  subjectChip: {
    backgroundColor: color.accent,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  subjectLabel: { color: color.textInverse, fontSize: font.caption, fontWeight: '600' },
  left: { gap: space.xs, flexShrink: 1 },
  label: { color: color.text, fontSize: font.body, fontWeight: '600' },
  preview: { color: color.textWeak, fontSize: font.caption },
  cost: { color: color.textWeak, fontSize: font.caption, marginLeft: space.md },
});
