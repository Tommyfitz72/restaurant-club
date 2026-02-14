const formatTime = (iso) =>
  new Date(iso).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

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

const TIME_PRESETS = {
  early: { startHour: 17, endHour: 18 },
  prime: { startHour: 18, endHour: 20 },
  late: { startHour: 20, endHour: 22 }
};

export default function RecommendationsView({
  data,
  openings,
  filters,
  neighborhoods,
  profile,
  onProfileChange,
  onApplyPreferenceChanges,
  onAddCuisine,
  onFiltersChange,
  onRefresh,
  refreshStatus,
  error
}) {
  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="toolbar">
          <div>
            <h1>Upcoming reservations (next 2 nights)</h1>
            <p className="muted">Matched to your profile and live availability.</p>
          </div>
          <button type="button" className="secondary-btn" onClick={onRefresh}>
            {refreshStatus === 'loading' ? 'Refreshing...' : 'Scan for New Openings'}
          </button>
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
            Preferred time
            <select
              value={profile.preferredTimes?.[0] ? `${profile.preferredTimes[0].startHour}-${profile.preferredTimes[0].endHour}` : ''}
              onChange={(event) => {
                const selected = event.target.value;
                if (!selected) return;
                const [startHour, endHour] = selected.split('-').map(Number);
                onProfileChange({ ...profile, preferredTimes: [{ startHour, endHour }] });
              }}
            >
              <option value="">Any</option>
              <option value={`${TIME_PRESETS.early.startHour}-${TIME_PRESETS.early.endHour}`}>Early</option>
              <option value={`${TIME_PRESETS.prime.startHour}-${TIME_PRESETS.prime.endHour}`}>Prime Time</option>
              <option value={`${TIME_PRESETS.late.startHour}-${TIME_PRESETS.late.endHour}`}>Late</option>
            </select>
          </label>
          <button type="button" className="secondary-btn" onClick={onApplyPreferenceChanges}>
            Apply Preferences
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
              {entry.hasRecentOpening ? <p className="opening-tag">New opening detected</p> : null}
              <p className="muted">Why: {entry.explanation.join(', ')}</p>
              <div className="slot-list">
                {entry.slots.slice(0, 8).map((slot) => (
                  <a key={slot.id} href={slot.bookingUrl} target="_blank" rel="noreferrer" className="slot-link">
                    {formatTime(slot.startsAt)} • party {slot.partySize} • {slot.provider}
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
