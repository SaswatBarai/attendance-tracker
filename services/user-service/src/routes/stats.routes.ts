import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/role.middleware.js';
import { getStats } from '../controllers/stats.controller.js';

export const statsRouter = Router();

statsRouter.use(authenticate, requireSuperAdmin);
statsRouter.get('/', getStats);
