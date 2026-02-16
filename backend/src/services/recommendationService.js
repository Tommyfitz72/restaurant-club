import { SUPPORTED_CITIES } from '../config/constants.js';
import { prisma } from './db.js';
import { getReviewSignalsForRestaurants } from './reviewSignalsService.js';
import {
  buildTraitProfile,
  getRestaurantIntelligenceForRestaurants,
  matchesAdvancedFilters,
  scoreKeywordMatch
} from './restaurantIntelligenceService.js';

const normalizeRating = (rating) => (rating ? rating / 5 : 0.5);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const withinPrice = (restaurant, profile) => {
  if (!profile.priceMin && !profile.priceMax) return 1;
  const min = profile.priceMin ?? 1;
  const max = profile.priceMax ?? 4;
  return restaurant.priceRange >= min && restaurant.priceRange <= max ? 1 : 0.35;
};

const normalizeExternalScore = (aggregate) => clamp((aggregate - 3) / 2, 0, 1);

const buildTagAffinity = (ratings = [], intelligenceByRestaurant) => {
  const totals = new Map();

  for (const entry of ratings) {
    if (!entry?.restaurantId || Number(entry.rating) <= 0) continue;
    const intelligence = intelligenceByRestaurant.get(entry.restaurantId);
    if (!intelligence) continue;

    const tags = [...(intelligence.vibes || []), ...(intelligence.style || []), ...(intelligence.searchableKeywords || [])];
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
  const tags = [...(intelligence.vibes || []), ...(intelligence.style || []), ...(intelligence.searchableKeywords || [])];
  if (!tags.length || !affinity.size) return 0.55;

  const values = tags.map((tag) => affinity.get(tag)).filter((value) => Number.isFinite(value));
  if (!values.length) return 0.55;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const scoreTraitFit = (traitProfile, filters) => {
  const checks = [];
  if (filters.vibe) checks.push(traitProfile.vibe === filters.vibe ? 1 : 0);
  if (filters.size) checks.push(traitProfile.size === filters.size ? 1 : 0);

  const yesNoChecks = [
    ['liveMusic', 'liveMusic'],
    ['celebrityChef', 'celebrityChef'],
    ['outdoorSeating', 'outdoorSeating'],
    ['groupDining', 'groupDining'],
    ['tastingMenu', 'tastingMenu']
  ];

  for (const [filterKey, traitKey] of yesNoChecks) {
    const value = String(filters[filterKey] || '').toLowerCase();
    if (value === 'yes') checks.push(traitProfile[traitKey] ? 1 : 0);
    if (value === 'no') checks.push(!traitProfile[traitKey] ? 1 : 0);
  }

  if (!checks.length) return 0.55;
  return checks.reduce((sum, item) => sum + item, 0) / checks.length;
};

const explanation = ({
  cuisineScore,
  directRatingScore,
  similarCuisineScore,
  priceScore,
  externalReviewScore,
  intelligenceScore,
  keywordScore,
  traitScore,
  intelligence,
  traitProfile,
  selectedKeywords
}) => {
  const reasons = [];
  if (cuisineScore > 0.8) reasons.push('Matches your cuisine preferences');
  if (directRatingScore > 0.8) reasons.push('You rated this restaurant highly before');
  if (similarCuisineScore > 0.7) reasons.push('You liked similar restaurants in this cuisine');
  if (priceScore > 0.8) reasons.push('Fits your preferred price range');
  if (externalReviewScore > 0.7) reasons.push('Strong quality signals across Boston review platforms');
  if (keywordScore > 0.7 && selectedKeywords.length) reasons.push(`Keyword fit: ${selectedKeywords.slice(0, 2).join(', ')}`);
  if (traitScore > 0.7) reasons.push(`Vibe/feature fit: ${traitProfile.vibe}, ${traitProfile.size}`);
  if (intelligenceScore > 0.7) reasons.push(`Style fit: ${(intelligence.style || []).slice(0, 2).join(', ')}`);
  return reasons;
};

export const getRecommendations = async ({
  sessionId,
  neighborhood,
  restaurantQuery,
  selectedKeywords = [],
  vibe,
  size,
  liveMusic,
  celebrityChef,
  outdoorSeating,
  groupDining,
  tastingMenu
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
    include: {
      _count: {
        select: {
          reservations: true
        }
      }
    },
    take: 1200
  });

  const reviewSignalsByRestaurant = await getReviewSignalsForRestaurants(restaurants);
  const intelligenceByRestaurant = await getRestaurantIntelligenceForRestaurants(restaurants, reviewSignalsByRestaurant);

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

  const advancedFilters = {
    vibe,
    size,
    liveMusic,
    celebrityChef,
    outdoorSeating,
    groupDining,
    tastingMenu
  };

  const scored = restaurants
    .filter((restaurant) => !visitedRestaurantIds.has(restaurant.id))
    .map((restaurant) => {
      const reviewSignals = reviewSignalsByRestaurant.get(restaurant.id);
      const intelligence = intelligenceByRestaurant.get(restaurant.id) || {
        vibes: [],
        style: [],
        aspects: [],
        qualitySummary: 'well-reviewed and reliable',
        sourceReferences: [],
        searchableKeywords: []
      };

      const traitProfile = buildTraitProfile(restaurant, intelligence);
      if (!matchesAdvancedFilters(traitProfile, advancedFilters)) {
        return null;
      }

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
      const keywordScore = scoreKeywordMatch(selectedKeywords, intelligence);
      const traitScore = scoreTraitFit(traitProfile, advancedFilters);

      const total =
        cuisineScore * 0.26 +
        directRatingScore * 0.14 +
        similarCuisineScore * 0.12 +
        priceScore * 0.08 +
        externalReviewScore * 0.16 +
        intelligenceScore * 0.12 +
        keywordScore * 0.07 +
        traitScore * 0.05;

      const matchScore = Math.round(clamp(total * 100, 0, 100));

      return {
        restaurant,
        reviewSignals,
        intelligence,
        traitProfile,
        matchScore,
        explanation: explanation({
          cuisineScore,
          directRatingScore,
          similarCuisineScore,
          priceScore,
          externalReviewScore,
          intelligenceScore,
          keywordScore,
          traitScore,
          intelligence,
          traitProfile,
          selectedKeywords
        })
      };
    })
    .filter(Boolean);

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 100);
};
