import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import {
  listStudents,
  getStudent,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
} from '../controllers/student.controller.js';

export const studentRouter = Router();

studentRouter.use(authenticate);

studentRouter.get('/', requireAdmin, listStudents);
studentRouter.get('/:id', requireAdmin, getStudent);
studentRouter.post('/', requireAdmin, createStudent);
studentRouter.post('/bulk', requireAdmin, bulkCreateStudents);
studentRouter.put('/:id', requireAdmin, updateStudent);
studentRouter.delete('/:id', requireAdmin, deleteStudent);
