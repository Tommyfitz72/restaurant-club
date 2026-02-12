import { BaseProvider } from './baseProvider.js';

export class ResyProvider extends BaseProvider {
  constructor({ baseUrl, apiKey }) {
    super({ name: 'RESY', baseUrl, apiKey });
  }

  // This method is intentionally conservative and should be adapted to official APIs when available.
  async fetchReservations(restaurants) {
    const slots = [];

    for (const restaurant of restaurants) {
      try {
        const response = await this.client.get('/4/find', {
          params: {
            city: restaurant.city,
            party_size: 2,
            day: new Date().toISOString().slice(0, 10)
          }
        });

        const candidates = response.data?.results || [];
        for (const candidate of candidates) {
          slots.push({
            provider: 'RESY',
            externalSlotId: String(candidate.id || `${restaurant.id}-${candidate.date?.start}`),
            startsAt: new Date(candidate.date?.start),
            partySize: Number(candidate.party_size || 2),
            bookingUrl: candidate.booking_url || restaurant.bookingLinks.resy,
            restaurantId: restaurant.id
          });
        }
      } catch (error) {
        console.warn(`[scanner] Resy fetch failed for ${restaurant.name}:`, error.message);
      }
    }

    return slots;
  }
}
