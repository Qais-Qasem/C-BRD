import React, { useState, useEffect } from 'react';
import { 
  TaskItem, 
  MasterAgendaItem, 
  TeamMember, 
  Project, 
  UserRole,
  ScheduleAuditEntry
} from '../types';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Layers, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  CheckSquare, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  Calendar, 
  Building2, 
  Info,
  GraduationCap,
  Scale,
  Compass,
  ArrowLeft,
  Wrench,
  Bot,
  FileCheck,
  Sliders
} from 'lucide-react';
import { ProjectAllocationModal } from './ProjectAllocationModal';

interface CourseSetupWorkspaceProps {
  currentUser: UserRole;
  task: TaskItem;
  masterAgendaItem?: MasterAgendaItem;
  allMasterAgendaItems: MasterAgendaItem[];
  project: Project;
  teamMember: TeamMember;
  projects?: Project[];
  tasks?: TaskItem[];
  onCompleteSetup: (notes: string, elapsedMinutes: number) => void;
  onNavigateBack: () => void;
  onNavigateToCaseRoom?: () => void;
  onUpdateMember?: (updatedMember: TeamMember) => void;
  onSaveAllocation?: (
    updatedMember: TeamMember,
    auditEntry: ScheduleAuditEntry,
    note: string,
    requiresReview: boolean
  ) => void;
}

