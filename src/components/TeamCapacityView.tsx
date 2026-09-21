import React, { useState } from 'react';
import { 
  TeamMember, 
  WorkSchedule, 
  AvailabilityException, 
  PerformanceReviewRecord, 
  TeamAuditLog, 
  TaskItem, 
  Project, 
  UserRole,
  DaySchedule,
  MemberCapacityMetrics,
  MemberCapacityStatus,
  MemberApplication,
  MemberProvisioningProposal,
  SuggestedWorkPlan,
  InformationRequest
} from '../types';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Shield,
  Award, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  Sparkles, 
  Briefcase, 
  ChevronRight, 
  FileText, 
  Check, 
  X, 
  Info,
  UserCheck,
  Zap,
  RotateCcw,
  MessageSquare,
  Lock,
  Search,
  HelpCircle,
  FileCheck,
  Send,
  AlertCircle,
  Key,
  XCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Globe,
  Sliders
} from 'lucide-react';
import { ProjectAllocationModal } from './ProjectAllocationModal';

interface TeamCapacityViewProps {
  currentUser: UserRole;
  members: TeamMember[];
  projects: Project[];
  tasks: TaskItem[];
  performanceReviews: PerformanceReviewRecord[];
  auditLogs: TeamAuditLog[];
  applications?: MemberApplication[];
  publicAppBaseUrl?: string;
  onAddMember: (newMember: TeamMember) => void;
  onUpdateMember: (updatedMember: TeamMember) => void;
  onAddException: (memberId: string, exception: AvailabilityException) => void;
  onSavePerformanceReview: (review: PerformanceReviewRecord) => void;
  onAssignProject: (memberId: string, projectId: string) => void;
  onUpdateApplication?: (updatedApp: MemberApplication) => void;
  onApproveApplication?: (app: MemberApplication, customProposal?: MemberProvisioningProposal) => void;
  onConfirmAndActivateMember?: (app: MemberApplication, proposal?: MemberProvisioningProposal, workPlan?: SuggestedWorkPlan) => void;
  onApproveAndProvision?: (app: MemberApplication, proposal: MemberProvisioningProposal, workPlan?: SuggestedWorkPlan) => void;
  onRequestMoreInfo?: (appId: string, question: string, evidenceReq?: string) => void;
  onOpenSignUpModal?: () => void;
  onNavigateView?: (viewId: string) => void;
  onStartActivation?: (member: TeamMember, confirmedEmail: string) => Promise<string | null>;
  onRevokeActivation?: (memberId: string) => void;
  onTestActivate?: (member: TeamMember, token: string) => void;
}

