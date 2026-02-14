import StarRating from './StarRating.jsx';

export default function MyRatingsView({
  combinedRatings,
  searchQuery,
  searchResults,
  onSearchQueryChange,
  onSearch,
  onRateRestaurant,
  onRateCustomRestaurant
}) {
  return (
    <main className="page-shell">
      <section className="page-card">
        <h1>My Ratings</h1>

        <div className="two-col">
          <section>
            <h2>Past ratings</h2>
            <div className="list-stack">
              {combinedRatings.length ? (
                combinedRatings.map((item) => (
                  <article className="list-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.source}</p>
                    </div>
                    <span>{item.rating.toFixed(1)} / 5</span>
                  </article>
                ))
              ) : (
                <p className="muted">No ratings yet.</p>
              )}
            </div>
          </section>

          <section>
            <h2>Rate more restaurants</h2>
            <div className="search-row">
              <input
                type="text"
                placeholder="Search Boston/Cambridge restaurants"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
              />
              <button type="button" className="secondary-btn" onClick={onSearch}>
                Search
              </button>
            </div>

            <button
              type="button"
              className="link-btn"
              onClick={() => onRateCustomRestaurant(searchQuery)}
              disabled={!searchQuery.trim()}
            >
              Rate "{searchQuery || 'custom restaurant'}" as Google result
            </button>

            <div className="list-stack">
              {searchResults.map((restaurant) => (
                <article className="list-item vertical" key={restaurant.id}>
                  <div>
                    <strong>{restaurant.name}</strong>
                    <p>
                      {restaurant.cuisineType || 'Restaurant'} • {restaurant.neighborhood || restaurant.city || 'Boston area'}
                    </p>
                  </div>
                  <StarRating value={restaurant.currentRating || 0} onChange={(value) => onRateRestaurant(restaurant, value)} />
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
