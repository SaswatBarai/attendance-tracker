import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getStats(_req: Request, res: Response): Promise<void> {
  const [
    totalUsers,
    totalCohorts,
    totalAdmins,
    totalMentors,
    totalStudents,
    activeCohorts,
    totalBatches,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.cohort.count(),
    prisma.admin.count(),
    prisma.mentor.count(),
    prisma.student.count(),
    prisma.cohort.count({ where: { isActive: true } }),
    prisma.batch.count(),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalCohorts,
      activeCohorts,
      totalAdmins,
      totalMentors,
      totalStudents,
      totalBatches,
    },
  });
}
