export default function StarRating({ value, onChange }) {
  return (
    <div className="stars" role="radiogroup" aria-label="Restaurant rating">
      <button type="button" className={`star ${value === 0 ? 'active' : ''}`} onClick={() => onChange(0)} aria-label="Rate 0 stars">
        0
      </button>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          className={`star ${value >= star ? 'active' : ''}`}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
