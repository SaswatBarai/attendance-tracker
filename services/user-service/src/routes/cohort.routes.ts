import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireSuperAdmin, requireAdmin } from '../middleware/role.middleware.js';
import {
  listCohorts,
  getCohort,
  createCohort,
  updateCohort,
  deleteCohort,
  toggleCohortStatus,
} from '../controllers/cohort.controller.js';

export const cohortRouter = Router();

cohortRouter.use(authenticate);

cohortRouter.get('/', requireAdmin, listCohorts);
cohortRouter.get('/:id', requireAdmin, getCohort);
cohortRouter.post('/', requireSuperAdmin, createCohort);
cohortRouter.put('/:id', requireSuperAdmin, updateCohort);
cohortRouter.delete('/:id', requireSuperAdmin, deleteCohort);
cohortRouter.patch('/:id/toggle', requireSuperAdmin, toggleCohortStatus);
