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

const toSafeUrl = (value) => {
  const url = String(value || '').trim();
  return /^https?:\/\//i.test(url) ? url : null;
};

const isSearchUrl = (url) =>
  /google\.com\/search|opentable\.com\/s\/?|resy\.com\/cities\/.+\?query=|maps\.google\.com\/\?q=/i.test(
    String(url || '')
  );

const isDirectBookingUrl = (url) => {
  const normalized = String(url || '').toLowerCase();
  if (!normalized || isSearchUrl(normalized)) return false;

  return (
    /toast(tab)?\.com/.test(normalized) ||
    /resy\.com\/.+\/venues\//.test(normalized) ||
    /opentable\.com\/r\//.test(normalized) ||
    /(reserve|reservation|book|booking|tables)\b/.test(normalized)
  );
};

const getBookingDetails = (restaurant) => {
  const links = restaurant.bookingLinks && typeof restaurant.bookingLinks === 'object' ? restaurant.bookingLinks : {};

  const allLinks = [
    { platform: 'Toast', url: toSafeUrl(links.toast) },
    { platform: 'Resy', url: toSafeUrl(links.resy) },
    { platform: 'OpenTable', url: toSafeUrl(links.opentable) },
    { platform: 'Direct', url: toSafeUrl(links.direct) },
    { platform: 'Google Maps', url: toSafeUrl(links.google) },
    { platform: 'Website', url: toSafeUrl(links.website) }
  ].filter((item) => item.url && !isSearchUrl(item.url));

  const bookingLinks = allLinks.filter((item) => isDirectBookingUrl(item.url));

  const websiteCandidates = [toSafeUrl(links.website), toSafeUrl(links.direct), toSafeUrl(links.google)].filter(
    (url) => url && !isSearchUrl(url)
  );

  return {
    websiteUrl: websiteCandidates[0] || null,
    booking: bookingLinks[0] || null,
    links: bookingLinks
  };
};

const toMatchBand = (score) => {
  if (score > 80) return 'high';
  if (score >= 40) return 'average';
  return 'low';
};

const buildMatchNarrative = ({
  matchScore,
  cuisineScore,
  priceScore,
  keywordScore,
  traitScore,
  intelligenceScore,
  explanation: reasons
}) => {
  const band = toMatchBand(matchScore);
  const style =
    intelligenceScore > 0.7
      ? 'The restaurant style strongly lines up with your profile.'
      : intelligenceScore > 0.5
        ? 'The style fit is decent for your profile.'
        : 'The style fit is weaker for your profile.';
  const vibe =
    traitScore > 0.7
      ? 'Vibe and dining format align well with what you selected.'
      : traitScore > 0.5
        ? 'Vibe alignment is moderate.'
        : 'Vibe alignment is limited with your current filters.';
  const cuisine = cuisineScore > 0.8 ? 'Cuisine preference match is strong.' : 'Cuisine match is partial.';
  const budget = priceScore > 0.8 ? 'Budget fit is solid.' : 'Budget fit is mixed.';
  const keywords =
    keywordScore > 0.7
      ? 'Your selected keywords are strongly represented.'
      : keywordScore > 0.4
        ? 'Some selected keywords are present.'
        : 'Few of your selected keywords are present.';

  const opening =
    band === 'high'
      ? 'This is a high-confidence match for your taste profile.'
      : band === 'average'
        ? 'This is a moderate match and could work well depending on mood and occasion.'
        : 'This is currently a lower match for your profile settings.';

  const reasonLine = reasons.length ? `Top signals: ${reasons.slice(0, 3).join('; ')}.` : '';
  return `${opening} ${cuisine} ${budget} ${keywords} ${vibe} ${style} ${reasonLine}`.trim();
};

