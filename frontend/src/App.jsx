import { useEffect, useMemo, useRef, useState } from 'react';
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
  priceMin: 1,
  priceMax: 4,
  selectedKeywords: []
};

const initialFilters = {
  neighborhood: '',
  vibe: '',
  size: '',
  liveMusic: '',
  celebrityChef: '',
  outdoorSeating: '',
  groupDining: '',
  tastingMenu: ''
};

const menuValueFromStep = (step) => {
  if (step === 'myRatings') return 'my_ratings';
  if (step === 'search') return 'search';
  if (step === 'about') return 'about';
  if (step === 'preferences') return 'change_preferences';
  return 'recommendations';
};

const inferKeywordsFromNotes = (notesByRestaurant = {}, keywordCatalog = []) => {
  const text = Object.values(notesByRestaurant)
    .map((value) => String(value || '').toLowerCase())
    .join(' ');

  if (!text.trim()) return [];

  const catalogHits = (keywordCatalog || [])
    .map((item) => item.keyword)
    .filter((keyword) => text.includes(String(keyword || '').toLowerCase()));

  const fallbackTokens = text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 25);

  return Array.from(new Set([...catalogHits, ...fallbackTokens])).slice(0, 30);
};

export default function App() {
  const sessionId = useMemo(() => getSessionId(), []);

  const [step, setStep] = useLocalStorage('dishcoverStep', 'results');
  const [profile, setProfile] = useLocalStorage('dishcoverProfile', initialProfile);
  const [ratings, setRatings] = useLocalStorage('dishcoverRatings', {});
  const [externalRatings, setExternalRatings] = useLocalStorage('dishcoverExternalRatings', []);
  const [ratingsNotes, setRatingsNotes] = useLocalStorage('dishcoverRatingsNotes', {});
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage('dishcoverOnboardingDone', false);

  const [skipRatingsOnNext, setSkipRatingsOnNext] = useState(false);

  const [restaurants, setRestaurants] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [keywordCatalog, setKeywordCatalog] = useState([]);
  const [advancedFilterOptions, setAdvancedFilterOptions] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [ratingsSearchQuery, setRatingsSearchQuery] = useState('');
  const [ratingsSearchResults, setRatingsSearchResults] = useState([]);

  const [filters, setFilters] = useState(initialFilters);
  const [resultsUpdatedMessage, setResultsUpdatedMessage] = useState('');
  const recommendationRequestIdRef = useRef(0);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      setStep('preferences');
    }
  }, [hasCompletedOnboarding, setStep]);

  useEffect(() => {
    const load = async () => {
      try {
        const [popular, hoods, keywordData] = await Promise.all([
          api.getPopularRestaurants(),
          api.getNeighborhoods(),
          api.getKeywordCatalog()
        ]);
        setRestaurants(popular);
        setNeighborhoods(hoods);
        setKeywordCatalog(keywordData.keywords || []);
        setAdvancedFilterOptions(keywordData.advancedFilters || {});
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

  const loadRecommendations = async (nextFilters = filters, nextProfile = profile) => {
    const requestId = recommendationRequestIdRef.current + 1;
    recommendationRequestIdRef.current = requestId;

    try {
      setError('');
      setRecommendationLoading(true);
      const result = await api.getRecommendations({
        sessionId,
        ...nextFilters,
        keywords: nextProfile.selectedKeywords || []
      });

      if (recommendationRequestIdRef.current !== requestId) return;
      const nextRecommendations = result.recommendations || [];
      setRecommendations(nextRecommendations);
      setResultsUpdatedMessage(`${nextRecommendations.length} results updated`);
    } catch (fetchError) {
      if (recommendationRequestIdRef.current !== requestId) return;
      setRecommendations([]);
      setResultsUpdatedMessage('0 results updated');
      setError(fetchError.message);
    } finally {
      if (recommendationRequestIdRef.current === requestId) {
        setRecommendationLoading(false);
      }
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

      const noteKeywords = inferKeywordsFromNotes(ratingsNotes, keywordCatalog);
      const mergedKeywords = Array.from(new Set([...(profile.selectedKeywords || []), ...noteKeywords]));
      const nextProfile = { ...profile, selectedKeywords: mergedKeywords };

      setProfile(nextProfile);
      await api.saveProfile(sessionId, nextProfile);

      setSkipRatingsOnNext(false);
      setHasCompletedOnboarding(true);
      setStep('results');
      await loadRecommendations(filters, nextProfile);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const applyUpdatedPreferences = async (nextProfile = profile, nextFilters = filters) => {
    try {
      await api.saveProfile(sessionId, nextProfile);
      await loadRecommendations(nextFilters, nextProfile);
    } catch (applyError) {
      setError(applyError.message);
    }
  };

  const addCuisinePreference = async (cuisine) => {
    if (!cuisine) return;
    if (profile.cuisinePreferences.includes(cuisine)) return;

    const nextProfile = { ...profile, cuisinePreferences: [...profile.cuisinePreferences, cuisine] };
    setProfile(nextProfile);

    if (step === 'results') {
      await applyUpdatedPreferences(nextProfile);
    }
  };

  const toggleKeywordPreference = async (keyword) => {
    const exists = (profile.selectedKeywords || []).includes(keyword);
    const selectedKeywords = exists
      ? (profile.selectedKeywords || []).filter((item) => item !== keyword)
      : [...(profile.selectedKeywords || []), keyword];

    const nextProfile = { ...profile, selectedKeywords };
    setProfile(nextProfile);

    if (step === 'results') {
      await applyUpdatedPreferences(nextProfile);
    }
  };

  const updateFiltersAndRefresh = async (nextFilters) => {
    setFilters(nextFilters);
    if (step === 'results') {
      await loadRecommendations(nextFilters, profile);
    }
  };

  const updateProfileAndRefresh = async (nextProfile) => {
    setProfile(nextProfile);
    if (step === 'results') {
      await applyUpdatedPreferences(nextProfile, filters);
    }
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
        neighborhood: filters.neighborhood,
        keywords: profile.selectedKeywords || [],
        vibe: filters.vibe,
        size: filters.size,
        liveMusic: filters.liveMusic,
        celebrityChef: filters.celebrityChef,
        outdoorSeating: filters.outdoorSeating,
        groupDining: filters.groupDining,
        tastingMenu: filters.tastingMenu
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
        source: 'Dishcover',
        rating: Number(rating)
      })),
    ...externalRatings
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  useEffect(() => {
    if (step === 'results') {
      loadRecommendations(filters, profile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <>
      <header className="site-header">
        <h1>Dishcover</h1>
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

      {step === 'preferences' ? (
        <PreferencesForm
          value={profile}
          keywordCatalog={keywordCatalog}
          onToggleKeyword={toggleKeywordPreference}
          onChange={setProfile}
          onSubmit={submitPreferences}
        />
      ) : null}

      {step === 'ratings' ? (
        <RestaurantRater
          restaurants={restaurants}
          ratings={ratings}
          notesByRestaurant={ratingsNotes}
          onRate={(restaurantId, rating) => setRatings((prev) => ({ ...prev, [restaurantId]: rating }))}
          onSkip={(restaurantId) => setRatings((prev) => ({ ...prev, [restaurantId]: 0 }))}
          onNoteChange={(restaurantId, note) => setRatingsNotes((prev) => ({ ...prev, [restaurantId]: note }))}
          onSubmit={submitRatings}
        />
      ) : null}

      {step === 'results' ? (
        <RecommendationsView
          data={recommendations}
          loading={recommendationLoading}
          filters={filters}
          neighborhoods={neighborhoods}
          profile={profile}
          keywordCatalog={keywordCatalog}
          advancedFilterOptions={advancedFilterOptions}
          onProfileChange={updateProfileAndRefresh}
          onAddCuisine={addCuisinePreference}
          onToggleKeyword={toggleKeywordPreference}
          onFiltersChange={updateFiltersAndRefresh}
          resultsUpdatedMessage={resultsUpdatedMessage}
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
