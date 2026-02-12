const KEY = 'tableScoutSessionId';

export const getSessionId = () => {
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;

  const generated = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  localStorage.setItem(KEY, generated);
  return generated;
};
