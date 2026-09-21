import React, { useState } from 'react';
import { 
  TaskItem, 
  ControlDocument, 
  WeeklyReport, 
  FollowUpItem, 
  MasterAgendaItem,
  TeamMember,
  CapacityValidationResult,
  MemberExecutionStatus,
  MemberWorkflowPosition
} from '../types';
import { ResumeWorkflowBanner } from './ResumeWorkflowBanner';
import { SubmitResultModal } from './SubmitResultModal';
import { UploadEvidenceModal } from './UploadEvidenceModal';
import { ViewEvidenceModal } from './ViewEvidenceModal';
import { 
  Calendar, 
  CheckSquare, 
  Play, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertOctagon, 
  FileCheck, 
  BookOpen, 
  Layers, 
  MessageSquareQuote, 
  Clock, 
  FileSpreadsheet, 
  ShieldCheck,
  ArrowRight,
  FileText,
  Eye,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Check,
  X,
  HelpCircle,
  TrendingUp,
  Shield,
  Send,
  CalendarCheck,
  RotateCcw
} from 'lucide-react';
import { validateCapacityGate, calculateMemberWorkloadBuckets } from '../utils/schedulingEngine';

interface SamarDashboardProps {
  tasks: TaskItem[];
  documents: ControlDocument[];
  followUps: FollowUpItem[];
  weeklyReports: WeeklyReport[];
  masterAgendaItems?: MasterAgendaItem[];
  teamMembers?: TeamMember[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onStartTask: (taskId: string) => void;
  onSubmitForQA: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onSubmitTaskResult?: (
    taskId: string,
    data: {
      resultSummary: string;
      workCompleted: string;
      remainingWork: string;
      evidenceRef?: string;
      blocker?: string;
      isDraft?: boolean;
    }
  ) => void;
  onReportBlocker: (taskId: string, notes: string) => void;
  onUploadEvidence: (
    taskId: string,
    evidenceData?: any
  ) => void;
  onRemoveEvidence?: (taskId: string, recordId?: string) => void;
  onOpenAskAI: () => void;
  onOpenNewTask: () => void;
  onAcceptAgendaItem?: (itemId: string, customEffort?: number, customDueDate?: string) => { success: boolean; message?: string; validation?: CapacityValidationResult };
  onBatchAcceptItems?: (itemIds: string[]) => void;
  onRequestScheduleChange?: (itemId: string, requestedDueDate: string, reasonNotes: string) => void;
  onRequestEffortChange?: (itemId: string, requestedHours: number, reasonNotes: string) => void;
  onDeferAgendaItem?: (itemId: string, reasonNotes: string) => void;
  onAskSupervisor?: (itemId: string, question: string) => void;
  onResumeWorkflow?: (position?: MemberWorkflowPosition) => void;
}

export const SamarDashboard: React.FC<SamarDashboardProps> = ({
  tasks,
  documents,
  followUps,
  weeklyReports,
  masterAgendaItems = [],
  teamMembers = [],
  activeTab,
  setActiveTab,
  onStartTask,
  onSubmitForQA,
  onCompleteTask,
  onSubmitTaskResult,
  onReportBlocker,
  onUploadEvidence,
  onRemoveEvidence,
  onOpenAskAI,
  onOpenNewTask,
  onAcceptAgendaItem,
  onBatchAcceptItems,
  onRequestScheduleChange,
  onRequestEffortChange,
  onDeferAgendaItem,
  onAskSupervisor,
  onResumeWorkflow
}) => {
  const [blockerModalTaskId, setBlockerModalTaskId] = useState<string | null>(null);
  const [blockerText, setBlockerText] = useState('');
  const [submitResultModalTask, setSubmitResultModalTask] = useState<TaskItem | null>(null);
  const [uploadEvidenceModalTask, setUploadEvidenceModalTask] = useState<TaskItem | null>(null);
  const [viewEvidenceModalTask, setViewEvidenceModalTask] = useState<TaskItem | null>(null);

  // Modals for Member Acceptance Flow
  const [capacityConflict, setCapacityConflict] = useState<{
    itemId: string;
    itemTitle: string;
    validation: CapacityValidationResult;
  } | null>(null);

  const [scheduleChangeModalItem, setScheduleChangeModalItem] = useState<{
    id: string;
    title: string;
    currentDueDate: string;
  } | null>(null);
  const [proposedDueDate, setProposedDueDate] = useState('');
  const [scheduleChangeReason, setScheduleChangeReason] = useState('');

  const [effortChangeModalItem, setEffortChangeModalItem] = useState<{
    id: string;
    title: string;
    currentEffort: number;
  } | null>(null);
  const [proposedEffort, setProposedEffort] = useState(2);
  const [effortChangeReason, setEffortChangeReason] = useState('');

  const [deferModalItem, setDeferModalItem] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deferReason, setDeferReason] = useState('');

  const [askSupervisorModalItem, setAskSupervisorModalItem] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [supervisorQuestion, setSupervisorQuestion] = useState('');
  const [supervisorQuestionSent, setSupervisorQuestionSent] = useState(false);

  const [viewRequirementsItem, setViewRequirementsItem] = useState<MasterAgendaItem | TaskItem | null>(null);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [acceptanceNotice, setAcceptanceNotice] = useState<string | null>(null);

