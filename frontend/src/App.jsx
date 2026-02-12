import { useEffect, useMemo, useState } from 'react';
import { api } from './api/client.js';
import PreferencesForm from './components/PreferencesForm.jsx';
import RestaurantRater from './components/RestaurantRater.jsx';
import RecommendationsView from './components/RecommendationsView.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { getSessionId } from './utils/session.js';

const initialProfile = {
  cuisinePreferences: [],
  preferredTimes: [],
  defaultPartySize: 2,
  priceMin: 1,
  priceMax: 4
};

export default function App() {
  const sessionId = useMemo(() => getSessionId(), []);
  const [step, setStep] = useLocalStorage('restaurantClubStep', 'preferences');
  const [profile, setProfile] = useLocalStorage('restaurantClubProfile', initialProfile);
  const [ratings, setRatings] = useLocalStorage('restaurantClubRatings', {});

  const [restaurants, setRestaurants] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    date: '',
    timeFrom: '',
    timeTo: '',
    partySize: profile.defaultPartySize || 2,
    neighborhood: ''
  });

  const [refreshStatus, setRefreshStatus] = useState('idle');

  useEffect(() => {
    const load = async () => {
      try {
        const [popular, hoods, recentOpenings] = await Promise.all([
          api.getPopularRestaurants(),
          api.getNeighborhoods(),
          api.getRecentOpenings()
        ]);
        setRestaurants(popular);
        setNeighborhoods(hoods);
        setOpenings(recentOpenings);
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    load();
  }, []);

  const loadRecommendations = async (nextFilters = filters) => {
    try {
      setError('');
      const [result, recentOpenings] = await Promise.all([
        api.getRecommendations({
          sessionId,
          ...nextFilters
        }),
        api.getRecentOpenings()
      ]);
      setRecommendations(result.recommendations || []);
      setOpenings(recentOpenings || []);
    } catch (fetchError) {
      setRecommendations([]);
      setError(fetchError.message);
    }
  };

  const submitPreferences = async () => {
    try {
      await api.saveProfile(sessionId, profile);
      setStep('ratings');
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const submitRatings = async () => {
    try {
      const payload = Object.entries(ratings)
        .filter(([, rating]) => Number(rating) > 0)
        .map(([restaurantId, rating]) => ({ restaurantId, rating: Number(rating) }));

      await api.saveRatings(sessionId, payload);
      setStep('results');
      await loadRecommendations();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshStatus('loading');
      await api.refreshReservations();
      await loadRecommendations();
      setRefreshStatus('done');
    } catch (refreshError) {
      setError(refreshError.message);
      setRefreshStatus('idle');
    }
  };

  useEffect(() => {
    if (step === 'results') {
      loadRecommendations(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, step]);

  if (step === 'preferences') {
    return <PreferencesForm value={profile} onChange={setProfile} onSubmit={submitPreferences} />;
  }

  if (step === 'ratings') {
    return (
      <RestaurantRater
        restaurants={restaurants}
        ratings={ratings}
        onRate={(restaurantId, rating) => setRatings((prev) => ({ ...prev, [restaurantId]: rating }))}
        onSkip={(restaurantId) => setRatings((prev) => ({ ...prev, [restaurantId]: 0 }))}
        onSubmit={submitRatings}
      />
    );
  }

  return (
    <RecommendationsView
      data={recommendations}
      openings={openings}
      filters={filters}
      neighborhoods={neighborhoods}
      onFiltersChange={setFilters}
      onRefresh={handleRefresh}
      refreshStatus={refreshStatus}
      error={error}
    />
  );
}
