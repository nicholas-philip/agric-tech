import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  logActivity,
  getMyActivities,
  getActivitiesByFarm,
  getActivity,
  updateActivity,
  deleteActivity
} from '../controller/activityController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', authorize('farmer', 'agent'), logActivity);
router.get('/my', authorize('farmer'), getMyActivities);
router.get('/farm/:farmId', getActivitiesByFarm);
router.get('/:id', getActivity);
router.put('/:id', authorize('farmer', 'agent'), updateActivity);
router.delete('/:id', authorize('farmer', 'agent'), deleteActivity);

export default router;