import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireMentor, requireStudent } from '../middleware/role.middleware.js';
import {
  generateManualCode,
  generateQrCode,
  getMyStudentProfile,
  validateCode,
} from '../controllers/attendance-code.controller.js';

export const attendanceCodeRouter = Router();

attendanceCodeRouter.use(authenticate);

attendanceCodeRouter.get('/me', requireStudent, getMyStudentProfile);
attendanceCodeRouter.post('/qr', requireStudent, generateQrCode);
attendanceCodeRouter.post('/manual', requireStudent, generateManualCode);
attendanceCodeRouter.post('/validate', requireMentor, validateCode);
