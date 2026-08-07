export const FPP_EXCLUDED_LIST = [
  "Course Committee Meeting – I",
  "Course Committee Meeting – II",
  "Course Committee Meeting – III",
  "CAT 1 Question Paper & Answer Key",
  "CAT 2 Question Paper & Answer Key",
  "CAT 3 Question Paper & Answer Key",
  "Internal Assessment Answer Script Sample",
  "CO-PO Attainment Sheet",
  "Class Committee Meeting 1",
  "Class Committee Meeting 2",
  "Class Committee Meeting 3",
  "PEC Seminar",
  "PEC Student Attendance",
  "PEC Delivery Content",
  "PEC Assessment",
  "Assessment Outcome",
  "Fast Learner Encouragement"
];

export const POST_CAT_1_ONLY = [
  "Course Committee Meeting – I",
  "CAT 1 Question Paper & Answer Key",
  "Class Committee Meeting 1"
];

export const POST_CAT_2_ONLY = [
  "Course Committee Meeting – II",
  "CAT 2 Question Paper & Answer Key",
  "Class Committee Meeting 2"
];

export const END_SEM_ONLY = [
  "Course Committee Meeting – III",
  "CAT 3 Question Paper & Answer Key",
  "Class Committee Meeting 3"
];

export const isXFile = (file) => {
  if (!file) return false;
  if (typeof file === 'object' && file.isXFile) return true;
  const name = typeof file === 'string'
    ? file
    : (file.fileName || file.title || file.name || file.documentType || '');
  return name.toUpperCase().includes('(X)');
};

/**
 * Returns false if the file is explicitly excluded from FPP stage
 */
export const isFppDocument = (file) => {
  if (!file) return false;
  const name = typeof file === 'string'
    ? file
    : (file.fileName || file.title || file.name || file.documentType || '');
  if (!name) return false;
  
  const trimmed = name.trim().toLowerCase();
  const isExcluded = FPP_EXCLUDED_LIST.some(item => trimmed.includes(item.toLowerCase()));
  if (isExcluded) return false;
  return true;
};

