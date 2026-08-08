/**
 * Urgency calculation (not persisted — computed from now).
 *
 * urgency = dayScore (0..50) + timeScore (0..50)
 * past deadline → 100
 *
 * dayScore: based on calendar days until deadline
 *   当日 50%, 1日前 45%, 2日前 40%, 4日前 35%,
 *   8日前 30%, 16日前 20%, 30日以上 0%
 *   （当日に近いほど増え幅が大きい＝ログ空間で補間）
 *
 * timeScore: based on remainingHours / requiredHours
 *   2倍以下で 50%、4倍 40%、8倍 30%、16倍 20% …
 *   （余裕が少ないほど増え幅が大きい）
 */
function calculateUrgency(deadline, estimatedMinutes, now = new Date()) {
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return 100;

  const remainingMs = deadlineDate.getTime() - now.getTime();
  if (remainingMs <= 0) return 100;

  const daysUntil = calendarDaysUntil(deadlineDate, now);
  if (daysUntil < 0) return 100;

  const remainingHours = remainingMs / (1000 * 60 * 60);
  const requiredHours = Number(estimatedMinutes) / 60;

  const dayScore = scoreFromDaysUntil(daysUntil);
  const timeScore = scoreFromTimePressure(remainingHours, requiredHours);

  return Math.min(100, dayScore + timeScore);
}

function calendarDaysUntil(deadline, now) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate()
  );
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/** Anchors: [daysUntil, score 0..50] */
const DAY_SCORE_ANCHORS = [
  [0, 50],
  [1, 45],
  [2, 40],
  [4, 35],
  [8, 30],
  [16, 20],
  [30, 0],
];

function scoreFromDaysUntil(daysUntil) {
  if (daysUntil <= 0) return 50;
  if (daysUntil >= 30) return 0;

  for (let i = 0; i < DAY_SCORE_ANCHORS.length - 1; i++) {
    const [d0, v0] = DAY_SCORE_ANCHORS[i];
    const [d1, v1] = DAY_SCORE_ANCHORS[i + 1];
    if (daysUntil > d1) continue;

    if (d0 === 0) {
      const t = daysUntil / d1;
      return v0 + (v1 - v0) * t;
    }

    const t =
      (Math.log(daysUntil) - Math.log(d0)) / (Math.log(d1) - Math.log(d0));
    return v0 + (v1 - v0) * t;
  }

  return 0;
}

/**
 * ratio = remainingHours / requiredHours
 * ratio <= 2 → 50
 * ratio 4 → 40, 8 → 30, 16 → 20  （log2 で反比例的）
 */
function scoreFromTimePressure(remainingHours, requiredHours) {
  if (!Number.isFinite(requiredHours) || requiredHours <= 0) return 0;
  if (!Number.isFinite(remainingHours) || remainingHours <= 0) return 50;

  const ratio = remainingHours / requiredHours;
  if (ratio <= 2) return 50;

  // 60 - 10 * log2(ratio)  →  2→50, 4→40, 8→30, 16→20, 64→0
  const score = 60 - 10 * (Math.log(ratio) / Math.log(2));
  return Math.min(50, Math.max(0, score));
}
