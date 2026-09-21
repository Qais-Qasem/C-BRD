import React from 'react';
import { AlertOctagon, LogOut, Mail } from 'lucide-react';

interface AccountInactiveScreenProps {
  userEmail: string;
  onLogout: () => void;
}

export const AccountInactiveScreen: React.FC<AccountInactiveScreenProps> = ({ userEmail, onLogout }) => {
  return (
    <div id="cbridge-account-inactive" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-md mx-auto w-full my-auto text-center space-y-6 bg-slate-950 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div>
          <span className="bg-rose-950 text-rose-300 border border-rose-800 text-xs px-3 py-1 rounded-full font-mono font-bold">
            ACCOUNT INACTIVE OR REJECTED
          </span>
          <h2 className="text-2xl font-black text-white mt-3">Access Restricted</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your C-Bridge operating account (<strong className="text-slate-200">{userEmail}</strong>) is currently inactive or has not been approved for operating access.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left text-xs space-y-2">
          <div className="font-bold text-slate-300 flex items-center space-x-1.5">
            <Mail className="w-4 h-4 text-blue-400" />
            <span>Administrator Contact</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            To request account restoration or check your status, please contact Managing Director Husni Hasan at <span className="text-blue-300 font-mono">husni.alashqar@gmail.com</span>.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>SIGN OUT & RETURN TO SIGN IN</span>
        </button>
      </div>

      <div className="text-center text-xs text-slate-500">
        C-Bridge Operating Platform • Security Governance
      </div>
    </div>
  );
};
