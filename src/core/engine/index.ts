/** 엔진 외부 공개 API 재노출 */

export { applyAction, actionCost, repeatGradeOf, targetFieldOf } from './action';
export type { ActionBlock, ActionResult } from './action';

export { careGrowthBonus, drain, fill } from './care';

export {
  accrue,
  buyUpgrade,
  consumptionGap,
  consumptionOutcome,
  fitOf,
  housingIsFit,
  incomePerSecond,
  isUnlocked,
  offlineCapMs,
  overtime,
  travel,
  upgradeCost,
} from './economy';
export type { ConsumptionFit, ConsumptionOutcome } from './economy';

export { judge, lifeQuality, subjectAverage, universityTier } from './ending';

export { bestMajor, majorFits } from './major';
export type { BestMajor } from './major';

export {
  acceptRequest,
  canAfford,
  rejectRequest,
  requestChance,
  rollRequest,
  stallsSubjects,
} from './request';
export type { RequestRoll } from './request';

export {
  endTurn,
  grantAdSlot,
  isFinished,
  spendSlot,
  stageOf,
  stressBandOf,
  stressGrowthMultiplier,
} from './turn';
