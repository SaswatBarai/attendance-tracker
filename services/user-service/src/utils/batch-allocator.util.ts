import { prisma } from '../lib/prisma.js';

export async function autoAllocateBatch(
  cohortId: string,
  shift: 'MORNING' | 'AFTERNOON'
): Promise<string | null> {
  const batches = await prisma.batch.findMany({
    where: { cohortId },
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (batches.length === 0) return null;

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
