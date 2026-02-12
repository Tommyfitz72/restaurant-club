import axios from 'axios';

export class BaseProvider {
  constructor({ name, baseUrl, apiKey }) {
    this.name = name;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
    });
  }

  // Implement in provider subclasses.
  async fetchReservations() {
    throw new Error('fetchReservations() not implemented');
  }
}
