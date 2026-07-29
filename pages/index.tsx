import { createRoute } from '@granite-js/react-native';

import { App } from '../src/app/App';

/**
 * 게임 전체가 이 한 화면에 들어간다.
 *
 * 라우터를 쓰지 않는 이유: 타이틀·진행·엔딩은 URL이 아니라 게임 상태로 갈린다.
 * 라우트로 나누면 "저장 없이 엔딩 주소로 들어가면 어떻게 되는가" 같은 질문이 생기는데,
 * 19턴짜리 단일 세션 게임에는 답할 가치가 없는 질문이다.
 *
 * `adGroupId`는 앱인토스 콘솔에서 광고 그룹을 만든 뒤 넣는다.
 * 빈 문자열이면 광고만 동작하지 않고 나머지는 전부 정상이다.
 * `debug`는 개발 중에만 켠다 — 화면 아래에 나이 점프·자금 치트 바가 붙는다.
 */
export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  return <App adGroupId="" debug />;
}
