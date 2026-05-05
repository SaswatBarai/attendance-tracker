import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validateAttendanceCode } from '../services/attendance-code.service.js';
import { AttendanceStatus, AttendanceMethod } from '@attendance-tracker/shared-types';

const markSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  scheduleId: z.string().uuid().optional(),
});

const overrideSchema = z.object({
  status: z.nativeEnum(AttendanceStatus),
  remarks: z.string().optional(),
});

function handleError(err: unknown, res: Response): void {
  const statusCode =
    typeof err === 'object' && err && 'statusCode' in err && typeof err.statusCode === 'number'
      ? err.statusCode
      : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';

  res.status(statusCode).json({ success: false, error: message });
}

export async function getMyAttendanceHistory(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;

  try {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Student profile not found' });
      return;
    }

    const records = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: {
        schedule: {
          include: {
            batch: { select: { id: true, name: true } },
            mentor: { select: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({
      success: true,
      data: { records, stats: { total, present, absent: total - present, percentage } },
    });
  } catch (err) {
    handleError(err, res);
  }
}

export async function markAttendance(req: Request, res: Response): Promise<void> {
  const parsed = markSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  try {
    const validCode = await validateAttendanceCode(parsed.data);

    // Prevent duplicates
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_scheduleId: {
          studentId: validCode.student.id,
          scheduleId: validCode.schedule.id,
        },
      },
    });

    if (existing) {
      res
        .status(409)
        .json({ success: false, error: 'Attendance already marked for this schedule' });
      return;
    }

    // Determine method from codeType
    const method =
      validCode.codeType === 'QR_CODE' ? AttendanceMethod.QR_SCAN : AttendanceMethod.MANUAL_CODE;

    // Use transaction to create attendance and mark code as used
    const [attendance] = await prisma.$transaction([
      prisma.attendance.create({
        data: {
          studentId: validCode.student.id,
          scheduleId: validCode.schedule.id,
          status: AttendanceStatus.PRESENT,
          markedBy: req.user!.sub,
          method,
          codeId: validCode.id,
        },
      }),
      prisma.attendanceCode.update({
        where: { id: validCode.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      }),
    ]);

    res.status(201).json({ success: true, data: attendance, student: validCode.student });
  } catch (err) {
    handleError(err, res);
  }
}

export async function getScheduleAttendance(req: Request, res: Response): Promise<void> {
  const scheduleId = req.params['scheduleId'] as string | undefined;

  if (!scheduleId) {
    res.status(400).json({ success: false, error: 'Schedule ID is required' });
    return;
  }

  try {
    const attendance = await prisma.attendance.findMany({
      where: { scheduleId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: attendance });
  } catch (err) {
    handleError(err, res);
  }
}

export async function updateAttendanceStatus(req: Request, res: Response): Promise<void> {
  const id = req.params['id'] as string | undefined;

  if (!id) {
    res.status(400).json({ success: false, error: 'Attendance ID is required' });
    return;
  }

  const parsed = overrideSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  try {
    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Attendance record not found' });
      return;
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        status: parsed.data.status,
        remarks: parsed.data.remarks,
        markedBy: req.user!.sub,
        method: AttendanceMethod.ADMIN_OVERRIDE,
      },
    });

    res.json({ success: true, data: attendance });
  } catch (err) {
    handleError(err, res);
  }
}
