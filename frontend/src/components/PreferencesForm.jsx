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
  'Korean'
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
    <div className="panel">
      <h1>Boston Table Scout</h1>
      <p className="lead">Find reservation openings in Boston and Cambridge tailored to your dining tastes.</p>

      <section>
        <h2>What types of cuisine do you enjoy?</h2>
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
      </section>

      <section className="input-row">
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
      </section>

      <section>
        <h2>Preferred dining times</h2>
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
      </section>

      <button
        type="button"
        className="primary-btn"
        disabled={!value.cuisinePreferences.length}
        onClick={onSubmit}
      >
        Continue to Restaurant Ratings
      </button>
    </div>
  );
}
