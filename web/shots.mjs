/**
 * 주요 화면을 한 번에 캡처한다. 개발 전용.
 *
 * 실기기 배포 없이 레이아웃을 눈으로 확인하기 위한 도구다.
 * Modal·Alert·Safe Area는 웹과 네이티브 구현이 달라서 여기서 판단하지 말 것.
 *
 *   npm run shots           # web/shots/ 에 png 저장
 */

import { mkdir } from 'node:fs/promises';

import { chromium } from 'playwright';

const PREVIEW = process.env.PREVIEW_URL ?? 'http://localhost:4173/';
const OUT = new URL('./shots/', import.meta.url).pathname;

/** 기기 프레임과 같은 크기로 잘라 찍는다 */
const CLIP = { x: 0, y: 0, width: 390, height: 844 };

async function main() {
  await mkdir(OUT, { recursive: true });

  // 이 환경에는 Chromium이 이미 있고 재다운로드가 막혀 있다.
  // playwright가 기대하는 버전과 경로가 달라 실행 파일을 직접 지정한다.
  const executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(
    executablePath === undefined ? {} : { executablePath },
  );
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  const shot = async (name) => {
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUT}${name}.png`, clip: CLIP });
    console.log(`  ${name}.png`);
  };

  const tap = async (text) => {
    await page.getByText(text, { exact: true }).first().click();
  };

  await page.goto(PREVIEW, { waitUntil: 'networkidle' });

  console.log('캡처:');
  await shot('01-title');

  await tap('새로 시작');
  await shot('02-game');

  // 0세에는 해금된 행동이 거의 없다. 치트로 나이를 올려야 목록이 채워진다
  await tap('초등 8');
  await tap('일정');
  await shot('03-schedule');
  await tap('학습지');
  await shot('04-subject-pick');

  await page.goto(PREVIEW, { waitUntil: 'networkidle' });
  await tap('새로 시작');
  await tap('옷장');
  await shot('05-wardrobe');

  await page.goto(PREVIEW, { waitUntil: 'networkidle' });
  await tap('새로 시작');
  await tap('초등 8');
  await tap('대화');
  await shot('06-talk');

  await page.goto(PREVIEW, { waitUntil: 'networkidle' });
  await tap('새로 시작');
  await page.getByLabel('아이 성장 보기').click();
  await shot('07-stats');

  // 고등기 화면. 캐릭터 크기와 행동 목록이 나이대별로 달라진다
  await page.goto(PREVIEW, { waitUntil: 'networkidle' });
  await tap('새로 시작');
  await tap('고등 17');
  await shot('08-teen');
  await tap('일정');
  await shot('09-teen-schedule');

  await browser.close();

  if (errors.length > 0) {
    console.error('\n브라우저 에러:');
    for (const e of errors) console.error(`  ${e}`);
    process.exitCode = 1;
  }
}

await main();
