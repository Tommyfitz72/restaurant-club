import { Router } from 'express';
import {
  getNeighborhoods,
  getPopularRestaurants,
  searchRestaurants,
  syncBostonGoogleRestaurants
} from '../controllers/restaurantController.js';
import { getProfile, saveRatings, upsertProfile } from '../controllers/profileController.js';
import {
  getAvailableReservations,
  listRecentOpenings,
  refreshLimiter,
  refreshReservations
} from '../controllers/reservationController.js';
import { listRecommendations, searchRecommendations } from '../controllers/recommendationController.js';

export const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

router.get('/restaurants/popular', getPopularRestaurants);
router.post('/restaurants/sync-google', syncBostonGoogleRestaurants);
router.get('/restaurants/neighborhoods', getNeighborhoods);
router.get('/restaurants/search', searchRestaurants);

router.put('/profiles/:sessionId', upsertProfile);
router.get('/profiles/:sessionId', getProfile);
router.put('/profiles/:sessionId/ratings', saveRatings);

router.post('/reservations/refresh', refreshLimiter, refreshReservations);
router.get('/reservations/available', getAvailableReservations);
router.get('/reservations/openings', listRecentOpenings);

router.get('/recommendations', listRecommendations);
router.get('/recommendations/search', searchRecommendations);
