import React, { createContext, useContext, useState, useEffect } from 'react';
import { ACADEMIC_YEARS, STUDY_YEARS, SEMESTERS } from '../constants/academicConstants';
import { useAuth } from './AuthContext';

const AcademicYearContext = createContext(null);

const roleKey = (role, type) => `iqac_${type}_${role || 'DEFAULT'}`;

export const AcademicYearProvider = ({ children }) => {
  const { user } = useAuth();
  const role = user?.role || 'DEFAULT';

  const [selectedAcademicYear, setSelectedAcademicYearState] = useState(
    () => localStorage.getItem(roleKey(role, 'academic_year')) || ACADEMIC_YEARS[0]
  );
  const [selectedStudyYear, setSelectedStudyYearState] = useState(
    () => localStorage.getItem(roleKey(role, 'study_year')) || STUDY_YEARS[0]
  );
  const [selectedSemester, setSelectedSemesterState] = useState(
    () => localStorage.getItem(roleKey(role, 'semester')) || SEMESTERS[SEMESTERS.length - 1]
  );

  // When role changes, reload from role-specific storage
  useEffect(() => {
    setSelectedAcademicYearState(localStorage.getItem(roleKey(role, 'academic_year')) || ACADEMIC_YEARS[0]);
    setSelectedStudyYearState(localStorage.getItem(roleKey(role, 'study_year')) || STUDY_YEARS[0]);
    setSelectedSemesterState(localStorage.getItem(roleKey(role, 'semester')) || SEMESTERS[SEMESTERS.length - 1]);
  }, [role]);

  const setSelectedAcademicYear = (val) => {
    localStorage.setItem(roleKey(role, 'academic_year'), val);
    setSelectedAcademicYearState(val);
  };
  const setSelectedStudyYear = (val) => {
    localStorage.setItem(roleKey(role, 'study_year'), val);
    setSelectedStudyYearState(val);
  };
  const setSelectedSemester = (val) => {
    localStorage.setItem(roleKey(role, 'semester'), val);
    setSelectedSemesterState(val);
  };

  return (
    <AcademicYearContext.Provider value={{
      selectedAcademicYear, setSelectedAcademicYear,
      selectedStudyYear, setSelectedStudyYear,
      selectedSemester, setSelectedSemester,
      academicYearsList: ACADEMIC_YEARS,
      studyYearsList: STUDY_YEARS,
      semestersList: SEMESTERS
    }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) throw new Error('useAcademicYear must be used within AcademicYearProvider');
  return ctx;
};
