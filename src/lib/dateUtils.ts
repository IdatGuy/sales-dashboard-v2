/**
 * Safely parse a YYYY-MM-DD string to a Date without timezone shift.
 * Never use `new Date(dateString)` for date-only strings — it parses as UTC
 * midnight and can appear as the previous day in negative UTC-offset timezones.
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date to a YYYY-MM-DD string without timezone shift.
 */
export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Count non-Sunday days in a date range (inclusive).
 * Used for sales projection calculations.
 */
export function countBusinessDays(
  startDay: number,
  endDay: number,
  year: number,
  month: number // 0-indexed (Jan = 0)
): number {
  let count = 0;
  for (let day = startDay; day <= endDay; day++) {
    if (new Date(year, month, day).getDay() !== 0) count++;
  }
  return count;
}
