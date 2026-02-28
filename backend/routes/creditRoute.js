import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getMyCreditPassport,
  refreshCreditScore
} from '../controller/creditController.js';

const router = express.Router();

router.get('/credit-passport', protect, authorize('farmer'), getMyCreditPassport);
router.post('/credit-passport/refresh', protect, authorize('farmer'), refreshCreditScore);

export default router;