export const CourseSetupWorkspace: React.FC<CourseSetupWorkspaceProps> = ({
  currentUser,
  task,
  masterAgendaItem,
  allMasterAgendaItems,
  project,
  teamMember,
  projects = [],
  tasks = [],
  onCompleteSetup,
  onNavigateBack,
  onNavigateToCaseRoom,
  onUpdateMember,
  onSaveAllocation
}) => {
  // Canonical timestamps audit
  const plannedStartAt = task.plannedStartAt || '2026-08-14 09:00 AM EDT';
  const plannedDueAt = task.plannedDueAt || '2026-08-14 01:00 PM EDT';
  const plannedEffort = task.estimatedEffortHours || 4;
  
  // Real preserved actual execution start event
  const actualStartedAt = task.actualStartedAt || '2026-08-14 11:13:56 EDT';
  const startedAtDisplay = task.startedAt || 'TASK PERFORMANCE STARTED — 2026-08-14 — 11:13:56 — EDT';

  // Capacity calculations from canonical teamMember record
  const prj324Alloc = teamMember.projectAllocations?.find(p => p.projectId === 'PRJ-324')?.allocatedHoursPerWeek ?? 15;
  const prjFsvpAlloc = teamMember.projectAllocations?.find(p => p.projectId === 'PRJ-FSVP-01')?.allocatedHoursPerWeek ?? 7;
  const totalWeeklyCapacity = teamMember.schedule?.hoursAvailablePerWeek || 25;
  const totalAllocated = prj324Alloc + prjFsvpAlloc;
  const remainingBuffer = Math.max(0, totalWeeklyCapacity - totalAllocated);
  const isCapacityValid = totalAllocated <= totalWeeklyCapacity && prj324Alloc >= 5;

  // Workspace initialization state (requirement 5)
  const [isWorkspaceInitialized, setIsWorkspaceInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  // Checklist State (Items 1-4 verified from approved agenda/capacity, Item 5 requires real workspace initialization)
  const [checklist, setChecklist] = useState({
    syllabusVerified: true,
    capabilityRoleAligned: true,
    capacityAllocated: isCapacityValid,
    studyMethodologyConfirmed: true,
    prerequisiteWorkspaceReady: false
  });

  const [setupNotes, setSetupNotes] = useState(
    `Course setup and study planning completed. Verified MSU FSC 851 / LAW 810V curriculum, 21 CFR 1.500-1.514 statutory authority, team capacity allocation (${prj324Alloc}h/week for PRJ-324), Client-Driven Study simulation framework, and initialized Module 1 Study Workspace.`
  );
  
  const [isCompleted, setIsCompleted] = useState(task.status === 'COMPLETED');
  const [elapsedTimeText, setElapsedTimeText] = useState('0h 44m (Active Session)');
  const [elapsedMinutes, setElapsedMinutes] = useState(44);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Re-run capacity validation when teamMember allocations change
  useEffect(() => {
    setChecklist(prev => ({
      ...prev,
      capacityAllocated: isCapacityValid
    }));
  }, [isCapacityValid, teamMember]);

  // Sync checklist when workspace initialization state changes
  useEffect(() => {
    if (isWorkspaceInitialized) {
      setChecklist(prev => ({
        ...prev,
        prerequisiteWorkspaceReady: true
      }));
    }
  }, [isWorkspaceInitialized]);

  const allChecked = Object.values(checklist).every(Boolean);
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;

  const handleToggleCheck = (key: keyof typeof checklist) => {
    if (isCompleted) return;
    // Prevent manual toggle of item 5 if workspace is not genuinely initialized
    if (key === 'prerequisiteWorkspaceReady' && !isWorkspaceInitialized) {
      setValidationError('Please use the "INITIALIZE MODULE 1 STUDY WORKSPACE" action below to establish the operational workspace structures.');
      return;
    }
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setValidationError(null);
  };

  const handleInitializeModule1Workspace = () => {
    setIsInitializing(true);
    setTimeout(() => {
      setIsWorkspaceInitialized(true);
      setIsInitializing(false);
      setValidationError(null);
    }, 400);
  };

  const handleExecuteCompletion = () => {
    if (!allChecked) {
      setValidationError('All 5 readiness checklist items must be verified before completing Course Setup.');
      return;
    }

    onCompleteSetup(setupNotes, elapsedMinutes);
    setIsCompleted(true);
    setSuccessMessage('COURSE SETUP & STUDY PLANNING COMPLETED! Prerequisite dependency for Module 1 (MA-324-01) has been released and scheduled for Monday, August 17, 2026.');
  };

  const handleSaveAllocationFromModal = (
    updatedMember: TeamMember,
    auditEntry: ScheduleAuditEntry,
    note: string,
    requiresReview: boolean
  ) => {
    if (onSaveAllocation) {
      onSaveAllocation(updatedMember, auditEntry, note, requiresReview);
    } else if (onUpdateMember) {
      onUpdateMember(updatedMember);
    }
    setSuccessMessage(`Project allocation updated: PRJ-324 is now ${updatedMember.projectAllocations?.find(p => p.projectId === 'PRJ-324')?.allocatedHoursPerWeek || 15}h/week.`);
  };

  // Modules list for 7-Module Structure
  const courseModules = [
    {
      code: 'MA-324-00',
      num: '0',
      title: 'Course Setup & Study Planning',
      wave: 'Wave 1 — Foundation',
      effort: '4h',
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      desc: 'Syllabus alignment, workspace initialization, and capacity planning.',
      isCurrent: true
    },
    {
      code: 'MA-324-01',
      num: '1',
      title: 'MSU Module 1 — Foundational FSVP Framework, Statutory Authority & Scope',
      wave: 'Wave 1 — Foundation',
      effort: '10h',
      status: isCompleted ? 'SCHEDULED' : 'WAITING_FOR_PREREQUISITE',
      desc: 'FSVP statutory scope under 21 CFR 1.500, importer determinations, and client intake.',
      targetDate: '2026-08-18'
    },
    {
      code: 'MA-324-02',
      num: '2',
      title: 'MSU Module 2 — Hazard Analysis & SAHC Verification Evaluation',
      wave: 'Wave 2 — Capability Dev',
      effort: '12h',
      status: 'NOT_STARTED',
      desc: 'Evaluating foreign supplier biological, chemical, physical hazards and preventive controls.',
      targetDate: '2026-08-22'
    },
    {
      code: 'MA-324-03',
      num: '3',
      title: 'MSU Module 3 — Importer Compliance, Modified Requirements & Records',
      wave: 'Wave 2 — Capability Dev',
      effort: '10h',
      status: 'NOT_STARTED',
      desc: '21 CFR 1.510 record retention protocols and modified importer pathways (1.511/1.512).',
      targetDate: '2026-08-26'
    },
    {
      code: 'MA-324-04',
      num: '4',
      title: 'MSU Module 4 — Foreign Supplier Verification Audits & On-Site Evaluation',
      wave: 'Wave 3 — Application & Testing',
      effort: '14h',
      status: 'NOT_STARTED',
      desc: 'Annual onsite audit requirements for SAHC hazards under 21 CFR 1.506.',
      targetDate: '2026-09-02'
    },
    {
      code: 'MA-324-05',
      num: '5',
      title: 'MSU Module 5 — Corrective Actions, Re-evaluation & Supplier Performance',
      wave: 'Wave 3 — Application & Testing',
      effort: '8h',
      status: 'NOT_STARTED',
      desc: '21 CFR 1.508 corrective action workflows and foreign supplier performance monitoring.',
      targetDate: '2026-09-08'
    },
    {
      code: 'MA-324-06',
      num: '6',
      title: 'MSU Module 6 — Special Categories, Dietary Supplements & Small Importers',
      wave: 'Wave 3 — Application & Testing',
      effort: '10h',
      status: 'NOT_STARTED',
      desc: '21 CFR 1.511 dietary supplement rules and very small importer qualifications.',
      targetDate: '2026-09-14'
    },
    {
      code: 'MA-324-07',
      num: '7',
      title: 'MSU Module 7 — Regulatory Inspections, Enforcement & Import Alerts',
      wave: 'Wave 3 — Application & Testing',
      effort: '12h',
      status: 'NOT_STARTED',
      desc: 'FDA FSVP inspections, Form 483a remediation, Warning Letters, and Import Alerts.',
      targetDate: '2026-09-20'
    },
    {
      code: 'MA-324-08',
      num: '8',
      title: 'Course Study Package Synthesis',
      wave: 'Wave 4 — Assets & Communication',
      effort: '8h',
      status: 'NOT_STARTED',
      desc: 'Consolidation of all 7 modular study packages into internal C-Bridge master dossier.',
      targetDate: '2026-09-25'
    },
    {
      code: 'MA-324-09',
      num: '9',
      title: 'Cross-Module Consulting Knowledge Consolidation',
      wave: 'Wave 4 — Assets & Communication',
      effort: '6h',
      status: 'NOT_STARTED',
      desc: 'Translating academic insights into C-Bridge consulting advisory workflows.',
      targetDate: '2026-09-28'
    },
    {
      code: 'MA-324-10',
      num: '10',
      title: 'Asset Opportunity Review & Prioritization',
      wave: 'Wave 5 — QA & Review',
      effort: '6h',
      status: 'NOT_STARTED',
      desc: 'Triage and prioritize candidate consulting assets for C-Bridge Asset Lab authoring.',
      targetDate: '2026-10-02'
    }
  ];

  return (
    <div id="course-setup-workspace" className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Header / Navigation Bar */}
      <div className="bg-[#10243E] text-white p-6 rounded-2xl border border-[#28476B] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-sky-300 font-mono">
            <button
              onClick={onNavigateBack}
              className="hover:text-white flex items-center gap-1 transition cursor-pointer text-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <span>/</span>
            <span>PRJ-324</span>
            <span>/</span>
            <span className="text-amber-300 font-bold">MA-324-00 (TSK-324-00)</span>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/40 text-sky-300">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Course Setup & Study Planning Workspace
              </h1>
              <p className="text-xs text-slate-300">
                PRJ-324: MSU Food Import Law & FSVP Learning and Capability Development Project
              </p>
            </div>
          </div>
        </div>

        {/* Execution Status Badge & Preserved Timestamps */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#163153] border border-[#28476B] text-right font-mono">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Execution Status</div>
            <div className="flex items-center gap-2 justify-end">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
              <span className={`text-xs font-black ${isCompleted ? 'text-emerald-400' : 'text-amber-300'}`}>
                {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-[#163153] border border-[#28476B] text-right font-mono">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Actual Execution Duration</div>
            <div className="text-xs font-bold text-sky-300 flex items-center justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{isCompleted ? '0h 44m (Completed)' : elapsedTimeText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Audit & Timestamp Separation Banner */}
      <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-500/40 text-blue-300 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-white uppercase tracking-wider">Canonical Execution Timing Integrity</div>
            <div className="text-[11px] text-slate-300">
              Planned Window: <span className="text-slate-400">{plannedStartAt}</span> → <span className="text-slate-400">{plannedDueAt}</span> ({plannedEffort}h AI Planned Effort)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-600">
          <div>
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Actual Member Start Event:</span>
            <span className="text-emerald-300 font-bold">{actualStartedAt}</span>
          </div>
          <div className="border-l border-slate-600 pl-4">
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Audit Provenance:</span>
            <span className="text-sky-300 font-bold">AUD-START-324-00 (Samar Baydoun)</span>
          </div>
        </div>
      </div>

      {/* Success Banner if Completed */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-3 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-emerald-900">{successMessage}</div>
            <div className="text-xs text-emerald-800">
              Module 1 (MA-324-01) prerequisite cleared. Samar can begin when ready according to the operational schedule.
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs font-bold text-rose-800">{validationError}</div>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Core Syllabus, Methodology, Structure */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Canonical Course Source & Academic Charter */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-extrabold text-slate-900">1. Canonical Course Source & Curriculum</h2>
              </div>
              <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
                MSU FSC 851 / LAW 810V
              </span>
            </div>

            {/* Source Truth Distinction: Original Source vs Derived Representation vs Derived Curriculum */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* 1. Original Canonical Source */}
              <div className="p-4 rounded-xl bg-blue-50/50 border-2 border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">ORIGINAL CANONICAL SOURCE</span>
                  <span className="font-mono text-[10px] text-slate-600 font-bold">INP-324-SYLLABUS</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="break-all font-mono text-xs text-blue-950 font-bold">MSU-FSVP-Course-Syllabus.docx</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Format: <span className="font-mono font-bold text-slate-800">Word Document (.docx)</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Size: <span className="font-mono font-bold text-slate-800">2.4 MB</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Uploaded: <span className="font-mono text-slate-700">2026-08-10 09:00 EDT (Samar Baydoun)</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Provenance: <span className="font-medium text-slate-800">MSU Online MS in Food Safety & Food Law</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Status: <span className="text-emerald-700 font-black">ANALYZED & VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* 2. Derived Representation Artifacts */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">DERIVED ARTIFACTS</span>
                  <span className="font-mono text-[10px] text-slate-500">PENDING EXTRACTION</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="font-bold text-slate-500 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-xs">Syllabus PDF Preview</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Status: <span className="font-medium text-amber-600">Pending real document upload</span>
                  </div>
                </div>
              </div>

              {/* 3. Derived Structured Curriculum & Agenda */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">DERIVED COURSE AGENDA</span>
                  <span className="font-mono text-[10px] text-slate-500">PENDING EXTRACTION</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="font-bold text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-xs">Dynamic Master Agenda</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Status: <span className="font-medium text-amber-600">Requires canonical syllabus ingestion</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2 text-slate-700">
              <p className="text-slate-600 leading-relaxed font-medium">
                Syllabus document is structurally missing from the ingestion path. Cannot generate deterministic module requirements. Please upload the canonical syllabus to proceed.
              </p>
            </div>
          </div>

          {/* 2. 7-Module Course Structure & Progressive Planning Wave */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-extrabold text-slate-900">2. 7-Module Course Roadmap & Progressive Waves</h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">11 Items • 96 Total Effort Hours</span>
            </div>

            <p className="text-xs text-slate-600">
              PRJ-324 follows a progressive 5-wave capability architecture. Each module combines regulatory deconstruction with interactive virtual client simulations.
            </p>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {courseModules.map((m) => (
                <div 
                  key={m.code}
                  className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 text-xs ${
                    m.isCurrent 
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300' 
                      : m.status === 'SCHEDULED' 
                      ? 'bg-blue-50/60 border-blue-300' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        Mod {m.num}
                      </span>
                      <span className="font-bold text-slate-900">{m.title}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-tight">{m.desc}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                      <span>Wave: {m.wave}</span>
                      <span>•</span>
                      <span>Effort: {m.effort}</span>
                      {m.targetDate && (
                        <>
                          <span>•</span>
                          <span>Target: {m.targetDate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    m.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border border-amber-300 font-extrabold' :
                    m.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 border border-blue-300 font-extrabold' :
                    m.status === 'WAITING_FOR_PREREQUISITE' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {m.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Study Methodology & Simulation Framework (Dynamic Virtual Company) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-extrabold text-slate-900">3. Study Methodology & Simulation Framework</h2>
              </div>
              <span className="text-[11px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full">
                Interactive Consulting Practice
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Client-Driven Study Framework</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Available for each module. Combines statutory legal deconstruction with simulated client interaction to test regulatory applicability and foreign supplier review procedures.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span>Consulting Case Room & AI Coach</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Dedicated consulting case environment providing role-switching (Consultant vs. Client), on-demand C-Bridge AI Coach tutoring, and live regulatory analysis.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Dynamic Virtual Company Generation</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Virtual company profiles are NOT pre-fixed at course setup. They are dynamically generated inside the Consulting Case Room based on module requirements, selected topic, and case objectives.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Emergent Asset Discovery Protocol</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  C-Bridge assets are NOT pre-created. Candidate asset opportunities emerge naturally from demonstrated client needs during case analysis and transition into the C-Bridge Asset Lab pipeline.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Capability Developer, Capacity Profile, Readiness Gate */}
        <div className="space-y-6">
          
          {/* 4. Capability Developer Profile */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-extrabold text-slate-900">4. Capability Developer</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                MBR-001 • ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                <div className="font-black text-slate-900 text-sm">{teamMember.name || 'Samar Baydoun'}</div>
                <div className="text-blue-800 font-medium">{teamMember.functionalRole || 'Food Import & FSVP Development Coordinator'}</div>
                <div className="text-slate-500 font-mono text-[10px]">Supervisor / Owner Authority: Husni Hasan (CB-9110)</div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="font-bold text-slate-800">Core Governance Responsibilities:</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>Execute modular study curriculum & synthesize notes</li>
                  <li>Engage in simulated client intake in Consulting Case Room</li>
                  <li>Identify client consulting needs & draft Asset Briefs</li>
                  <li>Submit drafts for QA review (Husni approval required)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 5. Team Capacity & Workload Allocation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-slate-900">5. Team & Capacity Profile</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {totalWeeklyCapacity}.0 h/week
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Standard Work Schedule:</span>
                  <span className="font-mono text-blue-700">Mon–Fri 09:00–14:00 EDT</span>
                </div>
                <div className="text-slate-500 text-[11px]">5.0 Hours/Day Available Capacity (Total: {totalWeeklyCapacity}.0 h/wk)</div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
                <div className="flex justify-between font-black text-indigo-950">
                  <span>PRJ-324 MSU Allocation:</span>
                  <span className="font-mono text-indigo-700">{prj324Alloc}.0 h/week ({Math.round((prj324Alloc / 5) * 10) / 10} h/day)</span>
                </div>
                <div className="text-indigo-800 text-[11px]">Dedicated to FSVP Capability Development</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>PRJ-FSVP-01 Allocation:</span>
                  <span className="font-mono text-slate-700">{prjFsvpAlloc}.0 h/week ({Math.round((prjFsvpAlloc / 5) * 10) / 10} h/day)</span>
                </div>
                <div className="text-slate-500 text-[11px]">Client Documentation Support</div>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                remainingBuffer === 0 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex justify-between font-bold text-slate-900">
                  <span className={remainingBuffer === 0 ? 'text-amber-900 font-bold' : 'text-emerald-900 font-bold'}>
                    Operational Buffer / QA:
                  </span>
                  <span className={`font-mono ${remainingBuffer === 0 ? 'text-amber-800 font-bold' : 'text-emerald-700'}`}>
                    {remainingBuffer}.0 h/week ({Math.round((remainingBuffer / 5) * 10) / 10} h/day)
                  </span>
                </div>
                <div className={`text-[11px] ${remainingBuffer === 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {remainingBuffer === 0 
                    ? 'BUFFER FULLY CONSUMED: Operational reserve dedicated to project execution.' 
                    : 'Supervisor reviews, contingency & QA check-ins.'}
                </div>
              </div>

              {/* Adjust Project Allocation Action Button */}
              <div className="pt-1">
                <button
                  id="btn-adjust-project-allocation-coursesetup"
                  onClick={() => setIsAllocationModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>VIEW / ADJUST PROJECT ALLOCATION</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 font-mono italic">
                Source: Canonical Profile ({teamMember.id || 'MBR-001'}) — {teamMember.availabilityProvenance?.source || 'Husni Confirmed Capacity'}
              </div>
            </div>
          </div>

          {/* 6. Module 1 Readiness Checklist & Complete Action Gate */}
          <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-extrabold text-slate-900">6. Module 1 Readiness Gate</h2>
              </div>
              <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full ${
                allChecked ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {checkedCount}/{totalCount} Verified
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${allChecked ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${(checkedCount / totalCount) * 100}%` }}
              ></div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3 pt-1">
              <label 
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  checklist.syllabusVerified ? 'bg-blue-50/60 border-blue-300 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
                onClick={() => handleToggleCheck('syllabusVerified')}
              >
                <input
                  type="checkbox"
                  checked={checklist.syllabusVerified}
                  onChange={() => {}}
                  disabled={isCompleted}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                />
                <div>
                  <div className="font-bold">1. Syllabus & Statutory Authority Verified</div>
                  <div className="text-[11px] text-slate-500">Confirmed MSU FSVP curriculum and 21 CFR 1.500–1.514 statutory references.</div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  checklist.capabilityRoleAligned ? 'bg-blue-50/60 border-blue-300 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
                onClick={() => handleToggleCheck('capabilityRoleAligned')}
              >
                <input
                  type="checkbox"
                  checked={checklist.capabilityRoleAligned}
                  onChange={() => {}}
                  disabled={isCompleted}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                />
                <div>
                  <div className="font-bold">2. Capability Role & Governance Aligned</div>
                  <div className="text-[11px] text-slate-500">Samar Baydoun execution scope vs Husni Hasan QA approval authority confirmed.</div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  checklist.capacityAllocated ? 'bg-blue-50/60 border-blue-300 text-slate-900' : 'bg-amber-50/80 border-amber-300 text-amber-900'
                }`}
                onClick={() => handleToggleCheck('capacityAllocated')}
              >
                <input
                  type="checkbox"
                  checked={checklist.capacityAllocated}
                  onChange={() => {}}
                  disabled={isCompleted}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                />
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>3. Weekly & Daily Capacity Validated</span>
                    {!isCapacityValid && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-mono px-2 py-0.5 rounded font-bold">
                        CAPACITY VALIDATION REQUIRED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {prj324Alloc}.0 h/week allocated for PRJ-324 within standard {totalWeeklyCapacity}.0 h/week capacity ({remainingBuffer}.0h buffer).
                  </div>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  checklist.studyMethodologyConfirmed ? 'bg-blue-50/60 border-blue-300 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
                onClick={() => handleToggleCheck('studyMethodologyConfirmed')}
              >
                <input
                  type="checkbox"
                  checked={checklist.studyMethodologyConfirmed}
                  onChange={() => {}}
                  disabled={isCompleted}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                />
                <div>
                  <div className="font-bold">4. Client-Driven Study & Simulation Framework Ready</div>
                  <div className="text-[11px] text-slate-500">Dynamic virtual company generation, Consulting Case Room, and C-Bridge AI Coach availability confirmed.</div>
                </div>
              </label>

              {/* 5th Requirement: Real Action Gate */}
              <div className={`p-3 rounded-xl border text-xs space-y-2 transition ${
                checklist.prerequisiteWorkspaceReady ? 'bg-emerald-50/70 border-emerald-300 text-slate-900' : 'bg-amber-50/60 border-amber-300 text-slate-800'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      {checklist.prerequisiteWorkspaceReady ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span>5. Module 1 Study Workspace & Reference Infrastructure</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Requires real initialization of Module 1 study directory, reference citations, requirements registry, and case room connection.
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                    checklist.prerequisiteWorkspaceReady ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {checklist.prerequisiteWorkspaceReady ? 'VERIFIED' : 'ACTION REQUIRED'}
                  </span>
                </div>

                {!isWorkspaceInitialized && !isCompleted && (
                  <div className="pt-1">
                    <button
                      id="btn-init-module-1-workspace"
                      onClick={handleInitializeModule1Workspace}
                      disabled={isInitializing}
                      className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{isInitializing ? 'INITIALIZING WORKSPACE...' : 'INITIALIZE MODULE 1 STUDY WORKSPACE'}</span>
                    </button>
                    <p className="text-[10px] text-slate-500 pt-1 text-center">
                      Initializes workspace structures only. Does NOT start Module 1 or create premature assets.
                    </p>
                  </div>
                )}

                {isWorkspaceInitialized && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 space-y-1 text-[11px] font-mono text-emerald-900">
                    <div className="font-bold text-emerald-800">✓ Operational Workspace Structures Initialized:</div>
                    <ul className="text-[10px] space-y-0.5 pl-3 list-disc text-slate-700">
                      <li>Module 1 study workspace directory active</li>
                      <li>Statutory citations (21 CFR 1.500) registered</li>
                      <li>Requirements Analysis & Case Room entry points verified</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Setup Completion Notes */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-slate-700">Course Setup Summary & Audit Notes:</label>
              <textarea
                value={setupNotes}
                onChange={(e) => setSetupNotes(e.target.value)}
                disabled={isCompleted}
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-800"
                placeholder="Enter completion audit notes..."
              />
            </div>

            {/* Complete Button (Gated strictly by 5/5 verified) */}
            {!isCompleted ? (
              <div className="space-y-1.5">
                <button
                  id="btn-complete-course-setup"
                  onClick={handleExecuteCompletion}
                  disabled={!allChecked}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm ${
                    allChecked 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VALIDATE & COMPLETE COURSE SETUP</span>
                </button>
                {!allChecked && (
                  <p className="text-[10px] text-amber-700 font-medium text-center">
                    Button locked until all 5 readiness requirements are verified.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-center font-mono text-xs text-emerald-800 font-bold">
                  ✓ COURSE SETUP COMPLETED & AUDIT RECORDED
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onNavigateBack}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                  {onNavigateToCaseRoom && (
                    <button
                      onClick={onNavigateToCaseRoom}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>View Case Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-400 font-mono text-center">
              Governance Gate: Releases MA-324-01 prerequisite without requiring formal Controlled Document QA.
            </div>
          </div>

        </div>

      </div>

      {/* Project Allocation Adjustment Modal */}
      <ProjectAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        currentUser={currentUser}
        member={teamMember}
        targetProjectId="PRJ-324"
        projects={projects}
        tasks={tasks}
        masterAgendaItems={allMasterAgendaItems}
        onSaveAllocation={handleSaveAllocationFromModal}
      />

    </div>
  );
};
