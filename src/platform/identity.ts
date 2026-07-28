/** 사용자 식별 인터페이스 */

/**
 * 저장 키의 네임스페이스로만 쓴다. 계정 기능이 아니다.
 *
 * 식별에 실패하면 `null`을 돌려주고, 그때는 기기 단일 슬롯으로 저장한다.
 * 식별 실패가 "이어하기 불가"가 되면 안 된다.
 */
export interface Identity {
  userKey(): Promise<string | null>;
}
