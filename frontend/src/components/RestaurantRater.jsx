import StarRating from './StarRating.jsx';

export default function RestaurantRater({ restaurants, ratings, onRate, onSkip, onSubmit }) {
  return (
    <main className="page-shell">
      <section className="beli-card">
        <div className="title-group">
          <h1>Rank Your Favorite Restaurants in Boston!</h1>
          <p className="lead">
            Quick-rate any restaurants you know. We use your ratings plus review signals from Resy, OpenTable, Google,
            and other sources.
          </p>
        </div>

        <div className="restaurant-grid">
          {restaurants.map((restaurant) => (
            <article className="restaurant-card" key={restaurant.id}>
              <img src={restaurant.imageUrl} alt={restaurant.name} loading="lazy" />
              <div className="restaurant-content">
                <h3>{restaurant.name}</h3>
                <p>
                  {restaurant.cuisineType} • {restaurant.neighborhood} • {'$'.repeat(restaurant.priceRange)}
                </p>
                {restaurant.reviewSignals ? (
                  <p className="meta-line">
                    Resy {restaurant.reviewSignals.sources.resy} • OpenTable {restaurant.reviewSignals.sources.opentable}
                    {' • '}Google {restaurant.reviewSignals.sources.google}
                  </p>
                ) : null}
                <StarRating value={ratings[restaurant.id] || 0} onChange={(value) => onRate(restaurant.id, value)} />
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
