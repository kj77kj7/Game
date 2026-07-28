/** 시드 기반 난수 */

// 아래 상수는 밸런싱 수치가 아니라 mulberry32 알고리즘의 일부다.
// balance.ts로 옮기면 "밸런싱하려고 여는 파일"에 만질 일 없는 값이 섞인다.
const SEED_STEP = 0x6d2b79f5;
const UINT32 = 4294967296;

export interface Rolled<T> {
  value: T;
  /** 다음 호출에 넘길 시드. 상태에 실어 재현성을 확보한다 */
  seed: number;
}

/** 0 이상 1 미만 */
export function roll(seed: number): Rolled<number> {
  const next = (seed + SEED_STEP) | 0;
  let t = Math.imul(next ^ (next >>> 15), next | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / UINT32, seed: next };
}

export function rollInt(seed: number, maxExclusive: number): Rolled<number> {
  const r = roll(seed);
  return { value: Math.floor(r.value * maxExclusive), seed: r.seed };
}

/** 빈 배열이면 던진다. 호출부가 빈 테이블을 넘기는 건 데이터 오류다 */
export function rollPick<T>(seed: number, items: readonly T[]): Rolled<T> {
  const r = rollInt(seed, items.length);
  const value = items[r.value];
  if (value === undefined) throw new Error('rollPick: 빈 배열');
  return { value, seed: r.seed };
}

/** 서로 다른 n개를 뽑는다. 재능 2종 부여에 쓴다 */
export function rollPickDistinct<T>(seed: number, items: readonly T[], n: number): Rolled<T[]> {
  const pool = [...items];
  const picked: T[] = [];
  let s = seed;

  for (let i = 0; i < n && pool.length > 0; i += 1) {
    const r = rollInt(s, pool.length);
    s = r.seed;
    const [taken] = pool.splice(r.value, 1);
    if (taken !== undefined) picked.push(taken);
  }

  return { value: picked, seed: s };
}
