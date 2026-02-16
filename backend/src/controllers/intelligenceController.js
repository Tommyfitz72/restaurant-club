import {
  ADVANCED_FILTERS,
  KEYWORD_CATALOG
} from '../services/restaurantIntelligenceService.js';
import {
  getIngestionSourceCatalog,
  getLatestIngestionRun,
  runIntelligenceIngestion
} from '../services/intelligenceIngestionService.js';

export const runIntelligenceIngestionNow = async (req, res, next) => {
  try {
    const mode = String(req.body?.mode || '').trim() || undefined;
    const result = await runIntelligenceIngestion({ mode });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getLatestIntelligenceIngestion = async (req, res, next) => {
  try {
    const run = await getLatestIngestionRun();
    res.json(run || null);
  } catch (error) {
    next(error);
  }
};

export const listIntelligenceSources = async (req, res, next) => {
  try {
    res.json(getIngestionSourceCatalog());
  } catch (error) {
    next(error);
  }
};

export const getKeywordCatalog = async (req, res, next) => {
  try {
    res.json({
      keywords: KEYWORD_CATALOG,
      advancedFilters: ADVANCED_FILTERS
    });
  } catch (error) {
    next(error);
  }
};
