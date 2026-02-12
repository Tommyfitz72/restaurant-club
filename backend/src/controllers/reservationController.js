import rateLimit from 'express-rate-limit';
import { prisma } from '../services/db.js';
import { runScanCycle } from '../services/scannerService.js';

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
      startsAt: { gte: new Date() }
    };

    const slots = await prisma.reservationSlot.findMany({
      where,
      include: { restaurant: true },
      orderBy: { startsAt: 'asc' },
      take: 300
    });

    res.json(slots);
  } catch (error) {
    next(error);
  }
};
