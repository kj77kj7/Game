/** 브라우저 미리보기 진입점. 개발 전용이며 배포 번들에 들어가지 않는다 */

import { createRoot } from 'react-dom/client';

import { App } from '../src/app/App';
import { createMockPlatform } from '../src/platform-mock';

/**
 * 실기기 없이 레이아웃을 보기 위한 창구다.
 *
 * 여기서 보이는 것과 앱인토스 웹뷰에서 보이는 것은 같지 않다.
 * Modal·Alert·Safe Area는 웹과 네이티브의 구현이 달라서, 그 셋은 여기서 판단하지 말 것.
 * 여백·색·글자 크기·한 화면에 들어가는지 정도를 보는 용도다.
 */
const container = document.getElementById('root');
if (container === null) throw new Error('#root 없음');

createRoot(container).render(<App platform={createMockPlatform()} debug />);
