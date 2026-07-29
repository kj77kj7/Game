/** 메인 게임 화면 */

import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '@granite-js/native/react-native-safe-area-context';
import type { ReactElement } from 'react';

import { useCareTick } from '../../app/hooks/useCareTick';
import { useGame } from '../../app/hooks/useGame';
import { REQUEST_TEXT } from '../../core/data/requests';
import { stageOf, stressBandOf } from '../../core/engine';
import { ActionSheet } from '../components/ActionSheet';
import type { ActionGroup } from '../components/ActionSheet';
import { WardrobeSheet } from '../components/WardrobeSheet';
import { Child } from '../components/Child';
import { NeedBar } from '../components/NeedBar';
import { SpeechBubble } from '../components/SpeechBubble';
import { StatDrawer } from '../components/StatDrawer';
import { EndingScreen } from './EndingScreen';
import { TitleScreen } from './TitleScreen';
import { MENU_LABEL, color, font, radius, space } from '../theme/tokens';

type Panel = 'none' | 'schedule' | 'talk' | 'wardrobe' | 'stats';

/** 무엇을 보고 있는지 시트 상단에 적는다. 목록만 있으면 어디서 왔는지 헷갈린다 */
const PANEL_TITLE: Record<Panel, string> = {
  none: '',
  schedule: '일정',
  talk: '대화',
  wardrobe: '옷장',
  stats: '성장',
};

/**
 * 세로 고정, 스크롤 없이 한 화면 (설계서 §12).
 * 스크롤이 생기는 건 행동 목록과 스탯 서랍뿐이고, 둘 다 모달 안에 있다.
 *
 * 세 국면(타이틀·진행·엔딩)을 여기서 가른다.
 * 상태가 곧 국면이라 라우터를 따로 두면 같은 조건을 두 곳에서 판단하게 된다.
 */
export function GameScreen({ onExit }: { onExit: () => void }): ReactElement | null {
  const { state, line, ending, actions } = useGame();
  const [panel, setPanel] = useState<Panel>('none');

  if (state === null) return <TitleScreen />;
  if (ending !== null) return <EndingScreen ending={ending} onRestart={actions.start} />;

  const request = state.pendingRequest;
  const band = stressBandOf(state.stats.stress);
  const stage = stageOf(state.age);

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

      {/*
        아이를 누르면 스탯 서랍이 열린다.
        하단 메뉴는 §12의 네 개(밥·옷장·대화·일정)로 고정이라 자리가 없고,
        "아이가 어떻게 자랐는지"를 보려고 아이를 누르는 건 설명이 필요 없는 동작이다.
      */}
      <Pressable
        style={styles.stage}
        onPress={() => setPanel('stats')}
        accessibilityRole="button"
        accessibilityLabel="아이 성장 보기"
      >
        <Child age={state.age} clothingTier={state.consumption.clothing} mood={band.band} />
        <Text style={styles.stageHint}>탭해서 성장 보기</Text>
      </Pressable>

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

      <NeedBar moodLabel={band.moodLabel} onFill={actions.care} />

      <View style={styles.slots}>
        <Text style={styles.slotText}>남은 슬롯 {state.slots}</Text>
        {state.slots === 0 && (
          <Pressable onPress={() => void actions.watchAd()} accessibilityRole="button">
            <Text style={styles.adText}>광고 보고 +1</Text>
          </Pressable>
        )}
      </View>

      {/* 아이콘만 두지 않고 라벨을 병기한다 (조사 문서 §2-3) */}
      <View style={styles.menu}>
        <MenuButton item={MENU_LABEL.meal} onPress={() => actions.care('hunger')} />
        <MenuButton item={MENU_LABEL.wardrobe} onPress={() => setPanel('wardrobe')} />
        <MenuButton item={MENU_LABEL.talk} onPress={() => setPanel('talk')} />
        <MenuButton item={MENU_LABEL.schedule} onPress={() => setPanel('schedule')} />
        <MenuButton item={MENU_LABEL.next} onPress={actions.next} primary />
      </View>

      {/*
        RN Modal을 쓰지 않는다.
        앱인토스 웹뷰에서 Modal이 제대로 뜨는지 확인할 방법이 없었고,
        같은 화면 안 오버레이로 그리면 웹·네이티브가 똑같이 동작한다.
        전체를 덮는 시트라 연출상 차이도 없다.
      */}
      {panel !== 'none' && (
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{PANEL_TITLE[panel]}</Text>
            <Pressable
              style={styles.sheetClose}
              onPress={() => setPanel('none')}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            >
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>

          {(panel === 'schedule' || panel === 'talk') && (
            <ActionsPanel
              group={panel === 'schedule' ? 'training' : 'relation'}
              age={state.age}
              slots={state.slots}
              onPick={actions.act}
              onOvertime={actions.work}
            />
          )}
          {panel === 'wardrobe' && (
            <WardrobePanel
              stage={stage}
              current={state.consumption}
              slots={state.slots}
              onSetTier={actions.setTier}
              onTravel={actions.goTravel}
            />
          )}
          {panel === 'stats' && <StatDrawer stats={state.stats} />}
        </View>
      )}
    </SafeAreaView>
  );
}

/** 자금만 1초 틱을 구독한다. 이 컴포넌트를 분리하지 않으면 화면 전체가 초당 리렌더된다 */
function Funds(): ReactElement {
  const live = useCareTick();
  return <Text style={styles.funds}>{Math.floor(live?.funds ?? 0).toLocaleString()}원</Text>;
}

/** 자금은 1초마다 움직인다. 목록만 따로 구독시켜 게임 화면이 초당 리렌더되지 않게 한다 */
function ActionsPanel(props: {
  group: ActionGroup;
  age: number;
  slots: number;
  onPick: ReturnType<typeof useGame>['actions']['act'];
  onOvertime: () => void;
}): ReactElement {
  const live = useCareTick();
  return <ActionSheet {...props} funds={live?.funds ?? 0} />;
}

function WardrobePanel(props: {
  stage: Parameters<typeof WardrobeSheet>[0]['stage'];
  current: Parameters<typeof WardrobeSheet>[0]['current'];
  slots: number;
  onSetTier: ReturnType<typeof useGame>['actions']['setTier'];
  onTravel: ReturnType<typeof useGame>['actions']['goTravel'];
}): ReactElement {
  const live = useCareTick();
  return <WardrobeSheet {...props} funds={live?.funds ?? 0} />;
}

function MenuButton({
  item,
  onPress,
  primary = false,
}: {
  item: { icon: string; label: string };
  onPress: () => void;
  primary?: boolean;
}): ReactElement {
  return (
    <Pressable
      style={[styles.menuButton, primary && styles.menuPrimary]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <Text style={styles.menuIcon}>{item.icon}</Text>
      <Text style={[styles.menuLabel, primary && styles.menuPrimaryLabel]}>{item.label}</Text>
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
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stageHint: { color: color.textWeak, fontSize: font.caption, marginTop: space.sm },
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
    gap: space.xs,
  },
  menuIcon: { fontSize: font.title },
  menuPrimary: { backgroundColor: color.accent },
  menuLabel: { color: color.text, fontSize: font.caption, fontWeight: '600' },
  menuPrimaryLabel: { color: color.textInverse },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.bg,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  sheetTitle: { color: color.text, fontSize: font.title, fontWeight: '700' },
  sheetClose: { padding: space.sm },
});
