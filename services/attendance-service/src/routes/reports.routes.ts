import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import {
  getOverview,
  getAttendanceByBatch,
  getAttendanceByStudent,
  exportStudentsCsv,
} from '../controllers/reports.controller.js';

export const reportsRouter = Router();

reportsRouter.use(authenticate, requireAdmin);

reportsRouter.get('/overview', getOverview);
reportsRouter.get('/by-batch', getAttendanceByBatch);
reportsRouter.get('/by-student', getAttendanceByStudent);
reportsRouter.get('/export/students', exportStudentsCsv);