  // Samar member object
  const samarMember = teamMembers.find(m => m.id === 'MBR-001' || m.name === 'Samar Baydoun') || {
    id: 'MBR-001',
    name: 'Samar Baydoun',
    title: 'Food Import & FSVP Development Coordinator',
    role: 'ACTIVE_MEMBER' as any,
    department: 'FSVP Technical Services',
    email: 'samar.baydoun@c-bridge.internal',
    joinedDate: '2026-08-01',
    timezone: 'EDT (UTC-4)',
    country: 'Lebanon',
    schedule: {
      memberId: 'MBR-001',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailablePerDay: 5,
      hoursAvailablePerWeek: 25,
      normalStartTime: '09:00 AM EDT',
      normalEndTime: '02:00 PM EDT',
      timezone: 'EDT (UTC-4)',
      dailySchedules: []
    },
    exceptions: [],
    projectAssignments: ['PRJ-324', 'PRJ-FSVP-01'],
    projectAllocations: [
      { projectId: 'PRJ-324', allocatedHoursPerWeek: 15, roleInProject: 'Primary Capability Developer' },
      { projectId: 'PRJ-FSVP-01', allocatedHoursPerWeek: 7, roleInProject: 'FSVP Document Coordinator' }
    ]
  };

  const [selectedProjectScope, setSelectedProjectScope] = useState<'PRJ-324' | 'PRJ-FSVP-01' | 'ALL'>('PRJ-324');
  const [docProjectFilter, setDocProjectFilter] = useState<'PRJ-324' | 'PRJ-FSVP-01' | 'ALL'>('PRJ-324');
  const [guidanceProjectFilter, setGuidanceProjectFilter] = useState<'PRJ-324' | 'PRJ-FSVP-01' | 'ALL'>('PRJ-324');

  // Filter tasks for Samar
  const samarTasks = tasks.filter((t) => t.assignedTo === 'Samar Baydoun');

  // Workload buckets for Samar (Operating Date: 2026-08-14)
  const workloadBuckets = calculateMemberWorkloadBuckets({
    member: samarMember,
    tasks,
    masterAgendaItems,
    targetDateStr: '2026-08-14'
  });

  // Scheduled Active execution tasks for today (2026-08-14)
  const activeExecutionTasks = samarTasks.filter(
    (t) =>
      (t.scheduledDate === '2026-08-14' || (t.plannedStartAt?.startsWith('2026-08-14') && t.executionStatus === 'SCHEDULED')) &&
      (t.status === 'IN_PROGRESS' || t.executionStatus === 'IN_PROGRESS' || t.executionStatus === 'SCHEDULED') &&
      t.status !== 'READY_FOR_QA' &&
      t.status !== 'COMPLETED' &&
      t.executionStatus !== 'PENDING_MEMBER_ACCEPTANCE' &&
      t.executionStatus !== 'WAITING_FOR_PREREQUISITE' &&
      t.executionStatus !== 'DEFERRED'
  );

  // Pending Member Acceptance Items (from tasks & master agenda)
  const pendingTasksList = samarTasks.filter(
    (t) => (t.executionStatus === 'PENDING_MEMBER_ACCEPTANCE' || (t.status === 'PENDING' && !t.scheduledDate && !t.actualStartedAt && !t.memberAcceptanceTimestamp)) && t.executionStatus !== 'WAITING_FOR_PREREQUISITE'
  );

  const pendingMasterAgendaItems = masterAgendaItems.filter(
    (m) =>
      m.assignedMember === 'Samar Baydoun' &&
      (m.memberExecutionStatus === 'PENDING_MEMBER_ACCEPTANCE' || (!m.memberExecutionStatus && m.currentState === 'NOT_STARTED')) &&
      m.currentState !== 'COMPLETED' &&
      m.currentState !== 'IN_PROGRESS' &&
      !tasks.some(t => t.masterAgendaItemId === m.id && (t.memberAcceptanceTimestamp || t.executionStatus === 'SCHEDULED' || t.executionStatus === 'WAITING_FOR_PREREQUISITE'))
  );

  // Combined unique pending items list
  const allPendingItems: Array<{
    id: string;
    isTask: boolean;
    title: string;
    projectId: string;
    projectName: string;
    masterAgendaItemId?: string;
    category?: string;
    priority: string;
    estimatedEffortHours: number;
    dueDate: string;
    description: string;
    dependencies: string[];
    sourceMaterial?: string;
    deliverable?: string;
    rawItem: TaskItem | MasterAgendaItem;
  }> = [];

  // Add pending tasks
  pendingTasksList.forEach((t) => {
    allPendingItems.push({
      id: t.id,
      isTask: true,
      title: t.title,
      projectId: t.projectId,
      projectName: t.projectName,
      masterAgendaItemId: t.masterAgendaItemId,
      category: t.moduleName,
      priority: t.priority,
      estimatedEffortHours: t.remainingEffortHours ?? t.estimatedEffortHours ?? 2,
      dueDate: t.dueDate,
      description: t.description,
      dependencies: [],
      rawItem: t
    });
  });

  // Add pending master agenda items not already in pending tasks
  pendingMasterAgendaItems.forEach((m) => {
    if (!allPendingItems.some(item => item.masterAgendaItemId === m.id || item.id === m.dailyTaskId)) {
      allPendingItems.push({
        id: m.id,
        isTask: false,
        title: m.taskTitle,
        projectId: m.projectId,
        projectName: m.projectName,
        masterAgendaItemId: m.id,
        category: m.category,
        priority: m.priority,
        estimatedEffortHours: m.estimatedEffortHours || 2,
        dueDate: m.targetDate || '2026-08-16',
        description: m.objective,
        dependencies: m.dependencies || [],
        sourceMaterial: m.requiredSourceMaterial,
        deliverable: m.expectedDeliverable,
        rawItem: m
      });
    }
  });

