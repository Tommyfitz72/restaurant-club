import { SCORE_WEIGHTS, SUPPORTED_CITIES } from '../config/constants.js';
import { prisma } from './db.js';
import { getReviewSignalsForRestaurants } from './reviewSignalsService.js';
import { getRestaurantIntelligence } from './restaurantIntelligenceService.js';

const normalizeRating = (rating) => (rating ? rating / 5 : 0.5);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const withinPrice = (restaurant, profile) => {
  if (!profile.priceMin && !profile.priceMax) return 1;
  const min = profile.priceMin ?? 1;
  const max = profile.priceMax ?? 4;
  return restaurant.priceRange >= min && restaurant.priceRange <= max ? 1 : 0.4;
};

const normalizeExternalScore = (aggregate) => clamp((aggregate - 3) / 2, 0, 1);

const buildTagAffinity = (ratings = [], intelligenceByRestaurant) => {
  const totals = new Map();

  for (const entry of ratings) {
    if (!entry?.restaurantId || Number(entry.rating) <= 0) continue;
    const intelligence = intelligenceByRestaurant.get(entry.restaurantId);
    if (!intelligence) continue;

    const tags = [...(intelligence.vibes || []), ...(intelligence.style || [])];
    for (const tag of tags) {
      const current = totals.get(tag) || { score: 0, count: 0 };
      current.score += Number(entry.rating);
      current.count += 1;
      totals.set(tag, current);
    }
  }

  const affinity = new Map();
  for (const [tag, current] of totals.entries()) {
    affinity.set(tag, current.score / current.count / 5);
  }

  return affinity;
};

const scoreIntelligenceMatch = (intelligence, affinity) => {
  const tags = [...(intelligence.vibes || []), ...(intelligence.style || [])];
  if (!tags.length || !affinity.size) return 0.55;

  const values = tags.map((tag) => affinity.get(tag)).filter((value) => Number.isFinite(value));
  if (!values.length) return 0.55;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const explanation = ({
  cuisineScore,
  directRatingScore,
  similarCuisineScore,
  priceScore,
  externalReviewScore,
  intelligenceScore,
  intelligence
}) => {
  const reasons = [];
  if (cuisineScore > 0.8) reasons.push('Matches your cuisine preferences');
  if (directRatingScore > 0.8) reasons.push('You rated this restaurant highly before');
  if (similarCuisineScore > 0.7) reasons.push('You liked similar restaurants in this cuisine');
  if (priceScore > 0.8) reasons.push('Fits your preferred price range');
  if (externalReviewScore > 0.7) reasons.push('Strong quality signals across Boston review platforms');
  if (intelligenceScore > 0.7) reasons.push(`Vibe fit: ${intelligence.vibes.slice(0, 2).join(', ')}`);
  reasons.push(`Style: ${intelligence.style.slice(0, 2).join(', ')}`);
  return reasons;
};

export const getRecommendations = async ({ sessionId, neighborhood, restaurantQuery }) => {
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

  const restaurants = await prisma.restaurant.findMany({
    where: {
      city: { in: SUPPORTED_CITIES },
      ...(neighborhood ? { neighborhood } : {}),
      ...(restaurantQuery
        ? {
            name: {
              contains: String(restaurantQuery),
              mode: 'insensitive'
            }
          }
        : {})
    },
    take: 1200
  });

  const reviewSignalsByRestaurant = await getReviewSignalsForRestaurants(restaurants);
  const intelligenceByRestaurant = new Map(
    restaurants.map((restaurant) => [
      restaurant.id,
      getRestaurantIntelligence(restaurant, reviewSignalsByRestaurant.get(restaurant.id))
    ])
  );

  const visitedRestaurantIds = new Set(
    (profile?.ratings || []).filter((entry) => Number(entry.rating) > 0).map((entry) => entry.restaurantId)
  );

  const ratingsByRestaurant = new Map();
  const ratingsByCuisine = new Map();
  (profile?.ratings || []).forEach((entry) => {
    ratingsByRestaurant.set(entry.restaurantId, entry.rating);
    const list = ratingsByCuisine.get(entry.restaurant.cuisineType) || [];
    list.push(entry.rating);
    ratingsByCuisine.set(entry.restaurant.cuisineType, list);
  });

  const tagAffinity = buildTagAffinity(profile?.ratings || [], intelligenceByRestaurant);

  const scored = restaurants
    .filter((restaurant) => !visitedRestaurantIds.has(restaurant.id))
    .map((restaurant) => {
      const reviewSignals = reviewSignalsByRestaurant.get(restaurant.id);
      const intelligence = intelligenceByRestaurant.get(restaurant.id);

      const cuisineScore = profile?.cuisinePreferences?.includes(restaurant.cuisineType) ? 1 : 0.35;
      const directRatingScore = normalizeRating(ratingsByRestaurant.get(restaurant.id));

      const similarRatings = ratingsByCuisine.get(restaurant.cuisineType) || [];
      const similarAvg =
        similarRatings.length > 0
          ? similarRatings.reduce((sum, rating) => sum + rating, 0) / similarRatings.length
          : null;
      const similarCuisineScore = normalizeRating(similarAvg);

      const priceScore = withinPrice(restaurant, profile || {});
      const externalReviewScore = normalizeExternalScore(reviewSignals?.aggregate || 0);
      const intelligenceScore = scoreIntelligenceMatch(intelligence, tagAffinity);

      const total =
        cuisineScore * SCORE_WEIGHTS.cuisine +
        directRatingScore * SCORE_WEIGHTS.directRating +
        similarCuisineScore * SCORE_WEIGHTS.similarCuisine +
        priceScore * SCORE_WEIGHTS.priceAndTime +
        externalReviewScore * SCORE_WEIGHTS.externalReview +
        intelligenceScore * 0.12;

      const matchScore = Math.round(clamp(total * 100, 0, 100));

      return {
        restaurant,
        reviewSignals,
        intelligence,
        matchScore,
        explanation: explanation({
          cuisineScore,
          directRatingScore,
          similarCuisineScore,
          priceScore,
          externalReviewScore,
          intelligenceScore,
          intelligence
        })
      };
    });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 100);
};
