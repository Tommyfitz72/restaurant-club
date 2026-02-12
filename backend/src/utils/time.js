export const isWithinPreferredTime = (date, preferredTimes) => {
  if (!preferredTimes?.length) return 1;

  const hour = new Date(date).getHours();
  const hit = preferredTimes.some((range) => hour >= range.startHour && hour <= range.endHour);
  return hit ? 1 : 0.3;
};

export const sameDay = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
