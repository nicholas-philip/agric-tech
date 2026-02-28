import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createRecommendation,
  getMyRecommendations,
  getFarmerRecommendations,
  updateRecommendation,
  updateFarmerFeedback,
  getFarmerFarms,
  getFarmActivities
} from '../controller/agronomistController.js';

const router = express.Router();

router.post('/recommendations', protect, authorize('agronomist'), createRecommendation);
router.get('/recommendations/my', protect, authorize('agronomist'), getMyRecommendations);
router.get('/recommendations/farmer/:farmerId', protect, authorize('agronomist', 'farmer'), getFarmerRecommendations);
router.put('/recommendations/:id', protect, authorize('agronomist'), updateRecommendation);
router.put('/recommendations/:id/feedback', protect, authorize('farmer'), updateFarmerFeedback);
router.get('/farmers/:farmerId/farms', protect, authorize('agronomist'), getFarmerFarms);
router.get('/farms/:farmId/activities', protect, authorize('agronomist'), getFarmActivities);

export default router;