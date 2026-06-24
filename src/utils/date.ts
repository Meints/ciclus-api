export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
}

export function calcNextServiceDate(
  currentDate: Date,
  frequency: string,
): Date {
  switch (frequency) {
    case "MONTHLY":
      return addMonths(currentDate, 1);
    case "BIMONTHLY":
      return addMonths(currentDate, 2);
    case "QUARTERLY":
      return addMonths(currentDate, 3);
    case "SEMIANNUAL":
      return addMonths(currentDate, 6);
    case "YEARLY":
      return addMonths(currentDate, 12);
    default:
      return addMonths(currentDate, 1);
  }
}

export function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function parseDateOnly(value: string): Date {
  const parts = value.split("-");
  if (parts.length !== 3) throw new Error(`Invalid date format: ${value}`);
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    throw new Error(`Invalid date format: ${value}`);
  }
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function parseDateTime(dateValue: string, timeValue?: string | null): Date {
  const date = parseDateOnly(dateValue);
  if (timeValue) {
    const parts = timeValue.split(":");
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (!isNaN(hours) && !isNaN(minutes)) {
      date.setUTCHours(hours, minutes, 0, 0);
    }
  }
  return date;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}
