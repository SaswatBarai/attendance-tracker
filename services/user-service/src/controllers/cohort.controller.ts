import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const cohortSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

function param(req: Request, key: string): string {
  return req.params[key] as string;
}

export async function listCohorts(_req: Request, res: Response): Promise<void> {
  const cohorts = await prisma.cohort.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { admins: true, students: true, mentors: true, batches: true } },
    },
  });
  res.json({ success: true, data: cohorts });
}

export async function getCohort(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');
  const cohort = await prisma.cohort.findUnique({
    where: { id },
    include: {
      admins: { include: { user: { select: { id: true, name: true, email: true } } } },
      batches: true,
      _count: { select: { students: true, mentors: true } },
    },
  });

  if (!cohort) {
    res.status(404).json({ success: false, error: 'Cohort not found' });
    return;
  }

  res.json({ success: true, data: cohort });
}

export async function createCohort(req: Request, res: Response): Promise<void> {
  const parsed = cohortSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const cohort = await prisma.cohort.create({
    data: { ...parsed.data, createdBy: req.user!.sub },
  });

  res.status(201).json({ success: true, data: cohort });
}

export async function updateCohort(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');
  const parsed = cohortSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const cohort = await prisma.cohort.findUnique({ where: { id } });
  if (!cohort) {
    res.status(404).json({ success: false, error: 'Cohort not found' });
    return;
  }

  const updated = await prisma.cohort.update({ where: { id }, data: parsed.data });
  res.json({ success: true, data: updated });
}

export async function deleteCohort(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');
  const cohort = await prisma.cohort.findUnique({ where: { id } });
  if (!cohort) {
    res.status(404).json({ success: false, error: 'Cohort not found' });
    return;
  }

  await prisma.cohort.delete({ where: { id } });
  res.json({ success: true, data: { id } });
}

export async function toggleCohortStatus(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');
  const cohort = await prisma.cohort.findUnique({ where: { id } });
  if (!cohort) {
    res.status(404).json({ success: false, error: 'Cohort not found' });
    return;
  }

  const updated = await prisma.cohort.update({
    where: { id },
    data: { isActive: !cohort.isActive },
  });

  res.json({ success: true, data: updated });
}
