const formatTime = (iso) =>
  new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

export default function SearchView({ query, results, onQueryChange, onSearch }) {
  return (
    <main className="page-shell">
      <section className="page-card">
        <h1>Search</h1>
        <p className="muted">Search Boston-area restaurants and see reservation availability + your match score.</p>

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
              <div className="slot-list">
                {entry.slots.slice(0, 5).map((slot) => (
                  <a key={slot.id} className="slot-link" href={slot.bookingUrl} target="_blank" rel="noreferrer">
                    {formatTime(slot.startsAt)} • {slot.provider}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
