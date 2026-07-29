/** SDK 없이 도는 구현체. 개발·테스트 전용 */

import type { Ads, Identity, Platform, Storage } from '../platform';

/**
 * 앱인토스 등록 없이 화면을 확인하기 위한 구현체다.
 *
 * `platform-toss`는 토스 앱 안에서만 동작한다. 브리지가 없는 환경에서 열면
 * 저장·광고·식별이 전부 실패하고, 그러면 화면을 보면서 고치는 게 불가능해진다.
 * 인터페이스를 먼저 정의해둔 값을 여기서 회수한다.
 *
 * 운영 빌드에는 들어가지 않는다 — 진입점이 이 파일을 import하지 않는다.
 */

function createMemoryStorage(): Storage {
  // 프로세스가 죽으면 사라진다. 이어하기를 테스트하려면 앱을 껐다 켜지 말고
  // 화면 안에서 새로 시작 → 저장 → 타이틀로 돌아가는 흐름으로 확인할 것.
  const store = new Map<string, string>();

  return {
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
      return true;
    },
    async remove(key) {
      store.delete(key);
    },
  };
}

/** 항상 보상을 준다. 슬롯 추가 흐름을 광고 없이 확인하려는 목적이다 */
function createFakeAds(): Ads {
  return {
    preload() {
      // 불러올 것이 없다
    },
    async isReady() {
      return true;
    },
    async show() {
      return 'rewarded';
    },
  };
}

function createFakeIdentity(): Identity {
  return {
    async userKey() {
      return 'dev';
    },
  };
}

export function createMockPlatform(): Platform {
  return {
    storage: createMemoryStorage(),
    ads: createFakeAds(),
    identity: createFakeIdentity(),
    close() {
      // 개발 중에는 닫을 곳이 없다
    },
  };
}
