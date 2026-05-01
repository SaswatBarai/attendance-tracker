import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { checkScheduleConflicts } from '../utils/schedule-validator.util.js';
import { checkStudentEligibility } from '../utils/eligibility-checker.util.js';

const DAY_VALUES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;
const SHIFT_VALUES = ['MORNING', 'AFTERNOON'] as const;

const scheduleSchema = z.object({
  batchId: z.string().uuid('Invalid batch ID'),
  dayOfWeek: z.enum(DAY_VALUES),
  period: z.number().int().min(1).max(8),
  shift: z.enum(SHIFT_VALUES),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM'),
  mentorId: z.string().uuid('Invalid mentor ID').nullable().optional(),
});

const scheduleInclude = {
  batch: { select: { id: true, name: true, cohort: { select: { id: true, name: true } } } },
  mentor: { select: { id: true, user: { select: { id: true, name: true, email: true } } } },
} as const;

function param(req: Request, key: string): string {
  return req.params[key] as string;
}

export async function listSchedules(req: Request, res: Response): Promise<void> {
  const batchId = req.query['batchId'] as string | undefined;
  const dayOfWeek = req.query['dayOfWeek'] as string | undefined;
  const mentorId = req.query['mentorId'] as string | undefined;
  const cohortId = req.query['cohortId'] as string | undefined;

  const schedules = await prisma.schedule.findMany({
    where: {
      ...(batchId ? { batchId } : {}),
      ...(dayOfWeek ? { dayOfWeek: dayOfWeek as 'MONDAY' } : {}),
      ...(mentorId ? { mentorId } : {}),
      ...(cohortId ? { batch: { cohortId } } : {}),
    },
    orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    include: scheduleInclude,
  });

  res.json({ success: true, data: schedules });
}

export async function getSchedule(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: scheduleInclude,
  });

  if (!schedule) {
    res.status(404).json({ success: false, error: 'Schedule not found' });
    return;
  }

  res.json({ success: true, data: schedule });
}

export async function createSchedule(req: Request, res: Response): Promise<void> {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const { batchId, dayOfWeek, period, shift, startTime, endTime, mentorId } = parsed.data;

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) {
    res.status(404).json({ success: false, error: 'Batch not found' });
    return;
  }

  if (mentorId) {
    const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
    if (!mentor) {
      res.status(404).json({ success: false, error: 'Mentor not found' });
      return;
    }
  }

  const conflict = await checkScheduleConflicts({ batchId, dayOfWeek, period, mentorId });
  if (conflict.hasConflict) {
    res.status(409).json({ success: false, error: conflict.reason });
    return;
  }

  const schedule = await prisma.schedule.create({
    data: {
      batchId,
      dayOfWeek: dayOfWeek as 'MONDAY',
      period,
      shift: shift as 'MORNING',
      startTime,
      endTime,
      ...(mentorId ? { mentorId } : {}),
    },
    include: scheduleInclude,
  });

  res.status(201).json({ success: true, data: schedule });
}

export async function updateSchedule(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');
  const parsed = scheduleSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  const existing = await prisma.schedule.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Schedule not found' });
    return;
  }

  const { dayOfWeek, period, mentorId } = parsed.data;

  const conflict = await checkScheduleConflicts({
    batchId: parsed.data.batchId ?? existing.batchId,
    dayOfWeek: dayOfWeek ?? existing.dayOfWeek,
    period: period ?? existing.period,
    mentorId: mentorId !== undefined ? mentorId : existing.mentorId,
    excludeId: id,
  });
  if (conflict.hasConflict) {
    res.status(409).json({ success: false, error: conflict.reason });
    return;
  }

  const schedule = await prisma.schedule.update({
    where: { id },
    data: {
      ...(parsed.data.batchId ? { batchId: parsed.data.batchId } : {}),
      ...(dayOfWeek ? { dayOfWeek: dayOfWeek as 'MONDAY' } : {}),
      ...(period !== undefined ? { period } : {}),
      ...(parsed.data.shift ? { shift: parsed.data.shift as 'MORNING' } : {}),
      ...(parsed.data.startTime ? { startTime: parsed.data.startTime } : {}),
      ...(parsed.data.endTime ? { endTime: parsed.data.endTime } : {}),
      ...(mentorId !== undefined ? { mentorId } : {}),
    },
    include: scheduleInclude,
  });

  res.json({ success: true, data: schedule });
}

export async function deleteSchedule(req: Request, res: Response): Promise<void> {
  const id = param(req, 'id');

  const existing = await prisma.schedule.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Schedule not found' });
    return;
  }

  await prisma.schedule.delete({ where: { id } });
  res.json({ success: true, data: { id } });
}

export async function getStudentSchedule(req: Request, res: Response): Promise<void> {
  const studentId = param(req, 'studentId');
  const dayOfWeek = req.query['dayOfWeek'] as string | undefined;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found' });
    return;
  }

  if (!student.batchId) {
    res.json({ success: true, data: [] });
    return;
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      batchId: student.batchId,
      ...(dayOfWeek ? { dayOfWeek: dayOfWeek as 'MONDAY' } : {}),
      // Eligibility filter
      OR: [
        { shift: student.shift as 'MORNING' },
        ...(student.shift === 'MORNING' ? [{ shift: 'AFTERNOON' as const }] : []),
      ],
    },
    orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    include: scheduleInclude,
  });

  res.json({ success: true, data: schedules });
}

export async function getMentorSchedule(req: Request, res: Response): Promise<void> {
  const mentorId = param(req, 'mentorId');
  const dayOfWeek = req.query['dayOfWeek'] as string | undefined;

  const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentor) {
    res.status(404).json({ success: false, error: 'Mentor not found' });
    return;
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      mentorId,
      ...(dayOfWeek ? { dayOfWeek: dayOfWeek as 'MONDAY' } : {}),
    },
    orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
    include: scheduleInclude,
  });

  res.json({ success: true, data: schedules });
}

export async function checkEligibility(req: Request, res: Response): Promise<void> {
  const { studentId, scheduleId } = req.body as { studentId?: string; scheduleId?: string };
  if (!studentId || !scheduleId) {
    res.status(400).json({ success: false, error: 'studentId and scheduleId are required' });
    return;
  }

  const result = await checkStudentEligibility(studentId, scheduleId);
  res.json({ success: true, data: result });
}
