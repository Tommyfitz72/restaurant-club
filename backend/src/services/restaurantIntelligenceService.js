import { prisma } from './db.js';

const SOURCE_LIBRARY = [
  { name: 'Eater Boston', url: 'https://boston.eater.com/' },
  { name: 'The Infatuation Boston', url: 'https://www.theinfatuation.com/boston' },
  { name: 'Boston Magazine', url: 'https://www.bostonmagazine.com/restaurants/best-restaurants-in-boston/' },
  { name: 'The Food Lens', url: 'https://www.thefoodlens.com/' },
  { name: 'BU Food Lens', url: 'https://www.bu.edu/articles/2017/food-lens/' },
  { name: 'Hidden Boston', url: 'https://www.hiddenboston.com/BostonRestaurantBlog.html' },
  { name: 'Anna Darrow Substack', url: 'https://annadarrow.substack.com/p/1-another-boston-restaurant-guide' },
  { name: 'One for the Table', url: 'https://oneforthetable.com/restaurant-reviews/boston/' },
  { name: 'Edible Boston', url: 'https://www.edibleboston.com/blog/2017/12/1/hidden-restaurants-v2-shhhh-ssx9l' },
  { name: 'TripAdvisor Boston', url: 'https://www.tripadvisor.com/Restaurants-g60745-Boston_Massachusetts.html' },
  { name: 'OpenTable Boston', url: 'https://www.opentable.com/region/new-england/boston-restaurants' },
  { name: 'Condé Nast Traveler', url: 'https://www.cntraveler.com/gallery/best-restaurants-in-boston' }
];

export const KEYWORD_CATALOG = [
  { keyword: 'date night', category: 'occasion', sources: ['The Infatuation Boston', 'Eater Boston'] },
  { keyword: 'romantic', category: 'vibe', sources: ['Boston Magazine', 'The Infatuation Boston'] },
  { keyword: 'fun and lively', category: 'vibe', sources: ['Eater Boston', 'TripAdvisor Boston'] },
  { keyword: 'quiet', category: 'vibe', sources: ['The Infatuation Boston', 'Condé Nast Traveler'] },
  { keyword: 'chef tasting', category: 'style', sources: ['Boston Magazine', 'Condé Nast Traveler'] },
  { keyword: 'celebration', category: 'occasion', sources: ['Boston Magazine', 'OpenTable Boston'] },
  { keyword: 'group dinner', category: 'occasion', sources: ['Eater Boston', 'OpenTable Boston'] },
  { keyword: 'business dinner', category: 'occasion', sources: ['OpenTable Boston', 'TripAdvisor Boston'] },
  { keyword: 'late night', category: 'occasion', sources: ['Eater Boston', 'Hidden Boston'] },
  { keyword: 'brunch', category: 'occasion', sources: ['The Food Lens', 'Eater Boston'] },
  { keyword: 'oyster bar', category: 'food', sources: ['Eater Boston', 'TripAdvisor Boston'] },
  { keyword: 'pasta', category: 'food', sources: ['The Infatuation Boston', 'Boston Magazine'] },
  { keyword: 'sushi', category: 'food', sources: ['Eater Boston', 'OpenTable Boston'] },
  { keyword: 'steak', category: 'food', sources: ['OpenTable Boston', 'TripAdvisor Boston'] },
  { keyword: 'seafood', category: 'food', sources: ['Eater Boston', 'TripAdvisor Boston'] },
  { keyword: 'small plates', category: 'style', sources: ['Eater Boston', 'The Infatuation Boston'] },
  { keyword: 'wine list', category: 'style', sources: ['Boston Magazine', 'One for the Table'] },
  { keyword: 'cocktail bar', category: 'style', sources: ['Eater Boston', 'Hidden Boston'] },
  { keyword: 'patio', category: 'feature', sources: ['The Food Lens', 'OpenTable Boston'] },
  { keyword: 'outdoor seating', category: 'feature', sources: ['OpenTable Boston', 'TripAdvisor Boston'] },
  { keyword: 'live music', category: 'feature', sources: ['Hidden Boston', 'One for the Table'] },
  { keyword: 'celebrity chef', category: 'feature', sources: ['Boston Magazine', 'Condé Nast Traveler'] },
  { keyword: 'neighborhood gem', category: 'quality', sources: ['The Infatuation Boston', 'Hidden Boston'] },
  { keyword: 'highly rated', category: 'quality', sources: ['TripAdvisor Boston', 'OpenTable Boston'] },
  { keyword: 'classic boston', category: 'quality', sources: ['Boston Magazine', 'Eater Boston'] }
];

export const ADVANCED_FILTERS = {
  vibe: ['romantic', 'fun and lively', 'quiet'],
  size: ['small', 'medium', 'large'],
  liveMusic: ['yes', 'no'],
  celebrityChef: ['yes', 'no'],
  outdoorSeating: ['yes', 'no'],
  groupDining: ['yes', 'no'],
  tastingMenu: ['yes', 'no']
};

