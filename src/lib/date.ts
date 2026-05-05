function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDate(value?: string | null): string {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";

  // RFC3339 / ISO -> Date
  const asDate = new Date(trimmed);
  if (!Number.isNaN(asDate.getTime())) {
    const dd = pad2(asDate.getDate());
    const mm = pad2(asDate.getMonth() + 1);
    const yyyy = asDate.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // YYYY-MM-DD fallback
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;

  return trimmed;
}

