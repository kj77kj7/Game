/** 타이틀 — 이어하기 / 새로 시작 */

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';

import { useGame } from '../../app/hooks/useGame';
import { color, font, radius, space } from '../theme/tokens';

/**
 * 진입 직후 바텀시트를 자동으로 띄우지 않는다 (설계서 §16).
 * 저장 확인은 비동기로 하고 화면은 즉시 그린다 — 최초 화면 10초 요건 때문에 기다리지 않는다.
 */
export function TitleScreen(): ReactElement {
  const { actions } = useGame();
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void actions.hasSave().then((found) => {
      if (!cancelled) setHasSave(found);
    });

    return () => {
      cancelled = true;
    };
  }, [actions]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Text style={styles.title}>아이키우기</Text>
      <Text style={styles.subtitle}>열아홉 번의 선택</Text>

      <View style={styles.buttons}>
        {hasSave && (
          <Pressable
            style={[styles.button, styles.primary]}
            accessibilityRole="button"
            onPress={() => void actions.resume()}
          >
            <Text style={styles.primaryLabel}>이어하기</Text>
          </Pressable>
        )}

        <Pressable style={styles.button} accessibilityRole="button" onPress={actions.start}>
          <Text style={styles.label}>새로 시작</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  title: { color: color.text, fontSize: font.display, fontWeight: '700' },
  subtitle: { color: color.textWeak, fontSize: font.body, marginBottom: space.xl },
  buttons: { width: '70%', gap: space.md },
  button: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  primary: { backgroundColor: color.accent },
  primaryLabel: { color: color.textInverse, fontSize: font.body, fontWeight: '600' },
  label: { color: color.text, fontSize: font.body, fontWeight: '600' },
});
