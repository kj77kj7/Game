/** 플랫폼 인터페이스 재노출 */

import type { Ads } from './ads';
import type { Identity } from './identity';
import type { Storage } from './storage';

export type { Ads, RewardOutcome } from './ads';
export type { Identity } from './identity';
export type { Storage } from './storage';

/**
 * UI는 이 묶음만 본다. SDK를 직접 부르지 않는다 (설계서 §17).
 * 플레이스토어 이식은 이 인터페이스를 만족하는 구현체를 하나 더 만드는 것으로 끝난다.
 */
export interface Platform {
  storage: Storage;
  ads: Ads;
  identity: Identity;

  /**
   * 미니앱 종료. OS 뒤로가기 제스처를 못 쓰기 때문에 화면에 닫기 버튼이 필수다 (설계서 §16).
   * 확인 모달은 UI가 띄우고, 이 함수는 확인 이후에만 불린다.
   *
   * 파일을 따로 두지 않은 이유: 창구가 이 함수 하나뿐이라
   * `platform/system.ts`를 만들면 파일 하나에 함수 하나가 된다.
   */
  close(): void;
}
