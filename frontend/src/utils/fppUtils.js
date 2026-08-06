export const FPP_DOCUMENT_LIST = [
  "CAT-1 Question Paper & Answer Key",
  "CAT-2 Question Paper & Answer Key",
  "CAT-3 Question Paper & Answer Key",
  "Internal Assessment Answer Script / Cycle Test Scripts",
  "Course Committee Meeting - I",
  "Course Committee Meeting - II",
  "Course Committee Meeting - III",
  "PEC file details-Slow learners"
];

/**
 * Checks if a file object or file name string matches an FPP document name.
 * @param {Object|string} file - File object or file name string
 * @returns {boolean} True if file matches FPP document list
 */
export const isFppDocument = (file) => {
  if (!file) return false;
  const name = typeof file === 'string'
    ? file
    : (file.fileName || file.title || file.name || file.documentType || '');
  if (!name) return false;
  const trimmed = name.trim();
  return FPP_DOCUMENT_LIST.some(doc => doc.toLowerCase() === trimmed.toLowerCase());
};
