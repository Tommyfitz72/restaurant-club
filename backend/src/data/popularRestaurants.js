const photos = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
];

const rows = [
  ['Sarma', 'Mediterranean', 'Cambridge', 'Inman Square', '249 Pearl St, Cambridge, MA', 4],
  ['Giulia', 'Italian', 'Cambridge', 'Harvard Square', '1682 Massachusetts Ave, Cambridge, MA', 4],
  ['Oleana', 'Mediterranean', 'Cambridge', 'Inman Square', '134 Hampshire St, Cambridge, MA', 4],
  ['Moeca', 'Seafood', 'Cambridge', 'Central Square', '1 Shepard St, Cambridge, MA', 4],
  ['Pammy\'s', 'Italian', 'Cambridge', 'Central Square', '928 Massachusetts Ave, Cambridge, MA', 4],
  ['Alden & Harlow', 'American', 'Cambridge', 'Harvard Square', '40 Brattle St, Cambridge, MA', 3],
  ['Little Donkey', 'American', 'Cambridge', 'Central Square', '505 Massachusetts Ave, Cambridge, MA', 3],
  ['Puritan & Company', 'American', 'Cambridge', 'Inman Square', '1166 Cambridge St, Cambridge, MA', 3],
  ['Pagu', 'Japanese', 'Cambridge', 'Central Square', '310 Massachusetts Ave, Cambridge, MA', 3],
  ['Cafe Sushi', 'Japanese', 'Cambridge', 'Harvard Square', '1105 Massachusetts Ave, Cambridge, MA', 3],
  ['Talulla', 'Mediterranean', 'Cambridge', 'Cambridgeport', '377 Walden St, Cambridge, MA', 3],
  ['Waypoint', 'Seafood', 'Cambridge', 'Cambridgeport', '1030 Massachusetts Ave, Cambridge, MA', 3],
  ['Gustazo', 'Spanish', 'Cambridge', 'Porter Square', '2067 Massachusetts Ave, Cambridge, MA', 3],
  ['Midsummer House', 'American', 'Cambridge', 'Central Square', '2000 Massachusetts Ave, Cambridge, MA', 3],
  ['Mamma Maria', 'Italian', 'Boston', 'North End', '3 N Square, Boston, MA', 4],
  ['Contessa', 'Italian', 'Boston', 'Back Bay', '3 Newbury St, Boston, MA', 4],
  ['SRV', 'Italian', 'Boston', 'South End', '569 Columbus Ave, Boston, MA', 4],
  ['No. 9 Park', 'French', 'Boston', 'Beacon Hill', '9 Park St Pl, Boston, MA', 4],
  ['Deuxave', 'French', 'Boston', 'Back Bay', '371 Commonwealth Ave, Boston, MA', 4],
  ['O Ya', 'Japanese', 'Boston', 'Leather District', '9 East St, Boston, MA', 4],
  ['Uni', 'Japanese', 'Boston', 'Back Bay', '370A Commonwealth Ave, Boston, MA', 4],
  ['Oishii Boston', 'Japanese', 'Boston', 'South End', '1166 Washington St, Boston, MA', 4],
  ['Fox & The Knife', 'Italian', 'Boston', 'South Boston', '28 W Broadway, Boston, MA', 4],
  ['Neptune Oyster', 'Seafood', 'Boston', 'North End', '63 Salem St, Boston, MA', 3],
  ['Saltie Girl', 'Seafood', 'Boston', 'Back Bay', '279 Dartmouth St, Boston, MA', 3],
  ['Select Oyster Bar', 'Seafood', 'Boston', 'Back Bay', '50 Gloucester St, Boston, MA', 3],
  ['Mooo.... Beacon Hill', 'Steakhouse', 'Boston', 'Beacon Hill', '15 Beacon St, Boston, MA', 4],
  ['Grill 23', 'Steakhouse', 'Boston', 'Back Bay', '161 Berkeley St, Boston, MA', 4],
  ['Krasi', 'Mediterranean', 'Boston', 'Back Bay', '48 Gloucester St, Boston, MA', 4],
  ['Sorellina', 'Italian', 'Boston', 'Back Bay', '1 Huntington Ave, Boston, MA', 4],
  ['Mistral', 'French', 'Boston', 'South End', '223 Columbus Ave, Boston, MA', 4],
  ['Yvonne\'s', 'American', 'Boston', 'Downtown', '2 Winter Pl, Boston, MA', 3],
  ['Toro', 'American', 'Boston', 'South End', '1704 Washington St, Boston, MA', 3],
  ['Barcelona Wine Bar', 'Spanish', 'Boston', 'South End', '525 Tremont St, Boston, MA', 3],
  ['Myers + Chang', 'Chinese', 'Boston', 'South End', '1145 Washington St, Boston, MA', 2],
  ['Shore Leave', 'American', 'Boston', 'South End', '11 William E Mullins Way, Boston, MA', 2],
  ['Faccia a Faccia', 'Italian', 'Boston', 'Back Bay', '278 Newbury St, Boston, MA', 3],
  ['The Daily Catch', 'Seafood', 'Boston', 'North End', '323 Hanover St, Boston, MA', 2],
  ['Lolita Back Bay', 'Mexican', 'Boston', 'Back Bay', '271 Dartmouth St, Boston, MA', 3],
  ['Nud Pob', 'Thai', 'Boston', 'Fenway', '738 Commonwealth Ave, Boston, MA', 2],
  ['Nine Tastes', 'Thai', 'Cambridge', 'East Cambridge', '50 Hampshire St, Cambridge, MA', 2],
  ['Mooncusser', 'Seafood', 'Boston', 'Back Bay', '304 Stuart St, Boston, MA', 4],
  ['Tatte Charles St', 'American', 'Boston', 'Beacon Hill', '70 Charles St, Boston, MA', 2],
  ['Sonsie', 'American', 'Boston', 'Back Bay', '327 Newbury St, Boston, MA', 3],
  ['MIDA South End', 'Italian', 'Boston', 'South End', '782 Tremont St, Boston, MA', 3],
  ['Committee', 'Mediterranean', 'Boston', 'Seaport', '50 Northern Ave, Boston, MA', 3],
  ['Nautilus Pier 4', 'Seafood', 'Boston', 'Seaport', '300 Pier 4 Blvd, Boston, MA', 4],
  ['Row 34', 'Seafood', 'Boston', 'Fort Point', '383 Congress St, Boston, MA', 3],
  ['Menton', 'French', 'Boston', 'Fort Point', '354 Congress St, Boston, MA', 4],
  ['Sumiao Hunan Kitchen', 'Chinese', 'Cambridge', 'Kendall Square', '270 3rd St, Cambridge, MA', 3],
  ['Zuma', 'Japanese', 'Boston', 'Back Bay', '2 Newbury St, Boston, MA', 4],
  ['Batifol', 'French', 'Cambridge', 'Huron Village', '292 Huron Ave, Cambridge, MA', 2],
  ['Russell House Tavern', 'American', 'Cambridge', 'Harvard Square', '14 John F Kennedy St, Cambridge, MA', 2]
];

const toBookingLinks = (name) => {
  const q = encodeURIComponent(`${name} Boston reservation`);
  return {
    opentable: `https://www.opentable.com/s/?term=${q}`,
    resy: `https://resy.com/cities/bos?query=${q}`,
    google: `https://www.google.com/search?q=${q}`,
    direct: `https://www.google.com/search?q=${encodeURIComponent(`${name} official website`)}`
  };
};

export const popularRestaurants = rows.map((row, index) => {
  const [name, cuisineType, city, neighborhood, address, priceRange] = row;

  return {
    name,
    cuisineType,
    city,
    neighborhood,
    address,
    priceRange,
    imageUrl: photos[index % photos.length],
    bookingLinks: toBookingLinks(name)
  };
});
