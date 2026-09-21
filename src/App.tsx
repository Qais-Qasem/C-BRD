import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  TaskItem, 
  ControlDocument, 
  GovernanceDecision, 
  FollowUpItem, 
  WeeklyReport, 
  OfficialDocStatus, 
  TaskResultData, 
  TaskEvidenceRecord, 
  LiveLearningSession, 
  LiveSessionMessage, 
  SupervisorAttentionLevel, 
  AssetTaskSuggestion, 
  PriorityLevel,
  Project,
  MasterAgendaItem,
  MasterAgendaCategory,
  ProjectInput,
  PlanningAssumption,
  AgendaUpdateProposal,
  SupervisorDirectionRecord,
  AgendaHistoryRecord,
  ProposalStatus,
  TeamMember,
  AvailabilityException,
  PerformanceReviewRecord,
  TeamAuditLog,
  MemberApplication,
  InformationRequest,
  MemberProvisioningProposal,
  SuggestedWorkPlan,
  InAppNotification,
  CapacityValidationResult,
  ScheduleAuditEntry,
  MemberExecutionStatus,
  MemberWorkflowPosition
} from './types';
import { generateTaskStartTimestamp } from './utils/timezone';
import { validateCapacityGate } from './utils/schedulingEngine';
import { 
  INITIAL_TASKS, 
  INITIAL_DOCUMENTS, 
  INITIAL_DECISIONS, 
  INITIAL_FOLLOWUPS, 
  INITIAL_WEEKLY_REPORTS,
  INITIAL_PROJECTS,
  INITIAL_MASTER_AGENDA_ITEMS,
  INITIAL_PROJECT_INPUTS,
  INITIAL_PLANNING_ASSUMPTIONS,
  INITIAL_AGENDA_UPDATE_PROPOSALS,
  INITIAL_SUPERVISOR_DIRECTIONS,
  INITIAL_AGENDA_HISTORY,
  INITIAL_TEAM_MEMBERS,
  INITIAL_PERFORMANCE_REVIEWS,
  INITIAL_TEAM_AUDIT_LOGS,
  INITIAL_MEMBER_APPLICATIONS,
  INITIAL_IN_APP_NOTIFICATIONS
} from './data/mockData';
import { INITIAL_LIVE_SESSION } from './data/initialSession';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SignInScreen } from './components/SignInScreen';
import { ApplicantPortalView } from './components/ApplicantPortalView';
import { AccountInactiveScreen } from './components/AccountInactiveScreen';
import { UnverifiedEmailScreen } from './components/UnverifiedEmailScreen';
import { HusniDashboard } from './components/HusniDashboard';
import { SamarDashboard } from './components/SamarDashboard';
import { TasksAgendaView } from './components/TasksAgendaView';
import { DocumentsQAView } from './components/DocumentsQAView';
import { ApprovalsGovernanceView } from './components/ApprovalsGovernanceView';
import { FSVPDevelopmentView } from './components/FSVPDevelopmentView';
import { FollowUpsView } from './components/FollowUpsView';
import { ReportsView } from './components/ReportsView';
import { StudyLearningView } from './components/StudyLearningView';
import { HusniLiveSessionModal } from './components/HusniLiveSessionModal';
import { PriorityInferenceModal } from './components/PriorityInferenceModal';
import { AskCBridgeAIModal } from './components/AskCBridgeAIModal';
import { ProjectsMasterAgendaView } from './components/ProjectsMasterAgendaView';
import { TeamCapacityView } from './components/TeamCapacityView';
import { PublicSignUpModal } from './components/PublicSignUpModal';
import { ActivationScreen } from './components/ActivationScreen';
import { AccessDeniedScreen } from './components/AccessDeniedScreen';
import { CapabilityDevelopmentWorkspace } from './components/CapabilityDevelopmentWorkspace';
import { ConsultingCaseRoom } from './components/ConsultingCaseRoom';
import { ModuleStudyWorkspace } from './components/ModuleStudyWorkspace';
import { CourseSetupWorkspace } from './components/CourseSetupWorkspace';
import { 
  buildProgressiveOperationalSchedule,
  evaluateOverdueStatus,
  calculateMemberWorkingWindow,
  estimateEffortHoursForAgendaItem
} from './utils/schedulingEngine';
import { CapacityPlanningPanel } from './components/CapacityPlanningPanel';
import { CBridgeAssetLibraryView } from './components/CBridgeAssetLibraryView';
import { ProjectProposalModal } from './components/ProjectProposalModal';
import { ProjectSourceLibraryModal } from './components/ProjectSourceLibraryModal';
import { AskSupervisorModal } from './components/AskSupervisorModal';
import {
  ProjectProposal,
  ProjectSource,
  CBridgeAssetLibraryRecord,
  AskSupervisorQuestion,
  ProposalStatusType
} from './types';
import { Sparkles } from 'lucide-react';
import { 
  isFirebaseConnected, 
  getFirebaseAuth,
  authSignIn, 
  authSignUp, 
  authSignOut, 
  authResetPassword, 
  subscribeToAuthChanges,
  resendEmailVerificationForCurrentUser
} from './lib/firebase';

export interface AuthSession {
  uid: string;
  email: string;
  displayName: string;
  accessType: 'OWNER_ADMIN' | 'ACTIVE_MEMBER' | 'APPLICANT' | 'INACTIVE_MEMBER' | 'UNVERIFIED_EMAIL';
  mappedRole: UserRole;
  emailVerified: boolean;
  memberProfile?: TeamMember;
  applicantProfile?: MemberApplication;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserRole>('HUSNI');
  const [activeView, setActiveView] = useState<string>('login');
  
  // Real Auth State
  const [isDemoSession, setIsDemoSession] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [currentApplicant, setCurrentApplicant] = useState<MemberApplication | null>(null);

  // Member Account Activation & Public App Config State
  const [publicAppBaseUrl, setPublicAppBaseUrl] = useState<string>('');
  const [activationToken, setActivationToken] = useState<string | null>(null);
  const [activationEmail, setActivationEmail] = useState<string | null>(null);
  const [isActivationViewOpen, setIsActivationViewOpen] = useState<boolean>(false);

  // Persistent Member Workflow Position & Deep Linking
  const [moduleStudyInitialStage, setModuleStudyInitialStage] = useState<number | undefined>(6);
  const [memberWorkflowPosition, setMemberWorkflowPosition] = useState<MemberWorkflowPosition | null>(null);

  // Load Member's last workflow position from server
  useEffect(() => {
    const memberId = currentUser === 'HUSNI' ? 'MBR-002' : 'MBR-001';
    fetch(`/api/member-workflow/position/${memberId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.position) {
          const canonicalPos = {
            ...data.position,
            projectId: (data.position.projectId === 'PRJ-FSVP-01' || !data.position.projectId) ? 'PRJ-324' : data.position.projectId
          };
          setMemberWorkflowPosition(canonicalPos);
          if (canonicalPos.workflowStep) {
            setModuleStudyInitialStage(canonicalPos.workflowStep);
          }
          if (canonicalPos.projectId) {
            setSelectedProjectId(canonicalPos.projectId);
          }
        }
      })
      .catch(err => console.warn('Could not load member workflow position:', err));
  }, [currentUser]);

  const handleResumeWorkflow = (position?: MemberWorkflowPosition) => {
    const targetPos = position || memberWorkflowPosition;
    if (targetPos) {
      const projId = (targetPos.projectId === 'PRJ-FSVP-01' || !targetPos.projectId) ? 'PRJ-324' : targetPos.projectId;
      setSelectedProjectId(projId);
      if (targetPos.workflowStep) {
        setModuleStudyInitialStage(targetPos.workflowStep);
      }
      if (targetPos.workspaceType === 'MODULE_STUDY_WORKSPACE' || targetPos.workspaceType === 'CASE_ROOM' || targetPos.workspaceType === 'MODULE_STUDY') {
        setActiveView('case-room');
      } else if (targetPos.workspaceType === 'COURSE_SETUP') {
        setActiveView('course-setup');
      } else if (targetPos.workspaceType === 'CAPABILITY_WORKSPACE') {
        setActiveView('workspace');
      } else {
        setActiveView('case-room');
      }
    } else {
      setSelectedProjectId('PRJ-324');
      setModuleStudyInitialStage(7);
      setActiveView('case-room');
    }
  };

  // Fetch Public App Base URL configuration from server
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.publicAppBaseUrl) {
          setPublicAppBaseUrl(data.publicAppBaseUrl);
        }
      })
      .catch((err) => console.error('Failed to load publicAppBaseUrl config:', err));
  }, []);

  // Check URL pathname and parameters for /activate route and activation token
  useEffect(() => {
    const pathname = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || params.get('activateToken');

    if (pathname.includes('/activate') || tokenParam) {
      if (tokenParam) {
        setActivationToken(tokenParam);
      }
      setIsActivationViewOpen(true);
    }
  }, []);

  // Load persistent team members from Firestore backend on startup
  useEffect(() => {
    const loadPersistentMembers = async () => {
      try {
        const res = await fetch('/api/members');
        if (res.ok) {
          const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
          if (Array.isArray(data.members) && data.members.length > 0) {
            setTeamMembers(data.members);
          }
        }
      } catch (err) {
        console.error('Failed to load persistent members from Firestore:', err);
      }

      // Sync MBR-001 invitation state from Firestore
      try {
        const res = await fetch('/api/invitations/member/MBR-001');
        if (res.ok) {
          const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
          setTeamMembers((prev) => prev.map((m) => {
            if (m.id === 'MBR-001') {
              if (data.invitation && data.invitationStatus === 'INVITATION PENDING') {
                return {
                  ...m,
                  email: data.invitation.email,
                  activationEmail: data.invitation.email,
                  accountAccessStatus: 'INVITATION PENDING',
                  activationToken: data.invitation.token,
                  activationSentAt: data.invitation.createdAt,
                  invitationCreatedAt: data.invitation.createdAt,
                  invitationExpiresAt: data.invitation.expiresAt
                };
              } else if (data.member && data.member.accountAccessStatus === 'ACTIVE') {
                return {
                  ...m,
                  email: data.member.email,
                  activationEmail: data.member.email,
                  linkedUid: data.member.linkedUid,
                  accountAccessStatus: 'ACTIVE',
                  accountStatus: 'ACTIVE',
                  activationToken: undefined
                };
              } else {
                return {
                  ...m,
                  email: '',
                  activationEmail: undefined,
                  accountAccessStatus: 'NOT ACTIVATED',
                  activationToken: undefined,
                  linkedUid: undefined
                };
              }
            }
            return m;
          }));
        }
      } catch (err) {
        console.error('Failed to sync MBR-001 invitation state:', err);
      }
    };

    loadPersistentMembers();
  }, []);

  // Subscribe to Firebase Auth state changes
  useEffect(() => {
    if (isFirebaseConnected()) {
      const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
        if (firebaseUser && firebaseUser.email) {
          if (!authSession || authSession.email !== firebaseUser.email.toLowerCase()) {
            handleResolveAuthUser(firebaseUser.email, firebaseUser);
          }
        } else {
          if (!isDemoSession) {
            setIsLoggedIn(false);
            setAuthSession(null);
            setCurrentApplicant(null);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [isDemoSession]);

  // Load canonical workspace records and projects from Firestore on mount & auth change
  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        const auth = getFirebaseAuth();
        let headers: Record<string, string> = {};
        if (auth?.currentUser) {
          try {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
          } catch (e) {
            console.error('Failed to get token:', e);
          }
        }

        // Fetch canonical projects
        try {
          const prjRes = await fetch('/api/projects');
          const prjData = await prjRes.json();
          if (prjData.projects && prjData.projects.length > 0) {
            setProjects(prjData.projects);
          }
        } catch (pe) {
          console.warn('Could not load projects from API:', pe);
        }

        // Fetch canonical project inputs
        try {
          const inpRes = await fetch('/api/projects/inputs');
          const inpData = await inpRes.json();
          if (inpData.inputs && inpData.inputs.length > 0) {
            setProjectInputs(inpData.inputs);
          }
        } catch (ie) {
          console.warn('Could not load project inputs from API:', ie);
        }

        const res = await fetch('/api/workspace/records', { headers });
        const result = await res.json();
        if (result.success && result.data) {
          if (result.data.proposals && result.data.proposals.length > 0) {
            setProposals(result.data.proposals);
          }
          if (result.data.sources && result.data.sources.length > 0) {
            setSources(result.data.sources);
          }
          if (result.data.assetLibraryRecords && result.data.assetLibraryRecords.length > 0) {
            setAssetLibraryRecords(result.data.assetLibraryRecords);
          }
          if (result.data.supervisorQuestions && result.data.supervisorQuestions.length > 0) {
            setSupervisorQuestions(result.data.supervisorQuestions);
          }
          if (result.data.projects && result.data.projects.length > 0) {
            setProjects(result.data.projects);
          }
          if (result.data.projectInputs && result.data.projectInputs.length > 0) {
            setProjectInputs(result.data.projectInputs);
          }
        }
      } catch (err) {
        console.error('Failed to fetch workspace data from Firestore:', err);
      }
    };
    loadWorkspaceData();
  }, [currentUser]);

  // Modals
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isAskAIModalOpen, setIsAskAIModalOpen] = useState(false);
  const [isHusniSessionModalOpen, setIsHusniSessionModalOpen] = useState(false);

  // App State Data
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [masterAgendaItems, setMasterAgendaItems] = useState<MasterAgendaItem[]>(INITIAL_MASTER_AGENDA_ITEMS);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [documents, setDocuments] = useState<ControlDocument[]>(INITIAL_DOCUMENTS);
  const [decisions, setDecisions] = useState<GovernanceDecision[]>(INITIAL_DECISIONS);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(INITIAL_FOLLOWUPS);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>(INITIAL_WEEKLY_REPORTS);
  const [liveSession, setLiveSession] = useState<LiveLearningSession>(INITIAL_LIVE_SESSION);

  // Progressive AI Planning State
  const [projectInputs, setProjectInputs] = useState<ProjectInput[]>(INITIAL_PROJECT_INPUTS);
  const [planningAssumptions, setPlanningAssumptions] = useState<PlanningAssumption[]>(INITIAL_PLANNING_ASSUMPTIONS);
  const [agendaUpdateProposals, setAgendaUpdateProposals] = useState<AgendaUpdateProposal[]>(() => {
    // Filter out and sanitize any previous duplicate generic "Incorporate Material: Syllabus" proposals
    return INITIAL_AGENDA_UPDATE_PROPOSALS.filter(
      (p) => !p.proposedItem?.taskTitle?.toLowerCase().includes('incorporate material: syllabus')
    );
  });
  const [supervisorDirections, setSupervisorDirections] = useState<SupervisorDirectionRecord[]>(INITIAL_SUPERVISOR_DIRECTIONS);
  const [agendaHistory, setAgendaHistory] = useState<AgendaHistoryRecord[]>(INITIAL_AGENDA_HISTORY);

  // Team Administration & Capacity State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReviewRecord[]>(INITIAL_PERFORMANCE_REVIEWS);
  const [teamAuditLogs, setTeamAuditLogs] = useState<TeamAuditLog[]>(INITIAL_TEAM_AUDIT_LOGS);

  // Self-Service Member Registration & Onboarding State
  const [memberApplications, setMemberApplications] = useState<MemberApplication[]>(INITIAL_MEMBER_APPLICATIONS);
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>(INITIAL_IN_APP_NOTIFICATIONS);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

  // Capability Development Workspace & Asset Library State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('PRJ-324');
  const [proposals, setProposals] = useState<ProjectProposal[]>([
    {
      id: 'PROP-9113',
      title: 'U.S. Food Import & Foreign Supplier Verification Capability',
      proposedBy: 'Samar Baydoun',
      proposalDate: '2026-08-10',
      origin: 'COURSE / TRAINING',
      targetCapabilityArea: 'U.S. Food Import & FSVP Development',
      originalReason: 'Develop comprehensive C-Bridge consulting capability for foreign supplier verification under 21 CFR 1.500.',
      uploadedSources: [{ name: 'MSU FSVP Module 1 Document' }],
      status: 'APPROVED',
      husniDecision: 'Approved by Husni Hasan for Pilot Wave 1 Capability Development Workspace.',
      decisionDate: '2026-08-11'
    }
  ]);

  const [sources, setSources] = useState<ProjectSource[]>([
    {
      id: 'SRC-9113-01',
      projectId: 'PRJ-FSVP-01',
      title: 'FDA Foreign Supplier Verification Programs Guidance for Industry',
      category: 'GOVERNMENT GUIDANCE',
      description: 'Official FDA guidance document detailing statutory compliance expectations under 21 CFR 1.500 subpart L.',
      fileOrUrl: 'https://www.fda.gov/media/fsvp-guidance.pdf',
      uploadedBy: 'Husni Hasan',
      uploadedAt: '2026-08-11T10:00:00Z',
      relatedModuleCode: 'SB-9113',
      protectedMaterialFlag: false,
      aiProcessingStatus: 'ANALYZED'
    }
  ]);

  const [assetLibraryRecords, setAssetLibraryRecords] = useState<CBridgeAssetLibraryRecord[]>([
    {
      id: 'LIB-AST-FSVP-01',
      projectAssetId: 'AST-FSVP-01',
      assetName: 'FSVP Foreign Supplier Review Checklist',
      assetType: 'CHECKLIST',
      version: 'v1.0',
      effectiveVersion: 'v1.0-APPROVED',
      createdBy: 'Samar Baydoun',
      contributors: ['C-Bridge AI Coach'],
      projectOfOrigin: 'FSVP Foreign Supplier Verification Readiness',
      approvedBy: 'Husni Hasan',
      approvalDate: '2026-08-12',
      revisionHistory: [{ version: 'v1.0', updatedBy: 'Husni Hasan', date: '2026-08-12', notes: 'Supervisor Approval' }],
      relatedCapability: 'U.S. Food Import & FSVP Compliance',
      relatedService: 'FSVP Consulting Services',
      relatedSources: ['FDA FSVP Draft Guidance'],
      regulatoryBasis: ['21 CFR Part 1 Subpart L'],
      country: 'United States',
      industry: 'Food & Agriculture Import',
      status: 'ACTIVE',
      content: `# C-BRIDGE CONTROLLED DOCUMENT\n\n**DOCUMENT NAME:** FSVP Foreign Supplier Review Checklist\n**DOCUMENT CODE:** AST-FSVP-01\n**VERSION:** v1.0-APPROVED\n**AUTHOR:** Samar Baydoun\n**SUPERVISOR:** Husni Hasan\n\n- [x] Importer DUNS Number verified.\n- [x] Foreign Supplier FDA Registration confirmed.\n- [x] Written Hazard Analysis reviewed for 21 CFR 1.504 compliance.\n- [x] Onsite annual audit verified for SAHC hazards under 21 CFR 1.506.`
    }
  ]);

