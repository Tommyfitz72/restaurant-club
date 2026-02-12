import { BaseProvider } from './baseProvider.js';

export class OpenTableProvider extends BaseProvider {
  constructor({ baseUrl, apiKey }) {
    super({ name: 'OPENTABLE', baseUrl, apiKey });
  }

  // This method is intentionally conservative and should be adapted to official APIs when available.
  async fetchReservations(restaurants) {
    const slots = [];

    for (const restaurant of restaurants) {
      try {
        const response = await this.client.get('/restaurants', {
          params: {
            city: restaurant.city,
            partySize: 2,
            dateTime: new Date().toISOString()
          }
        });

        const candidates = response.data?.slots || [];
        for (const candidate of candidates) {
          slots.push({
            provider: 'OPENTABLE',
            externalSlotId: String(candidate.id || `${restaurant.id}-${candidate.time}`),
            startsAt: new Date(candidate.time),
            partySize: Number(candidate.partySize || 2),
            bookingUrl: candidate.bookingUrl || restaurant.bookingLinks.opentable,
            restaurantId: restaurant.id
          });
        }
      } catch (error) {
        // Provider errors should not crash the whole scan cycle.
        console.warn(`[scanner] OpenTable fetch failed for ${restaurant.name}:`, error.message);
      }
    }

    return slots;
  }
}
