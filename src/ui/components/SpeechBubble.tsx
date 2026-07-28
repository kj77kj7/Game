/** 상태 대사·요구 말풍선 */

import { StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';

import { color, font, radius, space } from '../theme/tokens';

/**
 * 한 턴에 하나만 띄운다. 여러 개를 겹치면 해석 부담이 생긴다 (설계서 §13).
 * 요구가 있으면 그것이 상태 대사보다 우선이라 호출부에서 하나만 골라 넘긴다.
 */
export function SpeechBubble({
  line,
  emphasized = false,
}: {
  line: string;
  emphasized?: boolean;
}): ReactElement | null {
  if (line.length === 0) return null;

  return (
    <View style={[styles.bubble, emphasized && styles.emphasized]}>
      <Text style={styles.text}>{line}</Text>
      <View style={[styles.tail, emphasized && styles.tailEmphasized]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'center',
    maxWidth: '90%',
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  emphasized: { borderColor: color.accent, borderWidth: 2 },
  text: { color: color.text, fontSize: font.body, textAlign: 'center' },
  tail: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 12,
    height: 12,
    backgroundColor: color.surface,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: color.line,
    transform: [{ rotate: '45deg' }],
  },
  tailEmphasized: { borderColor: color.accent },
});
