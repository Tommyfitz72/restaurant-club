import axios from 'axios';

const SOURCE_ADAPTERS = [
  {
    sourceName: 'Eater Boston',
    sourceUrl: 'https://boston.eater.com/',
    termsUrl: 'https://www.voxmedia.com/terms-of-use',
    ingestionPolicy: 'extract_if_allowed'
  },
  {
    sourceName: 'The Infatuation Boston',
    sourceUrl: 'https://www.theinfatuation.com/boston',
    termsUrl: 'https://www.theinfatuation.com/terms',
    ingestionPolicy: 'extract_if_allowed'
  },
  {
    sourceName: 'Boston Magazine',
    sourceUrl: 'https://www.bostonmagazine.com/restaurants/best-restaurants-in-boston/',
    termsUrl: 'https://www.bostonmagazine.com/terms-conditions/',
    ingestionPolicy: 'extract_if_allowed'
  },
  {
    sourceName: 'The Food Lens',
    sourceUrl: 'https://www.thefoodlens.com/',
    termsUrl: 'https://www.thefoodlens.com/privacy-policy',
    ingestionPolicy: 'extract_if_allowed'
  },
  {
    sourceName: 'BU Food Lens',
    sourceUrl: 'https://www.bu.edu/articles/2017/food-lens/',
    termsUrl: 'https://www.bu.edu/tech/about/policies/website-terms-of-use/',
    ingestionPolicy: 'extract_if_allowed'
  },
  {
    sourceName: 'Hidden Boston',
    sourceUrl: 'https://www.hiddenboston.com/BostonRestaurantBlog.html',
    termsUrl: 'https://www.hiddenboston.com/',
    ingestionPolicy: 'extract_if_allowed'
  },
  {
    sourceName: 'Anna Darrow Substack',
    sourceUrl: 'https://annadarrow.substack.com/p/1-another-boston-restaurant-guide',
    termsUrl: 'https://substack.com/tos',
    ingestionPolicy: 'extract_if_allowed'
  },
  {
    sourceName: 'One for the Table',
    sourceUrl: 'https://oneforthetable.com/restaurant-reviews/boston/',
    termsUrl: 'https://oneforthetable.com/',
    ingestionPolicy: 'extract_if_allowed'
  },
  {
    sourceName: 'Edible Boston',
    sourceUrl: 'https://www.edibleboston.com/blog/2017/12/1/hidden-restaurants-v2-shhhh-ssx9l',
    termsUrl: 'https://www.edibleboston.com/',
    ingestionPolicy: 'extract_if_allowed'
  },
  {
    sourceName: 'TripAdvisor Boston',
    sourceUrl: 'https://www.tripadvisor.com/Restaurants-g60745-Boston_Massachusetts.html',
    termsUrl: 'https://tripadvisor.mediaroom.com/us-terms-of-use',
    ingestionPolicy: 'metadata_only'
  },
  {
    sourceName: 'OpenTable Boston',
    sourceUrl: 'https://www.opentable.com/region/new-england/boston-restaurants',
    termsUrl: 'https://www.opentable.com/legal/terms-and-conditions',
    ingestionPolicy: 'metadata_only'
  },
  {
    sourceName: 'Condé Nast Traveler',
    sourceUrl: 'https://www.cntraveler.com/gallery/best-restaurants-in-boston',
    termsUrl: 'https://www.condenast.com/terms-of-use',
    ingestionPolicy: 'extract_if_allowed'
  }
];

const SOURCE_HANDLER_OVERRIDES = {
  'Eater Boston': {
    buildCandidateUrls: (adapter, restaurant) => [
      adapter.sourceUrl,
      `${adapter.sourceUrl.replace(/\/$/, '')}/search?q=${encodeURIComponent(restaurant.name)}`
    ]
  },
  'The Infatuation Boston': {
    buildCandidateUrls: (adapter, restaurant) => [
      adapter.sourceUrl,
      `${adapter.sourceUrl.replace(/\/boston$/, '')}/search?q=${encodeURIComponent(restaurant.name)}`
    ]
  },
  'Boston Magazine': {
    buildCandidateUrls: (adapter, restaurant) => [
      adapter.sourceUrl,
      `https://www.bostonmagazine.com/?s=${encodeURIComponent(restaurant.name)}`
    ]
  },
  'The Food Lens': {
    buildCandidateUrls: (adapter, restaurant) => [
      adapter.sourceUrl,
      `${adapter.sourceUrl.replace(/\/$/, '')}/?s=${encodeURIComponent(restaurant.name)}`
    ]
  },
  'Hidden Boston': {
    buildCandidateUrls: (adapter) => [adapter.sourceUrl]
  },
  'Anna Darrow Substack': {
    buildCandidateUrls: (adapter) => [adapter.sourceUrl]
  },
  'One for the Table': {
    buildCandidateUrls: (adapter) => [adapter.sourceUrl]
  },
  'Edible Boston': {
    buildCandidateUrls: (adapter) => [adapter.sourceUrl]
  },
  'BU Food Lens': {
    buildCandidateUrls: (adapter) => [adapter.sourceUrl]
  },
  'Condé Nast Traveler': {
    buildCandidateUrls: (adapter) => [adapter.sourceUrl]
  }
};

const domainOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const pathOf = (url) => {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return '/';
  }
};

const parseRobots = (text = '', userAgent = '*') => {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim());

  const sections = [];
  let current = { agents: [], disallow: [] };

  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const [rawKey, ...rest] = line.split(':');
    const key = String(rawKey || '').trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      if (current.agents.length || current.disallow.length) {
        sections.push(current);
      }
      current = { agents: [value.toLowerCase()], disallow: [] };
      continue;
    }

    if (key === 'disallow') {
      current.disallow.push(value);
    }
  }

  if (current.agents.length || current.disallow.length) {
    sections.push(current);
  }

  const normalizedAgent = userAgent.toLowerCase();
  const agentSections = sections.filter((section) =>
    section.agents.some((agent) => agent === '*' || normalizedAgent.includes(agent))
  );

  const disallow = agentSections.flatMap((section) => section.disallow).filter(Boolean);
  return disallow;
};

const isPathAllowed = (path, disallow = []) => {
  const normalizedPath = String(path || '/');
  for (const rule of disallow) {
    if (!rule || rule === '') continue;
    if (rule === '/') return false;
    if (normalizedPath.startsWith(rule)) return false;
  }
  return true;
};

const ROBOTS_CACHE = new Map();
const PAGE_CACHE = new Map();

const fetchRobots = async (origin, timeoutMs = 5000) => {
  if (ROBOTS_CACHE.has(origin)) return ROBOTS_CACHE.get(origin);

  const robotsUrl = `${origin.replace(/\/$/, '')}/robots.txt`;
  try {
    const response = await axios.get(robotsUrl, { timeout: timeoutMs, validateStatus: () => true });
    if (response.status >= 200 && response.status < 300) {
      ROBOTS_CACHE.set(origin, { ok: true, body: String(response.data || ''), robotsUrl });
      return ROBOTS_CACHE.get(origin);
    }
  } catch {
    // ignored
  }

  const fallback = { ok: false, body: '', robotsUrl };
  ROBOTS_CACHE.set(origin, fallback);
  return fallback;
};

const stripHtmlToText = (html = '') =>
  String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();

const fetchPageText = async (url, timeoutMs = 6000) => {
  if (PAGE_CACHE.has(url)) return PAGE_CACHE.get(url);

  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'DishcoverBot/1.0 (+contact: admin@dishcover.local)'
      },
      validateStatus: () => true
    });

    if (response.status >= 200 && response.status < 300) {
      const text = stripHtmlToText(response.data || '');
      PAGE_CACHE.set(url, text);
      return text;
    }
  } catch {
    // ignored
  }

  PAGE_CACHE.set(url, '');
  return '';
};

const snippetAround = (text, index, radius = 180) => {
  if (index < 0) return '';
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end).trim();
};

const extractQuoteCandidates = ({ text, restaurantName, tagCandidates }) => {
  const lower = text.toLowerCase();
  const lowerRestaurant = String(restaurantName || '').toLowerCase();

  const matches = [];
  for (const tag of tagCandidates) {
    const lowerTag = String(tag || '').toLowerCase();
    if (!lowerTag) continue;

    const restaurantPos = lower.indexOf(lowerRestaurant);
    const tagPos = lower.indexOf(lowerTag);

    if (restaurantPos === -1 && tagPos === -1) continue;

    const idx = restaurantPos !== -1 ? restaurantPos : tagPos;
    const quote = snippetAround(text, idx);
    if (!quote) continue;

    const confidenceBoost = restaurantPos !== -1 && tagPos !== -1 ? 0.15 : 0.05;
    matches.push({
      tagValue: lowerTag,
      quote,
      confidenceBoost
    });
  }

  return matches;
};

