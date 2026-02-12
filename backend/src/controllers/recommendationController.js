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
        message: 'No reservations match your preferences right now. Try adjusting filters or refresh later.'
      });
    }

    return res.json({
      disclaimer: 'Reservation availability is subject to change on provider platforms.',
      recommendations
    });
  } catch (error) {
    next(error);
  }
};
