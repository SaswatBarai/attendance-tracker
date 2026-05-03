import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  generateAttendanceCode,
  getStudentForUser,
  validateAttendanceCode,
} from '../services/attendance-code.service.js';

const generateSchema = z.object({
  scheduleId: z.string().uuid().optional(),
});

const validateSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  scheduleId: z.string().uuid().optional(),
});

function handleError(err: unknown, res: Response): void {
  const statusCode =
    typeof err === 'object' && err && 'statusCode' in err && typeof err.statusCode === 'number'
      ? err.statusCode
      : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';

  res.status(statusCode).json({ success: false, error: message });
}

export async function getMyStudentProfile(req: Request, res: Response): Promise<void> {
  try {
    const student = await getStudentForUser(req.user!.sub);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student profile not found' });
      return;
    }

    res.json({ success: true, data: student });
  } catch (err) {
    handleError(err, res);
  }
}

export async function generateQrCode(req: Request, res: Response): Promise<void> {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  try {
    const code = await generateAttendanceCode({
      userId: req.user!.sub,
      scheduleId: parsed.data.scheduleId,
      codeType: 'QR_CODE',
    });
    res.status(201).json({ success: true, data: code });
  } catch (err) {
    handleError(err, res);
  }
}

export async function generateManualCode(req: Request, res: Response): Promise<void> {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  try {
    const code = await generateAttendanceCode({
      userId: req.user!.sub,
      scheduleId: parsed.data.scheduleId,
      codeType: 'MANUAL_CODE',
    });
    res.status(201).json({ success: true, data: code });
  } catch (err) {
    handleError(err, res);
  }
}

export async function validateCode(req: Request, res: Response): Promise<void> {
  const parsed = validateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    return;
  }

  try {
    const result = await validateAttendanceCode(parsed.data);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(err, res);
  }
}