  const [supervisorQuestions, setSupervisorQuestions] = useState<AskSupervisorQuestion[]>([]);

  const handleAddProposal = async (newProposal: ProjectProposal) => {
    setProposals(prev => [newProposal, ...prev]);
    try {
      const auth = getFirebaseAuth();
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (e) {
          console.error('Failed to get token:', e);
        }
      }
      await fetch('/api/workspace/save-record', {
        method: 'POST',
        headers,
        body: JSON.stringify({ recordType: 'PROJECT_PROPOSAL', docId: newProposal.id, record: newProposal })
      });
    } catch (err) {
      console.error('Failed to persist proposal to Firestore:', err);
    }
  };

  const handleReviewProposal = async (proposalId: string, status: ProposalStatusType, comments?: string) => {
    const actionType = status === 'APPROVED' ? 'APPROVE_PROPOSAL' : 'REJECT_PROPOSAL';

    try {
      const auth = getFirebaseAuth();
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (e) {
          console.error('Failed to get token:', e);
        }
      }

      const res = await fetch('/api/governance/authorized-action', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          actionType,
          targetId: proposalId,
          payload: { comments }
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (!data.success) {
        alert(`Governance Check Failed: ${data.error}`);
        return;
      }

      setProposals(prev =>
        prev.map(p => {
          if (p.id === proposalId) {
            const updated = {
              ...p,
              status,
              husniDecision: comments || `Husni Hasan Supervisor Decision: ${status}`,
              decisionDate: new Date().toISOString().split('T')[0]
            };
            if (status === 'APPROVED') {
              const newProject: Project = {
                id: `PRJ-${p.id?.replace('PROP-', '')}`,
                name: p.title,
                purpose: p.originalReason,
                businessObjective: p.targetCapabilityArea,
                scope: 'Capability Development Workspace Phase 1',
                outOfScopeBoundaries: 'Commercial mass execution outside Phase 1',
                supervisor: 'Husni Hasan',
                assignedMembers: [p.proposedBy, 'Husni Hasan'],
                startDate: new Date().toISOString().split('T')[0],
                targetDate: '2026-12-31',
                currentPhase: 'PHASE 1 - STUDY & SIMULATION',
                status: 'IN_PROGRESS',
                expectedDeliverables: ['Asset Brief', 'Draft Assets'],
                risks: ['Timeline delays'],
                dependencies: ['Husni Hasan Supervisor Approval'],
                relatedGovernanceDecisions: ['CB-9110'],
                origin: p.origin,
                capabilityDeveloper: p.proposedBy,
                environment: 'REAL ACTIVE',
                proposalId: p.id,
                createdAt: new Date().toISOString()
              };
              setProjects(projectsPrev => [newProject, ...projectsPrev]);
            }
            return updated;
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Proposal review governance call error:', err);
    }
  };

  const handleAddSource = async (newSource: ProjectSource) => {
    setSources(prev => [newSource, ...prev]);
    try {
      await fetch('/api/workspace/save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName: 'sources', docId: newSource.id, record: newSource })
      });
    } catch (err) {
      console.error('Failed to save source to Firestore:', err);
    }
  };

  const handleSubmitSupervisorQuestion = async (question: AskSupervisorQuestion) => {
    setSupervisorQuestions(prev => [question, ...prev]);
    try {
      await fetch('/api/workspace/save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName: 'supervisor_questions', docId: question.id, record: question })
      });
    } catch (err) {
      console.error('Failed to save supervisor question to Firestore:', err);
    }
  };

  const handlePromoteAssetToLibrary = async (record: CBridgeAssetLibraryRecord) => {
    setAssetLibraryRecords(prev => [record, ...prev]);
    try {
      await fetch('/api/workspace/save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName: 'asset_library_records', docId: record.id, record })
      });
    } catch (err) {
      console.error('Failed to save asset library record to Firestore:', err);
    }
  };

  const handleSubmitApplication = (newApp: MemberApplication) => {
    setMemberApplications((prev) => [newApp, ...prev]);

    const notif: InAppNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      timestamp: newApp.createdAt,
      recipientEmail: newApp.email,
      recipientName: newApp.fullName,
      eventType: 'APPLICATION_RECEIVED',
      title: 'Application Received — Pending Review',
      message: `Thank you for registering with C-Bridge. Your application (${newApp.id}) is currently pending executive review by Managing Director Husni Hasan.`,
      deliveryStatus: 'EMAIL INTEGRATION PENDING',
      read: false
    };
    setInAppNotifications((prev) => [notif, ...prev]);

    const audit: TeamAuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: newApp.createdAt,
      performedBy: newApp.fullName,
      targetMemberId: newApp.id,
      targetMemberName: newApp.fullName,
      changeCategory: 'MEMBER_APPLICATION',
      details: `Submitted self-service member registration (${newApp.id}) for ${newApp.functionalArea}`
    };
    setTeamAuditLogs((prev) => [audit, ...prev]);
  };

  const handleRespondToInfoRequest = (appId: string, requestId: string, responseText: string, docName?: string) => {
    const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';

    setMemberApplications((prev) => prev.map((app) => {
      if (app.id === appId) {
        const updatedRequests = (app.infoRequests || []).map((req) => {
          if (req.id === requestId) {
            return {
              ...req,
              status: 'RESPONDED' as const,
              responseAt: nowStr,
              responseDetails: responseText,
              responseDocumentName: docName
            };
          }
          return req;
        });

        return {
          ...app,
          status: 'PENDING_REVIEW',
          updatedAt: nowStr,
          infoRequests: updatedRequests
        };
      }
      return app;
    }));

    const app = memberApplications.find((a) => a.id === appId);
    if (app) {
      const audit: TeamAuditLog = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        performedBy: app.fullName,
        targetMemberId: app.id,
        targetMemberName: app.fullName,
        changeCategory: 'INFORMATION_REQUEST',
        details: `Applicant ${app.fullName} provided clarification for request ${requestId}. Application returned to Husni Review.`
      };
      setTeamAuditLogs((prev) => [audit, ...prev]);
    }
  };

  const handleUpdateApplication = (updatedApp: MemberApplication) => {
    setMemberApplications((prev) => prev.map((a) => a.id === updatedApp.id ? updatedApp : a));
    if (currentApplicant && currentApplicant.id === updatedApp.id) {
      setCurrentApplicant(updatedApp);
    }
  };

  // Step 1: Husni Approves Application -> Status becomes APPROVED_PENDING_PROVISIONING & Proposal created
  const handleApproveApplication = (app: MemberApplication, customProposal?: MemberProvisioningProposal) => {
    const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';

    const defaultProposal: MemberProvisioningProposal = customProposal || {
      proposalId: `PROP-${Date.now().toString().slice(-4)}`,
      createdAt: nowStr,
      createdBy: 'Husni Hasan',
      memberName: app.fullName,
      approvedTitle: app.aiAnalysis?.suggestedRole || `${app.functionalArea} Specialist`,
      functionalRole: app.functionalArea,
      supervisor: 'Husni Hasan',
      roleScope: 'Phase 1 — U.S. Food Import Readiness & Documentation',
      authority: 'Follows Husni-approved member governance CB-9110 / SB-9100',
      permissions: ['EXECUTION', 'QA_SUBMISSION', 'LEARNING', 'CBRIDGE_AI'],
      weeklyCapacity: app.totalWeeklyHours || 20,
      workingSchedule: {
        workingDays: app.availableWorkingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        normalStartTime: app.dailyStartTime || '09:00 AM',
        normalEndTime: app.dailyEndTime || '02:00 PM',
        hoursAvailablePerDay: Math.round((app.totalWeeklyHours || 20) / ((app.availableWorkingDays || []).length || 5)),
        hoursAvailablePerWeek: app.totalWeeklyHours || 20,
        timezone: app.timezone || 'EDT (UTC-4)',
        dailySchedules: []
      },
      approvedProjects: ['PRJ-FSVP-01'],
      suggestedWorkstreams: app.aiAnalysis?.possibleWorkstreamFit || ['Foreign Supplier Verification'],
      requiredOnboarding: app.aiAnalysis?.trainingNeeds || ['C-Bridge Operating Charter Orientation'],
      requiredLearning: ['FSPCA PCQI Module Review', 'CB-9120 Document Control SOP'],
      initialTasks: app.aiAnalysis?.suggestedInitialResponsibilities || ['Review foreign supplier hazard analysis submissions'],
      reportingRequirements: 'Daily agenda log & weekly performance review sign-off',
      status: 'DRAFT'
    };

    const approvedApp: MemberApplication = {
      ...app,
      status: 'APPROVED_PENDING_PROVISIONING',
      updatedAt: nowStr,
      provisioningProposal: defaultProposal
    };

    setMemberApplications((prev) => prev.map((a) => a.id === app.id ? approvedApp : a));
    if (currentApplicant && (currentApplicant.id === app.id || currentApplicant.email.toLowerCase() === app.email.toLowerCase())) {
      setCurrentApplicant(approvedApp);
    }

    // Create Notification for Applicant
    const notif: InAppNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      recipientEmail: app.email,
      recipientName: app.fullName,
      eventType: 'APPLICATION_APPROVED',
      title: 'Application Approved — C-Bridge Membership Setup In Progress',
      message: `Managing Director Husni Hasan has executive-approved your application (${app.id}). C-Bridge membership provisioning and onboarding setup are now in progress.`,
      deliveryStatus: 'EMAIL INTEGRATION PENDING',
      read: false
    };
    setInAppNotifications((prev) => [notif, ...prev]);

    // Create Audit Log
    const audit: TeamAuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      performedBy: 'Husni Hasan',
      targetMemberId: app.id,
      targetMemberName: app.fullName,
      changeCategory: 'MEMBER_APPLICATION',
      details: `Approved By: Husni Hasan | Approval Timestamp: ${nowStr} | Previous Status: ${app.status} | New Status: APPROVED_PENDING_PROVISIONING | Provisioning Created: ${defaultProposal.proposalId}`
    };
    setTeamAuditLogs((prev) => [audit, ...prev]);
  };

  // Step 2: Final Activation -> Husni clicks "CONFIRM & ACTIVATE MEMBER"
  const handleConfirmAndActivateMember = (
    app: MemberApplication, 
    proposal: MemberProvisioningProposal, 
    workPlan?: SuggestedWorkPlan
  ) => {
    const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';

    const confirmedProposal = { ...proposal, status: 'CONFIRMED' as const };

    // 1. Update Application status to APPROVED (ACTIVE MEMBER)
    const activatedApp: MemberApplication = {
      ...app,
      status: 'APPROVED',
      updatedAt: nowStr,
      provisioningProposal: confirmedProposal,
      suggestedWorkPlan: workPlan
    };
    setMemberApplications((prev) => prev.map((a) => a.id === app.id ? activatedApp : a));

    // 2. Provision Team Member into Active Team Pool (Same Identity)
    const memberId = app.createdMemberId || `MBR-${Math.floor(100 + Math.random() * 900)}`;
    const newMember: TeamMember = {
      id: memberId,
      name: app.fullName,
      email: app.email,
      title: proposal.approvedTitle,
      functionalRole: proposal.functionalRole,
      supervisor: proposal.supervisor || 'Husni Hasan',
      employmentStatus: 'FULL TIME',
      timezone: app.timezone,
      projectAssignments: proposal.approvedProjects,
      roleScope: proposal.roleScope,
      responsibilities: proposal.initialTasks || ['Execute assigned C-Bridge Master Agenda tasks'],
      authority: proposal.authority,
      requiredApprovals: ['CB-9110 Governance Decisions', 'QA Signoffs'],
      accessPermissions: (proposal.permissions as any) || ['EXECUTION', 'QA_SUBMISSION', 'LEARNING'],
      startDate: new Date().toISOString().split('T')[0],
      accountStatus: 'ACTIVE',
      schedule: proposal.workingSchedule,
      exceptions: []
    };

    setTeamMembers((prev) => {
      const exists = prev.some((m) => m.email.toLowerCase() === app.email.toLowerCase());
      if (exists) {
        return prev.map((m) => m.email.toLowerCase() === app.email.toLowerCase() ? newMember : m);
      }
      return [newMember, ...prev];
    });

    // 3. Create Notification Event
    const notif: InAppNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      recipientEmail: app.email,
      recipientName: app.fullName,
      eventType: 'PROPOSAL_CONFIRMED',
      title: 'C-Bridge Member Account Activated',
      message: `Husni Hasan has confirmed your Member Provisioning Proposal (${proposal.proposalId}) and activated your account as ${proposal.approvedTitle}.`,
      deliveryStatus: 'EMAIL INTEGRATION PENDING',
      read: false
    };
    setInAppNotifications((prev) => [notif, ...prev]);

    // 4. Create Audit Log
    const audit: TeamAuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      performedBy: 'Husni Hasan',
      targetMemberId: memberId,
      targetMemberName: app.fullName,
      changeCategory: 'ACCOUNT_STATUS',
      details: `Activated By: Husni Hasan | Activation Timestamp: ${nowStr} | Approved By: Husni Hasan | Previous Status: APPROVED_PENDING_PROVISIONING | New Status: ACTIVE_MEMBER (APPROVED) | Provisioning Proposal Confirmed (${proposal.proposalId})`
    };
    setTeamAuditLogs((prev) => [audit, ...prev]);

    // 5. Upgrade active session if logged in
    if (currentApplicant && (currentApplicant.id === app.id || currentApplicant.email.toLowerCase() === app.email.toLowerCase())) {
      setCurrentApplicant(activatedApp);
      if (authSession?.accessType === 'APPLICANT') {
        setAuthSession({
          ...authSession,
          accessType: 'ACTIVE_MEMBER',
          displayName: app.fullName,
          memberProfile: newMember
        });
      }
    }
  };

  const handleApproveAndProvision = handleConfirmAndActivateMember;

  // Applicant Portal Session Refresh Callback
  const handleRefreshApplicantStatus = () => {
    if (!currentApplicant && !authSession?.email) return;
    const targetEmail = currentApplicant?.email || authSession?.email || '';
    const latestApp = memberApplications.find(
      (a) => a.email.toLowerCase() === targetEmail.toLowerCase() || a.id === currentApplicant?.id
    );

    if (latestApp) {
      setCurrentApplicant(latestApp);
      if (latestApp.status === 'APPROVED' && authSession) {
        const foundMember = teamMembers.find((m) => m.email.toLowerCase() === latestApp.email.toLowerCase());
        setAuthSession({
          ...authSession,
          accessType: 'ACTIVE_MEMBER',
          displayName: latestApp.fullName,
          memberProfile: foundMember
        });
      }
    }
  };

  const handleRequestMoreInfo = (appId: string, question: string, evidenceReq?: string) => {
    const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';

    const reqId = `REQ-${Date.now().toString().slice(-4)}`;
    const newReq: InformationRequest = {
      id: reqId,
      requestedAt: nowStr,
      requestedBy: 'Husni Hasan',
      question,
      requestedEvidence: evidenceReq,
      status: 'OPEN'
    };

    setMemberApplications((prev) => prev.map((app) => {
      if (app.id === appId) {
        return {
          ...app,
          status: 'MORE_INFO_REQUIRED',
          updatedAt: nowStr,
          infoRequests: [newReq, ...(app.infoRequests || [])]
        };
      }
      return app;
    }));

    const app = memberApplications.find((a) => a.id === appId);
    if (app) {
      const notif: InAppNotification = {
        id: `NOTIF-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        recipientEmail: app.email,
        recipientName: app.fullName,
        eventType: 'MORE_INFO_REQUESTED',
        title: 'Additional Information Requested for C-Bridge Application',
        message: `Husni Hasan requested clarification regarding your application: "${question}".`,
        deliveryStatus: 'EMAIL INTEGRATION PENDING',
        read: false
      };
      setInAppNotifications((prev) => [notif, ...prev]);

      const audit: TeamAuditLog = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        performedBy: 'Husni Hasan',
        targetMemberId: app.id,
        targetMemberName: app.fullName,
        changeCategory: 'INFORMATION_REQUEST',
        details: `Issued information request ${reqId} to ${app.fullName}: "${question}"`
      };
      setTeamAuditLogs((prev) => [audit, ...prev]);
    }
  };

  const handleAddMember = async (newMember: TeamMember) => {
    setTeamMembers((prev) => [newMember, ...prev]);
    try {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
    } catch (err) {
      console.error('Failed to persist new member to Firestore:', err);
    }

    const log: TeamAuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
      performedBy: 'Husni Hasan',
      targetMemberId: newMember.id,
      targetMemberName: newMember.name,
      changeCategory: 'ACCOUNT_STATUS',
      details: `Provisioned new team member account: ${newMember.name} (${newMember.title})`
    };
    setTeamAuditLogs((prev) => [log, ...prev]);
  };

  const handleUpdateMember = async (updatedMember: TeamMember) => {
    setTeamMembers((prev) => prev.map((m) => m.id === updatedMember.id ? updatedMember : m));
    try {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMember)
      });
    } catch (err) {
      console.error('Failed to persist updated member to Firestore:', err);
    }

    const log: TeamAuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
      performedBy: 'Husni Hasan',
      targetMemberId: updatedMember.id,
      targetMemberName: updatedMember.name,
      changeCategory: 'ROLE_CHANGE',
      details: `Updated member profile and governance scope for ${updatedMember.name}`
    };
    setTeamAuditLogs((prev) => [log, ...prev]);
  };

  const handleSaveProjectAllocation = (
    updatedMember: TeamMember,
    auditEntry: ScheduleAuditEntry,
    note: string,
    requiresSupervisorReview: boolean
  ) => {
    // 1. Update canonical member state
    setTeamMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    
    // 2. Persist to Firestore/backend
    try {
      fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMember)
      });
    } catch (err) {
      console.error('Failed to persist member allocation to backend:', err);
    }

    // 3. Add team audit log
    const teamAudit: TeamAuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: auditEntry.timestamp,
      performedBy: auditEntry.changedBy,
      targetMemberId: updatedMember.id,
      targetMemberName: updatedMember.name,
      changeCategory: 'CAPACITY_CHANGE' as any,
      details: `${auditEntry.reason}: ${auditEntry.reasonNotes} (${auditEntry.capacityImpact})`
    };
    setTeamAuditLogs(prev => [teamAudit, ...prev]);

    // 4. Attach schedule audit to future/uncompleted tasks without touching actual execution history
    setTasks(prev => prev.map(t => {
      if (t.projectId === 'PRJ-324' && t.status !== 'COMPLETED') {
        return {
          ...t,
          scheduleVersion: (t.scheduleVersion || 1) + 1,
          scheduleAudits: [...(t.scheduleAudits || []), auditEntry]
        };
      }
      return t;
    }));
  };

  // Existing Approved Member Account Activation Handlers
  const handleStartActivation = async (member: TeamMember, confirmedEmail: string): Promise<string | null> => {
    try {
      const cleanEmail = confirmedEmail.trim();
      const res = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          memberName: member.name,
          confirmedEmail: cleanEmail,
          email: cleanEmail,
          expiresHours: 72
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`Invitation Creation Failed: ${data.error || 'Server error'}`);
        return null;
      }
      const activeToken = data.token;

      const updatedMember: TeamMember = {
        ...member,
        email: cleanEmail,
        accountAccessStatus: 'INVITATION PENDING',
        activationToken: activeToken,
        activationEmail: cleanEmail,
        activationSentAt: new Date().toISOString()
      };
      setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? updatedMember : m)));

      const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';
      const audit: TeamAuditLog = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        performedBy: 'Husni Hasan',
        targetMemberId: member.id,
        targetMemberName: member.name,
        changeCategory: 'ACCOUNT_STATUS',
        details: `Initiated Account Activation for existing member ${member.name}. Confirmed Email: ${cleanEmail}. Single-use token generated and persisted in Firestore.`
      };
      setTeamAuditLogs((prev) => [audit, ...prev]);

      return activeToken || null;
    } catch (err) {
      console.error('Failed to create invitation:', err);
      alert('Failed to connect to server to create invitation.');
      return null;
    }
  };

  const handleRevokeActivation = async (memberId: string) => {
    try {
      await fetch('/api/invitations/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          revocationReason: 'Revoked by Managing Director Husni Hasan'
        })
      });

      let targetName = 'Member';
      let prevToken = '';
      setTeamMembers((prev) => prev.map((m) => {
        if (m.id === memberId) {
          targetName = m.name;
          prevToken = m.activationToken || '';
          return {
            ...m,
            email: '',
            accountAccessStatus: 'NOT ACTIVATED',
            activationToken: undefined,
            activationSentAt: undefined,
            activationEmail: undefined
          };
        }
        return m;
      }));

      const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';
      const audit: TeamAuditLog = {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        performedBy: 'Husni Hasan',
        targetMemberId: memberId,
        targetMemberName: targetName,
        changeCategory: 'ACCOUNT_STATUS',
        details: `Revoked pending activation invitation for ${targetName} (${memberId}). Active single-use activation token invalidated in Firestore immediately.`
      };
      setTeamAuditLogs((prev) => [audit, ...prev]);
    } catch (err) {
      console.error('Failed to revoke invitation server-side:', err);
    }
  };

  const handleTestActivate = (member: TeamMember, token: string) => {
    setActivationToken(token);
    setActivationEmail(member.email || member.activationEmail || '');
    setIsActivationViewOpen(true);
  };

  const handleCompleteActivation = async (details: {
    memberId: string;
    confirmedEmail: string;
    uid: string;
    password: string;
  }) => {
    const { memberId, confirmedEmail, uid } = details;
    try {
      if (activationToken) {
        await fetch('/api/invitations/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activationToken,
            email: confirmedEmail,
            memberId: memberId || 'MBR-001',
            uid: uid
          })
        });
      }
    } catch (err) {
      console.error('Error recording activation completion in Firestore:', err);
    }

    const updatedMembers = teamMembers.map((m) => {
      if (m.id === memberId || m.id === 'MBR-001' || (m.email && m.email.toLowerCase() === confirmedEmail.toLowerCase()) || m.name.toLowerCase().includes('samar')) {
        return {
          ...m,
          email: confirmedEmail,
          activationEmail: confirmedEmail,
          linkedUid: uid,
          accountAccessStatus: 'ACTIVE' as const,
          accountStatus: 'ACTIVE' as const,
          activationToken: undefined, // single-use token invalidated on completion
          activationSentAt: undefined
        };
      }
      return m;
    });

    setTeamMembers(updatedMembers);

    const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';
    const audit: TeamAuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      performedBy: 'Samar Baydoun (Self-Activation)',
      targetMemberId: memberId || 'MBR-001',
      targetMemberName: 'Samar Baydoun',
      changeCategory: 'ACCOUNT_STATUS',
      details: `Real Account Activated and linked to Firebase Auth UID ${uid}. Email: ${confirmedEmail}. Status: ACTIVE.`
    };
    setTeamAuditLogs((prev) => [audit, ...prev]);

    // Log in Samar directly
    setCurrentUser('SAMAR');
    setIsLoggedIn(true);
    setActiveView('samar-dashboard');
    setAuthSession({
      uid: uid,
      email: confirmedEmail,
      displayName: 'Samar Baydoun',
      accessType: 'ACTIVE_MEMBER',
      mappedRole: 'SAMAR',
      emailVerified: true,
      memberProfile: updatedMembers.find((m) => m.id === 'MBR-001')
    });

    setIsActivationViewOpen(false);
  };

  const handleAddException = (memberId: string, exception: AvailabilityException) => {
    setTeamMembers((prev) => prev.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          exceptions: [exception, ...(m.exceptions || [])]
        };
      }
      return m;
    }));
    const member = teamMembers.find((m) => m.id === memberId);
    const log: TeamAuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
      performedBy: 'Husni Hasan',
      targetMemberId: memberId,
      targetMemberName: member?.name || memberId,
      changeCategory: 'AVAILABILITY_CHANGE',
      details: `Recorded availability exception (${exception.type}): ${exception.reason} (${exception.startDate} to ${exception.endDate})`
    };
    setTeamAuditLogs((prev) => [log, ...prev]);
  };

  const handleSavePerformanceReview = (review: PerformanceReviewRecord) => {
    setPerformanceReviews((prev) => {
      const exists = prev.some((r) => r.id === review.id);
      if (exists) {
        return prev.map((r) => r.id === review.id ? review : r);
      }
      return [review, ...prev];
    });
    const log: TeamAuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
      performedBy: 'Husni Hasan',
      targetMemberId: review.memberId,
      targetMemberName: review.memberName,
      changeCategory: 'PERFORMANCE_REVIEW',
      details: `Finalized official performance evaluation for ${review.reviewPeriod} (${review.supervisorAction})`
    };
    setTeamAuditLogs((prev) => [log, ...prev]);
  };

  // Progressive Planning Handlers
  const handleAddProjectInput = async (input: ProjectInput) => {
    setProjectInputs((prev) => {
      const exists = prev.some((i) => i.id === input.id);
      return exists ? prev.map((i) => i.id === input.id ? input : i) : [input, ...prev];
    });

    try {
      await fetch('/api/projects/inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
    } catch (e) {
      console.error('Failed to persist project input to Firestore:', e);
    }
    
    // Create a Supervisor Direction record if it's a Husni Comment
    if (input.type === 'HUSNI COMMENT / DIRECTION') {
      const dirRecord: SupervisorDirectionRecord = {
        id: `DIR-${Date.now().toString().slice(-4)}`,
        projectId: input.projectId,
        supervisorName: 'Husni Hasan',
        rawComment: input.content,
        timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT'
      };
      setSupervisorDirections((prev) => [dirRecord, ...prev]);
    }
  };

  const handleAddPlanningAssumption = (assumption: PlanningAssumption) => {
    setPlanningAssumptions((prev) => [...prev, assumption]);
  };

  const handleAddAgendaUpdateProposal = (proposal: AgendaUpdateProposal) => {
    setAgendaUpdateProposals((prev) => [proposal, ...prev]);
  };

  const handleReviewAgendaUpdateProposal = (
    proposalId: string, 
    decision: ProposalStatus, 
    husniComment?: string,
    modifiedItem?: Partial<MasterAgendaItem>,
    selectedItemIndices?: number[]
  ) => {
    const proposal = agendaUpdateProposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    const timeStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';

    // Update proposal state
    setAgendaUpdateProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              status: decision,
              husniComment: husniComment || p.husniComment,
              reviewedAt: timeStr
            }
          : p
      )
    );

    const isApproval = decision === 'ACCEPTED' || decision === 'ACCEPTED_WITH_COMMENT';

    if (isApproval) {
      const targetProj = projects.find((p) => p.id === proposal.projectId) || projects[0];

      // If Addition of a Proposal Set (multiple items)
      if (proposal.proposedChangeType === 'ADDITION' && proposal.proposedItems && proposal.proposedItems.length > 0) {
        const itemsToActivate = selectedItemIndices && selectedItemIndices.length > 0
          ? proposal.proposedItems.filter((_, idx) => selectedItemIndices.includes(idx))
          : proposal.proposedItems;

        const newMasterItems: MasterAgendaItem[] = itemsToActivate.map((itemData, idx) => {
          const newItemId = `MA-${proposal.projectId?.replace('PRJ-', '')}-${(Date.now() + idx).toString().slice(-4)}`;
          return {
            id: newItemId,
            projectId: proposal.projectId,
            projectName: targetProj.name,
            category: (itemData.category as MasterAgendaCategory) || 'LEARNING TASK',
            workstream: itemData.workstream || 'FSVP Course Capability',
            objective: itemData.objective || itemData.taskTitle || '',
            taskTitle: itemData.taskTitle || 'New Confirmed Agenda Item',
            expectedDeliverable: itemData.expectedDeliverable || 'Deliverable Document',
            assignedMember: itemData.assignedMember || 'Samar Baydoun',
            priority: (itemData.priority as PriorityLevel) || 'P3 — TIME-SENSITIVE',
            targetDate: itemData.targetDate || '2026-08-20',
            planningWave: itemData.planningWave || 'WAVE 1 — Foundation',
            dependencies: itemData.dependencies || [],
            requiredSourceMaterial: itemData.requiredSourceMaterial || proposal.sourceOfChange,
            requiredAiTool: itemData.requiredAiTool,
            currentState: 'NOT_STARTED',
            evidenceRequirement: itemData.evidenceRequirement || 'Standard Evidence Upload',
            qaRequirement: itemData.qaRequirement || 'Standard QA',
            supervisorReviewRequirement: itemData.supervisorReviewRequirement || 'Husni Approval Required',
            confirmedByHusni: true,
            isProvisional: false,
            progressPercent: 0,
            moduleNumber: itemData.moduleNumber,
            modulePurpose: itemData.modulePurpose,
            learningObjectives: itemData.learningObjectives,
            requiredTopics: itemData.requiredTopics,
            requiredReading: itemData.requiredReading,
            assignments: itemData.assignments,
            knownDeadlines: itemData.knownDeadlines,
            expectedLearningOutput: itemData.expectedLearningOutput,
            outsideScopeLabel: itemData.outsideScopeLabel,
            clientStudyReadiness: itemData.clientStudyReadiness,
            proposalSetId: proposal.id
          };
        });

        setMasterAgendaItems((prev) => [...prev, ...newMasterItems]);
      } 
      // If Addition of a single item
      else if (proposal.proposedChangeType === 'ADDITION' && (proposal.proposedItem || modifiedItem)) {
        const itemData = modifiedItem || proposal.proposedItem || {};
        const newItemId = `MA-${proposal.projectId?.replace('PRJ-', '')}-${Date.now().toString().slice(-3)}`;
        const newMasterItem: MasterAgendaItem = {
          id: newItemId,
          projectId: proposal.projectId,
          projectName: targetProj.name,
          category: (itemData.category as MasterAgendaCategory) || 'TASK',
          workstream: itemData.workstream || 'FSVP Development',
          objective: itemData.objective || itemData.taskTitle || '',
          taskTitle: itemData.taskTitle || 'New Confirmed Agenda Item',
          expectedDeliverable: itemData.expectedDeliverable || 'Deliverable Document',
          assignedMember: itemData.assignedMember || 'Samar Baydoun',
          priority: (itemData.priority as PriorityLevel) || 'P4 — NORMAL EXECUTION',
          targetDate: itemData.targetDate || '2026-08-20',
          planningWave: itemData.planningWave || 'WAVE 2 — Capability Dev',
          dependencies: itemData.dependencies || [],
          requiredSourceMaterial: itemData.requiredSourceMaterial,
          requiredAiTool: itemData.requiredAiTool,
          currentState: 'NOT_STARTED',
          evidenceRequirement: itemData.evidenceRequirement || 'Standard Evidence Upload',
          qaRequirement: itemData.qaRequirement || 'Standard QA',
          supervisorReviewRequirement: itemData.supervisorReviewRequirement || 'Husni Approval Required',
          confirmedByHusni: true,
          isProvisional: false,
          progressPercent: 0,
          moduleNumber: itemData.moduleNumber,
          modulePurpose: itemData.modulePurpose,
          learningObjectives: itemData.learningObjectives,
          requiredTopics: itemData.requiredTopics,
          requiredReading: itemData.requiredReading,
          assignments: itemData.assignments,
          knownDeadlines: itemData.knownDeadlines,
          expectedLearningOutput: itemData.expectedLearningOutput,
          outsideScopeLabel: itemData.outsideScopeLabel,
          clientStudyReadiness: itemData.clientStudyReadiness,
          proposalSetId: proposal.id
        };
        setMasterAgendaItems((prev) => [...prev, newMasterItem]);
      } 
      // If Modification or Reorder
      else if ((proposal.proposedChangeType === 'MODIFICATION' || proposal.proposedChangeType === 'REORDER_PREREQUISITE') && proposal.existingItemAffectedId) {
        setMasterAgendaItems((prev) =>
          prev.map((m) => {
            if (m.id === proposal.existingItemAffectedId) {
              return {
                ...m,
                confirmedByHusni: true,
                ...(modifiedItem || {}),
                ...(proposal.proposedItem || {})
              };
            }
            return m;
          })
        );
      }
    }

    // Add Agenda History Record
    const historyEntry: AgendaHistoryRecord = {
      id: `HIST-${Date.now().toString().slice(-4)}`,
      projectId: proposal.projectId,
      action: isApproval ? `ACCEPTED PROPOSAL (${proposal.proposedChangeType})` : `REJECTED/DEFERRED PROPOSAL (${decision})`,
      itemTitle: proposal.proposedItem?.taskTitle || proposal.existingItemAffectedTitle || proposal.id,
      sourceOfChange: proposal.sourceOfChange,
      aiRecommendation: proposal.aiRecommendation,
      husniDecision: decision,
      husniComment: husniComment,
      timestamp: timeStr
    };
    setAgendaHistory((prev) => [historyEntry, ...prev]);

    // Record Supervisor Direction if comment present
    if (husniComment && husniComment.trim().length > 0) {
      const dirRecord: SupervisorDirectionRecord = {
        id: `DIR-${Date.now().toString().slice(-4)}`,
        projectId: proposal.projectId,
        supervisorName: 'Husni Hasan',
        rawComment: husniComment,
        interpretedProposalId: proposalId,
        timestamp: timeStr
      };
      setSupervisorDirections((prev) => [dirRecord, ...prev]);
    }
  };

  const handleAddSupervisorDirection = (direction: SupervisorDirectionRecord) => {
    setSupervisorDirections((prev) => [direction, ...prev]);
  };

  // Project & Master Agenda Handlers
  const handleAddProject = async (newProject: Project) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === newProject.id);
      return exists ? prev.map((p) => p.id === newProject.id ? newProject : p) : [newProject, ...prev];
    });

    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
    } catch (e) {
      console.error('Failed to persist project to Firestore:', e);
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    setProjects((prev) => prev.map((p) => p.id === updatedProject.id ? updatedProject : p));

    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject)
      });
    } catch (e) {
      console.error('Failed to persist updated project to Firestore:', e);
    }
  };

  const handleAddMasterAgendaItem = (newItem: MasterAgendaItem) => {
    setMasterAgendaItems((prev) => [...prev, newItem]);
  };

  const handleUpdateMasterAgendaItem = (updatedItem: MasterAgendaItem) => {
    setMasterAgendaItems((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleRemoveMasterAgendaItem = (itemId: string) => {
    setMasterAgendaItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleRunCb9119Engine = (projectId?: string) => {
    const targetProjId = projectId || 'PRJ-FSVP-01';
    const targetMember = teamMembers.find((m) => m.name === 'Samar Baydoun') || teamMembers[0];

    const { updatedMasterAgendaItems, newTasks, auditEntries } = buildProgressiveOperationalSchedule(
      masterAgendaItems,
      targetMember,
      tasks,
      targetProjId,
      '2026-08-14' // Base planning start date
    );

    setMasterAgendaItems(updatedMasterAgendaItems);

    if (newTasks.length > 0) {
      setTasks((prev) => {
        // Replace or merge tasks
        const existingIds = new Set(newTasks.map(t => t.id));
        const filtered = prev.filter(t => !existingIds.has(t.id));
        return [...filtered, ...newTasks];
      });
    }
  };

  const handleRescheduleTask = (
    taskId: string,
    newPlannedDueAt: string,
    delayReason: any,
    delayNotes: string
  ) => {
    const timestamp = new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString('en-US') + ' EDT';
    
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const currentVersion = t.scheduleVersion || 1;
          const auditEntry = {
            id: `AUD-${Date.now().toString().slice(-4)}`,
            taskId: t.id,
            masterAgendaItemId: t.masterAgendaItemId,
            action: 'RESCHEDULE' as const,
            previousPlannedDueAt: t.plannedDueAt || t.dueDate,
            newPlannedDueAt,
            reason: delayReason,
            reasonNotes: delayNotes,
            changedBy: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
            timestamp,
            scheduleVersion: currentVersion + 1
          };

          return {
            ...t,
            plannedDueAt: newPlannedDueAt,
            dueDate: newPlannedDueAt,
            delayReason,
            delayNotes,
            scheduleVersion: currentVersion + 1,
            scheduleAudits: [...(t.scheduleAudits || []), auditEntry]
          };
        }
        return t;
      })
    );
  };

  // Live Session Handlers
  const handleSendMessage = (text: string, type: 'CHAT' | 'EXPLANATION' | 'QUESTION' | 'SUMMARY' = 'CHAT') => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EDT';
    const userMsg: LiveSessionMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser === 'HUSNI' ? 'SUPERVISOR' : 'SAMAR',
      senderName: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
      timestamp: `2026-08-08 ${timeStr}`,
      text,
      type
    };

    setLiveSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      learningProgress: Math.min(100, prev.learningProgress + 2)
    }));

    // Generate dynamic C-Bridge AI Tutor Response after a short moment if Samar asked
    if (currentUser === 'SAMAR') {
      setTimeout(() => {
        const aiTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EDT';
        const aiResponse: LiveSessionMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'C_BRIDGE_AI',
          senderName: 'C-Bridge AI Tutor',
          timestamp: `2026-08-08 ${aiTimeStr}`,
          text: `C-BRIDGE AI TUTOR ANALYSIS:\nThank you Samar. Under 21 CFR 1.500 regulations, regarding "${text.slice(0, 40)}...":\n\n1. Ensure that all hazard evaluations clearly classify biological, chemical (including radiological), and physical hazards.\n2. Verify that supplier verification documents are audited annually by a qualified individual.\n3. Reference: MSU Course Pack Guidance on FSVP Importer Responsibilities.`,
          type: 'EXPLANATION'
        };
        setLiveSession((prev) => ({
          ...prev,
          messages: [...prev.messages, aiResponse]
        }));
      }, 500);
    }
  };

  const handleAnswerQuiz = (messageId: string, optionIndex: number) => {
    setLiveSession((prev) => {
      const updatedMessages = prev.messages.map((m) => {
        if (m.id !== messageId || m.type !== 'QUIZ') return m;
        const isCorrect = m.correctOptionIndex === optionIndex;
        return {
          ...m,
          selectedOptionIndex: optionIndex,
          isCorrect,
        };
      });

      return {
        ...prev,
        messages: updatedMessages,
        learningProgress: Math.min(100, prev.learningProgress + 5)
      };
    });
  };

  const handleTriggerAIAction = (actionType: 'EXPLAIN' | 'QUIZ' | 'CASE' | 'EXPLAIN_OWN_WORDS' | 'WEAK_AREAS' | 'SUMMARY') => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EDT';
    let newMsg: LiveSessionMessage;

    if (actionType === 'EXPLAIN') {
      newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'C_BRIDGE_AI',
        senderName: 'C-Bridge AI Tutor',
        timestamp: `2026-08-08 ${timeStr}`,
        text: `EXPLANATION — FSVP Hazard Analysis (21 CFR 1.504):\nAn importer must identify and evaluate, for each type of food imported, known or reasonably foreseeable hazards to determine whether there are hazards requiring a control.\n\nKey Hazard Classes:\n• Biological: Salmonella, Listeria monocytogenes, E. coli\n• Chemical: Mycotoxins, pesticide residues, unapproved food additives, undeclared allergens\n• Physical: Metal fragments, glass, hard plastic\n\nVerification Requirement (21 CFR 1.506):\nYou must maintain written procedures ensuring food is imported only from approved foreign suppliers.`,
        type: 'EXPLANATION'
      };
    } else if (actionType === 'QUIZ') {
      newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'C_BRIDGE_AI',
        senderName: 'C-Bridge AI Tutor',
        timestamp: `2026-08-08 ${timeStr}`,
        text: 'C-Bridge Knowledge Check Quiz:',
        type: 'QUIZ',
        quizQuestion: 'How frequently must a foreign supplier verification plan be re-evaluated under 21 CFR 1.505?',
        quizOptions: [
          { id: 0, text: 'A) Every 6 months automatically' },
          { id: 1, text: 'B) At least once every 3 years, or promptly when new hazard information arises' },
          { id: 2, text: 'C) Only when FDA conducts an inspection' },
          { id: 3, text: 'D) Every 10 years if no non-compliances are recorded' }
        ],
        correctOptionIndex: 1,
        explanation: 'Correct! Under 21 CFR 1.505(a), an FSVP re-evaluation is required at least every 3 years or whenever you become aware of new information regarding hazards or supplier compliance.'
      };
    } else if (actionType === 'CASE') {
      newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'C_BRIDGE_AI',
        senderName: 'C-Bridge AI Tutor',
        timestamp: `2026-08-08 ${timeStr}`,
        text: `FICTIONAL FSVP PRACTICE CASE (Case 2026-C):
A U.S. importer "Atlas Mediterranean Foods LLC" imports roasted pistachios in bulk bags from a foreign supplier in Izmir, Turkey.

Scenario:
• Hazard Identified: Aflatoxin (chemical hazard) & Salmonella (biological hazard).
• Supplier Status: Foreign facility has ISO 22000 certification but no recent FDA inspection.

Question for Samar:
What verification activities must Atlas Mediterranean Foods conduct under 21 CFR 1.506 prior to releasing the shipment into U.S. commerce?`,
        type: 'CASE_STUDY'
      };
    } else if (actionType === 'EXPLAIN_OWN_WORDS') {
      newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'C_BRIDGE_AI',
        senderName: 'C-Bridge AI Tutor',
        timestamp: `2026-08-08 ${timeStr}`,
        text: `REQUEST FOR MEMBER EXPLANATION:\nSamar, please explain in your own words:\n"What is the operational difference between a standard foreign supplier audit and an SAHC (Serious Adverse Health Consequences or Death) verification audit under 21 CFR 1.506?"\n\nType your explanation in the chat below.`,
        type: 'QUESTION'
      };
    } else if (actionType === 'WEAK_AREAS') {
      newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'C_BRIDGE_AI',
        senderName: 'C-Bridge AI Tutor',
        timestamp: `2026-08-08 ${timeStr}`,
        text: `IDENTIFIED LEARNING FOCUS AREAS FOR SAMAR:\n1. Onsite audit frequency rules for SAHC hazards vs non-SAHC hazards (21 CFR 1.506(d)).\n2. Documenting modified verification procedures for very small foreign suppliers (21 CFR 1.512).\n3. Translating foreign supplier audit certificates into compliant English records for FDA FSVP inspection.`,
        type: 'EXPLANATION'
      };
    } else {
      newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'C_BRIDGE_AI',
        senderName: 'C-Bridge AI Tutor',
        timestamp: `2026-08-08 ${timeStr}`,
        text: `C-BRIDGE LEARNING SUMMARY MATRIX — Task SB-9114:
• Topic: 21 CFR 1.500 - 1.506 FSVP Hazard Analysis & Supplier Verification
• Member Understanding Level: 75% (Proficient on hazard categories, developing on SAHC audit exemptions)
• Key Takeaway: SAHC hazards require annual onsite audits unless written justification supports an alternative control.
• Status: Ready for Supervisor Review by Husni Hasan.`,
        type: 'SUMMARY'
      };
    }

    setLiveSession((prev) => ({
      ...prev,
      messages: [...prev.messages, newMsg],
      learningProgress: Math.min(100, prev.learningProgress + 4)
    }));
  };

  const handleUploadMaterial = (fileName: string) => {
    setLiveSession((prev) => ({
      ...prev,
      sourceMaterial: `${fileName} (Attached Material)`,
      messages: [
        ...prev.messages,
        {
          id: `msg-${Date.now()}`,
          sender: 'SAMAR',
          senderName: 'Samar Baydoun',
          timestamp: `2026-08-08 ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} EDT`,
          text: `Uploaded new learning material: ${fileName}`,
          type: 'CHAT'
        }
      ]
    }));
  };

  const handleSelectTask = (taskId: string) => {
    const foundTask = tasks.find((t) => t.id === taskId);
    setLiveSession((prev) => ({
      ...prev,
      relatedTaskId: taskId,
      relatedTaskTitle: foundTask ? foundTask.title : prev.relatedTaskTitle
    }));
  };

  const handleAddIntervention = (
    instruction: string,
    actionType: 'COMMENT' | 'QUESTION' | 'DIRECTION' | 'CLARIFICATION' | 'MORE_STUDY' | 'FLAG' | 'INTERVENE'
  ) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' EDT';
    const timestamp = `2026-08-08 ${timeStr}`;

    const interventionMsg: LiveSessionMessage = {
      id: `msg-${Date.now()}`,
      sender: 'SUPERVISOR',
      senderName: 'Husni Hasan',
      timestamp,
      text: `SUPERVISOR ${actionType} — ${instruction}`,
      type: 'INTERVENTION',
      supervisorActionType: actionType
    };

    setLiveSession((prev) => ({
      ...prev,
      messages: [...prev.messages, interventionMsg],
      supervisorInterventions: [
        ...prev.supervisorInterventions,
        {
          id: `int-${Date.now()}`,
          supervisorName: 'Husni Hasan',
          timestamp,
          instruction,
          actionType
        }
      ]
    }));
  };

  const handleChangeAttentionLevel = (level: SupervisorAttentionLevel) => {
    setLiveSession((prev) => ({
      ...prev,
      attentionLevel: level
    }));
  };

  const handleConfirmAssetTasks = (taskSuggestions: AssetTaskSuggestion[]) => {
    const targetProject = projects[0] || INITIAL_PROJECTS[0];

    // 1. Create linked Project Master Agenda Items
    const newMasterItems: MasterAgendaItem[] = taskSuggestions.map((ast, idx) => {
      const maId = `MA-${targetProject.id?.replace('PRJ-', '')}-ASSET-${Date.now().toString().slice(-3)}-${idx + 1}`;
      const dailyTaskId = `SB-ASSET-${Date.now().toString().slice(-4)}-${idx + 1}`;

      return {
        id: maId,
        projectId: targetProject.id,
        projectName: targetProject.name,
        category: 'ASSET DEVELOPMENT TASK' as MasterAgendaCategory,
        workstream: ast.destination || 'FSVP Development',
        objective: ast.purpose,
        taskTitle: `[${ast.assetType}] ${ast.taskTitle}`,
        expectedDeliverable: ast.expectedDeliverable,
        assignedMember: ast.assignedMember || 'Samar Baydoun',
        priority: ast.suggestedPriority || 'P4 — NORMAL EXECUTION',
        targetDate: '2026-08-15',
        dependencies: [],
        requiredSourceMaterial: ast.learningSource,
        requiredAiTool: 'C-Bridge Asset Builder',
        currentState: 'SCHEDULED_DAILY',
        evidenceRequirement: 'Asset Document upload & Controlled Document registration',
        qaRequirement: ast.qaRequirement || 'QA Review required',
        supervisorReviewRequirement: ast.supervisorReviewRequirement || 'Husni Hasan Reviewable',
        dailyTaskId: dailyTaskId,
        progressPercent: 0
      };
    });

    setMasterAgendaItems((prev) => [...prev, ...newMasterItems]);

    // 2. Create daily scheduled tasks linked to Master Agenda Items
    const newTasks: TaskItem[] = taskSuggestions.map((ast, idx) => {
      const maItem = newMasterItems[idx];
      return {
        id: maItem.dailyTaskId!,
        projectId: targetProject.id,
        projectName: targetProject.name,
        masterAgendaItemId: maItem.id,
        scheduledReason: `Learning Outcome Asset Conversion — Linked to Master Agenda ${maItem.id}`,
        scheduledDate: new Date().toISOString().slice(0, 10),
        requiresQaDoc: true,
        title: `[${ast.assetType}] ${ast.taskTitle}`,
        description: `${ast.purpose}\n\n• Asset Type: ${ast.assetType}\n• Learning Source: ${ast.learningSource}\n• Deliverable: ${ast.expectedDeliverable}\n• QA Requirement: ${ast.qaRequirement}\n• Supervisor Review: ${ast.supervisorReviewRequirement}`,
        assignedTo: (ast.assignedMember as any) || 'Samar Baydoun',
        assignedBy: 'Husni Hasan (Supervisor)',
        status: 'PENDING',
        priority: (ast.suggestedPriority as PriorityLevel) || 'P4 — NORMAL EXECUTION',
        urgency: 'HIGH',
        governanceImpact: 'C-Bridge Asset Development & QA Conversion',
        moduleCode: ast.destination.includes('Content') ? 'CB-9118' : 'CB-9114',
        moduleName: ast.destination || 'FSVP Development',
        dueDate: '2026-08-15',
        estimatedHours: 4,
        progress: 0,
        supervisorAttention: 'ROUTINE REVIEW',
        fsvpStep: 'Verification'
      };
    });

    setTasks((prev) => [...prev, ...newTasks]);

    setLiveSession((prev) => {
      const confirmedIds = new Set(taskSuggestions.map(t => t.id));
      const updatedSuggested = prev.handoffData?.suggestedTasks.map(st => 
        confirmedIds.has(st.id) ? { ...st, isConfirmed: true } : st
      ) || [];

      const updatedHandoff = prev.handoffData ? {
        ...prev.handoffData,
        suggestedTasks: updatedSuggested
      } : undefined;

      return {
        ...prev,
        handoffData: updatedHandoff,
        confirmedAssetTasks: [...(prev.confirmedAssetTasks || []), ...taskSuggestions],
        messages: [
          ...prev.messages,
          {
            id: `msg-${Date.now()}`,
            sender: currentUser === 'HUSNI' ? 'SUPERVISOR' : 'SAMAR',
            senderName: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
            timestamp: `2026-08-08 ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} EDT`,
            text: `CONFIRMED ${taskSuggestions.length} C-BRIDGE ASSET TASK(S):\nCreated linked Project Master Agenda Items & scheduled into Daily Agenda:\n` + taskSuggestions.map(t => `• [${t.assetType}] ${t.taskTitle} (${t.destination})`).join('\n'),
            type: 'SUMMARY'
          }
        ]
      };
    });
  };



  // Task Actions
  const handleStartTask = (taskId: string) => {
    const { startedAtString, startAuditData } = generateTaskStartTimestamp();

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'IN_PROGRESS',
              startedAt: startedAtString,
              startAuditData,
            }
          : t
      )
    );
  };

  const handleSubmitForQA = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'READY_FOR_QA' } : t))
    );
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED' } : t))
    );
  };

  const handleCompleteCourseSetup = (notes: string, elapsedMinutes: number = 44) => {
    const timeStr = '2026-08-14 11:58:00 EDT';
    const hoursSpent = Math.round((elapsedMinutes / 60) * 10) / 10;

    // 1. Complete TSK-324-00
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === 'TSK-324-00' || t.masterAgendaItemId === 'MA-324-00') {
          const completionAudit = {
            id: `AUD-COMPLETE-324-00`,
            taskId: t.id,
            masterAgendaItemId: 'MA-324-00',
            action: 'COMPLETION' as any,
            reason: 'Course Setup & Study Planning gate validated and completed',
            reasonNotes: notes || 'Verified 7-module syllabus, regulatory baseline 21 CFR 1.500-1.514, MBR-001 capacity (15h/week for PRJ-324), and Client-Driven Study simulation framework.',
            changedBy: 'Samar Baydoun (MBR-001)',
            timestamp: timeStr,
            scheduleVersion: (t.scheduleVersion || 1) + 1
          };

          return {
            ...t,
            status: 'COMPLETED' as const,
            executionStatus: 'COMPLETED' as const,
            actualCompletedAt: timeStr,
            actualTimeHours: hoursSpent,
            resultSummary: notes,
            scheduleAudits: [...(t.scheduleAudits || []), completionAudit]
          };
        }

        // 2. Release prerequisite for TSK-324-01: transition from WAITING_FOR_PREREQUISITE to SCHEDULED
        if (t.id === 'TSK-324-01' || t.masterAgendaItemId === 'MA-324-01') {
          return {
            ...t,
            status: 'PENDING' as const,
            executionStatus: 'SCHEDULED' as const,
            scheduledReason: 'Prerequisite MA-324-00 Cleared — Ready for Performance on Monday 2026-08-17',
            urgency: 'Scheduled (Mon Aug 17)'
          };
        }

        return t;
      })
    );

    // 3. Complete MA-324-00 and release MA-324-01 dependency
    setMasterAgendaItems((prev) =>
      prev.map((item) => {
        if (item.id === 'MA-324-00') {
          return {
            ...item,
            currentState: 'COMPLETED' as const,
            memberExecutionStatus: 'COMPLETED' as const,
            progressPercent: 100,
            actualCompletedAt: timeStr,
            remainingEffortHours: 0
          };
        }
        if (item.id === 'MA-324-01') {
          return {
            ...item,
            currentState: 'SCHEDULED_DAILY' as const,
            memberExecutionStatus: 'SCHEDULED' as const,
            dependencies: []
          };
        }
        return item;
      })
    );
  };

  const handleSubmitTaskResult = (
    taskId: string,
    data: {
      resultSummary: string;
      workCompleted: string;
      remainingWork: string;
      evidenceRef?: string;
      blocker?: string;
      isDraft?: boolean;
    }
  ) => {
    const { startAuditData } = generateTaskStartTimestamp();
    const submittedAtFormatted = `RESULT SUBMITTED — ${startAuditData.localDate} — ${startAuditData.localTime} — ${startAuditData.timeZoneAbbr}`;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        const isDraft = Boolean(data.isDraft);
        const existingSubmittedAt = t.resultData?.submittedAt;
        const existingAuditData = t.resultData?.submittedAuditData;

        const resultData: TaskResultData = {
          resultSummary: data.resultSummary,
          workCompleted: data.workCompleted,
          remainingWork: data.remainingWork,
          evidenceRef: data.evidenceRef,
          blocker: data.blocker,
          submittedBy: 'Samar Baydoun',
          submittedAt: isDraft ? existingSubmittedAt : submittedAtFormatted,
          submittedAuditData: isDraft ? existingAuditData : startAuditData,
          isDraft: isDraft,
        };

        return {
          ...t,
          status: isDraft
            ? t.status
            : t.status === 'PENDING' || t.status === 'IN_PROGRESS'
            ? 'COMPLETED'
            : t.status,
          resultSummary: data.resultSummary || t.resultSummary,
          evidenceUrl: data.evidenceRef || t.evidenceUrl,
          blockerNotes: data.blocker || t.blockerNotes,
          resultData,
        };
      })
    );
  };

  const handleReportBlocker = (taskId: string, notes: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'BLOCKED',
              blockerNotes: notes,
              priority: 'P2 — BLOCKING',
            }
          : t
      )
    );
  };

  const handleUploadEvidence = (
    taskId: string,
    evidenceRecord?: TaskEvidenceRecord | {
      docTitle?: string;
      docType?: string;
      fileRef?: string;
      notes?: string;
    }
  ) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        let newRecord: TaskEvidenceRecord;
        if (evidenceRecord && 'evidenceType' in evidenceRecord) {
          newRecord = evidenceRecord as TaskEvidenceRecord;
        } else {
          const legacy = evidenceRecord as { docTitle?: string; docType?: string; fileRef?: string; notes?: string; } | undefined;
          const title = legacy?.docTitle || 'Evidence Document';
          const docType = legacy?.docType || 'WORK PRODUCT';
          const fileRef = legacy?.fileRef || `doc-${taskId}.pdf`;
          newRecord = {
            id: `EVD-${Date.now()}`,
            taskId,
            taskTitle: t.title,
            uploadedBy: 'Samar Baydoun',
            timestamp: new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8) + ' EDT',
            title,
            evidenceType: docType,
            fileOrLink: fileRef,
            notes: legacy?.notes || '',
            supervisorVisibility: 'YES',
            supervisor: 'Husni Hasan',
            attentionClassification: 'ROUTINE REVIEW',
          };
        }

        const formattedRef = `[${newRecord.evidenceType}] ${newRecord.title} (${newRecord.fileOrLink})`;
        const updatedRecords = [...(t.evidenceRecords || []), newRecord];

        const updatedResultData: TaskResultData = {
          resultSummary: t.resultData?.resultSummary || `Evidence uploaded: ${newRecord.title}`,
          workCompleted: t.resultData?.workCompleted || `Uploaded ${newRecord.evidenceType}: ${newRecord.title}`,
          remainingWork: t.resultData?.remainingWork,
          evidenceRef: formattedRef,
          blocker: t.resultData?.blocker,
          submittedBy: t.resultData?.submittedBy || 'Samar Baydoun',
          submittedAt: t.resultData?.submittedAt,
          submittedAuditData: t.resultData?.submittedAuditData,
          isDraft: t.resultData?.isDraft,
        };

        return {
          ...t,
          evidenceUrl: formattedRef,
          evidenceRecords: updatedRecords,
          resultSummary: t.resultSummary || `Evidence uploaded: ${newRecord.title}`,
          resultData: updatedResultData,
        };
      })
    );
  };

  const handleRemoveEvidence = (taskId: string, recordId?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        const currentRecords = t.evidenceRecords || [];
        const recordToRemove = recordId 
          ? currentRecords.find((r) => r.id === recordId) 
          : currentRecords[currentRecords.length - 1];

        const updatedRecords = recordId 
          ? currentRecords.filter((r) => r.id !== recordId) 
          : currentRecords.slice(0, -1);

        const latestRecord = updatedRecords[updatedRecords.length - 1];
        const newUrl = latestRecord ? `[${latestRecord.evidenceType}] ${latestRecord.title} (${latestRecord.fileOrLink})` : undefined;

        const now = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8) + ' EDT';
        const auditLogNote = `[Audit Event ${now}] Evidence record "${recordToRemove?.title || recordId || 'latest'}" removed by user. Audit trail preserved.`;

        const updatedResultData = t.resultData ? {
          ...t.resultData,
          resultSummary: updatedRecords.length === 0 ? 'Evidence removed (Audit event logged).' : t.resultData.resultSummary,
          evidenceRef: newUrl || '',
        } : undefined;

        return {
          ...t,
          evidenceUrl: newUrl,
          evidenceRecords: updatedRecords,
          qaNotes: t.qaNotes ? `${t.qaNotes}\n${auditLogNote}` : auditLogNote,
          resultData: updatedResultData,
        };
      })
    );
  };

  const handleConfirmNewTask = (newTaskData: Partial<TaskItem>) => {
    const created: TaskItem = {
      id: `TSK-${Math.floor(200 + Math.random() * 800)}`,
      title: newTaskData.title || 'New C-Bridge Task',
      description: newTaskData.description || 'Task created via Priority Engine.',
      assignedTo: newTaskData.assignedTo || 'Samar Baydoun',
      assignedBy: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
      status: newTaskData.status || 'PENDING',
      priority: newTaskData.priority || 'P4 — NORMAL EXECUTION',
      urgency: newTaskData.urgency || 'Normal',
      governanceImpact: newTaskData.governanceImpact || 'IN-SCOPE PHASE 1',
      moduleCode: newTaskData.moduleCode || 'SB-9111',
      moduleName: newTaskData.moduleName || 'Samar Agenda',
      dueDate: 'Today, 5:00 PM',
      isDemoAgendaItem: true,
    };

    setTasks((prev) => [created, ...prev]);
  };

  // Member Execution Flow Handlers (C-Bridge Execution Model)
  const handleAcceptAgendaItem = (
    itemId: string,
    customEffort?: number,
    customDueDate?: string
  ): { success: boolean; message?: string; validation?: CapacityValidationResult } => {
    const samar = teamMembers.find(m => m.id === 'MBR-001' || m.name === 'Samar Baydoun') || teamMembers[0];
    
    // Find item in tasks or masterAgendaItems
    const existingTask = tasks.find(t => t.id === itemId || t.masterAgendaItemId === itemId);
    const masterItem = masterAgendaItems.find(m => m.id === itemId || (existingTask && m.id === existingTask.masterAgendaItemId));
    
    const projectId = existingTask?.projectId || masterItem?.projectId || 'PRJ-FSVP-01';
    const canonicalProject = projects.find(p => p.id === projectId);
    const projectName = canonicalProject?.name || existingTask?.projectName || masterItem?.projectName || (projectId === 'PRJ-324' ? 'MSU Food Import Law & FSVP Learning and Capability Development Project' : 'U.S. Food Import & FSVP Capability Development');
    const title = existingTask?.title || masterItem?.taskTitle || 'Master Agenda Item';
    const effort = customEffort ?? existingTask?.estimatedEffortHours ?? masterItem?.estimatedEffortHours ?? 2;

    // Run Capacity Validation Gate
    const validation = validateCapacityGate({
      member: samar,
      projectId,
      requestedEffortHours: effort,
      tasks,
      masterAgendaItems
    });

    if (!validation.isValid && !validation.valid) {
      return { success: false, message: validation.rejectionReason, validation };
    }

    // Check for unmet dependencies / prerequisites
    const deps = masterItem?.dependencies || [];
    const hasUnmetPrerequisites = deps.some(depId => {
      const depTask = tasks.find(t => t.id === depId || t.masterAgendaItemId === depId);
      const depMaster = masterAgendaItems.find(m => m.id === depId);
      const isTaskDone = depTask && (depTask.status === 'COMPLETED' || depTask.executionStatus === 'COMPLETED');
      const isMasterDone = depMaster && depMaster.currentState === 'COMPLETED';
      return !isTaskDone && !isMasterDone;
    });

    const nowStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8) + ' EDT';
    const taskId = existingTask ? existingTask.id : (masterItem?.dailyTaskId || `TSK-${Date.now().toString().slice(-4)}`);
    
    // Operational window calculation
    let execStatus: MemberExecutionStatus = hasUnmetPrerequisites ? 'WAITING_FOR_PREREQUISITE' : 'SCHEDULED';
    let schedDate: string | undefined = hasUnmetPrerequisites ? undefined : '2026-08-14';
    let plannedStartAt = hasUnmetPrerequisites ? '2026-08-17 09:00 AM EDT' : (existingTask?.plannedStartAt || '2026-08-14 09:00 AM EDT');
    let plannedDueAt = customDueDate || (hasUnmetPrerequisites ? '2026-08-18 02:00 PM EDT' : '2026-08-14 01:00 PM EDT');
    let urgencyText = hasUnmetPrerequisites ? 'Waiting for Prerequisite' : 'Scheduled (Fri Aug 14)';

    const auditEntry: ScheduleAuditEntry = {
      id: `AUD-ACCEPT-${Date.now()}`,
      taskId,
      masterAgendaItemId: masterItem?.id,
      action: 'MEMBER_ACCEPTANCE',
      reason: 'Member accepted workload after capacity validation gate',
      reasonNotes: hasUnmetPrerequisites 
        ? `Validated against ${projectId} weekly allocation (15h). Gated by prerequisite (${deps.join(', ')}). Projected operational start: ${plannedStartAt}.`
        : `Validated against ${projectId} weekly allocation (15h). Operational window scheduled for Friday 2026-08-14 (09:00 AM - 01:00 PM EDT, ${effort}h). Planned due: ${plannedDueAt}; Master target: ${masterItem?.targetDate || '2026-08-16'}.`,
      changedBy: 'Samar Baydoun (MBR-001)',
      timestamp: nowStr,
      scheduleVersion: (existingTask?.scheduleVersion || 1) + 1
    };

    // Update tasks
    setTasks(prev => {
      const exists = prev.some(t => t.id === taskId);
      if (exists) {
        return prev.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              projectName,
              status: 'PENDING',
              executionStatus: execStatus,
              urgency: urgencyText,
              scheduledDate: schedDate,
              plannedStartAt,
              plannedDueAt,
              estimatedEffortHours: effort,
              remainingEffortHours: effort,
              memberAcceptanceTimestamp: nowStr,
              operationalScheduledTimestamp: hasUnmetPrerequisites ? undefined : nowStr,
              scheduleVersion: (t.scheduleVersion || 1) + 1,
              scheduleAudits: [...(t.scheduleAudits || []), auditEntry]
            };
          }
          return t;
        });
      } else {
        const newTask: TaskItem = {
          id: taskId,
          projectId,
          projectName,
          masterAgendaItemId: masterItem?.id,
          title,
          description: masterItem?.objective || title,
          assignedTo: 'Samar Baydoun',
          assignedBy: 'Husni Hasan',
          status: 'PENDING',
          executionStatus: execStatus,
          priority: masterItem?.priority || 'P3 — TIME-SENSITIVE',
          urgency: urgencyText,
          governanceImpact: 'IN-SCOPE PHASE 1',
          moduleCode: masterItem?.moduleNumber === 'SETUP' ? 'SB-9100' : `MSU-M${masterItem?.moduleNumber || '1'}`,
          moduleName: masterItem?.workstream || 'Capability Training',
          dueDate: plannedDueAt,
          plannedStartAt,
          plannedDueAt,
          scheduledDate: schedDate,
          estimatedEffortHours: effort,
          remainingEffortHours: effort,
          memberAcceptanceTimestamp: nowStr,
          operationalScheduledTimestamp: hasUnmetPrerequisites ? undefined : nowStr,
          scheduleVersion: 1,
          isDemoAgendaItem: true,
          scheduleAudits: [auditEntry]
        };
        return [newTask, ...prev];
      }
    });

    // Update masterAgendaItems
    setMasterAgendaItems(prev => prev.map(m => {
      if (m.id === (masterItem?.id || itemId)) {
        return {
          ...m,
          projectName,
          currentState: hasUnmetPrerequisites ? 'NOT_STARTED' : 'SCHEDULED_DAILY',
          memberExecutionStatus: execStatus,
          dailyTaskId: taskId,
          memberAcceptanceTimestamp: nowStr,
          operationalScheduledTimestamp: hasUnmetPrerequisites ? undefined : nowStr,
          plannedStartAt,
          plannedDueAt,
          estimatedEffortHours: effort
        };
      }
      return m;
    }));

    // Log to teamAuditLogs
    const teamAudit: TeamAuditLog = {
      id: `LOG-${Date.now()}`,
      targetMemberId: 'MBR-001',
      targetMemberName: 'Samar Baydoun',
      memberId: 'MBR-001',
      memberName: 'Samar Baydoun',
      performedBy: 'Samar Baydoun',
      action: 'MEMBER ACCEPTANCE',
      changedBy: 'Samar Baydoun',
      timestamp: nowStr,
      changeCategory: 'SCHEDULE_CHANGE' as any,
      details: `Accepted work "${title}" (${effort}h) under ${projectId}. Status: ${execStatus}.`
    };
    setTeamAuditLogs(prev => [teamAudit, ...prev]);

    return { success: true };
  };

  const handleBatchAcceptItems = (itemIds: string[]) => {
    itemIds.forEach(id => {
      handleAcceptAgendaItem(id);
    });
  };

  const handleRequestScheduleChange = (itemId: string, requestedDueDate: string, reasonNotes: string) => {
    const nowStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8) + ' EDT';
    
    setTasks(prev => prev.map(t => {
      if (t.id === itemId || t.masterAgendaItemId === itemId) {
        const audit: ScheduleAuditEntry = {
          id: `AUD-RESCHED-${Date.now()}`,
          taskId: t.id,
          masterAgendaItemId: t.masterAgendaItemId,
          action: 'SCHEDULE_CHANGE_REQUEST',
          reason: 'Member requested schedule adjustment',
          reasonNotes: `Proposed due date: ${requestedDueDate}. Reason: ${reasonNotes}`,
          changedBy: 'Samar Baydoun',
          timestamp: nowStr,
          scheduleVersion: (t.scheduleVersion || 1) + 1
        };
        return {
          ...t,
          dueDate: requestedDueDate,
          plannedDueAt: requestedDueDate,
          executionStatus: 'PENDING_RESCHEDULING',
          scheduleVersion: (t.scheduleVersion || 1) + 1,
          scheduleAudits: [...(t.scheduleAudits || []), audit]
        };
      }
      return t;
    }));

    const teamAudit: TeamAuditLog = {
      id: `LOG-${Date.now()}`,
      targetMemberId: 'MBR-001',
      targetMemberName: 'Samar Baydoun',
      memberId: 'MBR-001',
      memberName: 'Samar Baydoun',
      performedBy: 'Samar Baydoun',
      action: 'SCHEDULE CHANGE REQUESTED',
      changedBy: 'Samar Baydoun',
      timestamp: nowStr,
      changeCategory: 'SCHEDULE_CHANGE' as any,
      details: `Proposed target due date change for ${itemId} to ${requestedDueDate}: ${reasonNotes}`
    };
    setTeamAuditLogs(prev => [teamAudit, ...prev]);
  };

  const handleRequestEffortChange = (itemId: string, requestedHours: number, reasonNotes: string) => {
    const nowStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8) + ' EDT';

    setTasks(prev => prev.map(t => {
      if (t.id === itemId || t.masterAgendaItemId === itemId) {
        const audit: ScheduleAuditEntry = {
          id: `AUD-EFFORT-${Date.now()}`,
          taskId: t.id,
          masterAgendaItemId: t.masterAgendaItemId,
          action: 'EFFORT_CHANGE_REQUEST',
          reason: 'Member updated effort hours estimate',
          reasonNotes: `Adjusted to ${requestedHours}h. Reason: ${reasonNotes}`,
          changedBy: 'Samar Baydoun',
          timestamp: nowStr,
          scheduleVersion: (t.scheduleVersion || 1) + 1
        };
        return {
          ...t,
          estimatedEffortHours: requestedHours,
          remainingEffortHours: requestedHours,
          scheduleVersion: (t.scheduleVersion || 1) + 1,
          scheduleAudits: [...(t.scheduleAudits || []), audit]
        };
      }
      return t;
    }));

    setMasterAgendaItems(prev => prev.map(m => {
      if (m.id === itemId || m.dailyTaskId === itemId) {
        return {
          ...m,
          estimatedEffortHours: requestedHours,
          remainingEffortHours: requestedHours
        };
      }
      return m;
    }));
  };

  const handleDeferAgendaItem = (itemId: string, reasonNotes: string) => {
    const nowStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8) + ' EDT';

    setTasks(prev => prev.map(t => {
      if (t.id === itemId || t.masterAgendaItemId === itemId) {
        const audit: ScheduleAuditEntry = {
          id: `AUD-DEFER-${Date.now()}`,
          taskId: t.id,
          masterAgendaItemId: t.masterAgendaItemId,
          action: 'MEMBER_DEFERRAL',
          reason: 'Member deferred item',
          reasonNotes: reasonNotes || 'Deferred pending prerequisites',
          changedBy: 'Samar Baydoun',
          timestamp: nowStr,
          scheduleVersion: (t.scheduleVersion || 1) + 1
        };
        return {
          ...t,
          status: 'PENDING',
          executionStatus: 'DEFERRED',
          scheduleAudits: [...(t.scheduleAudits || []), audit]
        };
      }
      return t;
    }));

    setMasterAgendaItems(prev => prev.map(m => {
      if (m.id === itemId || m.dailyTaskId === itemId) {
        return {
          ...m,
          memberExecutionStatus: 'DEFERRED'
        };
      }
      return m;
    }));
  };

  const handleAskSupervisor = (itemId: string, question: string) => {
    const nowStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8) + ' EDT';
    const newFollowUp: FollowUpItem = {
      id: `FUP-${Date.now()}`,
      subject: `Member Question: ${itemId}`,
      stakeholder: 'Husni Hasan',
      assignedTo: 'Samar Baydoun',
      status: 'OPEN',
      notes: question,
      dueDate: 'Today',
      moduleCode: 'SB-9100'
    };
    setFollowUps(prev => [newFollowUp, ...prev]);

    const teamAudit: TeamAuditLog = {
      id: `LOG-${Date.now()}`,
      targetMemberId: 'MBR-001',
      targetMemberName: 'Samar Baydoun',
      memberId: 'MBR-001',
      memberName: 'Samar Baydoun',
      performedBy: 'Samar Baydoun',
      action: 'MEMBER GUIDANCE REQUEST',
      changedBy: 'Samar Baydoun',
      timestamp: nowStr,
      changeCategory: 'SCHEDULE_CHANGE' as any,
      details: `Asked supervisor guidance regarding ${itemId}: ${question}`
    };
    setTeamAuditLogs(prev => [teamAudit, ...prev]);
  };

  // Document Actions
  const handleApproveDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              currentStatus: 'SUPERVISOR APPROVED',
              approvalStatus: 'APPROVED',
              supervisorFeedback: 'Approved by Final Supervisor Husni Hasan.',
            }
          : d
      )
    );
  };

  const handleUpdateDocStatus = (docId: string, newStatus: OfficialDocStatus, feedback?: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              currentStatus: newStatus,
              supervisorFeedback: feedback || d.supervisorFeedback,
            }
          : d
      )
    );
  };

  const handleCreateDocument = (docData: Partial<ControlDocument>) => {
    const created: ControlDocument = {
      id: `DOC-9120-${Math.floor(10 + Math.random() * 90)}`,
      documentName: docData.documentName || 'New Controlled Draft',
      code: docData.code || 'CB-DOC-2026-99',
      version: docData.version || 'v0.1',
      author: docData.author || (currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun'),
      currentStatus: docData.currentStatus || 'DRAFT',
      qaFindings: docData.qaFindings || ['Draft initialized.'],
      supervisorFeedback: docData.supervisorFeedback || '',
      approvalStatus: 'NOT_SUBMITTED',
      updatedAt: 'Just Now',
      moduleCode: 'CB-9120',
      fileType: docData.fileType || 'PDF / SOP',
      description: docData.description || 'Draft document.',
    };

    setDocuments((prev) => [created, ...prev]);
  };

  // Governance Actions
  const handleApproveDecision = (decisionId: string) => {
    setDecisions((prev) =>
      prev.map((dec) =>
        dec.id === decisionId
          ? { ...dec, status: 'APPROVED', recommendedAction: 'Approved by Managing Director Husni Hasan.' }
          : dec
      )
    );
  };

  const handleReviewReport = (reportId: string) => {
    setWeeklyReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, supervisorStatus: 'REVIEWED' } : r))
    );
  };

  // Auth Resolution Handler
  const handleResolveAuthUser = (emailInput: string, firebaseUser?: any) => {
    const cleanEmail = emailInput.toLowerCase().trim();

    // Check email verification if firebase user provided
    if (firebaseUser && !firebaseUser.emailVerified && isFirebaseConnected()) {
      setIsLoggedIn(true);
      setAuthSession({
        uid: firebaseUser.uid,
        email: cleanEmail,
        displayName: firebaseUser.displayName || cleanEmail,
        accessType: 'UNVERIFIED_EMAIL',
        mappedRole: 'SAMAR',
        emailVerified: false
      });
      setActiveView('unverified-email');
      return;
    }

    // 1. Owner Admin (Husni)
    if (
      cleanEmail === 'husni.alashqar@gmail.com' ||
      cleanEmail === 'husni@cbridge.com' ||
      cleanEmail === 'husni.hasan@cbridge.com' ||
      cleanEmail.startsWith('husni')
    ) {
      setCurrentUser('HUSNI');
      setIsLoggedIn(true);
      setActiveView('husni-dashboard');
      setAuthSession({
        uid: firebaseUser?.uid || 'husni-uid-001',
        email: cleanEmail,
        displayName: 'Husni Hasan',
        accessType: 'OWNER_ADMIN',
        mappedRole: 'HUSNI',
        emailVerified: true
      });
      return;
    }

    // 2. Samar Baydoun
    const samarMember = teamMembers.find((m) => m.id === 'MBR-001');
    const samarConfirmedEmail = (samarMember?.email || samarMember?.activationEmail || 'sbaydoun1@yahoo.com').toLowerCase();
    const isSamarAuth =
      cleanEmail === 'sbaydoun1@yahoo.com' ||
      cleanEmail === samarConfirmedEmail ||
      (firebaseUser?.uid && samarMember?.linkedUid && firebaseUser.uid === samarMember.linkedUid);

    if (isSamarAuth) {
      setCurrentUser('SAMAR');
      setIsLoggedIn(true);
      setActiveView('samar-dashboard');
      setAuthSession({
        uid: firebaseUser?.uid || samarMember?.linkedUid || 'samar-uid-001',
        email: 'Sbaydoun1@yahoo.com',
        displayName: 'Samar Baydoun',
        accessType: 'ACTIVE_MEMBER',
        mappedRole: 'SAMAR',
        emailVerified: true
      });
      return;
    }

    // 3. Other Active Team Members
    const foundMember = teamMembers.find(
      (m) => m.email.toLowerCase() === cleanEmail && (m.accountStatus === 'ACTIVE' || m.status === 'ACTIVE')
    );
    if (foundMember) {
      setCurrentUser('SAMAR');
      setIsLoggedIn(true);
      setActiveView('samar-dashboard');
      setAuthSession({
        uid: firebaseUser?.uid || `member-${foundMember.id}`,
        email: cleanEmail,
        displayName: foundMember.name,
        accessType: 'ACTIVE_MEMBER',
        mappedRole: 'SAMAR',
        emailVerified: true,
        memberProfile: foundMember
      });
      return;
    }

    // 4. Member Application / Applicant
    const foundApp = memberApplications.find(
      (a) => a.email.toLowerCase() === cleanEmail
    );
    if (foundApp) {
      if (foundApp.status === 'APPROVED') {
        setCurrentUser('SAMAR');
        setIsLoggedIn(true);
        setActiveView('samar-dashboard');
        setAuthSession({
          uid: firebaseUser?.uid || `app-${foundApp.id}`,
          email: cleanEmail,
          displayName: foundApp.fullName,
          accessType: 'ACTIVE_MEMBER',
          mappedRole: 'SAMAR',
          emailVerified: true
        });
        return;
      } else if (foundApp.status === 'REJECTED') {
        setIsLoggedIn(true);
        setActiveView('account-inactive');
        setAuthSession({
          uid: firebaseUser?.uid || `app-${foundApp.id}`,
          email: cleanEmail,
          displayName: foundApp.fullName,
          accessType: 'INACTIVE_MEMBER',
          mappedRole: 'APPLICANT',
          emailVerified: true
        });
        return;
      } else {
        setCurrentApplicant(foundApp);
        setIsLoggedIn(true);
        setActiveView('applicant-portal');
        setAuthSession({
          uid: firebaseUser?.uid || `app-${foundApp.id}`,
          email: cleanEmail,
          displayName: foundApp.fullName,
          accessType: 'APPLICANT',
          mappedRole: 'APPLICANT',
          emailVerified: true,
          applicantProfile: foundApp
        });
        return;
      }
    }

    // 5. Unrecognized / Unauthorized Authenticated User - NO AUTO-APPLICANT CREATION
    setIsLoggedIn(true);
    setActiveView('account-inactive');
    setAuthSession({
      uid: firebaseUser?.uid || 'unknown-user',
      email: cleanEmail,
      displayName: firebaseUser?.displayName || cleanEmail.split('@')[0],
      accessType: 'UNAUTHORIZED',
      mappedRole: 'APPLICANT',
      emailVerified: true
    });
  };

  const handleLogin = async (email: string, pass: string) => {
    setAuthError(null);
    const cleanEmail = email.toLowerCase().trim();

    if (isFirebaseConnected()) {
      try {
        const firebaseUser = await authSignIn(cleanEmail, pass);
        handleResolveAuthUser(cleanEmail, firebaseUser);
      } catch (err: any) {
        setAuthError(err.message || 'Firebase authentication failed.');
        throw err;
      }
    } else {
      handleResolveAuthUser(cleanEmail);
    }
  };

  const handleSignUp = async (details: {
    fullName: string;
    email: string;
    pass: string;
    functionalArea: string;
    bio: string;
  }) => {
    setAuthError(null);
    const cleanEmail = details.email.toLowerCase().trim();
    let firebaseUser = null;

    if (isFirebaseConnected()) {
      try {
        firebaseUser = await authSignUp(cleanEmail, details.pass);
      } catch (err: any) {
        setAuthError(err.message || 'Firebase sign up failed.');
        throw err;
      }
    }

    const newApp: MemberApplication = {
      id: `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
      updatedAt: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
      status: 'PENDING_REVIEW',
      fullName: details.fullName,
      email: cleanEmail,
      emailVerificationStatus: isFirebaseConnected() ? 'UNVERIFIED' : 'VERIFIED',
      country: 'United States',
      timezone: 'EDT (UTC-4)',
      functionalArea: details.functionalArea,
      coreSkills: ['FSVP', 'Regulatory Consulting'],
      cvText: details.bio || 'Self-service registration candidate.',
      availableWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      dailyStartTime: '09:00 AM',
      dailyEndTime: '02:00 PM',
      totalWeeklyHours: 20,
      supervisionNoticeAcknowledged: true
    };

    setMemberApplications((prev) => [newApp, ...prev]);
    setCurrentApplicant(newApp);
    handleResolveAuthUser(cleanEmail, firebaseUser);
  };

  const handleForgotPassword = async (email: string) => {
    setAuthError(null);
    if (isFirebaseConnected()) {
      await authResetPassword(email.toLowerCase().trim());
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const handleLogout = async () => {
    if (isFirebaseConnected()) {
      try {
        await authSignOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    setIsLoggedIn(false);
    setIsDemoSession(false);
    setAuthSession(null);
    setCurrentApplicant(null);
    setAuthError(null);
    setActiveView('login');
  };

  // Member Account Activation View
  if (isActivationViewOpen || activeView === 'activation') {
    return (
      <ActivationScreen
        initialToken={activationToken || undefined}
        initialEmail={activationEmail || undefined}
        member={teamMembers.find((m) => m.id === 'MBR-001') || teamMembers[0]}
        onCompleteActivation={handleCompleteActivation}
        onCancel={() => {
          setIsActivationViewOpen(false);
          if (isLoggedIn) {
            setActiveView(currentUser === 'HUSNI' ? 'husni-dashboard' : 'samar-dashboard');
          } else {
            setActiveView('login');
          }
        }}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <SignInScreen
        onSubmitLogin={handleLogin}
        onSubmitSignUp={handleSignUp}
        onSubmitForgotPassword={handleForgotPassword}
        onOpenActivationPage={() => setIsActivationViewOpen(true)}
        authError={authError}
        applications={memberApplications}
      />
    );
  }

  // Access Type Guards for logged-in non-full-member sessions
  if (authSession?.accessType === 'APPLICANT' || activeView === 'applicant-portal') {
    return (
      <ApplicantPortalView
        applicant={currentApplicant || memberApplications[0]}
        notifications={inAppNotifications}
        onRespondToInfoRequest={handleRespondToInfoRequest}
        onRefreshStatus={handleRefreshApplicantStatus}
        onNavigateMemberDashboard={() => {
          setCurrentUser('SAMAR');
          setIsLoggedIn(true);
          setActiveView('samar-dashboard');
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (authSession?.accessType === 'INACTIVE_MEMBER' || activeView === 'account-inactive') {
    return (
      <AccountInactiveScreen
        userEmail={authSession?.email || ''}
        onLogout={handleLogout}
      />
    );
  }

  if (authSession?.accessType === 'UNVERIFIED_EMAIL' || activeView === 'unverified-email') {
    return (
      <UnverifiedEmailScreen
        userEmail={authSession?.email || ''}
        onLogout={handleLogout}
        onResendVerification={resendEmailVerificationForCurrentUser}
      />
    );
  }

  const pendingApprovalsCount = decisions.filter((d) => d.status === 'PENDING_REVIEW' || d.status === 'ON_HOLD').length +
    documents.filter((d) => d.currentStatus === 'PENDING SUPERVISOR APPROVAL').length;

  const openTasksCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
  const pendingApplicationsCount = memberApplications.filter((a) => a.status === 'PENDING_REVIEW' || a.status === 'MORE_INFO_REQUIRED').length;

  return (
    <div id="cbridge-app" className="min-h-screen bg-[#F5F7FB] text-[#0F172A] flex flex-col font-sans antialiased">
      
      {/* Demo Session Notice Banner */}
      {isDemoSession && (
        <div id="cbridge-demo-session-banner" className="bg-[#10243E] text-amber-300 border-b border-[#28476B] px-4 py-2 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="uppercase tracking-wider font-extrabold text-amber-300">
              {currentUser === 'HUSNI' ? 'HUSNI DEMO SESSION' : 'SAMAR DEMO SESSION'} • NOT REAL AUTHENTICATION
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="text-slate-300 hidden md:inline">Development Preview Session</span>
            <button
              onClick={handleLogout}
              className="bg-[#163153] hover:bg-[#20416B] text-amber-200 border border-[#28476B] px-3 py-0.5 rounded text-[11px] font-bold cursor-pointer transition shadow-xs"
            >
              EXIT DEMO SESSION
            </button>
          </div>
        </div>
      )}

      {/* Global Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onOpenAskAI={() => setIsAskAIModalOpen(true)}
        onOpenSignUpModal={() => setIsSignUpModalOpen(true)}
        activeView={activeView}
      />


      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar
          currentUser={currentUser}
          activeView={activeView}
          setActiveView={setActiveView}
          pendingApprovalsCount={pendingApprovalsCount}
          openTasksCount={openTasksCount}
          pendingApplicationsCount={pendingApplicationsCount}
          onResumeWorkflow={() => handleResumeWorkflow()}
          activeWorkflowStep={moduleStudyInitialStage || 6}
        />

        {/* Dynamic Content Main View */}
        <main id="cbridge-main-content" className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#F5F7FB] overflow-y-auto">
          
          {/* C-Bridge Course Setup & Study Planning Workspace (PRJ-324 / MA-324-00) */}
          {activeView === 'course-setup' && (
            <CourseSetupWorkspace
              currentUser={currentUser}
              task={tasks.find(t => t.id === 'TSK-324-00' || t.masterAgendaItemId === 'MA-324-00') || tasks[0]}
              masterAgendaItem={masterAgendaItems.find(m => m.id === 'MA-324-00')}
              allMasterAgendaItems={masterAgendaItems}
              project={projects.find(p => p.id === 'PRJ-324') || projects[0]}
              teamMember={teamMembers.find(m => m.id === 'MBR-001' || m.name.includes('Samar')) || teamMembers[0]}
              projects={projects}
              tasks={tasks}
              onCompleteSetup={handleCompleteCourseSetup}
              onNavigateBack={() => setActiveView(currentUser === 'HUSNI' ? 'husni-dashboard' : 'samar-dashboard')}
              onNavigateToCaseRoom={() => setActiveView('case-room')}
              onUpdateMember={handleUpdateMember}
              onSaveAllocation={handleSaveProjectAllocation}
            />
          )}

          {/* C-Bridge Module 1 Study Workspace & Consulting Case Entry Gate */}
          {activeView === 'case-room' && (
            <ModuleStudyWorkspace
              currentUser={currentUser}
              currentProjectId={selectedProjectId || 'PRJ-324'}
              currentModuleId="MA-324-01"
              initialStage={moduleStudyInitialStage}
              onPositionChange={(pos) => setMemberWorkflowPosition(pos)}
              onNavigateToAssetLab={(opportunityData) => {
                setActiveView('workspace');
              }}
              onNavigateToAgenda={() => setActiveView('projects-agenda')}
            />
          )}

          {/* Capability Development Workspace */}
          {activeView === 'workspace' && (
            <CapabilityDevelopmentWorkspace
              currentProject={projects.find(p => p.id === selectedProjectId) || projects[0]}
              projects={projects}
              sources={sources}
              currentUser={currentUser}
              onSelectProject={(id) => setSelectedProjectId(id)}
              onAddSource={handleAddSource}
              onSubmitSupervisorQuestion={handleSubmitSupervisorQuestion}
              onPromoteAssetToLibrary={handlePromoteAssetToLibrary}
              onNavigateToCaseRoom={() => setActiveView('case-room')}
              supervisorQuestions={supervisorQuestions}
            />
          )}

          {/* C-Bridge Approved Asset Library */}
          {activeView === 'asset-library' && (
            <CBridgeAssetLibraryView
              assets={assetLibraryRecords}
              currentUser={currentUser}
            />
          )}

          {/* Project Proposals & Governance Review */}
          {activeView === 'proposals' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <ProjectProposalModal
                isOpen={true}
                onClose={() => setActiveView('projects-agenda')}
                currentUser={currentUser}
                proposals={proposals}
                onSubmitProposal={handleAddProposal}
                onReviewProposal={handleReviewProposal}
              />
            </div>
          )}

          {/* Projects & Master Agenda Center */}
          {activeView === 'projects-agenda' && (
            <ProjectsMasterAgendaView
              projects={projects}
              masterAgendaItems={masterAgendaItems}
              tasks={tasks}
              currentUser={currentUser}
              projectInputs={projectInputs}
              planningAssumptions={planningAssumptions}
              agendaUpdateProposals={agendaUpdateProposals}
              supervisorDirections={supervisorDirections}
              agendaHistory={agendaHistory}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onAddMasterAgendaItem={handleAddMasterAgendaItem}
              onUpdateMasterAgendaItem={handleUpdateMasterAgendaItem}
              onRemoveMasterAgendaItem={handleRemoveMasterAgendaItem}
              onRunCb9119Engine={handleRunCb9119Engine}
              onOpenAskAI={() => setIsAskAIModalOpen(true)}
              onAddProjectInput={handleAddProjectInput}
              onAddPlanningAssumption={handleAddPlanningAssumption}
              onAddAgendaUpdateProposal={handleAddAgendaUpdateProposal}
              onReviewAgendaUpdateProposal={handleReviewAgendaUpdateProposal}
              onAddSupervisorDirection={handleAddSupervisorDirection}
            />
          )}

          {/* Executive Dashboard (Husni) */}
          {activeView === 'husni-dashboard' && (
            <HusniDashboard
              tasks={tasks}
              documents={documents}
              decisions={decisions}
              followUps={followUps}
              weeklyReports={weeklyReports}
              liveSession={liveSession}
              onNavigate={(view) => setActiveView(view)}
              onOpenNewTask={() => setIsNewTaskModalOpen(true)}
              onOpenAskAI={() => setIsAskAIModalOpen(true)}
              onOpenLiveSession={(actionType) => {
                setIsHusniSessionModalOpen(true);
              }}
              onChangeAttentionLevel={handleChangeAttentionLevel}
              onApproveDocument={handleApproveDocument}
              onApproveDecision={handleApproveDecision}
            />
          )}

          {/* Member Dashboard (Samar) */}
          {(activeView === 'samar-dashboard' || activeView === 'pending-acceptance' || activeView === 'todays-agenda' || activeView === 'supervisor-feedback') && (
            <SamarDashboard
              tasks={tasks}
              documents={documents}
              followUps={followUps}
              weeklyReports={weeklyReports}
              masterAgendaItems={masterAgendaItems}
              teamMembers={teamMembers}
              activeTab={activeView}
              setActiveTab={(tab) => setActiveView(tab)}
              onStartTask={handleStartTask}
              onSubmitForQA={handleSubmitForQA}
              onCompleteTask={handleCompleteTask}
              onSubmitTaskResult={handleSubmitTaskResult}
              onReportBlocker={handleReportBlocker}
              onUploadEvidence={handleUploadEvidence}
              onRemoveEvidence={handleRemoveEvidence}
              onOpenAskAI={() => setIsAskAIModalOpen(true)}
              onOpenNewTask={() => setIsNewTaskModalOpen(true)}
              onAcceptAgendaItem={handleAcceptAgendaItem}
              onBatchAcceptItems={handleBatchAcceptItems}
              onRequestScheduleChange={handleRequestScheduleChange}
              onRequestEffortChange={handleRequestEffortChange}
              onDeferAgendaItem={handleDeferAgendaItem}
              onAskSupervisor={handleAskSupervisor}
              onResumeWorkflow={handleResumeWorkflow}
            />
          )}

          {/* Study & Learning Workspace */}
          {activeView === 'study-learning' && (
            <StudyLearningView
              session={liveSession}
              tasks={tasks}
              onSendMessage={handleSendMessage}
              onAnswerQuiz={handleAnswerQuiz}
              onTriggerAIAction={handleTriggerAIAction}
              onUploadMaterial={handleUploadMaterial}
              onSelectTask={handleSelectTask}
              onConfirmAssetTasks={handleConfirmAssetTasks}
              onResumeWorkflow={handleResumeWorkflow}
            />
          )}


          {/* Capacity-Based Scheduling & Traceability Panel */}
          {activeView === 'capacity-planning' && (
            <CapacityPlanningPanel
              teamMembers={teamMembers}
              tasks={tasks}
              masterAgendaItems={masterAgendaItems}
              currentUser={currentUser}
              onRescheduleTask={handleRescheduleTask}
              onRebalanceCapacity={() => handleRunCb9119Engine('PRJ-324')}
              onOpenAskAI={() => setIsAskAIModalOpen(true)}
            />
          )}

          {/* Operations & Tasks */}
          {(activeView === 'operations' || activeView === 'my-tasks') && (
            <TasksAgendaView
              tasks={tasks}
              currentUser={currentUser}
              onStartTask={handleStartTask}
              onSubmitForQA={handleSubmitForQA}
              onCompleteTask={handleCompleteTask}
              onSubmitTaskResult={handleSubmitTaskResult}
              onReportBlocker={handleReportBlocker}
              onUploadEvidence={handleUploadEvidence}
              onRemoveEvidence={handleRemoveEvidence}
              onOpenNewTask={() => setIsNewTaskModalOpen(true)}
              onOpenAskAI={() => setIsAskAIModalOpen(true)}
              onResumeWorkflow={handleResumeWorkflow}
            />
          )}

          {/* Documents & QA Center */}
          {activeView === 'documents' && (
            <DocumentsQAView
              documents={documents}
              currentUser={currentUser}
              onApproveDocument={handleApproveDocument}
              onUpdateDocStatus={handleUpdateDocStatus}
              onCreateDocument={handleCreateDocument}
            />
          )}

          {/* Approvals & Governance Decision Center */}
          {activeView === 'approvals' && (
            <ApprovalsGovernanceView
              decisions={decisions}
              currentUser={currentUser}
              onApproveDecision={handleApproveDecision}
            />
          )}

          {/* FSVP Development Workspace */}
          {activeView === 'fsvp-dev' && <FSVPDevelopmentView />}

          {/* Follow-Ups */}
          {activeView === 'follow-ups' && <FollowUpsView followUps={followUps} />}

          {/* Weekly Reports */}
          {activeView === 'reports' && (
            <ReportsView
              reports={weeklyReports}
              currentUser={currentUser}
              onReviewReport={handleReviewReport}
            />
          )}

          {/* Team Administration, Capacity & Performance */}
          {activeView === 'team-capacity' && (
            <TeamCapacityView
              members={teamMembers}
              performanceReviews={performanceReviews}
              auditLogs={teamAuditLogs}
              tasks={tasks}
              projects={projects}
              applications={memberApplications}
              currentUser={currentUser}
              publicAppBaseUrl={publicAppBaseUrl}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onAddException={handleAddException}
              onSavePerformanceReview={handleSavePerformanceReview}
              onUpdateApplication={handleUpdateApplication}
              onApproveApplication={handleApproveApplication}
              onConfirmAndActivateMember={handleConfirmAndActivateMember}
              onApproveAndProvision={handleConfirmAndActivateMember}
              onRequestMoreInfo={handleRequestMoreInfo}
              onOpenSignUpModal={() => setIsSignUpModalOpen(true)}
              onStartActivation={handleStartActivation}
              onRevokeActivation={handleRevokeActivation}
              onTestActivate={handleTestActivate}
            />
          )}

          {/* Ask AI Page shortcut */}
          {activeView === 'ask-ai' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
              <h2 className="text-xl font-bold text-white">Ask C-Bridge AI Assistant</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Launch the integrated regulatory consulting assistant drawer to ask questions or analyze FSVP requirements.
              </p>
              <button
                onClick={() => setIsAskAIModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                OPEN C-BRIDGE AI DRAWER
              </button>
            </div>
          )}

        </main>

      </div>

      {/* Global Modals */}
      <PriorityInferenceModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onConfirmTask={handleConfirmNewTask}
      />

      <AskCBridgeAIModal
        isOpen={isAskAIModalOpen}
        onClose={() => setIsAskAIModalOpen(false)}
        currentUser={currentUser}
      />

      {isHusniSessionModalOpen && (
        <HusniLiveSessionModal
          session={liveSession}
          onClose={() => setIsHusniSessionModalOpen(false)}
          onAddIntervention={handleAddIntervention}
          onChangeAttentionLevel={handleChangeAttentionLevel}
        />
      )}

      <PublicSignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        applications={memberApplications}
        notifications={inAppNotifications}
        onSubmitApplication={handleSubmitApplication}
        onRespondToInfoRequest={handleRespondToInfoRequest}
        onLoginAsActiveMember={(email) => {
          setIsSignUpModalOpen(false);
          setActiveView('team-capacity');
        }}
      />

    </div>
  );
}
