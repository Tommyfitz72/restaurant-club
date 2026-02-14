export default function StarRating({ value, onChange }) {
  return (
    <div className="stars" role="radiogroup" aria-label="Restaurant rating">
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
      <span className="rating-value">{value}/5</span>
    </div>
  );
}
