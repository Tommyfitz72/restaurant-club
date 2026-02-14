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

const TIME_OPTIONS = [
  { label: 'Early (5 PM - 6 PM)', value: { startHour: 17, endHour: 18 } },
  { label: 'Prime Time (6 PM - 8 PM)', value: { startHour: 18, endHour: 20 } },
  { label: 'Late (8 PM - 10 PM)', value: { startHour: 20, endHour: 22 } }
];

export default function PreferencesForm({ value, onChange, onSubmit }) {
  const toggleCuisine = (cuisine) => {
    const exists = value.cuisinePreferences.includes(cuisine);
    const cuisinePreferences = exists
      ? value.cuisinePreferences.filter((item) => item !== cuisine)
      : [...value.cuisinePreferences, cuisine];
    onChange({ ...value, cuisinePreferences });
  };

  const toggleTime = (range) => {
    const id = `${range.startHour}-${range.endHour}`;
    const exists = value.preferredTimes.some((item) => `${item.startHour}-${item.endHour}` === id);
    const preferredTimes = exists
      ? value.preferredTimes.filter((item) => `${item.startHour}-${item.endHour}` !== id)
      : [...value.preferredTimes, range];
    onChange({ ...value, preferredTimes });
  };

  return (
    <main className="page-shell preferences-page">
      <section className="hero-shell">
        <p className="hero-kicker">Boston + Cambridge</p>
        <p className="hero-slogan">Spontaneous dining in Boston</p>
      </section>

      <section className="beli-card profile-builder">
        <h2>Your Dining Profile</h2>
        <p className="lead">Pick cuisine and timing preferences so we can tune reservation matches for the next two nights.</p>

        <div className="section-label">What types of cuisine do you enjoy?</div>
        <div className="chip-grid">
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              className={`chip ${value.cuisinePreferences.includes(cuisine) ? 'selected' : ''}`}
              onClick={() => toggleCuisine(cuisine)}
            >
              {cuisine}
            </button>
          ))}
        </div>

        <div className="input-row">
          <label>
            Price min
            <select
              value={value.priceMin}
              onChange={(event) => onChange({ ...value, priceMin: Number(event.target.value) })}
            >
              <option value={1}>$</option>
              <option value={2}>$$</option>
              <option value={3}>$$$</option>
              <option value={4}>$$$$</option>
            </select>
          </label>

          <label>
            Price max
            <select
              value={value.priceMax}
              onChange={(event) => onChange({ ...value, priceMax: Number(event.target.value) })}
            >
              <option value={1}>$</option>
              <option value={2}>$$</option>
              <option value={3}>$$$</option>
              <option value={4}>$$$$</option>
            </select>
          </label>

          <label>
            Party size
            <input
              type="number"
              min="1"
              max="20"
              value={value.defaultPartySize}
              onChange={(event) => onChange({ ...value, defaultPartySize: Number(event.target.value) })}
            />
          </label>
        </div>

        <div className="section-label">Preferred dining windows</div>
        <div className="chip-grid">
          {TIME_OPTIONS.map((option) => {
            const key = `${option.value.startHour}-${option.value.endHour}`;
            const selected = value.preferredTimes.some(
              (item) => `${item.startHour}-${item.endHour}` === key
            );
            return (
              <button
                type="button"
                key={key}
                className={`chip ${selected ? 'selected' : ''}`}
                onClick={() => toggleTime(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="primary-btn"
          disabled={!value.cuisinePreferences.length}
          onClick={onSubmit}
        >
          Continue to Top 50 Ratings
        </button>
      </section>
    </main>
  );
}
