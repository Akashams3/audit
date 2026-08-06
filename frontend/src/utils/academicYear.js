/**
 * Canonical display/storage format for this app: YYYY-YY (e.g. 2024-25).
 * Accepts legacy YYYY-YYYY for comparison and API params.
 */

export const ACADEMIC_YEAR_FILTER_OPTIONS = [
  { value: "2022-23", label: "2022-23" },
  { value: "2023-24", label: "2023-24" },
  { value: "2024-25", label: "2024-25" },
  { value: "2025-26", label: "2025-26" },
  { value: "2026-27", label: "2026-27" },
];

export function normalizeAcademicYearShort(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  const m4 = /^(\d{4})-(\d{4})$/.exec(s);
  if (m4) return `${m4[1]}-${m4[2].slice(2)}`;
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  return s;
}

/** True if filter is empty, or stored year matches filter after normalization. */
export function academicYearsMatch(filterValue, storedValue) {
  const f = normalizeAcademicYearShort(filterValue);
  if (f == null) return true;
  const v = normalizeAcademicYearShort(storedValue);
  return v != null && v === f;
}
