/** 리워드 광고 인터페이스 */

/**
 * `rewarded`일 때만 슬롯을 준다. 나머지는 전부 아무 일도 없던 것으로 처리한다.
 *
 * 광고를 못 보는 것이 손해가 되면 안 된다 — 슬롯 2칸으로 게임이 완주돼야 하고,
 * 광고는 그 위에 얹는 보너스다.
 */
export type RewardOutcome = 'rewarded' | 'dismissed' | 'unavailable';

export interface Ads {
  /**
   * 사전 로딩. 검수 요건이라 노출 시점에 불러오면 안 된다 (설계서 §16).
   * 실패해도 조용히 넘어간다 — 광고는 게임 진행의 전제가 아니다.
   */
  preload(): void;

  isReady(): Promise<boolean>;

  show(): Promise<RewardOutcome>;
}
