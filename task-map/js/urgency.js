/**
 * Urgency calculation (not persisted — computed from now).
 *
 * remainingHours = deadline - now
 * requiredHours  = estimatedMinutes / 60
 * ratio          = requiredHours / remainingHours
 * urgency        = min(100, ratio * 200)
 * past deadline  → urgency = 100
 */
function calculateUrgency(deadline, estimatedMinutes, now = new Date()) {
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const remainingMs = deadlineDate.getTime() - now.getTime();

  if (Number.isNaN(deadlineDate.getTime()) || remainingMs <= 0) {
    return 100;
  }

  const remainingHours = remainingMs / (1000 * 60 * 60);
  const requiredHours = Number(estimatedMinutes) / 60;

  if (remainingHours <= 0 || !Number.isFinite(requiredHours)) {
    return 100;
  }

  const ratio = requiredHours / remainingHours;
  return Math.min(100, ratio * 200);
}
