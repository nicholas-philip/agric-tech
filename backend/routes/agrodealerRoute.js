import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createProfile,
  getAgrodealers,
  getAgrodealer,
  recordTransaction,
  getMyTransactions,
  rateAgrodealer
} from '../controller/agrodealerController.js';

const router = express.Router();

router.post('/', protect, authorize('agrodealer'), createProfile);
router.get('/', getAgrodealers);
router.get('/:id', getAgrodealer);
router.post('/transactions', protect, authorize('farmer', 'agrodealer'), recordTransaction);
router.get('/transactions/my', protect, authorize('farmer', 'agrodealer'), getMyTransactions);
router.post('/:id/rate', protect, authorize('farmer'), rateAgrodealer);

export default router;