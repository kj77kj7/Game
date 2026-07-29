/** 상태 관리 단일 진입점 */

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren, ReactElement } from 'react';

import { CARE } from '../core/data/balance';
import { selectDialogueAvoiding } from '../core/data/dialogue';
import { SELF_RESTRAINT_LINES } from '../core/data/requests';
import { OVERTIME, TURN } from '../core/data/balance';
import {
  acceptRequest,
  accrue,
  applyAction,
  buyUpgrade,
  drain,
  endTurn,
  fill,
  grantAdSlot,
  isFinished,
  judge,
  overtime,
  rejectRequest,
  rollRequest,
  consumptionGap,
  spendSlot,
  stageOf,
  targetFieldOf,
  travel,
} from '../core/engine';
import { createInitialState, deserialize, serialize } from '../core/state';
import { roll } from '../core/util/rng';
import type {
  ActionId,
  ConsumptionTier,
  Ending,
  GameState,
  NeedKey,
  SubjectStat,
  UpgradeId,
  UpkeepCategory,
} from '../core/types';
import type { Platform } from '../platform';

/**
 * 턴 단위 상태. 1초마다 움직이는 값은 여기서 빼놓았다.
 *
 * 타입으로 빼야 실수가 막힌다. 주석으로만 "여긴 구독하지 마세요"라고 두면
 * 언젠가 누가 `state.funds`를 읽고, 그 화면이 초당 한 번씩 리렌더된다.
 */
export type TurnState = Omit<GameState, 'needs' | 'funds' | 'lastSeenAt'>;

/** 1초마다 갱신되는 값. 이걸 구독하는 컴포넌트만 초당 한 번 리렌더된다 */
export interface LiveState {
  hunger: number;
  hygiene: number;
  funds: number;
}

export interface GameActions {
  start(): void;
  /** 이어하기 버튼을 보여줄지 판단한다. 복원은 하지 않는다 */
  hasSave(): Promise<boolean>;
  resume(): Promise<boolean>;
  act(id: ActionId, chosenSubject?: SubjectStat): void;
  care(need: NeedKey): void;
  setTier(category: UpkeepCategory, tier: ConsumptionTier): void;
  goTravel(tier: ConsumptionTier): void;
  accept(): void;
  reject(): void;
  work(): void;
  buy(id: UpgradeId): void;
  watchAd(): Promise<void>;
  next(): void;
}

/**
 * 테스트 전용. 19턴을 매번 처음부터 굴리면 고등기 밸런스를 볼 수가 없다.
 * 운영 빌드에서는 `debug` 프롭을 주지 않아 null이 되고, UI도 아무것도 그리지 않는다.
 */
export interface DevActions {
  jumpToAge(age: number): void;
  grantFunds(amount: number): void;
  grantSlots(count: number): void;
}

export interface GameContextValue {
  /** 아직 시작하지 않았으면 null */
  state: TurnState | null;
  /** 이번 턴의 아이 대사. 한 턴에 하나만 바뀐다 (설계서 §13) */
  line: string;
  /** 19세 판정이 끝났으면 결과. 아직이면 null */
  ending: Ending | null;
  actions: GameActions;
  /** 디버그 모드가 아니면 null */
  dev: DevActions | null;
}

export const GameContext = createContext<GameContextValue | null>(null);
export const LiveContext = createContext<LiveState | null>(null);

const DEVICE_KEY = 'device';

const toTurnState = ({ needs: _n, funds: _f, lastSeenAt: _l, ...turn }: GameState): TurnState =>
  turn;

const toLiveState = (state: GameState): LiveState => ({
  hunger: state.needs.hunger,
  hygiene: state.needs.hygiene,
  funds: state.funds,
});

/**
 * 대사는 턴이 넘어갈 때만 새로 뽑는다.
 * 1초 틱마다 다시 뽑으면 아이가 매초 다른 말을 하고, 그건 §13의 "한 턴에 하나"가 아니다.
 */
