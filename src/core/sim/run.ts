/** 체크리스트 실행 진입점 */

import { runChecklist } from './checklist';

const results = runChecklist();
const failed = results.filter((r) => !r.passed);

for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'}  ${r.name}\n        ${r.detail}`);
}

console.log(`\n${results.length - failed.length}/${results.length} 통과`);

if (failed.length > 0) process.exitCode = 1;