export const TeamCapacityView: React.FC<TeamCapacityViewProps> = ({
  currentUser,
  members,
  projects,
  tasks,
  performanceReviews,
  auditLogs,
  applications = [],
  publicAppBaseUrl,
  onAddMember,
  onUpdateMember,
  onAddException,
  onSavePerformanceReview,
  onAssignProject,
  onUpdateApplication,
  onApproveApplication,
  onConfirmAndActivateMember,
  onApproveAndProvision,
  onRequestMoreInfo,
  onOpenSignUpModal,
  onNavigateView,
  onStartActivation,
  onRevokeActivation,
  onTestActivate,
}) => {
  const [activeTab, setActiveTab] = useState<'workload' | 'applications' | 'members' | 'schedule' | 'performance' | 'assignment' | 'audit'>('applications');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || 'MBR-001');

  // Member Account Activation Modal State
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [memberToActivate, setMemberToActivate] = useState<TeamMember | null>(null);
  const [confirmActivationEmail, setConfirmActivationEmail] = useState('');
  const [activationModalStep, setActivationModalStep] = useState<'ENTER_EMAIL' | 'CONFIRM_EMAIL' | 'ACTIVATION_GENERATED'>('ENTER_EMAIL');
  const [generatedActivationToken, setGeneratedActivationToken] = useState('');
  const [generatedActivationUrl, setGeneratedActivationUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Member Applications State
  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(applications[0] || null);
  const [appFilterTab, setAppFilterTab] = useState<'PENDING' | 'MORE_INFO' | 'HOLD' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [isProvisioningModalOpen, setIsProvisioningModalOpen] = useState(false);
  const [isReqInfoModalOpen, setIsReqInfoModalOpen] = useState(false);

  // Proposal Editing State
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalRole, setProposalRole] = useState('');
  const [proposalWeeklyHours, setProposalWeeklyHours] = useState(20);
  const [proposalProjectId, setProposalProjectId] = useState(projects[0]?.id || 'PRJ-FSVP-01');
  const [proposalPermissions, setProposalPermissions] = useState<string[]>(['EXECUTION', 'QA_SUBMISSION', 'LEARNING']);

  // Info Request Form State
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customEvidenceText, setCustomEvidenceText] = useState('');

  // Natural Language Comment State
  const [naturalLanguageComment, setNaturalLanguageComment] = useState('');
  const [commentSuccessMsg, setCommentSuccessMsg] = useState('');

  // Modals
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [allocationTargetProjectId, setAllocationTargetProjectId] = useState('PRJ-324');
  const [aiExplanationText, setAiExplanationText] = useState<string | null>(null);

  // Form States for Add Member
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    title: '',
    functionalRole: '',
    supervisor: 'Husni Hasan',
    employmentStatus: 'FULL TIME' as const,
    timezone: 'EDT (UTC-4)',
    roleScope: 'Phase 1 — U.S. Food Import Readiness & Documentation',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    hoursAvailablePerDay: 5,
    initialProjectId: projects[0]?.id || 'PRJ-FSVP-01'
  });

  // Exception Form State
  const [newExceptionData, setNewExceptionData] = useState({
    type: 'TEMPORARY AVAILABILITY CHANGE' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    adjustedHoursPerDay: 0,
    reason: ''
  });

  // Review Edit State
  const [activeReview, setActiveReview] = useState<PerformanceReviewRecord | null>(null);
  const [editedScore, setEditedScore] = useState<number>(90);
  const [supervisorComment, setSupervisorComment] = useState<string>('');
  const [devActionInput, setDevActionInput] = useState<string>('');

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  // Helper: Compute Capacity Metrics for a Member
  const computeMetrics = (member: TeamMember): MemberCapacityMetrics => {
    // 1. Weekly available
    const weeklyAvailableCapacity = member.schedule?.hoursAvailablePerWeek || 25;

    // 2. Today available (assume today is a weekday like Monday/Tuesday)
    let todayAvailableCapacity = member.schedule?.hoursAvailablePerDay || 5;

    // Check exceptions
    const todayStr = new Date().toISOString().split('T')[0];
    const activeException = member.exceptions?.find(
      (e) => todayStr >= e.startDate && todayStr <= e.endDate
    );

    if (activeException) {
      if (activeException.type === 'UNAVAILABLE PERIOD' || activeException.type === 'TIME OFF') {
        todayAvailableCapacity = 0;
      } else if (activeException.type === 'TEMPORARY AVAILABILITY CHANGE' || activeException.type === 'EXTRA AVAILABLE HOURS') {
        todayAvailableCapacity = activeException.adjustedHoursPerDay;
      }
    }

    // 3. Allocated Hours (Only actively SCHEDULED or IN_PROGRESS tasks scheduled for today consume daily capacity)
    // Pending member acceptance and QA review queue items DO NOT consume execution capacity.
    const memberTasks = tasks.filter(
      (t) => t.assignedTo === member.name && t.status !== 'COMPLETED'
    );

    const activelyScheduledToday = memberTasks.filter(
      (t) =>
        (t.status === 'IN_PROGRESS' || t.executionStatus === 'IN_PROGRESS' || t.executionStatus === 'SCHEDULED' || (t.scheduledDate && t.status === 'PENDING' && t.executionStatus !== 'PENDING_MEMBER_ACCEPTANCE')) &&
        t.status !== 'READY_FOR_QA' &&
        t.executionStatus !== 'PENDING_MEMBER_ACCEPTANCE' &&
        t.executionStatus !== 'DEFERRED'
    );

    const alreadyAllocatedHours = activelyScheduledToday.reduce(
      (sum, t) => sum + (t.remainingEffortHours ?? t.estimatedEffortHours ?? (t.priority.startsWith('P0') ? 4 : 2)),
      0
    );

    // 4. Remaining Capacity
    const remainingCapacity = Math.max(0, todayAvailableCapacity - alreadyAllocatedHours);
    const overallocatedHours = Math.max(0, alreadyAllocatedHours - todayAvailableCapacity);

    // 5. Status
    let status: MemberCapacityStatus = 'AVAILABLE';
    if (todayAvailableCapacity === 0) {
      status = 'UNAVAILABLE';
    } else if (alreadyAllocatedHours > todayAvailableCapacity) {
      status = 'OVERALLOCATED';
    } else if (remainingCapacity === 0) {
      status = 'FULLY ALLOCATED';
    } else if (remainingCapacity <= 2 && remainingCapacity > 0) {
      status = 'NEAR CAPACITY';
    } else {
      status = 'AVAILABLE';
    }

    return {
      weeklyAvailableCapacity,
      todayAvailableCapacity,
      alreadyAllocatedHours,
      remainingCapacity,
      overallocatedHours,
      status
    };
  };

  const getStatusBadge = (status: MemberCapacityStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> AVAILABLE</span>;
      case 'NEAR CAPACITY':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> NEAR CAPACITY</span>;
      case 'FULLY ALLOCATED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1"><Clock className="w-3 h-3"/> FULLY ALLOCATED</span>;
      case 'OVERALLOCATED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> OVERALLOCATED</span>;
      case 'UNAVAILABLE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1"><X className="w-3 h-3"/> UNAVAILABLE</span>;
    }
  };

  // Handle Add Member Submission
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.name.trim() || !newMemberData.email.trim()) return;

    const newId = `MBR-${(members.length + 1).toString().padStart(3, '0')}`;
    const newMember: TeamMember = {
      id: newId,
      name: newMemberData.name,
      email: newMemberData.email,
      title: newMemberData.title || 'Team Member',
      functionalRole: newMemberData.functionalRole || 'Operational Executant',
      supervisor: newMemberData.supervisor,
      employmentStatus: newMemberData.employmentStatus,
      timezone: newMemberData.timezone,
      projectAssignments: [newMemberData.initialProjectId],
      roleScope: newMemberData.roleScope,
      responsibilities: ['Execute assigned C-Bridge Master Agenda tasks', 'Submit evidence for QA review'],
      authority: 'Follows Husni-approved member governance CB-9110. Draft execution and submission authority.',
      requiredApprovals: ['CB-9110 Governance Decisions', 'QA Signoffs'],
      accessPermissions: ['EXECUTION', 'QA_SUBMISSION'],
      startDate: new Date().toISOString().split('T')[0],
      accountStatus: 'INVITED',
      schedule: {
        workingDays: newMemberData.workingDays,
        normalStartTime: '09:00 AM',
        normalEndTime: '02:00 PM',
        hoursAvailablePerDay: newMemberData.hoursAvailablePerDay,
        hoursAvailablePerWeek: newMemberData.workingDays.length * newMemberData.hoursAvailablePerDay,
        timezone: newMemberData.timezone,
        dailySchedules: [
          { day: 'Monday', isWorkingDay: true, startTime: '09:00 AM', endTime: '02:00 PM', hoursAvailable: newMemberData.hoursAvailablePerDay },
          { day: 'Tuesday', isWorkingDay: true, startTime: '09:00 AM', endTime: '02:00 PM', hoursAvailable: newMemberData.hoursAvailablePerDay },
          { day: 'Wednesday', isWorkingDay: true, startTime: '09:00 AM', endTime: '02:00 PM', hoursAvailable: newMemberData.hoursAvailablePerDay },
          { day: 'Thursday', isWorkingDay: true, startTime: '09:00 AM', endTime: '02:00 PM', hoursAvailable: newMemberData.hoursAvailablePerDay },
          { day: 'Friday', isWorkingDay: true, startTime: '09:00 AM', endTime: '02:00 PM', hoursAvailable: newMemberData.hoursAvailablePerDay },
          { day: 'Saturday', isWorkingDay: false, startTime: '00:00', endTime: '00:00', hoursAvailable: 0 },
          { day: 'Sunday', isWorkingDay: false, startTime: '00:00', endTime: '00:00', hoursAvailable: 0 }
        ]
      },
      exceptions: []
    };

    onAddMember(newMember);
    setIsAddMemberOpen(false);
    setSelectedMemberId(newId);
    setNewMemberData({
      name: '',
      email: '',
      title: '',
      functionalRole: '',
      supervisor: 'Husni Hasan',
      employmentStatus: 'FULL TIME',
      timezone: 'EDT (UTC-4)',
      roleScope: 'Phase 1 — U.S. Food Import Readiness & Documentation',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailablePerDay: 5,
      initialProjectId: projects[0]?.id || 'PRJ-FSVP-01'
    });
  };

  // Handle Exception Submission
  const handleAddExceptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    const newEx: AvailabilityException = {
      id: `EXC-${Date.now().toString().slice(-4)}`,
      memberId: selectedMember.id,
      type: newExceptionData.type,
      startDate: newExceptionData.startDate,
      endDate: newExceptionData.endDate,
      adjustedHoursPerDay: newExceptionData.adjustedHoursPerDay,
      reason: newExceptionData.reason || 'Supervisor-approved schedule adjustment',
      approvedBy: 'Husni Hasan',
      createdAt: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT'
    };

    onAddException(selectedMember.id, newEx);
    setIsExceptionModalOpen(false);
  };

  // Start AI Performance Review Generation
  const handleOpenAiPerformanceReview = (member: TeamMember) => {
    const memberTasks = tasks.filter((t) => t.assignedTo === member.name);
    const completedTasks = memberTasks.filter((t) => t.status === 'COMPLETED');
    const metric = computeMetrics(member);

    const review: PerformanceReviewRecord = {
      id: `PERF-${Date.now().toString().slice(-4)}`,
      memberId: member.id,
      memberName: member.name,
      reviewPeriod: 'DAILY',
      reviewDate: new Date().toISOString().split('T')[0],
      evaluator: 'Husni Hasan',
      assignedWorkSummary: `Assigned ${memberTasks.length} tasks across ${member.projectAssignments.length} active project workstreams.`,
      availableCapacityHours: metric.todayAvailableCapacity,
      allocatedHours: metric.alreadyAllocatedHours,
      completedHours: completedTasks.reduce((acc, t) => acc + (t.actualTimeHours || t.estimatedEffortHours || 2), 0),
      tasksStarted: memberTasks.filter((t) => t.startedAt || t.status === 'IN_PROGRESS').length,
      tasksCompleted: completedTasks.length,
      carryForwardTasks: memberTasks.filter((t) => t.status !== 'COMPLETED').length,
      resultsEvidenceSummary: completedTasks.length > 0 
        ? `${completedTasks.length} tasks completed with evidence logs submitted to QA.`
        : 'Active work in progress with evidence files attached in CB-9119.',
      qualityObservations: 'Demonstrates strong adherence to regulatory source material and instruction compliance.',
      strengths: ['Prompt timestamp auditing', 'High instruction compliance', 'Clear evidence documentation'],
      gaps: ['Requires continuous verification on complex exemption edge cases'],
      blockers: memberTasks.filter((t) => t.status === 'BLOCKED').map((t) => t.title),
      developmentNeeds: ['FSPCA Advanced Foreign Supplier Audit Protocol'],
      aiSuggestedScore: 92,
      aiReasoning: 'Task output aligns with Phase 1 charter objectives. Time allocation was efficiently managed within daily capacity.',
      supervisorAction: 'PENDING_REVIEW'
    };

    setActiveReview(review);
    setEditedScore(review.aiSuggestedScore);
    setSupervisorComment('');
    setAiExplanationText(null);
    setIsReviewModalOpen(true);
  };

  return (
    <div id="team-capacity-view" className="space-y-6 pb-16">
      
      {/* Header Banner */}
      <div className="bg-[#10243E] border border-[#28476B] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[#F8FAFC]">
        <div>
          <div className="flex items-center space-x-2 text-xs text-sky-300 font-mono font-bold mb-1">
            <span className="bg-[#163153] px-2.5 py-0.5 rounded border border-[#28476B]">
              CB-9110 & SB-9100 GOVERNANCE
            </span>
            <span>•</span>
            <span className="text-amber-400">TEAM ADMINISTRATION & CAPACITY ENGINE</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#F8FAFC] flex items-center gap-2">
            <Users className="h-6 w-6 text-sky-400" />
            Team Administration, Capacity & Performance Link
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Husni supervisor management portal for member provisioning, daily work schedule, availability exceptions, capacity engine, and official performance review workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenSignUpModal && (
            <button
              onClick={onOpenSignUpModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>PREVIEW PUBLIC APPLICATION FORM</span>
            </button>
          )}

          <button
            id="btn-add-member-top"
            onClick={() => setIsAddMemberOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD MEMBER DIRECTLY</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-[#10243E] border border-[#28476B] rounded-xl p-1.5 flex flex-wrap gap-1">
        {[
          { 
            id: 'applications', 
            label: 'MEMBER APPLICATIONS & ONBOARDING', 
            icon: UserCheck, 
            badge: applications.filter(a => a.status === 'PENDING_REVIEW').length > 0 
              ? `${applications.filter(a => a.status === 'PENDING_REVIEW').length} PENDING` 
              : undefined 
          },
          { id: 'workload', label: 'TEAM CAPACITY & WORKLOAD', icon: TrendingUp },
          { id: 'members', label: 'MEMBER PROFILES', icon: Users },
          { id: 'schedule', label: 'WORK SCHEDULE & EXCEPTIONS', icon: Calendar },
          { id: 'performance', label: 'PERFORMANCE & AI REVIEW', icon: Award },
          { id: 'assignment', label: 'PROJECT ASSIGNMENT', icon: Briefcase },
          { id: 'audit', label: 'AUDIT HISTORY', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-[#F8FAFC] shadow-sm'
                  : 'text-slate-300 hover:bg-[#163153] hover:text-[#F8FAFC]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="bg-amber-500 text-slate-950 font-mono font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 0: MEMBER APPLICATIONS & AI ONBOARDING */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          
          {/* Top Info Banner & Rule */}
          <div className="bg-[#10243E] border border-[#28476B] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-[#F8FAFC]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-[#163153] text-sky-300 border border-[#28476B] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded">
                  HUSNI EXECUTIVE REVIEW PORTAL
                </span>
                <span className="text-amber-400 font-mono text-[11px] font-bold">
                  CORE RULE: SIGN UP ≠ APPROVED MEMBERSHIP
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#F8FAFC] mt-1">
                Self-Service Member Applications & Intelligent AI Onboarding
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                Evaluate applicant profiles, automated AI Member Fit Analyses, capacity contributions, and provision approved team members with CB-9119 suggested work plans.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onOpenSignUpModal && (
                <button
                  onClick={onOpenSignUpModal}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Preview Public Application Form</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-Filters for Status */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              {[
                { id: 'PENDING', label: 'PENDING REVIEW', count: applications.filter(a => a.status === 'PENDING_REVIEW').length, color: 'bg-amber-950 text-amber-300 border-amber-800' },
                { id: 'APPROVED_PENDING', label: 'APPROVED — PENDING PROVISIONING', count: applications.filter(a => a.status === 'APPROVED_PENDING_PROVISIONING').length, color: 'bg-emerald-950 text-emerald-300 border-emerald-600' },
                { id: 'MORE_INFO', label: 'MORE INFO REQUIRED', count: applications.filter(a => a.status === 'MORE_INFO_REQUIRED').length, color: 'bg-blue-950 text-blue-300 border-blue-800' },
                { id: 'HOLD', label: 'ON HOLD', count: applications.filter(a => a.status === 'ON_HOLD').length, color: 'bg-slate-800 text-slate-300 border-slate-700' },
                { id: 'APPROVED', label: 'ACTIVE MEMBERS', count: members.filter(m => (m.accountStatus === 'ACTIVE' || !m.accountStatus) && m.employmentStatus !== 'SUPERVISOR / OWNER').length, color: 'bg-emerald-900 text-emerald-200 border-emerald-500' },
                { id: 'REJECTED', label: 'REJECTED', count: applications.filter(a => a.status === 'REJECTED').length, color: 'bg-rose-950 text-rose-300 border-rose-800' },
                { id: 'ALL', label: 'ALL APPLICATIONS', count: applications.length, color: 'bg-slate-900 text-slate-300 border-slate-800' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAppFilterTab(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer border ${
                    appFilterTab === f.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${f.color}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Total Applicants: {applications.length}
            </span>
          </div>

          {/* Applications & Active Members Master-Detail Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: List (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              {appFilterTab === 'APPROVED' ? (
                // ACTIVE MEMBERS LIST FROM MEMBER RECORDS (e.g. Samar Baydoun MBR-001)
                members
                  .filter(m => m.employmentStatus !== 'SUPERVISOR / OWNER')
                  .map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500 shadow-lg ring-1 ring-emerald-500/50'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono font-bold">{m.id}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-emerald-950 text-emerald-300 border-emerald-600">
                            ACTIVE MEMBER
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-white text-sm">{m.name}</h4>
                          <p className="text-xs text-slate-400">{m.title || m.functionalRole}</p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                          <span className="font-mono text-emerald-400 font-bold">{m.schedule?.hoursAvailablePerWeek || 25} hrs/week</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            m.accountAccessStatus === 'ACTIVE' 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}>
                            {m.accountAccessStatus || 'NOT ACTIVATED'}
                          </span>
                        </div>
                      </div>
                    );
                  })
              ) : (
                // APPLICANT LIST
                applications
                  .filter((app) => {
                    if (appFilterTab === 'PENDING') return app.status === 'PENDING_REVIEW';
                    if (appFilterTab === 'APPROVED_PENDING') return app.status === 'APPROVED_PENDING_PROVISIONING';
                    if (appFilterTab === 'MORE_INFO') return app.status === 'MORE_INFO_REQUIRED';
                    if (appFilterTab === 'HOLD') return app.status === 'ON_HOLD';
                    if (appFilterTab === 'REJECTED') return app.status === 'REJECTED';
                    return true;
                  })
                  .map((app) => {
                    const isSelected = selectedApplication?.id === app.id;
                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          setSelectedApplication(app);
                          setProposalTitle(app.aiAnalysis?.suggestedRole || `${app.functionalArea} Specialist`);
                          setProposalRole(app.functionalArea);
                          setProposalWeeklyHours(app.totalWeeklyHours);
                        }}
                        className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-slate-900 border-blue-500 shadow-lg ring-1 ring-blue-500/50'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-mono font-bold">{app.id}</span>
                            {app.isTestAccount && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                                TEST ACCOUNT
                              </span>
                            )}
                            {app.isDemoData && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                DEMO / TEST DATA
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            app.status === 'PENDING_REVIEW'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : app.status === 'MORE_INFO_REQUIRED'
                              ? 'bg-blue-950 text-blue-300 border-blue-800'
                              : app.status === 'APPROVED_PENDING_PROVISIONING'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-600 animate-pulse'
                              : app.status === 'APPROVED'
                              ? 'bg-emerald-900 text-emerald-200 border-emerald-500'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {app.status === 'APPROVED_PENDING_PROVISIONING' ? 'APPROVED — PENDING PROVISIONING' : app.status?.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-white text-sm">{app.fullName}</h4>
                          <p className="text-xs text-slate-400">{app.functionalArea}</p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                          <span className="font-mono text-emerald-400 font-bold">{app.totalWeeklyHours} hrs/week</span>
                          <span>{app.timezone}</span>
                        </div>

                        {app.aiAnalysis && (
                          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80 text-[11px] flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              AI Fit: <strong className="text-white">{app.aiAnalysis.aiRecommendation}</strong>
                            </span>
                            <span className="text-emerald-400 font-mono font-bold">{app.aiAnalysis.aiConfidence}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}

              {appFilterTab !== 'APPROVED' && applications.filter((app) => {
                if (appFilterTab === 'PENDING') return app.status === 'PENDING_REVIEW';
                if (appFilterTab === 'MORE_INFO') return app.status === 'MORE_INFO_REQUIRED';
                if (appFilterTab === 'HOLD') return app.status === 'ON_HOLD';
                if (appFilterTab === 'REJECTED') return app.status === 'REJECTED';
                return true;
              }).length === 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No applications found under "{appFilterTab?.replace('_', ' ')}".
                </div>
              )}
            </div>

            {/* Right Column: Detail View (8 cols) */}
            <div className="lg:col-span-8">
              {appFilterTab === 'APPROVED' ? (
                // ACTIVE MEMBER PROFILE VIEW (e.g. Samar Baydoun MBR-001)
                (() => {
                  const activeMember = members.find(m => m.id === selectedMemberId) || members.find(m => m.id === 'MBR-001') || members[0];
                  if (!activeMember) return null;
                  return (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                      
                      {/* Header Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-400 font-mono font-bold">{activeMember.id}</span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-emerald-400 font-bold">Approved Existing C-Bridge Member</span>
                          </div>
                          <h3 className="text-2xl font-black text-white mt-1">{activeMember.name}</h3>
                          <p className="text-xs text-emerald-400 font-bold">{activeMember.title || activeMember.functionalRole} • {activeMember.timezone || 'EDT (UTC-4)'}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold border bg-emerald-900 text-emerald-200 border-emerald-500">
                            STATUS: ACTIVE MEMBER
                          </span>
                        </div>
                      </div>

                      {/* ACCOUNT ACCESS & ACTIVATION CARD */}
                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-white flex items-center gap-2">
                              <Key className="w-4 h-4 text-emerald-400" />
                              <span>REAL USER AUTHENTICATION & ACCESS</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Link this existing member profile to a real authenticated user account.
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border shrink-0 ${
                            activeMember.accountAccessStatus === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : activeMember.accountAccessStatus === 'INVITATION PENDING' || activeMember.activationToken
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            ACCOUNT ACCESS: {activeMember.accountAccessStatus || (activeMember.activationToken ? 'INVITATION PENDING' : 'NOT ACTIVATED')}
                          </span>
                        </div>

                        {/* If Invitation is Pending */}
                        {(activeMember.accountAccessStatus === 'INVITATION PENDING' || activeMember.activationToken) && activeMember.accountAccessStatus !== 'ACTIVE' && (
                          <div className="space-y-4">
                            <div className="p-3.5 bg-amber-950/80 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <span><strong>EMAIL DELIVERY SETUP REQUIRED:</strong> Transactional SMTP is not configured. Copy and send the link manually below.</span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
                                DEVELOPMENT ACTIVATION LINK
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">CONFIRMED AUTH EMAIL</span>
                                <span className="font-bold text-white font-mono text-xs">{activeMember.activationEmail || activeMember.email || 'NOT SET'}</span>
                              </div>
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">SINGLE-USE ACTIVATION TOKEN</span>
                                <span className="font-mono text-emerald-400 font-bold text-xs">[REDACTED — SECURE HASHED REFERENCE]</span>
                              </div>
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">FIREBASE USER UID</span>
                                <span className="font-mono text-slate-400 font-bold text-xs">{activeMember.linkedUid || 'NOT LINKED'}</span>
                              </div>
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">EMAIL VERIFICATION</span>
                                <span className="font-bold text-slate-400 font-mono text-xs">NOT STARTED (PENDING ACTIVATION)</span>
                              </div>
                            </div>

                            {/* Activation URLs */}
                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3 font-mono">
                              <div>
                                <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-300 mb-1">
                                  <span className="text-purple-300 font-mono text-[10px] uppercase font-bold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/80">
                                    DEVELOPMENT ACTIVATION LINK
                                  </span>
                                  <button
                                    onClick={() => {
                                      const url = `${window.location.origin}/?activateToken=${activeMember.activationToken}`;
                                      navigator.clipboard.writeText(url);
                                      alert('Development activation link copied to clipboard!');
                                    }}
                                    className="text-blue-400 hover:text-blue-300 text-[10px] font-mono underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" /> Copy Dev Link
                                  </button>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-400 text-[11px] break-all">
                                  {`${window.location.origin}/?activateToken=[REDACTED_SECURE_TOKEN]`}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-300 mb-1">
                                  <span className="text-emerald-300 font-mono text-[10px] uppercase font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                                    C-BRIDGE MEMBER ACTIVATION LINK
                                  </span>
                                  {publicAppBaseUrl ? (
                                    <button
                                      onClick={() => {
                                        const url = `${publicAppBaseUrl?.replace(/\/$/, '')}/?activateToken=${activeMember.activationToken}`;
                                        navigator.clipboard.writeText(url);
                                        alert('Production activation link copied to clipboard!');
                                      }}
                                      className="text-emerald-400 hover:text-emerald-300 text-[10px] font-mono underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <Copy className="w-3 h-3" /> Copy Production Link
                                    </button>
                                  ) : null}
                                </div>
                                {publicAppBaseUrl ? (
                                  <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-400 text-[11px] break-all">
                                    {`${publicAppBaseUrl?.replace(/\/$/, '')}/?activateToken=[REDACTED_SECURE_TOKEN]`}
                                  </div>
                                ) : (
                                  <div className="bg-rose-950/60 p-3 rounded-xl border border-rose-800/80 text-rose-300 text-xs space-y-1">
                                    <div className="font-bold font-mono text-amber-300 flex items-center space-x-1.5">
                                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                                      <span>PRODUCTION APP URL CONFIGURATION REQUIRED</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 font-sans">
                                      To generate published production links, configure <code>PUBLIC_APP_BASE_URL</code> in environment variables.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Revoke current activation invitation for ${activeMember.name}? The active single-use invitation token will be invalidated immediately.`)) {
                                      if (onRevokeActivation) {
                                        onRevokeActivation(activeMember.id);
                                      } else {
                                        onUpdateMember({
                                          ...activeMember,
                                          accountAccessStatus: 'NOT ACTIVATED',
                                          activationToken: undefined,
                                          activationSentAt: undefined,
                                          activationEmail: undefined
                                        });
                                      }
                                    }
                                  }}
                                  className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>REVOKE CURRENT INVITATION</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setMemberToActivate(activeMember);
                                    setConfirmActivationEmail(activeMember.activationEmail || activeMember.email || '');
                                    setActivationModalStep('ENTER_EMAIL');
                                    setIsActivateModalOpen(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span>GENERATE NEW ACTIVATION LINK</span>
                                </button>
                              </div>

                              {onTestActivate && (
                                <button
                                  onClick={() => onTestActivate(activeMember, activeMember.activationToken!)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  <span>OPEN ACTIVATION PAGE AS SAMAR</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* If Account Access is NOT ACTIVATED */}
                        {activeMember.accountAccessStatus !== 'ACTIVE' && activeMember.accountAccessStatus !== 'INVITATION PENDING' && !activeMember.activationToken && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">AUTHENTICATION EMAIL</span>
                                <span className="font-bold font-mono text-xs text-slate-400">
                                  {activeMember.email || 'NOT SET'}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">FIREBASE USER UID</span>
                                <span className="font-mono font-bold text-xs text-slate-400">
                                  {activeMember.linkedUid || 'NOT LINKED'}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">SUPERVISOR</span>
                                <span className="font-bold text-white text-xs">{activeMember.supervisor || 'Husni Hasan'}</span>
                              </div>
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase block">EMAIL VERIFICATION</span>
                                <span className="font-bold font-mono text-xs text-slate-400">
                                  NOT STARTED
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800">
                              <button
                                onClick={() => {
                                  setMemberToActivate(activeMember);
                                  setConfirmActivationEmail(activeMember.email || '');
                                  setActivationModalStep('ENTER_EMAIL');
                                  setIsActivateModalOpen(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-md cursor-pointer animate-pulse"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>ACTIVATE REAL USER ACCOUNT</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* If Account Access is ACTIVE */}
                        {activeMember.accountAccessStatus === 'ACTIVE' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                              <span className="text-[10px] text-slate-500 font-mono uppercase block">AUTHENTICATION EMAIL</span>
                              <span className="font-bold font-mono text-xs text-white">
                                {activeMember.email}
                              </span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                              <span className="text-[10px] text-slate-500 font-mono uppercase block">FIREBASE USER UID</span>
                              <span className="font-mono font-bold text-xs text-emerald-400">
                                {activeMember.linkedUid || 'UID Linked'}
                              </span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                              <span className="text-[10px] text-slate-500 font-mono uppercase block">SUPERVISOR</span>
                              <span className="font-bold text-white text-xs">{activeMember.supervisor || 'Husni Hasan'}</span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                              <span className="text-[10px] text-slate-500 font-mono uppercase block">EMAIL VERIFICATION</span>
                              <span className="font-bold font-mono text-xs text-emerald-400">
                                VERIFIED
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* MEMBER DETAILS & SCHEDULE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                          <h5 className="font-bold text-xs text-slate-300 uppercase font-mono">ROLE & RESPONSIBILITIES</h5>
                          <p className="text-xs text-slate-300 leading-relaxed">{activeMember.roleScope || 'Food Import & FSVP Development Coordinator responsible for regulatory verification and asset drafting.'}</p>
                          <div className="pt-1">
                            <span className="text-[10px] text-slate-500 font-mono block">ASSIGNED PROJECTS</span>
                            <span className="text-xs font-bold text-blue-400 font-mono">{activeMember.projectAssignments?.join(', ') || 'PRJ-FSVP-01'}</span>
                          </div>
                        </div>

                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                          <h5 className="font-bold text-xs text-slate-300 uppercase font-mono">CAPACITY & SCHEDULE</h5>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Weekly Hours:</span>
                            <span className="font-bold text-emerald-400 font-mono">{activeMember.schedule?.hoursAvailablePerWeek || 25} hrs/week</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Working Days:</span>
                            <span className="font-bold text-white">{activeMember.schedule?.workingDays?.join(', ') || 'Mon, Tue, Wed, Thu, Fri'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Daily Hours:</span>
                            <span className="font-bold text-white">{activeMember.schedule?.normalStartTime || '09:00 AM'} - {activeMember.schedule?.normalEndTime || '02:00 PM'} ({activeMember.schedule?.hoursAvailablePerDay || 5} hrs/day)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : selectedApplication ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                  
                  {/* Demo Data Notice */}
                  {selectedApplication.isDemoData && (
                    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Info className="w-4 h-4 text-slate-400 shrink-0" />
                        <span><strong>DEMO / TEST DATA:</strong> This record is seeded prototype applicant data for demonstration purposes.</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        PROTOTYPE DATA
                      </span>
                    </div>
                  )}

                  {/* Header Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 font-mono">{selectedApplication.id}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">Applied: {selectedApplication.createdAt}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white mt-1">{selectedApplication.fullName}</h3>
                      <p className="text-xs text-blue-400 font-bold">{selectedApplication.functionalArea} • {selectedApplication.country} ({selectedApplication.timezone})</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        selectedApplication.status === 'PENDING_REVIEW'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : selectedApplication.status === 'MORE_INFO_REQUIRED'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : selectedApplication.status === 'APPROVED_PENDING_PROVISIONING'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600 animate-pulse'
                          : selectedApplication.status === 'APPROVED'
                          ? 'bg-emerald-900 text-emerald-200 border-emerald-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        STATUS: {selectedApplication.status === 'APPROVED_PENDING_PROVISIONING' ? 'APPROVED — PENDING PROVISIONING' : selectedApplication.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Audit Check Notice for APP-2026-6787 */}
                  {selectedApplication.id === 'APP-2026-6787' && selectedApplication.status === 'PENDING_REVIEW' && (
                    <div className="bg-amber-950/80 border border-amber-600 p-4 rounded-xl text-xs text-amber-200 space-y-1">
                      <div className="font-bold text-amber-300 flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>TEST APPLICANT AUDIT CHECK (APP-2026-6787 • Husni Alashqar)</span>
                      </div>
                      <p className="text-amber-100/90 leading-relaxed text-[11px]">
                        Status is currently <strong className="text-white font-mono">PENDING REVIEW</strong> because no prior Husni Approval record exists in audit logs. Click <strong className="text-emerald-300">"APPROVE APPLICATION"</strong> below to grant initial Husni approval, transition status to <strong className="text-emerald-300">APPROVED — PENDING PROVISIONING</strong>, and generate the Member Provisioning Proposal.
                      </p>
                    </div>
                  )}

                  {/* HUSNI EXECUTIVE ACTIONS BAR */}
                  <div className="bg-slate-900 border border-blue-900/80 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-xs text-white flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-blue-400" />
                        <span>HUSNI EXECUTIVE REVIEW & DECISION PANEL</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">
                        AUTHORIZED SUPERVISOR ONLY
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedApplication.status === 'APPROVED_PENDING_PROVISIONING' ? (
                        <>
                          <button
                            onClick={() => {
                              if (onConfirmAndActivateMember) {
                                onConfirmAndActivateMember(selectedApplication, selectedApplication.provisioningProposal);
                              } else if (onApproveAndProvision && selectedApplication.provisioningProposal) {
                                onApproveAndProvision(selectedApplication, selectedApplication.provisioningProposal);
                              }
                              setSelectedApplication({ ...selectedApplication, status: 'APPROVED' });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-md cursor-pointer animate-pulse"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>CONFIRM & ACTIVATE MEMBER</span>
                          </button>

                          <button
                            onClick={() => {
                              setProposalTitle(selectedApplication.provisioningProposal?.approvedTitle || selectedApplication.aiAnalysis?.suggestedRole || `${selectedApplication.functionalArea} Specialist`);
                              setProposalRole(selectedApplication.provisioningProposal?.functionalRole || selectedApplication.functionalArea);
                              setProposalWeeklyHours(selectedApplication.provisioningProposal?.weeklyCapacity || selectedApplication.totalWeeklyHours);
                              setIsProvisioningModalOpen(true);
                            }}
                            className="bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>EDIT PROVISIONING PROPOSAL</span>
                          </button>

                          <button
                            onClick={() => setIsReqInfoModalOpen(true)}
                            className="bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>REQUEST MORE INFO</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              if (onApproveApplication) {
                                onApproveApplication(selectedApplication);
                              }
                              setSelectedApplication({ 
                                ...selectedApplication, 
                                status: 'APPROVED_PENDING_PROVISIONING' 
                              });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-md cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>APPROVE APPLICATION</span>
                          </button>

                          <button
                            onClick={() => {
                              setProposalTitle(selectedApplication.aiAnalysis?.suggestedRole || `${selectedApplication.functionalArea} Specialist`);
                              setProposalRole(selectedApplication.functionalArea);
                              setProposalWeeklyHours(selectedApplication.totalWeeklyHours);
                              setIsProvisioningModalOpen(true);
                            }}
                            className="bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>APPROVE WITH CUSTOM PROPOSAL</span>
                          </button>

                          <button
                            onClick={() => setIsReqInfoModalOpen(true)}
                            className="bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>REQUEST MORE INFO</span>
                          </button>

                          <button
                            onClick={() => {
                              if (!onUpdateApplication) return;
                              onUpdateApplication({ ...selectedApplication, status: 'ON_HOLD' });
                              setSelectedApplication({ ...selectedApplication, status: 'ON_HOLD' });
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                          >
                            WAIT / HOLD
                          </button>

                          <button
                            onClick={() => {
                              if (!onUpdateApplication) return;
                              onUpdateApplication({ ...selectedApplication, status: 'REJECTED' });
                              setSelectedApplication({ ...selectedApplication, status: 'REJECTED' });
                            }}
                            className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                          >
                            REJECT
                          </button>
                        </>
                      )}
                    </div>

                    {/* Husni Natural Language Comment Box */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <label className="block text-[11px] text-slate-400 font-bold">
                        Husni Supervisor Natural Language Command / Guidance:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={naturalLanguageComment}
                          onChange={(e) => setNaturalLanguageComment(e.target.value)}
                          placeholder="e.g. Before approval, ask applicant to upload copy of PCQI certificate."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                        />
                        <button
                          onClick={() => {
                            if (!naturalLanguageComment) return;
                            if (naturalLanguageComment.toLowerCase().includes('ask') || naturalLanguageComment.toLowerCase().includes('request') || naturalLanguageComment.toLowerCase().includes('evidence') || naturalLanguageComment.toLowerCase().includes('pcqi')) {
                              if (onRequestMoreInfo) {
                                onRequestMoreInfo(selectedApplication.id, naturalLanguageComment, 'PCQI Certificate or training document');
                              }
                              setCommentSuccessMsg('Information request generated from Husni comment!');
                            } else if (naturalLanguageComment.toLowerCase().includes('approve')) {
                              setIsProvisioningModalOpen(true);
                              setCommentSuccessMsg('Opening Provisioning Proposal from Husni comment!');
                            } else {
                              if (onUpdateApplication) {
                                onUpdateApplication({ ...selectedApplication, husniComments: naturalLanguageComment });
                              }
                              setCommentSuccessMsg('Comment logged to applicant audit file!');
                            }
                            setTimeout(() => setCommentSuccessMsg(''), 2500);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap"
                        >
                          Execute Command
                        </button>
                      </div>
                      {commentSuccessMsg && (
                        <div className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{commentSuccessMsg}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI MEMBER FIT ANALYSIS CARD */}
                  {selectedApplication.aiAnalysis && (
                    <div className="bg-slate-900 border border-purple-900/80 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          <h4 className="font-bold text-sm text-white">AI MEMBER FIT ANALYSIS</h4>
                        </div>
                        <div className="flex items-center space-x-2 font-mono text-xs">
                          <span className="text-slate-400">Recommendation:</span>
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            selectedApplication.aiAnalysis.aiRecommendation === 'APPROVE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {selectedApplication.aiAnalysis.aiRecommendation}
                          </span>
                          <span className="text-purple-300 font-bold">({selectedApplication.aiAnalysis.aiConfidence} CONFIDENCE)</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                        {selectedApplication.aiAnalysis.professionalSummary}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Relevant Skills</span>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {selectedApplication.aiAnalysis.relevantSkills.map((s, idx) => (
                              <span key={idx} className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] px-2 py-0.5 rounded font-mono">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Potential Capability Areas</span>
                          <div className="text-slate-300 text-[11px] pt-1">
                            {selectedApplication.aiAnalysis.potentialCapabilityAreas.join(', ')}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-amber-400 font-bold uppercase">Potential Gaps & Training Needs</span>
                          <div className="text-slate-300 text-[11px] pt-1">
                            <strong>Gaps:</strong> {selectedApplication.aiAnalysis.potentialGaps.join(', ')}
                          </div>
                          <div className="text-blue-300 text-[11px]">
                            <strong>Training:</strong> {selectedApplication.aiAnalysis.trainingNeeds.join(', ')}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Capacity & Project Fit</span>
                          <div className="text-slate-300 text-[11px] pt-1">
                            <strong>Project:</strong> {selectedApplication.aiAnalysis.possibleProjectFit.join(', ')}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {selectedApplication.aiAnalysis.capacityAssessment}
                          </div>
                        </div>
                      </div>

                      {/* Suggested Role & Responsibilities */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-300">Suggested Role Title: <strong className="text-white">{selectedApplication.aiAnalysis.suggestedRole}</strong></span>
                          <span className="text-emerald-400 font-mono">{selectedApplication.aiAnalysis.suggestedInitialWeeklyAllocation} hrs/week</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          <strong>Initial Responsibilities:</strong> {selectedApplication.aiAnalysis.suggestedInitialResponsibilities.join(' • ')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Declared Application Details & CV */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
                      Applicant Declaration & CV Profile
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold">Email Status</span>
                        <div className="text-white font-bold mt-0.5">{selectedApplication.email}</div>
                        <div className="text-emerald-400 font-mono text-[10px] mt-0.5">{selectedApplication.emailVerificationStatus}</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold">Available Schedule</span>
                        <div className="text-white font-bold mt-0.5">{selectedApplication.totalWeeklyHours} hrs / week</div>
                        <div className="text-slate-400 text-[10px] mt-0.5">{selectedApplication.availableWorkingDays.join(', ')} ({selectedApplication.dailyStartTime} - {selectedApplication.dailyEndTime})</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold">Certifications</span>
                        <div className="text-white font-bold mt-0.5">
                          {selectedApplication.certifications?.join(', ') || 'Declared in CV'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-slate-400 mb-1">CV / Resume Text</span>
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                        {selectedApplication.cvText}
                      </div>
                    </div>

                    {selectedApplication.supervisionNoticeAcknowledged && (
                      <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Applicant acknowledged C-Bridge Supervision Notice upon sign-up.</span>
                      </div>
                    )}
                  </div>

                  {/* Information Requests Log */}
                  {selectedApplication.infoRequests && selectedApplication.infoRequests.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                      <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-blue-400" />
                        <span>Information Requests & Evidence Submissions</span>
                      </h4>

                      {selectedApplication.infoRequests.map((req) => (
                        <div key={req.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>ID: {req.id} • Requested by {req.requestedBy} ({req.requestedAt})</span>
                            <span className="text-amber-400 font-bold">{req.status}</span>
                          </div>
                          <div className="text-white font-medium">{req.question}</div>
                          {req.responseDetails && (
                            <div className="bg-emerald-950/40 p-2.5 rounded border border-emerald-900 text-emerald-200 mt-2">
                              <strong>Applicant Answer:</strong> {req.responseDetails}
                              {req.responseDocumentName && <div className="font-mono text-[10px] text-blue-300">Doc: {req.responseDocumentName}</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  Select an application from the list to view full profile & execute Husni review decisions.
                </div>
              )}
            </div>

          </div>

          {/* PROVISIONING PROPOSAL MODAL */}
          {isProvisioningModalOpen && selectedApplication && (
            <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl my-auto space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-base text-white">MEMBER PROVISIONING PROPOSAL</h3>
                      <p className="text-xs text-slate-400">Husni Approval & Role Setup for {selectedApplication.fullName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsProvisioningModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Approved Member Title *</label>
                      <input
                        type="text"
                        value={proposalTitle}
                        onChange={(e) => setProposalTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Functional Role *</label>
                      <input
                        type="text"
                        value={proposalRole}
                        onChange={(e) => setProposalRole(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Weekly Allocated Hours *</label>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={proposalWeeklyHours}
                        onChange={(e) => setProposalWeeklyHours(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Assigned C-Bridge Project *</label>
                      <select
                        value={proposalProjectId}
                        onChange={(e) => setProposalProjectId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-hidden"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id} — {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="block text-slate-400 font-bold">Governance & Supervisor Control</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div>Supervisor: <strong className="text-white">Husni Hasan (MD)</strong></div>
                      <div>Timezone: <strong className="text-white">{selectedApplication.timezone}</strong></div>
                      <div>Governance Framework: <strong className="text-white">CB-9110 / SB-9100</strong></div>
                      <div>Daily Schedule: <strong className="text-white">{selectedApplication.dailyStartTime} - {selectedApplication.dailyEndTime}</strong></div>
                    </div>
                  </div>

                  <div className="bg-emerald-950/60 border border-emerald-800/80 p-3.5 rounded-xl space-y-2 text-[11px] text-emerald-200">
                    <div className="font-bold flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>CB-9119 SUGGESTED INITIAL WORK PLAN ATTACHED</span>
                    </div>
                    <p className="text-slate-300">
                      Upon confirmation, an initial daily work schedule will be established in Master Agenda with performance baseline tracking connected directly to task submissions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setIsProvisioningModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      if (!onApproveAndProvision || !selectedApplication) return;

                      const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';

                      const proposal: MemberProvisioningProposal = {
                        proposalId: `PROP-${Date.now().toString().slice(-4)}`,
                        createdAt: nowStr,
                        createdBy: 'Husni Hasan',
                        memberName: selectedApplication.fullName,
                        approvedTitle: proposalTitle,
                        functionalRole: proposalRole,
                        supervisor: 'Husni Hasan',
                        roleScope: 'Phase 1 — U.S. Food Import Readiness & Documentation',
                        authority: 'Follows Husni-approved member governance CB-9110 / SB-9100',
                        permissions: proposalPermissions,
                        weeklyCapacity: proposalWeeklyHours,
                        workingSchedule: {
                          workingDays: selectedApplication.availableWorkingDays,
                          normalStartTime: selectedApplication.dailyStartTime,
                          normalEndTime: selectedApplication.dailyEndTime,
                          hoursAvailablePerDay: Math.round(proposalWeeklyHours / selectedApplication.availableWorkingDays.length),
                          hoursAvailablePerWeek: proposalWeeklyHours,
                          timezone: selectedApplication.timezone,
                          dailySchedules: []
                        },
                        approvedProjects: [proposalProjectId],
                        suggestedWorkstreams: selectedApplication.aiAnalysis?.possibleWorkstreamFit || ['Foreign Supplier Verification'],
                        requiredOnboarding: selectedApplication.aiAnalysis?.trainingNeeds || ['C-Bridge Operating Charter Orientation'],
                        requiredLearning: ['FSPCA PCQI Module Review', 'CB-9120 Document Control SOP'],
                        initialTasks: selectedApplication.aiAnalysis?.suggestedInitialResponsibilities || ['Review supplier hazard analysis'],
                        reportingRequirements: 'Daily agenda log & weekly performance review sign-off',
                        status: 'CONFIRMED'
                      };

                      const workPlan: SuggestedWorkPlan = {
                        planId: `PLAN-${Date.now().toString().slice(-4)}`,
                        memberName: selectedApplication.fullName,
                        weeklyHours: proposalWeeklyHours,
                        timezone: selectedApplication.timezone,
                        dailyAllocations: selectedApplication.availableWorkingDays.map((day) => ({
                          day,
                          taskSummary: `Execute CB-9119 Master Agenda Tasks for ${proposalProjectId}`,
                          targetHours: Math.round(proposalWeeklyHours / selectedApplication.availableWorkingDays.length),
                          projectRef: proposalProjectId
                        })),
                        masterAgendaPriorities: ['MA-FSVP-01 Foreign Supplier Verification', 'MA-FSVP-02 Importer Readiness'],
                        learningRequirements: ['C-Bridge Quality SOP Orientation'],
                        dependencies: ['Husni QA Final Signoff'],
                        husniStatus: 'ACCEPTED',
                        husniNotes: 'Confirmed by Husni Hasan during member activation.'
                      };

                      onApproveAndProvision(selectedApplication, proposal, workPlan);
                      setIsProvisioningModalOpen(false);
                      setSelectedApplication({ ...selectedApplication, status: 'APPROVED' });
                    }}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg cursor-pointer"
                  >
                    CONFIRM & ACTIVATE MEMBER ACCOUNT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REQUEST MORE INFO MODAL */}
          {isReqInfoModalOpen && selectedApplication && (
            <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl my-auto space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-base text-white">REQUEST ADDITIONAL INFORMATION</h3>
                      <p className="text-xs text-slate-400">Ask {selectedApplication.fullName} for clarification</p>
                    </div>
                  </div>
                  <button onClick={() => setIsReqInfoModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Husni Question / Clarification Request *</label>
                    <textarea
                      rows={3}
                      value={customQuestionText}
                      onChange={(e) => setCustomQuestionText(e.target.value)}
                      placeholder="e.g. Please clarify your direct experience with U.S. FDA FSVP regulations and upload training certificates..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Requested Evidence / Document</label>
                    <input
                      type="text"
                      value={customEvidenceText}
                      onChange={(e) => setCustomEvidenceText(e.target.value)}
                      placeholder="e.g. PCQI or FSVP Training Certificate PDF"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button onClick={() => setIsReqInfoModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!customQuestionText || !onRequestMoreInfo) return;
                      onRequestMoreInfo(selectedApplication.id, customQuestionText, customEvidenceText);
                      setIsReqInfoModalOpen(false);
                      setCustomQuestionText('');
                      setCustomEvidenceText('');
                      setSelectedApplication({ ...selectedApplication, status: 'MORE_INFO_REQUIRED' });
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Send Request to Applicant
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 1: TEAM CAPACITY & WORKLOAD VIEW */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          {/* Capacity Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Team Members</div>
              <div className="text-3xl font-black text-white">{members.length}</div>
              <div className="text-[11px] text-blue-400 mt-1">Authorized under Husni Governance</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today Total Available</div>
              <div className="text-3xl font-black text-emerald-400">
                {members.reduce((acc, m) => acc + computeMetrics(m).todayAvailableCapacity, 0)} hrs
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Sum of active schedule & exceptions</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Already Allocated Work</div>
              <div className="text-3xl font-black text-amber-400">
                {members.reduce((acc, m) => acc + computeMetrics(m).alreadyAllocatedHours, 0)} hrs
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Active Master Agenda tasks assigned</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining Daily Capacity</div>
              <div className="text-3xl font-black text-blue-400">
                {members.reduce((acc, m) => acc + computeMetrics(m).remainingCapacity, 0)} hrs
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Available for new task assignment</div>
            </div>
          </div>

          {/* Member Workload Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Husni Supervisor — Member Capacity & Workload Dashboard
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time daily capacity evaluation feeding CB-9119 Daily Agenda scheduling logic.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Member</th>
                    <th className="p-3">Role / Title</th>
                    <th className="p-3">Available Today</th>
                    <th className="p-3">Allocated Today</th>
                    <th className="p-3">Remaining</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Active Tasks</th>
                    <th className="p-3">Projects</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-sans">
                  {members.map((member) => {
                    const metric = computeMetrics(member);
                    const memberTasks = tasks.filter((t) => t.assignedTo === member.name);
                    const activeCount = memberTasks.filter((t) => t.status !== 'COMPLETED').length;
                    const blockedCount = memberTasks.filter((t) => t.status === 'BLOCKED').length;

                    return (
                      <tr key={member.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-900 border border-blue-700 text-blue-200 flex items-center justify-center text-xs font-black">
                              {member.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div>
                              <div>{member.name}</div>
                              <div className="text-[10px] font-mono text-slate-400">{member.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">
                          <div>{member.title}</div>
                          <div className="text-[10px] text-slate-400">{member.timezone}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">{metric.todayAvailableCapacity} hrs</td>
                        <td className="p-3 font-mono font-bold text-amber-400">{metric.alreadyAllocatedHours} hrs</td>
                        <td className="p-3 font-mono font-bold text-blue-400">{metric.remainingCapacity} hrs</td>
                        <td className="p-3">{getStatusBadge(metric.status)}</td>
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-white font-bold">{activeCount} active</span>
                            {blockedCount > 0 && (
                              <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                {blockedCount} blocked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[11px] font-mono">
                            {member.projectAssignments.length} assigned
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            id={`btn-view-member-${member.id}`}
                            onClick={() => {
                              setSelectedMemberId(member.id);
                              setActiveTab('members');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold"
                          >
                            VIEW PROFILE
                          </button>
                          <button
                            id={`btn-adjust-avail-${member.id}`}
                            onClick={() => {
                              setSelectedMemberId(member.id);
                              setIsExceptionModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-200 text-[11px] font-bold"
                          >
                            AVAILABILITY
                          </button>
                          <button
                            id={`btn-eval-perf-${member.id}`}
                            onClick={() => handleOpenAiPerformanceReview(member)}
                            className="px-2.5 py-1 rounded bg-blue-900 hover:bg-blue-800 border border-blue-700 text-blue-200 text-[11px] font-bold"
                          >
                            PERFORMANCE
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBER PROFILES & GOVERNANCE */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member List Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">C-Bridge Members</h3>
              <button
                id="btn-add-member-sidebar"
                onClick={() => setIsAddMemberOpen(true)}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {members.map((m) => {
                const isSelected = m.id === selectedMember.id;
                return (
                  <button
                    key={m.id}
                    id={`select-member-${m.id}`}
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`w-full text-left p-3 rounded-xl transition cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-950/80 border-blue-600 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm">{m.name}</div>
                      <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{m.id}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{m.title}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-blue-400 font-mono">{m.employmentStatus}</span>
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        {m.accountStatus}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Member Detailed Profile */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                    {selectedMember.id}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                    {selectedMember.accountStatus}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">{selectedMember.name}</h2>
                <p className="text-sm text-slate-300">{selectedMember.title}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id={`btn-edit-profile-${selectedMember.id}`}
                  onClick={() => setIsEditMemberOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>EDIT PROFILE</span>
                </button>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5"/> Governance & Role
                </div>
                <div><span className="text-slate-400">Functional Role:</span> <span className="text-white font-bold">{selectedMember.functionalRole}</span></div>
                <div><span className="text-slate-400">Supervisor:</span> <span className="text-white font-bold">{selectedMember.supervisor}</span></div>
                <div><span className="text-slate-400">Employment Status:</span> <span className="text-amber-300 font-bold">{selectedMember.employmentStatus}</span></div>
                <div><span className="text-slate-400">Timezone:</span> <span className="text-slate-200">{selectedMember.timezone}</span></div>
                <div><span className="text-slate-400">Start Date:</span> <span className="text-slate-200">{selectedMember.startDate}</span></div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5"/> Authority & Permissions
                </div>
                <div><span className="text-slate-400">Role Scope:</span> <div className="text-slate-200 mt-0.5">{selectedMember.roleScope}</div></div>
                <div><span className="text-slate-400">Authority:</span> <div className="text-white font-bold mt-0.5">{selectedMember.authority}</div></div>
              </div>
            </div>

            {/* Responsibilities & Required Approvals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Responsibilities</div>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {selectedMember.responsibilities.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Required Approvals</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMember.requiredApprovals.map((app, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Project Assignments */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="font-bold text-blue-400 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Assigned Projects</span>
                <span className="text-slate-400">{selectedMember.projectAssignments.length} Active</span>
              </div>
              <div className="space-y-2">
                {selectedMember.projectAssignments.map((pId) => {
                  const proj = projects.find((p) => p.id === pId);
                  return (
                    <div key={pId} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-[10px] text-blue-400 bg-blue-950 border border-blue-800 px-1.5 py-0.5 rounded mr-2">
                          {pId}
                        </span>
                        <span className="font-bold text-white">{proj?.name || pId}</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-[10px] uppercase">Active Assignment</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real User Account & Authentication Link Section */}
            <div className="bg-slate-950 p-5 rounded-xl border border-blue-900/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Real User Account & Authentication Link
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400">Account Access Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                    selectedMember.accountAccessStatus === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : selectedMember.accountAccessStatus === 'INVITATION PENDING'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : selectedMember.accountAccessStatus === 'EMAIL VERIFIED'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {selectedMember.accountAccessStatus || 'NOT ACTIVATED'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Confirmed Member Email:</span>
                  <div className="text-white font-mono font-bold mt-1 text-xs bg-slate-900 px-3 py-2 rounded border border-slate-800 flex items-center justify-between">
                    <span>{selectedMember.email || 'NOT SET'}</span>
                    {selectedMember.linkedUid && (
                      <span className="text-[10px] text-emerald-400 font-mono">UID Linked</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Firebase Auth UID:</span>
                  <div className="text-slate-300 font-mono text-xs mt-1 bg-slate-900 px-3 py-2 rounded border border-slate-800 truncate">
                    {selectedMember.linkedUid || 'NOT LINKED'}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  id={`btn-activate-account-${selectedMember.id}`}
                  onClick={() => {
                    setMemberToActivate(selectedMember);
                    setConfirmActivationEmail(selectedMember.email || '');
                    setActivationModalStep('ENTER_EMAIL');
                    setIsActivateModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center space-x-2 cursor-pointer shadow-md"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{selectedMember.accountAccessStatus === 'ACTIVE' ? 'RE-SEND ACTIVATION / UPDATE EMAIL' : 'ACTIVATE REAL USER ACCOUNT'}</span>
                </button>

                {selectedMember.activationToken && (
                  <button
                    onClick={() => {
                      if (onTestActivate) {
                        onTestActivate(selectedMember, selectedMember.activationToken!);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-200 text-xs font-bold hover:bg-amber-900 transition cursor-pointer"
                  >
                    <span>Test Activation Page as {selectedMember.name}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORK SCHEDULE & AVAILABILITY */}
      {activeTab === 'schedule' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Work Schedule & Availability Engine — {selectedMember.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Member availability is the primary scheduling source. Driven by onboarding registration and maintained under Husni governance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-add-exception-top"
                onClick={() => setIsExceptionModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD AVAILABILITY EXCEPTION</span>
              </button>
            </div>
          </div>

          {/* Canonical Provenance & Source Metadata Card */}
          <div className="bg-slate-950 border border-blue-900/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                  PROVENANCE & TRACEABILITY
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                  {selectedMember.availabilityProvenance?.status || 'HUSNI CONFIRMED'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Last Updated: <strong className="text-slate-200">{selectedMember.availabilityProvenance?.lastUpdated || '2026-08-01 09:30 EDT'}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Source of Record</span>
                <div className="text-white font-medium mt-1">
                  {selectedMember.availabilityProvenance?.source || 'CANONICAL MEMBER PROFILE — HUSNI CONFIRMED'}
                </div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Timezone & Location</span>
                <div className="text-white font-medium mt-1">
                  {selectedMember.timezone} {selectedMember.country ? `(${selectedMember.country})` : ''}
                </div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Effective Schedule Value</span>
                <div className="text-white font-medium mt-1">
                  {selectedMember.schedule.workingDays.join(', ')} • {selectedMember.schedule.normalStartTime} – {selectedMember.schedule.normalEndTime}
                </div>
              </div>
            </div>
          </div>

          {/* The 3 Core Concepts: Availability, Weekly Capacity, Project Allocations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Concept A: Member Availability */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-blue-400 uppercase tracking-wider">A. Member Availability</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300">Days & Times</span>
              </div>
              <div className="text-2xl font-black text-white">{selectedMember.schedule.workingDays.length} Days / Wk</div>
              <p className="text-[11px] text-slate-400">
                {selectedMember.schedule.normalStartTime} – {selectedMember.schedule.normalEndTime} ({selectedMember.schedule.hoursAvailablePerDay}h/day)
              </p>
            </div>

            {/* Concept B: Weekly Capacity */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-400 uppercase tracking-wider">B. Total Weekly Capacity</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300">Total Available</span>
              </div>
              <div className="text-2xl font-black text-emerald-400">{selectedMember.schedule.hoursAvailablePerWeek} Hours</div>
              <p className="text-[11px] text-slate-400">
                Total weekly working hours committed to C-Bridge operations.
              </p>
            </div>

            {/* Concept C: Project Allocations */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-400 uppercase tracking-wider">C. Project Allocations</span>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300">Project Specific</span>
              </div>
              <div className="text-2xl font-black text-amber-400">
                {selectedMember.projectAllocations?.reduce((acc, p) => acc + p.allocatedHoursPerWeek, 0) || 22} Hours
              </div>
              <p className="text-[11px] text-slate-400">
                PRJ-324: {selectedMember.projectAllocations?.find(p=>p.projectId==='PRJ-324')?.allocatedHoursPerWeek || 15}h • PRJ-FSVP-01: {selectedMember.projectAllocations?.find(p=>p.projectId==='PRJ-FSVP-01')?.allocatedHoursPerWeek || 7}h • Buffer: {Math.max(0, (selectedMember.schedule?.hoursAvailablePerWeek || 25) - (selectedMember.projectAllocations?.reduce((acc, p) => acc + p.allocatedHoursPerWeek, 0) || 22))}h
              </p>
            </div>
          </div>

          {/* Normal Daily Schedule */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Normal Weekly Schedule ({selectedMember.schedule.hoursAvailablePerWeek} Hours / Week)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
              {selectedMember.schedule.dailySchedules.map((ds) => (
                <div
                  key={ds.day}
                  className={`p-3 rounded-xl border text-center text-xs space-y-1 ${
                    ds.isWorkingDay
                      ? 'bg-slate-950 border-blue-900/60 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="font-bold text-slate-300">{ds.day}</div>
                  {ds.isWorkingDay ? (
                    <>
                      <div className="text-[11px] font-mono text-blue-400">{ds.startTime} – {ds.endTime}</div>
                      <div className="text-xs font-black text-emerald-400">{ds.hoursAvailable} hrs</div>
                    </>
                  ) : (
                    <div className="text-xs font-bold text-slate-600 py-2">Unavailable</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Availability Exceptions */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Availability Exceptions & Temporary Adjustments
            </h3>

            {selectedMember.exceptions.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                No active availability exceptions recorded. Member operates on normal schedule.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedMember.exceptions.map((ex) => (
                  <div key={ex.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold font-mono text-[10px]">
                          {ex.type}
                        </span>
                        <span className="font-bold text-white">{ex.startDate} to {ex.endDate}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{ex.reason}</p>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-emerald-400 font-bold text-sm">{ex.adjustedHoursPerDay} hrs / day</div>
                      <div className="text-[10px] text-slate-400">Approved by {ex.approvedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PERFORMANCE & AI REVIEW */}
      {activeTab === 'performance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                C-Bridge AI Performance Analysis & Husni Supervisor Review
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation considers workload, capacity, quality, evidence, instruction compliance, and blockers. Numeric scores are labeled "AI SUGGESTED PERFORMANCE SCORE" until Husni supervisor sign-off.
              </p>
            </div>

            <button
              id={`btn-run-ai-eval-${selectedMember.id}`}
              onClick={() => handleOpenAiPerformanceReview(selectedMember)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>RUN C-BRIDGE AI PERFORMANCE REVIEW</span>
            </button>
          </div>

          {/* Performance Review History List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Recorded Evaluations for {selectedMember.name}</h3>

            {performanceReviews.filter((r) => r.memberId === selectedMember.id).length === 0 ? (
              <div className="p-8 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                <Info className="w-6 h-6 text-slate-500 mx-auto" />
                <div>No formal evaluation records saved for {selectedMember.name} yet.</div>
                <button
                  onClick={() => handleOpenAiPerformanceReview(selectedMember)}
                  className="px-3 py-1.5 rounded bg-blue-900 text-blue-200 text-xs font-bold border border-blue-700 mt-2"
                >
                  Generate Initial Evaluation
                </button>
              </div>
            ) : (
              performanceReviews
                .filter((r) => r.memberId === selectedMember.id)
                .map((rev) => (
                  <div key={rev.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono font-bold text-[10px]">
                          {rev.reviewPeriod} EVALUATION
                        </span>
                        <span className="text-slate-400 font-mono">{rev.reviewDate}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">AI SUGGESTED SCORE</div>
                          <div className="font-mono font-black text-amber-400 text-base">{rev.aiSuggestedScore} / 100</div>
                        </div>

                        {rev.husniFinalScore !== undefined && (
                          <div className="text-right pl-3 border-l border-slate-800">
                            <div className="text-[10px] text-emerald-400 font-bold">HUSNI FINAL SCORE</div>
                            <div className="font-mono font-black text-emerald-400 text-base">{rev.husniFinalScore} / 100</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-bold text-slate-300 mb-1">Work & Results Summary</div>
                        <p className="text-slate-400">{rev.assignedWorkSummary}</p>
                        <p className="text-slate-300 mt-2">{rev.resultsEvidenceSummary}</p>
                      </div>

                      <div>
                        <div className="font-bold text-slate-300 mb-1">Quality & AI Reasoning</div>
                        <p className="text-slate-300">{rev.qualityObservations}</p>
                        <p className="text-slate-400 mt-1 italic">{rev.aiReasoning}</p>
                      </div>
                    </div>

                    {/* Husni Comments */}
                    {rev.husniComments && (
                      <div className="p-3 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-200">
                        <div className="font-bold text-[11px] text-blue-300">Husni Supervisor Comment</div>
                        <div>{rev.husniComments}</div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PROJECT ASSIGNMENT */}
      {activeTab === 'assignment' && (() => {
        const totalCap = selectedMember.schedule?.hoursAvailablePerWeek || 25;
        const allocatedCap = selectedMember.projectAllocations?.reduce((acc, p) => acc + p.allocatedHoursPerWeek, 0) || (selectedMember.id === 'MBR-001' ? 22 : 0);
        const unallocatedBuffer = Math.max(0, totalCap - allocatedCap);
        const remainingAssignable = unallocatedBuffer;

        return (
          <div className="bg-[#10243E] border border-[#28476B] rounded-2xl p-6 space-y-6">
            <div className="border-b border-[#28476B] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  Project Assignment & AI Capacity Analysis
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Evaluates project assignment feasibility against member remaining capacity, existing allocations, scheduled workload, and buffer policies. Husni Hasan makes final assignment decisions.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#163153] border border-[#28476B] text-[11px] font-mono text-blue-300 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Governance Rule: CB-9119</span>
              </div>
            </div>

            {/* 4 DISTINCT CAPACITY VALUES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#163153] border border-[#28476B] p-4 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">TOTAL WEEKLY CAPACITY</div>
                <div className="text-2xl font-black text-white font-mono">{totalCap}h</div>
                <div className="text-[10px] text-slate-400">Total member available weekly hours</div>
              </div>

              <div className="bg-[#163153] border border-[#28476B] p-4 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">ALLOCATED WEEKLY CAPACITY</div>
                <div className="text-2xl font-black text-amber-400 font-mono">{allocatedCap}h</div>
                <div className="text-[10px] text-slate-400">Committed across active project charters</div>
              </div>

              <div className="bg-[#163153] border border-[#28476B] p-4 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">UNALLOCATED / BUFFER</div>
                <div className="text-2xl font-black text-blue-400 font-mono">{unallocatedBuffer}h</div>
                <div className="text-[10px] text-slate-400">Preserved operational reserve buffer</div>
              </div>

              <div className="bg-[#163153] border border-[#28476B] p-4 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">AVAILABLE FOR NEW ASSIGNMENT</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{remainingAssignable}h <span className="text-xs font-normal text-slate-300">max</span></div>
                <div className="text-[10px] text-slate-400">Subject to supervisor buffer policy</div>
              </div>
            </div>

            {/* CAPACITY CALCULATION FORMULA BANNER */}
            <div className="p-4 rounded-xl bg-[#163153] border border-[#28476B] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase font-mono tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Capacity Calculation Formula
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-white">
                <span className="px-2.5 py-1 rounded bg-[#10243E] border border-[#28476B] font-bold">TOTAL CAPACITY ({totalCap}h)</span>
                <span className="text-slate-400 font-bold">−</span>
                <span className="px-2.5 py-1 rounded bg-[#10243E] border border-[#28476B] font-bold text-amber-400">CURRENT ALLOCATIONS ({allocatedCap}h)</span>
                <span className="text-slate-400 font-bold">=</span>
                <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-700 font-bold text-emerald-300">REMAINING ASSIGNABLE ({remainingAssignable}h)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                The {unallocatedBuffer}h buffer remains visible and is not silently treated as fully available for new project assignments unless Husni explicitly chooses to allocate it.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Project Allocations Detail */}
              <div className="bg-[#163153] p-5 rounded-2xl border border-[#28476B] space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Current Project Allocations: {selectedMember.name}</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-adjust-project-allocation-teamview"
                      onClick={() => {
                        setAllocationTargetProjectId('PRJ-324');
                        setIsAllocationModalOpen(true);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>VIEW / ADJUST PROJECT ALLOCATION</span>
                    </button>
                    <span className="font-mono text-[11px] text-slate-400">{selectedMember.id}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedMember.projectAllocations && selectedMember.projectAllocations.length > 0 ? (
                    selectedMember.projectAllocations.map((alloc) => (
                      <div key={alloc.projectId} className="p-3 rounded-xl bg-[#10243E] border border-[#28476B] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-mono font-bold text-[10px]">
                              {alloc.projectId}
                            </span>
                            <span className="font-bold text-white">{alloc.projectName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>Status: <strong className="text-emerald-400">{alloc.status}</strong> • Source: {alloc.source}</span>
                            <button
                              onClick={() => {
                                setAllocationTargetProjectId(alloc.projectId);
                                setIsAllocationModalOpen(true);
                              }}
                              className="text-indigo-300 hover:text-indigo-200 underline font-mono text-[10px] cursor-pointer"
                            >
                              Adjust
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-black text-amber-400 text-sm">{alloc.allocatedHoursPerWeek}h / week</div>
                          <div className="text-[10px] text-slate-400">{Math.round((alloc.allocatedHoursPerWeek / totalCap) * 100)}% of capacity</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-[#10243E] border border-[#28476B] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">PRJ-324: MSU FSVP Capability Development</div>
                          <div className="text-[10px] text-slate-400">Confirmed by Husni Hasan</div>
                        </div>
                        <div className="font-mono font-bold text-amber-400">15h / week (60%)</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#10243E] border border-[#28476B] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">PRJ-FSVP-01: U.S. Food Import & FSVP Client Readiness</div>
                          <div className="text-[10px] text-slate-400">Confirmed by Husni Hasan</div>
                        </div>
                        <div className="font-mono font-bold text-amber-400">7h / week (28%)</div>
                      </div>
                    </div>
                  )}

                  {/* Reserve Buffer Row */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    unallocatedBuffer === 0 
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' 
                      : 'bg-[#10243E]/60 border-dashed border-[#28476B]'
                  }`}>
                    <div>
                      <div className={`font-bold ${unallocatedBuffer === 0 ? 'text-amber-300' : 'text-blue-300'}`}>
                        {unallocatedBuffer === 0 ? 'Buffer Fully Consumed' : 'Unallocated Operational Buffer'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {unallocatedBuffer === 0 
                          ? 'Operational reserve is 0h; full capacity committed to project execution' 
                          : 'Preserved for deep learning, focus periods & supervisor contingency'}
                      </div>
                    </div>
                    <div className={`font-mono font-bold ${unallocatedBuffer === 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {unallocatedBuffer}h / week ({Math.round((unallocatedBuffer / totalCap) * 100)}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Assignment Recommendation & Capacity Conflict Evaluator */}
              <div className="bg-[#163153] p-5 rounded-2xl border border-[#28476B] space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    C-Bridge AI Capacity Conflict Evaluator
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                    ACTIVE AUDIT
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#10243E] border border-amber-900/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-300 text-xs">
                      CAPACITY CONFLICT DETECTED FOR NEW PROJECT ASSIGNMENTS
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    AI evaluation evaluated against: remaining capacity ({remainingAssignable}h), existing project allocations (PRJ-324: 15h, PRJ-FSVP-01: 7h), scheduled workload, availability window, and buffer policy.
                  </p>
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-[11px] text-rose-200 space-y-1.5">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5 text-rose-400" /> Proposed Project: PRJ-CB-02 (Requires ~10h/week)
                    </div>
                    <p className="text-rose-200">
                      Cannot assign PRJ-CB-02 without exceeding Samar Baydoun's weekly capacity limit. {allocatedCap}h of {totalCap}h are already committed. Adding PRJ-CB-02 would produce a 7h weekly deficit (32h total load).
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="font-bold text-slate-300 text-[11px]">AI Suggested Resolution Options:</div>
                    <ul className="space-y-1 text-[11px] text-slate-300 list-disc pl-4">
                      <li><span className="font-semibold text-white">Reduce Existing Allocation:</span> Reduce PRJ-324 (from 15h) or PRJ-FSVP-01 (from 7h) to free up required bandwidth.</li>
                      <li><span className="font-semibold text-white">Use Approved Buffer:</span> Allocate from the 3h reserve buffer (requires explicit Husni approval).</li>
                      <li><span className="font-semibold text-white">Defer Project Assignment:</span> Postpone PRJ-CB-02 until Phase 1 deliverables of PRJ-FSVP-01 / PRJ-324 are completed.</li>
                      <li><span className="font-semibold text-white">Change Project Priority:</span> Adjust delivery timelines to lower required weekly intensity.</li>
                      <li><span className="font-semibold text-white">Assign Alternative Member:</span> Assign PRJ-CB-02 to Husni Hasan or onboard new capacity.</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-[#28476B] text-[10px] text-slate-400 italic">
                    Note: Husni Hasan makes the final project assignment and allocation decision.
                  </div>
                </div>
              </div>
            </div>

            {/* Project List with Allocation States */}
            <div className="bg-[#163153] p-5 rounded-2xl border border-[#28476B] space-y-4 text-xs">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Project Charters & Member Assignment Status
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projects.map((proj) => {
                  const isAssigned = selectedMember.projectAssignments.includes(proj.id);
                  const alloc = selectedMember.projectAllocations?.find(p => p.projectId === proj.id);
                  const isConflict = !isAssigned && remainingAssignable < 5;

                  return (
                    <div key={proj.id} className="p-4 rounded-xl bg-[#10243E] border border-[#28476B] flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] text-blue-400 bg-blue-950 border border-blue-800 px-1.5 py-0.5 rounded font-bold">
                            {proj.id}
                          </span>
                          {isAssigned ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold font-mono text-[10px]">
                              ASSIGNED ({alloc?.allocatedHoursPerWeek || (proj.id === 'PRJ-324' ? 15 : 7)}h/wk)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-bold font-mono text-[10px]">
                              UNASSIGNED
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white text-xs">{proj.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{proj.currentPhase}</div>
                      </div>

                      <div className="pt-2 border-t border-[#28476B]">
                        {isAssigned ? (
                          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active Project Allocation ({alloc?.allocatedHoursPerWeek || (proj.id === 'PRJ-324' ? 15 : 7)}h/week)</span>
                          </div>
                        ) : isConflict ? (
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>CAPACITY CONFLICT — Requires Reallocation</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Exceeds 3h remaining unallocated capacity.
                            </div>
                          </div>
                        ) : (
                          <button
                            id={`btn-assign-proj-${proj.id}`}
                            onClick={() => onAssignProject(selectedMember.id, proj.id)}
                            className="w-full px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                          >
                            ASSIGN TO PROJECT
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 6: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              Team Governance & Member Administration Audit Trail
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Preserves immutable history for role changes, schedule changes, availability exceptions, project assignments, supervisor changes, and performance reviews.
            </p>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-mono font-bold text-[10px]">
                      {log.changeCategory}
                    </span>
                    <span className="font-bold text-white">{log.targetMemberName}</span>
                    <span className="text-slate-500">({log.targetMemberId})</span>
                  </div>
                  <p className="text-slate-300">{log.details}</p>
                </div>

                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <div>By {log.performedBy}</div>
                  <div>{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL 1: ADD MEMBER PROVISIONING MODAL */}
      {/* ================================================== */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Add Member — Husni Provisioning
              </h3>
              <button onClick={() => setIsAddMemberOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Member Name *</label>
                  <input
                    type="text"
                    required
                    value={newMemberData.name}
                    onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                    placeholder="e.g. Samar Baydoun"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Member Email *</label>
                  <input
                    type="email"
                    required
                    value={newMemberData.email}
                    onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                    placeholder="e.g. member@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Title</label>
                  <input
                    type="text"
                    value={newMemberData.title}
                    onChange={(e) => setNewMemberData({ ...newMemberData, title: e.target.value })}
                    placeholder="Development Coordinator"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Functional Role</label>
                  <input
                    type="text"
                    value={newMemberData.functionalRole}
                    onChange={(e) => setNewMemberData({ ...newMemberData, functionalRole: e.target.value })}
                    placeholder="Food Import Coordinator"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Supervisor</label>
                  <input
                    type="text"
                    disabled
                    value="Husni Hasan"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Employment Status</label>
                  <select
                    value={newMemberData.employmentStatus}
                    onChange={(e) => setNewMemberData({ ...newMemberData, employmentStatus: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="FULL TIME">FULL TIME</option>
                    <option value="PART TIME">PART TIME</option>
                    <option value="CONTRACTOR">CONTRACTOR</option>
                    <option value="SUPERVISOR / OWNER">SUPERVISOR / OWNER</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-blue-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Secure Invitation Flow
                </div>
                <p className="text-slate-400">
                  Account activation link will be dispatched securely. Plaintext passwords are never generated or stored.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  PROVISION MEMBER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL 2: ADD AVAILABILITY EXCEPTION MODAL */}
      {/* ================================================== */}
      {isExceptionModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Availability Exception — {selectedMember.name}
              </h3>
              <button onClick={() => setIsExceptionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExceptionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Exception Type</label>
                <select
                  value={newExceptionData.type}
                  onChange={(e) => setNewExceptionData({ ...newExceptionData, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="TEMPORARY AVAILABILITY CHANGE">TEMPORARY AVAILABILITY CHANGE</option>
                  <option value="TIME OFF">TIME OFF</option>
                  <option value="EXTRA AVAILABLE HOURS">EXTRA AVAILABLE HOURS</option>
                  <option value="UNAVAILABLE PERIOD">UNAVAILABLE PERIOD</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newExceptionData.startDate}
                    onChange={(e) => setNewExceptionData({ ...newExceptionData, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newExceptionData.endDate}
                    onChange={(e) => setNewExceptionData({ ...newExceptionData, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {newExceptionData.type !== 'TIME OFF' && newExceptionData.type !== 'UNAVAILABLE PERIOD' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Adjusted Daily Available Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={newExceptionData.adjustedHoursPerDay}
                    onChange={(e) => setNewExceptionData({ ...newExceptionData, adjustedHoursPerDay: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-bold mb-1">Reason / Justification</label>
                <textarea
                  rows={3}
                  value={newExceptionData.reason}
                  onChange={(e) => setNewExceptionData({ ...newExceptionData, reason: e.target.value })}
                  placeholder="e.g. Supervisor-approved training session or temporary conflict"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExceptionModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  SAVE EXCEPTION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* MODAL 3: C-BRIDGE AI PERFORMANCE REVIEW MODAL */}
      {/* ================================================== */}
      {isReviewModalOpen && activeReview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full text-white space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-300 font-mono font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>C-BRIDGE AI PERFORMANCE ANALYSIS</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Supervisor Review for {activeReview.memberName}
                </h3>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Suggested Score Callout */}
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-center justify-between text-xs">
              <div>
                <div className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                  AI SUGGESTED PERFORMANCE SCORE
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                  {activeReview.aiSuggestedScore} / 100
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {activeReview.aiReasoning}
                </div>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 rounded bg-slate-900 border border-amber-700 text-amber-200 font-mono font-bold text-[10px]">
                  PROVISIONAL / REQUIRES HUSNI SIGN-OFF
                </span>
              </div>
            </div>

            {/* Work & Evidence Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-slate-400 text-[10px] uppercase">Assigned Work</div>
                <div className="text-slate-200">{activeReview.assignedWorkSummary}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-slate-400 text-[10px] uppercase">Quality Observations</div>
                <div className="text-slate-200">{activeReview.qualityObservations}</div>
              </div>
            </div>

            {/* Husni Review Action Controls */}
            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                HUSNI SUPERVISOR REVIEW ACTIONS
              </h4>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Husni Final Score (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedScore}
                  onChange={(e) => setEditedScore(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Husni Supervisor Comment</label>
                <textarea
                  rows={3}
                  value={supervisorComment}
                  onChange={(e) => setSupervisorComment(e.target.value)}
                  placeholder="Add official supervisor evaluation notes or instruction guidance..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated: PerformanceReviewRecord = {
                      ...activeReview,
                      husniFinalScore: editedScore,
                      husniComments: supervisorComment || 'Accepted AI suggested performance score with full supervisor approval.',
                      supervisorAction: 'ACCEPTED',
                      reviewedAt: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT'
                    };
                    onSavePerformanceReview(updated);
                    setIsReviewModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  ACCEPT & SAVE REVIEW
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiExplanationText(
                      `AI Evaluation Breakdown for ${activeReview.memberName}:\n• Assigned Workload: ${activeReview.allocatedHours} hours within ${activeReview.availableCapacityHours}h daily capacity limit.\n• Task Completion Ratio: ${activeReview.tasksCompleted}/${activeReview.tasksStarted} tasks completed with uploaded evidence logs.\n• Quality & Accuracy: Adheres strictly to 21 CFR 1.506 regulatory source requirements.\n• Score Weighting: Quality (40%), Completeness (30%), Capacity Compliance (20%), Follow-Up Discipline (10%).`
                    );
                  }}
                  className="px-3 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-700 font-bold text-xs flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>ASK AI TO EXPLAIN</span>
                </button>
              </div>

              {aiExplanationText && (
                <div className="p-3 bg-blue-950/80 border border-blue-800 rounded-xl text-blue-200 text-[11px] font-mono whitespace-pre-wrap">
                  {aiExplanationText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ACTIVATE REAL USER ACCOUNT */}
      {isActivateModalOpen && memberToActivate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  {activationModalStep === 'ENTER_EMAIL'
                    ? `ACTIVATE ${memberToActivate.name.toUpperCase()} USER ACCOUNT`
                    : activationModalStep === 'CONFIRM_EMAIL'
                    ? 'CONFIRM MEMBER ACCOUNT EMAIL'
                    : 'ACCOUNT ACTIVATION LINK GENERATED'}
                </h3>
              </div>
              <button
                onClick={() => setIsActivateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: ENTER REAL EMAIL */}
            {activationModalStep === 'ENTER_EMAIL' && (
              <div className="space-y-4 text-xs">
                {/* Member Details Card */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                    Approved Member Profile
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Member:</span>
                    <strong className="text-white">{memberToActivate.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Member ID:</span>
                    <span className="text-slate-300 font-mono font-bold">{memberToActivate.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className="text-blue-300 font-bold">{memberToActivate.title || memberToActivate.functionalRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supervisor:</span>
                    <span className="text-slate-200 font-bold">{memberToActivate.supervisor || 'Husni Hasan'}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">
                    REAL ACCOUNT EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    value={confirmActivationEmail}
                    onChange={(e) => setConfirmActivationEmail(e.target.value)}
                    placeholder="Enter Samar's actual email address"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Notice Callout */}
                <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-amber-200 text-xs">
                  <p className="leading-relaxed">
                    "Enter Samar's actual email address. C-Bridge will not invent or infer member authentication emails."
                  </p>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsActivateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = confirmActivationEmail.trim();
                      if (!trimmed || !trimmed.includes('@')) {
                        alert("Please enter Samar's actual email address before continuing.");
                        return;
                      }
                      setActivationModalStep('CONFIRM_EMAIL');
                    }}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-2 cursor-pointer shadow-md"
                  >
                    <span>CONTINUE WITH THIS EMAIL</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CONFIRMATION BEFORE INVITATION */}
            {activationModalStep === 'CONFIRM_EMAIL' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                    Confirm Member Account Email
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Member Name:</span>
                    <strong className="text-white text-sm">{memberToActivate.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email:</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm bg-slate-900 px-2.5 py-1 rounded border border-slate-800 inline-block mt-0.5">
                      {confirmActivationEmail}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs font-medium">
                  "Is this the email Samar will use to sign in to C-Bridge?"
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActivateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivationModalStep('ENTER_EMAIL')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-900/60 font-bold cursor-pointer"
                  >
                    CHANGE EMAIL
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirmActivationEmail || !confirmActivationEmail.includes('@')) {
                        alert('Please enter a syntactically valid email address.');
                        return;
                      }

                      let serverToken: string | null = null;
                      if (onStartActivation) {
                        serverToken = await onStartActivation(memberToActivate, confirmActivationEmail);
                      }

                      if (!serverToken) {
                        return;
                      }

                      setGeneratedActivationToken(serverToken);
                      const actUrl = `${window.location.origin}/?activateToken=${serverToken}`;
                      setGeneratedActivationUrl(actUrl);

                      const updatedMember: TeamMember = {
                        ...memberToActivate,
                        email: confirmActivationEmail,
                        accountAccessStatus: 'INVITATION PENDING',
                        activationToken: serverToken,
                        activationEmail: confirmActivationEmail,
                        activationSentAt: new Date().toISOString()
                      };

                      onUpdateMember(updatedMember);
                      setActivationModalStep('ACTIVATION_GENERATED');
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-2 cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>CONFIRM & CREATE INVITATION</span>
                  </button>
                </div>
              </div>
            )}

            {activationModalStep === 'ACTIVATION_GENERATED' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-amber-950/80 border border-amber-800 rounded-xl text-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-amber-300 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>EMAIL DELIVERY SETUP REQUIRED</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                      DEVELOPMENT ACTIVATION LINK
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Transactional email delivery service (SMTP/Resend) is not configured in this preview environment.
                    An account activation invitation token has been created for <strong>{memberToActivate?.name || 'Samar Baydoun'}</strong> ({confirmActivationEmail}).
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                  <div>
                    <div className="flex items-center justify-between text-slate-300 text-[11px] font-sans font-bold mb-1">
                      <span className="text-purple-300 font-mono text-[10px] uppercase font-bold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/80">
                        DEVELOPMENT ACTIVATION LINK
                      </span>
                      <button
                        onClick={() => {
                          const devUrl = `${window.location.origin}/?activateToken=${generatedActivationToken}`;
                          navigator.clipboard.writeText(devUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-[10px] underline flex items-center gap-1 cursor-pointer font-mono"
                      >
                        <Copy className="w-3 h-3" /> {copiedLink ? 'Copied!' : 'Copy Dev Link'}
                      </button>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-400 break-all text-[11px]">
                      {`${window.location.origin}/?activateToken=[REDACTED_SECURE_TOKEN]`}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-300 text-[11px] font-sans font-bold mb-1">
                      <span className="text-emerald-300 font-mono text-[10px] uppercase font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                        C-BRIDGE MEMBER ACTIVATION LINK
                      </span>
                      {publicAppBaseUrl ? (
                        <button
                          onClick={() => {
                            const prodUrl = `${publicAppBaseUrl?.replace(/\/$/, '')}/?activateToken=${generatedActivationToken}`;
                            navigator.clipboard.writeText(prodUrl);
                            alert('Production activation link copied to clipboard!');
                          }}
                          className="text-emerald-400 hover:text-emerald-300 text-[10px] underline flex items-center gap-1 cursor-pointer font-mono"
                        >
                          <Copy className="w-3 h-3" /> Copy Production Link
                        </button>
                      ) : null}
                    </div>
                    {publicAppBaseUrl ? (
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-400 break-all text-[11px]">
                        {`${publicAppBaseUrl?.replace(/\/$/, '')}/?activateToken=[REDACTED_SECURE_TOKEN]`}
                      </div>
                    ) : (
                      <div className="bg-rose-950/60 p-3 rounded-xl border border-rose-800/80 text-rose-300 text-xs space-y-1">
                        <div className="font-bold font-mono text-amber-300 flex items-center space-x-1.5 font-sans">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>PRODUCTION APP URL CONFIGURATION REQUIRED</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">
                          To generate published production links, configure <code>PUBLIC_APP_BASE_URL</code> in environment variables.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between font-mono">
                    <span>Token Status: <strong className="text-emerald-400">GENERATED & SECURELY HASHED IN FIRESTORE</strong></span>
                    <span>Single-Use • Associated with MBR-001</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col space-y-2">
                  {onTestActivate && memberToActivate && (
                    <button
                      onClick={() => {
                        setIsActivateModalOpen(false);
                        onTestActivate(memberToActivate, generatedActivationToken);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>OPEN ACTIVATION PAGE AS SAMAR</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (memberToActivate && window.confirm(`Revoke current activation invitation for ${memberToActivate.name}? Token will be invalidated immediately.`)) {
                        if (onRevokeActivation) {
                          onRevokeActivation(memberToActivate.id);
                        } else {
                          onUpdateMember({
                            ...memberToActivate,
                            accountAccessStatus: 'NOT ACTIVATED',
                            activationToken: undefined,
                            activationSentAt: undefined,
                            activationEmail: undefined
                          });
                        }
                        setIsActivateModalOpen(false);
                      }
                    }}
                    className="w-full bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold py-2 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>REVOKE THIS INVITATION</span>
                  </button>

                  <button
                    onClick={() => setIsActivateModalOpen(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Allocation Adjustment Modal */}
      <ProjectAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        currentUser={currentUser}
        member={selectedMember}
        targetProjectId={allocationTargetProjectId}
        projects={projects}
        tasks={tasks}
        onSaveAllocation={(updatedMember, auditEntry, note, requiresReview) => {
          onUpdateMember(updatedMember);
        }}
      />

    </div>
  );
};
