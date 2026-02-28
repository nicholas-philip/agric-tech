import express from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import {
  createBatch,
  getBatch,
  getMyBatches,
  updateBatch,
  transferBatch,
  getBatchHistory
} from '../controller/batchController.js';

const router = express.Router();

router.post('/', protect, authorize('farmer'), createBatch);
router.post('/transfer', protect, transferBatch);
router.get('/my', protect, getMyBatches);
router.get('/:batchId', optionalAuth, getBatch);
router.get('/:batchId/history', optionalAuth, getBatchHistory);
router.put('/:batchId', protect, updateBatch);

export default router;