  const myDocs = documents.filter((d) => d.author === 'Samar Baydoun');

  const tabs = [
    { id: 'samar-dashboard', label: 'MY DASHBOARD', icon: Calendar },
    { 
      id: 'pending-acceptance', 
      label: 'PENDING ACCEPTANCE', 
      icon: Clock,
      badge: allPendingItems.length > 0 ? `${allPendingItems.length} PENDING` : undefined
    },
    { id: 'todays-agenda', label: "TODAY'S AGENDA", icon: CheckSquare },
    { id: 'my-tasks', label: 'MY TASKS', icon: CheckSquare },
    { id: 'fsvp-dev', label: 'FSVP DEVELOPMENT', icon: Layers },
    { id: 'study-learning', label: 'STUDY & LEARNING', icon: BookOpen },
    { id: 'documents', label: 'DOCUMENTS', icon: FileCheck },
    { id: 'follow-ups', label: 'FOLLOW-UPS', icon: Clock },
    { id: 'supervisor-feedback', label: 'SUPERVISOR FEEDBACK', icon: MessageSquareQuote },
    { id: 'reports', label: 'MY REPORTS', icon: FileSpreadsheet },
  ];

  const handleBlockerSubmit = (taskId: string) => {
    if (!blockerText.trim()) return;
    onReportBlocker(taskId, blockerText);
    setBlockerModalTaskId(null);
    setBlockerText('');
  };

  // Handle Member Accepting Work
  const handleAcceptItem = (item: typeof allPendingItems[0]) => {
    if (onAcceptAgendaItem) {
      const res = onAcceptAgendaItem(item.id, item.estimatedEffortHours, item.dueDate);
      if (!res.success && res.validation) {
        setCapacityConflict({
          itemId: item.id,
          itemTitle: item.title,
          validation: res.validation
        });
        return;
      }
      setAcceptanceNotice(`✓ Accepted "${item.title}". Capacity validated and scheduled into operational queue.`);
      setTimeout(() => setAcceptanceNotice(null), 4000);
    }
  };

  // Handle Batch Accept
  const handleBatchAccept = () => {
    if (selectedPendingIds.length === 0) return;
    if (onBatchAcceptItems) {
      onBatchAcceptItems(selectedPendingIds);
      setAcceptanceNotice(`✓ Accepted ${selectedPendingIds.length} items. Capacity validated.`);
      setSelectedPendingIds([]);
      setTimeout(() => setAcceptanceNotice(null), 4000);
    }
  };