const CURATED_NOTES = {
  sarma: {
    vibes: ['fun and lively', 'share-plates', 'inventive'],
    style: ['mediterranean', 'small plates', 'chef-driven'],
    aspects: ['great for groups', 'bold flavors', 'high-energy room']
  },
  giulia: {
    vibes: ['romantic', 'cozy', 'quiet'],
    style: ['italian', 'pasta', 'chef-driven'],
    aspects: ['excellent handmade pasta', 'date night', 'polished service']
  },
  oleana: {
    vibes: ['romantic', 'quiet', 'special-occasion'],
    style: ['eastern mediterranean', 'seasonal'],
    aspects: ['creative mezze', 'destination dining', 'patio']
  },
  'neptune oyster': {
    vibes: ['fun and lively', 'classic'],
    style: ['seafood', 'oyster bar'],
    aspects: ['lobster roll', 'small room', 'high demand']
  },
  contessa: {
    vibes: ['romantic', 'fun and lively', 'upscale'],
    style: ['italian', 'luxury'],
    aspects: ['special occasion', 'city views', 'celebrity chef']
  },
  toro: {
    vibes: ['fun and lively', 'social'],
    style: ['spanish', 'small plates'],
    aspects: ['group dinner', 'late night', 'cocktail bar']
  }
};

const CUISINE_TO_VIBE = {
  Italian: ['romantic', 'cozy', 'date night'],
  Japanese: ['quiet', 'precise', 'chef-driven'],
  French: ['romantic', 'quiet', 'special-occasion'],
  American: ['fun and lively', 'social', 'group dinner'],
  Mexican: ['fun and lively', 'social', 'group dinner'],
  Thai: ['fun and lively', 'flavor-forward'],
  Chinese: ['group dinner', 'shareable', 'comforting'],
  Mediterranean: ['small plates', 'romantic', 'group dinner'],
  Steakhouse: ['business dinner', 'celebration', 'classic'],
  Seafood: ['classic boston', 'date night', 'highly rated'],
  Indian: ['bold flavors', 'group dinner'],
  Korean: ['fun and lively', 'group dinner'],
  Spanish: ['small plates', 'fun and lively', 'wine list'],
  'Middle Eastern': ['shareable', 'romantic']
};

const PRICE_TO_STYLE = {
  1: ['quick', 'casual'],
  2: ['casual', 'reliable'],
  3: ['date night', 'elevated'],
  4: ['special-occasion', 'chef tasting']
};

const CELEBRITY_CHEF_NAMES = ['contessa', 'no. 9 park', 'oleana', 'sarma', 'o ya', 'grill 23'];

const KNOWN_LIVE_MUSIC_RESTAURANTS = new Set([
  'the beehive',
  'the bebop',
  "darryl's corner bar & kitchen",
  'grace by nia',
  'scullers jazz club',
  "wally's cafe",
  'the burren',
  'mad monkfish',
  'lonestar taco bar',
  'city winery boston',
  'regattabar',
  'hobgoblin',
  'the dubliner',
  'carrie nation cocktail club',
  'parla x viale'
]);

const normalize = (text) => String(text || '').trim().toLowerCase();

const hash = (text) => {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) {
    value = (value * 31 + text.charCodeAt(i)) % 100000;
  }
  return value;
};

const pickSources = (restaurant) => {
  const seed = hash(`${restaurant.name}-${restaurant.neighborhood}-${restaurant.cuisineType}`);
  const picks = new Set();
  while (picks.size < 3) {
    picks.add(SOURCE_LIBRARY[(seed + picks.size * 7) % SOURCE_LIBRARY.length]);
  }
  return Array.from(picks);
};

const summarizeQuality = (aggregate, reviewCount) => {
  if (aggregate >= 4.6 && reviewCount >= 300) return 'top-tier acclaim across Boston review ecosystems';
  if (aggregate >= 4.3) return 'consistently strong ratings across major sources';
  if (aggregate >= 4.0) return 'well-reviewed and reliable';
  return 'mixed-to-positive ratings with niche appeal';
};

const uniq = (values = []) => Array.from(new Set(values.filter(Boolean)));

const sortBySignalStrength = (a, b) =>
  Number(b.isVerified) - Number(a.isVerified) ||
  (b.agreementCount || 0) - (a.agreementCount || 0) ||
  (b.verificationScore || 0) - (a.verificationScore || 0) ||
  b.confidence - a.confidence;

const topValuesByType = (tags, type, limit = 5) =>
  tags
    .filter((tag) => tag.tagType === type)
    .sort(sortBySignalStrength)
    .slice(0, limit)
    .map((tag) => tag.tagValue);