function pickLine(state: GameState, match: 'match' | 'mismatch' | 'neutral', previous: string): string {
  const rolled = roll(state.seed);

  return selectDialogueAvoiding(
    {
      age: state.age,
      hunger: state.needs.hunger,
      hygiene: state.needs.hygiene,
      stress: state.stats.stress,
      esteem: state.stats.esteem,
      independence: state.stats.independence,
      bond: state.bond,
      consumptionGap: consumptionGap(state, stageOf(state.age)),
      talentMatch: match,
    },
    rolled.value,
    previous,
  );
}

function pickSelfRestraintLine(seed: number): string {
  const rolled = roll(seed);
  const index = Math.floor(rolled.value * SELF_RESTRAINT_LINES.length);
  return SELF_RESTRAINT_LINES[index] ?? SELF_RESTRAINT_LINES[0] ?? '';
}

/** 연속 야근 중에는 무슨 상태든 아이가 서운함을 먼저 말한다 */
function pickNegativeLine(state: GameState): string {
  return pickLine({ ...state, bond: 0 }, 'neutral', '');
}

/** 자리를 비운 동안의 수급과 니즈 감소를 한 번에 반영한다. 벌점은 없다 */
function catchUp(state: GameState, now: number): GameState {
  return accrue(drain(state, now - state.lastSeenAt), now);
}

