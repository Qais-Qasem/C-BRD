import React from 'react';
import { GovernanceDecision, UserRole } from '../types';
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, Lock, Clock } from 'lucide-react';

interface ApprovalsGovernanceViewProps {
  decisions: GovernanceDecision[];
  currentUser: UserRole;
  onApproveDecision: (decisionId: string) => void;
}

export const ApprovalsGovernanceView: React.FC<ApprovalsGovernanceViewProps> = ({
  decisions,
  currentUser,
  onApproveDecision,
}) => {
  const isHusni = currentUser === 'HUSNI';

  return (
    <div id="approvals-governance-view" className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm text-white">
        <div className="flex items-center space-x-2 text-xs text-amber-300 font-mono font-bold mb-1">
          <span className="bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
            CB-9110 STRATEGY, GOVERNANCE & DECISION CENTER
          </span>
          <span>•</span>
          <span>Executive Authority Queue</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Governance & Strategy Decision Center
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Protects Phase 1 business boundary (U.S. Food Import Readiness & FSVP Support) and manages final supervisor authorizations.
        </p>
      </div>

      {/* Authority Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 flex items-start space-x-3 shadow-xs">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900">Governance Authority Matrix:</strong> Official decision authority is reserved strictly for Managing Director & Owner <strong>Husni Hasan</strong>. Operational members cannot grant phase scope waivers or override governance holds.
        </div>
      </div>

      {/* Decisions Queue */}
      <div className="space-y-4">
        {decisions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 shadow-xs">
            No active governance decisions requiring executive review.
          </div>
        ) : (
          decisions.map((dec) => (
            <div key={dec.id} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-xs text-slate-800">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-slate-900">{dec.title}</span>
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {dec.moduleCode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Requested By: {dec.requestedBy} • Date Submitted: {dec.dateSubmitted}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    dec.governanceImpact.includes('OUTSIDE') ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {dec.governanceImpact}
                  </span>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    dec.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    dec.status === 'ON_HOLD' ? 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold' :
                    'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {dec.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Scope & Details Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                <div>
                  <strong className="text-amber-800">Phase 1 Scope Boundary Check:</strong>
                  <p className="mt-0.5 text-slate-700">{dec.phaseAlignment}</p>
                </div>

                <div>
                  <strong className="text-slate-500">Decision Context:</strong>
                  <p className="mt-0.5 text-slate-700">{dec.details}</p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <strong className="text-emerald-700">Recommended Executive Action:</strong>
                  <p className="mt-0.5 text-slate-800">{dec.recommendedAction}</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-mono">
                  Required Authority: <strong className="text-slate-900">{dec.requiredAuthority}</strong>
                </span>

                {isHusni ? (
                  <button
                    id={`btn-gov-approve-${dec.id}`}
                    onClick={() => onApproveDecision(dec.id)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>AUTHORIZE & RESOLVE GOVERNANCE DECISION</span>
                  </button>
                ) : (
                  <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center space-x-1.5">
                    <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Husni Hasan Supervisor Sign-Off Required</span>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
