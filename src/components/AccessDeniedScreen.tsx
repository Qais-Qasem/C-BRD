import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, AlertOctagon } from 'lucide-react';

interface AccessDeniedScreenProps {
  userRole: string;
  functionalRole: string;
  attemptedView: string;
  onReturnToDashboard: () => void;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  userRole,
  functionalRole,
  attemptedView,
  onReturnToDashboard
}) => {
  return (
    <div id="cbridge-access-denied" className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
      <div className="bg-red-950/80 border border-red-800 rounded-3xl p-8 shadow-2xl space-y-6 w-full">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-900/90 text-red-200 border border-red-700 flex items-center justify-center shadow-lg">
          <AlertOctagon className="w-10 h-10 text-red-400" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-red-900/50 border border-red-700/80 text-red-300 text-xs px-3.5 py-1 rounded-full font-mono font-bold uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>EXECUTIVE PRIVILEGES REQUIRED</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">ACCESS DENIED</h2>
          <p className="text-xs text-red-300 font-medium leading-relaxed max-w-md mx-auto">
            You do not have supervisor authorization to access Executive Governance, Member Approval, or Owner Administration controls.
          </p>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2 font-mono">
          <div className="text-slate-400 flex justify-between">
            <span>Attempted View:</span>
            <span className="text-amber-400 font-bold uppercase">{attemptedView}</span>
          </div>
          <div className="text-slate-400 flex justify-between">
            <span>Your Account Role:</span>
            <span className="text-blue-300 font-bold">{userRole}</span>
          </div>
          <div className="text-slate-400 flex justify-between">
            <span>Functional Title:</span>
            <span className="text-emerald-300 font-bold">{functionalRole}</span>
          </div>
          <div className="text-slate-400 flex justify-between">
            <span>Supervisor Authority:</span>
            <span className="text-red-400 font-bold">Managing Director Husni Hasan</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onReturnToDashboard}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO MY DASHBOARD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