export const assessAdapterCompliance = async (
  adapter,
  { userAgent = 'DishcoverBot/1.0', strict = true, allowedExtractDomains = [], timeoutMs = 5000 } = {}
) => {
  const sourceDomain = domainOf(adapter.sourceUrl);
  const sourcePath = pathOf(adapter.sourceUrl);
  const allowedDomainSet = new Set((allowedExtractDomains || []).map((domain) => String(domain).toLowerCase()));
  const extractionDomainAllowed = allowedDomainSet.has(sourceDomain);

  if (adapter.ingestionPolicy === 'metadata_only') {
    return {
      sourceName: adapter.sourceName,
      sourceUrl: adapter.sourceUrl,
      sourceDomain,
      sourcePath,
      termsUrl: adapter.termsUrl,
      ingestionPolicy: adapter.ingestionPolicy,
      robotsAllowed: true,
      termsAllowed: true,
      allowed: true,
      canExtract: false,
      reason: 'metadata_only policy: no direct article content scraping'
    };
  }

  try {
    const origin = new URL(adapter.sourceUrl).origin;
    const robots = await fetchRobots(origin, timeoutMs);

    if (!robots.ok) {
      return {
        sourceName: adapter.sourceName,
        sourceUrl: adapter.sourceUrl,
        sourceDomain,
        sourcePath,
        termsUrl: adapter.termsUrl,
        ingestionPolicy: adapter.ingestionPolicy,
        robotsAllowed: !strict,
        termsAllowed: false,
        allowed: !strict,
        canExtract: false,
        reason: strict ? 'robots.txt unavailable' : 'robots.txt unavailable (non-strict mode)'
      };
    }

    const disallow = parseRobots(robots.body, userAgent);
    const robotsAllowed = isPathAllowed(sourcePath, disallow);
    const canExtract = robotsAllowed && extractionDomainAllowed;

    return {
      sourceName: adapter.sourceName,
      sourceUrl: adapter.sourceUrl,
      sourceDomain,
      sourcePath,
      termsUrl: adapter.termsUrl,
      ingestionPolicy: adapter.ingestionPolicy,
      robotsAllowed,
      termsAllowed: robotsAllowed,
      allowed: robotsAllowed,
      canExtract,
      reason: canExtract
        ? 'robots policy allows path and domain is allowlisted for extraction'
        : robotsAllowed
          ? 'robots allows path but domain is not allowlisted for extraction'
          : 'robots policy disallows path'
    };
  } catch {
    return {
      sourceName: adapter.sourceName,
      sourceUrl: adapter.sourceUrl,
      sourceDomain,
      sourcePath,
      termsUrl: adapter.termsUrl,
      ingestionPolicy: adapter.ingestionPolicy,
      robotsAllowed: !strict,
      termsAllowed: false,
      allowed: !strict,
      canExtract: false,
      reason: strict ? 'robots compliance check failed' : 'robots check failed (non-strict mode)'
    };
  }
};

const buildCandidateUrlsForAdapter = (adapter, restaurant) => {
  const handler = SOURCE_HANDLER_OVERRIDES[adapter.sourceName];
  if (handler?.buildCandidateUrls) {
    return handler.buildCandidateUrls(adapter, restaurant);
  }
  return [adapter.sourceUrl];
};

export const extractQuoteEvidenceForRestaurant = async ({
  adapterAssessment,
  restaurant,
  tagCandidates,
  timeoutMs = 6000,
  maxPages = 2,
  maxQuotes = 6
}) => {
  if (!adapterAssessment?.canExtract) return [];

  const adapter = SOURCE_ADAPTERS.find((item) => item.sourceName === adapterAssessment.sourceName);
  if (!adapter) return [];

  const urls = buildCandidateUrlsForAdapter(adapter, restaurant).slice(0, maxPages);
  const quotes = [];

  for (const url of urls) {
    const text = await fetchPageText(url, timeoutMs);
    if (!text) continue;

    const extracted = extractQuoteCandidates({
      text,
      restaurantName: restaurant.name,
      tagCandidates
    });

    for (const item of extracted) {
      quotes.push({
        sourceUrl: url,
        tagValue: item.tagValue,
        quote: item.quote,
        confidenceBoost: item.confidenceBoost
      });
      if (quotes.length >= maxQuotes) return quotes;
    }
  }

  return quotes;
};

export const getSourceAdapters = () => SOURCE_ADAPTERS;
