import type { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { Role } from '@attendance-tracker/shared-types';

const createMentorSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cohortId: z.string().uuid('Invalid cohort ID'),
});

function param(req: Request, key: string): string {
  return req.params[key] as string;
}

export async function listMentors(_req: Request, res: Response): Promise<void> {
  const mentors = await prisma.mentor.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true, createdAt: true } },
      cohort: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: mentors });
}

export async function getMentor(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');

  const mentor = await prisma.mentor.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true, createdAt: true } },
      cohort: { select: { id: true, name: true } },
    },
  });

  if (!mentor) {
    res.status(404).json({ success: false, error: 'Mentor not found' });
    return;
  }

  res.json({ success: true, data: mentor });
}

export async function createMentor(req: Request, res: Response): Promise<void> {
  const parsed = createMentorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const { email, password, name, cohortId } = parsed.data;

  const [existingUser, cohort] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.cohort.findUnique({ where: { id: cohortId } }),
  ]);

  if (existingUser) {
    res.status(409).json({ success: false, error: 'Email already in use' });
    return;
  }
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
      role: Role.MENTOR as unknown as 'MENTOR',
      mentorProfile: { create: { cohortId } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      mentorProfile: {
        include: { cohort: { select: { id: true, name: true } } },
      },
    },
  });

  res.status(201).json({ success: true, data: user });
}

export async function removeMentor(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');

  const mentor = await prisma.mentor.findUnique({ where: { id } });
  if (!mentor) {
    res.status(404).json({ success: false, error: 'Mentor not found' });
    return;
  }

  await prisma.$transaction([
    prisma.mentor.delete({ where: { id } }),
    prisma.user.update({
      where: { id: mentor.userId },
      data: { role: Role.STUDENT as unknown as 'STUDENT' },
    }),
  ]);

  res.json({ success: true, data: { id } });
}
