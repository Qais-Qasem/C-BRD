import React from 'react';
import { 
  MemberWorkflowPosition, 
  ActiveWorkSummaryItem, 
  UserRole 
} from '../types';
import { 
  Compass, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Play, 
  Building2, 
  GraduationCap, 
  CheckCircle2,
  Users
} from 'lucide-react';

interface ResumeWorkflowBannerProps {
  position?: MemberWorkflowPosition | null;
  recentItems?: ActiveWorkSummaryItem[];
  currentUser?: UserRole;
  onResume: (position?: MemberWorkflowPosition) => void;
  variant?: 'banner' | 'card' | 'compact' | 'drawer';
  className?: string;
}

export const ResumeWorkflowBanner: React.FC<ResumeWorkflowBannerProps> = ({
  position,
  recentItems = [],
  currentUser = 'SAMAR',
  onResume,
  variant = 'banner',
  className = ''
}) => {
  // Default fallback if position is null
  const activePosition: MemberWorkflowPosition = (position && position.projectId !== 'PRJ-FSVP-01') ? position : {
    memberId: currentUser === 'HUSNI' ? 'MBR-002' : 'MBR-001',
    memberName: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
    projectId: 'PRJ-324',
    projectName: 'PRJ-324 — MSU Food Import Law & FSVP Learning and Capability Development Project',
    moduleId: 'MA-324-01',
    moduleName: 'MSU Module 1 — Foundational FSVP Framework, Statutory Authority & Scope',
    workspaceType: 'MODULE_STUDY',
    workflowStep: 7,
    workflowStepName: 'Step 7 — Ready to Start Consulting Case Session',
    stepDescription: 'Pre-Engagement Validation & Consulting Case Room Entry Gate (Levant Culinary Traditions Corp)',
    caseId: 'CASE-LEVANT-01',
    caseTitle: 'Levant Culinary Traditions Corp Consulting Case',
    lastVisitedAt: new Date().toISOString(),
    completionPercent: 88,
    statusLabel: 'STEP 7 ACTIVE • READY TO ENTER CASE ROOM'
  };

  const formattedDate = activePosition.lastVisitedAt 
    ? new Date(activePosition.lastVisitedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recently';

  if (variant === 'compact') {
    return (
      <div 
        id="resume-workflow-compact"
        className={`bg-[#10243E] border border-blue-600/40 rounded-xl p-3 text-slate-100 flex items-center justify-between gap-3 shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Resume Active Work</span>
              <span>•</span>
              <span className="text-slate-300 font-semibold">{activePosition.moduleId}</span>
            </div>
            <div className="text-xs font-extrabold text-white truncate">
              {activePosition.workflowStepName}
            </div>
          </div>
        </div>
        <button
          id="btn-resume-workflow-compact"
          onClick={() => onResume(activePosition)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
        >
          <span>Resume</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div 
        id="resume-workflow-card"
        className={`bg-white border-2 border-blue-200 rounded-2xl p-5 text-slate-900 shadow-sm space-y-4 ${className}`}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider">
                CONTINUE WHERE YOU LEFT OFF
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                {activePosition.projectName}
              </h3>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-300 shrink-0">
            Step {activePosition.workflowStep} of 8
          </span>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-700" />
              {activePosition.workflowStepName}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Last saved: {formattedDate}
            </span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            {activePosition.stepDescription || 'Resume your exact configuration without losing progress or restarting tasks.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-500 font-medium">
            Workflow: <strong className="text-slate-800">{activePosition.moduleId} Study Workspace</strong>
          </div>
          <button
            id="btn-resume-workflow-card"
            onClick={() => onResume(activePosition)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Resume Step {activePosition.workflowStep}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Default: Prominent Banner
  return (
    <div 
      id="resume-workflow-banner"
      className={`bg-gradient-to-r from-[#10243E] via-[#163153] to-[#10243E] border-2 border-blue-500/50 rounded-2xl p-5 md:p-6 text-white shadow-md space-y-4 ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white border border-blue-400/50 flex items-center justify-center shrink-0 shadow-md">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="bg-blue-500/30 text-sky-300 border border-blue-400/40 px-2 py-0.5 rounded font-extrabold tracking-wide">
                RESUME ACTIVE WORKFLOW
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-sky-300 font-bold">{activePosition.projectId}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-200">{activePosition.moduleId}</span>
            </div>
            
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{activePosition.workflowStepName}</span>
            </h2>

            <p className="text-xs text-slate-200 max-w-3xl leading-relaxed">
              {activePosition.stepDescription || 'Return directly to your preserved step position in the Module 1 Study & Case Room workspace.'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="text-right hidden xl:block pr-2">
            <div className="text-[10px] font-mono text-sky-300 uppercase font-bold">
              Position Preserved
            </div>
            <div className="text-xs text-slate-300">
              {formattedDate}
            </div>
          </div>

          <button
            id="btn-resume-workflow-primary"
            onClick={() => onResume(activePosition)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs md:text-sm px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg border border-blue-400/40 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>RESUME MODULE 1 STUDY (STEP {activePosition.workflowStep})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini Progress / Context Bar */}
      <div className="pt-3 border-t border-blue-900/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Target: <strong className="text-white">{activePosition.projectName}</strong></span>
          <span>•</span>
          <span>Case: <strong className="text-sky-300">{activePosition.caseTitle || 'Apex Global Foods Case'}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-300">Stage Progress:</span>
          <div className="w-24 bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${activePosition.completionPercent || 85}%` }}
            ></div>
          </div>
          <span className="font-mono text-sky-300 font-bold">{activePosition.completionPercent || 85}%</span>
        </div>
      </div>
    </div>
  );
};
