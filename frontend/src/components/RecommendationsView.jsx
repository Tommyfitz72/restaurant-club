const formatTime = (iso) =>
  new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

export default function RecommendationsView({
  data,
  openings,
  filters,
  neighborhoods,
  onFiltersChange,
  onRefresh,
  refreshStatus,
  error
}) {
  return (
    <main className="page-shell">
      <section className="beli-card">
        <div className="toolbar">
          <div>
            <h1>Upcoming reservations (next 2 nights)</h1>
            <p className="lead">
              Matched to your preferences and weighted by ratings from Resy, OpenTable, Google, and similar platforms.
            </p>
          </div>
          <button type="button" className="secondary-btn" onClick={onRefresh}>
            {refreshStatus === 'loading' ? 'Refreshing...' : 'Scan for New Openings'}
          </button>
        </div>

        <div className="filters">
          <label>
            Date
            <input
              type="date"
              value={filters.date}
              onChange={(event) => onFiltersChange({ ...filters, date: event.target.value })}
            />
          </label>
          <label>
            Time from
            <input
              type="time"
              value={filters.timeFrom}
              onChange={(event) => onFiltersChange({ ...filters, timeFrom: event.target.value })}
            />
          </label>
          <label>
            Time to
            <input
              type="time"
              value={filters.timeTo}
              onChange={(event) => onFiltersChange({ ...filters, timeTo: event.target.value })}
            />
          </label>
          <label>
            Party size
            <input
              type="number"
              min="1"
              max="20"
              value={filters.partySize}
              onChange={(event) => onFiltersChange({ ...filters, partySize: event.target.value })}
            />
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
        </div>

        {error ? <p className="error-box">{error}</p> : null}

        {openings?.length ? (
          <div className="opening-banner">
            <strong>Possible cancellations detected:</strong> {openings.length} new openings in the 48h to 1h window.
          </div>
        ) : null}

        <p className="disclaimer">
          Availability is volatile and booking is finalized on partner platforms. Scraping/API usage must comply with
          each provider&apos;s terms.
        </p>

        <div className="recommendation-list">
          {data.map((entry) => (
            <article className="recommendation-card" key={entry.restaurant.id}>
              <img src={entry.restaurant.imageUrl} alt={entry.restaurant.name} loading="lazy" />
              <div className="recommendation-content">
                <div className="title-row">
                  <h2>{entry.restaurant.name}</h2>
                  <span className="score-pill">{entry.matchScore}% match</span>
                </div>
                <p>
                  {entry.restaurant.cuisineType} • {entry.restaurant.neighborhood} • {'$'.repeat(entry.restaurant.priceRange)}
                </p>

                {entry.reviewSignals ? (
                  <p className="meta-line">
                    Cross-platform score {entry.reviewSignals.aggregate} ({entry.reviewSignals.reviewCount} reviews)
                  </p>
                ) : null}

                {entry.hasRecentOpening ? <p className="opening-tag">New opening detected (possible cancellation)</p> : null}

                <p className="explanation">Why: {entry.explanation.join(', ')}</p>

                <div className="slot-list">
                  {entry.slots.slice(0, 8).map((slot) => (
                    <a key={slot.id} href={slot.bookingUrl} target="_blank" rel="noreferrer" className="slot-link">
                      {formatTime(slot.startsAt)} • party {slot.partySize} • {slot.provider}
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
