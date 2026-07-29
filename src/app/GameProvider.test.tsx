import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { createMockPlatform } from '../platform-mock';
import { CARE } from '../core/data/balance';
import { useCareTick } from './hooks/useCareTick';
import { useGame } from './hooks/useGame';
import { GameProvider } from './GameProvider';

/**
 * 1초 틱이 턴 화면을 리렌더하지 않는다는 건 설계의 전제다 (설계서 §12 성능, 지침 Phase 5).
 * 타입으로 막아뒀지만 타입은 "읽지 못한다"만 보장하고 "리렌더되지 않는다"는 보장하지 못한다.
 * 여기서 실제로 센다.
 */

function makeProbe() {
  const counts = { turn: 0, live: 0 };

  function TurnProbe() {
    const { state } = useGame();
    counts.turn += 1;
    return <Text testID="age">{state === null ? 'none' : `${state.age}세`}</Text>;
  }

  function LiveProbe() {
    const live = useCareTick();
    counts.live += 1;
    return <Text testID="hunger">{live === null ? 'none' : `${Math.floor(live.hunger)}`}</Text>;
  }

  return { counts, TurnProbe, LiveProbe };
}

function Starter() {
  const { actions } = useGame();
  return <Text testID="start" onPress={actions.start}>시작</Text>;
}

describe('GameProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('시작 전에는 상태가 비어 있다', () => {
    const { TurnProbe, LiveProbe } = makeProbe();

    render(
      <GameProvider platform={createMockPlatform()}>
        <TurnProbe />
        <LiveProbe />
      </GameProvider>,
    );

    expect(screen.getByTestId('age')).toHaveTextContent('none');
    expect(screen.getByTestId('hunger')).toHaveTextContent('none');
  });

  test('1초 틱은 턴 화면을 리렌더하지 않는다', () => {
    const { counts, TurnProbe, LiveProbe } = makeProbe();

    render(
      <GameProvider platform={createMockPlatform()}>
        <Starter />
        <TurnProbe />
        <LiveProbe />
      </GameProvider>,
    );

    act(() => {
      screen.getByTestId('start').props.onPress();
    });
    expect(screen.getByTestId('age')).toHaveTextContent('0세');

    const turnBefore = counts.turn;
    const liveBefore = counts.live;

    // 5초를 흘려보낸다
    act(() => {
      jest.advanceTimersByTime(CARE.tickMs * 5);
    });

    expect(counts.live).toBeGreaterThan(liveBefore);
    expect(counts.turn).toBe(turnBefore);
  });

  test('니즈는 틱마다 줄어든다', () => {
    const { TurnProbe, LiveProbe } = makeProbe();

    render(
      <GameProvider platform={createMockPlatform()}>
        <Starter />
        <TurnProbe />
        <LiveProbe />
      </GameProvider>,
    );

    act(() => {
      screen.getByTestId('start').props.onPress();
    });
    expect(screen.getByTestId('hunger')).toHaveTextContent('100');

    act(() => {
      jest.advanceTimersByTime(3600_000);
    });

    // 한 시간이 지나면 눈에 띄게 줄어 있어야 한다. 0으로 떨어지진 않는다.
    const hunger = Number(screen.getByTestId('hunger').props.children);
    expect(hunger).toBeLessThan(100);
    expect(hunger).toBeGreaterThan(0);
  });
});
