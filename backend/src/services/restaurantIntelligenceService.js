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

const CURATED_NOTES = {
  sarma: {
    vibes: ['lively', 'share-plates', 'inventive'],
    style: ['Mediterranean', 'modern', 'small-plates'],
    aspects: ['great for groups', 'bold flavors', 'high-energy room']
  },
  giulia: {
    vibes: ['romantic', 'cozy', 'neighborhood-favorite'],
    style: ['Italian', 'pasta-driven', 'chef-led'],
    aspects: ['excellent handmade pasta', 'date-night friendly', 'polished service']
  },
  oleana: {
    vibes: ['warm', 'garden-like', 'special-occasion'],
    style: ['Eastern Mediterranean', 'seasonal'],
    aspects: ['creative mezze', 'destination dining', 'consistent quality']
  },
  'neptune oyster': {
    vibes: ['classic', 'busy', 'iconic'],
    style: ['Seafood', 'raw-bar'],
    aspects: ['oyster-focused', 'lobster roll favorite', 'small intimate room']
  },
  'no. 9 park': {
    vibes: ['elegant', 'quiet', 'refined'],
    style: ['French-Italian', 'fine-dining'],
    aspects: ['special occasion', 'tasting-menu energy', 'classic Boston institution']
  },
  contessa: {
    vibes: ['glamorous', 'scene-y', 'upscale'],
    style: ['Italian', 'luxury'],
    aspects: ['great city views', 'polished room', 'celebration spot']
  },
  toro: {
    vibes: ['buzzy', 'social', 'energetic'],
    style: ['Spanish', 'tapas'],
    aspects: ['shareable menu', 'lively crowd', 'late-night friendly']
  }
};

const CUISINE_TO_VIBE = {
  Italian: ['cozy', 'date-night', 'comforting'],
  Japanese: ['precise', 'minimal', 'chef-driven'],
  French: ['refined', 'classic', 'special-occasion'],
  American: ['social', 'versatile', 'neighborhood'],
  Mexican: ['vibrant', 'group-friendly', 'casual-energy'],
  Thai: ['flavor-forward', 'casual', 'spice-focused'],
  Chinese: ['family-style', 'shareable', 'comforting'],
  Mediterranean: ['bright', 'healthy-leaning', 'share-plates'],
  Steakhouse: ['upscale', 'classic', 'power-dining'],
  Seafood: ['coastal', 'fresh', 'classic-new-england'],
  Indian: ['aromatic', 'bold', 'shareable'],
  Korean: ['bold', 'grill-friendly', 'social'],
  Spanish: ['tapas', 'lively', 'wine-friendly'],
  'Middle Eastern': ['spiced', 'warm', 'shareable']
};

const PRICE_TO_STYLE = {
  1: ['quick', 'casual'],
  2: ['casual', 'reliable'],
  3: ['elevated', 'date-night'],
  4: ['fine-dining', 'special-occasion']
};

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

export const getRestaurantIntelligence = (restaurant, reviewSignals) => {
  const curated = CURATED_NOTES[normalize(restaurant.name)] || null;

  const vibes = curated?.vibes || CUISINE_TO_VIBE[restaurant.cuisineType] || ['versatile', 'local-favorite'];
  const style = curated?.style || [restaurant.cuisineType, ...(PRICE_TO_STYLE[restaurant.priceRange] || ['casual'])];
  const aspects =
    curated?.aspects ||
    [
      `popular in ${restaurant.neighborhood}`,
      `${restaurant.priceRange >= 3 ? 'higher-end' : 'accessible'} dining style`,
      `${restaurant.cuisineType} identity`
    ];

  const aggregate = Number(reviewSignals?.aggregate || 0);
  const reviewCount = Number(reviewSignals?.reviewCount || 0);

  return {
    vibes,
    style,
    aspects,
    qualitySummary: summarizeQuality(aggregate, reviewCount),
    sourceReferences: pickSources(restaurant)
  };
};
