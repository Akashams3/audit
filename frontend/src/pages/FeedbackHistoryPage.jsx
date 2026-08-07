import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAcademicYear } from '../context/AcademicYearContext';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeedbackHistoryPage = () => {
  const { authFetch } = useAuth();
  const { selectedAcademicYear } = useAcademicYear();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`http://localhost:8080/api/director/feedback?academicYear=${encodeURIComponent(selectedAcademicYear)}`);
        if (res.ok) {
          setFeedback(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [selectedAcademicYear]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-50 pb-4">
        <Link to="/" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-800">Feedback & Comments Log</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-semibold">Complete audit review comments history</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : feedback.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No feedback comment logs found.
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map(item => (
            <div key={item.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs font-semibold">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded text-[9px] uppercase">
                    Dept: {item.department}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(item.date).toLocaleString()}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-xs">
                  File: <span className="text-brand-600 font-bold">{item.fileName}</span>
                </h4>
                <p className="text-slate-600 leading-relaxed italic bg-white p-3 border border-slate-100 rounded-lg">
                  "{item.comment}"
                </p>
              </div>
              <div className="flex flex-col items-end justify-between self-stretch">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  item.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {item.status}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-2">
                  Reviewer: {item.commentedBy}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackHistoryPage;
