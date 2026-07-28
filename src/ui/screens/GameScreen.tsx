/** 메인 게임 화면 */

import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';

import { useCareTick } from '../../app/hooks/useCareTick';
import { useGame } from '../../app/hooks/useGame';
import { REQUEST_TEXT } from '../../core/data/requests';
import { stressBandOf } from '../../core/engine';
import { ActionSheet } from '../components/ActionSheet';
import { Child } from '../components/Child';
import { NeedBar } from '../components/NeedBar';
import { SpeechBubble } from '../components/SpeechBubble';
import { StatDrawer } from '../components/StatDrawer';
import { color, font, radius, space } from '../theme/tokens';

type Panel = 'none' | 'actions' | 'stats';

/**
 * 세로 고정, 스크롤 없이 한 화면 (설계서 §12).
 * 스크롤이 생기는 건 행동 목록과 스탯 서랍뿐이고, 둘 다 모달 안에 있다.
 */
export function GameScreen({ onExit }: { onExit: () => void }): ReactElement | null {
  const { state, line, actions } = useGame();
  const [panel, setPanel] = useState<Panel>('none');

  if (state === null) return null;

  const request = state.pendingRequest;
  const mood = stressBandOf(state.stats.stress).moodLabel;

  // OS 뒤로가기 제스처를 못 쓰므로 닫기 버튼이 유일한 출구다.
  // 확인 모달 없이 닫으면 실수로 나가서 그 턴을 잃는다 (설계서 §16).
  const confirmExit = (): void => {
    Alert.alert('게임을 종료할까요?', '진행 중인 턴은 저장되지 않아요.', [
      { text: '계속하기', style: 'cancel' },
      { text: '종료', style: 'destructive', onPress: onExit },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.age}>{state.age}세</Text>
        <Funds />
        <Pressable onPress={confirmExit} accessibilityRole="button" style={styles.close}>
          <Text style={styles.closeLabel}>✕</Text>
        </Pressable>
      </View>

      <SpeechBubble
        line={request === null ? line : REQUEST_TEXT[request].line}
        emphasized={request !== null}
      />

      <View style={styles.stage}>
        <Child age={state.age} clothingTier={state.consumption.clothing} />
      </View>

      {request !== null && (
        <View style={styles.requestRow}>
          <Pressable style={[styles.chip, styles.accept]} onPress={actions.accept}>
            <Text style={styles.acceptLabel}>들어준다</Text>
          </Pressable>
          <Pressable style={styles.chip} onPress={actions.reject}>
            <Text style={styles.chipLabel}>거절한다</Text>
          </Pressable>
        </View>
      )}

      <NeedBar moodLabel={mood} onFill={actions.care} />

      <View style={styles.slots}>
        <Text style={styles.slotText}>남은 슬롯 {state.slots}</Text>
        {state.slots === 0 && (
          <Pressable onPress={() => void actions.watchAd()} accessibilityRole="button">
            <Text style={styles.adText}>광고 보고 +1</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.menu}>
        <MenuButton label="일정" onPress={() => setPanel('actions')} />
        <MenuButton label="야근" onPress={actions.work} />
        <MenuButton label="성장" onPress={() => setPanel('stats')} />
        <MenuButton label="다음 해" onPress={actions.next} primary />
      </View>

      <Modal visible={panel !== 'none'} animationType="slide" onRequestClose={() => setPanel('none')}>
        <View style={styles.sheet}>
          <Pressable style={styles.sheetClose} onPress={() => setPanel('none')}>
            <Text style={styles.closeLabel}>✕</Text>
          </Pressable>

          {panel === 'actions' && <ActionsPanel onPick={actions.act} slots={state.slots} age={state.age} />}
          {panel === 'stats' && <StatDrawer stats={state.stats} />}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** 자금만 1초 틱을 구독한다. 이 컴포넌트를 분리하지 않으면 화면 전체가 초당 리렌더된다 */
function Funds(): ReactElement {
  const live = useCareTick();
  return <Text style={styles.funds}>{Math.floor(live?.funds ?? 0).toLocaleString()}원</Text>;
}

function ActionsPanel({
  age,
  slots,
  onPick,
}: {
  age: number;
  slots: number;
  onPick: ReturnType<typeof useGame>['actions']['act'];
}): ReactElement {
  const live = useCareTick();
  return <ActionSheet age={age} slots={slots} funds={live?.funds ?? 0} onPick={onPick} />;
}

function MenuButton({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}): ReactElement {
  return (
    <Pressable
      style={[styles.menuButton, primary && styles.menuPrimary]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.menuLabel, primary && styles.menuPrimaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space.lg, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  age: { color: color.text, fontSize: font.title, fontWeight: '700' },
  funds: { color: color.textWeak, fontSize: font.body, flex: 1 },
  close: { padding: space.sm },
  closeLabel: { color: color.textWeak, fontSize: font.title },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  requestRow: { flexDirection: 'row', gap: space.sm, justifyContent: 'center' },
  chip: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
  },
  accept: { backgroundColor: color.accent },
  acceptLabel: { color: color.textInverse, fontSize: font.body, fontWeight: '600' },
  chipLabel: { color: color.text, fontSize: font.body },
  slots: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotText: { color: color.textWeak, fontSize: font.caption },
  adText: { color: color.accent, fontSize: font.caption, fontWeight: '600' },
  menu: { flexDirection: 'row', gap: space.sm },
  menuButton: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  menuPrimary: { backgroundColor: color.accent },
  menuLabel: { color: color.text, fontSize: font.body, fontWeight: '600' },
  menuPrimaryLabel: { color: color.textInverse },
  sheet: { flex: 1, backgroundColor: color.bg, padding: space.lg },
  sheetClose: { alignSelf: 'flex-end', padding: space.sm },
});
