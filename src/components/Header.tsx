import React from 'react';
import { UserRole, UserProfile } from '../types';
import { USERS } from '../data/mockData';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  PlusCircle, 
  LogOut, 
  UserCheck, 
  Layers 
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserRole;
  onLogout: () => void;
  onOpenNewTask: () => void;
  onOpenAskAI: () => void;
  onOpenSignUpModal?: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenNewTask,
  onOpenAskAI,
  onOpenSignUpModal,
  activeView
}) => {
  const profile: UserProfile = USERS[currentUser];

  return (
    <header id="cbridge-header" className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#10243E] border border-[#28476B] flex items-center justify-center text-[#F8FAFC] shadow-sm font-extrabold text-lg tracking-tight">
              CB
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-[#0F172A] tracking-tight">C-BRIDGE</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded border border-blue-200 font-bold uppercase tracking-wider">
                  v0.1 Visual MVP
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium hidden sm:block">
                Regulatory Consulting Operating Platform
              </p>
            </div>
          </div>

          {/* Phase Badge & Logical Modules Indicator */}
          <div className="hidden lg:flex items-center space-x-3 bg-[#EEF3F8] px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
            <span className="text-[#0F172A] font-medium">Phase 1: U.S. Food Import & FSVP Support</span>
            <div className="h-3 w-px bg-slate-300" />
            <div className="flex items-center space-x-1.5 font-mono text-[11px] text-[#64748B]">
              <Layers className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="font-bold text-[#0F172A]">CB-9110</span>
              <span>•</span>
              <span className="font-bold text-[#0F172A]">CB-9119</span>
              <span>•</span>
              <span className="font-bold text-[#0F172A]">CB-9120</span>
            </div>
          </div>

          {/* Action Buttons & Profile Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Action: New Task + Inference */}
            <button
              id="header-btn-new-task"
              onClick={onOpenNewTask}
              className="inline-flex items-center space-x-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-[#F8FAFC] text-xs sm:text-sm font-bold px-3.5 py-2 rounded-lg transition shadow-xs cursor-pointer"
              title="Create new task with Priority Inference"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>

            {/* Quick Action: Ask C-Bridge AI */}
            <button
              id="header-btn-ask-ai"
              onClick={onOpenAskAI}
              className="inline-flex items-center space-x-1.5 bg-[#EEF3F8] hover:bg-slate-200 border border-slate-300 text-[#0F172A] text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
              title="Open C-Bridge AI Consulting Assistant"
            >
              <Sparkles className="h-4 w-4 text-[#2563EB]" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Public Registration & Applicant Portal */}
            {onOpenSignUpModal && (
              <button
                id="header-btn-sign-up"
                onClick={onOpenSignUpModal}
                className="inline-flex items-center space-x-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold px-3 py-2 rounded-md transition cursor-pointer"
                title="Open Self-Service Member Sign-Up & Applicant Portal"
              >
                <UserCheck className="h-4 w-4 text-teal-600" />
                <span className="hidden md:inline">Public Sign-Up</span>
              </button>
            )}

            <div className="h-6 w-px bg-slate-200" />

            {/* User Profile & Switcher */}
            <div className="flex items-center space-x-2">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-8 w-8 rounded-full object-cover border border-slate-300"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                  <span>{profile.name}</span>
                  {currentUser === 'HUSNI' ? (
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-300 font-mono uppercase">
                      SUPERVISOR
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-blue-300 font-mono uppercase">
                      MEMBER
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                  {profile.title}
                </div>
              </div>

              {/* Logout Button */}
              <button
                id="header-btn-logout"
                onClick={onLogout}
                className="bg-slate-100 hover:bg-red-50 hover:border-red-300 border border-slate-300 text-slate-500 hover:text-red-600 p-1.5 rounded-md transition cursor-pointer"
                title="Return to Login Screen"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
