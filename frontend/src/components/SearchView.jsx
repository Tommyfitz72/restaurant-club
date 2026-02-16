export default function SearchView({ query, results, onQueryChange, onSearch }) {
  return (
    <main className="page-shell">
      <section className="page-card">
        <h1>Search</h1>
        <p className="muted">Search Boston-area restaurants and view recommendation fit.</p>

        <div className="search-row">
          <input
            type="text"
            placeholder="Search restaurant name"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <button type="button" className="secondary-btn" onClick={onSearch}>
            Search
          </button>
        </div>

        <div className="list-stack">
          {results.map((entry) => (
            <article className="result-card" key={entry.restaurant.id}>
              <div className="result-head">
                <strong>{entry.restaurant.name}</strong>
                <span>{entry.matchScore}% match</span>
              </div>
              <p>
                {entry.restaurant.cuisineType} • {entry.restaurant.neighborhood} • {'$'.repeat(entry.restaurant.priceRange)}
              </p>
              <p className="muted">Why it matches: {entry.explanation.join(', ')}.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
