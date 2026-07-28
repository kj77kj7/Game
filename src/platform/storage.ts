/** 저장소 인터페이스 */

/**
 * 어떤 구현도 예외를 던지지 않는다. 저장 실패로 게임이 멈추면 안 된다 (설계서 §15).
 *
 * 읽기 실패는 `null`, 쓰기 실패는 `false`로 알린다.
 * 호출부는 실패를 무시하고 다음 턴에 다시 저장하면 된다 — 재시도를 여기서 하지 않는다.
 */
export interface Storage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<boolean>;
  remove(key: string): Promise<void>;
}
