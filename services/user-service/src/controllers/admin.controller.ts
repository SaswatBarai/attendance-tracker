import type { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { Role } from '@attendance-tracker/shared-types';

const createAdminSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cohortId: z.string().uuid('Invalid cohort ID'),
});

const assignAdminSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  cohortId: z.string().uuid('Invalid cohort ID'),
});

export async function listAssignableUsers(req: Request, res: Response): Promise<void> {
  const search = String(req.query['search'] ?? '').trim();

  const users = await prisma.user.findMany({
    where: {
      role: { not: Role.SUPER_ADMIN as unknown as 'SUPER_ADMIN' },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      adminProfile: {
        select: {
          cohort: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json({ success: true, data: users });
}

export async function listAdmins(_req: Request, res: Response): Promise<void> {
  const admins = await prisma.admin.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true, createdAt: true } },
      cohort: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: admins });
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const { email, password, name, cohortId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ success: false, error: 'Email already in use' });
    return;
  }

  const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
  if (!cohort) {
    res.status(404).json({ success: false, error: 'Cohort not found' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: Role.ADMIN as unknown as 'ADMIN',
      adminProfile: { create: { cohortId } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      adminProfile: { include: { cohort: { select: { id: true, name: true } } } },
    },
  });

  res.status(201).json({ success: true, data: user });
}

export async function assignAdmin(req: Request, res: Response): Promise<void> {
  const parsed = assignAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const { userId, cohortId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
  if (!cohort) {
    res.status(404).json({ success: false, error: 'Cohort not found' });
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { userId } });
  if (existing) {
    const updated = await prisma.admin.update({
      where: { userId },
      data: { cohortId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        cohort: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: updated });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: Role.ADMIN as unknown as 'ADMIN' },
  });

  const admin = await prisma.admin.create({
    data: { userId, cohortId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      cohort: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ success: true, data: admin });
}

export async function removeAdmin(req: Request, res: Response): Promise<void> {
  const userId = req.params['userId'] as string;
  const admin = await prisma.admin.findUnique({ where: { userId } });
  if (!admin) {
    res.status(404).json({ success: false, error: 'Admin not found' });
    return;
  }

  await prisma.$transaction([
    prisma.admin.delete({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { role: Role.STUDENT as unknown as 'STUDENT' },
    }),
  ]);

  res.json({ success: true, data: { userId } });
}
