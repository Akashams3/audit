import { useCallback } from 'react';
import { useAcademicYear } from '../context/AcademicYearContext';

export const useYearFilteredApi = () => {
  const { selectedAcademicYear, selectedStudyYear } = useAcademicYear();

  const buildYearParams = useCallback((extras = {}) => {
    const p = new URLSearchParams();
    if (selectedAcademicYear && selectedAcademicYear !== 'ALL') p.set('academicYear', selectedAcademicYear);
    if (selectedStudyYear && selectedStudyYear !== 'ALL') p.set('year', selectedStudyYear);
    Object.entries(extras).forEach(([k, v]) => { if (v) p.set(k, v); });
    return p.toString() ? '?' + p.toString() : '';
  }, [selectedAcademicYear, selectedStudyYear]);

  const yearParamsObj = {};
  if (selectedAcademicYear && selectedAcademicYear !== 'ALL') yearParamsObj.academicYear = selectedAcademicYear;
  if (selectedStudyYear && selectedStudyYear !== 'ALL') yearParamsObj.year = selectedStudyYear;

  return {
    selectedAcademicYear,
    selectedStudyYear,
    buildYearParams,
    yearParamsObj
  };
};

export default useYearFilteredApi;
