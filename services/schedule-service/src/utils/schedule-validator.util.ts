import { prisma } from '../lib/prisma.js';

export interface ConflictResult {
  hasConflict: boolean;
  reason?: string;
}

/**
 * Checks for scheduling conflicts:
 * 1. Batch already has a schedule for this dayOfWeek + period
 * 2. Mentor is already assigned to another schedule at the same dayOfWeek + period
 */
export async function checkScheduleConflicts(opts: {
  batchId: string;
  dayOfWeek: string;
  period: number;
  mentorId?: string | null;
  excludeId?: string;
}): Promise<ConflictResult> {
  const { batchId, dayOfWeek, period, mentorId, excludeId } = opts;

  // Check batch period conflict
  const batchConflict = await prisma.schedule.findFirst({
    where: {
      batchId,
      dayOfWeek: dayOfWeek as 'MONDAY',
      period,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  if (batchConflict) {
    return {
      hasConflict: true,
      reason: `Batch already has a schedule for this day and period`,
    };
  }

  // Check mentor conflict (if mentor is assigned)
  if (mentorId) {
    const mentorConflict = await prisma.schedule.findFirst({
      where: {
        mentorId,
        dayOfWeek: dayOfWeek as 'MONDAY',
        period,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: { batch: { select: { name: true } } },
    });

    if (mentorConflict) {
      return {
        hasConflict: true,
        reason: `Mentor is already assigned to batch "${mentorConflict.batch.name}" at this time`,
      };
    }
  }

  return { hasConflict: false };
}
