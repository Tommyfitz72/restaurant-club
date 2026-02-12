import StarRating from './StarRating.jsx';

export default function RestaurantRater({ restaurants, ratings, onRate, onSkip, onSubmit }) {
  return (
    <div className="panel">
      <h1>Rate Restaurants You Know</h1>
      <p className="lead">Rate up to 20 places (or skip) so recommendations can learn your style.</p>

      <div className="restaurant-grid">
        {restaurants.map((restaurant) => (
          <article className="restaurant-card" key={restaurant.id}>
            <img src={restaurant.imageUrl} alt={restaurant.name} loading="lazy" />
            <div className="restaurant-content">
              <h3>{restaurant.name}</h3>
              <p>
                {restaurant.cuisineType} • {restaurant.neighborhood}
              </p>
              <StarRating value={ratings[restaurant.id] || 0} onChange={(value) => onRate(restaurant.id, value)} />
              <button type="button" className="link-btn" onClick={() => onSkip(restaurant.id)}>
                Skip
              </button>
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="primary-btn" onClick={onSubmit}>
        Show Reservation Recommendations
      </button>
    </div>
  );
}
