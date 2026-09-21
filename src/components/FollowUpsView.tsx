import React from 'react';
import { FollowUpItem } from '../types';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface FollowUpsViewProps {
  followUps: FollowUpItem[];
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({ followUps }) => {
  return (
    <div id="follow-ups-view" className="space-y-6 pb-12">
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm text-white">
        <div className="flex items-center space-x-2 text-xs text-blue-300 font-mono font-bold mb-1">
          <span className="bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
            CB-9119 OPERATIONS
          </span>
          <span>•</span>
          <span>Stakeholder & Academic Follow-Ups</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Active Follow-Ups & Stakeholder Tracking
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Tracks key academic advisor reviews (e.g. Professor Haskell) and external partner inquiries.
        </p>
      </div>

      <div className="space-y-3">
        {followUps.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs text-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900">{item.subject}</span>
                <div className="text-xs text-slate-500 mt-0.5">
                  Stakeholder: <strong className="text-indigo-700">{item.stakeholder}</strong> • Assigned To: {item.assignedTo}
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                'bg-indigo-100 text-indigo-800 border-indigo-300'
              }`}>
                {item.status}
              </span>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {item.notes}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Module: {item.moduleCode}</span>
              <span>Due Date: {item.dueDate}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
