import { prisma } from './db.js';
import { env } from '../config/env.js';
import { SUPPORTED_CITIES } from '../config/constants.js';
import { getReviewSignalsForRestaurants } from './reviewSignalsService.js';
import { getRestaurantIntelligence } from './restaurantIntelligenceService.js';

const SOURCE_CATALOG = [
  {
    sourceName: 'Eater Boston',
    sourceUrl: 'https://boston.eater.com/',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'The Infatuation Boston',
    sourceUrl: 'https://www.theinfatuation.com/boston',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'Boston Magazine',
    sourceUrl: 'https://www.bostonmagazine.com/restaurants/best-restaurants-in-boston/',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'The Food Lens',
    sourceUrl: 'https://www.thefoodlens.com/',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'BU Food Lens',
    sourceUrl: 'https://www.bu.edu/articles/2017/food-lens/',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'Hidden Boston',
    sourceUrl: 'https://www.hiddenboston.com/BostonRestaurantBlog.html',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'Anna Darrow Substack',
    sourceUrl: 'https://annadarrow.substack.com/p/1-another-boston-restaurant-guide',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'One for the Table',
    sourceUrl: 'https://oneforthetable.com/restaurant-reviews/boston/',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'Edible Boston',
    sourceUrl: 'https://www.edibleboston.com/blog/2017/12/1/hidden-restaurants-v2-shhhh-ssx9l',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'TripAdvisor Boston',
    sourceUrl: 'https://www.tripadvisor.com/Restaurants-g60745-Boston_Massachusetts.html',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated review scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'OpenTable Boston',
    sourceUrl: 'https://www.opentable.com/region/new-england/boston-restaurants',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated listing scraping in safe mode. Metadata references only.'
  },
  {
    sourceName: 'Condé Nast Traveler',
    sourceUrl: 'https://www.cntraveler.com/gallery/best-restaurants-in-boston',
    ingestionPolicy: 'metadata_only',
    robotsTosNotes: 'No automated article scraping in safe mode. Metadata references only.'
  }
];

const TAG_CONFIDENCE = {
  VIBE: 0.74,
  STYLE: 0.72,
  ASPECT: 0.68,
  QUALITY: 0.66
};

const toDbTag = ({ restaurantId, ingestionRunId, sourceName, sourceUrl, tagType, tagValue, evidence }) => ({
  restaurantId,
  ingestionRunId,
  sourceName,
  sourceUrl,
  tagType,
  tagValue,
  confidence: TAG_CONFIDENCE[tagType] || 0.6,
  evidence
});

const buildTagsForRestaurant = (restaurant, intelligence, source) => {
  const tags = [];

  for (const vibe of intelligence.vibes || []) {
    tags.push(
      toDbTag({
        restaurantId: restaurant.id,
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        tagType: 'VIBE',
        tagValue: String(vibe).toLowerCase(),
        evidence: `${source.robotsTosNotes} Generated from cuisine/style taxonomy and curated rules.`
      })
    );
  }

  for (const style of intelligence.style || []) {
    tags.push(
      toDbTag({
        restaurantId: restaurant.id,
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        tagType: 'STYLE',
        tagValue: String(style).toLowerCase(),
        evidence: `${source.robotsTosNotes} Generated from cuisine/style taxonomy and curated rules.`
      })
    );
  }

  for (const aspect of intelligence.aspects || []) {
    tags.push(
      toDbTag({
        restaurantId: restaurant.id,
        sourceName: source.sourceName,
        sourceUrl: source.sourceUrl,
        tagType: 'ASPECT',
        tagValue: String(aspect).toLowerCase(),
        evidence: `${source.robotsTosNotes} Generated from cuisine/style taxonomy and curated rules.`
      })
    );
  }

  tags.push(
    toDbTag({
      restaurantId: restaurant.id,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      tagType: 'QUALITY',
      tagValue: String(intelligence.qualitySummary || 'well-reviewed').toLowerCase(),
      evidence: `${source.robotsTosNotes} Generated from aggregate quality signals.`
    })
  );

  return tags;
};

export const getIngestionSourceCatalog = () => SOURCE_CATALOG;

export const runIntelligenceIngestion = async ({ mode = env.intelligenceIngestionMode } = {}) => {
  const run = await prisma.sourceIngestionRun.create({
    data: {
      mode,
      status: 'RUNNING',
      sourceCount: SOURCE_CATALOG.length,
      notes: 'Safe ingestion mode stores structured tags without direct page scraping.'
    }
  });

  try {
    const eligibleSources = SOURCE_CATALOG.filter((source) => {
      if (mode === 'safe') return source.ingestionPolicy === 'metadata_only';
      return true;
    });

    const restaurants = await prisma.restaurant.findMany({
      where: { city: { in: SUPPORTED_CITIES } },
      take: 2000
    });

    const reviewSignalsByRestaurant = await getReviewSignalsForRestaurants(restaurants);

    let upserted = 0;
    for (const restaurant of restaurants) {
      const intelligence = getRestaurantIntelligence(restaurant, reviewSignalsByRestaurant.get(restaurant.id));

      const referenceNames = new Set((intelligence.sourceReferences || []).map((source) => source.name));
      const chosenSources = eligibleSources.filter((source) => referenceNames.has(source.sourceName)).slice(0, 3);

      for (const source of chosenSources) {
        const tags = buildTagsForRestaurant(restaurant, intelligence, source).filter(
          (tag) => tag.confidence >= env.intelligenceMinTagConfidence
        );

        for (const tag of tags) {
          await prisma.restaurantTagSignal.upsert({
            where: {
              restaurantId_sourceName_tagType_tagValue: {
                restaurantId: tag.restaurantId,
                sourceName: tag.sourceName,
                tagType: tag.tagType,
                tagValue: tag.tagValue
              }
            },
            create: {
              ...tag,
              ingestionRunId: run.id,
              observedAt: new Date()
            },
            update: {
              ingestionRunId: run.id,
              confidence: tag.confidence,
              evidence: tag.evidence,
              sourceUrl: tag.sourceUrl,
              observedAt: new Date()
            }
          });
          upserted += 1;
        }
      }
    }

    await prisma.sourceIngestionRun.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        restaurantCount: restaurants.length,
        tagCount: upserted,
        completedAt: new Date()
      }
    });

    return {
      runId: run.id,
      status: 'COMPLETED',
      mode,
      sourceCount: eligibleSources.length,
      restaurantCount: restaurants.length,
      tagCount: upserted
    };
  } catch (error) {
    await prisma.sourceIngestionRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        notes: `Failed: ${error.message}`
      }
    });

    throw error;
  }
};

export const getLatestIngestionRun = async () =>
  prisma.sourceIngestionRun.findFirst({
    orderBy: { startedAt: 'desc' }
  });
