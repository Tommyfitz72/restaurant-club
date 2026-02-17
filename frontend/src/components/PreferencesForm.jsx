import { useMemo, useState } from 'react';

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

export default function PreferencesForm({ value, keywordCatalog, onToggleKeyword, onChange, onSubmit }) {
  const [customKeywordInput, setCustomKeywordInput] = useState('');

  const suggestedKeywords = useMemo(() => (keywordCatalog || []).slice(0, 120), [keywordCatalog]);
  const selectedKeywords = value.selectedKeywords || [];

  const toggleCuisine = (cuisine) => {
    const exists = value.cuisinePreferences.includes(cuisine);
    const cuisinePreferences = exists
      ? value.cuisinePreferences.filter((item) => item !== cuisine)
      : [...value.cuisinePreferences, cuisine];
    onChange({ ...value, cuisinePreferences });
  };

  const addCustomKeyword = () => {
    const next = String(customKeywordInput || '').trim();
    if (!next) return;
    if (selectedKeywords.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setCustomKeywordInput('');
      return;
    }
    onToggleKeyword(next);
    setCustomKeywordInput('');
  };

  return (
    <main className="page-shell preferences-page compressed-page">
      <section className="hero-shell">
        <p className="hero-kicker">Boston + Cambridge</p>
        <p className="hero-slogan">Find Your Meal</p>
      </section>

      <section className="beli-card profile-builder">
        <h2>Tell us what you usually prefer</h2>

        <div className="section-label">What types of cuisine do you enjoy?</div>
        <div className="chip-grid compact-chip-grid">
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

        <div className="section-label">Price range</div>
        <div className="price-range-row">
          <span className="price-range-label">Price range:</span>
          <select value={value.priceMin} onChange={(event) => onChange({ ...value, priceMin: Number(event.target.value) })}>
            <option value={1}>$</option>
            <option value={2}>$$</option>
            <option value={3}>$$$</option>
            <option value={4}>$$$$</option>
          </select>
          <span className="price-range-to">to</span>
          <select value={value.priceMax} onChange={(event) => onChange({ ...value, priceMax: Number(event.target.value) })}>
            <option value={1}>$</option>
            <option value={2}>$$</option>
            <option value={3}>$$$</option>
            <option value={4}>$$$$</option>
          </select>
        </div>

        <div className="section-label">Suggested key words</div>
        <select
          className="keyword-select-list"
          size={8}
          onChange={(event) => {
            if (event.target.value) onToggleKeyword(event.target.value);
            event.target.selectedIndex = -1;
          }}
          defaultValue=""
        >
          {suggestedKeywords.map((item) => (
            <option key={item.keyword} value={item.keyword}>
              {item.keyword}
            </option>
          ))}
        </select>

        <div className="section-label">Custom key words</div>
        <div className="custom-keyword-row">
          <input
            type="text"
            placeholder="Type your own key words"
            value={customKeywordInput}
            onChange={(event) => setCustomKeywordInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustomKeyword();
              }
            }}
          />
          <button type="button" className="secondary-btn" onClick={addCustomKeyword}>
            Add
          </button>
        </div>

        <div className="keyword-grid compact-keyword-grid">
          {selectedKeywords.map((keyword) => (
            <button
              key={keyword}
              type="button"
              className="chip keyword-chip selected"
              onClick={() => onToggleKeyword(keyword)}
              title="Tap to remove"
            >
              {keyword}
            </button>
          ))}
        </div>

        <button type="button" className="primary-btn" disabled={!value.cuisinePreferences.length} onClick={onSubmit}>
          Continue to Top 50 Ratings
        </button>
      </section>
    </main>
  );
}
