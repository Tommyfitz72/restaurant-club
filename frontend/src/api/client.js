const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const parseJson = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const api = {
  getPopularRestaurants: async () => parseJson(await fetch(`${API_BASE}/restaurants/popular`)),
  getNeighborhoods: async () => parseJson(await fetch(`${API_BASE}/restaurants/neighborhoods`)),
  searchRestaurants: async (q) => parseJson(await fetch(`${API_BASE}/restaurants/search?q=${encodeURIComponent(q)}`)),
  saveProfile: async (sessionId, payload) =>
    parseJson(
      await fetch(`${API_BASE}/profiles/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    ),
  saveRatings: async (sessionId, ratings) =>
    parseJson(
      await fetch(`${API_BASE}/profiles/${sessionId}/ratings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings })
      })
    ),
  getRecommendations: async (params) => {
    const qs = new URLSearchParams(params);
    return parseJson(await fetch(`${API_BASE}/recommendations?${qs.toString()}`));
  },
  searchRecommendations: async (params) => {
    const qs = new URLSearchParams(params);
    return parseJson(await fetch(`${API_BASE}/recommendations/search?${qs.toString()}`));
  },
  getRecentOpenings: async () => parseJson(await fetch(`${API_BASE}/reservations/openings`)),
  refreshReservations: async () =>
    parseJson(
      await fetch(`${API_BASE}/reservations/refresh`, {
        method: 'POST'
      })
    )
};
