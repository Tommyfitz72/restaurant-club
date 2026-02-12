const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const slotsForRestaurant = (restaurant, providerLabel) => {
  const slots = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < 3; dayOffset += 1) {
    const base = new Date(now);
    base.setDate(base.getDate() + dayOffset);

    [17, 18, 19, 20, 21].forEach((hour) => {
      if (Math.random() > 0.6) return;

      const slotDate = new Date(base);
      slotDate.setHours(hour, randomInt(0, 1) ? 0 : 30, 0, 0);
      const partySize = [2, 4, 6][randomInt(0, 2)];

      slots.push({
        provider: providerLabel,
        externalSlotId: `${providerLabel}-${restaurant.id}-${slotDate.toISOString()}-${partySize}`,
        startsAt: slotDate,
        partySize,
        bookingUrl: providerLabel === 'OPENTABLE' ? restaurant.bookingLinks.opentable : restaurant.bookingLinks.resy,
        restaurantId: restaurant.id
      });
    });
  }

  return slots;
};

export const mockProvider = {
  async fetchReservations(restaurants, providerLabel) {
    return restaurants.flatMap((restaurant) => slotsForRestaurant(restaurant, providerLabel));
  }
};
