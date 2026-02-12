import { RESERVATION_LOOKAHEAD_HOURS } from '../../config/constants.js';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const slotsForRestaurant = (restaurant, providerLabel) => {
  const slots = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() + RESERVATION_LOOKAHEAD_HOURS * 60 * 60 * 1000);

  for (let hourOffset = 2; hourOffset <= RESERVATION_LOOKAHEAD_HOURS; hourOffset += 2) {
    const slotDate = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
    const eveningHour = [17, 18, 19, 20, 21][randomInt(0, 4)];
    slotDate.setHours(eveningHour, randomInt(0, 1) ? 0 : 30, 0, 0);

    if (slotDate > cutoff || Math.random() > 0.25) {
      continue;
    }

    const partySize = [2, 4, 6][randomInt(0, 2)];
    const links = restaurant.bookingLinks || {};

    slots.push({
      provider: providerLabel,
      externalSlotId: `${providerLabel}-${restaurant.id}-${slotDate.toISOString()}-${partySize}`,
      startsAt: slotDate,
      partySize,
      bookingUrl:
        links[providerLabel.toLowerCase()] || links.direct || links.opentable || links.resy || 'https://www.google.com/maps',
      restaurantId: restaurant.id
    });
  }

  return slots;
};

export const mockProvider = {
  async fetchReservations(restaurants, providerLabel) {
    return restaurants.flatMap((restaurant) => slotsForRestaurant(restaurant, providerLabel));
  }
};
