import { startOfWeek, addDays, parseISO, isValid, format } from "date-fns";

/** Monday-based week start for a given ?week=YYYY-MM-DD param (or today). */
export function weekStartFrom(param?: string): Date {
  let base = new Date();
  if (param) {
    const p = parseISO(param);
    if (isValid(p)) base = p;
  }
  return startOfWeek(base, { weekStartsOn: 1 });
}

export function weekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Param-safe key for a week (its Monday). */
export function weekKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export const CAL_HOUR_START = 4; // 4am
export const CAL_HOUR_END = 21; // calendar closes at 9pm
export const CAL_ROW_PX = 64;
