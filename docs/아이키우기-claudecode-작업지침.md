# 아이키우기 — Claude Code 작업 지침

> 이 문서를 `아이키우기-통합-설계서.md`와 **함께** Claude Code에 전달한다.
> 설계서는 무엇을 만들지, 이 문서는 어떻게 만들지를 정한다.

---

## 최초 1회 입력

```
너는 React Native 기반 모바일 게임을 함께 만드는 시니어 개발자야.
'아이키우기'라는 육성 시뮬레이션 게임을 만들 거야.

첨부한 `아이키우기-통합-설계서.md`가 유일한 스펙이야.
이 지침 문서는 코드를 어떻게 쓸지에 대한 규칙이고.

## 실행 환경
- 앱인토스(Apps in Toss) 미니앱. Granite 프레임워크(React Native 기반)
- SDK: `@apps-in-toss/framework`, UI: `@toss/tds-react-native`
- 장기적으로 구글 플레이스토어 이식 예정
- 플랫폼 제약은 설계서 §16, §17 참조. 반드시 준수할 것

## 작업 방식
- Phase 단위로 진행한다. 내가 다음 Phase를 지시하기 전까지 넘어가지 마
- 각 Phase 시작 전에 무엇을 만들지 먼저 말하고, 내 확인을 받고 작성해
- 코드를 쓰기 전에 아래 '파일 구조'와 '코드 규칙'을 반드시 읽어

먼저 설계서와 이 지침을 읽고, 이해한 내용을 요약해줘.
불명확한 부분이 있으면 질문해. 아직 코드는 쓰지 마.
```

---

## 파일 구조

**이 구조를 먼저 만들고 시작한다.** 코드를 쓰면서 구조를 즉흥적으로 늘리지 않는다.

```
child-raising-game/
├── granite.config.ts
├── package.json
├── tsconfig.json
└── src/
    ├── core/                      # 순수 TypeScript. RN·SDK import 절대 금지
    │   ├── types.ts               # GameState 및 공용 타입
    │   ├── state.ts               # 초기 상태 생성, 직렬화/역직렬화
    │   ├── engine/
    │   │   ├── index.ts           # 외부 공개 API만 재노출
    │   │   ├── turn.ts            # 턴 진행, 슬롯 소비
    │   │   ├── action.ts          # 행동 적용, 반복 등급, 적성
    │   │   ├── care.ts            # 돌봄 니즈 (허기·청결) 실시간 감소
    │   │   ├── economy.ts         # 자동 수급, 업그레이드, 소비 적정선
    │   │   ├── request.ts         # 요구 이벤트 발생·수용·거절
    │   │   ├── major.ts           # 계열 적합도 집계
    │   │   └── ending.ts          # 3축 엔딩 판정
    │   ├── data/
    │   │   ├── balance.ts         # ★ 모든 수치 상수의 단일 출처
    │   │   ├── actions.ts
    │   │   ├── requests.ts
    │   │   ├── dialogue.ts
    │   │   ├── consumption.ts     # 카테고리·티어·연령별 적정선
    │   │   ├── upgrades.ts
    │   │   ├── majors.ts          # 계열 계산식
    │   │   └── endings.ts         # 3축 텍스트 조각
    │   └── util/
    │       └── rng.ts             # 시드 기반 난수
    │
    ├── platform/                  # 인터페이스 정의만. 구현 없음
    │   ├── index.ts
    │   ├── storage.ts
    │   ├── ads.ts
    │   ├── iap.ts
    │   └── identity.ts
    │
    ├── platform-toss/             # 앱인토스 구현체
    │   └── index.ts
    │
    ├── app/
    │   ├── GameProvider.tsx       # 상태 관리 단일 진입점
    │   └── hooks/
    │       ├── useGame.ts         # 턴 단위 상태 (저빈도 갱신)
    │       └── useCareTick.ts     # 돌봄 니즈 (고빈도 갱신, 분리 필수)
    │
    └── ui/
        ├── screens/
        │   ├── TitleScreen.tsx
        │   ├── GameScreen.tsx
        │   └── EndingScreen.tsx
        ├── components/
        │   ├── Child.tsx          # 캐릭터 레이어 합성
        │   ├── SpeechBubble.tsx
        │   ├── NeedBar.tsx
        │   ├── ActionSheet.tsx
        │   └── StatDrawer.tsx     # 세부 스탯 드릴다운
        └── theme/
            └── tokens.ts
```

