import { prisma } from '../lib/prisma.js';

/**
 * Automatically allocates a student to the least-populated batch in a cohort
 * for the given shift. Throws if no batches exist for the cohort — the caller
 * should validate batch existence before calling this.
 */
export async function autoAllocateBatch(
  cohortId: string,
  shift: 'MORNING' | 'AFTERNOON'
): Promise<string> {
  const batches = await prisma.batch.findMany({
    where: { cohortId },
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (batches.length === 0) {
    throw new Error(
      'No batches found for this cohort. Please create at least one batch before uploading students.'
    );
  }

  // Prefer batches that already have students of the same shift, then balance by count
  const batchesWithShiftCount = await Promise.all(
    batches.map(async (batch) => {
      const shiftCount = await prisma.student.count({
        where: { batchId: batch.id, shift: shift as 'MORNING' | 'AFTERNOON' },
      });
      return { id: batch.id, total: batch._count.students, shiftCount };
    })
  );

  // Assign to the batch with fewest students of this shift
  const sorted = [...batchesWithShiftCount].sort(
    (a, b) => a.shiftCount - b.shiftCount || a.total - b.total
  );
  return sorted[0]!.id;
}
