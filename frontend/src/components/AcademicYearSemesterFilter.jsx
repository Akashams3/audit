import { ACADEMIC_YEAR_FILTER_OPTIONS } from "../utils/academicYear";

/**
 * Shared filters: Stage (FPP, Post CAT 1, Post CAT 2, Post CAT 3), Year, Semester
 */
export default function AcademicYearSemesterFilter({
  stage,
  onStage,
  academicYear,
  semester,
  onAcademicYear,
  onSemester,
  showStage = true,
  showYear = true,
  showSemester = true,
  className = "",
}) {
  const sel =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[10rem]";

  return (
    <div
      className={`flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 ${className}`}
      role="search"
    >
      <span className="self-center text-sm font-semibold text-slate-600">Filters</span>

      {showStage && onStage && (
        <div>
          <label htmlFor="filter-stage" className="mb-1 block text-xs font-medium text-slate-500">
            Audit Stage
          </label>
          <select
            id="filter-stage"
            className={sel}
            value={stage || ""}
            onChange={(e) => onStage(e.target.value)}
          >
            <option value="">All Stages</option>
            <option value="FPP">FPP (Faculty Preparation Program)</option>
            <option value="POST_CAT_1">Post CAT 1</option>
            <option value="POST_CAT_2">Post CAT 2</option>
            <option value="POST_CAT_3">Post CAT 3 / End Sem</option>
          </select>
        </div>
      )}

      {showYear && onAcademicYear && (
        <div>
          <label htmlFor="filter-academic-year" className="mb-1 block text-xs font-medium text-slate-500">
            Year
          </label>
          <select
            id="filter-academic-year"
            className={sel}
            value={academicYear || ""}
            onChange={(e) => onAcademicYear(e.target.value)}
          >
            <option value="">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            {ACADEMIC_YEAR_FILTER_OPTIONS?.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {showSemester && onSemester && (
        <div>
          <label htmlFor="filter-semester" className="mb-1 block text-xs font-medium text-slate-500">
            Semester
          </label>
          <select
            id="filter-semester"
            className={sel}
            value={semester || ""}
            onChange={(e) => onSemester(e.target.value)}
          >
            <option value="">All Semesters</option>
            <option value="Sem 1">Sem 1</option>
            <option value="Sem 2">Sem 2</option>
            <option value="Sem 3">Sem 3</option>
            <option value="Sem 4">Sem 4</option>
            <option value="Sem 5">Sem 5</option>
            <option value="Sem 6">Sem 6</option>
            <option value="Sem 7">Sem 7</option>
            <option value="Sem 8">Sem 8</option>
            <option value="ODD">ODD</option>
            <option value="EVEN">EVEN</option>
          </select>
        </div>
      )}
    </div>
  );
}
