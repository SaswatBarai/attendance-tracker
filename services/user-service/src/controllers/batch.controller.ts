import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const batchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  cohortId: z.string().uuid('Invalid cohort ID'),
});

function param(req: Request, key: string): string {
  return req.params[key] as string;
}

export async function listBatches(req: Request, res: Response): Promise<void> {
  const cohortId = req.query['cohortId'] as string | undefined;

  const batches = await prisma.batch.findMany({
    where: cohortId ? { cohortId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      cohort: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });

  res.json({ success: true, data: batches });
}

export async function getBatch(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      cohort: { select: { id: true, name: true } },
      students: {
        include: {
          user: { select: { id: true, name: true, email: true, isActive: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { students: true } },
    },
  });

  if (!batch) {
    res.status(404).json({ success: false, error: 'Batch not found' });
    return;
  }

  res.json({ success: true, data: batch });
}

export async function createBatch(req: Request, res: Response): Promise<void> {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const { name, cohortId } = parsed.data;

  const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
  if (!cohort) {
    res.status(404).json({ success: false, error: 'Cohort not found' });
    return;
  }

  const batch = await prisma.batch.create({
    data: { name, cohortId },
    include: {
      cohort: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });

  res.status(201).json({ success: true, data: batch });
}

export async function updateBatch(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');
  const parsed = batchSchema.pick({ name: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const existing = await prisma.batch.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Batch not found' });
    return;
  }

  const batch = await prisma.batch.update({
    where: { id },
    data: parsed.data,
    include: {
      cohort: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });

  res.json({ success: true, data: batch });
}

export async function deleteBatch(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');

  const existing = await prisma.batch.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Batch not found' });
    return;
  }

  // Unassign students before deleting
  await prisma.student.updateMany({ where: { batchId: id }, data: { batchId: null } });
  await prisma.batch.delete({ where: { id } });

  res.json({ success: true, data: { id } });
}
