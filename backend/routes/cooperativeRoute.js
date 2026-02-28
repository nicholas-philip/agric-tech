import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createCooperative,
  getCooperatives,
  getCooperative,
  addMember,
  removeMember,
  updateCooperative,
  getMyCooperatives
} from '../controller/cooperativeController.js';

const router = express.Router();

router.post('/', protect, authorize('farmer'), createCooperative);
router.get('/', getCooperatives);
router.get('/my', protect, authorize('farmer'), getMyCooperatives);
router.get('/:id', getCooperative);
router.post('/:id/members', protect, authorize('farmer'), addMember);
router.delete('/:id/members/:farmerId', protect, authorize('farmer'), removeMember);
router.put('/:id', protect, authorize('farmer'), updateCooperative);

export default router;