### 구조 규칙

| 규칙 | 내용 |
|---|---|
| 폴더 깊이 | `src/` 기준 3단계 이내 |
| `core/` 격리 | `react`, `react-native`, SDK를 import하면 안 된다. 위반 시 이식 불가 |
| 상수 단일 출처 | 모든 수치는 `data/balance.ts`에만 존재한다. 다른 파일에 매직 넘버 금지 |
| UI → SDK | UI는 SDK를 직접 호출하지 않는다. 반드시 `platform/` 인터페이스 경유 |
| `platform-play/` | 2차 이식 시점에 만든다. 지금은 만들지 않는다 |
| 테스트 | 소스 옆에 `*.test.ts`로 배치. 별도 `tests/` 폴더를 만들지 않는다 |

---

## 코드 규칙

```
아래 규칙을 모든 코드 작성·수정에 적용해줘.

### 최소주의
- 지금 필요한 것만 쓴다. "나중에 쓸 것 같아서" 만든 코드는 금지 (YAGNI)
- 추상화는 같은 패턴이 3번째 나타날 때 만든다. 1~2번은 중복을 허용한다
- 옵션 파라미터, 설정 플래그, 확장 포인트를 미리 만들지 않는다
- 새 파일을 만들기 전에 기존 파일에 들어갈 자리가 있는지 먼저 확인한다
- 래퍼 함수를 만들지 않는다. 한 줄 위임만 하는 함수는 지운다

### 삭제
- 코드를 수정할 때마다, 그 수정으로 쓰이지 않게 된 코드를 찾아 같은 커밋에서 지운다
- 주석 처리된 코드를 남기지 않는다. 필요하면 git이 기억한다
- 더 이상 참조되지 않는 타입, 상수, 유틸, import를 남기지 않는다
- 리팩터링 후에는 "이제 안 쓰이는 게 뭐지?"를 반드시 한 번 점검한다

### 타입
- `any` 금지. 불가피하면 `unknown` 후 좁힌다
- 타입 단언(`as`)을 피한다. 타입 가드를 쓴다
- 데이터 테이블은 `as const` + 파생 타입으로 정의해 오타를 컴파일 타임에 잡는다

### 순수성
- `core/`의 모든 함수는 순수 함수다. 부작용 없음, 같은 입력에 같은 출력
- 상태를 변경하지 말고 새 상태를 반환한다
- 난수는 인자로 주입받는다. 함수 내부에서 `Math.random()`을 호출하지 않는다
  → 밸런싱 시뮬레이션을 재현할 수 있어야 한다

### 성능
- 돌봄 니즈는 1초마다 갱신된다. 이 틱이 전체 트리를 리렌더시키면 안 된다
  → `useCareTick`을 `useGame`과 분리하고, 니즈를 표시하는 컴포넌트만 구독시킨다
- 애니메이션은 Reanimated로 처리한다. JS 스레드를 막지 않는다
- 리스트는 key를 안정적으로 준다. 인덱스를 key로 쓰지 않는다
- `memo`/`useCallback`은 실제 리렌더 문제가 확인된 곳에만 쓴다. 습관적으로 뿌리지 않는다

### 파일 크기
- 파일 200줄, 함수 40줄을 넘으면 나눌 지점을 찾는다
- 단, 데이터 테이블 파일(`data/`)은 예외다. 길어도 나누지 않는다

### 주석
- "무엇을 하는지"는 쓰지 않는다. 코드가 말한다
- "왜 이렇게 했는지"만 쓴다. 특히 밸런싱 의도와 플랫폼 제약
- 설계서의 원칙을 어기기 쉬운 지점에는 근거를 남긴다
  예: `// 부재는 벌하지 않는다. 오프라인 경과로 애착을 깎지 말 것`

