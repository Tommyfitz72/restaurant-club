import { getRecommendations } from '../services/recommendationService.js';

export const listRecommendations = async (req, res, next) => {
  try {
    const recommendations = await getRecommendations({
      sessionId: req.query.sessionId,
      date: req.query.date,
      partySize: req.query.partySize,
      timeFrom: req.query.timeFrom,
      timeTo: req.query.timeTo,
      neighborhood: req.query.neighborhood
    });

    if (!recommendations.length) {
      return res.status(404).json({
        message:
          'No reservations match your preferences in the next two nights. Try adjusting filters or tap refresh for new openings.'
      });
    }

    return res.json({
      disclaimer:
        'Reservation availability is pulled from partner sources and may change quickly. Booking is finalized on the source platform.',
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
      partySize: req.query.partySize,
      timeFrom: req.query.timeFrom,
      timeTo: req.query.timeTo,
      neighborhood: req.query.neighborhood,
      restaurantQuery: q
    });

    return res.json(recommendations);
  } catch (error) {
    next(error);
  }
};
