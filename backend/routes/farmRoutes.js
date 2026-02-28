import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createFarm,
  getMyFarms,
  getFarm,
  updateFarm,
  deleteFarm,
  getNearbyFarms
} from '../controller/farmController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', authorize('farmer'), createFarm);
router.get('/my', authorize('farmer'), getMyFarms);
router.get('/nearby', authorize('agronomist', 'agent'), getNearbyFarms);
router.get('/:id', getFarm);
router.put('/:id', authorize('farmer'), updateFarm);
router.delete('/:id', authorize('farmer'), deleteFarm);

export default router;