const topQuoteSnippets = (tags = [], limit = 3) =>
  tags
    .filter((tag) => tag.evidenceSnippet && !/^(vibe|style|aspect|quality):/i.test(String(tag.evidenceSnippet).trim()))
    .sort(sortBySignalStrength)
    .map((tag) => String(tag.evidenceSnippet).trim().replace(/\s+/g, ' '))
    .filter((snippet, index, arr) => snippet.length >= 30 && arr.indexOf(snippet) === index)
    .slice(0, limit);

const yesNoToBool = (value) => {
  if (!value) return null;
  if (String(value).toLowerCase() === 'yes') return true;
  if (String(value).toLowerCase() === 'no') return false;
  return null;
};

const classifySize = (tableSignal) => {
  if (tableSignal >= 120) return 'large';
  if (tableSignal >= 45) return 'medium';
  return 'small';
};

export const buildTraitProfile = (restaurant, intelligence = {}) => {
  const text = [
    ...(intelligence.vibes || []),
    ...(intelligence.style || []),
    ...(intelligence.aspects || []),
    String(intelligence.qualitySummary || '')
  ]
    .join(' ')
    .toLowerCase();

  const tableSignal = Number(restaurant?._count?.reservations || 0);
  const size = classifySize(tableSignal);

  const vibe = text.includes('quiet')
    ? 'quiet'
    : text.includes('fun and lively') || text.includes('lively') || text.includes('social')
      ? 'fun and lively'
      : 'romantic';

  const liveMusic =
    KNOWN_LIVE_MUSIC_RESTAURANTS.has(normalize(restaurant.name)) ||
    /live music|jazz|piano|dj|band|cabaret|listening room/.test(text);
  const celebrityChef =
    CELEBRITY_CHEF_NAMES.includes(normalize(restaurant.name)) || /celebrity chef|chef-led/.test(text);
  const outdoorSeating = /patio|outdoor|terrace|roof/.test(text);
  const groupDining = /group|share|social|large party/.test(text);
  const tastingMenu = /tasting|fine-dining|special-occasion/.test(text);

  return {
    vibe,
    size,
    liveMusic,
    celebrityChef,
    outdoorSeating,
    groupDining,
    tastingMenu,
    tableSignal
  };
};

const mergeIntelligence = (base, dbTags = []) => {
  if (!dbTags.length) return base;

  const vibes = uniq([...topValuesByType(dbTags, 'VIBE', 6), ...(base.vibes || [])]).slice(0, 6);
  const style = uniq([...topValuesByType(dbTags, 'STYLE', 6), ...(base.style || [])]).slice(0, 6);
  const aspects = uniq([...topValuesByType(dbTags, 'ASPECT', 6), ...(base.aspects || [])]).slice(0, 6);
  const quality = topValuesByType(dbTags, 'QUALITY', 1)[0] || base.qualitySummary;

  const sourceReferences = uniq(dbTags.map((tag) => `${tag.sourceName}|${tag.sourceUrl}`))
    .slice(0, 6)
    .map((entry) => {
      const [name, url] = entry.split('|');
      return { name, url };
    });

  const reviewQuotes = topQuoteSnippets(dbTags, 4);

  const keywordSignalMap = {};
  for (const item of KEYWORD_CATALOG) {
    const keyword = String(item.keyword || '').toLowerCase();
    if (!keyword) continue;

    const matchingTags = dbTags.filter((tag) => {
      const value = String(tag.tagValue || '').toLowerCase();
      const snippet = String(tag.evidenceSnippet || '').toLowerCase();
      return value.includes(keyword) || snippet.includes(keyword);
    });

    if (!matchingTags.length) continue;

    const score = matchingTags.reduce((sum, tag) => {
      const agreement = Number(tag.agreementCount || 1);
      const verification = Number(tag.verificationScore || tag.confidence || 0.5);
      const verifiedBoost = tag.isVerified ? 1.3 : 1;
      return sum + agreement * verification * verifiedBoost;
    }, 0);

    const mentions = matchingTags.reduce((sum, tag) => {
      const snippet = String(tag.evidenceSnippet || '').toLowerCase();
      return sum + (snippet.includes(keyword) ? 1 : 0);
    }, 0);

    keywordSignalMap[keyword] = {
      score: Number(score.toFixed(3)),
      mentions
    };
  }

  return {
    ...base,
    vibes,
    style,
    aspects,
    qualitySummary: quality,
    sourceReferences: sourceReferences.length ? sourceReferences : base.sourceReferences,
    reviewQuotes: reviewQuotes.length ? reviewQuotes : base.reviewQuotes || [],
    keywordSignalMap
  };
};

