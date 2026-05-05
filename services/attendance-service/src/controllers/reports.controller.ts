import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AttendanceStatus } from '@attendance-tracker/shared-types';

function handleError(err: unknown, res: Response): void {
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({ success: false, error: message });
}

// GET /api/reports/overview
export async function getOverview(_req: Request, res: Response): Promise<void> {
  try {
    const [total, present, absent] = await prisma.$transaction([
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: AttendanceStatus.PRESENT } }),
      prisma.attendance.count({ where: { status: AttendanceStatus.ABSENT } }),
    ]);

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    res.json({ success: true, data: { total, present, absent, rate } });
  } catch (err) {
    handleError(err, res);
  }
}

// GET /api/reports/by-batch?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getAttendanceByBatch(req: Request, res: Response): Promise<void> {
  const from = req.query['from'] as string | undefined;
  const to = req.query['to'] as string | undefined;

  try {
    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {};

    const records = await prisma.attendance.findMany({
      where: dateFilter,
      include: {
        schedule: {
          include: { batch: { select: { id: true, name: true } } },
        },
      },
    });

    // Group by batch
    const batchMap = new Map<
      string,
      { batchId: string; batchName: string; total: number; present: number }
    >();

    for (const r of records) {
      const key = r.schedule.batch.id;
      const existing = batchMap.get(key) ?? {
        batchId: key,
        batchName: r.schedule.batch.name,
        total: 0,
        present: 0,
      };
      existing.total += 1;
      if (r.status === AttendanceStatus.PRESENT) existing.present += 1;
      batchMap.set(key, existing);
    }

    const data = Array.from(batchMap.values()).map((b) => ({
      ...b,
      absent: b.total - b.present,
      rate: b.total > 0 ? Math.round((b.present / b.total) * 100) : 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    handleError(err, res);
  }
}

// GET /api/reports/by-student?batchId=...&from=...&to=...
export async function getAttendanceByStudent(req: Request, res: Response): Promise<void> {
  const batchId = req.query['batchId'] as string | undefined;
  const from = req.query['from'] as string | undefined;
  const to = req.query['to'] as string | undefined;

  try {
    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {};

    const scheduleFilter = batchId ? { schedule: { batch: { id: batchId } } } : {};

    const records = await prisma.attendance.findMany({
      where: { ...dateFilter, ...scheduleFilter },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        schedule: {
          include: { batch: { select: { name: true } } },
        },
      },
    });

    // Group by student
    const studentMap = new Map<
      string,
      {
        studentId: string;
        name: string;
        email: string;
        regno: string;
        batchName: string;
        total: number;
        present: number;
      }
    >();

    for (const r of records) {
      const key = r.studentId;
      const existing = studentMap.get(key) ?? {
        studentId: key,
        name: r.student.user.name,
        email: r.student.user.email,
        regno: r.student.regno,
        batchName: r.schedule.batch.name,
        total: 0,
        present: 0,
      };
      existing.total += 1;
      if (r.status === AttendanceStatus.PRESENT) existing.present += 1;
      studentMap.set(key, existing);
    }

    const data = Array.from(studentMap.values())
      .map((s) => ({
        ...s,
        absent: s.total - s.present,
        rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
      }))
      .sort((a, b) => a.rate - b.rate);

    res.json({ success: true, data });
  } catch (err) {
    handleError(err, res);
  }
}

// GET /api/reports/export/students?batchId=...&from=...&to=...  (CSV)
export async function exportStudentsCsv(req: Request, res: Response): Promise<void> {
  const batchId = req.query['batchId'] as string | undefined;
  const from = req.query['from'] as string | undefined;
  const to = req.query['to'] as string | undefined;

  try {
    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {};

    const scheduleFilter = batchId ? { schedule: { batch: { id: batchId } } } : {};

    const records = await prisma.attendance.findMany({
      where: { ...dateFilter, ...scheduleFilter },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        schedule: { include: { batch: { select: { name: true } } } },
      },
    });

    const studentMap = new Map<
      string,
      {
        name: string;
        email: string;
        regno: string;
        batchName: string;
        total: number;
        present: number;
      }
    >();

    for (const r of records) {
      const key = r.studentId;
      const existing = studentMap.get(key) ?? {
        name: r.student.user.name,
        email: r.student.user.email,
        regno: r.student.regno,
        batchName: r.schedule.batch.name,
        total: 0,
        present: 0,
      };
      existing.total += 1;
      if (r.status === AttendanceStatus.PRESENT) existing.present += 1;
      studentMap.set(key, existing);
    }

    const rows = Array.from(studentMap.values()).map((s) => ({
      ...s,
      absent: s.total - s.present,
      rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));

    const headers = [
      'Name',
      'Email',
      'Regno',
      'Batch',
      'Total Classes',
      'Present',
      'Absent',
      'Attendance %',
    ];
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        [r.name, r.email, r.regno, r.batchName, r.total, r.present, r.absent, r.rate].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="student-attendance.csv"');
    res.send(csv);
  } catch (err) {
    handleError(err, res);
  }
}