const buildFunDescription = (restaurant, intelligence = {}) => {
  const vibes = (intelligence.vibes || []).slice(0, 2).join(' and ') || 'a distinctive vibe';
  const styles = (intelligence.style || []).slice(0, 2).join(', ') || restaurant.cuisineType;
  const aspects = (intelligence.aspects || []).slice(0, 2).join(' • ');
  const quotes = (intelligence.reviewQuotes || []).slice(0, 2).map((quote) => `"${quote}"`);

  return [
    `${restaurant.name} in ${restaurant.neighborhood} is a ${styles} spot with ${vibes}.`,
    aspects ? `What stands out: ${aspects}.` : '',
    ...quotes
  ]
    .filter(Boolean)
    .join(' ');
};

const buildPhotoGallery = (restaurant) => {
  const base = String(restaurant.imageUrl || '').trim();
  const fallback = [
    `https://source.unsplash.com/900x600/?${encodeURIComponent(`${restaurant.name} restaurant`)}`,
    `https://source.unsplash.com/900x600/?${encodeURIComponent(`${restaurant.name} dining room`)}`,
    `https://source.unsplash.com/900x600/?${encodeURIComponent(`${restaurant.name} boston`)}`
  ];

  const gallery = [base, ...fallback].filter(Boolean);
  return Array.from(new Set(gallery)).slice(0, 4);
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
        searchableKeywords: [],
        reviewQuotes: [],
        keywordSignalMap: {}
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

      const keywordPenalty = selectedKeywords.length && keywordScore <= 0.2 ? 0.25 : 1;

      const total =
        cuisineScore * 0.18 +
        directRatingScore * 0.12 +
        similarCuisineScore * 0.06 +
        priceScore * 0.04 +
        externalReviewScore * 0.14 +
        intelligenceScore * 0.18 +
        keywordScore * 0.2 +
        traitScore * 0.08;

      const adjustedTotal = total * keywordPenalty;
      const qualityBoost = Math.max(0, (externalReviewScore - 0.5) * 0.18);
      const uniquenessBoost = Math.max(0, Math.abs(keywordScore - 0.5) * 0.12 + Math.abs(intelligenceScore - 0.5) * 0.08);
      const rawScore = clamp(adjustedTotal + qualityBoost + uniquenessBoost, 0, 1);
      const matchScore = Math.round(clamp(Math.pow(rawScore, 1.12) * 100, 0, 100));

      const reasonList = explanation({
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
      });

      const bookingDetails = getBookingDetails(restaurant);
      const matchBand = toMatchBand(matchScore);

      return {
        restaurant,
        reviewSignals,
        intelligence,
        traitProfile,
        matchScore,
        matchBand,
        explanation: reasonList,
        detail: {
          description: buildFunDescription(restaurant, intelligence),
          ratingsBySite: {
            resy: Number(reviewSignals?.sources?.resy || 0),
            opentable: Number(reviewSignals?.sources?.opentable || 0),
            google: Number(reviewSignals?.sources?.google || 0),
            other: Number(reviewSignals?.sources?.other || 0),
            aggregate: Number(reviewSignals?.aggregate || 0),
            reviewCount: Number(reviewSignals?.reviewCount || 0)
          },
          matchNarrative: buildMatchNarrative({
            matchScore,
            cuisineScore,
            priceScore,
            keywordScore,
            traitScore,
            intelligenceScore,
            explanation: reasonList
          }),
          websiteUrl: bookingDetails.websiteUrl,
          booking: bookingDetails.booking,
          bookingLinks: bookingDetails.links,
          hasDirectReservation: Boolean(bookingDetails.booking),
          photoGallery: buildPhotoGallery(restaurant),
          reviewQuotes: (intelligence.reviewQuotes || []).slice(0, 3),
          sourceReferences: intelligence.sourceReferences || []
        }
      };
    })
    .filter(Boolean);

  const ranked = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 100);

  return ranked.map((entry, index) => {
    const percentile = ranked.length > 1 ? 1 - index / (ranked.length - 1) : 1;
    const spread = Math.round((percentile - 0.5) * 18);
    const variedScore = clamp(entry.matchScore + spread, 5, 99);
    return {
      ...entry,
      matchScore: variedScore
    };
  });
};
