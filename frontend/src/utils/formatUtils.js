export const getDisplayFileName = (fileName, calendarContext) => {
  if (!fileName) return '';
  const lower = fileName.toLowerCase();
  if (
    lower.includes('even/odd') ||
    lower.includes('odd/even') ||
    lower.includes('semester course syllabus') ||
    fileName === 'Course Syllabus'
  ) {
    const contextStr = typeof calendarContext === 'string'
      ? calendarContext
      : (calendarContext?.academicYear || calendarContext?.title || calendarContext?.description || '');
    const upperContext = contextStr.toUpperCase();
    if (upperContext.includes('ODD')) {
      return 'ODD Semester Course Syllabus';
    }
    if (upperContext.includes('EVEN')) {
      return 'EVEN Semester Course Syllabus';
    }
    return 'Course Syllabus';
  }
  return fileName;
};
