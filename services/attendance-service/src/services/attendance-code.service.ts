import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { generateManualCode } from '../utils/code-generator.util.js';
import { buildQrDataUrl } from '../utils/qr-generator.util.js';
import { signAttendancePayload } from '../utils/jwt.util.js';
import {
  expiresAtForScheduleEnd,
  isScheduleCurrent,
  todayName,
} from '../utils/time-validator.util.js';
import { validateStudentForSchedule } from '../utils/eligibility-validator.util.js';

const ACCESS_SECRET = process.env['JWT_SECRET']!;

interface CodeResponse {
  id: string;
  studentId: string;
  scheduleId: string;
  code: string;
  qrData: string;
  qrImageDataUrl?: string;
  codeType: 'QR_CODE' | 'MANUAL_CODE';
  expiresAt: Date;
  schedule: {
    id: string;
    dayOfWeek: string;
    period: number;
    shift: string;
    startTime: string;
    endTime: string;
    batch: { id: string; name: string };
    mentor: { id: string; user: { name: string } } | null;
  };
}

export async function getStudentForUser(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      batch: { select: { id: true, name: true } },
    },
  });
}

async function resolveSchedule(studentId: string, scheduleId?: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student?.batchId) return null;

  if (scheduleId) {
    return prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        batch: { select: { id: true, name: true } },
        mentor: { select: { id: true, user: { select: { name: true } } } },
      },
    });
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      batchId: student.batchId,
      dayOfWeek: todayName() as 'MONDAY',
      OR: [
        { shift: student.shift },
        ...(student.shift === 'MORNING' ? [{ shift: 'AFTERNOON' as const }] : []),
      ],
    },
    orderBy: { period: 'asc' },
    include: {
      batch: { select: { id: true, name: true } },
      mentor: { select: { id: true, user: { select: { name: true } } } },
    },
  });

  return schedules.find((schedule) => isScheduleCurrent(schedule)) ?? null;
}

export async function generateAttendanceCode(opts: {
  userId: string;
  scheduleId?: string;
  codeType: 'QR_CODE' | 'MANUAL_CODE';
}): Promise<CodeResponse> {
  const student = await getStudentForUser(opts.userId);
  if (!student) {
    throw Object.assign(new Error('Student profile not found'), { statusCode: 404 });
  }

  const schedule = await resolveSchedule(student.id, opts.scheduleId);
  if (!schedule) {
    throw Object.assign(new Error('No active schedule found for this student'), { statusCode: 404 });
  }

  const eligibility = await validateStudentForSchedule(student.id, schedule.id);
  if (!eligibility.eligible) {
    throw Object.assign(new Error(eligibility.reason ?? 'Student is not eligible for this schedule'), {
      statusCode: 403,
    });
  }

  const expiresAt =
    opts.codeType === 'QR_CODE'
      ? new Date(Date.now() + 30 * 1000)
      : expiresAtForScheduleEnd(schedule);

  const seedCode =
    opts.codeType === 'QR_CODE'
      ? `QR-${cryptoRandomId()}`
      : await generateUniqueManualCode(schedule.id);

  const code = await prisma.attendanceCode.create({
    data: {
      studentId: student.id,
      scheduleId: schedule.id,
      code: seedCode,
      qrData: seedCode,
      codeType: opts.codeType,
      expiresAt,
    },
  });

  if (opts.codeType === 'QR_CODE') {
    const qrData = signAttendancePayload({
      studentId: student.id,
      scheduleId: schedule.id,
      codeId: code.id,
    });
    const qrImageDataUrl = await buildQrDataUrl(qrData);
    const updated = await prisma.attendanceCode.update({
      where: { id: code.id },
      data: { qrData, code: code.id },
    });

    return {
      ...updated,
      codeType: updated.codeType as 'QR_CODE',
      qrImageDataUrl,
      schedule,
    };
  }

  return {
    ...code,
    codeType: code.codeType as 'MANUAL_CODE',
    schedule,
  };
}

export async function validateAttendanceCode(input: { code: string; scheduleId?: string }) {
  const trimmedCode = input.code.trim();
  let attendanceCode = null;

  if (trimmedCode.split('.').length === 3) {
    try {
      const payload = jwt.verify(trimmedCode, ACCESS_SECRET) as {
        codeId?: string;
        studentId?: string;
        scheduleId?: string;
      };
      if (payload.codeId) {
        attendanceCode = await prisma.attendanceCode.findUnique({
          where: { id: payload.codeId },
          include: validationInclude,
        });
      }
    } catch {
      throw Object.assign(new Error('QR code is invalid or expired'), { statusCode: 400 });
    }
  } else {
    attendanceCode = await prisma.attendanceCode.findUnique({
      where: { code: trimmedCode.toUpperCase() },
      include: validationInclude,
    });
  }

  if (!attendanceCode) {
    throw Object.assign(new Error('Attendance code not found'), { statusCode: 404 });
  }

  if (input.scheduleId && attendanceCode.scheduleId !== input.scheduleId) {
    throw Object.assign(new Error('Code does not belong to this schedule'), { statusCode: 400 });
  }

  if (attendanceCode.isUsed) {
    throw Object.assign(new Error('Attendance code has already been used'), { statusCode: 409 });
  }

  if (attendanceCode.expiresAt < new Date()) {
    throw Object.assign(new Error('Attendance code has expired'), { statusCode: 400 });
  }

  if (!isScheduleCurrent(attendanceCode.schedule)) {
    throw Object.assign(new Error('Code is not valid for the current period'), { statusCode: 400 });
  }

  const eligibility = await validateStudentForSchedule(
    attendanceCode.studentId,
    attendanceCode.scheduleId
  );
  if (!eligibility.eligible) {
    throw Object.assign(new Error(eligibility.reason ?? 'Student is not eligible'), {
      statusCode: 403,
    });
  }

  return {
    id: attendanceCode.id,
    student: attendanceCode.student,
    schedule: attendanceCode.schedule,
    codeType: attendanceCode.codeType,
    expiresAt: attendanceCode.expiresAt,
    valid: true,
  };
}

const validationInclude = {
  student: {
    include: {
      user: { select: { id: true, name: true, email: true } },
      batch: { select: { id: true, name: true } },
    },
  },
  schedule: {
    include: {
      batch: { select: { id: true, name: true } },
      mentor: { select: { id: true, user: { select: { name: true } } } },
    },
  },
} as const;

function cryptoRandomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function generateUniqueManualCode(scheduleId: string): Promise<string> {
  for (let attempts = 0; attempts < 8; attempts += 1) {
    const code = generateManualCode();
    const existing = await prisma.attendanceCode.findUnique({ where: { code } });
    if (!existing) return code;
  }

  return `${generateManualCode(4)}${scheduleId.slice(0, 2).toUpperCase()}`;
}
