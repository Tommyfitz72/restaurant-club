import { z } from 'zod';
import { prisma } from '../services/db.js';

const profileSchema = z.object({
  cuisinePreferences: z.array(z.string()).min(1),
  preferredTimes: z
    .array(
      z.object({
        startHour: z.number().min(0).max(23),
        endHour: z.number().min(0).max(23)
      })
    )
    .optional(),
  defaultPartySize: z.number().int().min(1).max(20).optional(),
  priceMin: z.number().int().min(1).max(4).optional(),
  priceMax: z.number().int().min(1).max(4).optional()
});

const ratingsSchema = z.object({
  ratings: z.array(
    z.object({
      restaurantId: z.string(),
      rating: z.number().min(1).max(5)
    })
  )
});

export const upsertProfile = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const payload = profileSchema.parse(req.body);

    const profile = await prisma.userProfile.upsert({
      where: { sessionId },
      create: { sessionId, ...payload },
      update: payload
    });

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { sessionId: req.params.sessionId },
      include: { ratings: true }
    });
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const saveRatings = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { ratings } = ratingsSchema.parse(req.body);

    const profile = await prisma.userProfile.findUnique({ where: { sessionId } });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await prisma.$transaction(
      ratings.map((entry) =>
        prisma.restaurantRating.upsert({
          where: {
            profileId_restaurantId: {
              profileId: profile.id,
              restaurantId: entry.restaurantId
            }
          },
          create: {
            profileId: profile.id,
            restaurantId: entry.restaurantId,
            rating: entry.rating
          },
          update: {
            rating: entry.rating
          }
        })
      )
    );

    const saved = await prisma.restaurantRating.findMany({ where: { profileId: profile.id } });
    return res.json(saved);
  } catch (error) {
    next(error);
  }
};
