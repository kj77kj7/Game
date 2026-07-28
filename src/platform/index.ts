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
}
