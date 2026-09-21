import React from 'react';
import { TaskItem, ControlDocument, GovernanceDecision, FollowUpItem, WeeklyReport, LiveLearningSession, SupervisorAttentionLevel } from '../types';
import { 
  ShieldAlert, 
  FileCheck, 
  PlusCircle, 
  Sparkles, 
  FolderKanban, 
  FileText, 
  Users, 
  FileSpreadsheet, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Layers,
  Eye,
  UserCheck,
  BrainCircuit,
  MessageSquare,
  HelpCircle,
  Zap,
  CornerDownRight
} from 'lucide-react';

interface HusniDashboardProps {
  tasks: TaskItem[];
  documents: ControlDocument[];
  decisions: GovernanceDecision[];
  followUps: FollowUpItem[];
  weeklyReports: WeeklyReport[];
  liveSession?: LiveLearningSession;
  onNavigate: (view: string) => void;
  onOpenNewTask: () => void;
  onOpenAskAI: () => void;
  onOpenLiveSession?: (actionType?: 'COMMENT' | 'QUESTION' | 'DIRECTION' | 'CLARIFICATION' | 'MORE_STUDY' | 'FLAG' | 'INTERVENE') => void;
  onChangeAttentionLevel?: (level: SupervisorAttentionLevel) => void;
  onApproveDocument: (docId: string) => void;
  onApproveDecision: (decisionId: string) => void;
}

