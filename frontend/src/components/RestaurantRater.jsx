import StarRating from './StarRating.jsx';

export default function RestaurantRater({ restaurants, ratings, notesByRestaurant, onRate, onSkip, onNoteChange, onSubmit }) {
  return (
    <main className="page-shell compressed-page">
      <section className="beli-card">
        <div className="title-group compact-title-group">
          <h1>Rank Your Favorite Restaurants in Boston!</h1>
          <p className="lead">
            Quick-rate restaurants and add notes. Notes are converted into keywords to improve recommendation accuracy.
          </p>
        </div>

        <div className="restaurant-grid compact-rater-grid">
          {restaurants.map((restaurant) => (
            <article className="restaurant-card compact-rater-card" key={restaurant.id}>
              <img src={restaurant.imageUrl} alt={restaurant.name} loading="lazy" />
              <div className="restaurant-content">
                <h3>{restaurant.name}</h3>
                <p>
                  {restaurant.cuisineType} • {restaurant.neighborhood} • {'$'.repeat(restaurant.priceRange)}
                </p>
                <StarRating value={ratings[restaurant.id] || 0} onChange={(value) => onRate(restaurant.id, value)} />
                <textarea
                  className="rating-note-input"
                  placeholder="Add notes about this place (vibe, food, scene, service...)"
                  value={notesByRestaurant?.[restaurant.id] || ''}
                  onChange={(event) => onNoteChange(restaurant.id, event.target.value)}
                />
                <button type="button" className="link-btn" onClick={() => onSkip(restaurant.id)}>
                  Skip
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="sticky-cta-wrap">
          <button type="button" className="primary-btn sticky-cta" onClick={onSubmit}>
            Find your true matches
          </button>
        </div>
      </section>
    </main>
  );
}
