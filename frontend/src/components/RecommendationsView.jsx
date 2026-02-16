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

const yesNo = ['yes', 'no'];

const selectOptions = (options, fallback = []) => {
  if (Array.isArray(options) && options.length) return options;
  return fallback;
};

export default function RecommendationsView({
  data,
  loading,
  filters,
  neighborhoods,
  profile,
  keywordCatalog,
  advancedFilterOptions,
  onProfileChange,
  onAddCuisine,
  onToggleKeyword,
  onFiltersChange,
  resultsUpdatedMessage,
  error
}) {
  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="toolbar">
          <div>
            <h1>Restaurant Matches For You</h1>
            <p className="muted">Sorted by match % using your profile, ratings, selected keywords, and source-informed vibe filters.</p>
          </div>
        </div>

        <div className="results-layout">
          <aside className="left-filters">
            <h3 className="sidebar-title">Refine Matches</h3>

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

            <label>
              Vibe
              <select value={filters.vibe} onChange={(event) => onFiltersChange({ ...filters, vibe: event.target.value })}>
                <option value="">Any</option>
                {selectOptions(advancedFilterOptions.vibe, ['romantic', 'fun and lively', 'quiet']).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Size
              <select value={filters.size} onChange={(event) => onFiltersChange({ ...filters, size: event.target.value })}>
                <option value="">Any</option>
                {selectOptions(advancedFilterOptions.size, ['small', 'medium', 'large']).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Live music
              <select
                value={filters.liveMusic}
                onChange={(event) => onFiltersChange({ ...filters, liveMusic: event.target.value })}
              >
                <option value="">Any</option>
                {selectOptions(advancedFilterOptions.liveMusic, yesNo).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Celebrity chef
              <select
                value={filters.celebrityChef}
                onChange={(event) => onFiltersChange({ ...filters, celebrityChef: event.target.value })}
              >
                <option value="">Any</option>
                {selectOptions(advancedFilterOptions.celebrityChef, yesNo).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Outdoor seating
              <select
                value={filters.outdoorSeating}
                onChange={(event) => onFiltersChange({ ...filters, outdoorSeating: event.target.value })}
              >
                <option value="">Any</option>
                {selectOptions(advancedFilterOptions.outdoorSeating, yesNo).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Group dining
              <select
                value={filters.groupDining}
                onChange={(event) => onFiltersChange({ ...filters, groupDining: event.target.value })}
              >
                <option value="">Any</option>
                {selectOptions(advancedFilterOptions.groupDining, yesNo).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tasting menu
              <select
                value={filters.tastingMenu}
                onChange={(event) => onFiltersChange({ ...filters, tastingMenu: event.target.value })}
              >
                <option value="">Any</option>
                {selectOptions(advancedFilterOptions.tastingMenu, yesNo).map((item) => (
                  <option key={item} value={item}>
                    {item}
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

            <div className="mini-keyword-list">
              <p className="small-label">Keywords</p>
              {(keywordCatalog || []).slice(0, 18).map((item) => {
                const selected = (profile.selectedKeywords || []).includes(item.keyword);
                return (
                  <button
                    key={item.keyword}
                    type="button"
                    className={`keyword-toggle ${selected ? 'selected' : ''}`}
                    onClick={() => onToggleKeyword(item.keyword)}
                  >
                    {item.keyword}
                  </button>
                );
              })}
            </div>

          </aside>

          <div className="right-results">
            {loading ? <p className="muted">Updating matches...</p> : null}
            {!loading && resultsUpdatedMessage ? <p className="muted">{resultsUpdatedMessage}</p> : null}
            {error ? <p className="error-box">{error}</p> : null}

            <div className="recommendation-grid compact-grid">
              {data.map((entry) => (
                <article className="result-card compact-card" key={entry.restaurant.id}>
                  <img className="result-image compact-image" src={entry.restaurant.imageUrl} alt={entry.restaurant.name} loading="lazy" />

                  <div className="result-head compact-head">
                    <strong className="restaurant-name">{entry.restaurant.name}</strong>
                    <span className="score-pill">{entry.matchScore}%</span>
                  </div>

                  <p className="mini-meta">
                    {entry.restaurant.cuisineType} • {entry.restaurant.neighborhood} • {'$'.repeat(entry.restaurant.priceRange)}
                  </p>

                  <p className="mini-why">Why: {(entry.explanation || []).slice(0, 2).join(', ')}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