  const toggleSelectPending = (id: string) => {
    setSelectedPendingIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div id="samar-dashboard" className="space-y-6 pb-12">
      
      {/* Persistent Workflow Resume Banner */}
      {onResumeWorkflow && (
        <ResumeWorkflowBanner 
          currentUser="SAMAR"
          onResume={(pos) => onResumeWorkflow(pos)}
          variant="banner"
        />
      )}

      {/* Samar Member Banner */}
      <div className="bg-[#10243E] border border-[#28476B] rounded-2xl p-6 shadow-sm text-[#F8FAFC]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250"
              alt="Samar Baydoun"
              className="h-14 w-14 rounded-2xl object-cover border-2 border-sky-400 shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2 text-xs text-sky-300 font-mono mb-1 font-bold">
                <span className="bg-[#163153] px-2.5 py-0.5 rounded border border-[#28476B]">
                  SB-9100 MEMBER EXECUTION PACK
                </span>
                <span>•</span>
                <span className="text-slate-300">Food Import & FSVP Development Coordinator</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
                Samar Baydoun — Daily Operating Workspace
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Weekly Allocation: <strong className="text-emerald-400">15h PRJ-324</strong> • <strong className="text-sky-400">7h PRJ-FSVP-01</strong> • <strong className="text-amber-300">3h Buffer</strong> (25h Total). Execution requires member review & acceptance before capacity consumption.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="samar-btn-ask-ai"
              onClick={onOpenAskAI}
              className="bg-[#163153] hover:bg-[#20416B] text-sky-300 border border-[#28476B] text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-sky-400" />
              <span>ASK C-BRIDGE AI</span>
            </button>
            <button
              id="samar-btn-new-task"
              onClick={onOpenNewTask}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
            >
              + NEW TASK
            </button>
          </div>
        </div>

        {/* Member Nav Tabs Bar */}
        <div className="mt-6 pt-4 border-t border-[#28476B] flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1 text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-samar-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-[#F8FAFC] shadow-sm'
                    : 'text-slate-300 hover:bg-[#163153] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Acceptance Notice Alert */}
      {acceptanceNotice && (
        <div className="bg-emerald-950 border border-emerald-800 text-emerald-200 p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{acceptanceNotice}</span>
          </div>
          <button onClick={() => setAcceptanceNotice(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MEMBER EXECUTION FLOW NOTIFICATION BANNER (When Pending Items Exist) */}
      {allPendingItems.length > 0 && activeTab !== 'pending-acceptance' && (
        <div className="bg-amber-950/80 border border-amber-800/80 rounded-2xl p-5 text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-900/80 text-amber-300 border border-amber-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Husni Approved Master Agenda Work Awaiting Member Review
              </div>
              <h3 className="text-sm font-extrabold text-white mt-0.5">
                {allPendingItems.length} Items Pending Member Acceptance ({allPendingItems.reduce((acc, i) => acc + i.estimatedEffortHours, 0)} hours)
              </h3>
              <p className="text-xs text-amber-300/80 mt-1 max-w-2xl">
                Husni has approved this work. Per C-Bridge execution governance, pending items do not consume execution capacity until reviewed and accepted by you.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-open-pending-acceptance-banner"
              onClick={() => setActiveTab('pending-acceptance')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <span>REVIEW & ACCEPT WORK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB: PENDING ACCEPTANCE (Full Review Workspace) */}
      {(activeTab === 'pending-acceptance' || activeTab === 'samar-dashboard') && allPendingItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-800 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Pending Member Acceptance ({allPendingItems.length} Items)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review workload, estimated hours, and prerequisites before accepting. Capacity is consumed only after acceptance & validation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {allPendingItems.length > 1 && (
                <button
                  id="btn-select-all-pending"
                  onClick={() => {
                    if (selectedPendingIds.length === allPendingItems.length) {
                      setSelectedPendingIds([]);
                    } else {
                      setSelectedPendingIds(allPendingItems.map(i => i.id));
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {selectedPendingIds.length === allPendingItems.length ? 'Deselect All' : 'Select All'}
                </button>
              )}

              {selectedPendingIds.length > 0 && (
                <button
                  id="btn-batch-accept-selected"
                  onClick={handleBatchAccept}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ACCEPT SELECTED ({selectedPendingIds.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Pending Items List */}
          <div className="space-y-4">
            {allPendingItems.map((item) => {
              const isSelected = selectedPendingIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition space-y-3 ${
                    isSelected ? 'bg-blue-50/60 border-blue-400' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Item Header & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectPending(item.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-1 cursor-pointer"
                      />

                      <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
                        <Layers className="h-3 w-3 text-indigo-600" />
                        {item.projectId} — {item.projectName}
                      </span>

                      {item.masterAgendaItemId && (
                        <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded font-bold">
                          Master Agenda: {item.masterAgendaItemId}
                        </span>
                      )}

                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        Est. Effort: {item.estimatedEffortHours} Hours
                      </span>

                      <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-bold">
                        Target Due: {item.dueDate}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase">
                      PENDING MEMBER ACCEPTANCE
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  </div>

                  {/* Prerequisites / Deliverables Info */}
                  {(item.deliverable || item.sourceMaterial || item.dependencies.length > 0) && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
                      {item.deliverable && (
                        <div>
                          <strong className="text-slate-900">Expected Deliverable:</strong> {item.deliverable}
                        </div>
                      )}
                      {item.sourceMaterial && (
                        <div>
                          <strong className="text-slate-900">Source Material:</strong> {item.sourceMaterial}
                        </div>
                      )}
                      {item.dependencies.length > 0 && (
                        <div>
                          <strong className="text-slate-900">Prerequisite Dependencies:</strong>{' '}
                          <span className="font-mono text-indigo-700 font-bold">{item.dependencies.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons: 6 Core Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                    {/* 1. ACCEPT WORK */}
                    <button
                      id={`btn-accept-item-${item.id}`}
                      onClick={() => handleAcceptItem(item)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ACCEPT WORK</span>
                    </button>

                    {/* 2. REQUEST SCHEDULE CHANGE */}
                    <button
                      id={`btn-req-sched-${item.id}`}
                      onClick={() => {
                        setScheduleChangeModalItem({
                          id: item.id,
                          title: item.title,
                          currentDueDate: item.dueDate
                        });
                        setProposedDueDate(item.dueDate);
                        setScheduleChangeReason('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>PROPOSE SCHEDULE</span>
                    </button>

                    {/* 3. REQUEST EFFORT CHANGE */}
                    <button
                      id={`btn-req-effort-${item.id}`}
                      onClick={() => {
                        setEffortChangeModalItem({
                          id: item.id,
                          title: item.title,
                          currentEffort: item.estimatedEffortHours
                        });
                        setProposedEffort(item.estimatedEffortHours);
                        setEffortChangeReason('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                      <span>ADJUST EFFORT</span>
                    </button>

                    {/* 4. DEFER WORK */}
                    <button
                      id={`btn-defer-item-${item.id}`}
                      onClick={() => {
                        setDeferModalItem({
                          id: item.id,
                          title: item.title
                        });
                        setDeferReason('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>DEFER</span>
                    </button>

                    {/* 5. ASK SUPERVISOR */}
                    <button
                      id={`btn-ask-husni-${item.id}`}
                      onClick={() => {
                        setAskSupervisorModalItem({
                          id: item.id,
                          title: item.title
                        });
                        setSupervisorQuestion('');
                        setSupervisorQuestionSent(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ASK HUSNI</span>
                    </button>

                    {/* 6. VIEW REQUIREMENTS */}
                    <button
                      id={`btn-view-req-${item.id}`}
                      onClick={() => setViewRequirementsItem(item.rawItem)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition ml-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>VIEW REQUIREMENTS</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TODAY'S AGENDA SECTION (Clean Slate vs Active Workload) */}
      {(activeTab === 'samar-dashboard' || activeTab === 'todays-agenda') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Today&apos;s Operational Execution Queue</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tasks actively scheduled for today. Start a task to record official timestamp for Husni supervisor review.
              </p>
            </div>

            {/* Capacity Status Cards & Reconciled Breakdown */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-[9px] uppercase font-bold text-emerald-800 tracking-wider">Authorized Today</div>
                <div className="text-sm font-black text-emerald-700">{workloadBuckets.authorizedCapacityToday ?? 5} hrs</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <div className="text-[9px] uppercase font-bold text-blue-800 tracking-wider">Scheduled Today</div>
                <div className="text-sm font-black text-blue-700">{workloadBuckets.validScheduledHoursToday ?? 0} hrs</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-[9px] uppercase font-bold text-amber-800 tracking-wider">Waiting Prereq</div>
                <div className="text-sm font-black text-amber-700">{workloadBuckets.waitingPrerequisiteHours ?? 10} hrs</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
                <div className="text-[9px] uppercase font-bold text-purple-800 tracking-wider">Scheduled This Wk</div>
                <div className="text-sm font-black text-purple-700">{workloadBuckets.scheduledThisWeekHours ?? 4} hrs</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-center">
                <div className="text-[9px] uppercase font-bold text-emerald-900 tracking-wider">Remaining Today</div>
                <div className="text-sm font-black text-emerald-800">{workloadBuckets.remainingCapacityToday ?? 5} hrs</div>
              </div>
            </div>
          </div>

          {/* If 0 Active Scheduled Tasks: Show Clean State */}
          {activeExecutionTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No Execution Workload Currently Scheduled for Today</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  You have <strong className="text-emerald-600">5.0 hours of available capacity today</strong>. {allPendingItems.length > 0 ? `${allPendingItems.length} approved agenda items are waiting in your Pending Acceptance queue.` : 'Your active queue is clear.'}
                </p>
              </div>

              {allPendingItems.length > 0 && (
                <button
                  id="btn-goto-pending-from-empty"
                  onClick={() => setActiveTab('pending-acceptance')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>REVIEW {allPendingItems.length} PENDING ITEMS</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activeExecutionTasks.map((task) => (
                <div key={task.id} className="bg-slate-50 border border-slate-200 hover:border-slate-300 p-5 rounded-2xl transition space-y-3">
                  
                  {/* Hierarchy & Scheduled Context Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    {task.projectName && (
                      <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
                        <Layers className="h-3 w-3 text-indigo-600" />
                        {task.projectName}
                      </span>
                    )}

                    {task.masterAgendaItemId && (
                      <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded font-bold">
                        Master Item: {task.masterAgendaItemId}
                      </span>
                    )}

                    {task.plannedStartAt && (
                      <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-bold">
                        Planned: {task.plannedStartAt} → {task.plannedDueAt || task.dueDate}
                      </span>
                    )}

                    {task.estimatedEffortHours && (
                      <span className="bg-slate-200 text-slate-800 border border-slate-300 px-2 py-0.5 rounded font-medium">
                        Effort: {task.estimatedEffortHours}h ({task.remainingEffortHours ?? task.estimatedEffortHours}h left)
                      </span>
                    )}

                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                      {task.status}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">{task.title}</span>
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-300">
                          {task.moduleCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        task.priority.includes('P3') ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        task.priority.includes('P5') ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                        'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-semibold">{task.dueDate}</span>
                    </div>
                  </div>

                  {/* Execution Timestamp Badge if started */}
                  {task.startedAt ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="font-bold">{task.startedAt}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Execution Recorded</span>
                      </div>
                      {task.startAuditData && (
                        <div className="text-[10px] text-emerald-700/80 font-mono pt-1 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-x-4">
                          <span>Timezone: {task.startAuditData.timeZone}</span>
                          <span>UTC Offset: {task.startAuditData.utcOffset}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      Performance timestamp will be recorded automatically upon starting.
                    </div>
                  )}

                  {/* Action Controls for Active Task */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                    {(task.id === 'TSK-324-00' || task.masterAgendaItemId === 'MA-324-00') && (
                      <button
                        id={`btn-open-course-setup-${task.id}`}
                        onClick={() => setActiveTab('course-setup')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>OPEN COURSE SETUP WORKSPACE</span>
                      </button>
                    )}

                    {!task.startedAt && task.status !== 'COMPLETED' && (
                      <button
                        id={`btn-start-task-${task.id}`}
                        onClick={() => onStartTask(task.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>START TASK</span>
                      </button>
                    )}

                    <button
                      id={`btn-upload-evidence-${task.id}`}
                      onClick={() => setUploadEvidenceModalTask(task)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5 text-slate-600" />
                      <span>ATTACH EVIDENCE</span>
                    </button>

                    <button
                      id={`btn-complete-task-${task.id}`}
                      onClick={() => setSubmitResultModalTask(task)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      SUBMIT RESULT
                    </button>

                    <button
                      id={`btn-report-blocker-${task.id}`}
                      onClick={() => setBlockerModalTaskId(task.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    >
                      <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
                      <span>REPORT BLOCKER</span>
                    </button>

                    <button
                      id={`btn-submit-qa-${task.id}`}
                      onClick={() => onSubmitForQA(task.id)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition ml-auto flex items-center space-x-1 cursor-pointer shadow-xs"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>SUBMIT FOR QA</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LOWER SECTION: Controlled Documents & Supervisor Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Samar Documents */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Controlled Documents in Development</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">CB-9120</span>
            </div>

            {/* Project Filter for Documents */}
            <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold">
              <span className="text-slate-500 text-[11px] font-bold mr-1">Project Scope:</span>
              <button
                id="btn-doc-scope-prj324"
                onClick={() => setDocProjectFilter('PRJ-324')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] font-bold ${
                  docProjectFilter === 'PRJ-324'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                PRJ-324 (Active Focus • 0)
              </button>
              <button
                id="btn-doc-scope-prjfsvp"
                onClick={() => setDocProjectFilter('PRJ-FSVP-01')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] font-bold ${
                  docProjectFilter === 'PRJ-FSVP-01'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                PRJ-FSVP-01 (Other • {myDocs.length})
              </button>
              <button
                id="btn-doc-scope-all"
                onClick={() => setDocProjectFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] font-bold ${
                  docProjectFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Projects
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 mb-4 flex items-start space-x-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Governance Rule:</strong> Samar Baydoun cannot self-approve controlled documents. Official approval is granted exclusively by Husni Hasan.
              </span>
            </div>

            {docProjectFilter === 'PRJ-324' ? (
              <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">PRJ-324 — No Predefined Controlled Documents</h4>
                <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Per governance mandates, <strong>PRJ-324</strong> does not inherit old prototype baseline assets. Document opportunities emerge organically from Samar&apos;s Client-Driven Study deliverables and governed QA submission workflow.
                </p>
                <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50/80 border border-indigo-200 px-2 py-0.5 rounded inline-block">
                  Lifecycle: Client Study → Module Package → Asset Proposal → QA → Supervisor Sign-off
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {myDocs.map((doc) => (
                  <div key={doc.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{doc.documentName}</span>
                        <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[9px] font-extrabold px-2 py-0.5 rounded">
                          PRJ-FSVP-01 • OTHER ASSIGNED PROJECT (Legacy Prototype Baseline)
                        </span>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-300">
                        {doc.currentStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{doc.description}</p>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>Doc ID: {doc.id} • Code: {doc.code}</span>
                      <span>Version: {doc.version}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('documents')}
            className="mt-4 text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center justify-end space-x-1 cursor-pointer pt-3 border-t border-slate-100"
          >
            <span>Open Controlled Documents Center</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Supervisor Feedback & Follow-Ups */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <MessageSquareQuote className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Supervisor Guidance & Follow-Ups</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">SB-9100</span>
            </div>

            {/* Project Filter for Guidance */}
            <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold">
              <span className="text-slate-500 text-[11px] font-bold mr-1">Project Scope:</span>
              <button
                id="btn-guidance-scope-prj324"
                onClick={() => setGuidanceProjectFilter('PRJ-324')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] font-bold ${
                  guidanceProjectFilter === 'PRJ-324'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                PRJ-324 (Active Focus)
              </button>
              <button
                id="btn-guidance-scope-prjfsvp"
                onClick={() => setGuidanceProjectFilter('PRJ-FSVP-01')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] font-bold ${
                  guidanceProjectFilter === 'PRJ-FSVP-01'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                PRJ-FSVP-01 (Other)
              </button>
              <button
                id="btn-guidance-scope-all"
                onClick={() => setGuidanceProjectFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] font-bold ${
                  guidanceProjectFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Projects
              </button>
            </div>

            <div className="space-y-3">
              {/* PRJ-324 Guidance Item */}
              {(guidanceProjectFilter === 'PRJ-324' || guidanceProjectFilter === 'ALL') && (
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-indigo-950">Husni Hasan (Supervisor):</span>
                      <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-[9px] font-extrabold px-2 py-0.5 rounded">
                        PRJ-324 • ACTIVE FOCUS
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-500 font-mono">Today, 09:00 AM EDT</span>
                  </div>
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    &ldquo;Welcome to PRJ-324. Please begin with Course Setup & Study Planning (MA-324-00 / TSK-324-00) scheduled for today (09:00 AM – 01:00 PM EDT). Verify your required regulatory reading (21 CFR 1.500–1.514) and configure your study timetable. Module 1 remains locked until Course Setup is signed off.&rdquo;
                  </p>
                </div>
              )}

              {/* Other Assigned Project / Legacy Guidance & Follow-ups */}
              {(guidanceProjectFilter === 'PRJ-FSVP-01' || guidanceProjectFilter === 'ALL') && (
                <>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800">Husni Hasan (Supervisor):</span>
                        <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[9px] font-bold px-2 py-0.5 rounded">
                          PRJ-FSVP-01 • OTHER ASSIGNED PROJECT (Legacy Prototype)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">2026-08-08, 09:30 AM EST</span>
                    </div>
                    <p className="text-xs text-slate-700 italic">
                      &ldquo;Great progress on the FSVP foreign supplier verification SOP. Please ensure hazard analysis references 21 CFR 1.506 specifically for spice suppliers.&rdquo;
                    </p>
                  </div>

                  {followUps.slice(0, 2).map((f) => (
                    <div key={f.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">{f.subject}</span>
                        <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[9px] font-bold px-1.5 py-0.2 rounded">
                          PRJ-FSVP-01 • Follow-up ({f.id})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">{f.notes}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Stakeholder: {f.stakeholder} • Due: {f.dueDate}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('follow-ups')}
            className="mt-4 text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center justify-end space-x-1 cursor-pointer pt-3 border-t border-slate-100"
          >
            <span>View All Follow-Ups</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* 1. CAPACITY GATE CONFLICT MODAL */}
      {capacityConflict && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertTriangle className="h-5 w-5" />
                <span>Capacity Gate Conflict Detected</span>
              </div>
              <button
                onClick={() => setCapacityConflict(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-rose-900 text-sm">{capacityConflict.itemTitle}</div>
              <p className="text-rose-800">
                {capacityConflict.validation.rejectionReason || 'Adding this item exceeds the allocated project capacity or weekly available hours.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-rose-200 font-mono text-[11px]">
                <div className="bg-white p-2 rounded border border-rose-100">
                  <span className="text-slate-500 block text-[9px]">PROJECT ALLOC</span>
                  <strong className="text-slate-900">{capacityConflict.validation.allocatedProjectHours}h / wk</strong>
                </div>
                <div className="bg-white p-2 rounded border border-rose-100">
                  <span className="text-slate-500 block text-[9px]">CONSUMED</span>
                  <strong className="text-slate-900">{capacityConflict.validation.consumedProjectHours}h</strong>
                </div>
                <div className="bg-white p-2 rounded border border-rose-100">
                  <span className="text-slate-500 block text-[9px]">ITEM EFFORT</span>
                  <strong className="text-rose-600">{capacityConflict.validation.requestedEffortHours}h</strong>
                </div>
                <div className="bg-white p-2 rounded border border-rose-100">
                  <span className="text-slate-500 block text-[9px]">SHORTAGE</span>
                  <strong className="text-rose-700">{capacityConflict.validation.shortageHours}h</strong>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Available Resolution Options (Select One):
              </h4>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => {
                    const item = allPendingItems.find(i => i.id === capacityConflict.itemId);
                    setCapacityConflict(null);
                    if (item) {
                      setEffortChangeModalItem({
                        id: item.id,
                        title: item.title,
                        currentEffort: item.estimatedEffortHours
                      });
                      setProposedEffort(Math.max(1, item.estimatedEffortHours - capacityConflict.validation.shortageHours));
                    }
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <strong className="text-slate-900">1. Reduce Estimated Effort</strong>
                    <p className="text-[11px] text-slate-500">Split task or reduce initial scope to fit within remaining {capacityConflict.validation.remainingProjectHours}h.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    const item = allPendingItems.find(i => i.id === capacityConflict.itemId);
                    setCapacityConflict(null);
                    if (item) {
                      setScheduleChangeModalItem({
                        id: item.id,
                        title: item.title,
                        currentDueDate: item.dueDate
                      });
                    }
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <strong className="text-slate-900">2. Move to Next Working Day / Week</strong>
                    <p className="text-[11px] text-slate-500">Schedule this deliverable into next week&apos;s fresh capacity window.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    const item = allPendingItems.find(i => i.id === capacityConflict.itemId);
                    setCapacityConflict(null);
                    if (item) {
                      setDeferModalItem({
                        id: item.id,
                        title: item.title
                      });
                    }
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <strong className="text-slate-900">3. Defer Item</strong>
                    <p className="text-[11px] text-slate-500">Move to DEFERRED status while preserving Master Agenda linkage.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    const item = allPendingItems.find(i => i.id === capacityConflict.itemId);
                    setCapacityConflict(null);
                    if (item) {
                      setAskSupervisorModalItem({
                        id: item.id,
                        title: item.title
                      });
                      setSupervisorQuestion(`Capacity Conflict: Item requires ${item.estimatedEffortHours}h but project allocation has ${capacityConflict.validation.remainingProjectHours}h remaining. Requesting project allocation increase or supervisor override.`);
                    }
                  }}
                  className="w-full text-left p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <strong className="text-indigo-950">4. Request Supervisor Allocation Rebalance</strong>
                    <p className="text-[11px] text-indigo-700">Submit formal request to Husni Hasan to adjust weekly project allocation from buffer.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROPOSE SCHEDULE CHANGE MODAL */}
      {scheduleChangeModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Propose Schedule Change</span>
              </div>
              <button onClick={() => setScheduleChangeModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900">{scheduleChangeModalItem.title}</span>
              <p>Current Target Due: <span className="font-mono font-bold text-indigo-600">{scheduleChangeModalItem.currentDueDate}</span></p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Proposed Target Due Date</label>
                <input
                  type="date"
                  value={proposedDueDate}
                  onChange={(e) => setProposedDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason / Justification for Schedule Change</label>
                <textarea
                  value={scheduleChangeReason}
                  onChange={(e) => setScheduleChangeReason(e.target.value)}
                  placeholder="e.g. Aligning with MSU course module timeline and foreign supplier record retrieval..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setScheduleChangeModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onRequestScheduleChange && scheduleChangeModalItem) {
                    onRequestScheduleChange(scheduleChangeModalItem.id, proposedDueDate, scheduleChangeReason);
                  }
                  setScheduleChangeModalItem(null);
                  setAcceptanceNotice(`✓ Schedule change request logged for "${scheduleChangeModalItem.title}".`);
                  setTimeout(() => setAcceptanceNotice(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Submit Schedule Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROPOSE EFFORT CHANGE MODAL */}
      {effortChangeModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Adjust Effort Hours Estimate</span>
              </div>
              <button onClick={() => setEffortChangeModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900">{effortChangeModalItem.title}</span>
              <p>Current Estimate: <span className="font-mono font-bold text-emerald-600">{effortChangeModalItem.currentEffort} Hours</span></p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Proposed Effort Hours</label>
                <input
                  type="number"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={proposedEffort}
                  onChange={(e) => setProposedEffort(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Estimate Adjustment</label>
                <textarea
                  value={effortChangeReason}
                  onChange={(e) => setEffortChangeReason(e.target.value)}
                  placeholder="e.g. Comprehensive hazard matrix synthesis requires 4 hours instead of 2..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEffortChangeModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onRequestEffortChange && effortChangeModalItem) {
                    onRequestEffortChange(effortChangeModalItem.id, proposedEffort, effortChangeReason);
                  }
                  setEffortChangeModalItem(null);
                  setAcceptanceNotice(`✓ Effort adjusted to ${proposedEffort}h for "${effortChangeModalItem.title}".`);
                  setTimeout(() => setAcceptanceNotice(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Save Effort Estimate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DEFER WORK MODAL */}
      {deferModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
                <Clock className="w-5 h-5" />
                <span>Defer Work Item</span>
              </div>
              <button onClick={() => setDeferModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900">{deferModalItem.title}</span>
              <p className="text-[11px] text-amber-700">
                Deferring will move this item out of the active operational queue without deleting Master Agenda history.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1">Reason for Deferral</label>
              <textarea
                value={deferReason}
                onChange={(e) => setDeferReason(e.target.value)}
                placeholder="e.g. Awaiting completed supplier intake records from client..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeferModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeferAgendaItem && deferModalItem) {
                    onDeferAgendaItem(deferModalItem.id, deferReason);
                  }
                  setDeferModalItem(null);
                  setAcceptanceNotice(`✓ Deferred "${deferModalItem.title}".`);
                  setTimeout(() => setAcceptanceNotice(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Confirm Deferral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ASK SUPERVISOR MODAL */}
      {askSupervisorModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                <span>Ask Supervisor (Husni Hasan)</span>
              </div>
              <button onClick={() => setAskSupervisorModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900">{askSupervisorModalItem.title}</span>
              <p>Ask a question or request guidance directly regarding this deliverable.</p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1">Your Question or Clarification Request</label>
              <textarea
                value={supervisorQuestion}
                onChange={(e) => setSupervisorQuestion(e.target.value)}
                placeholder="e.g. Should I focus on processed spice hazard analysis first, or complete the general foreign supplier audit SOP?"
                rows={4}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setAskSupervisorModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onAskSupervisor && askSupervisorModalItem) {
                    onAskSupervisor(askSupervisorModalItem.id, supervisorQuestion);
                  }
                  setAskSupervisorModalItem(null);
                  setAcceptanceNotice(`✓ Question sent to Husni Hasan regarding "${askSupervisorModalItem.title}".`);
                  setTimeout(() => setAcceptanceNotice(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Husni</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. VIEW REQUIREMENTS MODAL */}
      {viewRequirementsItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Deliverable & Module Requirements</span>
              </div>
              <button onClick={() => setViewRequirementsItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {'taskTitle' in viewRequirementsItem ? viewRequirementsItem.taskTitle : viewRequirementsItem.title}
                </h3>
                <p className="text-slate-600 mt-1">
                  {'objective' in viewRequirementsItem ? viewRequirementsItem.objective : viewRequirementsItem.description}
                </p>
              </div>

              {'learningObjectives' in viewRequirementsItem && viewRequirementsItem.learningObjectives && (
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
                  <h4 className="font-bold text-blue-950 uppercase tracking-wider text-[11px]">Learning Objectives:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {viewRequirementsItem.learningObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {'requiredTopics' in viewRequirementsItem && viewRequirementsItem.requiredTopics && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">11 Core Course Topics:</h4>
                  <ul className="list-decimal pl-5 space-y-1 text-slate-700">
                    {viewRequirementsItem.requiredTopics.map((topic, i) => (
                      <li key={i}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}

              {'requiredReading' in viewRequirementsItem && viewRequirementsItem.requiredReading && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1">Required Regulatory Reading:</strong>
                  <div className="text-slate-700 font-mono text-[11px]">
                    {viewRequirementsItem.requiredReading.join(' • ')}
                  </div>
                </div>
              )}

              {'evidenceRequirement' in viewRequirementsItem && viewRequirementsItem.evidenceRequirement && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-950">
                  <strong className="block mb-1">Evidence & Verification Criteria:</strong>
                  <div>{viewRequirementsItem.evidenceRequirement}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewRequirementsItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Requirements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT BLOCKER MODAL */}
      {blockerModalTaskId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-base">
              <AlertOctagon className="h-5 w-5" />
              <span>Report Operational Blocker</span>
            </div>
            <p className="text-xs text-slate-600">
              Reporting a blocker will notify Husni Hasan for supervisor assistance and flag the task status as BLOCKED.
            </p>
            <textarea
              value={blockerText}
              onChange={(e) => setBlockerText(e.target.value)}
              placeholder="Describe the blocker (e.g. Awaiting client DUNS number or FDA registration verification)..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-rose-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setBlockerModalTaskId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlockerSubmit(blockerModalTaskId)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                Submit Blocker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT TASK RESULT MODAL */}
      {submitResultModalTask && (
        <SubmitResultModal
          task={submitResultModalTask}
          onClose={() => setSubmitResultModalTask(null)}
          onSubmitResult={(taskId, data) => {
            if (onSubmitTaskResult) {
              onSubmitTaskResult(taskId, data);
            } else {
              onCompleteTask(taskId);
            }
          }}
        />
      )}

      {/* UPLOAD EVIDENCE MODAL */}
      {uploadEvidenceModalTask && (
        <UploadEvidenceModal
          task={uploadEvidenceModalTask}
          onClose={() => setUploadEvidenceModalTask(null)}
          onConfirmUpload={(taskId, data) => {
            onUploadEvidence(taskId, data);
            setUploadEvidenceModalTask(null);
          }}
        />
      )}

      {/* VIEW EVIDENCE MODAL */}
      {viewEvidenceModalTask && (
        <ViewEvidenceModal
          task={viewEvidenceModalTask}
          onClose={() => setViewEvidenceModalTask(null)}
          onOpenUploadNew={() => {
            setUploadEvidenceModalTask(viewEvidenceModalTask);
            setViewEvidenceModalTask(null);
          }}
          onRemoveEvidence={onRemoveEvidence}
        />
      )}

    </div>
  );
};
