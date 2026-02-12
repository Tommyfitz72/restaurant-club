export const SUPPORTED_CITIES = ['Boston', 'Cambridge'];

export const CUISINE_OPTIONS = [
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

export const RATABLE_RESTAURANT_COUNT = 50;
export const RESERVATION_LOOKAHEAD_HOURS = 48;
export const CANCELLATION_MIN_LEAD_HOURS = 1;

export const SCORE_WEIGHTS = {
  cuisine: 0.42,
  directRating: 0.2,
  similarCuisine: 0.13,
  priceAndTime: 0.1,
  externalReview: 0.15
};
