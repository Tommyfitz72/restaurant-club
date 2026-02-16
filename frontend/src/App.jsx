import { useEffect, useMemo, useState } from 'react';
import { api } from './api/client.js';
import PreferencesForm from './components/PreferencesForm.jsx';
import RestaurantRater from './components/RestaurantRater.jsx';
import RecommendationsView from './components/RecommendationsView.jsx';
import MyRatingsView from './components/MyRatingsView.jsx';
import SearchView from './components/SearchView.jsx';
import AboutView from './components/AboutView.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { getSessionId } from './utils/session.js';

const initialProfile = {
  cuisinePreferences: [],
  preferredTimes: [],
  defaultPartySize: 2,
  priceMin: 1,
  priceMax: 4
};

const menuValueFromStep = (step) => {
  if (step === 'myRatings') return 'my_ratings';
  if (step === 'search') return 'search';
  if (step === 'about') return 'about';
  if (step === 'preferences') return 'change_preferences';
  return 'recommendations';
};

export default function App() {
  const sessionId = useMemo(() => getSessionId(), []);

  const [step, setStep] = useLocalStorage('restaurantClubStep', 'results');
  const [profile, setProfile] = useLocalStorage('restaurantClubProfile', initialProfile);
  const [ratings, setRatings] = useLocalStorage('restaurantClubRatings', {});
  const [externalRatings, setExternalRatings] = useLocalStorage('restaurantClubExternalRatings', []);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage('restaurantClubOnboardingDone', false);

  const [skipRatingsOnNext, setSkipRatingsOnNext] = useState(false);

  const [restaurants, setRestaurants] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [ratingsSearchQuery, setRatingsSearchQuery] = useState('');
  const [ratingsSearchResults, setRatingsSearchResults] = useState([]);

  const [filters, setFilters] = useState({
    neighborhood: ''
  });

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      setStep('preferences');
    }
  }, [hasCompletedOnboarding, setStep]);

  useEffect(() => {
    const load = async () => {
      try {
        const [popular, hoods] = await Promise.all([api.getPopularRestaurants(), api.getNeighborhoods()]);
        setRestaurants(popular);
        setNeighborhoods(hoods);
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    load();
  }, []);

  const localRestaurantIds = useMemo(() => new Set(restaurants.map((item) => item.id)), [restaurants]);

  const persistLocalRatings = async (nextRatings) => {
    const payload = Object.entries(nextRatings)
      .filter(([restaurantId, rating]) => localRestaurantIds.has(restaurantId) && Number(rating) > 0)
      .map(([restaurantId, rating]) => ({ restaurantId, rating: Number(rating) }));

    if (!payload.length) return;
    await api.saveRatings(sessionId, payload);
  };

  const loadRecommendations = async (nextFilters = filters) => {
    try {
      setError('');
      const result = await api.getRecommendations({ sessionId, ...nextFilters });
      setRecommendations(result.recommendations || []);
    } catch (fetchError) {
      setRecommendations([]);
      setError(fetchError.message);
    }
  };

  const submitPreferences = async () => {
    try {
      await api.saveProfile(sessionId, profile);

      if (!hasCompletedOnboarding) {
        setSkipRatingsOnNext(false);
        setStep('ratings');
        return;
      }

      if (skipRatingsOnNext) {
        setStep('results');
        await loadRecommendations();
        return;
      }

      setStep('ratings');
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const submitRatings = async () => {
    try {
      await persistLocalRatings(ratings);
      setSkipRatingsOnNext(false);
      setHasCompletedOnboarding(true);
      setStep('results');
      await loadRecommendations();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const applyUpdatedPreferences = async () => {
    try {
      await api.saveProfile(sessionId, profile);
      await loadRecommendations();
    } catch (applyError) {
      setError(applyError.message);
    }
  };

  const addCuisinePreference = (cuisine) => {
    if (!cuisine) return;
    if (profile.cuisinePreferences.includes(cuisine)) return;
    setProfile({ ...profile, cuisinePreferences: [...profile.cuisinePreferences, cuisine] });
  };

  const handleMenuChange = (value) => {
    if (value === 'change_preferences') {
      setSkipRatingsOnNext(true);
      setStep('preferences');
      return;
    }
    if (value === 'my_ratings') {
      setStep('myRatings');
      return;
    }
    if (value === 'search') {
      setStep('search');
      return;
    }
    if (value === 'about') {
      setStep('about');
      return;
    }
    setStep('results');
  };

  const runRatingsSearch = async () => {
    try {
      const items = await api.searchRestaurants(ratingsSearchQuery);
      setRatingsSearchResults(
        items.map((item) => ({
          ...item,
          currentRating: Number(ratings[item.id] || 0)
        }))
      );
    } catch (searchError) {
      setError(searchError.message);
    }
  };

  const rateFromRatingsSearch = async (restaurant, ratingValue) => {
    if (localRestaurantIds.has(restaurant.id)) {
      const nextRatings = { ...ratings, [restaurant.id]: ratingValue };
      setRatings(nextRatings);
      await persistLocalRatings(nextRatings);
      return;
    }

    const id = restaurant.id || `external:${restaurant.name}`;
    const existing = externalRatings.find((item) => item.id === id);
    const next = existing
      ? externalRatings.map((item) => (item.id === id ? { ...item, rating: ratingValue } : item))
      : [
          {
            id,
            name: restaurant.name,
            source: restaurant.source || 'Google',
            rating: ratingValue
          },
          ...externalRatings
        ];
    setExternalRatings(next);
  };

  const rateCustomRestaurant = (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;

    const id = `external:${trimmed.toLowerCase().replace(/\s+/g, '-')}`;
    if (externalRatings.some((item) => item.id === id)) return;

    setExternalRatings([
      {
        id,
        name: trimmed,
        source: 'Google (manual)',
        rating: 0
      },
      ...externalRatings
    ]);
  };

  const runSearchPageSearch = async () => {
    try {
      const data = await api.searchRecommendations({
        sessionId,
        q: searchQuery,
        neighborhood: filters.neighborhood
      });
      setSearchResults(data);
    } catch (searchError) {
      setError(searchError.message);
      setSearchResults([]);
    }
  };

  const combinedRatings = [
    ...Object.entries(ratings)
      .filter(([, rating]) => Number(rating) > 0)
      .map(([restaurantId, rating]) => ({
        id: restaurantId,
        name: restaurants.find((item) => item.id === restaurantId)?.name || 'Rated restaurant',
        source: 'The Restaurant Club',
        rating: Number(rating)
      })),
    ...externalRatings
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  useEffect(() => {
    if (step === 'results') {
      loadRecommendations(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, step]);

  return (
    <>
      <header className="site-header">
        <h1>The Restaurant Club</h1>
      </header>

      {hasCompletedOnboarding ? (
        <div className="top-menu">
          <select value={menuValueFromStep(step)} onChange={(event) => handleMenuChange(event.target.value)}>
            <option value="recommendations">Recommendations</option>
            <option value="change_preferences">Change preferences</option>
            <option value="my_ratings">My ratings</option>
            <option value="search">Search</option>
            <option value="about">About us</option>
          </select>
        </div>
      ) : null}

      {step === 'preferences' ? <PreferencesForm value={profile} onChange={setProfile} onSubmit={submitPreferences} /> : null}

      {step === 'ratings' ? (
        <RestaurantRater
          restaurants={restaurants}
          ratings={ratings}
          onRate={(restaurantId, rating) => setRatings((prev) => ({ ...prev, [restaurantId]: rating }))}
          onSkip={(restaurantId) => setRatings((prev) => ({ ...prev, [restaurantId]: 0 }))}
          onSubmit={submitRatings}
        />
      ) : null}

      {step === 'results' ? (
        <RecommendationsView
          data={recommendations}
          filters={filters}
          neighborhoods={neighborhoods}
          profile={profile}
          onProfileChange={setProfile}
          onAddCuisine={addCuisinePreference}
          onApplyPreferenceChanges={applyUpdatedPreferences}
          onFiltersChange={setFilters}
          error={error}
        />
      ) : null}

      {step === 'myRatings' ? (
        <MyRatingsView
          combinedRatings={combinedRatings}
          searchQuery={ratingsSearchQuery}
          searchResults={ratingsSearchResults}
          onSearchQueryChange={setRatingsSearchQuery}
          onSearch={runRatingsSearch}
          onRateRestaurant={rateFromRatingsSearch}
          onRateCustomRestaurant={rateCustomRestaurant}
        />
      ) : null}

      {step === 'search' ? (
        <SearchView query={searchQuery} results={searchResults} onQueryChange={setSearchQuery} onSearch={runSearchPageSearch} />
      ) : null}

      {step === 'about' ? <AboutView /> : null}
    </>
  );
}
