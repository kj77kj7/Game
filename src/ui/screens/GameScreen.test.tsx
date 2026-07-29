import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { App } from '../../app/App';
import { createMockPlatform } from '../../platform-mock';

/**
 * 화면이 실제로 그려지는지, 눌러야 하는 것이 눌리는지만 본다.
 * 픽셀은 검사하지 않는다 — 여백이나 비율은 실기기에서 눈으로 봐야 안다.
 *
 * 여기서 잡으려는 건 "빌드는 됐는데 화면이 안 뜬다" 부류다.
 * 그건 실기기 배포 사이클을 한 번 태워야 발견되는데, 그 사이클이 느리다.
 */

const mount = (debug = false) =>
  render(<App platform={createMockPlatform()} debug={debug} />);

const startGame = () => {
  fireEvent.press(screen.getByText('새로 시작'));
};

describe('GameScreen', () => {
  test('타이틀이 먼저 뜬다', () => {
    mount();

    expect(screen.getByText('아이키우기')).toBeTruthy();
    expect(screen.getByText('새로 시작')).toBeTruthy();
  });

  test('새로 시작하면 게임 화면으로 넘어간다', () => {
    mount();
    startGame();

    expect(screen.getByText('0세')).toBeTruthy();
    expect(screen.getByText('남은 슬롯 2')).toBeTruthy();
  });

  test('하단 메뉴 네 개와 다음 해가 모두 있다', () => {
    mount();
    startGame();

    for (const label of ['밥', '옷장', '대화', '일정', '다음 해']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  test('아이를 누르면 스탯 서랍이 열린다', () => {
    mount();
    startGame();

    // 하단 메뉴에 자리가 없어 아이 탭으로 연다. 열 방법이 없으면 §12의 드릴다운이 죽는다.
    fireEvent.press(screen.getByLabelText('아이 성장 보기'));

    expect(screen.getByText('계열 적합도')).toBeTruthy();
    expect(screen.getByText('세부 능력')).toBeTruthy();
  });

  test('옷장에서 소비 티어를 바꿀 수 있다', () => {
    mount();
    startGame();

    fireEvent.press(screen.getByText('옷장'));

    expect(screen.getByText('음식')).toBeTruthy();
    expect(screen.getByText('집밥·간편식')).toBeTruthy();

    fireEvent.press(screen.getByText('배달·외식'));
    // 유아기 적정은 T1이라 T2로 올리면 과함으로 바뀐다
    expect(screen.getAllByText('과함').length).toBeGreaterThan(0);
  });

  test('일정에서 학습지는 과목을 고른 뒤에 실행된다', () => {
    mount(true);
    startGame();

    // 학습지는 6세부터라 나이를 올려야 목록에 뜬다. 치트 바는 debug에서만 뜬다
    fireEvent.press(screen.getByText('초등 8'));
    fireEvent.press(screen.getByText('일정'));

    fireEvent.press(screen.getByText('학습지'));
    expect(screen.getByText('수학')).toBeTruthy();

    fireEvent.press(screen.getByText('수학'));
    // 과목을 고르면 그때 실행되고 슬롯이 하나 빠진다
    expect(screen.getByText('남은 슬롯 1')).toBeTruthy();
  });

  test('턴을 넘기면 나이가 오른다', () => {
    mount();
    startGame();

    act(() => {
      fireEvent.press(screen.getByText('다음 해'));
    });

    expect(screen.getByText('1세')).toBeTruthy();
  });
});

describe('DebugBar', () => {
  test('debug 모드가 아니면 흔적도 없다', () => {
    mount();
    startGame();

    expect(screen.queryByText('+자금')).toBeNull();
  });

  test('debug 모드에서는 게임이 시작된 뒤에 뜬다', () => {
    mount(true);

    // 타이틀에서는 조작할 상태가 없으니 뜨지 않는다
    expect(screen.queryByText('+자금')).toBeNull();

    startGame();
    expect(screen.queryByText('+자금')).toBeTruthy();
  });
});
