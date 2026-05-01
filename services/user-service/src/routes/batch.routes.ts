import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import {
  listBatches,
  getBatch,
  createBatch,
  updateBatch,
  deleteBatch,
} from '../controllers/batch.controller.js';

export const batchRouter = Router();

batchRouter.use(authenticate);

batchRouter.get('/', requireAdmin, listBatches);
batchRouter.get('/:id', requireAdmin, getBatch);
batchRouter.post('/', requireAdmin, createBatch);
batchRouter.put('/:id', requireAdmin, updateBatch);
batchRouter.delete('/:id', requireAdmin, deleteBatch);
