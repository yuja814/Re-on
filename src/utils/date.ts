const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 2026. 09. 07. (월) */
export function formatMomentDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}. ${month}. ${day}. (${WEEKDAYS[date.getDay()]})`;
}

/** 시각은 유지하고 연·월·일만 바꾼다 */
export function withDatePart(base: Date, year: number, month: number, day: number) {
  const next = new Date(base);
  next.setFullYear(year, month, day);
  return next;
}
