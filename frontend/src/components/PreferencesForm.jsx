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

export default function PreferencesForm({ value, onChange, onSubmit }) {
  const toggleCuisine = (cuisine) => {
    const exists = value.cuisinePreferences.includes(cuisine);
    const cuisinePreferences = exists
      ? value.cuisinePreferences.filter((item) => item !== cuisine)
      : [...value.cuisinePreferences, cuisine];
    onChange({ ...value, cuisinePreferences });
  };

  return (
    <main className="page-shell preferences-page">
      <section className="hero-shell">
        <p className="hero-kicker">Boston + Cambridge</p>
        <p className="hero-slogan">Spontaneous dining in Boston</p>
      </section>

      <section className="beli-card profile-builder">
        <h2>Your Dining Profile</h2>
        <p className="lead">Pick cuisine and budget preferences so we can find restaurants you will actually love.</p>

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
