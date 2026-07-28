/** 상태 관리 단일 진입점 */

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren, ReactElement } from 'react';

import { CARE } from '../core/data/balance';
import {
  acceptRequest,
  accrue,
  applyAction,
  buyUpgrade,
  drain,
  endTurn,
  fill,
  grantAdSlot,
  overtime,
  rejectRequest,
  rollRequest,
  spendSlot,
  stageOf,
  travel,
} from '../core/engine';
import { createInitialState, deserialize, serialize } from '../core/state';
import type {
  ActionId,
  ConsumptionTier,
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

export interface GameContextValue {
  /** 아직 시작하지 않았으면 null */
  state: TurnState | null;
  actions: GameActions;
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

/** 자리를 비운 동안의 수급과 니즈 감소를 한 번에 반영한다. 벌점은 없다 */
function catchUp(state: GameState, now: number): GameState {
  return accrue(drain(state, now - state.lastSeenAt), now);
}

export function GameProvider({
  platform,
  children,
}: PropsWithChildren<{ platform: Platform }>): ReactElement {
  const stateRef = useRef<GameState | null>(null);
  const [turn, setTurn] = useState<TurnState | null>(null);
  const [live, setLive] = useState<LiveState | null>(null);

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
        commit(createInitialState(now, now));
      },

      async resume() {
        const raw = await platform.storage.get(await saveKey());
        if (raw === null) return false;

        const loaded = deserialize(raw);
        if (loaded === null) return false;

        commit(catchUp(loaded, Date.now()));
        return true;
      },

      act(id, chosenSubject) {
        spend((state) => applyAction(state, id, chosenSubject).state);
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

        const rolled = rollRequest(endTurn(current));
        commit(rolled.state);

        // 자동 저장은 턴 종료 시점에만 한다. 실패해도 다음 턴이 다시 저장한다 (설계서 §15).
        void saveKey().then((key) => platform.storage.set(key, serialize(rolled.state)));
      },
    }),
    [commit, platform, saveKey, spend],
  );

  const gameValue = useMemo<GameContextValue>(() => ({ state: turn, actions }), [turn, actions]);

  return (
    <GameContext.Provider value={gameValue}>
      <LiveContext.Provider value={live}>{children}</LiveContext.Provider>
    </GameContext.Provider>
  );
}
