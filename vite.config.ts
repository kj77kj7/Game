import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * 브라우저 미리보기 전용 설정. 배포 빌드는 granite가 담당하고 이 파일을 쓰지 않는다.
 *
 * UI가 react-native 기본 컴포넌트만 쓰기 때문에 별칭 두 개로 웹에서 그대로 돈다.
 * 이게 되는 것 자체가 ui/가 SDK에 묶여 있지 않다는 증거이기도 하다.
 */
export default defineConfig({
  root: 'web',
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@granite-js/native/react-native-safe-area-context': path.resolve(
        __dirname,
        'web/safe-area-shim.tsx',
      ),
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.jsx', '.js'],
  },
  define: {
    // react-native-web이 참조한다
    __DEV__: 'true',
    global: 'globalThis',
  },
});
