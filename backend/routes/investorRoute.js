import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getFarmers,
  getFarmer,
  getFarmerCredit,
  getFarmerClimate,
  getFarmerActivities
} from '../controller/investorController.js';

const router = express.Router();

router.get('/farmers', protect, authorize('investor'), getFarmers);
router.get('/farmers/:id', protect, authorize('investor'), getFarmer);
router.get('/farmers/:id/credit', protect, authorize('investor'), getFarmerCredit);
router.get('/farmers/:id/climate', protect, authorize('investor'), getFarmerClimate);
router.get('/farmers/:id/activities', protect, authorize('investor'), getFarmerActivities);

export default router;