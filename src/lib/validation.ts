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
  
  // 1. Проверка на пустоту
  if (!raw) return false;

  // 2. Оставляем только цифры
  const digits = raw.replace(/[^\d]/g, "");

  // 3. Проверка формата:
  // - Должно быть ровно 11 цифр
  // - Первая цифра должна быть именно "8"
  if (digits.length !== 11 || digits[0] !== "8") {
    return false;
  }

  // 4. Проверка на допустимые символы в исходной строке 
  // (цифры, пробелы, скобки, дефисы)
  return /^[\d\s().-]*$/.test(raw);
}