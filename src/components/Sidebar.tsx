import React from 'react';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  ShieldAlert, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  Clock, 
  MessageSquareQuote, 
  FileSpreadsheet, 
  FolderKanban, 
  Layers,
  Users,
  Building2,
  GraduationCap,
  Compass,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentUser: UserRole;
  activeView: string;
  setActiveView: (view: string) => void;
  pendingApprovalsCount: number;
  openTasksCount: number;
  pendingApplicationsCount?: number;
  onResumeWorkflow?: () => void;
  activeWorkflowStep?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  setActiveView,
  pendingApprovalsCount,
  openTasksCount,
  pendingApplicationsCount = 0,
  onResumeWorkflow,
  activeWorkflowStep = 6
}) => {
  const isHusni = currentUser === 'HUSNI';

  const husniNavItems = [
    { id: 'projects-agenda', label: 'Projects & Master Agenda', icon: FolderKanban },
    { id: 'case-room', label: 'Consulting Case Room', icon: Building2, badge: 'Pilot', badgeColor: 'bg-emerald-600' },
    { id: 'capacity-planning', label: 'Capacity & Scheduling', icon: Clock },
    { id: 'workspace', label: 'Capability Workspace', icon: Layers },
    { id: 'asset-library', label: 'Asset Library', icon: BookOpen },
    { id: 'proposals', label: 'Project Proposals', icon: Sparkles },
    { id: 'husni-dashboard', label: 'Company Overview', icon: LayoutDashboard },
    { id: 'team-capacity', label: 'TEAM & CAPACITY', icon: Users, badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : undefined, badgeColor: 'bg-teal-600' },
    { id: 'approvals', label: 'Decision & Approvals', icon: ShieldAlert, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined, badgeColor: 'bg-amber-600' },
    { id: 'operations', label: 'Operations & Progress', icon: Layers, badge: openTasksCount > 0 ? openTasksCount : undefined, badgeColor: 'bg-blue-600' },
    { id: 'documents', label: 'Documents & QA', icon: FileText },
    { id: 'fsvp-dev', label: 'FSVP Service Dev', icon: Layers },
    { id: 'follow-ups', label: 'Follow-Ups', icon: Clock },
    { id: 'reports', label: 'Weekly Reports', icon: FileSpreadsheet },
    { id: 'ask-ai', label: 'Ask C-Bridge AI', icon: Sparkles },
  ];

  const samarNavItems = [
    { id: 'samar-dashboard', label: 'MY DASHBOARD', icon: LayoutDashboard },
    { id: 'course-setup', label: 'COURSE SETUP & STUDY', icon: GraduationCap, badge: 'MA-324-00', badgeColor: 'bg-amber-600' },
    { id: 'case-room', label: 'CONSULTING CASE ROOM', icon: Building2, badge: 'Pilot', badgeColor: 'bg-emerald-600' },
    { id: 'workspace', label: 'CAPABILITY WORKSPACE', icon: Layers },
    { id: 'asset-library', label: 'ASSET LIBRARY', icon: BookOpen },
    { id: 'proposals', label: 'PROJECT PROPOSALS', icon: Sparkles },
    { id: 'todays-agenda', label: "TODAY'S AGENDA", icon: Calendar, badge: 3, badgeColor: 'bg-blue-600' },
    { id: 'projects-agenda', label: 'PROJECT MASTER AGENDA', icon: FolderKanban },
    { id: 'my-tasks', label: 'MY TASKS', icon: CheckSquare },
    { id: 'fsvp-dev', label: 'FSVP DEVELOPMENT', icon: Layers },
    { id: 'study-learning', label: 'STUDY & LEARNING', icon: BookOpen },
    { id: 'documents', label: 'DOCUMENTS', icon: FileText },
    { id: 'follow-ups', label: 'FOLLOW-UPS', icon: Clock },
    { id: 'supervisor-feedback', label: 'SUPERVISOR FEEDBACK', icon: MessageSquareQuote },
    { id: 'reports', label: 'MY REPORTS', icon: FileSpreadsheet },
    { id: 'ask-ai', label: 'ASK C-BRIDGE AI', icon: Sparkles },
  ];

  const items = isHusni ? husniNavItems : samarNavItems;

  return (
    <aside id="cbridge-sidebar" className="w-64 bg-[#10243E] border-r border-[#28476B] shrink-0 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-5 text-[#F8FAFC]">
      <div>
        {/* Role Banner */}
        <div className="px-4 mb-5">
          <div className="p-3 rounded-xl bg-[#163153] border border-[#28476B] text-slate-100 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Active Context
            </div>
            <div className="text-sm font-bold truncate text-[#F8FAFC]">
              {isHusni ? 'Husni Hasan' : 'Samar Baydoun'}
            </div>
            <div className="text-[11px] text-sky-400 font-medium truncate">
              {isHusni ? 'Owner & Supervisor (CB-9110)' : 'Dev Coordinator (SB-9100)'}
            </div>

            {/* Quick Resume Active Workflow Bridge */}
            <button
              id="sidebar-resume-workflow-btn"
              onClick={() => {
                if (onResumeWorkflow) onResumeWorkflow();
                else setActiveView('case-room');
              }}
              className="w-full mt-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer shadow-xs border border-blue-400/40"
              title="Resume Step 6 — Case Team Setup & Roles in Module 1 Study Workspace"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Compass className="w-3.5 h-3.5 text-sky-200 shrink-0" />
                <span className="truncate">Resume Step {activeWorkflowStep}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-sky-200 shrink-0" />
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1 px-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold tracking-wide transition cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-[#F8FAFC] shadow-sm'
                    : 'text-slate-300 hover:bg-[#163153] hover:text-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`${item.badgeColor || 'bg-[#163153] border border-[#28476B]'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logical Modules Footer Box */}
      <div className="px-4 mt-6 pt-4 border-t border-[#28476B]">
        <div className="bg-[#163153] p-3 rounded-xl border border-[#28476B] text-[11px]">
          <div className="font-bold text-[#F8FAFC] mb-1 flex items-center justify-between">
            <span>Validated Logic Modules</span>
            <span className="text-[10px] text-sky-400 font-mono font-bold">Stage A</span>
          </div>
          <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-slate-300">
            <span className="hover:text-sky-300 transition cursor-help" title="Strategy, Governance & Decision Center">CB-9110</span>
            <span className="hover:text-sky-300 transition cursor-help" title="Operations & Progress Center">CB-9119</span>
            <span className="hover:text-sky-300 transition cursor-help" title="Quality Assurance & Document Control">CB-9120</span>
            <span className="hover:text-sky-300 transition cursor-help" title="Samar Role Context">SB-9100</span>
            <span className="hover:text-sky-300 transition cursor-help" title="Samar Agenda">SB-9111</span>
            <span className="hover:text-sky-300 transition cursor-help" title="FSVP Development">SB-9113</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
