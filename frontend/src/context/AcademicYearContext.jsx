import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AcademicYearContext = createContext();

export const AcademicYearProvider = ({ children }) => {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedYearLevel, setSelectedYearLevel] = useState('ALL');

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const res = await api.get('/api/director/academic-years');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setAcademicYears(res.data);
        const active = res.data.find(a => a.active);
        if (active) {
          setSelectedAcademicYear(active.yearCode);
        } else {
          setSelectedAcademicYear(res.data[0].yearCode);
        }
      } else {
        const defaults = [{ yearCode: '2024–2025' }, { yearCode: '2025–2026' }, { yearCode: '2026–2027' }];
        setAcademicYears(defaults);
        setSelectedAcademicYear('2026–2027');
      }
    } catch (err) {
      console.error('Failed to fetch academic years:', err);
      const defaults = [{ yearCode: '2024–2025' }, { yearCode: '2025–2026' }, { yearCode: '2026–2027' }];
      setAcademicYears(defaults);
    }
  };

  const changeAcademicYear = (newYear) => {
    setSelectedAcademicYear(newYear);
    // Reset dependent filters as per requirement 31
    setSelectedDepartment('ALL');
    setSelectedYearLevel('ALL');
  };

  const changeDepartment = (newDept) => {
    setSelectedDepartment(newDept);
    // Reset year selection as per requirement 32
    setSelectedYearLevel('ALL');
  };

  const changeYearLevel = (newYearLevel) => {
    setSelectedYearLevel(newYearLevel);
  };

  return (
    <AcademicYearContext.Provider
      value={{
        academicYears,
        selectedAcademicYear,
        setSelectedAcademicYear: changeAcademicYear,
        selectedDepartment,
        setSelectedDepartment: changeDepartment,
        selectedYearLevel,
        setSelectedYearLevel: changeYearLevel,
        fetchAcademicYears,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => useContext(AcademicYearContext);
