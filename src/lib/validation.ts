export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function minMax(value: string, min: number, max: number): boolean {
  const v = value ?? "";
  return v.length >= min && v.length <= max;
}

export function required(value: string): boolean {
  return (value ?? "").trim().length > 0;
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

export function isIntInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function isPhone(value: string): boolean {
  const raw = (value ?? "").trim();
  if (!raw) return false;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length < 10 || digits.length > 15) return false;
  return /^[+\d][\d\s().-]*$/.test(raw);
}
