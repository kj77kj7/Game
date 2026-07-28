/** 앱인토스 SDK 구현체 */

import {
  GoogleAdMob,
  Storage as TossStorage,
  closeView,
  getUserKeyForGame,
} from '@apps-in-toss/framework';
import type { ShowAdMobEvent } from '@apps-in-toss/framework';

import type { Ads, Identity, Platform, RewardOutcome, Storage } from '../platform';

/**
 * 브라우저 storage는 검수에서 막힌다. SDK Storage API만 쓴다 (설계서 §16).
 *
 * 모든 호출을 삼킨다. 저장이 안 되는 상황(용량 초과, 브리지 실패)에서
 * 예외가 UI까지 올라오면 게임이 멈춘다 — 그건 §15 위반이다.
 */
function createStorage(): Storage {
  return {
    async get(key) {
      try {
        return await TossStorage.getItem(key);
      } catch {
        return null;
      }
    },

    async set(key, value) {
      try {
        await TossStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },

    async remove(key) {
      try {
        await TossStorage.removeItem(key);
      } catch {
        // 지우기 실패는 다음 저장이 덮어쓴다. 알릴 것이 없다.
      }
    },
  };
}

/**
 * 리워드 광고. `adGroupId`는 앱인토스 콘솔에 등록한 값이라 코드에 박지 않고 주입받는다.
 *
 * SDK의 load/show는 구독 해제 함수를 돌려주는 이벤트 API다.
 * 게임 쪽에는 "봤나 / 안 봤나" 한 줄만 있으면 되므로 Promise로 좁힌다.
 */
function createAds(adGroupId: string): Ads {
  let unsubscribeLoad: (() => void) | null = null;

  return {
    preload() {
      if (!GoogleAdMob.loadAppsInTossAdMob.isSupported()) return;

      unsubscribeLoad?.();
      unsubscribeLoad = GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId },
        onEvent: () => {
          // 로딩 완료 여부는 isReady()로 확인한다. 여기서 상태를 따로 들고 있지 않는다.
        },
        onError: () => {
          // 광고를 못 불러와도 게임은 그대로 진행된다.
        },
      });
    },

    async isReady() {
      if (!GoogleAdMob.isAppsInTossAdMobLoaded.isSupported()) return false;

      try {
        return await GoogleAdMob.isAppsInTossAdMobLoaded({ adGroupId });
      } catch {
        return false;
      }
    },

    show() {
      return new Promise<RewardOutcome>((resolve) => {
        if (!GoogleAdMob.showAppsInTossAdMob.isSupported()) {
          resolve('unavailable');
          return;
        }

        let settled = false;
        let unsubscribeShow: (() => void) | null = null;

        const finish = (outcome: RewardOutcome): void => {
          if (settled) return;
          settled = true;
          unsubscribeShow?.();
          resolve(outcome);
        };

        unsubscribeShow = GoogleAdMob.showAppsInTossAdMob({
          options: { adGroupId },
          onEvent: (event: ShowAdMobEvent) => {
            // 보상은 userEarnedReward에서만 확정된다.
            // 광고를 끝까지 안 보고 닫으면 dismissed만 오고 보상은 없다.
            if (event.type === 'userEarnedReward') finish('rewarded');
            else if (event.type === 'dismissed') finish('dismissed');
            else if (event.type === 'failedToShow') finish('unavailable');
          },
          onError: () => finish('unavailable'),
        });
      });
    },
  };
}

/**
 * 게임 카테고리 전용 해시키를 쓴다.
 * 실패가 문자열 코드로 오므로, 해시가 실제로 담겨 있을 때만 통과시킨다.
 */
function createIdentity(): Identity {
  return {
    async userKey() {
      try {
        const response = await getUserKeyForGame();
        if (typeof response === 'object' && response !== null && 'hash' in response) {
          return response.hash;
        }
        return null;
      } catch {
        return null;
      }
    },
  };
}

export function createTossPlatform(adGroupId: string): Platform {
  return {
    storage: createStorage(),
    ads: createAds(adGroupId),
    identity: createIdentity(),
    close() {
      void closeView();
    },
  };
}
