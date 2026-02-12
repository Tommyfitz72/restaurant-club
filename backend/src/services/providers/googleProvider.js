import { BaseProvider } from './baseProvider.js';

export class GoogleProvider extends BaseProvider {
  constructor({ baseUrl, apiKey }) {
    super({ name: 'GOOGLE', baseUrl, apiKey });
    this.apiKey = apiKey;
  }

  async fetchReservations(restaurants) {
    const slots = [];

    for (const restaurant of restaurants) {
      try {
        // Placeholder for integrations with Google booking partners where available.
        // Google Places API does not directly expose universal reservation inventory.
        // We still pull place details-compatible identifiers for future enrichment.
        await this.client.get('/textsearch/json', {
          params: {
            query: `${restaurant.name} ${restaurant.city}`,
            key: this.apiKey
          }
        });
      } catch (error) {
        console.warn(`[scanner] Google lookup failed for ${restaurant.name}:`, error.message);
      }
    }

    return slots;
  }
}