export const HusniDashboard: React.FC<HusniDashboardProps> = ({
  tasks,
  documents,
  decisions,
  followUps,
  weeklyReports,
  liveSession,
  onNavigate,
  onOpenNewTask,
  onOpenAskAI,
  onOpenLiveSession,
  onChangeAttentionLevel,
  onApproveDocument,
  onApproveDecision,
}) => {
  // Filter for Husni Supervisor Attention items
  const pendingDocs = documents.filter(
    (d) => d.currentStatus === 'PENDING SUPERVISOR APPROVAL' || d.currentStatus === 'READY FOR QA'
  );
  const pendingDecisions = decisions.filter((d) => d.status === 'PENDING_REVIEW' || d.status === 'ON_HOLD');
  const blockers = tasks.filter((t) => t.status === 'BLOCKED' || t.priority === 'P0 — CRITICAL' || t.priority === 'P1 — DECISION / APPROVAL REQUIRED');
  const samarActiveTasks = tasks.filter((t) => t.assignedTo === 'Samar Baydoun');

  return (
    <div id="husni-dashboard" className="space-y-6 pb-12">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-[#10243E] border border-[#28476B] rounded-2xl p-6 shadow-sm text-[#F8FAFC]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-amber-400 font-mono mb-1 font-bold">
              <span className="bg-[#163153] px-2.5 py-0.5 rounded border border-[#28476B]">
                CB-9110 EXECUTIVE CENTER
              </span>
              <span>•</span>
              <span className="text-slate-300">Supervisor Authority Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
              Executive Overview & Governance Center
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Focusing strictly on supervisor attention items: scope decisions, document approvals, operational blockers, and Samar&apos;s Phase 1 progress.
            </p>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="husni-quick-live-session"
              onClick={() => onOpenLiveSession && onOpenLiveSession()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              <span>LIVE MEMBER ACTIVITY</span>
            </button>
            <button
              id="husni-quick-new-task"
              onClick={onOpenNewTask}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-3.5 py-2.5 rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>NEW TASK</span>
            </button>
            <button
              id="husni-quick-ask-ai"
              onClick={onOpenAskAI}
              className="bg-[#163153] hover:bg-[#20416B] text-sky-300 border border-[#28476B] text-xs font-bold px-3.5 py-2.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-sky-400" />
              <span>ASK C-BRIDGE AI</span>
            </button>
          </div>
        </div>

        {/* Quick Nav Row */}
        <div className="mt-6 pt-4 border-t border-[#28476B] flex flex-wrap gap-2 text-xs font-bold">
          <span className="text-slate-300 self-center mr-1 text-[11px] font-medium">Quick Jump:</span>
          <button onClick={() => onNavigate('projects-agenda')} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-1.5 rounded-lg font-extrabold cursor-pointer flex items-center space-x-1 shadow-sm">
            <FolderKanban className="h-3.5 w-3.5 text-blue-200" />
            <span>PROJECTS & MASTER AGENDA</span>
          </button>
          <button onClick={() => onNavigate('operations')} className="bg-[#163153] hover:bg-[#20416B] text-slate-200 px-3 py-1.5 rounded-lg border border-[#28476B] cursor-pointer">
            VIEW OPERATIONS
          </button>
          <button onClick={() => onNavigate('approvals')} className="bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 border border-amber-700/80 px-3 py-1.5 rounded-lg cursor-pointer">
            VIEW APPROVALS ({pendingDecisions.length})
          </button>
          <button onClick={() => onNavigate('documents')} className="bg-[#163153] hover:bg-[#20416B] text-slate-200 px-3 py-1.5 rounded-lg border border-[#28476B] cursor-pointer">
            VIEW DOCUMENTS ({pendingDocs.length})
          </button>
          <button onClick={() => onNavigate('reports')} className="bg-[#163153] hover:bg-[#20416B] text-slate-200 px-3 py-1.5 rounded-lg border border-[#28476B] cursor-pointer">
            VIEW REPORTS
          </button>
          <button onClick={() => onNavigate('follow-ups')} className="bg-[#163153] hover:bg-[#20416B] text-slate-200 px-3 py-1.5 rounded-lg border border-[#28476B] cursor-pointer">
            VIEW FOLLOW-UPS
          </button>
        </div>
      </div>

      {/* LIVE MEMBER ACTIVITY SECTION */}
      {liveSession && (
        <div className="bg-[#10243E] border-2 border-[#2563EB]/80 rounded-2xl p-6 shadow-lg text-[#F8FAFC] space-y-4 relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#28476B] pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE MEMBER ACTIVITY — ACTIVE NOW
                </span>
                <span className="text-xs font-mono text-sky-300">Session: {liveSession.sessionId}</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#F8FAFC] flex items-center gap-2">
                <span>Member: <strong>{liveSession.member}</strong></span>
                <span className="text-xs text-sky-300 font-normal">(Dev Coordinator)</span>
              </h2>
              <p className="text-xs text-slate-300">
                Current Topic: <strong className="text-white">{liveSession.topic}</strong>
              </p>
            </div>

            {/* Supervisor Attention Level Switcher */}
            <div className="bg-[#163153] border border-[#28476B] p-3 rounded-xl shrink-0 space-y-1">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Supervisor Review Model</div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-200">Attention Level:</span>
                <select
                  value={liveSession.attentionLevel}
                  onChange={(e) => onChangeAttentionLevel && onChangeAttentionLevel(e.target.value as SupervisorAttentionLevel)}
                  className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded focus:outline-hidden cursor-pointer"
                >
                  <option value="ROUTINE REVIEW">ROUTINE REVIEW</option>
                  <option value="COMMENT REQUESTED">COMMENT REQUESTED</option>
                  <option value="DECISION REQUIRED">DECISION REQUIRED</option>
                  <option value="APPROVAL REQUIRED">APPROVAL REQUIRED</option>
                  <option value="ESCALATION REQUIRED">ESCALATION REQUIRED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Session Detail Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#163153] p-3 rounded-xl border border-[#28476B]">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Start Time & Duration</span>
              <span className="font-mono font-bold text-white block mt-0.5">{liveSession.startTime}</span>
              <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">42 Mins Active</span>
            </div>

            <div className="bg-[#163153] p-3 rounded-xl border border-[#28476B]">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Current Activity</span>
              <span className="font-semibold text-sky-200 block mt-0.5 line-clamp-2">
                Answering AI Quizzes & SAHC Verification Analysis
              </span>
            </div>

            <div className="bg-[#163153] p-3 rounded-xl border border-[#28476B]">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Open Questions</span>
              <span className="font-mono text-lg font-black text-amber-300 block">{liveSession.openQuestions.length}</span>
              <span className="text-[10px] text-slate-400">Questions Awaiting Review</span>
            </div>

            <div className="bg-[#163153] p-3 rounded-xl border border-[#28476B]">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Learning Progress</span>
              <span className="font-mono text-lg font-black text-sky-300 block">{liveSession.learningProgress}%</span>
              <div className="w-full bg-[#10243E] h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${liveSession.learningProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Supervisor Direct Action Toolbar */}
          <div className="pt-2 border-t border-[#28476B] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-sky-200">
              <UserCheck className="h-4 w-4 text-sky-400" />
              <span>SUPERVISOR ACTIONS:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => onOpenLiveSession && onOpenLiveSession()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>VIEW LIVE SESSION</span>
              </button>
              <button
                onClick={() => onOpenLiveSession && onOpenLiveSession('COMMENT')}
                className="bg-[#163153] hover:bg-[#20416B] text-slate-200 border border-[#28476B] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                + ADD COMMENT
              </button>
              <button
                onClick={() => onOpenLiveSession && onOpenLiveSession('QUESTION')}
                className="bg-[#163153] hover:bg-[#20416B] text-sky-200 border border-sky-700/60 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                + ASK SAMAR A QUESTION
              </button>
              <button
                onClick={() => onOpenLiveSession && onOpenLiveSession('DIRECTION')}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                + GIVE DIRECTION
              </button>
              <button
                onClick={() => onOpenLiveSession && onOpenLiveSession('CLARIFICATION')}
                className="bg-amber-950/80 hover:bg-amber-900/90 text-amber-200 border border-amber-700/80 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                + REQUEST CLARIFICATION
              </button>
              <button
                onClick={() => onOpenLiveSession && onOpenLiveSession('MORE_STUDY')}
                className="bg-[#163153] hover:bg-[#20416B] text-purple-200 border border-purple-700/70 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                + REQUEST MORE STUDY
              </button>
              <button
                onClick={() => onOpenLiveSession && onOpenLiveSession('FLAG')}
                className="bg-rose-950/80 hover:bg-rose-900/90 text-rose-200 border border-rose-700/80 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                + FLAG ISSUE
              </button>
              <button
                onClick={() => onOpenLiveSession && onOpenLiveSession('INTERVENE')}
                className="bg-[#163153] hover:bg-[#20416B] text-amber-300 border border-amber-500/60 px-2.5 py-1.5 rounded-lg transition cursor-pointer font-extrabold"
              >
                + INTERVENE
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs text-slate-800">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Decision Required</span>
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">
            {pendingDecisions.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Scope & Governance Decisions
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs text-slate-800">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Docs Awaiting Approval</span>
            <FileCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600">
            {pendingDocs.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Official Controlled Documents
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs text-slate-800">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Operational Blockers</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-rose-600">
            {blockers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            P0/P1 or Blocked Items
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs text-slate-800">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Samar Phase 1 Active Tasks</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-600">
            {samarActiveTasks.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Dev Coordinator Agenda
          </div>
        </div>

      </div>

      {/* Main Supervisor Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Documents Awaiting Approval */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between text-slate-800">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-slate-900">Documents Awaiting Supervisor Approval</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">CB-9120</span>
            </div>

            {pendingDocs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                No documents currently awaiting approval.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDocs.map((doc) => (
                  <div key={doc.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{doc.documentName}</span>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                            {doc.version}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Author: {doc.author} • Updated: {doc.updatedAt}
                        </div>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-300">
                        {doc.currentStatus}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">QA Findings (CB-9120):</div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                        {doc.qaFindings.map((finding, idx) => (
                          <li key={idx}>{finding}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Supervisor Authority: Husni Hasan Only
                      </span>
                      <button
                        id={`btn-approve-doc-${doc.id}`}
                        onClick={() => onApproveDocument(doc.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded transition cursor-pointer flex items-center space-x-1 shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>APPROVE DOCUMENT</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('documents')}
            className="mt-4 text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center justify-end space-x-1 cursor-pointer pt-3 border-t border-slate-100"
          >
            <span>View All Controlled Documents</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Panel 2: Governance Decisions Required */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between text-slate-800">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-extrabold text-slate-900">Governance & Scope Decisions Required</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">CB-9110</span>
            </div>

            {pendingDecisions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                No active governance decisions requiring review.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDecisions.map((dec) => (
                  <div key={dec.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{dec.title}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Requested By: {dec.requestedBy} • Date: {dec.dateSubmitted}
                        </div>
                      </div>
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-rose-300">
                        {dec.governanceImpact}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <div><strong>Phase Boundary:</strong> {dec.phaseAlignment}</div>
                      <div><strong>Details:</strong> {dec.details}</div>
                      <div className="text-amber-800 font-bold"><strong>Recommended Action:</strong> {dec.recommendedAction}</div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Required Authority: {dec.requiredAuthority}
                      </span>
                      <button
                        id={`btn-approve-dec-${dec.id}`}
                        onClick={() => onApproveDecision(dec.id)}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded transition cursor-pointer flex items-center space-x-1 shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>RESOLVE / APPROVE</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('approvals')}
            className="mt-4 text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center justify-end space-x-1 cursor-pointer pt-3 border-t border-slate-100"
          >
            <span>View Governance Decision Center</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* Lower Row: Samar Progress & Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Samar Progress Overview */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250"
                alt="Samar Baydoun"
                className="h-9 w-9 rounded-full object-cover border border-blue-400"
              />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Samar Baydoun Progress Tracking</h3>
                <p className="text-[11px] text-slate-500 font-medium">Phase 1 Food Import & FSVP Development (SB-9100 / SB-9111)</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('operations')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              View Full Agenda
            </button>
          </div>

          <div className="space-y-2">
            {samarActiveTasks.map((t) => (
              <div key={t.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span>{t.title}</span>
                    <span className="text-[10px] font-mono font-bold text-blue-600">[{t.moduleCode}]</span>
                  </div>
                  <div className="text-[11px] text-slate-600">{t.description}</div>
                  {t.startedAt && (
                    <div className="text-[10px] text-emerald-700 font-mono mt-1 font-semibold space-y-0.5">
                      <div>{t.startedAt}</div>
                      {t.startAuditData && (
                        <div className="text-[9px] text-emerald-600/90 font-mono">
                          Timezone: {t.startAuditData.timeZone} • Offset: {t.startAuditData.utcOffset}
                        </div>
                      )}
                    </div>
                  )}
                  {t.resultData?.submittedAt && (
                    <div className="text-[10px] text-blue-700 font-mono mt-1 font-semibold space-y-0.5 bg-blue-50/80 p-2 rounded border border-blue-200">
                      <div>{t.resultData.submittedAt}</div>
                      <div className="text-[11px] font-sans text-slate-800 font-normal mt-0.5">
                        <strong>Result Summary:</strong> {t.resultData.resultSummary}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                    t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    t.status === 'READY_FOR_QA' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                    t.status === 'BLOCKED' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {t.status?.replace(/_/g, ' ')}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{t.dueDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stakeholder Follow-Ups Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Active Follow-Ups</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">CB-9119</span>
            </div>

            <div className="space-y-2">
              {followUps.map((f) => (
                <div key={f.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900">{f.subject}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5 font-medium">Stakeholder: {f.stakeholder}</div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{f.notes}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('follow-ups')}
            className="mt-4 text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center justify-end space-x-1 cursor-pointer pt-3 border-t border-slate-100"
          >
            <span>Manage Follow-Ups</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
