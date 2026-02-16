import { getRecommendations } from '../services/recommendationService.js';

const parseKeywords = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildFilterPayload = (req) => ({
  sessionId: req.query.sessionId,
  neighborhood: req.query.neighborhood,
  restaurantQuery: req.query.q,
  selectedKeywords: parseKeywords(req.query.keywords),
  vibe: req.query.vibe,
  size: req.query.size,
  liveMusic: req.query.liveMusic,
  celebrityChef: req.query.celebrityChef,
  outdoorSeating: req.query.outdoorSeating,
  groupDining: req.query.groupDining,
  tastingMenu: req.query.tastingMenu
});

export const listRecommendations = async (req, res, next) => {
  try {
    const recommendations = await getRecommendations(buildFilterPayload(req));

    if (!recommendations.length) {
      return res.status(404).json({
        message:
          'No restaurant recommendations match your current preferences and selected filters. Try removing a few filters.'
      });
    }

    return res.json({
      disclaimer:
        'Recommendations are generated from your preferences, ratings, and source-informed Boston restaurant intelligence.',
      recommendations
    });
  } catch (error) {
    next(error);
  }
};

export const searchRecommendations = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    const recommendations = await getRecommendations(buildFilterPayload(req));

    return res.json(recommendations);
  } catch (error) {
    next(error);
  }
};
