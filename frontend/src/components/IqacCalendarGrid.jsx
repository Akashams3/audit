import React, { useState, useRef } from 'react';
import { Calendar as CalendarIcon, Info, ChevronLeft, ChevronRight, CheckCircle2, Download, FileText, Eye, X } from 'lucide-react';
import { jsPDF } from 'jspdf';

const IqacCalendarGrid = ({ academicCalendar, schedules = [] }) => {
  const [selectedDateEvents, setSelectedDateEvents] = useState(null);
  const gridRef = useRef(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState('');

  // 1. Download/View Department Audit Schedule Table in official PDF Format
  const handleDownloadSchedulePdf = (isPreview = false) => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Title & Header matching official template
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('RAJALAKSHMI INSTITUTE OF TECHNOLOGY', 105, 18, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('(An Autonomous Institution, Affiliated to Anna University, Chennai)', 105, 23, { align: 'center' });
      doc.text('Kuthambakkam Post, Chennai – 600124', 105, 28, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('INTERNAL QUALITY ASSURANCE CELL (IQAC)', 105, 36, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Academic Files Audit Schedule (${academicCalendar?.academicYear || '2026-27 ODD SEM'})`, 105, 42, { align: 'center' });

      // Table Setup
      const deptSchedules = schedules.filter(s => s.departmentCode && s.departmentCode !== 'ALL');
      const sorted = [...(deptSchedules.length > 0 ? deptSchedules : schedules)].sort((a, b) => new Date(a.auditDate) - new Date(b.auditDate));

      const startY = 50;
      const rowHeight = 9;

      // Table Header Box
      doc.setFillColor(240, 243, 248);
      doc.rect(30, startY, 150, rowHeight, 'F');
      doc.rect(30, startY, 150, rowHeight, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Time From', 52.5, startY + 6, { align: 'center' });
      doc.text('Schedule Date', 105, startY + 6, { align: 'center' });
      doc.text('Department Name', 157.5, startY + 6, { align: 'center' });

      let currentY = startY + rowHeight;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      sorted.forEach((s) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.rect(30, currentY, 150, rowHeight, 'S');

        // Draw vertical dividers
        doc.line(75, currentY, 75, currentY + rowHeight);
        doc.line(135, currentY, 135, currentY + rowHeight);

        // Format Date (DD-MM-YYYY)
        let formattedDate = s.auditDate;
        if (s.auditDate && s.auditDate.includes('-')) {
          const parts = s.auditDate.split('-');
          if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        doc.text('10.30 AM', 52.5, currentY + 6, { align: 'center' });
        doc.text(formattedDate, 105, currentY + 6, { align: 'center' });
        doc.text(s.departmentCode || 'ALL', 157.5, currentY + 6, { align: 'center' });

        currentY += rowHeight;
      });

      // Signatures at bottom
      const sigY = Math.max(currentY + 25, 240);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);

      doc.text('IQAC Office', 40, sigY);
      doc.text('Director / IQAC', 170, sigY, { align: 'right' });

      if (isPreview) {
        const blobUrl = doc.output('bloburl');
        setPdfPreviewTitle(`Academic Audit Schedule (${academicCalendar?.academicYear || '2026-27 ODD SEM'})`);
        setPdfPreviewUrl(blobUrl);
        window.open(blobUrl, '_blank');
      } else {
        doc.save(`IQAC_Academic_Files_Audit_Schedule_${academicCalendar?.academicYear || '2026-27'}.pdf`);
      }
    } catch (err) {
      alert('Failed to process PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 2. Download/View Full Visual IQAC Calendar Grid Matrix as PDF Document
  const handleDownloadCalendarPdf = (isPreview = false) => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Title & Header matching IQAC institutional format
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('RAJALAKSHMI INSTITUTE OF TECHNOLOGY', 148.5, 11, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('(An Autonomous Institution, Affiliated to Anna University, Chennai)', 148.5, 15, { align: 'center' });
      doc.text('Kuthambakkam Post, Chennai – 600124', 148.5, 19, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('INTERNAL QUALITY ASSURANCE CELL (IQAC)', 148.5, 25, { align: 'center' });

      doc.setFontSize(9);
      doc.text(`Academic Audit Calendar Matrix (${academicCalendar?.academicYear || '2026-27 ODD SEM'})`, 148.5, 30, { align: 'center' });

      // Month Grids setup
      const monthList = getDynamicMonths();
      const dayHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

      monthList.forEach((m, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);

        const mX = 14 + col * 137;
        const mY = 34 + row * 71;
        const mWidth = 132;
        const mHeight = 67;

        // Month Outer Box
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(248, 250, 252);
        doc.rect(mX, mY, mWidth, mHeight, 'FD');

        // Month Title Box
        doc.setFillColor(241, 245, 249);
        doc.rect(mX, mY, mWidth, 5.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`${m.name} ${m.year}`, mX + mWidth / 2, mY + 4, { align: 'center' });

        // Day Headers
        const cellW = mWidth / 7;
        const dayHeaderH = 4.5;

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);

        dayHeaders.forEach((dh, dhIdx) => {
          const dhX = mX + dhIdx * cellW;
          doc.rect(dhX, mY + 5.5, cellW, dayHeaderH, 'S');
          doc.text(dh, dhX + cellW / 2, mY + 8.8, { align: 'center' });
        });

        // Calendar Days
        const firstDay = new Date(m.year, m.monthIdx, 1).getDay();
        const daysInMonth = new Date(m.year, m.monthIdx + 1, 0).getDate();
        const cellH = 8.5;

        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
          const cellIdx = firstDay + dayNum - 1;
          const cCol = cellIdx % 7;
          const cRow = Math.floor(cellIdx / 7);

          const cX = mX + cCol * cellW;
          const cY = mY + 5.5 + dayHeaderH + cRow * cellH;

          const dateStr = formatDateStr(m.year, m.monthIdx, dayNum);
          const events = getEventsForDate(dateStr);
          const dayOfWeek = new Date(m.year, m.monthIdx, dayNum).getDay();

          // Determine cell fill & text color
          let fillRGB = [255, 255, 255];
          let textRGB = [51, 65, 85];

          if (events.length > 0) {
            const primaryCode = events[0].legendCode;
            switch (primaryCode) {
              case 2: fillRGB = [96, 165, 250]; textRGB = [255, 255, 255]; break; // Post CAT - Blue
              case 3: fillRGB = [252, 211, 77]; textRGB = [69, 26, 3]; break;   // NC Closing - Amber
              case 4: fillRGB = [52, 211, 153]; textRGB = [6, 78, 59]; break;   // Deans - Emerald
              case 5: fillRGB = [251, 146, 60]; textRGB = [255, 255, 255]; break; // Coordinator - Orange
              case 6: fillRGB = [253, 224, 71]; textRGB = [113, 63, 18]; break;  // FPP Audit - Yellow
              default: fillRGB = [226, 232, 240]; textRGB = [51, 65, 85]; break;
            }
          } else if (dayOfWeek === 0) {
            fillRGB = [226, 232, 240];
            textRGB = [71, 85, 105];
          }

          doc.setFillColor(fillRGB[0], fillRGB[1], fillRGB[2]);
          doc.rect(cX, cY, cellW, cellH, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
          doc.text(String(dayNum), cX + cellW / 2, cY + 5.5, { align: 'center' });
        }
      });

      // Color Legends Box at Bottom
      const legendY = 178;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('ACTIVITY DESCRIPTION & COLOR LEGEND', 14, legendY);

      const legendItems = [
        { label: '1. Holidays', rgb: [226, 232, 240] },
        { label: '2. Post CAT Auditing', rgb: [96, 165, 250] },
        { label: '3. N.C Closing', rgb: [252, 211, 77] },
        { label: '4. Meeting with Deans', rgb: [52, 211, 153] },
        { label: '5. IQAC Coordinator', rgb: [251, 146, 60] },
        { label: '6. FPP Auditing', rgb: [253, 224, 71] },
      ];

      legendItems.forEach((lg, i) => {
        const lgX = 14 + i * 45;
        doc.setFillColor(lg.rgb[0], lg.rgb[1], lg.rgb[2]);
        doc.setDrawColor(180, 180, 180);
        doc.rect(lgX, legendY + 2.5, 4.5, 4.5, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(lg.label, lgX + 6, legendY + 6);
      });

      // Bottom Signatures
      const sigY = 198;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);

      doc.text('IQAC Office', 25, sigY);
      doc.text('Director / IQAC', 272, sigY, { align: 'right' });

      if (isPreview) {
        const blobUrl = doc.output('bloburl');
        setPdfPreviewTitle(`IQAC Audit Calendar Grid (${academicCalendar?.academicYear || '2026-27 ODD SEM'})`);
        setPdfPreviewUrl(blobUrl);
        window.open(blobUrl, '_blank');
      } else {
        doc.save(`IQAC_Audit_Calendar_Grid_${academicCalendar?.academicYear || '2026-27'}.pdf`);
      }
    } catch (err) {
      alert('Failed to process PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Activity Legends matching reference image
  const legends = [
    { code: 1, label: 'Holidays', bg: 'bg-slate-200 text-slate-700', border: 'border-slate-300' },
    { code: 2, label: 'Post CAT exam Auditing', bg: 'bg-blue-400 text-white', border: 'border-blue-500' },
    { code: 3, label: 'N.C Closing', bg: 'bg-amber-300 text-amber-900', border: 'border-amber-400' },
    { code: 4, label: 'Meeting with Deans', bg: 'bg-emerald-400 text-emerald-950', border: 'border-emerald-500' },
    { code: 5, label: 'Meeting with IQAC Coordinator', bg: 'bg-orange-400 text-white', border: 'border-orange-500' },
    { code: 6, label: 'Department file Auditing (FPP)', bg: 'bg-yellow-300 text-yellow-950', border: 'border-yellow-400' },
  ];

  // Helper to format date string
  const formatDateStr = (year, monthIdx, dayNum) => {
    const m = String(monthIdx + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Build events lookup
  const getEventsForDate = (dateStr) => {
    const matched = [];
    const seenKeys = new Set();

    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay();

    // Check schedules
    schedules.forEach((s) => {
      if (s.auditDate === dateStr) {
        let legendCode = 6;
        if (s.academicPhase === 'FPP') legendCode = 6;
        else if (s.academicPhase === 'POST_CAT' || s.academicPhase === 'END_SEM') legendCode = 2;
        else if (s.academicPhase === 'NC_CLOSING' || s.title.includes('N.C Closing')) legendCode = 3;
        else if (s.academicPhase === 'DEAN_MEETING' || s.title.includes('Deans')) legendCode = 4;
        else if (s.academicPhase === 'COORDINATOR_MEETING' || s.title.includes('Coordinator')) legendCode = 5;

        const key = `${s.title}-${s.departmentCode}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          matched.push({
            title: s.title,
            type: s.academicPhase ? `Academic (${s.academicPhase})` : s.auditType,
            dept: s.departmentCode,
            legendCode,
            desc: s.description
          });
        }
      }
    });

    if (academicCalendar) {
      if (academicCalendar.reopeningDate === dateStr && !seenKeys.has('Reopening Date')) {
        matched.push({ title: 'Reopening Date', legendCode: 4, type: 'Academic Event', desc: 'Semester Reopening' });
      }
      if (academicCalendar.cat1Date === dateStr && !seenKeys.has('CAT I')) {
        matched.push({ title: 'CAT I Exam Starts', legendCode: 2, type: 'Exam', desc: 'Continuous Assessment Test I' });
      }
      if (academicCalendar.cat2Date === dateStr && !seenKeys.has('CAT II')) {
        matched.push({ title: 'CAT II Exam Starts', legendCode: 2, type: 'Exam', desc: 'Continuous Assessment Test II' });
      }
      if (academicCalendar.cat3Date === dateStr && !seenKeys.has('CAT III')) {
        matched.push({ title: 'CAT III Exam Starts', legendCode: 2, type: 'Exam', desc: 'Continuous Assessment Test III' });
      }
      if (academicCalendar.lastWorkingDay === dateStr && !seenKeys.has('LWD')) {
        matched.push({ title: 'Last Working Day (LWD)', legendCode: 3, type: 'Academic Event', desc: 'LWD for Odd Semester' });
      }
      if (academicCalendar.practicalExamDate === dateStr && !seenKeys.has('Practical')) {
        matched.push({ title: 'End Sem Practical Exam', legendCode: 1, type: 'Exam', desc: 'Practical Examinations' });
      }
      if (academicCalendar.theoryExamDate === dateStr && !seenKeys.has('Theory')) {
        matched.push({ title: 'End Sem Theory Exam', legendCode: 1, type: 'Exam', desc: 'Theory Examinations' });
      }
    }

    if (dayOfWeek === 0 && matched.length === 0) {
      matched.push({ title: 'Sunday Holiday', legendCode: 1, type: 'Holiday', desc: 'Weekly Holiday' });
    }

    return matched;
  };

  const getStyleForDate = (events, dayOfWeek) => {
    if (events.length === 0) {
      if (dayOfWeek === 0) return 'bg-slate-200 text-slate-600 font-bold';
      return 'bg-white text-slate-700 hover:bg-slate-50';
    }
    const primaryCode = events[0].legendCode;
    switch (primaryCode) {
      case 2: return 'bg-blue-400 text-white font-bold shadow-xs';
      case 3: return 'bg-amber-300 text-amber-950 font-bold shadow-xs';
      case 4: return 'bg-emerald-400 text-emerald-950 font-bold shadow-xs';
      case 5: return 'bg-orange-400 text-white font-bold shadow-xs';
      case 6: return 'bg-yellow-300 text-yellow-950 font-bold shadow-xs';
      default: return 'bg-slate-200 text-slate-700 font-bold';
    }
  };

  // Helper to dynamically calculate month range based on academic calendar and schedules
  const getDynamicMonths = () => {
    let startDate = academicCalendar?.reopeningDate ? new Date(academicCalendar.reopeningDate) : null;
    if (!startDate || isNaN(startDate.getTime())) {
      const scheduleDates = schedules.map(s => new Date(s.auditDate)).filter(d => !isNaN(d.getTime()));
      if (scheduleDates.length > 0) {
        startDate = new Date(Math.min(...scheduleDates));
      }
    }
    if (!startDate || isNaN(startDate.getTime())) {
      startDate = new Date(2026, 5, 1);
    }

    let startYear = startDate.getFullYear();
    let startMonthIdx = startDate.getMonth();

    let endDate = academicCalendar?.theoryExamDate ? new Date(academicCalendar.theoryExamDate) : null;
    if (!endDate || isNaN(endDate.getTime())) {
      const scheduleDates = schedules.map(s => new Date(s.auditDate)).filter(d => !isNaN(d.getTime()));
      if (scheduleDates.length > 0) {
        endDate = new Date(Math.max(...scheduleDates));
      }
    }

    let endYear = endDate && !isNaN(endDate.getTime()) ? endDate.getFullYear() : startYear;
    let endMonthIdx = endDate && !isNaN(endDate.getTime()) ? endDate.getMonth() : startMonthIdx + 3;

    let monthCount = (endYear - startYear) * 12 + (endMonthIdx - startMonthIdx) + 1;
    if (monthCount < 4) monthCount = 4;
    if (monthCount > 12) monthCount = 12;

    const allMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const result = [];
    let currY = startYear;
    let currM = startMonthIdx;

    for (let i = 0; i < monthCount; i++) {
      result.push({ year: currY, monthIdx: currM, name: allMonthNames[currM] });
      currM++;
      if (currM > 11) {
        currM = 0;
        currY++;
      }
    }
    return result;
  };

  const months = getDynamicMonths();

  return (
    <div ref={gridRef} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon size={18} className="text-[#0A3D91]" />
            <h3 className="font-bold text-slate-800 text-base">
              IQAC Calendar {academicCalendar?.academicYear || '2026-27 ODD SEM'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Rajalakshmi Institute of Technology — Internal Quality Assurance Cell Audit Matrix
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* View PDF Options for HOD, Invigilator, & Director */}
          <button
            onClick={() => handleDownloadSchedulePdf(true)}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="View official Department Audit Schedule Table PDF in browser"
          >
            <Eye size={14} />
            <span>View Schedule (PDF)</span>
          </button>

          <button
            onClick={() => handleDownloadSchedulePdf(false)}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Download official Department Audit Schedule Table as PDF"
          >
            <FileText size={14} />
            <span>Download Schedule</span>
          </button>

          <button
            onClick={() => handleDownloadCalendarPdf(true)}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="View visual IQAC Audit Calendar Grid PDF in browser"
          >
            <Eye size={14} />
            <span>View Grid (PDF)</span>
          </button>

          <button
            onClick={() => handleDownloadCalendarPdf(false)}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 bg-[#0A3D91] hover:bg-[#082E6E] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Download visual IQAC Audit Calendar grid as PDF document"
          >
            <Download size={14} />
            <span>Download Grid</span>
          </button>

          <span className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-100">
            Academic Year: {academicCalendar?.academicYear || '2026-27 ODD SEM'}
          </span>
        </div>
      </div>

      {/* Month Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {months.map((m) => {
          const firstDay = new Date(m.year, m.monthIdx, 1).getDay();
          const daysInMonth = new Date(m.year, m.monthIdx + 1, 0).getDate();

          return (
            <div key={m.name} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 p-4">
              <div className="font-bold text-center text-slate-800 text-sm py-1.5 mb-2 bg-slate-100 rounded-lg">
                {m.name} {m.year}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {Array.from({ length: firstDay }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-8 rounded-lg bg-transparent"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = formatDateStr(m.year, m.monthIdx, dayNum);
                  const events = getEventsForDate(dateStr);
                  const dayOfWeek = new Date(m.year, m.monthIdx, dayNum).getDay();
                  const style = getStyleForDate(events, dayOfWeek);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDateEvents({ dateStr, events })}
                      className={`h-8 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all border border-slate-100/50 hover:scale-105 ${style}`}
                      title={events.map((e) => e.title).join(', ')}
                    >
                      <span className="text-[11px] leading-none">{dayNum}</span>
                      {events.length > 0 && (
                        <span className="w-1 h-1 rounded-full bg-white/80 mt-0.5"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Details Drawer/Card */}
      {selectedDateEvents && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-fade-in space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-2">
              <Info size={14} className="text-blue-600" />
              <span>Schedule Details for {selectedDateEvents.dateStr}</span>
            </h4>
            <button
              onClick={() => setSelectedDateEvents(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
          {selectedDateEvents.events.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No specific audit events scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.events.map((ev, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{ev.title}</span>
                    <span className="text-[10px] text-slate-500">{ev.desc}</span>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[9px]">
                      {ev.dept || 'ALL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Color Legend Matching Reference Sample */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Activity Description & Color Legend</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {legends.map((lg) => (
            <div key={lg.code} className="flex items-center space-x-2 text-xs">
              <span className={`w-4 h-4 rounded-md border ${lg.bg} ${lg.border} inline-block flex-shrink-0`}></span>
              <span className="text-[11px] font-semibold text-slate-700 leading-tight">{lg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Modal Viewer (if triggered within component) */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in border border-slate-200">
            <div className="flex items-center justify-between bg-slate-800 text-white px-5 py-3.5">
              <div className="flex items-center space-x-2">
                <FileText size={18} className="text-blue-400" />
                <span className="font-bold text-sm">{pdfPreviewTitle}</span>
              </div>
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-all font-bold text-sm"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-2">
              <iframe
                src={pdfPreviewUrl}
                title={pdfPreviewTitle}
                className="w-full h-full rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IqacCalendarGrid;
