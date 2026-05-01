import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin, requireMentor } from '../middleware/role.middleware.js';
import {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getStudentSchedule,
  getMentorSchedule,
  checkEligibility,
} from '../controllers/schedule.controller.js';

export const scheduleRouter = Router();

scheduleRouter.use(authenticate);

scheduleRouter.get('/', requireMentor, listSchedules);
scheduleRouter.get('/student/:studentId', requireMentor, getStudentSchedule);
scheduleRouter.get('/mentor/:mentorId', requireMentor, getMentorSchedule);
scheduleRouter.post('/eligibility', requireMentor, checkEligibility);
scheduleRouter.get('/:id', requireMentor, getSchedule);
scheduleRouter.post('/', requireAdmin, createSchedule);
scheduleRouter.put('/:id', requireAdmin, updateSchedule);
scheduleRouter.delete('/:id', requireAdmin, deleteSchedule);
