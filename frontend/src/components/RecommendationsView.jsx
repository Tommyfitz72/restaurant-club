const CUISINES = [
  'Italian',
  'Japanese',
  'French',
  'American',
  'Mexican',
  'Thai',
  'Chinese',
  'Mediterranean',
  'Steakhouse',
  'Seafood',
  'Indian',
  'Korean',
  'Spanish',
  'Middle Eastern'
];

export default function RecommendationsView({
  data,
  filters,
  neighborhoods,
  profile,
  onProfileChange,
  onApplyPreferenceChanges,
  onAddCuisine,
  onFiltersChange,
  error
}) {
  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="toolbar">
          <div>
            <h1>Restaurant Matches For You</h1>
            <p className="muted">Personalized recommendations based on your preferences, ratings, and Boston restaurant intelligence.</p>
          </div>
        </div>

        <div className="prefs-strip">
          <label>
            Add cuisine
            <select onChange={(event) => onAddCuisine(event.target.value)} defaultValue="">
              <option value="" disabled>
                Select cuisine
              </option>
              {CUISINES.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </label>

          <label>
            Price max
            <select
              value={profile.priceMax}
              onChange={(event) => onProfileChange({ ...profile, priceMax: Number(event.target.value) })}
            >
              <option value={1}>$</option>
              <option value={2}>$$</option>
              <option value={3}>$$$</option>
              <option value={4}>$$$$</option>
            </select>
          </label>

          <button type="button" className="secondary-btn" onClick={onApplyPreferenceChanges}>
            Apply Preferences
          </button>
        </div>

        <div className="filters">
          <label>
            Neighborhood
            <select
              value={filters.neighborhood}
              onChange={(event) => onFiltersChange({ ...filters, neighborhood: event.target.value })}
            >
              <option value="">All</option>
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="error-box">{error}</p> : null}

        <div className="recommendation-list">
          {data.map((entry) => (
            <article className="result-card" key={entry.restaurant.id}>
              <div className="result-head">
                <strong>{entry.restaurant.name}</strong>
                <span>{entry.matchScore}% match</span>
              </div>

              <p>
                {entry.restaurant.cuisineType} • {entry.restaurant.neighborhood} • {'$'.repeat(entry.restaurant.priceRange)}
              </p>

              <img className="result-image" src={entry.restaurant.imageUrl} alt={entry.restaurant.name} loading="lazy" />

              <p className="muted">Why it matches: {entry.explanation.join(', ')}.</p>

              {entry.intelligence ? (
                <>
                  <p className="muted">Vibe: {(entry.intelligence.vibes || []).slice(0, 3).join(', ')}</p>
                  <p className="muted">Style: {(entry.intelligence.style || []).slice(0, 3).join(', ')}</p>
                  <p className="muted">Quality: {entry.intelligence.qualitySummary}</p>
                </>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
