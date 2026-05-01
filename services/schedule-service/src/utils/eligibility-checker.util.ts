import { prisma } from '../lib/prisma.js';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Eligibility rule: MORNING shift students can attend any schedule.
 * AFTERNOON shift students can only attend AFTERNOON schedules.
 * Student must also be in the batch linked to the schedule.
 */
export async function checkStudentEligibility(
  studentId: string,
  scheduleId: string
): Promise<EligibilityResult> {
  const [student, schedule] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.schedule.findUnique({ where: { id: scheduleId } }),
  ]);

  if (!student) return { eligible: false, reason: 'Student not found' };
  if (!schedule) return { eligible: false, reason: 'Schedule not found' };

  if (student.batchId !== schedule.batchId) {
    return { eligible: false, reason: 'Student is not in the batch for this schedule' };
  }

  if (student.shift === 'AFTERNOON' && schedule.shift === 'MORNING') {
    return {
      eligible: false,
      reason: 'Afternoon shift students cannot attend morning sessions',
    };
  }

  return { eligible: true };
}
