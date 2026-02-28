import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createClimateProfile,
  getMyClimateProfiles,
  getClimateProfile,
  updateClimateProfile,
  deleteClimateProfile
} from '../controller/climateController.js';

const router = express.Router();

router.post('/', protect, authorize('farmer'), createClimateProfile);
router.get('/my', protect, authorize('farmer'), getMyClimateProfiles);
router.get('/:id', protect, getClimateProfile);
router.put('/:id', protect, authorize('farmer'), updateClimateProfile);
router.delete('/:id', protect, authorize('farmer'), deleteClimateProfile);

export default router;