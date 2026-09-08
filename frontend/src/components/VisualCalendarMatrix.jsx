import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';

const VisualCalendarMatrix = ({ academicCalendar, generatedDates = [], schedules = [] }) => {
  const printRef = useRef();
  const [downloading, setDownloading] = useState(false);

  // ... (keep download function same) ...
  const handleDownloadPDF = () => {
    // We use native browser print which perfectly handles Tailwind colors and SVG
    alert('Please select "Save as PDF" in the destination dropdown in the print dialog.');
    setTimeout(() => {
        window.print();
    }, 500);
  };

  const tableData = useMemo(() => {
    if (!academicCalendar || !academicCalendar.reopeningDate) return null;

    const startDate = new Date(academicCalendar.reopeningDate);
    const endDate = academicCalendar.theoryExamDate
      ? new Date(academicCalendar.theoryExamDate)
      : new Date(academicCalendar.lastWorkingDay);

    if (isNaN(startDate) || isNaN(endDate)) return null;

    const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const rows = [];
    let currentMonth = new Date(startMonth);

    const formatDateStr = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + d;
    };

    const getDayEventInfo = (dateStr) => {
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay();

      if (dayOfWeek === 0) return { type: 'holiday', color: '#e2e8f0' }; // Greyish Blue

      // 1. Try to find in explicitly passed generatedDates
      let genEvent = generatedDates.find((d) => d.date === dateStr);
      
      // 2. Try to find in academicCalendar.gridDataJson if generatedDates wasn't explicitly passed
      if (!genEvent && academicCalendar?.gridDataJson) {
        try {
          const gridData = typeof academicCalendar.gridDataJson === 'string' 
             ? JSON.parse(academicCalendar.gridDataJson) 
             : academicCalendar.gridDataJson;
          genEvent = gridData.find(d => d.date === dateStr);
        } catch (e) {
          // JSON parse failed
        }
      }

      // 3. Fallback to actual audit schedules
      if (!genEvent && schedules && schedules.length > 0) {
          const sched = schedules.find(s => s.auditDate === dateStr);
          if (sched) genEvent = { type: sched.academicPhase, date: sched.auditDate };
      }

      if (genEvent) {
        const typeStr = (genEvent.type || '').toUpperCase();
        if (typeStr === 'FPP') return { type: 'fpp', color: '#fef08a' }; // Yellow
        if (typeStr.includes('POST') || typeStr.includes('END')) return { type: 'postcat', color: '#bfdbfe' }; // Light Blue
        if (typeStr.includes('NC_CLOSING') || typeStr.includes('NC')) return { type: 'nc', color: '#fed7aa' }; // Peach
        if (typeStr.includes('DEAN_MEETING') || typeStr.includes('DEAN')) return { type: 'dean', color: '#86efac' }; // Green
        if (typeStr.includes('COORDINATOR_MEETING') || typeStr.includes('COORDINATOR')) return { type: 'coordinator', color: '#f59e0b' }; // Orange
      }

      return null;
    };

    while (currentMonth <= endMonth) {
      const monthIdx = currentMonth.getMonth();
      const year = currentMonth.getFullYear();
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      let currentDay = 1;
      const monthRows = [];

      while (currentDay <= daysInMonth) {
        const weekRow = { monthName: monthNames[monthIdx], days: Array(7).fill(null) };
        for (let d = 0; d < 7; d++) {
          if (currentDay > daysInMonth) break;
          const dateObj = new Date(year, monthIdx, currentDay);
          const dayOfWeek = dateObj.getDay();
          if (dayOfWeek === d) {
            const dateStr = formatDateStr(dateObj);
            const eventInfo = getDayEventInfo(dateStr);
            weekRow.days[d] = { dateStr, dayNum: currentDay, eventInfo };
            currentDay++;
          }
        }
        monthRows.push(weekRow);
      }
      if (monthRows.length > 0) {
        monthRows[0].isFirstOfMonth = true;
        monthRows[0].rowSpan = monthRows.length;
      }
      rows.push(...monthRows);
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    return rows;
  }, [academicCalendar, generatedDates]);

  if (!tableData) return null;

  return (
    <div className="bg-white rounded-xl mt-8 font-sans text-slate-800 shadow-sm border border-slate-200">
      
      <div className="flex justify-end p-4 border-b border-slate-100">
        <button 
          onClick={handleDownloadPDF} 
          disabled={downloading}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-md"
        >
          <Download size={16} />
          <span>{downloading ? 'Generating PDF...' : 'Download Calendar'}</span>
        </button>
      </div>

      <div ref={printRef} className="print-area p-10 bg-white" style={{ minHeight: '800px' }}>
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase tracking-wide text-gray-800">
            Rajalakshmi Institute of Technology
          </h2>
          <p className="text-[13px] font-bold text-gray-700 mt-1">
            Kuthambakkam, Chennai-600124
          </p>
          <h3 className="text-lg font-bold mt-4 text-gray-800 tracking-wide">
            Internal Quality Assurance Cell
          </h3>
          <p className="text-sm font-bold text-gray-700 mt-1">
            IQAC-Calendar {academicCalendar?.academicYear || '2026-27 Odd Sem'}
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <table className="border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 w-16"></th>
                <th className="border border-gray-400 p-2 w-20 font-bold text-gray-700">Sunday</th>
                <th className="border border-gray-400 p-2 w-20 font-bold text-gray-700">Monday</th>
                <th className="border border-gray-400 p-2 w-20 font-bold text-gray-700">Tuesday</th>
                <th className="border border-gray-400 p-2 w-24 font-bold text-gray-700">Wednesday</th>
                <th className="border border-gray-400 p-2 w-20 font-bold text-gray-700">Thursday</th>
                <th className="border border-gray-400 p-2 w-20 font-bold text-gray-700">Friday</th>
                <th className="border border-gray-400 p-2 w-20 font-bold text-gray-700">Saturday</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  {row.isFirstOfMonth && (
                    <td rowSpan={row.rowSpan} className="border border-gray-400 bg-gray-50 text-center w-16 p-0 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="font-bold text-gray-700 tracking-widest text-sm transform -rotate-90 whitespace-nowrap">
                          {row.monthName}
                        </div>
                      </div>
                    </td>
                  )}
                  {row.days.map((day, dIdx) => {
                    if (!day) {
                      return <td key={dIdx} className="border border-gray-400 p-2 bg-gray-50/30"></td>;
                    }
                    const dynamicStyle = day.eventInfo ? { backgroundColor: day.eventInfo.color } : {};
                    return (
                      <td key={dIdx} className="border border-gray-400 p-2 text-center font-bold text-gray-800" style={dynamicStyle}>
                        {day.dayNum}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center pb-8">
          <table className="border-collapse border border-gray-400 text-sm w-full max-w-[500px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 w-16 font-bold text-gray-700">Sl.No</th>
                <th className="border border-gray-400 p-2 w-24 font-bold text-gray-700">Color Code</th>
                <th className="border border-gray-400 p-2 text-left pl-4 font-bold text-gray-700">Activity Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { n: 1, c: '#e2e8f0', l: 'Holidays' },
                { n: 2, c: '#bfdbfe', l: 'Post CAT exam Auditing' },
                { n: 3, c: '#fed7aa', l: 'N.C Closing' },
                { n: 4, c: '#86efac', l: 'Meeting with Deans' },
                { n: 5, c: '#f59e0b', l: 'Meeting with IQAC Coordinator' },
                { n: 6, c: '#fef08a', l: 'Department file Auditing' },
              ].map(item => (
                <tr key={item.n}>
                  <td className="border border-gray-400 p-2 text-center font-bold text-gray-800">{item.n}</td>
                  <td className="border border-gray-400 p-2" style={{ backgroundColor: item.c }}></td>
                  <td className="border border-gray-400 p-2 font-bold text-gray-700 text-left pl-4">{item.l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisualCalendarMatrix;
