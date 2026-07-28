/** 엔딩 결과 화면 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';

import { MAJOR_LABEL } from '../../core/data/majors';
import { MAJOR_LIFE, QUALITY_PARAGRAPH, REPLAY_HINT, TIER_OPENING } from '../../core/data/endings';
import type { Ending } from '../../core/types';
import { color, font, radius, space } from '../theme/tokens';

/**
 * 왜 이 엔딩이 나왔는지 한 줄로 설명하고, 다음 회차 힌트를 하나 준다 (설계서 §11).
 *
 * 대학 티어와 삶의 질을 한 문단으로 섞어 쓰지 않는다.
 * 섞으면 "좋은 대학이라서 좋은 인생"으로 읽히고, 그건 이 게임이 하려는 말의 반대다.
 */
export function EndingScreen({
  ending,
  onRestart,
}: {
  ending: Ending;
  onRestart: () => void;
}): ReactElement {
  const major = ending.undecided ? `자유전공(${MAJOR_LABEL[ending.major]})` : MAJOR_LABEL[ending.major];
  const opening = TIER_OPENING[ending.tier].replace('{major}', major);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.opening}>{opening}</Text>

      {ending.tier !== 'none' && <Text style={styles.body}>{MAJOR_LIFE[ending.major]}</Text>}

      <Text style={styles.body}>{QUALITY_PARAGRAPH[ending.quality]}</Text>

      <View style={styles.hintBox}>
        <Text style={styles.hintLabel}>다음 회차</Text>
        <Text style={styles.hint}>{REPLAY_HINT[ending.quality]}</Text>
      </View>

        <Pressable style={styles.button} onPress={onRestart} accessibilityRole="button">
          <Text style={styles.buttonLabel}>다시 키우기</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: space.xl, gap: space.lg },
  opening: { color: color.text, fontSize: font.title, fontWeight: '700', lineHeight: 28 },
  body: { color: color.text, fontSize: font.body, lineHeight: 24 },
  hintBox: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.xs,
  },
  hintLabel: { color: color.textWeak, fontSize: font.caption },
  hint: { color: color.accent, fontSize: font.body, fontWeight: '600' },
  button: {
    backgroundColor: color.accent,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  buttonLabel: { color: color.textInverse, fontSize: font.body, fontWeight: '600' },
});
