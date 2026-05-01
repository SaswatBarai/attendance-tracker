import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import {
  listMentors,
  getMentor,
  createMentor,
  removeMentor,
} from '../controllers/mentor.controller.js';

export const mentorRouter = Router();

mentorRouter.use(authenticate);

mentorRouter.get('/', requireAdmin, listMentors);
mentorRouter.get('/:id', requireAdmin, getMentor);
mentorRouter.post('/', requireAdmin, createMentor);
mentorRouter.delete('/:id', requireAdmin, removeMentor);
