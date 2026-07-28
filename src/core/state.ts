/** 초기 상태 생성, 직렬화/역직렬화 */

import { INITIAL, STAT_GRADES, STAT_RANGE, TALENT, TURN } from './data/balance';
import { TALENT_FIELDS } from './data/talents';
import type { GameState, StatDelta, StatKey, TalentField } from './types';
import { rollPickDistinct } from './util/rng';

const ABILITY_KEYS: readonly TalentField[] = TALENT_FIELDS.map((t) => t.field);

const TEMPERAMENT_KEYS = [
  'health',
  'sociability',
  'esteem',
  'independence',
  'stress',
] as const;

const STAT_KEYS: readonly StatKey[] = [...ABILITY_KEYS, ...TEMPERAMENT_KEYS];

const isStatKey = (key: string): key is StatKey => STAT_KEYS.some((k) => k === key);

const clamp = (v: number): number => Math.min(STAT_RANGE.max, Math.max(STAT_RANGE.min, v));

function baseStats(): Record<StatKey, number> {
  return {
    korean: INITIAL.ability,
    english: INITIAL.ability,
    math: INITIAL.ability,
    science: INITIAL.ability,
    socialStudies: INITIAL.ability,
    ballGames: INITIAL.ability,
    trackSwim: INITIAL.ability,
    martialArts: INITIAL.ability,
    fineArts: INITIAL.ability,
    music: INITIAL.ability,
    performing: INITIAL.ability,
    health: INITIAL.temperament,
    sociability: INITIAL.temperament,
    esteem: INITIAL.temperament,
    independence: INITIAL.temperament,
    stress: INITIAL.stress,
  };
}

export function createInitialState(seed: number, now: number): GameState {
  const rolled = rollPickDistinct(seed, ABILITY_KEYS, TALENT.count);
  const [first, second] = rolled.value;
  if (first === undefined || second === undefined) {
    throw new Error('재능 분야가 부족하다');
  }

  return {
    age: TURN.startAge,
    slots: TURN.slotsPerTurn,
    seed: rolled.seed,
    stats: baseStats(),
    needs: { hunger: INITIAL.needs, hygiene: INITIAL.needs },
    funds: INITIAL.funds,
    bond: INITIAL.bond,
    talents: [first, second],
    actionCounts: {},
    mismatchCount: 0,
    consumption: { food: 1, clothing: 1, housing: 1, travel: 1 },
    upgrades: { sideJob: 0, promotion: 0, investment: 0, realEstate: 0, capacity: 0 },
    pendingRequest: null,
    overtimeStreak: 0,
    overtimeUsedThisTurn: false,
    turnsSinceTravel: 0,
    subjectsStalled: false,
    lastSeenAt: now,
  };
}

/** 스탯과 애착에 증감을 적용한다. 상태를 바꾸지 않고 새 상태를 돌려준다 */
export function applyDelta(state: GameState, delta: StatDelta): GameState {
  const stats = { ...state.stats };
  let bond = state.bond;

  for (const [key, amount] of Object.entries(delta)) {
    if (typeof amount !== 'number') continue;
    if (key === 'bond') {
      bond = clamp(bond + amount);
    } else if (isStatKey(key)) {
      stats[key] = clamp(stats[key] + amount);
    }
  }

  return { ...state, stats, bond };
}

/**
 * 수치를 등급 이름으로 바꾼다. 화면에는 숫자를 내보내지 않는다 (설계서 §12).
 * 경계값은 엔딩 판정 문턱과 같은 balance.ts에 있다.
 */
export function statGrade(value: number): string {
  const matched = STAT_GRADES.find((g) => value <= g.max);
  return (matched ?? STAT_GRADES[STAT_GRADES.length - 1] ?? STAT_GRADES[0]).label;
}

/** 여러 출처의 증감을 하나로 합친다. 같은 키는 더한다 */
export function mergeDelta(...deltas: readonly StatDelta[]): StatDelta {
  const merged: StatDelta = {};

  for (const delta of deltas) {
    for (const [key, amount] of Object.entries(delta)) {
      if (typeof amount !== 'number') continue;
      if (key === 'bond') {
        merged.bond = (merged.bond ?? 0) + amount;
      } else if (isStatKey(key)) {
        merged[key] = (merged[key] ?? 0) + amount;
      }
    }
  }

  return merged;
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/**
 * 저장 데이터가 깨졌으면 null을 돌려준다. 던지지 않는다 —
 * 저장·복원 실패로 게임이 멈추면 안 된다 (설계서 §15).
 */
export function deserialize(raw: string): GameState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isGameState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  if (!('age' in value) || typeof value.age !== 'number') return false;
  if (!('seed' in value) || typeof value.seed !== 'number') return false;
  if (!('stats' in value) || typeof value.stats !== 'object' || value.stats === null) {
    return false;
  }
  if (!('talents' in value) || !Array.isArray(value.talents)) return false;
  return value.talents.length === TALENT.count;
}