### 커밋 단위
- 한 커밋은 한 가지 일만 한다
- 기능 추가와 리팩터링을 섞지 않는다
```

---

## Phase 진행

### Phase 0 — 프로젝트 생성 (직접 실행)

```bash
npm create granite-app       # 앱 이름: child-raising-game
cd child-raising-game
npm install
npm install @apps-in-toss/framework @toss/tds-react-native
npx ait init
```

콘솔([apps-in-toss.toss.im](https://apps-in-toss.toss.im))에서 워크스페이스를 먼저 만들고,
`granite.config.ts`의 `appName`을 콘솔 등록명과 일치시킨다.

### Phase 1 — 구조 생성

```
위 '파일 구조'대로 폴더와 빈 파일을 만들어줘.
각 파일 상단에 그 파일이 무엇을 담당하는지 한 줄 주석만 넣고, 구현은 아직 하지 마.
tsconfig에 `core/`가 react-native를 import하지 못하도록 lint 규칙을 넣을 수 있으면 넣어줘.
```

### Phase 2 — 코어 데이터

```
`core/types.ts`, `core/data/balance.ts`, 그리고 data/ 하위 테이블들을 작성해줘.
설계서 §3~§11의 수치를 그대로 옮기되, 모든 숫자는 balance.ts에만 두고
다른 파일은 balance.ts를 참조하게 해.

dialogue.ts는 이미 작성된 파일이 있으니 그대로 배치해.
```

### Phase 3 — 엔진

```
`core/engine/` 하위를 작성해줘. 전부 순수 함수로.
- turn.ts: 턴 진행, 슬롯 소비
- action.ts: 행동 적용, 반복 등급, 적성 보정
- care.ts: 돌봄 니즈 감소 및 충족
- economy.ts: 자동 수급, 업그레이드, 소비 적정선 판정
- request.ts: 요구 발생·수용·거절
- major.ts: 계열 적합도
- ending.ts: 3축 판정

각 파일마다 `*.test.ts`를 같이 만들어서 핵심 분기를 검증해줘.
난수는 반드시 인자로 주입받게.
```

### Phase 4 — 플랫폼 어댑터

```
`platform/`에 인터페이스를 정의하고 `platform-toss/`에 앱인토스 구현을 붙여줘.
저장은 SDK Storage API를 쓰고, 실패해도 게임이 멈추지 않게 처리해.
```

### Phase 5 — 상태 관리

```
`app/GameProvider.tsx`와 hooks를 작성해줘.
- useGame: 턴 단위 상태
- useCareTick: 1초 틱. 반드시 useGame과 분리해서 전체 리렌더를 막을 것
자동 저장은 턴 종료 시점에만 한다.
```

### Phase 6 — 화면

```
`ui/`를 작성해줘. 설계서 §12의 화면 구성과 §16의 검수 요건을 지킬 것.
- 숫자를 노출하지 않는다. 등급 표기
- 선택지에 결과 방향(▲▼) 표시
- 세로 고정, Safe Area 준수, 우측 상단 닫기 버튼
- 아트가 아직 없으므로 캐릭터는 단색 도형 플레이스홀더로
```

### Phase 7 — 밸런싱

```
플레이 패턴 시뮬레이션 스크립트를 만들어줘.
설계서 §18의 체크리스트 10개 항목을 자동으로 검증하고,
실패한 항목을 출력하게 해.
```

---

## 참고 문서

| 내용 | 링크 |
|---|---|
| React Native 시작하기 | https://developers-apps-in-toss.toss.im/tutorials/react-native.html |
| 게임 검수 체크리스트 | https://developers-apps-in-toss.toss.im/checklist/app-game.html |
| TDS React Native | https://tossmini-docs.toss.im/tds-react-native/ |
| 콘솔 | https://apps-in-toss.toss.im |

SDK 관련해서 모르는 부분이 있으면 위 URL을 직접 읽고 반영하도록 지시할 것.
