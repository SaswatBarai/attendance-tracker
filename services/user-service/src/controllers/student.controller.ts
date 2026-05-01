import type { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { Role } from '@attendance-tracker/shared-types';
import { autoAllocateBatch } from '../utils/batch-allocator.util.js';

const shiftEnum = z.enum(['MORNING', 'AFTERNOON']);

const createStudentSchema = z.object({
  email: z.email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  regno: z.string().min(1, 'Registration number is required'),
  shift: shiftEnum,
  cohortId: z.string().uuid('Invalid cohort ID'),
  batchId: z.string().uuid('Invalid batch ID').optional(),
});

const bulkStudentSchema = z.object({
  cohortId: z.string().uuid('Invalid cohort ID'),
  students: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.email(),
        regno: z.string().min(1),
        shift: shiftEnum,
      })
    )
    .min(1, 'At least one student is required'),
});

const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  shift: shiftEnum.optional(),
  batchId: z.string().uuid().nullable().optional(),
});

function param(req: Request, key: string): string {
  return req.params[key] as string;
}

export async function listStudents(req: Request, res: Response): Promise<void> {
  const cohortId = req.query['cohortId'] as string | undefined;
  const batchId = req.query['batchId'] as string | undefined;
  const shift = req.query['shift'] as string | undefined;
  const search = (req.query['search'] as string | undefined)?.trim();

  const students = await prisma.student.findMany({
    where: {
      ...(cohortId ? { cohortId } : {}),
      ...(batchId ? { batchId } : {}),
      ...(shift ? { shift: shift as 'MORNING' | 'AFTERNOON' } : {}),
      ...(search
        ? {
            OR: [
              { regno: { contains: search, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
      cohort: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: students });
}

export async function getStudent(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true, createdAt: true } },
      cohort: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
  });

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found' });
    return;
  }

  res.json({ success: true, data: student });
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const parsed = createStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const { email, name, regno, shift, cohortId, batchId } = parsed.data;

  const [existingEmail, existingRegno, cohort] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.student.findUnique({ where: { regno } }),
    prisma.cohort.findUnique({ where: { id: cohortId } }),
  ]);

  if (existingEmail) {
    res.status(409).json({ success: false, error: 'Email already in use' });
    return;
  }
  if (existingRegno) {
    res.status(409).json({ success: false, error: 'Registration number already exists' });
    return;
  }
  if (!cohort) {
    res.status(404).json({ success: false, error: 'Cohort not found' });
    return;
  }

  const hashedPassword = await bcrypt.hash(`Welcome@${regno}`, 12);
  const finalBatchId =
    batchId ?? (await autoAllocateBatch(cohortId, shift as 'MORNING' | 'AFTERNOON'));

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: Role.STUDENT as unknown as 'STUDENT',
      studentProfile: {
        create: {
          regno,
          shift: shift as 'MORNING' | 'AFTERNOON',
          cohortId,
          ...(finalBatchId ? { batchId: finalBatchId } : {}),
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      studentProfile: {
        include: {
          cohort: { select: { id: true, name: true } },
          batch: { select: { id: true, name: true } },
        },
      },
    },
  });

  res.status(201).json({ success: true, data: user });
}

export async function bulkCreateStudents(req: Request, res: Response): Promise<void> {
  const parsed = bulkStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const { cohortId, students } = parsed.data;

  const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
  if (!cohort) {
    res.status(404).json({ success: false, error: 'Cohort not found' });
    return;
  }

  const regnos = students.map((s) => s.regno);
  const emails = students.map((s) => s.email);

  if (new Set(regnos).size !== regnos.length) {
    res.status(400).json({ success: false, error: 'Duplicate registration numbers in upload' });
    return;
  }

  const [existingUsers, existingStudents] = await Promise.all([
    prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true } }),
    prisma.student.findMany({ where: { regno: { in: regnos } }, select: { regno: true } }),
  ]);

  const errors: string[] = [];
  if (existingUsers.length > 0) {
    errors.push(`Emails already in use: ${existingUsers.map((u) => u.email).join(', ')}`);
  }
  if (existingStudents.length > 0) {
    errors.push(`Regnos already exist: ${existingStudents.map((s) => s.regno).join(', ')}`);
  }
  if (errors.length > 0) {
    res.status(409).json({ success: false, error: errors.join('; ') });
    return;
  }

  const created: unknown[] = [];
  for (const s of students) {
    const hashedPassword = await bcrypt.hash(`Welcome@${s.regno}`, 12);
    const batchId = await autoAllocateBatch(cohortId, s.shift as 'MORNING' | 'AFTERNOON');

    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: hashedPassword,
        name: s.name,
        role: Role.STUDENT as unknown as 'STUDENT',
        studentProfile: {
          create: {
            regno: s.regno,
            shift: s.shift as 'MORNING' | 'AFTERNOON',
            cohortId,
            ...(batchId ? { batchId } : {}),
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentProfile: {
          select: {
            id: true,
            regno: true,
            shift: true,
            batch: { select: { id: true, name: true } },
          },
        },
      },
    });
    created.push(user);
  }

  res.status(201).json({ success: true, data: { created: created.length, students: created } });
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');

  const parsed = updateStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found' });
    return;
  }

  const { name, shift, batchId } = parsed.data;

  if (name) {
    await prisma.user.update({ where: { id: student.userId }, data: { name } });
  }

  const updated = await prisma.student.update({
    where: { id },
    data: {
      ...(shift ? { shift: shift as 'MORNING' | 'AFTERNOON' } : {}),
      ...(batchId !== undefined ? { batchId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
      cohort: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
  });

  res.json({ success: true, data: updated });
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found' });
    return;
  }

  // Deleting the user cascades to the student profile
  await prisma.user.delete({ where: { id: student.userId } });

  res.json({ success: true, data: { id } });
}
