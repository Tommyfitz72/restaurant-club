import { RESERVATION_LOOKAHEAD_HOURS, SCORE_WEIGHTS } from '../config/constants.js';
import { prisma } from './db.js';
import { isWithinPreferredTime, sameDay } from '../utils/time.js';
import { getReviewSignalsForRestaurants } from './reviewSignalsService.js';
import { getRecentOpenings } from './scannerService.js';

const normalizeRating = (rating) => (rating ? rating / 5 : 0.5);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const withinPrice = (restaurant, profile) => {
  if (!profile.priceMin && !profile.priceMax) return 1;
  const min = profile.priceMin ?? 1;
  const max = profile.priceMax ?? 4;
  return restaurant.priceRange >= min && restaurant.priceRange <= max ? 1 : 0.4;
};

const normalizeExternalScore = (aggregate) => clamp((aggregate - 3) / 2, 0, 1);

const explanation = ({
  cuisineScore,
  directRatingScore,
  similarCuisineScore,
  priceTimeScore,
  externalReviewScore,
  hasRecentOpening
}) => {
  const reasons = [];
  if (cuisineScore > 0.8) reasons.push('Matches your cuisine preferences');
  if (directRatingScore > 0.8) reasons.push('You rated this restaurant highly');
  if (similarCuisineScore > 0.7) reasons.push('You liked similar restaurants in this cuisine');
  if (priceTimeScore > 0.8) reasons.push('Fits your price and time preferences');
  if (externalReviewScore > 0.7) reasons.push('Strong reviews across Resy, OpenTable, Google, and other sources');
  if (hasRecentOpening) reasons.push('A newly opened slot was recently detected');
  return reasons.length ? reasons : ['Popular option in Boston/Cambridge'];
};

export const getRecommendations = async ({
  sessionId,
  date,
  partySize,
  timeFrom,
  timeTo,
  neighborhood,
  restaurantQuery
}) => {
  const profile = sessionId
    ? await prisma.userProfile.findUnique({
        where: { sessionId },
        include: {
          ratings: {
            include: {
              restaurant: true
            }
          }
        }
      })
    : null;

  const reservationWhere = {
    available: true,
    startsAt: {
      gte: new Date(),
      lte: new Date(Date.now() + RESERVATION_LOOKAHEAD_HOURS * 60 * 60 * 1000)
    },
    ...(partySize ? { partySize: Number(partySize) } : {})
  };

  const reservations = await prisma.reservationSlot.findMany({
    where: reservationWhere,
    include: { restaurant: true },
    orderBy: { startsAt: 'asc' },
    take: 1200
  });

  const restaurants = Array.from(new Map(reservations.map((entry) => [entry.restaurant.id, entry.restaurant])).values());
  const reviewSignalsByRestaurant = await getReviewSignalsForRestaurants(restaurants);
  const recentOpenings = await getRecentOpenings();
  const openingRestaurantIds = new Set(recentOpenings.map((item) => item.restaurantId));

  const visitedRestaurantIds = new Set(
    (profile?.ratings || []).filter((entry) => Number(entry.rating) > 0).map((entry) => entry.restaurantId)
  );

  const filtered = reservations.filter((reservation) => {
    if (visitedRestaurantIds.has(reservation.restaurantId)) return false;
    if (date && !sameDay(reservation.startsAt, date)) return false;
    if (neighborhood && reservation.restaurant.neighborhood !== neighborhood) return false;

    if (restaurantQuery) {
      const needle = String(restaurantQuery).toLowerCase();
      if (!reservation.restaurant.name.toLowerCase().includes(needle)) return false;
    }

    if (timeFrom || timeTo) {
      const hour = new Date(reservation.startsAt).getHours();
      const minHour = timeFrom ? Number(timeFrom.split(':')[0]) : 0;
      const maxHour = timeTo ? Number(timeTo.split(':')[0]) : 23;
      if (hour < minHour || hour > maxHour) return false;
    }

    return true;
  });

  const ratingsByRestaurant = new Map();
  const ratingsByCuisine = new Map();

  (profile?.ratings || []).forEach((entry) => {
    ratingsByRestaurant.set(entry.restaurantId, entry.rating);

    const list = ratingsByCuisine.get(entry.restaurant.cuisineType) || [];
    list.push(entry.rating);
    ratingsByCuisine.set(entry.restaurant.cuisineType, list);
  });

  const scored = filtered.map((reservation) => {
    const cuisineScore = profile?.cuisinePreferences?.includes(reservation.restaurant.cuisineType) ? 1 : 0.3;

    const directRating = ratingsByRestaurant.get(reservation.restaurantId);
    const directRatingScore = normalizeRating(directRating);

    const similarRatings = ratingsByCuisine.get(reservation.restaurant.cuisineType) || [];
    const similarAvg =
      similarRatings.length > 0
        ? similarRatings.reduce((sum, rating) => sum + rating, 0) / similarRatings.length
        : null;
    const similarCuisineScore = normalizeRating(similarAvg);

    const timeFit = isWithinPreferredTime(reservation.startsAt, profile?.preferredTimes);
    const priceFit = withinPrice(reservation.restaurant, profile || {});
    const priceTimeScore = (timeFit + priceFit) / 2;

    const reviewSignals = reviewSignalsByRestaurant.get(reservation.restaurant.id);
    const externalReviewScore = normalizeExternalScore(reviewSignals?.aggregate || 0);
    const hasRecentOpening = openingRestaurantIds.has(reservation.restaurantId);

    const total =
      cuisineScore * SCORE_WEIGHTS.cuisine +
      directRatingScore * SCORE_WEIGHTS.directRating +
      similarCuisineScore * SCORE_WEIGHTS.similarCuisine +
      priceTimeScore * SCORE_WEIGHTS.priceAndTime +
      externalReviewScore * SCORE_WEIGHTS.externalReview;

    const percent = Math.round(clamp(total * 100, 0, 100));

    return {
      ...reservation,
      matchScore: percent,
      reviewSignals,
      hasRecentOpening,
      explanation: explanation({
        cuisineScore,
        directRatingScore,
        similarCuisineScore,
        priceTimeScore,
        externalReviewScore,
        hasRecentOpening
      })
    };
  });

  const grouped = new Map();
  for (const item of scored) {
    const key = item.restaurant.id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        restaurant: item.restaurant,
        matchScore: item.matchScore,
        explanation: item.explanation,
        reviewSignals: item.reviewSignals,
        hasRecentOpening: item.hasRecentOpening,
        slots: []
      });
    }

    const target = grouped.get(key);
    target.matchScore = Math.max(target.matchScore, item.matchScore);
    target.hasRecentOpening = target.hasRecentOpening || item.hasRecentOpening;
    target.slots.push({
      id: item.id,
      startsAt: item.startsAt,
      partySize: item.partySize,
      provider: item.provider,
      bookingUrl: item.bookingUrl
    });
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 100);
};
