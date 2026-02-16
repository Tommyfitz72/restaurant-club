import { getRecommendations } from '../services/recommendationService.js';

export const listRecommendations = async (req, res, next) => {
  try {
    const recommendations = await getRecommendations({
      sessionId: req.query.sessionId,
      neighborhood: req.query.neighborhood
    });

    if (!recommendations.length) {
      return res.status(404).json({
        message: 'No restaurant recommendations match your current preferences. Try adding cuisines or changing neighborhood.'
      });
    }

    return res.json({
      disclaimer:
        'Recommendations are generated from your preferences, ratings, and multi-source Boston restaurant intelligence.',
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

    const recommendations = await getRecommendations({
      sessionId: req.query.sessionId,
      neighborhood: req.query.neighborhood,
      restaurantQuery: q
    });

    return res.json(recommendations);
  } catch (error) {
    next(error);
  }
};
