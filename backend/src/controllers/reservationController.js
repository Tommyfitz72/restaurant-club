import rateLimit from 'express-rate-limit';
import { prisma } from '../services/db.js';
import { runScanCycle, getRecentOpenings } from '../services/scannerService.js';
import { RESERVATION_LOOKAHEAD_HOURS } from '../config/constants.js';

export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many refresh requests. Please wait a minute.'
});

export const refreshReservations = async (req, res, next) => {
  try {
    const result = await runScanCycle();
    res.json({
      message: 'Reservation scan completed',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableReservations = async (req, res, next) => {
  try {
    const where = {
      available: true,
      startsAt: {
        gte: new Date(),
        lte: new Date(Date.now() + RESERVATION_LOOKAHEAD_HOURS * 60 * 60 * 1000)
      }
    };

    const slots = await prisma.reservationSlot.findMany({
      where,
      include: { restaurant: true },
      orderBy: { startsAt: 'asc' },
      take: 400
    });

    res.json(slots);
  } catch (error) {
    next(error);
  }
};

export const listRecentOpenings = async (req, res, next) => {
  try {
    const openings = await getRecentOpenings();
    res.json(openings);
  } catch (error) {
    next(error);
  }
};