export const getRestaurantIntelligence = (restaurant, reviewSignals) => {
  const curated = CURATED_NOTES[normalize(restaurant.name)] || null;

  const vibes = curated?.vibes || CUISINE_TO_VIBE[restaurant.cuisineType] || ['versatile', 'neighborhood gem'];
  const style = curated?.style || [String(restaurant.cuisineType || '').toLowerCase(), ...(PRICE_TO_STYLE[restaurant.priceRange] || ['casual'])];
  const aspects =
    curated?.aspects ||
    [
      `popular in ${String(restaurant.neighborhood || '').toLowerCase()}`,
      `${restaurant.priceRange >= 3 ? 'elevated' : 'accessible'} dining style`,
      `${String(restaurant.cuisineType || '').toLowerCase()} identity`
    ];

  const aggregate = Number(reviewSignals?.aggregate || 0);
  const reviewCount = Number(reviewSignals?.reviewCount || 0);

  const qualitySummary = summarizeQuality(aggregate, reviewCount);
  const sourceReferences = pickSources(restaurant);

  const searchableKeywords = uniq(
    KEYWORD_CATALOG.map((item) => item.keyword).filter((keyword) => {
      const haystack = `${vibes.join(' ')} ${style.join(' ')} ${aspects.join(' ')} ${qualitySummary}`.toLowerCase();
      return haystack.includes(keyword);
    })
  );

  return {
    vibes,
    style,
    aspects,
    qualitySummary,
    sourceReferences,
    searchableKeywords,
    reviewQuotes: [],
    keywordSignalMap: {}
  };
};

export const getRestaurantIntelligenceForRestaurants = async (restaurants, reviewSignalsByRestaurant) => {
  if (!restaurants.length) return new Map();

  const restaurantIds = restaurants.map((restaurant) => restaurant.id);
  const tags = await prisma.restaurantTagSignal.findMany({
    where: { restaurantId: { in: restaurantIds } }
  });

  const tagsByRestaurant = new Map();
  for (const tag of tags) {
    const list = tagsByRestaurant.get(tag.restaurantId) || [];
    list.push(tag);
    tagsByRestaurant.set(tag.restaurantId, list);
  }

  return new Map(
    restaurants.map((restaurant) => {
      const base = getRestaurantIntelligence(restaurant, reviewSignalsByRestaurant.get(restaurant.id));
      const merged = mergeIntelligence(base, tagsByRestaurant.get(restaurant.id) || []);
      return [restaurant.id, merged];
    })
  );
};

const includesAny = (text, selected = []) => {
  if (!selected.length) return true;
  const normalized = text.toLowerCase();
  return selected.some((item) => normalized.includes(String(item).toLowerCase()));
};

export const scoreKeywordMatch = (selectedKeywords = [], intelligence = {}) => {
  if (!selectedKeywords.length) return 0.55;

  const haystack = [
    ...(intelligence.vibes || []),
    ...(intelligence.style || []),
    ...(intelligence.aspects || []),
    ...(intelligence.searchableKeywords || []),
    ...(intelligence.reviewQuotes || []),
    String(intelligence.qualitySummary || '')
  ]
    .join(' ')
    .toLowerCase();

  const keywordSignalMap = intelligence.keywordSignalMap || {};

  const scores = selectedKeywords.map((rawKeyword) => {
    const keyword = String(rawKeyword || '').toLowerCase().trim();
    if (!keyword) return 0;

    const exactHit = includesAny(haystack, [keyword]);
    const tokenHit = keyword
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => haystack.includes(token));

    const signal = Number(keywordSignalMap[keyword]?.score || 0);
    const mentions = Number(keywordSignalMap[keyword]?.mentions || 0);

    const value =
      (exactHit ? 0.55 : tokenHit ? 0.35 : 0) +
      Math.min(0.3, signal / 8) +
      Math.min(0.2, mentions * 0.08);

    return Math.max(0, Math.min(1, value));
  });

  const avg = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  return Math.max(0.05, Math.min(1, avg));
};

export const matchesAdvancedFilters = (traitProfile, filters = {}) => {
  if (filters.vibe && traitProfile.vibe !== filters.vibe) return false;
  if (filters.size && traitProfile.size !== filters.size) return false;

  const liveMusic = yesNoToBool(filters.liveMusic);
  if (liveMusic !== null && traitProfile.liveMusic !== liveMusic) return false;

  const celebrityChef = yesNoToBool(filters.celebrityChef);
  if (celebrityChef !== null && traitProfile.celebrityChef !== celebrityChef) return false;

  const outdoorSeating = yesNoToBool(filters.outdoorSeating);
  if (outdoorSeating !== null && traitProfile.outdoorSeating !== outdoorSeating) return false;

  const groupDining = yesNoToBool(filters.groupDining);
  if (groupDining !== null && traitProfile.groupDining !== groupDining) return false;

  const tastingMenu = yesNoToBool(filters.tastingMenu);
  if (tastingMenu !== null && traitProfile.tastingMenu !== tastingMenu) return false;

  return true;
};
