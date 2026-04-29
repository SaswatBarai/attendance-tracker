import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/role.middleware.js';
import {
  listAdmins,
  listAssignableUsers,
  createAdmin,
  assignAdmin,
  removeAdmin,
} from '../controllers/admin.controller.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireSuperAdmin);

adminRouter.get('/', listAdmins);
adminRouter.get('/assignable-users', listAssignableUsers);
adminRouter.post('/', createAdmin);
adminRouter.post('/assign', assignAdmin);
adminRouter.delete('/:userId', removeAdmin);