export function GameProvider({
  platform,
  debug = false,
  children,
}: PropsWithChildren<{ platform: Platform; debug?: boolean }>): ReactElement {
  const stateRef = useRef<GameState | null>(null);
  const [turn, setTurn] = useState<TurnState | null>(null);
  const [live, setLive] = useState<LiveState | null>(null);
  const [line, setLine] = useState('');
  const [ending, setEnding] = useState<Ending | null>(null);
  const lastMatchRef = useRef<'match' | 'mismatch' | 'neutral'>('neutral');

  const saveKeyRef = useRef<Promise<string> | null>(null);
  const saveKey = useCallback((): Promise<string> => {
    saveKeyRef.current ??= platform.identity
      .userKey()
      .then((key) => `save:${key ?? DEVICE_KEY}`);
    return saveKeyRef.current;
  }, [platform]);

  const commit = useCallback((next: GameState): void => {
    stateRef.current = next;
    setTurn(toTurnState(next));
    setLive(toLiveState(next));
  }, []);

  /** 턴이 바뀌는 지점에서만 부른다 */
  const refreshLine = useCallback((next: GameState): void => {
    setLine((previous) => pickLine(next, lastMatchRef.current, previous));
  }, []);

  /** 슬롯을 쓰는 행동의 공통 관문. 슬롯이 없으면 아무 일도 일어나지 않는다 */
  const spend = useCallback(
    (apply: (state: GameState) => GameState): void => {
      const current = stateRef.current;
      if (current === null || current.slots <= 0) return;

      const next = apply(current);
      if (next === current) return;

      commit(spendSlot(next));
    },
    [commit],
  );

  // 니즈와 자금은 같은 1초 틱을 탄다 (설계서 §1, §6-1).
  // 이 effect는 LiveContext만 갱신하므로 턴 화면은 리렌더되지 않는다.
  useEffect(() => {
    const id = setInterval(() => {
      const current = stateRef.current;
      if (current === null) return;

      const next = catchUp(current, Date.now());
      stateRef.current = next;
      setLive(toLiveState(next));
    }, CARE.tickMs);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    platform.ads.preload();
  }, [platform]);

  const actions = useMemo<GameActions>(
    () => ({
      start() {
        const now = Date.now();
        const fresh = createInitialState(now, now);
        lastMatchRef.current = 'neutral';
        setEnding(null);
        commit(fresh);
        refreshLine(fresh);
      },

      async hasSave() {
        return (await platform.storage.get(await saveKey())) !== null;
      },

      async resume() {
        const raw = await platform.storage.get(await saveKey());
        if (raw === null) return false;

        const loaded = deserialize(raw);
        if (loaded === null) return false;

        const restored = catchUp(loaded, Date.now());
        commit(restored);
        refreshLine(restored);
        setEnding(isFinished(restored) ? judge(restored) : null);
        return true;
      },

      act(id, chosenSubject) {
        spend((state) => {
          const target = targetFieldOf(state, id, chosenSubject);
          lastMatchRef.current =
            target === null
              ? 'neutral'
              : state.talents.some((t) => t === target)
                ? 'match'
                : 'mismatch';

          return applyAction(state, id, chosenSubject).state;
        });
      },

      care(need) {
        spend((state) => fill(state, need));
      },

      setTier(category, tier) {
        const current = stateRef.current;
        if (current === null) return;

        // 의식주는 슬롯을 쓰지 않는다. 그래야 턴이 복잡해지지 않는다 (설계서 §6-4).
        commit({ ...current, consumption: { ...current.consumption, [category]: tier } });
      },

      goTravel(tier) {
        spend((state) => travel(state, tier, stageOf(state.age)));
      },

      accept() {
        spend((state) =>
          state.pendingRequest === null ? state : acceptRequest(state, state.pendingRequest),
        );
      },

      reject() {
        const current = stateRef.current;
        if (current === null || current.pendingRequest === null) return;

        // 거절은 슬롯을 쓰지 않는다. 거절하느라 그 턴을 잃으면 거절이 선택이 아니게 된다.
        commit(rejectRequest(current, current.pendingRequest));
      },

      work() {
        spend((state) => overtime(state));
      },

      buy(id) {
        const current = stateRef.current;
        if (current === null) return;
        commit(buyUpgrade(current, id));
      },

      async watchAd() {
        const outcome = await platform.ads.show();
        platform.ads.preload();

        const current = stateRef.current;
        if (outcome !== 'rewarded' || current === null) return;
        commit(grantAdSlot(current));
      },

      next() {
        const current = stateRef.current;
        if (current === null) return;

        const advanced = endTurn(current);

        // 19세는 판정 턴이다. 여기서 멈추지 않으면 나이가 끝없이 올라간다.
        if (isFinished(advanced)) {
          commit(advanced);
          setEnding(judge(advanced));
          void saveKey().then((key) => platform.storage.remove(key));
          return;
        }

        const rolled = rollRequest(advanced);
        commit(rolled.state);

        if (rolled.selfRestrained) {
          // 참은 걸 보여줘야 자립성이 보상으로 읽힌다 (설계서 §10).
          setLine(pickSelfRestraintLine(rolled.state.seed));
        } else if (rolled.state.overtimeStreak >= OVERTIME.negativeDialogueStreak) {
          // 연속 야근 3회 이상이면 대사를 부정으로 고정한다 (설계서 §6-3).
          setLine(pickNegativeLine(rolled.state));
        } else {
          refreshLine(rolled.state);
        }

        // 자동 저장은 턴 종료 시점에만 한다. 실패해도 다음 턴이 다시 저장한다 (설계서 §15).
        void saveKey().then((key) => platform.storage.set(key, serialize(rolled.state)));
      },
    }),
    [commit, platform, refreshLine, saveKey, spend],
  );

  const dev = useMemo<DevActions | null>(() => {
    if (!debug) return null;

    return {
      jumpToAge(age) {
        const current = stateRef.current;
        if (current === null) return;
        commit({ ...current, age, slots: TURN.slotsPerTurn });
      },
      grantFunds(amount) {
        const current = stateRef.current;
        if (current === null) return;
        commit({ ...current, funds: current.funds + amount });
      },
      grantSlots(count) {
        const current = stateRef.current;
        if (current === null) return;
        commit({ ...current, slots: current.slots + count });
      },
    };
  }, [commit, debug]);

  const gameValue = useMemo<GameContextValue>(
    () => ({ state: turn, line, ending, actions, dev }),
    [turn, line, ending, actions, dev],
  );

  return (
    <GameContext.Provider value={gameValue}>
      <LiveContext.Provider value={live}>{children}</LiveContext.Provider>
    </GameContext.Provider>
  );
}
