import React from 'react';
import { WeeklyReport, UserRole } from '../types';
import { FileSpreadsheet, CheckCircle2, Clock } from 'lucide-react';

interface ReportsViewProps {
  reports: WeeklyReport[];
  currentUser: UserRole;
  onReviewReport?: (reportId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  currentUser,
  onReviewReport,
}) => {
  const isHusni = currentUser === 'HUSNI';

  return (
    <div id="reports-view" className="space-y-6 pb-12">
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm text-white">
        <div className="flex items-center space-x-2 text-xs text-blue-300 font-mono font-bold mb-1">
          <span className="bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
            CB-9119 / SB-9100
          </span>
          <span>•</span>
          <span>Member Weekly Operating Briefs</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Weekly Operations & Progress Reports
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Weekly progress summaries submitted by Samar Baydoun detailing Phase 1 accomplishments, blockers, and planned agenda items.
        </p>
      </div>

      <div className="space-y-4">
        {reports.map((rpt) => (
          <div key={rpt.id} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-xs text-slate-800">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-sm font-bold text-slate-900">Weekly Report — Week Ending {rpt.weekEnding}</span>
                <div className="text-xs text-slate-500 mt-0.5">Author: <strong className="text-blue-700">{rpt.author}</strong></div>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                rpt.supervisorStatus === 'REVIEWED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {rpt.supervisorStatus?.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {rpt.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-emerald-700">Key Achievements:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  {rpt.keyAchievements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-indigo-700">Blockers Resolved:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  {rpt.blockersResolved.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-blue-700">Planned for Next Week:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  {rpt.plannedForNextWeek.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

            </div>

            {isHusni && rpt.supervisorStatus === 'AWAITING_REVIEW' && onReviewReport && (
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => onReviewReport(rpt.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>MARK REPORT AS REVIEWED</span>
                </button>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
};
