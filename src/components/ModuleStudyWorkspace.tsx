import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  Layers, 
  Send, 
  Briefcase, 
  Lock, 
  ExternalLink,
  ChevronRight,
  Filter,
  PlusCircle,
  FileCheck2,
  FolderLock,
  Building2,
  Users,
  MessageSquare,
  Bot,
  Shield,
  ShieldAlert,
  HelpCircle,
  Eye,
  Check,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Tag,
  FileCode,
  CheckSquare,
  AlertCircle,
  Archive,
  Save,
  FileSpreadsheet,
  Cpu,
  CornerDownRight,
  Trash2,
  UploadCloud,
  FileUp,
  File,
  Link,
  Info,
  FolderOpen,
  FolderMinus,
  Flag,
  Edit3,
  Search,
  Scale,
  FileCheck,
  Quote,
  X,
  UserCheck,
  UserPlus,
  ArrowLeftRight,
  Settings2
} from 'lucide-react';
import { 
  UserRole,
  ModuleStudySource,
  ModuleStudySourceType,
  SourceProvenanceKind,
  ModuleRequirementsMap,
  RequirementItem,
  RequirementOrigin,
  MemberRequirementComment,
  RequirementSourceEvidence,
  RequirementReviewStatus,
  GroundedConsultingPracticeTopic,
  ConsultingCaseSetup,
  CaseTeamSetup,
  CaseTeamPersona,
  CaseHumanParticipant,
  CaseTeamMembershipType,
  CaseParticipantRole,
  CaseHiddenFact,
  AssetOpportunityRecord,
  ModuleStudyPackage,
  ConsultingLearningTrace
} from '../types';
import { ConsultingCaseRoom } from './ConsultingCaseRoom';
import { getFirebaseAuth } from '../lib/firebase';

export interface StagedUploadFile {
  id: string;
  file: File;
  title: string;
  sourceType: ModuleStudySourceType;
  provenanceKind: SourceProvenanceKind;
  fileSizeFormatted: string;
  originalFilename: string;
  fileType: string;
  status: 'READY_TO_UPLOAD' | 'UPLOADING' | 'EXTRACTING' | 'READY_FOR_ANALYSIS' | 'FAILED';
  errorMessage?: string;
  contentSnippet?: string;
  fullContent?: string;
}

export type IntakeMode = 
  | 'UPLOAD_FILES' 
  | 'PASTE_TEXT' 
  | 'ADD_LINK' 
  | 'ADD_NOTES' 
  | 'ADD_PREVIOUS_PACKAGE';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Safe Client-Side HTML Sanitizer & Text Extractor
const extractClientHtmlContent = (html: string): { title?: string; cleanText: string; snippet: string } => {
  if (!html) return { cleanText: '', snippet: '' };
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Extract title if present in <title> or <h1>
    let title = doc.title?.trim();
    if (!title) {
      const h1 = doc.querySelector('h1');
      if (h1 && h1.textContent) title = h1.textContent.trim();
    }

    // 2. Strip scripts, styles, iframes, objects, etc.
    const dangerous = doc.querySelectorAll('script, style, noscript, iframe, object, embed, svg');
    dangerous.forEach(s => s.remove());

    // 3. Extract clean readable text
    const bodyText = doc.body ? (doc.body.innerText || doc.body.textContent || '') : '';
    const cleanLines = bodyText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const cleanText = cleanLines.join('\n\n');
    const snippet = cleanText.slice(0, 1500);

    return { title, cleanText, snippet };
  } catch (err) {
    console.warn('HTML parsing error, falling back to regex:', err);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1]?.replace(/<[^>]+>/g, '').trim() : undefined;
    const cleanText = html
      ?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      ?.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      ?.replace(/<\/?[^>]+(>|$)/g, ' ')
      ?.replace(/\s+/g, ' ')
      .trim();
    return { title, cleanText, snippet: cleanText.slice(0, 1500) };
  }
};

const inferSourceMetadata = (fileName: string): { title: string; sourceType: ModuleStudySourceType; provenanceKind: SourceProvenanceKind } => {
  const cleanName = fileName?.replace(/\.[^/.]+$/, '')?.replace(/[-_]/g, ' ');
  const lower = fileName.toLowerCase();
  
  if (lower.includes('workbook') || lower.includes('exercise')) {
    return {
      title: cleanName,
      sourceType: 'COURSE_WORKBOOK',
      provenanceKind: 'ACADEMIC_COURSE_SOURCE'
    };
  }
  if (lower.includes('package') || lower.includes('study_package') || lower.includes('study-package') || lower.includes('onboard') || lower.includes('brief') || lower.includes('synthesis')) {
    return {
      title: cleanName,
      sourceType: 'PREVIOUS_STUDY_PACKAGE',
      provenanceKind: 'MEMBER_GENERATED_STUDY_PACKAGE'
    };
  }
  if (lower.includes('syllabus') || lower.includes('curriculum')) {
    return {
      title: cleanName,
      sourceType: 'COURSE_READING',
      provenanceKind: 'ACADEMIC_REGULATORY_SOURCE'
    };
  }
  if (lower.includes('reading') || lower.includes('article') || lower.includes('chapter')) {
    return {
      title: cleanName,
      sourceType: 'COURSE_READING',
      provenanceKind: 'ACADEMIC_REGULATORY_SOURCE'
    };
  }
  if (lower.includes('assignment') || lower.includes('rubric') || lower.includes('instructions') || lower.includes('deliverable')) {
    return {
      title: cleanName,
      sourceType: 'ASSIGNMENT_INSTRUCTIONS',
      provenanceKind: 'ACADEMIC_REGULATORY_SOURCE'
    };
  }
  if (lower.includes('cfr') || lower.includes('fda') || lower.includes('statute') || lower.includes('law') || lower.includes('regulation') || lower.includes('subpart')) {
    return {
      title: cleanName,
      sourceType: 'REGULATORY_SOURCE',
      provenanceKind: 'ACADEMIC_REGULATORY_SOURCE'
    };
  }
  if (lower.includes('notes') || lower.includes('memo') || lower.includes('log')) {
    return {
      title: cleanName,
      sourceType: 'MEMBER_NOTES',
      provenanceKind: 'MEMBER_PROVIDED'
    };
  }
  if (lower.includes('husni') || lower.includes('supervisor') || lower.includes('direction')) {
    return {
      title: cleanName,
      sourceType: 'HUSNI_DIRECTION',
      provenanceKind: 'SUPERVISOR_DIRECTION'
    };
  }

  return {
    title: cleanName,
    sourceType: 'MODULE_MATERIAL',
    provenanceKind: 'ACADEMIC_REGULATORY_SOURCE'
  };
};

interface ModuleStudyWorkspaceProps {
  currentUser: UserRole;
  currentProjectId?: string;
  currentModuleId?: string;
  initialStage?: number;
  onNavigateToAssetLab?: (opportunityData?: any) => void;
  onNavigateToAgenda?: () => void;
  onNavigateToBackstage?: () => void;
  onPositionChange?: (position: any) => void;
}

export const ModuleStudyWorkspace: React.FC<ModuleStudyWorkspaceProps> = ({
  currentUser,
  currentProjectId = 'PRJ-324',
  currentModuleId = 'MA-324-01',
  initialStage,
  onNavigateToAssetLab,
  onNavigateToAgenda,
  onNavigateToBackstage,
  onPositionChange
}) => {
  // Stepper Stage State (1 to 8 representing the study steps)
  // Stage 1: Module Sources Intake
  // Stage 2: Requirements Analysis
  // Stage 3: Member Requirements Review Gate
  // Stage 4: Consulting Practice Topics Map
  // Stage 5: Case Setup & Virtual Company Profile
  // Stage 6: Case Team Setup & Roles
  // Stage 7: Active Consulting Case Room (Dual-Channel)
  // Stage 8: Learning Trace & Study Package
  const [currentStage, setCurrentStage] = useState<number>(initialStage || 6);
  const [activeTab, setActiveTab] = useState<'STUDY_FLOW' | 'ACTIVE_CASE_ROOM' | 'STUDY_PACKAGE'>('STUDY_FLOW');

  // Helper to persist workflow step position to server and local storage
  const persistWorkflowStage = async (stage: number, customDesc?: string) => {
    setCurrentStage(stage);
    try {
      const memberId = currentUser === 'HUSNI' ? 'MBR-002' : 'MBR-001';
      const payload = {
        memberId,
        memberName: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
        projectId: currentProjectId,
        moduleId: currentModuleId,
        currentStep: stage,
        highestStepReached: stage,
        acceptedCaseId: caseSetup?.caseId || 'CASE-LEVANT-01',
        acceptedCaseClientName: caseSetup?.virtualCompanyName || 'Levant Culinary Traditions Corp',
        acceptedCaseTitle: caseSetup?.virtualCompanyName ? `${caseSetup.virtualCompanyName} Consulting Case` : 'Levant Culinary Traditions Corp Consulting Case',
        selectedPracticeTopicId: selectedTopicId || 'TOPIC-MA324-01-01',
        selectedPracticeTopicTitle: topics.find(t => t.id === selectedTopicId)?.topicName || 'Statutory FSVP Importer Determination for Multi-Tier Specialty Importers',
        requirementsMapStatus: requirementsMap?.status || 'MEMBER_REVIEWED',
        isCaseAccepted: caseSetup?.status === 'CONFIRMED' || stage >= 6,
        isRosterConfirmed: caseTeam?.confirmed || stage >= 7,
        activeHumanRole: caseTeam?.activeHumanRole || (currentUser === 'HUSNI' ? 'HUSNI_SUPERVISOR' : 'SAMAR_CONSULTANT'),
        stepDescription: customDesc
      };

      try {
        localStorage.setItem(`cbridge_last_workflow_position_${currentUser}`, JSON.stringify(payload));
      } catch (_) {}

      onPositionChange?.(payload);

      const headers = await getAuthHeaders();
      // 1. Save Canonical Module Workflow State
      await fetch('/api/module-study/workflow-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Could not persist workflow position:', err);
    }
  };

  // Loading & Notification State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // 1. Data States
  const [sources, setSources] = useState<ModuleStudySource[]>([]);
  const [selectedSourceIdsForAnalysis, setSelectedSourceIdsForAnalysis] = useState<string[]>([]);
  const [requirementsMap, setRequirementsMap] = useState<ModuleRequirementsMap | null>(null);
  const [topics, setTopics] = useState<GroundedConsultingPracticeTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('TOPIC-MA324-01-01');
  const [caseSetup, setCaseSetup] = useState<ConsultingCaseSetup | null>(null);
  const [caseTeam, setCaseTeam] = useState<CaseTeamSetup | null>(null);
  const [activeCaseSession, setActiveCaseSession] = useState<any>(null);
  const [assetOpportunities, setAssetOpportunities] = useState<AssetOpportunityRecord[]>([]);
  const [studyPackages, setStudyPackages] = useState<ModuleStudyPackage[]>([]);

  // Source Upload / Add Modal State
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState<boolean>(false);
  const [intakeMode, setIntakeMode] = useState<IntakeMode>('UPLOAD_FILES');
  const [stagedFiles, setStagedFiles] = useState<StagedUploadFile[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [viewingSource, setViewingSource] = useState<ModuleStudySource | null>(null);
  const [selectedMappingSource, setSelectedMappingSource] = useState<ModuleStudySource | null>(null);
  const [isCourseMappingModalOpen, setIsCourseMappingModalOpen] = useState<boolean>(false);

  // Source Remove / Delete Action Modal State
  const [sourceActionTarget, setSourceActionTarget] = useState<{
    source: ModuleStudySource;
    actionType: 'REMOVE_FROM_MODULE' | 'DELETE_PERMANENT';
  } | null>(null);
  const [isRemovingSource, setIsRemovingSource] = useState<boolean>(false);

  // Single source input states
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState<ModuleStudySourceType>('MODULE_MATERIAL');
  const [provenanceKind, setProvenanceKind] = useState<SourceProvenanceKind>('ACADEMIC_REGULATORY_SOURCE');
  const [sourceSnippet, setSourceSnippet] = useState('');
  const [sourceUrlOrFile, setSourceUrlOrFile] = useState('');
  const [sourceNotes, setSourceNotes] = useState('');

  // Requirement Review & Source Evidence States
  const [selectedReqForReview, setSelectedReqForReview] = useState<RequirementItem | null>(null);
  const [selectedEvidenceReq, setSelectedEvidenceReq] = useState<RequirementItem | null>(null);
  const [selectedActionModalReq, setSelectedActionModalReq] = useState<RequirementItem | null>(null);
  const [reviewActionType, setReviewActionType] = useState<MemberRequirementComment['action']>('CONFIRM');
  const [reviewCommentText, setReviewCommentText] = useState('');
  const [actionFormStatus, setActionFormStatus] = useState<RequirementReviewStatus>('CONFIRMED');
  const [actionFormComment, setActionFormComment] = useState('');
  const [actionFormCorrection, setActionFormCorrection] = useState('');
  const [actionFormFlagReason, setActionFormFlagReason] = useState('');
  const [actionFormClarificationQuestion, setActionFormClarificationQuestion] = useState('');

  // Case Setup Edit State
  const [isEditingCaseSetup, setIsEditingCaseSetup] = useState<boolean>(false);
  const [isDirectionOpen, setIsDirectionOpen] = useState<boolean>(false);
  const [promptDirection, setPromptDirection] = useState('');
  const [showSupervisorDebugView, setShowSupervisorDebugView] = useState<boolean>(false);

  // Provenance Badge Rendering Helper
  const renderSourceBadges = (src: ModuleStudySource) => {
    const isSystem = src.creationMethod === 'SYSTEM_SEEDED' || src.createdByMemberId === 'SYSTEM';
    const isInherited = src.isInherited || src.creationMethod === 'INHERITED_COURSE_SOURCE' || src.sourceScope === 'COURSE_WIDE';
    const isMemberProvided = !isSystem && (src.creationMethod === 'MANUAL_UPLOAD' || src.creationMethod === 'MEMBER_GENERATED' || src.addedByRole?.toLowerCase().includes('member'));

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
          {src.sourceId}
        </span>

        {/* Primary Authority / Provenance Pill */}
        {isSystem ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-300">
            CURRICULUM BASELINE
          </span>
        ) : isInherited ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-indigo-50 text-indigo-800 border-indigo-200">
            INHERITED COURSE SYLLABUS
          </span>
        ) : isMemberProvided ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
            MEMBER PROVIDED
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
            {src.provenanceKind ? src.provenanceKind?.replace(/_/g, ' ') : 'SOURCE'}
          </span>
        )}

        {/* Scope Pill */}
        {src.sourceScope === 'COURSE_WIDE' ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-indigo-100 text-indigo-900 border-indigo-300 flex items-center gap-1">
            <Layers className="h-3 w-3" /> COURSE-WIDE
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
            MODULE-SPECIFIC
          </span>
        )}

        {/* Source Type */}
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {src.sourceType?.replace(/_/g, ' ')}
        </span>

        {/* File Size */}
        {src.fileSize && (
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {src.fileSize}
          </span>
        )}
      </div>
    );
  };

  // Provenance Label Helper
  const getProvenanceAttribution = (src: ModuleStudySource) => {
    if (src.creationMethod === 'SYSTEM_SEEDED' || src.createdByMemberId === 'SYSTEM') {
      return <span>Origin: <strong>Curriculum Baseline (System Seeded)</strong></span>;
    }
    if (src.creationMethod === 'INHERITED_COURSE_SOURCE' || src.isInherited) {
      return <span>Inherited from: <strong>Course Syllabus ({src.createdByDisplayName || src.addedBy || 'Husni Hasan'})</strong></span>;
    }
    if (src.creationMethod === 'MANUAL_UPLOAD') {
      return <span>Uploaded by: <strong>{src.createdByDisplayName || src.addedBy || 'Member'}</strong></span>;
    }
    if (src.creationMethod === 'MEMBER_GENERATED') {
      return <span>Member Research: <strong>{src.createdByDisplayName || src.addedBy || 'Member'}</strong></span>;
    }
    return <span>Origin: <strong>{src.createdByDisplayName || src.addedBy || 'Curriculum Baseline'}</strong></span>;
  };

  // Step 6: Case Team Setup Modal & Custom Persona States
  const [isAddClientPersonaModalOpen, setIsAddClientPersonaModalOpen] = useState<boolean>(false);
  const [newPersonaName, setNewPersonaName] = useState<string>('');
  const [newPersonaTitle, setNewPersonaTitle] = useState<string>('');
  const [newPersonaRole, setNewPersonaRole] = useState<CaseParticipantRole>('CLIENT_QA');
  const [newPersonaPersonality, setNewPersonaPersonality] = useState<string>('');

  // Helper: Auth headers
  const getAuthHeaders = async () => {
    try {
      const auth = getFirebaseAuth();
      if (auth && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        return { Authorization: `Bearer ${token}` };
      }
    } catch (e) {
      console.warn('Could not retrieve Firebase token:', e);
    }
    return {};
  };

  // Initial Load from Server (Consolidated & Authoritative Hydration)
  const loadModuleStudyData = async () => {
    setIsLoading(true);
    try {
      const memberId = currentUser === 'HUSNI' ? 'MBR-002' : 'MBR-001';

      // 1. Fetch Canonical Workflow State First
      let canonicalStep = 7;
      let targetCaseId = 'CASE-LEVANT-01';
      let targetTopicId = 'TOPIC-MA324-01-01';
      try {
        const wfRes = await fetch(`/api/module-study/workflow-state/${currentProjectId}/${currentModuleId}/${memberId}`);
        const wfData = await wfRes.json();
        if (wfData.success && wfData.workflowState) {
          if (wfData.workflowState.currentStep) {
            canonicalStep = wfData.workflowState.currentStep;
          }
          if (wfData.workflowState.acceptedCaseId) {
            targetCaseId = wfData.workflowState.acceptedCaseId;
          }
          if (wfData.workflowState.selectedPracticeTopicId) {
            targetTopicId = wfData.workflowState.selectedPracticeTopicId;
          }
        }
      } catch (wfErr) {
        console.warn('Could not fetch canonical workflow state:', wfErr);
      }

      // 2. Fetch Sources
      const srcRes = await fetch(`/api/module-study/sources/${currentProjectId}/${currentModuleId}`);
      const srcData = await srcRes.json();
      if (srcData.success && srcData.sources) {
        setSources(srcData.sources);
        setSelectedSourceIdsForAnalysis(srcData.sources.map((s: any) => s.sourceId));
      }

      // 3. Fetch Requirements Map
      const reqRes = await fetch(`/api/module-study/requirements-map/${currentProjectId}/${currentModuleId}`);
      const reqData = await reqRes.json();
      if (reqData.success && reqData.requirementsMap) {
        setRequirementsMap(reqData.requirementsMap);
      }

      // 4. Fetch Topics
      const topRes = await fetch(`/api/module-study/topics/${currentProjectId}/${currentModuleId}`);
      const topData = await topRes.json();
      
      let fetchedTopics = topData.topics || [];
      
      // If we have a map, but topics are empty or unavailable, try to generate them
      if ((!topData.success || fetchedTopics.length === 0) && reqData?.requirementsMap) {
         try {
             const headers = await getAuthHeaders();
             const genRes = await fetch('/api/module-study/generate-topics', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', ...headers },
                 body: JSON.stringify({
                     projectId: currentProjectId,
                     moduleId: currentModuleId,
                     requirementsMapId: reqData.requirementsMap.id
                 })
             });
             const genData = await genRes.json();
             if (genData.success && genData.topics) {
                 fetchedTopics = genData.topics;
             }
         } catch (e) {
             console.warn('Could not generate topics:', e);
         }
      }

      if (fetchedTopics.length > 0) {
        setTopics(fetchedTopics);
        const sel = fetchedTopics.find((t: any) => t.id === targetTopicId || t.isSelected) || fetchedTopics[0];
        if (sel) setSelectedTopicId(sel.id);
      } else {
        setTopics([]);
        setSelectedTopicId('');
      }

      // 5. Fetch Proposed/Confirmed Case Setup using targetCaseId
      const caseRes = await fetch(`/api/module-study/case-setup/${currentProjectId}/${currentModuleId}?caseId=${encodeURIComponent(targetCaseId)}`);
      const caseData = await caseRes.json();
      if (caseData.success && caseData.caseSetup) {
        setCaseSetup(caseData.caseSetup);
        // 6. Fetch Case Team Setup if exists
        try {
          const teamRes = await fetch(`/api/module-study/team-setup/${currentProjectId}/${currentModuleId}/${caseData.caseSetup.caseId}`);
          const teamData = await teamRes.json();
          if (teamData.success && teamData.teamSetup) {
            setCaseTeam(teamData.teamSetup);
          }
        } catch (teamErr) {
          console.warn('Could not fetch team setup:', teamErr);
        }
      }

      // 7. Set Stage Position
      if (initialStage && initialStage >= 1 && initialStage <= 8) {
        setCurrentStage(initialStage);
      } else {
        setCurrentStage(canonicalStep || 7);
      }
    } catch (err) {
      console.error('Error loading module study workspace data:', err);
      showNotification('Failed to load some study data from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clear state when switching modules to prevent stale UI
    setRequirementsMap(null);
    setTopics([]);
    setSelectedTopicId('');
    setCaseSetup(null);
    setCaseTeam(null);
    
    // Using an abort controller could be added here for strict race protection,
    // but clearing the states ensures the previous module's data doesn't persist.
    loadModuleStudyData();
  }, [currentProjectId, currentModuleId]);

  // Stage Gate Conditions Check
  const isStage1Complete = sources.length > 0;
  const isStage2Complete = requirementsMap !== null && requirementsMap.requirements.length > 0;
  const isStage3Complete = requirementsMap?.status === 'MEMBER_REVIEWED';
  const isStage4Complete = isStage3Complete && selectedTopicId !== '';
  const isStage5Complete = isStage4Complete && caseSetup?.status === 'CONFIRMED';
  const isStage6Complete = isStage5Complete && caseTeam?.confirmed === true;

  const [serverReadiness, setServerReadiness] = useState<{ready: boolean, unmet: string[], error?: string}>({ ready: false, unmet: [] });
  const [isCheckingReadiness, setIsCheckingReadiness] = useState<boolean>(true);

  useEffect(() => {
    const checkReadiness = async () => {
      setIsCheckingReadiness(true);
      try {
        const res = await fetch(`/api/module-study/readiness/${currentProjectId}/${currentModuleId}?caseId=${caseSetup?.caseId || 'CASE-LEVANT-01'}`);
        const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
        if (res.ok) {
          setServerReadiness(data);
        } else {
          setServerReadiness({ ready: false, unmet: [], error: data.error || 'Failed to check readiness' });
        }
      } catch (err) {
        console.warn('Could not check readiness', err);
        setServerReadiness({ ready: false, unmet: [], error: 'Failed to connect to server' });
      } finally {
        setIsCheckingReadiness(false);
      }
    };
    checkReadiness();
  }, [currentStage, currentProjectId, currentModuleId, caseSetup?.caseId, requirementsMap?.status, caseSetup?.status, caseTeam?.confirmed]);

  const isCaseRoomReadyToStart = serverReadiness.ready;

  // Review Summary Metrics
  const totalRequirementsCount = requirementsMap?.requirements?.length || 0;
  const confirmedCount = requirementsMap?.requirements?.filter(r => r.reviewStatus === 'CONFIRMED' || r.reviewStatus === 'MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION' || r.reviewStatus === 'DIRECTION_ACKNOWLEDGED' || r.reviewStatus === 'MODULE_BOUNDARY_ACKNOWLEDGED').length || 0;
  const pendingCount = requirementsMap?.requirements?.filter(r => !r.reviewStatus || r.reviewStatus.startsWith('PENDING_')).length || 0;
  const flaggedCount = requirementsMap?.requirements?.filter(r => r.reviewStatus === 'FLAGGED_UNSUPPORTED').length || 0;
  const correctionCount = requirementsMap?.requirements?.filter(r => r.reviewStatus === 'CORRECTION_REQUESTED').length || 0;
  const clarificationCount = requirementsMap?.requirements?.filter(r => r.reviewStatus === 'CLARIFICATION_REQUESTED').length || 0;
  const allRequirementsResolved = totalRequirementsCount > 0 && pendingCount === 0;

  // File selection processor
  const handleFileSelection = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    const newStagedFiles: StagedUploadFile[] = [];

    for (let idx = 0; idx < filesArray.length; idx++) {
      const file = filesArray[idx];
      const metadata = inferSourceMetadata(file.name);
      let extractedTitle = metadata.title;
      let contentSnippet = '';
      let fullContent = '';

      const isHtml = file.type.includes('html') || file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');
      const isText = file.type.includes('text') || file.name.toLowerCase().endsWith('.txt');

      if (isHtml || isText) {
        try {
          const rawText = await file.text();
          fullContent = rawText;
          if (isHtml) {
            const parsed = extractClientHtmlContent(rawText);
            if (parsed.title && !file.name.toLowerCase().includes('package')) {
              extractedTitle = parsed.title;
            }
            contentSnippet = parsed.snippet;
            fullContent = parsed.cleanText;
          } else {
            contentSnippet = rawText.slice(0, 1500);
          }
        } catch (e) {
          console.warn('Error reading file content during intake staging:', e);
        }
      }

      newStagedFiles.push({
        id: `STG-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        file,
        title: extractedTitle,
        sourceType: metadata.sourceType,
        provenanceKind: metadata.provenanceKind,
        fileSizeFormatted: formatFileSize(file.size),
        originalFilename: file.name,
        fileType: isHtml ? 'HTML Document' : (file.type || file.name.split('.').pop()?.toUpperCase() || 'DOCUMENT'),
        status: 'READY_TO_UPLOAD',
        contentSnippet,
        fullContent
      });
    }

    setStagedFiles(prev => [...prev, ...newStagedFiles]);
    showNotification(`Selected ${filesArray.length} file(s) for review.`, 'info');
  };

  const handleUpdateStagedFile = (id: string, updates: Partial<StagedUploadFile>) => {
    setStagedFiles(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(item => item.id !== id));
  };

  // STEP 1: Attach Batch Sources
  const handleAttachBatchSources = async () => {
    if (stagedFiles.length === 0) {
      showNotification('Please select at least one file to attach.', 'error');
      return;
    }

    setIsProcessing(true);
    setStagedFiles(prev => prev.map(f => f.status !== 'FAILED' ? { ...f, status: 'UPLOADING' } : f));

    const itemsToUpload: any[] = [];

    for (let i = 0; i < stagedFiles.length; i++) {
      const item = stagedFiles[i];
      if (item.status === 'FAILED') continue;

      try {
        setStagedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'EXTRACTING' } : f));
        
        let snippet = item.contentSnippet || '';
        let fullText = item.fullContent || '';

        const isHtml = (item.file.type && item.file.type.includes('html')) || 
          item.originalFilename.toLowerCase().endsWith('.html') || 
          item.originalFilename.toLowerCase().endsWith('.htm');
        const isText = (item.file.type && item.file.type.includes('text')) || 
          item.originalFilename.toLowerCase().endsWith('.txt');

        if ((!snippet || !fullText) && (isHtml || isText)) {
          try {
            const raw = await item.file.text();
            if (isHtml) {
              const parsed = extractClientHtmlContent(raw);
              snippet = parsed.snippet;
              fullText = raw; // Send raw HTML to backend so backend sanitizer can also process
            } else {
              snippet = raw.slice(0, 1500);
              fullText = raw;
            }
          } catch (e) {
            console.warn('Error reading file text:', e);
          }
        }
        
        if (!snippet) {
          snippet = `Attached file: ${item.originalFilename} (${item.fileSizeFormatted}, ${item.fileType}). Verified material for Module 1 study.`;
        }

        itemsToUpload.push({
          stagedId: item.id,
          projectId: currentProjectId,
          moduleId: currentModuleId,
          title: item.title.trim() || item.originalFilename,
          sourceType: item.sourceType,
          provenanceKind: item.provenanceKind,
          originalFilename: item.originalFilename,
          fileOrUrl: item.originalFilename,
          fileSize: item.fileSizeFormatted,
          fileType: isHtml ? 'HTML Document' : item.fileType,
          contentSnippet: snippet,
          fullContent: fullText || snippet,
          addedBy: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
          addedByRole: currentUser === 'HUSNI' ? 'Supervisor / Admin' : 'Capability Developer',
          citationRef: item.originalFilename,
          notes: `Uploaded via Multi-File Material Intake (${new Date().toLocaleDateString()})`
        });
      } catch (err: any) {
        setStagedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'FAILED', errorMessage: err.message || 'Extraction failed' } : f));
      }
    }

    if (itemsToUpload.length === 0) {
      setIsProcessing(false);
      showNotification('No valid files ready to upload.', 'error');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/module-study/sources/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          projectId: currentProjectId,
          moduleId: currentModuleId,
          sources: itemsToUpload
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && Array.isArray(data.sources)) {
        // Re-fetch all sources from the backend to ensure persistent hydration
        await loadModuleStudyData();

        // Auto-select newly uploaded sources for analysis
        const newIds = data.sources.map((s: any) => s.sourceId);
        setSelectedSourceIdsForAnalysis(prev => Array.from(new Set([...prev, ...newIds])));

        // Update status of staged files
        setStagedFiles(prev => prev.map(f => {
          const match = data.sources.find((s: any) => s.originalFilename === f.originalFilename);
          if (match) return { ...f, status: 'READY_FOR_ANALYSIS' };
          return f;
        }));

        showNotification(`Successfully attached ${data.totalAdded || data.sources.length} study material(s) to Module 1.`, 'success');
        
        setTimeout(() => {
          setIsAddSourceModalOpen(false);
          setStagedFiles([]);
        }, 800);
      } else {
        showNotification(data.error || 'Failed to attach batch sources.', 'error');
      }
    } catch (err: any) {
      console.error('Batch upload error:', err);
      showNotification('Network error during batch upload: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Single Add Source Handler
  const handleAddSingleSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTitle.trim()) return;

    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/module-study/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          projectId: currentProjectId,
          moduleId: currentModuleId,
          title: sourceTitle.trim(),
          sourceType,
          provenanceKind,
          originalFilename: sourceUrlOrFile.trim(),
          fileOrUrl: sourceUrlOrFile.trim(),
          contentSnippet: sourceSnippet.trim(),
          addedBy: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
          addedByRole: currentUser === 'HUSNI' ? 'Supervisor / Admin' : 'Capability Developer',
          citationRef: sourceUrlOrFile.trim() || 'Direct Input',
          notes: sourceNotes.trim()
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.source) {
        setSources(prev => [...prev, data.source]);
        setSelectedSourceIdsForAnalysis(prev => Array.from(new Set([...prev, data.source.sourceId])));
        setIsAddSourceModalOpen(false);
        setSourceTitle('');
        setSourceSnippet('');
        setSourceUrlOrFile('');
        setSourceNotes('');
        showNotification(`Source attached: ${data.source.title}`, 'success');
      }
    } catch (err) {
      console.error('Error adding source:', err);
      showNotification('Failed to add source. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Initiate Remove / Delete Source Flow
  const handleInitiateRemoveSource = (src: ModuleStudySource) => {
    const isProtectedOrSystem = 
      src.isProtected || 
      src.isInherited || 
      src.creationMethod === 'SYSTEM_SEEDED' || 
      src.sourceScope === 'COURSE_WIDE' ||
      src.createdByMemberId === 'SYSTEM';

    if (isProtectedOrSystem) {
      setSourceActionTarget({
        source: src,
        actionType: 'REMOVE_FROM_MODULE'
      });
    } else {
      setSourceActionTarget({
        source: src,
        actionType: 'DELETE_PERMANENT'
      });
    }
  };

  // Execute Remove / Delete Source
  const handleExecuteSourceAction = async () => {
    if (!sourceActionTarget) return;
    const { source, actionType } = sourceActionTarget;
    setIsRemovingSource(true);

    try {
      const headers = await getAuthHeaders();
      const memberId = currentUser === 'HUSNI' ? 'MBR-002' : 'MBR-001';
      const memberName = currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun';

      if (actionType === 'REMOVE_FROM_MODULE') {
        const res = await fetch(`/api/module-study/sources/${encodeURIComponent(source.sourceId)}/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({
            projectId: currentProjectId,
            moduleId: currentModuleId,
            memberId,
            memberName,
            reason: `Removed from ${currentModuleId} workspace by user request.`
          })
        });

        const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
        if (data.success) {
          setSources(prev => prev.filter(s => s.sourceId !== source.sourceId));
          setSelectedSourceIdsForAnalysis(prev => prev.filter(id => id !== source.sourceId));
          showNotification(`Source "${source.title}" removed from module workspace. Canonical baseline preserved.`, 'info');
          setSourceActionTarget(null);
        } else {
          showNotification(data.error || 'Failed to remove source from module.', 'error');
        }
      } else {
        const res = await fetch(`/api/module-study/sources/${encodeURIComponent(source.sourceId)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({
            projectId: currentProjectId,
            moduleId: currentModuleId,
            memberId,
            memberName,
            reason: `Permanently deleted from repository by user request.`
          })
        });

        const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
        if (data.success) {
          setSources(prev => prev.filter(s => s.sourceId !== source.sourceId));
          setSelectedSourceIdsForAnalysis(prev => prev.filter(id => id !== source.sourceId));
          showNotification(`Source "${source.title}" permanently deleted.`, 'info');
          setSourceActionTarget(null);
        } else if (data.canRemoveFromModule) {
          // Protected / baseline: Switch to module-level removal
          setSourceActionTarget({
            source,
            actionType: 'REMOVE_FROM_MODULE'
          });
          showNotification('System baseline material: switched to module removal.', 'info');
        } else {
          showNotification(data.error || 'Failed to delete source.', 'error');
        }
      }
    } catch (err: any) {
      console.error('Error executing source action:', err);
      showNotification('Action failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsRemovingSource(false);
    }
  };

  // STEP 2: Trigger AI Requirements Analysis Grounded in Sources
  const handleAnalyzeSources = async () => {
    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/module-study/analyze-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          projectId: currentProjectId,
          moduleId: currentModuleId,
          sourceIds: selectedSourceIdsForAnalysis,
          customFocus: '21 CFR 1.500 Statutory Authority & Importer Determination'
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.requirementsMap) {
        setRequirementsMap(data.requirementsMap);
        setCurrentStage(3); // Advance to Member Review Gate
        showNotification('Module Requirements Map successfully synthesized from sources. Review required.', 'success');
      } else if (!data.success && data.status === "STUDY_SYLLABUS_SOURCE_UNAVAILABLE") {
        showNotification('Study Module Syllabus Unavailable: Canonical syllabus extraction pipeline is not present. Cannot generate requirements.', 'error');
      } else {
        showNotification('Requirements analysis failed: ' + (data.error || data.message || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Error analyzing sources:', err);
      showNotification('Requirements analysis failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 3: Member Requirements Review Actions
  const handleExecuteItemReview = async (
    reqId: string,
    status: RequirementReviewStatus,
    options?: {
      comment?: string;
      correction?: string;
      flagReason?: string;
      clarificationQuestion?: string;
    }
  ) => {
    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/module-study/requirements-map/review-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          projectId: currentProjectId,
          moduleId: currentModuleId,
          requirementId: reqId,
          reviewStatus: status,
          memberComment: options?.comment || '',
          memberCorrection: options?.correction || '',
          flagReason: options?.flagReason || '',
          clarificationQuestion: options?.clarificationQuestion || '',
          reviewedBy: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun'
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.requirementsMap) {
        setRequirementsMap(data.requirementsMap);

        // Update selected evidence req if currently open
        if (selectedEvidenceReq?.id === reqId && data.updatedItem) {
          setSelectedEvidenceReq(data.updatedItem);
        }
        setSelectedActionModalReq(null);

        const statusLabels: Record<string, string> = {
          CONFIRMED: 'Confirmed',
          MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION: 'Accepted as Study Recommendation',
          DIRECTION_ACKNOWLEDGED: 'Direction Acknowledged',
          MODULE_BOUNDARY_ACKNOWLEDGED: 'Module Boundary Acknowledged',
          FLAGGED_UNSUPPORTED: 'Flagged as Unsupported',
          CORRECTION_REQUESTED: 'Correction Requested',
          CLARIFICATION_REQUESTED: 'Clarification Requested',
          PENDING_REVIEW: 'Reset to Pending',
          PENDING_AI_RECOMMENDATION_REVIEW: 'Pending Recommendation Review',
          PENDING_DIRECTION_ACKNOWLEDGEMENT: 'Pending Direction Acknowledgement',
          PENDING_MODULE_BOUNDARY_REVIEW: 'Pending Module Boundary Review'
        };
        showNotification(`Requirement ${reqId} set to "${statusLabels[status] || status}".`, 'success');
      } else {
        showNotification(data.error || 'Failed to update review item.', 'error');
      }
    } catch (err: any) {
      console.error('Error reviewing requirement item:', err);
      showNotification('Failed to update review item: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const openReviewActionModal = (req: RequirementItem, initialStatus?: RequirementReviewStatus) => {
    let resolvedStatus: RequirementReviewStatus = initialStatus || 'CONFIRMED';
    if (!initialStatus || initialStatus === 'CONFIRMED') {
      if (req.origin === 'AI_RECOMMENDATION') {
        resolvedStatus = 'MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION';
      } else if (req.origin === 'HUSNI_DIRECTION') {
        resolvedStatus = 'DIRECTION_ACKNOWLEDGED';
      } else if (req.origin === 'CROSS_MODULE_REFERENCE' || req.origin === 'AI_INTERPRETATION') {
        resolvedStatus = 'MODULE_BOUNDARY_ACKNOWLEDGED';
      } else {
        resolvedStatus = 'CONFIRMED';
      }
    }
    setSelectedActionModalReq(req);
    setActionFormStatus(resolvedStatus);
    setActionFormComment(req.memberNotes || '');
    setActionFormCorrection(req.memberCorrection || '');
    setActionFormFlagReason(req.flaggedReason || '');
    setActionFormClarificationQuestion(req.clarificationQuestion || '');
  };

  const handleCompleteMemberReview = async () => {
    if (!requirementsMap) return;

    if (pendingCount > 0) {
      showNotification(
        `Cannot complete Member Review: ${pendingCount} item(s) are still PENDING REVIEW. All requirements must be confirmed, flagged, or corrected before completing member review.`,
        'error'
      );
      return;
    }

    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const updatedMap: ModuleRequirementsMap = {
        ...requirementsMap,
        status: 'MEMBER_REVIEWED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Samar Baydoun (Capability Developer)',
        reviewNotes: 'All academic & statutory source extractions confirmed and resolved by Samar Baydoun for Module 1.'
      };

      const res = await fetch('/api/module-study/requirements-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(updatedMap)
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.requirementsMap) {
        setRequirementsMap(data.requirementsMap);
        persistWorkflowStage(4, "Derivation of practical consulting engagement themes from confirmed requirements"); // Advance to Topic Map
        showNotification('Member review completed by Samar Baydoun. Requirements mapped for topic derivation.', 'success');
      } else {
        showNotification(data.error || 'Failed to complete member review.', 'error');
      }
    } catch (err: any) {
      console.error('Error completing member review:', err);
      showNotification('Failed to complete member review: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 4: Generate or Select Consulting Practice Topic
  const handleSelectTopic = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (topic && topic.relevanceCategory === 'CROSS_MODULE_REFERENCE') {
        showNotification('Cross-module references cannot be selected as primary consulting topics.', 'error');
        return;
    }
    setSelectedTopicId(topicId);
    setTopics(prev => prev.map(t => ({ ...t, isSelected: t.id === topicId })));
    showNotification(`Selected topic: ${topics.find(t => t.id === topicId)?.topicName}`, 'info');
  };

  // STEP 5: Generate or Confirm Case Setup
  const handleGenerateCaseSetup = async (useDemo: boolean = false) => {
    // 1. Validate Step 3 MEMBER_REVIEWED prerequisite
    const isReviewComplete = requirementsMap?.status === 'MEMBER_REVIEWED' || (allRequirementsResolved && requirementsMap !== null);
    if (!isReviewComplete) {
      showNotification('PREREQUISITE GATE: You must complete Member Requirements Review before generating a Case scenario.', 'error');
      return;
    }

    // 2. Validate active primary module topic
    const activeTopicId = selectedTopicId || (topics.find(t => t.isSelected)?.id) || topics[0]?.id || 'TOPIC-MA324-01-01';
    if (!activeTopicId) {
      showNotification('Please select an active Consulting Practice Topic first.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/module-study/generate-case-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          projectId: currentProjectId,
          moduleId: currentModuleId,
          selectedTopicId: activeTopicId,
          promptDirection,
          useDemoCase: useDemo
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (res.ok && data.success && data.caseSetup) {
        setCaseSetup(data.caseSetup);
        setCurrentStage(5); // Transition visibly to Step 5: Case Setup
        showNotification(useDemo ? 'Loaded Seeded Demo Case (Apex)' : `Generated Virtual Company Proposal: ${data.caseSetup.virtualCompanyName}`, 'success');
      } else {
        const errorMsg = data?.error || `Generation returned HTTP status ${res.status}`;
        showNotification(`Case generation failed: ${errorMsg}`, 'error');
      }
    } catch (err: any) {
      console.error('Error generating case setup:', err);
      showNotification('Failed to generate case scenario: ' + (err?.message || 'Network error'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEditedCaseSetup = async (updatedSetup: ConsultingCaseSetup) => {
    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/module-study/save-case-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ caseSetup: updatedSetup, isEditOnly: true })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.caseSetup) {
        setCaseSetup(data.caseSetup);
        setIsEditingCaseSetup(false);
        showNotification('Case setup adjustments saved successfully.', 'success');
      } else {
        showNotification(data.error || 'Failed to save case setup adjustments.', 'error');
      }
    } catch (err: any) {
      showNotification('Error saving case setup: ' + (err?.message || 'Network error'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCaseSetup = async () => {
    if (!caseSetup) return;
    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/module-study/save-case-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ caseSetup })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.caseSetup) {
        setCaseSetup(data.caseSetup);
        // Automatically initialize default team setup for this case in DRAFT mode
        const initialTeam: CaseTeamSetup = {
          caseId: data.caseSetup.caseId,
          projectId: currentProjectId,
          moduleId: currentModuleId,
          clientTeam: [
            {
              personaId: 'PER-01',
              name: 'Elena Rostova',
              title: 'Chief Executive Officer & Founder',
              role: 'CLIENT_EXEC',
              avatarBg: 'from-amber-600 to-amber-800',
              personality: 'Direct, commercially focused, concerned about port delays and commercial viability.',
              isHumanParticipant: false,
              isAiClientLead: true
            },
            {
              personaId: 'PER-02',
              name: 'Marco Bellini',
              title: 'Quality & Technical Operations Director',
              role: 'CLIENT_QA',
              avatarBg: 'from-emerald-600 to-emerald-800',
              personality: 'Detail-oriented, familiar with European certifications, seeking clear verification checklist.',
              isHumanParticipant: false,
              isAiClientLead: false
            }
          ],
          consultingTeam: [
            { memberId: 'MBR-001', name: 'Samar Baydoun', role: 'SAMAR_CONSULTANT', title: 'C-Bridge Capability Developer & Lead Consultant', isLead: true },
            { memberId: 'AI-COACH', name: 'C-Bridge AI Coach', role: 'AI_COACH', title: 'Regulatory Intelligence & Diagnostic Coach', isLead: false, isAiCoach: true },
            { memberId: 'MBR-002', name: 'Husni Hasan', role: 'HUSNI_SUPERVISOR', title: 'Project Supervisor & Owner Admin', isLead: false }
          ],
          humanParticipants: [
            {
              caseParticipantId: 'CP-SAMAR-001',
              memberId: 'MBR-001',
              name: 'Samar Baydoun',
              title: 'Capability Developer & Lead Consultant',
              teamMemberships: ['CBRIDGE_CONSULTING', 'CLIENT_ROLEPLAY'],
              permittedRoles: ['SAMAR_CONSULTANT', 'CLIENT_ROLEPLAY_PARTICIPANT'],
              defaultActiveRole: 'SAMAR_CONSULTANT',
              currentActiveRole: 'SAMAR_CONSULTANT',
              isLead: true,
              addedBy: 'Samar Baydoun',
              addedAt: new Date().toISOString()
            },
            {
              caseParticipantId: 'CP-HUSNI-002',
              memberId: 'MBR-002',
              name: 'Husni Hasan',
              title: 'Project Supervisor & Owner Admin',
              teamMemberships: ['CBRIDGE_CONSULTING', 'CLIENT_ROLEPLAY'],
              permittedRoles: ['HUSNI_SUPERVISOR', 'OBSERVER', 'CLIENT_ROLEPLAY_PARTICIPANT'],
              defaultActiveRole: 'HUSNI_SUPERVISOR',
              currentActiveRole: 'HUSNI_SUPERVISOR',
              isLead: false,
              addedBy: 'Husni Hasan',
              addedAt: new Date().toISOString()
            }
          ],
          activeHumanRole: 'SAMAR_CONSULTANT',
          confirmed: false,
          status: 'DRAFT_PROPOSED',
          gatesReviewed: {
            clientPersonasReviewed: true,
            consultingTeamReviewed: true,
            humanRolesReviewed: true,
            defaultActiveRoleDefined: true
          }
        };
        setCaseTeam(initialTeam);
        persistWorkflowStage(6, "Roster & Multi-Team Human Participation Configuration (Consultant / Client Role-Play)");
        showNotification('Case scenario confirmed! Now configure Team Roles in Step 6.', 'success');
      }
    } catch (err) {
      console.error('Error confirming case setup:', err);
      showNotification('Failed to confirm case setup.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 6 Helper functions for Human Multi-Team Roles & Personas
  const handleToggleHumanTeamMembership = (memberId: string, team: 'CBRIDGE_CONSULTING' | 'CLIENT_ROLEPLAY') => {
    if (!caseTeam) return;
    const currentHumans = caseTeam.humanParticipants || [];
    const updatedHumans = currentHumans.map(h => {
      if (h.memberId === memberId) {
        const hasTeam = h.teamMemberships.includes(team);
        let newTeams = hasTeam 
          ? h.teamMemberships.filter(t => t !== team)
          : [...h.teamMemberships, team];
        
        if (newTeams.length === 0) {
          showNotification('A member must be assigned to at least one team.', 'error');
          return h;
        }

        let newRoles = [...h.permittedRoles];
        if (team === 'CLIENT_ROLEPLAY') {
          if (!hasTeam && !newRoles.includes('CLIENT_ROLEPLAY_PARTICIPANT')) {
            newRoles.push('CLIENT_ROLEPLAY_PARTICIPANT');
          } else if (hasTeam) {
            newRoles = newRoles.filter(r => r !== 'CLIENT_ROLEPLAY_PARTICIPANT');
          }
        } else if (team === 'CBRIDGE_CONSULTING') {
          if (!hasTeam) {
            const defaultConsultingRole: CaseParticipantRole = memberId === 'MBR-002' ? 'HUSNI_SUPERVISOR' : 'SAMAR_CONSULTANT';
            if (!newRoles.includes(defaultConsultingRole)) {
              newRoles.push(defaultConsultingRole);
            }
          } else {
            newRoles = newRoles.filter(r => r !== 'SAMAR_CONSULTANT' && r !== 'HUSNI_SUPERVISOR' && r !== 'OBSERVER');
          }
        }

        if (newRoles.length === 0) {
          newRoles = [team === 'CLIENT_ROLEPLAY' ? 'CLIENT_ROLEPLAY_PARTICIPANT' : (memberId === 'MBR-002' ? 'HUSNI_SUPERVISOR' : 'SAMAR_CONSULTANT')];
        }

        let defaultActive = h.defaultActiveRole;
        if (!newRoles.includes(defaultActive)) {
          defaultActive = newRoles[0];
        }

        return {
          ...h,
          teamMemberships: newTeams,
          permittedRoles: newRoles,
          defaultActiveRole: defaultActive,
          currentActiveRole: defaultActive
        };
      }
      return h;
    });

    const activeRole = memberId === 'MBR-001' ? (updatedHumans.find(h => h.memberId === 'MBR-001')?.defaultActiveRole || caseTeam.activeHumanRole) : caseTeam.activeHumanRole;

    setCaseTeam({
      ...caseTeam,
      humanParticipants: updatedHumans,
      activeHumanRole: activeRole
    });
  };

  const handleAddHumanRole = (memberId: string, roleToAdd: CaseParticipantRole) => {
    if (!caseTeam) return;
    const currentHumans = caseTeam.humanParticipants || [];
    const updatedHumans = currentHumans.map(h => {
      if (h.memberId === memberId) {
        if (h.permittedRoles.includes(roleToAdd)) return h;
        const newRoles = [...h.permittedRoles, roleToAdd];
        let newTeams = [...h.teamMemberships];
        if (roleToAdd === 'CLIENT_ROLEPLAY_PARTICIPANT' && !newTeams.includes('CLIENT_ROLEPLAY')) {
          newTeams.push('CLIENT_ROLEPLAY');
        }
        if ((roleToAdd === 'SAMAR_CONSULTANT' || roleToAdd === 'HUSNI_SUPERVISOR' || roleToAdd === 'OBSERVER') && !newTeams.includes('CBRIDGE_CONSULTING')) {
          newTeams.push('CBRIDGE_CONSULTING');
        }
        return {
          ...h,
          permittedRoles: newRoles,
          teamMemberships: newTeams
        };
      }
      return h;
    });

    setCaseTeam({
      ...caseTeam,
      humanParticipants: updatedHumans
    });
    showNotification(`Added permitted role ${roleToAdd?.replace(/_/g, ' ')}.`, 'success');
  };

  const handleRemoveHumanRole = (memberId: string, roleToRemove: CaseParticipantRole) => {
    if (!caseTeam) return;
    const currentHumans = caseTeam.humanParticipants || [];
    const target = currentHumans.find(h => h.memberId === memberId);
    if (!target) return;
    if (target.permittedRoles.length <= 1) {
      showNotification('Cannot remove the only remaining permitted role for this member.', 'error');
      return;
    }

    const updatedHumans = currentHumans.map(h => {
      if (h.memberId === memberId) {
        const newRoles = h.permittedRoles.filter(r => r !== roleToRemove);
        let defaultActive = h.defaultActiveRole;
        if (defaultActive === roleToRemove) {
          defaultActive = newRoles[0];
        }
        let currentActive = h.currentActiveRole;
        if (currentActive === roleToRemove) {
          currentActive = newRoles[0];
        }

        let newTeams = [...h.teamMemberships];
        const hasClientRole = newRoles.includes('CLIENT_ROLEPLAY_PARTICIPANT');
        const hasConsultingRole = newRoles.some(r => r === 'SAMAR_CONSULTANT' || r === 'HUSNI_SUPERVISOR' || r === 'OBSERVER');
        if (!hasClientRole) {
          newTeams = newTeams.filter(t => t !== 'CLIENT_ROLEPLAY');
        }
        if (!hasConsultingRole) {
          newTeams = newTeams.filter(t => t !== 'CBRIDGE_CONSULTING');
        }
        if (newTeams.length === 0) {
          newTeams = ['CBRIDGE_CONSULTING'];
        }

        return {
          ...h,
          permittedRoles: newRoles,
          teamMemberships: newTeams,
          defaultActiveRole: defaultActive,
          currentActiveRole: currentActive
        };
      }
      return h;
    });

    let newActiveHumanRole = caseTeam.activeHumanRole;
    if (newActiveHumanRole === roleToRemove) {
      newActiveHumanRole = updatedHumans.find(h => h.memberId === memberId)?.defaultActiveRole || 'SAMAR_CONSULTANT';
    }

    setCaseTeam({
      ...caseTeam,
      humanParticipants: updatedHumans,
      activeHumanRole: newActiveHumanRole
    });
    showNotification(`Removed permitted role ${roleToRemove?.replace(/_/g, ' ')}.`, 'info');
  };

  const handleSetDefaultActiveRole = (memberId: string, role: CaseParticipantRole) => {
    if (!caseTeam) return;
    const currentHumans = caseTeam.humanParticipants || [];
    const updatedHumans = currentHumans.map(h => {
      if (h.memberId === memberId) {
        return {
          ...h,
          defaultActiveRole: role,
          currentActiveRole: role
        };
      }
      return h;
    });

    setCaseTeam({
      ...caseTeam,
      humanParticipants: updatedHumans,
      activeHumanRole: role
    });
    showNotification(`Default active conversational role set to ${role?.replace(/_/g, ' ')}.`, 'success');
  };

  const handleSwitchActiveRoleNow = async (newRole: CaseParticipantRole, memberId: string = 'MBR-001') => {
    if (!caseTeam) return;
    const prev = caseTeam.activeHumanRole;
    if (prev === newRole) return;

    try {
      const headers = await getAuthHeaders();
      await fetch('/api/case-room/role-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          previousRole: prev,
          newRole,
          reason: `Switched active conversational perspective to ${newRole} in Step 6 Case Team Configuration.`,
          roomId: `ROOM-${currentProjectId}-${currentModuleId}`,
          projectId: currentProjectId
        })
      });

      const currentHumans = caseTeam.humanParticipants || [];
      const updatedHumans = currentHumans.map(h => {
        if (h.memberId === memberId || h.permittedRoles.includes(newRole)) {
          return {
            ...h,
            currentActiveRole: newRole
          };
        }
        return h;
      });

      setCaseTeam({
        ...caseTeam,
        humanParticipants: updatedHumans,
        activeHumanRole: newRole
      });
      showNotification(`Switched active conversational role to ${newRole?.replace(/_/g, ' ')}.`, 'success');
    } catch (e) {
      console.error('Role switch audit error:', e);
      showNotification('Failed to audit role switch.', 'error');
    }
  };

  const handleAddClientPersona = () => {
    if (!caseTeam) return;
    if (!newPersonaName.trim() || !newPersonaTitle.trim()) {
      showNotification('Name and title are required for client persona.', 'error');
      return;
    }

    const personaId = `PER-${Date.now().toString().slice(-4)}`;
    const newPersona: CaseTeamPersona = {
      personaId,
      name: newPersonaName.trim(),
      title: newPersonaTitle.trim(),
      role: newPersonaRole,
      avatarBg: newPersonaRole === 'CLIENT_EXEC' ? 'from-amber-600 to-amber-800' : newPersonaRole === 'CLIENT_QA' ? 'from-emerald-600 to-emerald-800' : 'from-purple-600 to-purple-800',
      personality: newPersonaPersonality.trim() || 'Professional and focused on regulatory verification.',
      isHumanParticipant: false,
      isAiClientLead: false
    };

    setCaseTeam({
      ...caseTeam,
      clientTeam: [...caseTeam.clientTeam, newPersona]
    });
    setNewPersonaName('');
    setNewPersonaTitle('');
    setNewPersonaPersonality('');
    setIsAddClientPersonaModalOpen(false);
    showNotification(`Added client persona ${newPersona.name}.`, 'success');
  };

  const handleRemoveClientPersona = (personaId: string) => {
    if (!caseTeam) return;
    const target = caseTeam.clientTeam.find(p => p.personaId === personaId);
    if (target?.isAiClientLead || caseTeam.clientTeam.length <= 1) {
      showNotification('Cannot remove the primary AI Client Lead.', 'error');
      return;
    }
    setCaseTeam({
      ...caseTeam,
      clientTeam: caseTeam.clientTeam.filter(p => p.personaId !== personaId)
    });
    showNotification('Removed client persona.', 'info');
  };

  // STEP 6: Confirm Case Team Setup
  const handleConfirmTeamSetup = async () => {
    if (!caseTeam || !caseSetup) return;
    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/module-study/setup-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          ...caseTeam,
          confirmed: true,
          status: 'CONFIRMED'
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.teamSetup) {
        setCaseTeam(data.teamSetup);
        persistWorkflowStage(7, "Active Consulting Case Room simulation entry gate");
        showNotification('Case Team confirmed! Entry Gate unlocked for Start Case.', 'success');
      }
    } catch (err) {
      console.error('Error confirming team setup:', err);
      showNotification('Failed to confirm team setup.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 7 & 8: Start Case Gate Execution (Clean start with 1 client opening message, NO fabricated Samar history)
  const handleStartCaseSession = async () => {
    if (!isCaseRoomReadyToStart) {
      showNotification('Cannot start case: Please complete all prerequisites (Requirements Reviewed, Case Confirmed, Team Confirmed).', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/module-study/start-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          caseId: caseSetup?.caseId || 'CASE-LEVANT-01',
          projectId: currentProjectId || 'PRJ-324',
          moduleId: currentModuleId || 'MA-324-01',
          isDemoMode: caseSetup?.isDemoCase || false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMessage = `Server returned status ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch(e) {}
        throw new Error(errMessage);
      }

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.caseSession) {
        setActiveCaseSession(data.caseSession);
        setActiveTab('ACTIVE_CASE_ROOM');
        await persistWorkflowStage(7, 'Active Consulting Case Room simulation in progress');
        showNotification('Consulting Case Session active! Starting with Client Opening Statement.', 'success');
      } else {
        throw new Error(data.error || 'UNABLE TO START CASE');
      }
    } catch (err: any) {
      console.error('Error starting case session:', err);
      showNotification(`UNABLE TO START CASE: ${err.message || 'Failed to start case session.'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 10: Save Asset Opportunity Flow
  const handleSaveAssetOpportunity = async (oppData: any) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/case-room/save-asset-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          projectId: currentProjectId,
          moduleId: currentModuleId,
          caseId: caseSetup?.caseId || 'CASE-ACTIVE',
          originatingMember: 'Samar Baydoun',
          originatingMemberRole: 'Capability Developer',
          observedNeed: oppData.observedNeed,
          proposedAsset: oppData.proposedAsset,
          assetType: oppData.assetType || 'TOOL',
          problemItSolves: oppData.problemItSolves || 'Derived from live Module 1 consulting simulation.',
          intendedUser: 'C-Bridge Regulatory Consultants',
          supportingCaseEvidence: `Grounded in ${caseSetup?.virtualCompanyName || 'Consulting Case'}`
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.opportunity) {
        setAssetOpportunities(prev => [data.opportunity, ...prev]);
        showNotification(`Asset Opportunity recorded: ${data.opportunity.proposedAsset}`, 'success');
      }
    } catch (err) {
      console.error('Error saving asset opportunity:', err);
      showNotification('Failed to save asset opportunity.', 'error');
    }
  };

  // STEP 11: Synthesize Study Package
  const handleSynthesizeStudyPackage = async () => {
    setIsProcessing(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/module-study/synthesize-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          projectId: currentProjectId,
          moduleId: currentModuleId,
          memberNotes: 'Module 1 successfully completed with full source grounding, member requirements review, and active consulting simulation.'
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.studyPackage) {
        setStudyPackages(prev => [data.studyPackage, ...prev]);
        setActiveTab('STUDY_PACKAGE');
        persistWorkflowStage(8, 'Learning Trace & Completed Study Package synthesis');
        showNotification('Module 1 Complete Study Package successfully synthesized!', 'success');
      }
    } catch (err) {
      console.error('Error synthesizing package:', err);
      showNotification('Failed to synthesize study package.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="module-study-workspace" className="max-w-7xl mx-auto space-y-6 pb-20 font-sans relative">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 max-w-md animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'error'
            ? 'bg-rose-900 text-rose-100 border-rose-700'
            : notification.type === 'success'
            ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
            : 'bg-slate-900 text-slate-100 border-slate-700'
        }`}>
          {notification.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 text-teal-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Primary Workspace Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-400">
            <BookOpen className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md">
                MODULE 1 STUDY & LEARNING WORKSPACE
              </span>
              <span className="text-xs font-mono text-slate-300">
                {currentProjectId} • {currentModuleId}
              </span>
            </div>
            <h1 className="text-xl font-black mt-1 text-slate-100">
              MSU Module 1 — Foundational FSVP Framework, Statutory Authority & Scope
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              11-step progressive study and simulation workflow: Source Intake → Requirements Map → Member Requirements Review → Consulting Practice Topics → Clean Case Room.
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('STUDY_FLOW')}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'STUDY_FLOW'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" /> Study Flow & Gates
          </button>
          
          <button
            onClick={() => {
              if (!isCaseRoomReadyToStart && !activeCaseSession) {
                showNotification('Consulting Case Room is locked until Study Steps 1–7 are completed.', 'error');
                return;
              }
              setActiveTab('ACTIVE_CASE_ROOM');
            }}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ACTIVE_CASE_ROOM'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isCaseRoomReadyToStart || activeCaseSession
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Building2 className="h-4 w-4" /> Case Room {isCaseRoomReadyToStart || activeCaseSession ? '●' : '🔒'}
          </button>

          <button
            onClick={() => setActiveTab('STUDY_PACKAGE')}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'STUDY_PACKAGE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" /> Study Package
          </button>
        </div>
      </div>

      {/* TAB 1: 11-STEP PROGRESSIVE STUDY FLOW & GATES */}
      {activeTab === 'STUDY_FLOW' && (
        <div className="space-y-6">
          
          {/* Stepper Progress Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Step-Gated Academic & Consulting Practice Lifecycle
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  Module 1 Progression Status
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isStage3Complete
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isStage3Complete ? 'Member Requirements Review Complete' : 'Requirements In Draft / Pending Member Review'}
                </span>
              </div>
            </div>

            {/* Stepper Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { step: 1, label: '1. Sources Intake', done: isStage1Complete, desc: 'Sources Intake & Provenance' },
                { step: 2, label: '2. AI Analysis', done: isStage2Complete, desc: 'Requirements Analysis' },
                { step: 3, label: '3. Member Review', done: isStage3Complete, gate: true, desc: 'Member Requirements Review Gate' },
                { step: 4, label: '4. Practice Topics', done: isStage4Complete, desc: 'Consulting Practice Topics Map' },
                { step: 5, label: '5. Case Setup', done: isStage5Complete, desc: 'Case Setup & Virtual Company Profile' },
                { step: 6, label: '6. Team Setup', done: isStage6Complete, desc: 'Case Team Setup & Human Multi-Team Roles' },
                { step: 7, label: '7. Start Case Gate', done: activeCaseSession !== null, gate: true, desc: 'Start Case Gate' },
                { step: 8, label: '8. Study Package', done: studyPackages.length > 0, desc: 'Learning Trace & Study Package' }
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => persistWorkflowStage(s.step, s.desc)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    currentStage === s.step
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : s.done
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                      : 'border-slate-200 bg-slate-50/50 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className={s.done ? 'text-emerald-700' : 'text-slate-400'}>
                      {s.done ? '✓ COMPLETE' : s.gate ? '🔒 GATE' : 'PENDING'}
                    </span>
                  </div>
                  <div className="text-xs font-black mt-1 truncate">
                    {s.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STAGE 1: MULTI-SOURCE INTAKE */}
          {currentStage === 1 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-md">
                      STEP 1: MULTI-SOURCE INTAKE & LIBRARY
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {sources.length} study source(s) loaded
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    Module 1 Source Materials & Academic Provenance Library
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                    Upload official MSU module files, statutory readings (21 CFR 1.500), assignment instructions, and member notes. All materials remain strictly internal to Samar's learning workspace.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIntakeMode('UPLOAD_FILES');
                      setIsAddSourceModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4" /> Add / Upload Study Materials
                  </button>
                </div>
              </div>

              {/* Batch Selection & Action Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (selectedSourceIdsForAnalysis.length === sources.length) {
                        setSelectedSourceIdsForAnalysis([]);
                      } else {
                        setSelectedSourceIdsForAnalysis(sources.map(s => s.sourceId));
                      }
                    }}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                  >
                    {selectedSourceIdsForAnalysis.length === sources.length ? 'Deselect All' : 'Select All for Analysis'}
                  </button>

                  <span className="text-xs text-slate-600">
                    <strong>{selectedSourceIdsForAnalysis.length}</strong> of <strong>{sources.length}</strong> sources selected for grounding.
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  <span>Academic isolation active • Commercial export blocked</span>
                </div>
              </div>

              {/* 1. COURSE-WIDE CANONICAL SOURCES SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>Course-Wide Canonical Sources (PRJ-324 Shared • {sources.filter(s => s.sourceScope === 'COURSE_WIDE' || s.sourceType === 'COURSE_WORKBOOK' || s.isInherited).length})</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Shared Across Modules 1–7 • No Re-upload Needed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {sources.filter(s => s.sourceScope === 'COURSE_WIDE' || s.sourceType === 'COURSE_WORKBOOK' || s.isInherited).map((src) => (
                    <div 
                      key={src.sourceId}
                      className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {renderSourceBadges(src)}

                        <input
                          type="checkbox"
                          checked={selectedSourceIdsForAnalysis.includes(src.sourceId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSourceIdsForAnalysis(prev => [...prev, src.sourceId]);
                            } else {
                              setSelectedSourceIdsForAnalysis(prev => prev.filter(id => id !== src.sourceId));
                            }
                          }}
                          className="rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          title="Include in AI Requirements Analysis"
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                          {src.title}
                        </h4>
                        {src.originalFilename && (
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                            <File className="h-3 w-3 text-slate-400" /> {src.originalFilename}
                          </p>
                        )}
                      </div>

                      {/* Scoped Relevant Sections for Module 1 */}
                      <div className="bg-white/95 p-3 rounded-xl border border-indigo-200/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-900">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Module 1 Relevant Sections</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {src.currentModuleRelevantSections || 
                            "Chapter 1 / Section 1: FSMA & FSVP Foundations, Statutory Scope of 21 CFR 1.500–1.502, Exercise 1.1 (Determining FSVP Applicability), Exercise 1.2 (Qualified Individual Identification). Pages 1–38."
                          }
                        </p>
                        <p className="text-[10px] text-slate-400 italic">
                          Later module chapters (Chapters 2–7) are isolated for subsequent modules.
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-indigo-200/50">
                        {getProvenanceAttribution(src)}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedMappingSource(src);
                              setIsCourseMappingModalOpen(true);
                            }}
                            className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-indigo-200 hover:border-indigo-300"
                          >
                            <Layers className="h-3.5 w-3.5" /> View Module 1 Mapping
                          </button>
                          <button
                            onClick={() => setViewingSource(src)}
                            className="text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-slate-200"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            onClick={() => handleInitiateRemoveSource(src)}
                            disabled={isProcessing || isRemovingSource}
                            className="text-slate-400 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer p-1 rounded-md hover:bg-rose-50"
                            title="Remove from Module Workspace"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. MODULE 1 SPECIFIC MATERIALS SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
                    <FolderOpen className="h-4 w-4 text-indigo-600" />
                    <span>Module 1 Specific Materials & Statutes ({sources.filter(s => (s.sourceScope === 'MODULE_SPECIFIC' || !s.sourceScope) && !s.isInherited && s.sourceType !== 'COURSE_WORKBOOK' && s.sourceType !== 'PREVIOUS_STUDY_PACKAGE' && s.sourceType !== 'MEMBER_NOTES').length})</span>
                  </div>

                  <button
                    onClick={() => {
                      setIntakeMode('UPLOAD_FILES');
                      setIsAddSourceModalOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Add Module 1 Files
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {sources.filter(s => (s.sourceScope === 'MODULE_SPECIFIC' || !s.sourceScope) && !s.isInherited && s.sourceType !== 'COURSE_WORKBOOK' && s.sourceType !== 'PREVIOUS_STUDY_PACKAGE' && s.sourceType !== 'MEMBER_NOTES').map((src) => (
                    <div 
                      key={src.sourceId}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {renderSourceBadges(src)}

                        <input
                          type="checkbox"
                          checked={selectedSourceIdsForAnalysis.includes(src.sourceId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSourceIdsForAnalysis(prev => [...prev, src.sourceId]);
                            } else {
                              setSelectedSourceIdsForAnalysis(prev => prev.filter(id => id !== src.sourceId));
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          title="Include in AI Requirements Analysis"
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                          {src.title}
                        </h4>
                        {src.originalFilename && (
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                            <File className="h-3 w-3 text-slate-400" /> {src.originalFilename}
                          </p>
                        )}
                        {src.contentSnippet && (
                          <p className="text-xs text-slate-600 mt-2 line-clamp-3 bg-white p-2.5 rounded-xl border border-slate-200/80 italic">
                            "{src.contentSnippet}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                        {getProvenanceAttribution(src)}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingSource(src)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            onClick={() => handleInitiateRemoveSource(src)}
                            disabled={isProcessing || isRemovingSource}
                            className="text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer ml-1"
                            title="Remove or delete source"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. SUPPORTING STUDY PACKAGES & MEMBER RESEARCH SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-purple-950 uppercase tracking-wider">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <span>Supporting Study Packages & Member Research ({sources.filter(s => !s.isInherited && (s.sourceType === 'PREVIOUS_STUDY_PACKAGE' || s.sourceType === 'MEMBER_NOTES' || s.sourceType === 'HUSNI_DIRECTION' || s.provenanceKind === 'MEMBER_GENERATED_STUDY_PACKAGE')).length})</span>
                  </div>
                  <span className="text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                    Supporting Context Only • Cannot Override Regulatory Sources
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {sources.filter(s => !s.isInherited && (s.sourceType === 'PREVIOUS_STUDY_PACKAGE' || s.sourceType === 'MEMBER_NOTES' || s.sourceType === 'HUSNI_DIRECTION' || s.provenanceKind === 'MEMBER_GENERATED_STUDY_PACKAGE')).map((src) => (
                    <div 
                      key={src.sourceId}
                      className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 hover:bg-purple-50/60 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {renderSourceBadges(src)}

                        <input
                          type="checkbox"
                          checked={selectedSourceIdsForAnalysis.includes(src.sourceId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSourceIdsForAnalysis(prev => [...prev, src.sourceId]);
                            } else {
                              setSelectedSourceIdsForAnalysis(prev => prev.filter(id => id !== src.sourceId));
                            }
                          }}
                          className="rounded border-purple-400 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                          title="Include in AI Requirements Analysis"
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                          {src.title}
                        </h4>
                        {src.originalFilename && (
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                            <File className="h-3 w-3 text-slate-400" /> {src.originalFilename}
                          </p>
                        )}
                        {src.contentSnippet && (
                          <p className="text-xs text-slate-600 mt-2 line-clamp-3 bg-white p-2.5 rounded-xl border border-purple-200/80 italic">
                            "{src.contentSnippet}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-purple-200/50">
                        {getProvenanceAttribution(src)}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingSource(src)}
                            className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            onClick={() => handleInitiateRemoveSource(src)}
                            disabled={isProcessing || isRemovingSource}
                            className="text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer ml-1"
                            title="Remove or delete source"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Banner to Step 2 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  <strong>{selectedSourceIdsForAnalysis.length}</strong> of <strong>{sources.length}</strong> sources selected. Grounding will synthesize requirements strictly from these items using authority hierarchy.
                </div>
                <button
                  onClick={() => setCurrentStage(2)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  Proceed to Requirements Analysis <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: REQUIREMENTS ANALYSIS */}
          {currentStage === 2 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-md">
                      STEP 2: REQUIREMENTS EXTRACTION & GROUNDING
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    Synthesize Module 1 Requirements Map
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Extract regulatory objectives, statutory reading assignments, and practical consulting questions grounded strictly in attached sources.
                  </p>
                </div>

                <button
                  onClick={handleAnalyzeSources}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {requirementsMap ? 'Re-Analyze Sources' : 'Extract Requirements Map'}
                </button>
              </div>

              {/* ANALYSIS SCOPE GATE & AUTHORITY ORDER */}
              <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-indigo-700" />
                    <span className="text-xs font-black uppercase text-indigo-950 tracking-wider">
                      Analysis Scope & Grounding Gate — Module 1
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                    Cross-Module Contamination Filter Active
                  </span>
                </div>

                {/* Authority Order Banner */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Source Authority Hierarchy (Order of Precedence)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
                    <div className="p-2 bg-blue-50/80 rounded-lg border border-blue-200 font-medium text-blue-900">
                      <strong className="block text-[10px] uppercase font-bold text-blue-700">Rank 1</strong>
                      Academic & Regulatory Original Sources
                    </div>
                    <div className="p-2 bg-indigo-50/80 rounded-lg border border-indigo-200 font-medium text-indigo-900">
                      <strong className="block text-[10px] uppercase font-bold text-indigo-700">Rank 2</strong>
                      Course-Wide Academic (Scoped to Mod 1)
                    </div>
                    <div className="p-2 bg-emerald-50/80 rounded-lg border border-emerald-200 font-medium text-emerald-900">
                      <strong className="block text-[10px] uppercase font-bold text-emerald-700">Rank 3</strong>
                      Module-Specific Materials
                    </div>
                    <div className="p-2 bg-purple-50/80 rounded-lg border border-purple-200 font-medium text-purple-900">
                      <strong className="block text-[10px] uppercase font-bold text-purple-700">Rank 4</strong>
                      Previous Study Packages (Supporting)
                    </div>
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 font-medium text-slate-700">
                      <strong className="block text-[10px] uppercase font-bold text-slate-500">Rank 5</strong>
                      AI Interpretation & Synthesis
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    *Rule: Previous Study Packages serve as supporting context only and cannot override academic or regulatory sources. Later-module workbook chapters (Chapters 2–7) are excluded from Module 1 requirements generation.
                  </p>
                </div>
              </div>

              {/* Action Banner to Step 2 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  {selectedSourceIdsForAnalysis.length} of {sources.length} sources selected. Grounding will synthesize requirements strictly from these items.
                </div>
                <button
                  onClick={() => setCurrentStage(2)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  Proceed to Requirements Analysis <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: REQUIREMENTS ANALYSIS */}
          {currentStage === 2 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-md">
                      STEP 2: REQUIREMENTS EXTRACTION & GROUNDING
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    Synthesize Module 1 Requirements Map
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Extract regulatory objectives, statutory reading assignments, and practical consulting questions grounded strictly in attached sources.
                  </p>
                </div>

                <button
                  onClick={handleAnalyzeSources}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {requirementsMap ? 'Re-Analyze Sources' : 'Extract Requirements Map'}
                </button>
              </div>

              {/* Requirements Map Overview */}
              {requirementsMap ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500">Requirements Map Status</span>
                      <div className="text-sm font-black text-slate-900">{requirementsMap.status === 'MEMBER_REVIEWED' ? '✓ MEMBER REVIEWED' : 'DRAFT — Awaiting Samar Baydoun Review'}</div>
                    </div>
                    <span className="text-xs text-slate-400">Extracted: {new Date(requirementsMap.analyzedAt).toLocaleTimeString()}</span>
                  </div>

                  {/* Requirements List by Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requirementsMap.requirements.map((req) => (
                      <div key={req.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {req.category}
                          </span>
                          
                          {/* Origin Label */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            req.origin === 'SOURCE_DERIVED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : req.origin === 'HUSNI_DIRECTION'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            ORIGIN: {req.origin?.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-900">{req.title}</h4>
                        <p className="text-xs text-slate-600">{req.description}</p>

                        {req.statutoryCitations && req.statutoryCitations.length > 0 && (
                          <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                            Citation: {req.statutoryCitations.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end pt-4">
                    <button
                      onClick={() => setCurrentStage(3)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      Proceed to Member Review Gate <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                  <Cpu className="h-10 w-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-black text-slate-700">No Requirements Map Synthesized Yet</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Click "Extract Requirements Map" above to run the grounded C-Bridge analysis engine on your attached sources.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STAGE 3: MEMBER REQUIREMENTS REVIEW GATE (CRITICAL GATE) */}
          {currentStage === 3 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              {/* Header & Gate Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-md">
                      STEP 3: MEMBER REQUIREMENTS REVIEW
                    </span>
                    <span className="bg-indigo-100 text-indigo-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      PRJ-324 • MA-324-01
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      requirementsMap?.status === 'MEMBER_REVIEWED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      REVIEW GATE STATUS: {requirementsMap?.status === 'MEMBER_REVIEWED' ? 'MEMBER_REVIEWED (REVIEW COMPLETED)' : 'DRAFT (AWAITING SAMAR REVIEW)'}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1.5 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    Samar Baydoun's Academic & Statutory Review Station
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect exact source evidence, verify statutory authority (Ranks 1–5), correct AI inferences, flag unsupported claims, and complete member review.
                  </p>
                </div>

                {/* Member Review Completion Action Button (Top) */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={handleCompleteMemberReview}
                    disabled={isProcessing || !allRequirementsResolved || requirementsMap?.status === 'MEMBER_REVIEWED'}
                    title={!allRequirementsResolved ? `Cannot complete review: ${pendingCount} items pending review` : 'Complete member review'}
                    className={`px-5 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
                      requirementsMap?.status === 'MEMBER_REVIEWED'
                        ? 'bg-emerald-700 text-white cursor-default'
                        : allRequirementsResolved
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    {requirementsMap?.status === 'MEMBER_REVIEWED' 
                      ? '✓ Member Review Completed' 
                      : allRequirementsResolved 
                        ? 'COMPLETE MEMBER REVIEW' 
                        : `Review Incomplete (${pendingCount} Pending)`}
                  </button>
                </div>
              </div>

              {/* Summary Metrics Bar (Top) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-600" /> Requirement Review Progress Summary
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {totalRequirementsCount - pendingCount} of {totalRequirementsCount} items resolved ({Math.round(totalRequirementsCount > 0 ? ((totalRequirementsCount - pendingCount) / totalRequirementsCount) * 100 : 0)}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Total Items</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">{totalRequirementsCount}</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">✓ Confirmed</div>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">{confirmedCount}</div>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <div className="text-[10px] font-bold text-amber-800 uppercase">⏳ Pending Review</div>
                    <div className="text-sm font-black text-amber-700 mt-0.5">{pendingCount}</div>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-center">
                    <div className="text-[10px] font-bold text-rose-800 uppercase">⚑ Flagged Unsupported</div>
                    <div className="text-sm font-black text-rose-700 mt-0.5">{flaggedCount}</div>
                  </div>
                  <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                    <div className="text-[10px] font-bold text-indigo-800 uppercase">✎ Correction Requested</div>
                    <div className="text-sm font-black text-indigo-700 mt-0.5">{correctionCount}</div>
                  </div>
                  <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-center">
                    <div className="text-[10px] font-bold text-sky-800 uppercase">? Clarification</div>
                    <div className="text-sm font-black text-sky-700 mt-0.5">{clarificationCount}</div>
                  </div>
                </div>

                {/* Status Callout Banner */}
                {pendingCount > 0 ? (
                  <div className="flex items-center gap-2.5 p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>
                      <strong>MEMBER_REVIEWED Gate Locked:</strong> Samar must inspect the source evidence and select a review action for all <strong>{pendingCount} pending requirement(s)</strong> before completing member review.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>
                      <strong>All Requirements Resolved:</strong> All {totalRequirementsCount} items have confirmed, flagged, or corrected records. Click "COMPLETE MEMBER REVIEW" to advance to Step 4 (Consulting Practice Topics).
                    </span>
                  </div>
                )}
              </div>

              {/* Requirement Items Review Station */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    Module 1 Requirements & Source Traceability Matrix ({requirementsMap?.requirements.length || 0})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Click "View Source Evidence" on any item to view verbatim chapter & page citations.
                  </span>
                </div>

                <div className="space-y-4">
                  {requirementsMap?.requirements.map((req, idx) => {
                    const status = req.reviewStatus || 'PENDING_REVIEW';
                    const hasEvidence = req.evidenceList && req.evidenceList.length > 0;
                    const isMissingTraceability = req.origin === 'SOURCE_DERIVED' && !hasEvidence;

                    const isConfirmedGroup = status === 'CONFIRMED' || status === 'MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION' || status === 'DIRECTION_ACKNOWLEDGED' || status === 'MODULE_BOUNDARY_ACKNOWLEDGED';
                    const isPendingGroup = status.startsWith('PENDING_');

                    return (
                      <div 
                        key={req.id}
                        className={`p-5 rounded-2xl border transition-all space-y-4 ${
                          isConfirmedGroup
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : status === 'FLAGGED_UNSUPPORTED'
                              ? 'border-rose-200 bg-rose-50/20'
                              : status === 'CORRECTION_REQUESTED'
                                ? 'border-indigo-200 bg-indigo-50/20'
                                : status === 'CLARIFICATION_REQUESTED'
                                  ? 'border-sky-200 bg-sky-50/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {req.id}
                            </span>
                            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {req.category}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              ORIGIN: {req.origin}
                            </span>
                            {req.statutoryCitations && req.statutoryCitations.length > 0 && (
                              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                                {req.statutoryCitations.join(', ')}
                              </span>
                            )}
                          </div>

                          {/* Review Status Badge */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border flex items-center gap-1 ${
                              isConfirmedGroup
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : status === 'FLAGGED_UNSUPPORTED'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : status === 'CORRECTION_REQUESTED'
                                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                    : status === 'CLARIFICATION_REQUESTED'
                                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                                      : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                              {isConfirmedGroup && <CheckCircle2 className="h-3 w-3" />}
                              {status === 'FLAGGED_UNSUPPORTED' && <Flag className="h-3 w-3" />}
                              {status === 'CORRECTION_REQUESTED' && <Edit3 className="h-3 w-3" />}
                              {status === 'CLARIFICATION_REQUESTED' && <HelpCircle className="h-3 w-3" />}
                              {isPendingGroup && <Clock className="h-3 w-3" />}
                              {status === 'PENDING_AI_RECOMMENDATION_REVIEW'
                                ? 'Pending Recommendation Review'
                                : status === 'PENDING_DIRECTION_ACKNOWLEDGEMENT'
                                  ? 'Pending Direction Ack'
                                  : status === 'PENDING_MODULE_BOUNDARY_REVIEW'
                                    ? 'Pending Boundary Review'
                                    : status === 'MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION'
                                      ? 'Accepted Study Recommendation'
                                      : status === 'DIRECTION_ACKNOWLEDGED'
                                        ? 'Direction Acknowledged'
                                        : status === 'MODULE_BOUNDARY_ACKNOWLEDGED'
                                          ? 'Boundary Acknowledged'
                                          : status?.replace(/_/g, ' ')}
                            </span>

                            {req.reviewedBy && (
                              <span className="text-[10px] text-slate-400">
                                by {req.reviewedBy}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-900">{req.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>
                        </div>

                        {/* Preserved Original AI Extraction vs Member Correction */}
                        {req.originalAiExtraction && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="text-[10px] font-black uppercase text-slate-400">
                              Original AI Extraction (Preserved)
                            </div>
                            <p className="text-slate-600 italic">"{req.originalAiExtraction}"</p>
                          </div>
                        )}

                        {req.memberCorrection && (
                          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs space-y-1">
                            <div className="text-[10px] font-black uppercase text-indigo-900 flex items-center gap-1">
                              <Edit3 className="h-3 w-3 text-indigo-600" /> Samar's Corrected Requirement
                            </div>
                            <p className="text-indigo-950 font-medium">{req.memberCorrection}</p>
                          </div>
                        )}

                        {req.flaggedReason && (
                          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
                            <div className="text-[10px] font-black uppercase text-rose-900 flex items-center gap-1">
                              <Flag className="h-3 w-3 text-rose-600" /> Reason Flagged as Unsupported
                            </div>
                            <p className="text-rose-950">{req.flaggedReason}</p>
                          </div>
                        )}

                        {req.clarificationQuestion && (
                          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs space-y-1">
                            <div className="text-[10px] font-black uppercase text-sky-900 flex items-center gap-1">
                              <HelpCircle className="h-3 w-3 text-sky-600" /> Clarification Question
                            </div>
                            <p className="text-sky-950">{req.clarificationQuestion}</p>
                          </div>
                        )}

                        {req.memberNotes && !req.memberCorrection && !req.flaggedReason && (
                          <div className="p-3 bg-slate-100 rounded-xl text-xs space-y-1">
                            <div className="text-[10px] font-black uppercase text-slate-500">Member Review Notes</div>
                            <p className="text-slate-700">{req.memberNotes}</p>
                          </div>
                        )}

                        {/* Source Traceability & Evidence Block */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            {isMissingTraceability ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-xs font-bold">
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-700" />
                                <span>SOURCE TRACEABILITY MISSING — Unverified Origin</span>
                              </div>
                            ) : hasEvidence ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold text-slate-500">Supporting Evidence:</span>
                                {req.evidenceList?.map((ev, eIdx) => (
                                  <span 
                                    key={eIdx}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                                      ev.authorityRank === 1 
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : ev.authorityRank === 2
                                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                          : ev.authorityRank === 3
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : ev.authorityRank === 4
                                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                                              : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <Scale className="h-3 w-3" />
                                    <span>Rank {ev.authorityRank || 1}: {ev.sourceTitle.slice(0, 32)}... ({ev.chapterOrSection || 'General'})</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Direct instructor directive / internal recommendation.
                              </span>
                            )}
                          </div>

                          {/* Action Buttons on Card */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {/* View Source Evidence Button */}
                            <button
                              onClick={() => setSelectedEvidenceReq(req)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>View Source Evidence</span>
                            </button>

                            {/* Origin-Specific Primary Review Action */}
                            {req.origin === 'AI_RECOMMENDATION' ? (
                              <button
                                onClick={() => handleExecuteItemReview(req.id, 'MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION')}
                                disabled={isProcessing}
                                className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer ${
                                  status === 'MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION' || status === 'CONFIRMED'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Accept Recommendation</span>
                              </button>
                            ) : req.origin === 'HUSNI_DIRECTION' ? (
                              <button
                                onClick={() => handleExecuteItemReview(req.id, 'DIRECTION_ACKNOWLEDGED')}
                                disabled={isProcessing}
                                className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer ${
                                  status === 'DIRECTION_ACKNOWLEDGED' || status === 'CONFIRMED'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Acknowledge Direction</span>
                              </button>
                            ) : req.origin === 'CROSS_MODULE_REFERENCE' || req.origin === 'AI_INTERPRETATION' ? (
                              <button
                                onClick={() => handleExecuteItemReview(req.id, 'MODULE_BOUNDARY_ACKNOWLEDGED')}
                                disabled={isProcessing}
                                className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer ${
                                  status === 'MODULE_BOUNDARY_ACKNOWLEDGED' || status === 'CONFIRMED'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Acknowledge Boundary</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleExecuteItemReview(req.id, 'CONFIRMED')}
                                disabled={isProcessing}
                                className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer ${
                                  status === 'CONFIRMED'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Confirm</span>
                              </button>
                            )}

                            {/* Flag Unsupported */}
                            <button
                              onClick={() => openReviewActionModal(req, 'FLAGGED_UNSUPPORTED')}
                              disabled={isProcessing}
                              className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer ${
                                status === 'FLAGGED_UNSUPPORTED'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800'
                              }`}
                            >
                              <Flag className="h-3.5 w-3.5" />
                              <span>Flag</span>
                            </button>

                            {/* Correct AI */}
                            <button
                              onClick={() => openReviewActionModal(req, 'CORRECTION_REQUESTED')}
                              disabled={isProcessing}
                              className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer ${
                                status === 'CORRECTION_REQUESTED'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800'
                              }`}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Correct AI</span>
                            </button>

                            {/* Clarification / Comment Action Menu */}
                            <button
                              onClick={() => openReviewActionModal(req, 'CLARIFICATION_REQUESTED')}
                              disabled={isProcessing}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                              title="Request clarification or add annotation"
                            >
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Review Summary & Complete Member Review Action Bar */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl">
                <div>
                  <div className="text-xs font-black text-slate-900">
                    Module 1 Member Review Readiness: {allRequirementsResolved ? '✓ Ready to Complete Member Review' : `Blocked (${pendingCount} pending)`}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {allRequirementsResolved 
                      ? 'All requirements have explicit member review states. Completing member review will record Samar\'s verified inputs and unlock Step 4.'
                      : 'Every single requirement must have a resolved review action (Confirmed, Flagged, or Corrected).'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCompleteMemberReview}
                    disabled={isProcessing || !allRequirementsResolved || requirementsMap?.status === 'MEMBER_REVIEWED'}
                    className={`px-6 py-3 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
                      requirementsMap?.status === 'MEMBER_REVIEWED'
                        ? 'bg-emerald-700 text-white cursor-default'
                        : allRequirementsResolved
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    {requirementsMap?.status === 'MEMBER_REVIEWED' 
                      ? '✓ Member Review Completed' 
                      : allRequirementsResolved 
                        ? 'COMPLETE MEMBER REVIEW' 
                        : `Review Incomplete (${pendingCount} Pending)`}
                  </button>

                  {requirementsMap?.status === 'MEMBER_REVIEWED' && (
                    <button
                      onClick={() => setCurrentStage(4)}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Advance to Practice Topics</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: CONSULTING PRACTICE TOPICS MAP */}
          {currentStage === 4 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-md">
                      STEP 4: CONSULTING PRACTICE TOPIC MAP
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      Grounded in Member-Reviewed Requirements
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    Select Consulting Practice Focus for Module 1 Simulation
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Topics derived strictly from 21 CFR 1.500 scope. Filter prevents cross-module contamination from Future Modules.
                  </p>
                </div>
              </div>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topics.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTopic(t.id)}
                    className={`p-5 rounded-3xl border text-left transition-all cursor-pointer space-y-3 flex flex-col justify-between ${
                      selectedTopicId === t.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          t.relevanceCategory === 'PRIMARY_MODULE_TOPIC'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {t.relevanceCategory?.replace(/_/g, ' ')}
                        </span>
                        
                        <span className="text-[10px] font-mono text-slate-400">
                          {t.regulatoryReferences.join(', ')}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900">
                        {t.topicName}
                      </h3>

                      <p className="text-xs text-slate-600">
                        {t.whyThisTopicExists}
                      </p>

                      {t.crossModuleNote && (
                        <div className="text-[11px] bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-amber-800">
                          {t.crossModuleNote}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-600">
                        {selectedTopicId === t.id ? '✓ Active Topic' : 'Click to Select'}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentStage(3)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  ← Back to Requirements
                </button>
                {caseSetup ? (
                  <button
                    onClick={() => setCurrentStage(5)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <span>PROCEED TO CASE SETUP</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    id="generate-case-scenario-button"
                    onClick={() => handleGenerateCaseSetup(false)}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>GENERATING CASE SCENARIO...</span>
                      </>
                    ) : (
                      <>
                        <span>GENERATE VIRTUAL COMPANY & CASE SCENARIO</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STAGE 5: CASE SETUP & VIRTUAL COMPANY PROFILE */}
          {currentStage === 5 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-md">
                      STEP 5: PROPOSED CASE SETUP
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      PRJ-324 • MA-324-01
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      SCOPE: 21 CFR 1.500 IMPORTER DETERMINATION
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                      caseSetup?.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {caseSetup?.status === 'CONFIRMED' ? '✓ PROPOSAL CONFIRMED' : 'PROPOSED CASE SETUP (AWAITING ACCEPTANCE)'}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    Virtual Client Company Profile & Scenario Context
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Separates visible client context from protected diagnostic facts to enable authentic inquiry-driven discovery under 21 CFR 1.500.
                  </p>
                </div>

                {/* Top Action Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {currentUser === 'HUSNI' && (
                    <button
                      id="supervisor-view-toggle-btn"
                      onClick={() => setShowSupervisorDebugView(prev => !prev)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-colors ${
                        showSupervisorDebugView
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                      title="Supervisor / Admin debug view for case design evaluation"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      <span>{showSupervisorDebugView ? 'HIDE SUPERVISOR VIEW' : 'SUPERVISOR CASE DESIGN VIEW'}</span>
                    </button>
                  )}
                  <button
                    id="add-direction-toggle-btn"
                    onClick={() => setIsDirectionOpen(prev => !prev)}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" /> ADD DIRECTION
                  </button>
                  <button
                    id="edit-case-setup-btn"
                    onClick={() => setIsEditingCaseSetup(prev => !prev)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4" /> {isEditingCaseSetup ? 'CLOSE EDITOR' : 'EDIT CASE SETUP'}
                  </button>
                  <button
                    id="regenerate-case-btn"
                    onClick={() => handleGenerateCaseSetup(false)}
                    disabled={isProcessing}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} /> REGENERATE CASE
                  </button>
                </div>
              </div>

              {/* Add Direction / Guidance Box */}
              {isDirectionOpen && (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-purple-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-600" /> Direction for AI Case Generation
                    </span>
                    <span className="text-[10px] text-purple-600 font-bold">21 CFR 1.500 Context Guidance</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promptDirection}
                      onChange={(e) => setPromptDirection(e.target.value)}
                      placeholder="e.g. Multi-tier purchase with Izmir trading house, DDP terms, customs broker entry dispute..."
                      className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleGenerateCaseSetup(false)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      {isProcessing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Apply & Regenerate
                    </button>
                  </div>
                </div>
              )}

              {caseSetup ? (
                <div className="space-y-6">
                  {/* Inline Editing Form */}
                  {isEditingCaseSetup && (
                    <div className="p-5 bg-amber-50/60 border border-amber-300 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                        <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                          <Edit3 className="h-4 w-4 text-amber-700" /> Edit Proposed Virtual Company Profile
                        </span>
                        <button
                          onClick={() => setIsEditingCaseSetup(false)}
                          className="text-xs text-amber-800 font-bold hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Virtual Company Name</label>
                          <input
                            type="text"
                            defaultValue={caseSetup.virtualCompanyName}
                            id="edit-company-name-input"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Country / HQ</label>
                          <input
                            type="text"
                            defaultValue={caseSetup.country}
                            id="edit-country-input"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Industry / Business Type</label>
                          <input
                            type="text"
                            defaultValue={caseSetup.industry}
                            id="edit-industry-input"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Business Model</label>
                          <input
                            type="text"
                            defaultValue={caseSetup.businessModel}
                            id="edit-business-model-input"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Import Activities</label>
                          <input
                            type="text"
                            defaultValue={caseSetup.importActivities}
                            id="edit-import-activities-input"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Initial Client Situation</label>
                          <textarea
                            rows={2}
                            defaultValue={caseSetup.clientSituation}
                            id="edit-situation-input"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason for Seeking Consulting Assistance</label>
                          <input
                            type="text"
                            defaultValue={caseSetup.reasonForSeekingConsulting}
                            id="edit-reason-input"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Visible Initial Client Context</label>
                          <textarea
                            rows={2}
                            defaultValue={caseSetup.visibleInitialClientContext}
                            id="edit-visible-context-input"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                        <button
                          onClick={() => {
                            const nameVal = (document.getElementById('edit-company-name-input') as HTMLInputElement)?.value || caseSetup.virtualCompanyName;
                            const countryVal = (document.getElementById('edit-country-input') as HTMLInputElement)?.value || caseSetup.country;
                            const industryVal = (document.getElementById('edit-industry-input') as HTMLInputElement)?.value || caseSetup.industry;
                            const modelVal = (document.getElementById('edit-business-model-input') as HTMLInputElement)?.value || caseSetup.businessModel;
                            const actsVal = (document.getElementById('edit-import-activities-input') as HTMLInputElement)?.value || caseSetup.importActivities;
                            const sitVal = (document.getElementById('edit-situation-input') as HTMLTextAreaElement)?.value || caseSetup.clientSituation;
                            const reasonVal = (document.getElementById('edit-reason-input') as HTMLInputElement)?.value || caseSetup.reasonForSeekingConsulting;
                            const visVal = (document.getElementById('edit-visible-context-input') as HTMLTextAreaElement)?.value || caseSetup.visibleInitialClientContext;

                            handleSaveEditedCaseSetup({
                              ...caseSetup,
                              virtualCompanyName: nameVal,
                              country: countryVal,
                              industry: industryVal,
                              businessModel: modelVal,
                              importActivities: actsVal,
                              clientSituation: sitVal,
                              reasonForSeekingConsulting: reasonVal,
                              visibleInitialClientContext: visVal
                            });
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Save Proposal Adjustments
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Company Overview Card */}
                  <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-xs font-mono text-indigo-300 flex items-center gap-2">
                            <span>{caseSetup.caseId}</span>
                            <span>•</span>
                            <span>{caseSetup.country}</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-100 mt-0.5">{caseSetup.virtualCompanyName}</h3>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1 rounded-full border border-indigo-700">
                        {caseSetup.industry}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 pt-3 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400 font-bold block">Business Model:</span>
                        {caseSetup.businessModel}
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block">Import Activities:</span>
                        {caseSetup.importActivities}
                      </div>
                    </div>

                    {/* Relevant Products Section */}
                    {caseSetup.products && caseSetup.products.length > 0 && (
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold text-xs block">Imported Food Portfolio (Background Context):</span>
                          <span className="text-[10px] text-slate-400">Products for Case Context</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {caseSetup.products.map((p, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs space-y-1">
                              <div className="font-bold text-slate-200">{p.name}</div>
                              <div className="text-[11px] text-slate-400">Origin: {p.originCountry} • {p.category}</div>
                              <span className="inline-block text-[9px] font-bold text-slate-300 bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-600">
                                Background / Food Context
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Initial Client Situation */}
                    <div className="pt-3 border-t border-slate-800 text-xs">
                      <span className="text-slate-400 font-bold block mb-0.5">Initial Client Situation:</span>
                      <p className="text-slate-300 leading-relaxed">{caseSetup.clientSituation}</p>
                    </div>
                  </div>

                  {/* Split View: Visible Client Context vs Learner Question-Driven Discovery */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Left: Visible Initial Client Context */}
                    <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-blue-900 flex items-center gap-1.5">
                          <Eye className="h-4 w-4 text-blue-600" /> Visible Initial Client Context
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          Disclosed in Initial Contact
                        </span>
                      </div>
                      <p className="text-xs text-blue-950 bg-white p-3.5 rounded-2xl border border-blue-100 leading-relaxed">
                        {caseSetup.visibleInitialClientContext}
                      </p>
                      <div className="text-xs text-blue-800 bg-blue-100/50 p-2.5 rounded-xl border border-blue-200/60">
                        <strong>Reason for Seeking Consulting Assistance:</strong> {caseSetup.reasonForSeekingConsulting}
                      </div>
                    </div>

                    {/* Right: Question-Driven Discovery Engine (Protected Learner View) */}
                    <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5">
                          <HelpCircle className="h-4 w-4 text-indigo-600" /> Question-Driven Discovery Engine
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                          Live Case Room Inquiries
                        </span>
                      </div>
                      
                      <div className="p-4 bg-white rounded-2xl border border-indigo-100 text-xs text-slate-700 space-y-2.5">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold">
                          <Lock className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span>Diagnostic Case Facts are Protected</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          To foster authentic consulting discovery, operational contract terms, ownership timing, consignee routing, and broker agency agreements are maintained server-side.
                        </p>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                          <span className="font-bold text-slate-800 block">How Discovery Works:</span>
                          <p>
                            In the <strong>Client Engagement Room (Step 7)</strong>, Samar asks diagnostic questions directly to client personas to uncover transaction facts and build the 21 CFR 1.500 statutory determination.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supervisor / Debug View for Husni / OWNER_ADMIN Only */}
                  {currentUser === 'HUSNI' && showSupervisorDebugView && (
                    <div className="p-5 bg-amber-50/70 border-2 border-amber-300 rounded-3xl space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                        <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 text-amber-700" /> SUPERVISOR CASE DESIGN VIEW — SERVER-SIDE HIDDEN FACTS (DEBUG)
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                          VISIBLE ONLY TO HUSNI (ADMIN)
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        The following objective facts are stored in the server-side discovery repository. They are revealed dynamically to Samar only when relevant diagnostic questions are asked in the Case Room.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {caseSetup.hiddenCaseFacts?.map((hcf) => (
                          <div key={hcf.id} className="p-3.5 bg-white rounded-2xl border border-amber-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-amber-900">
                              <span className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{hcf.id}</span>
                                <span>{hcf.category}</span>
                              </span>
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                Discovery Item
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{hcf.fact}</p>
                            <div className="text-[11px] text-amber-900/80 bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                              <strong>Discovery Trigger:</strong> "{hcf.discoveryTrigger}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
                    <button
                      onClick={() => setCurrentStage(4)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      ← Back to Practice Topics
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="add-direction-footer-btn"
                        onClick={() => setIsDirectionOpen(prev => !prev)}
                        className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4" /> ADD DIRECTION
                      </button>
                      <button
                        id="edit-case-setup-footer-btn"
                        onClick={() => setIsEditingCaseSetup(prev => !prev)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer"
                      >
                        EDIT CASE SETUP
                      </button>
                      <button
                        id="regenerate-case-footer-btn"
                        onClick={() => handleGenerateCaseSetup(false)}
                        disabled={isProcessing}
                        className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 cursor-pointer"
                      >
                        REGENERATE CASE
                      </button>
                      {caseSetup.status === 'CONFIRMED' ? (
                        <button
                          onClick={() => setCurrentStage(6)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                        >
                          <span>PROCEED TO TEAM SETUP</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          id="accept-case-setup-btn"
                          onClick={handleConfirmCaseSetup}
                          disabled={isProcessing}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>ACCEPT CASE SETUP</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                  <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-black text-slate-700">No Case Scenario Generated Yet</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Click "GENERATE VIRTUAL COMPANY & CASE SCENARIO" on Step 4 to synthesize a dynamic, non-hardcoded consulting case proposal.
                  </p>
                  <button
                    onClick={() => handleGenerateCaseSetup(false)}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>Generate Virtual Company & Case Scenario</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STAGE 6: CASE TEAM SETUP */}
          {currentStage === 6 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
              {/* Header & Gate Status */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-md tracking-wide">
                      STEP 6: CASE TEAM SETUP & ROLES
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      caseTeam?.confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {caseTeam?.confirmed ? 'ROSTER CONFIRMED' : 'PROPOSED ROSTER (AWAITING CONFIRMATION)'}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      Human Multi-Team Permission Enabled
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    Human Multi-Team Role Configuration & Personas Roster
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
                    Authorized humans (Samar Baydoun, Husni Hasan) can hold permissions across C-Bridge Consulting Team and Client Team Human Role-Play. Enforces strictly <strong>ONE active conversational role</strong> at a time with full audit logging.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => setCurrentStage(5)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    ← Back to Step 5
                  </button>
                  {caseTeam?.confirmed ? (
                    <button
                      onClick={() => setCurrentStage(7)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      <span>PROCEED TO START CASE GATE</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      id="confirm-team-roster-btn"
                      onClick={handleConfirmTeamSetup}
                      disabled={isProcessing}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      <span>CONFIRM TEAM ROSTER</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 1. AUTHORIZED HUMAN PARTICIPANTS & MULTI-TEAM CONFIGURATION */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-900 tracking-wide">
                        1. Authorized Human Participants & Multi-Team Permissions
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Configure team memberships, permitted roles, and default active conversational perspective for canonical human members.
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
                    Active Human Role: <strong className="font-black text-indigo-900">{caseTeam?.activeHumanRole || 'SAMAR_CONSULTANT'}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(caseTeam?.humanParticipants || []).map((human) => {
                    const isSamar = human.memberId === 'MBR-001';
                    const isHusni = human.memberId === 'MBR-002';
                    const isCurrentlyActive = caseTeam?.activeHumanRole === human.currentActiveRole;

                    return (
                      <div 
                        key={human.caseParticipantId || human.memberId} 
                        className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                          isCurrentlyActive ? 'bg-white border-indigo-400 ring-2 ring-indigo-100 shadow-xs' : 'bg-white/80 border-slate-200'
                        }`}
                      >
                        {/* Member Identity Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs ${
                              isSamar ? 'bg-emerald-600' : 'bg-indigo-700'
                            }`}>
                              {isSamar ? 'SB' : 'HH'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-slate-900">{human.name}</span>
                                {human.isLead && (
                                  <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                    Lead
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">{human.title}</div>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {human.memberId}
                          </span>
                        </div>

                        {/* Team Memberships */}
                        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            Team Participation
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleHumanTeamMembership(human.memberId, 'CBRIDGE_CONSULTING')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                human.teamMemberships.includes('CBRIDGE_CONSULTING')
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <Briefcase className="h-3 w-3" />
                              <span>C-Bridge Consulting Team</span>
                              {human.teamMemberships.includes('CBRIDGE_CONSULTING') && <Check className="h-3 w-3 text-indigo-600" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleHumanTeamMembership(human.memberId, 'CLIENT_ROLEPLAY')}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                human.teamMemberships.includes('CLIENT_ROLEPLAY')
                                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <Users className="h-3 w-3" />
                              <span>Client Team — Human Role-Play</span>
                              {human.teamMemberships.includes('CLIENT_ROLEPLAY') && <Check className="h-3 w-3 text-amber-600" />}
                            </button>
                          </div>
                        </div>

                        {/* Permitted Roles */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            <span>Permitted Case Roles</span>
                            <span className="text-slate-400 font-normal">({human.permittedRoles.length} permitted)</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {human.permittedRoles.map((role) => {
                              const isClientRole = role === 'CLIENT_ROLEPLAY_PARTICIPANT';
                              return (
                                <span
                                  key={role}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                    isClientRole
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  }`}
                                >
                                  {role === 'SAMAR_CONSULTANT' && 'C-BRIDGE CONSULTANT (Lead)'}
                                  {role === 'HUSNI_SUPERVISOR' && 'CONSULTING SUPERVISOR'}
                                  {role === 'OBSERVER' && 'OBSERVER'}
                                  {role === 'CLIENT_ROLEPLAY_PARTICIPANT' && 'CLIENT ROLE-PLAY PARTICIPANT'}
                                  {human.permittedRoles.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveHumanRole(human.memberId, role)}
                                      className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                                      title="Remove permitted role"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </span>
                              );
                            })}
                          </div>

                          {/* Add Role Actions */}
                          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                            {!human.permittedRoles.includes('CLIENT_ROLEPLAY_PARTICIPANT') && (
                              <button
                                type="button"
                                onClick={() => handleAddHumanRole(human.memberId, 'CLIENT_ROLEPLAY_PARTICIPANT')}
                                className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="h-3 w-3" /> Add to Client Role-Play
                              </button>
                            )}
                            {isSamar && !human.permittedRoles.includes('SAMAR_CONSULTANT') && (
                              <button
                                type="button"
                                onClick={() => handleAddHumanRole(human.memberId, 'SAMAR_CONSULTANT')}
                                className="px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="h-3 w-3" /> Add to Consulting Team
                              </button>
                            )}
                            {isHusni && !human.permittedRoles.includes('HUSNI_SUPERVISOR') && (
                              <button
                                type="button"
                                onClick={() => handleAddHumanRole(human.memberId, 'HUSNI_SUPERVISOR')}
                                className="px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="h-3 w-3" /> Add Supervisor Role
                              </button>
                            )}
                            {isHusni && !human.permittedRoles.includes('OBSERVER') && (
                              <button
                                type="button"
                                onClick={() => handleAddHumanRole(human.memberId, 'OBSERVER')}
                                className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="h-3 w-3" /> Add Observer Role
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Default Active Role & Switch Control */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-slate-500">Default Role:</span>
                            <select
                              value={human.defaultActiveRole}
                              onChange={(e) => handleSetDefaultActiveRole(human.memberId, e.target.value as CaseParticipantRole)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {human.permittedRoles.map((r) => (
                                <option key={r} value={r}>
                                  {r === 'SAMAR_CONSULTANT' && 'C-Bridge Consultant (Lead)'}
                                  {r === 'HUSNI_SUPERVISOR' && 'Consulting Supervisor'}
                                  {r === 'OBSERVER' && 'Observer'}
                                  {r === 'CLIENT_ROLEPLAY_PARTICIPANT' && 'Client Role-Play Participant'}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quick Role Switcher Button */}
                          {human.permittedRoles.length > 1 && (
                            <div className="flex items-center gap-1.5">
                              {human.permittedRoles
                                .filter(r => r !== caseTeam?.activeHumanRole)
                                .slice(0, 1)
                                .map((otherRole) => (
                                  <button
                                    key={otherRole}
                                    type="button"
                                    onClick={() => handleSwitchActiveRoleNow(otherRole, human.memberId)}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <ArrowLeftRight className="h-3 w-3" />
                                    <span>Switch to {otherRole === 'CLIENT_ROLEPLAY_PARTICIPANT' ? 'Client Role-Play' : otherRole?.replace(/_/g, ' ')}</span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. DUAL TEAM ROSTERS VIEW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Team Column */}
                <div className="p-5 bg-amber-50/40 border border-amber-200 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-amber-900 tracking-wide">
                          Client Team (Engagement Channel)
                        </h3>
                        <p className="text-[10px] text-amber-700">
                          {caseSetup?.virtualCompanyName || 'Levant Culinary Traditions Corp'} Personas
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddClientPersonaModalOpen(true)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg border border-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="h-3 w-3" /> Add Persona
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Render AI Client Personas */}
                    {caseTeam?.clientTeam.map((p) => (
                      <div key={p.personaId} className="p-3.5 bg-white rounded-2xl border border-amber-200 text-xs space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-bold text-[10px]">
                              {p.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <span className="font-black text-slate-900">{p.name}</span>
                              <div className="text-[11px] text-slate-500">{p.title}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {p.isAiClientLead ? 'AI CLIENT LEAD' : 'AI CLIENT PERSONA'}
                            </span>
                            {!p.isAiClientLead && (
                              <button
                                type="button"
                                onClick={() => handleRemoveClientPersona(p.personaId)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Remove persona"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2 rounded-xl border border-amber-100/50">
                          "{p.personality}"
                        </p>
                      </div>
                    ))}

                    {/* Render Human Members in Client Role-Play */}
                    {(caseTeam?.humanParticipants || [])
                      .filter(h => h.teamMemberships.includes('CLIENT_ROLEPLAY'))
                      .map((h) => (
                        <div key={`client-human-${h.memberId}`} className="p-3.5 bg-amber-100/40 rounded-2xl border border-dashed border-amber-300 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-700 text-white flex items-center justify-center font-bold text-[10px]">
                                {h.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <span className="font-black text-slate-900">{h.name}</span>
                                <div className="text-[11px] text-slate-500">{h.title}</div>
                              </div>
                            </div>

                            <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded border border-amber-300">
                              HUMAN ROLE-PLAY PARTICIPANT
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-800">
                            Authorized human holding role-play permission to speak on behalf of the client during simulation.
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* C-Bridge Consulting Team Column */}
                <div className="p-5 bg-indigo-50/40 border border-indigo-200 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-indigo-900 tracking-wide">
                          C-Bridge Consulting Team (Backstage Channel)
                        </h3>
                        <p className="text-[10px] text-indigo-700">
                          Internal Advisory & Diagnostic Mentorship
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      Internal Advisory
                    </span>
                  </div>

                  <div className="space-y-3">
                    {caseTeam?.consultingTeam.map((m) => {
                      const isAi = m.isAiCoach || m.role === 'AI_COACH';
                      return (
                        <div key={m.memberId} className="p-3.5 bg-white rounded-2xl border border-indigo-200 text-xs space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-[10px] ${
                                isAi ? 'bg-teal-600' : (m.isLead ? 'bg-emerald-600' : 'bg-indigo-700')
                              }`}>
                                {isAi ? <Bot className="h-4 w-4" /> : m.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <span className="font-black text-slate-900">{m.name}</span>
                                <div className="text-[11px] text-slate-500">{m.title}</div>
                              </div>
                            </div>

                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                              isAi 
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : (m.isLead ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200')
                            }`}>
                              {m.role === 'SAMAR_CONSULTANT' ? 'LEAD CONSULTANT' : m.role === 'AI_COACH' ? 'AI REGULATORY COACH' : m.role === 'HUSNI_SUPERVISOR' ? 'SUPERVISOR' : m.role}
                            </span>
                          </div>
                          {isAi && (
                            <p className="text-[10px] text-teal-800 bg-teal-50/50 p-2 rounded-xl border border-teal-100/50">
                              Provides backstage regulatory diagnostic prompts, FSVP citation checks, and mentoring feedback. Strictly isolated from client-facing channel.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. ROSTER REVIEW GATE CHECKLIST & LIVE VALIDATION MATRIX */}
              <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      Step 6 Roster Verification Gate & Safety Checklist
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Step 7 Unlocks upon Confirmation | Does NOT Auto-Start Case
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">Client Personas</span>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">PASS</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      21 CFR 1.500 specialty importer leadership configured.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">Human Multi-Team</span>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">PASS</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Samar & Husni permitted for Consulting and Role-Play.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">Single Active Role</span>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">PASS</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Strictly one active conversational role with audit trail.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">Gate Integrity</span>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">PASS</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Roster confirmation gates Step 7 without starting case.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-400">
                    Review and adjust participant roles above. Click <strong>Confirm Team Roster</strong> to persist the roster and unlock Step 7 Start Case Gate.
                  </div>

                  {caseTeam?.confirmed ? (
                    <button
                      onClick={() => setCurrentStage(7)}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                    >
                      <span>PROCEED TO START CASE GATE</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirmTeamSetup}
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      <span>CONFIRM TEAM ROSTER</span>
                    </button>
                  )}
                </div>
              </div>

              {/* MODAL: ADD CLIENT PERSONA */}
              {isAddClientPersonaModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                          <UserPlus className="h-4 w-4" />
                        </div>
                        <h3 className="font-black text-sm text-slate-900">Add Client Persona</h3>
                      </div>
                      <button
                        onClick={() => setIsAddClientPersonaModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={newPersonaName}
                          onChange={(e) => setNewPersonaName(e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Title & Department</label>
                        <input
                          type="text"
                          value={newPersonaTitle}
                          onChange={(e) => setNewPersonaTitle(e.target.value)}
                          placeholder="e.g. Customs Logistics & Brokerage Manager"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Case Role</label>
                        <select
                          value={newPersonaRole}
                          onChange={(e) => setNewPersonaRole(e.target.value as CaseParticipantRole)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="CLIENT_QA">CLIENT_QA (Quality & Sourcing)</option>
                          <option value="CLIENT_COMPLIANCE">CLIENT_COMPLIANCE (Logistics & Customs)</option>
                          <option value="CLIENT_EXEC">CLIENT_EXEC (Executive Management)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Personality & Tone</label>
                        <textarea
                          rows={2}
                          value={newPersonaPersonality}
                          onChange={(e) => setNewPersonaPersonality(e.target.value)}
                          placeholder="e.g. Practical, focused on customs clearance deadlines and shipment documentation."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setIsAddClientPersonaModalOpen(false)}
                        className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddClientPersona}
                        className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs cursor-pointer"
                      >
                        Add Persona
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 7: START CASE GATE */}
          {currentStage === 7 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xs text-center space-y-6 max-w-3xl mx-auto">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl w-16 h-16 mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                {isCheckingReadiness ? (
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    VALIDATING PREREQUISITES...
                  </span>
                ) : serverReadiness.error ? (
                  <span className="bg-red-100 text-red-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    DATABASE DEGRADED / RETRY
                  </span>
                ) : serverReadiness.ready ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    ALL PREREQUISITES CONFIRMED
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    MISSING PREREQUISITES: {serverReadiness.unmet.join(', ')}
                  </span>
                )}
                <h2 className="text-xl font-black text-slate-900">
                  Ready to Start Consulting Case Session
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  A fresh, clean case will be opened with Elena Rostova's initial inquiry. There are zero pre-filled Samar messages. You drive the engagement!
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
                <div className="font-black text-slate-700">Engagement Parameters:</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>• Project: <strong>{currentProjectId}</strong></div>
                  <div>• Module: <strong>{currentModuleId}</strong></div>
                  <div>• Topic: <strong>{caseSetup?.topicTitle}</strong></div>
                  <div>• Client: <strong>{caseSetup?.virtualCompanyName}</strong></div>
                </div>
              </div>

              <button
                onClick={handleStartCaseSession}
                disabled={isProcessing || isCheckingReadiness || !isCaseRoomReadyToStart}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>STARTING CONSULTING CASE...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="h-5 w-5" />
                    <span>ENTER CONSULTING CASE ROOM NOW</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE CONSULTING CASE ROOM */}
      {activeTab === 'ACTIVE_CASE_ROOM' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('STUDY_FLOW')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              ← Return to Study Flow & Sources
            </button>
            <div className="text-xs font-bold text-slate-600">
              Active Simulation: <strong>{caseSetup?.virtualCompanyName || 'Levant Culinary Traditions Corp'}</strong>
            </div>
            <button
              onClick={handleSynthesizeStudyPackage}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileText className="h-4 w-4" /> Synthesize Study Package
            </button>
          </div>

          <ConsultingCaseRoom
            currentUser={currentUser}
            currentProjectId={currentProjectId}
            currentModuleId={currentModuleId}
            selectedTopic={topics.find(t => t.id === selectedTopicId)}
            onNavigateToAssetLab={handleSaveAssetOpportunity}
            onNavigateToWorkspace={() => setActiveTab('STUDY_PACKAGE')}
          />
        </div>
      )}

      {/* TAB 3: STUDY PACKAGE & LEARNING TRACE */}
      {activeTab === 'STUDY_PACKAGE' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-md">
                  STEP 11: MODULE 1 COMPLETE STUDY PACKAGE
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 mt-1">
                Synthesized Study Package & Asset Opportunities
              </h2>
            </div>
            
            <button
              onClick={handleSynthesizeStudyPackage}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Compile Study Package
            </button>
          </div>

          {/* Study Packages List */}
          <div className="space-y-4">
            {studyPackages.length > 0 ? (
              studyPackages.map((pkg) => (
                <div key={pkg.id} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400">{pkg.id}</span>
                      <h3 className="text-sm font-black text-slate-900">{pkg.packageTitle}</h3>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                      ✓ COMPLETED & VERIFIED
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-2">
                    <p><strong>Requirements Summary:</strong> {pkg.reviewedRequirementsSummary}</p>
                    <div>
                      <strong>Key Concepts Synthesized:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600">
                        {pkg.keyConceptsSynthesized.map((k, idx) => (
                          <li key={idx}>{k}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
                <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-bold">No Study Package synthesized yet.</p>
                <p className="text-[11px] text-slate-400">Click "Compile Study Package" above to compile the findings from Module 1.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / UPLOAD STUDY SOURCE */}
      {isAddSourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-indigo-600" /> Intake Module Study Materials
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach academic materials, regulatory codes, or notes to ground Samar's Module 1 study.
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsAddSourceModalOpen(false);
                  setStagedFiles([]);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Intake Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 overflow-x-auto">
              {[
                { mode: 'UPLOAD_FILES', label: 'Upload Files', icon: UploadCloud },
                { mode: 'PASTE_TEXT', label: 'Paste Text', icon: FileText },
                { mode: 'ADD_LINK', label: 'Add Link / Ref', icon: Link },
                { mode: 'ADD_NOTES', label: 'Add Notes', icon: FileCode },
                { mode: 'ADD_PREVIOUS_PACKAGE', label: 'Previous Package', icon: Archive }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = intakeMode === tab.mode;
                return (
                  <button
                    key={tab.mode}
                    type="button"
                    onClick={() => setIntakeMode(tab.mode as IntakeMode)}
                    className={`px-3 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* MODE 1: MULTI-FILE UPLOAD (DEFAULT) */}
            {intakeMode === 'UPLOAD_FILES' && (
              <div className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileSelection(e.dataTransfer.files);
                    }
                  }}
                  className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all ${
                    isDraggingOver
                      ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                      : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <UploadCloud className="h-10 w-10 text-indigo-600 mx-auto mb-2" />
                  <h4 className="text-sm font-black text-slate-900">
                    Drag and drop one or multiple study files here
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports <strong>.pdf, .docx, .doc, .txt, .html, .htm, .png, .jpg, .jpeg</strong> (up to 25 MB per file)
                  </p>
                  
                  <div className="mt-4">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors">
                      <FileUp className="h-4 w-4" /> Browse & Select Files
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.doc,.txt,.html,.htm,.png,.jpg,.jpeg,text/html"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileSelection(e.target.files);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Staged Files Review Table */}
                {stagedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                        Files Selected for Intake ({stagedFiles.length})
                      </span>
                      <label className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer">
                        <PlusCircle className="h-3.5 w-3.5" /> Add More
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.doc,.txt,.html,.htm,.png,.jpg,.jpeg,text/html"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleFileSelection(e.target.files);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {stagedFiles.map((sf) => (
                        <div 
                          key={sf.id}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-400 block">
                                Inferred / Custom Title
                              </label>
                              <input
                                type="text"
                                value={sf.title}
                                onChange={(e) => handleUpdateStagedFile(sf.id, { title: e.target.value })}
                                className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveStagedFile(sf.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg mt-5 transition-colors cursor-pointer"
                              title="Remove file from batch"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                                Source Type
                              </label>
                              <select
                                value={sf.sourceType}
                                onChange={(e: any) => handleUpdateStagedFile(sf.id, { sourceType: e.target.value })}
                                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                              >
                                <option value="MODULE_MATERIAL">Module Material</option>
                                <option value="COURSE_READING">Course Reading</option>
                                <option value="ASSIGNMENT_INSTRUCTIONS">Assignment Instructions</option>
                                <option value="REGULATORY_SOURCE">Regulatory Source</option>
                                <option value="RESEARCH">Research Paper</option>
                                <option value="MEMBER_NOTES">Member Notes</option>
                                <option value="HUSNI_DIRECTION">Husni Direction</option>
                                <option value="PREVIOUS_STUDY_PACKAGE">Previous Study Package</option>
                                <option value="OTHER">Other</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                                Provenance Kind
                              </label>
                              <select
                                value={sf.provenanceKind}
                                onChange={(e: any) => handleUpdateStagedFile(sf.id, { provenanceKind: e.target.value })}
                                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                              >
                                <option value="ACADEMIC_REGULATORY_SOURCE">Academic / Regulatory Source</option>
                                <option value="MEMBER_GENERATED_STUDY_PACKAGE">Member-Generated Study Package</option>
                                <option value="MEMBER_PROVIDED">Member Provided</option>
                                <option value="SUPERVISOR_DIRECTION">Supervisor Direction</option>
                                <option value="EXTERNAL_RESEARCH">External Research</option>
                                <option value="AI_INTERPRETATION">AI Interpretation</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                            <span className="font-mono">{sf.originalFilename} • {sf.fileSizeFormatted}</span>
                            <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                              sf.status === 'READY_FOR_ANALYSIS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sf.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : sf.status === 'UPLOADING' || sf.status === 'EXTRACTING'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {sf.status?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Batch Upload Action */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setStagedFiles([])}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Clear Selection
                      </button>
                      <button
                        type="button"
                        onClick={handleAttachBatchSources}
                        disabled={isProcessing || stagedFiles.length === 0}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Attach All Sources ({stagedFiles.length})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: PASTE TEXT */}
            {intakeMode === 'PASTE_TEXT' && (
              <form onSubmit={handleAddSingleSource} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Source Title *</label>
                  <input
                    type="text"
                    required
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    placeholder="e.g. 21 CFR 1.500(a) Statutory Authority Overview"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Source Type</label>
                    <select
                      value={sourceType}
                      onChange={(e: any) => setSourceType(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="MODULE_MATERIAL">Module Material</option>
                      <option value="COURSE_READING">Course Reading</option>
                      <option value="ASSIGNMENT_INSTRUCTIONS">Assignment Instructions</option>
                      <option value="REGULATORY_SOURCE">Regulatory Source</option>
                      <option value="RESEARCH">Research</option>
                      <option value="MEMBER_NOTES">Member Notes</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Provenance Kind</label>
                    <select
                      value={provenanceKind}
                      onChange={(e: any) => setProvenanceKind(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="ACADEMIC_REGULATORY_SOURCE">Academic / Regulatory Source</option>
                      <option value="MEMBER_PROVIDED">Member Provided</option>
                      <option value="MEMBER_GENERATED_STUDY_PACKAGE">Member-Generated Study Package</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Citation / Reference</label>
                  <input
                    type="text"
                    value={sourceUrlOrFile}
                    onChange={(e) => setSourceUrlOrFile(e.target.value)}
                    placeholder="e.g. 21 CFR § 1.500 / MSU Reading Packet"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Pasted Content / Excerpt *</label>
                  <textarea
                    rows={4}
                    required
                    value={sourceSnippet}
                    onChange={(e) => setSourceSnippet(e.target.value)}
                    placeholder="Paste relevant excerpts, statute clauses, or syllabus instructions..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddSourceModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    {isProcessing ? 'Attaching...' : 'Attach Pasted Source'}
                  </button>
                </div>
              </form>
            )}

            {/* MODE 3: ADD LINK / REFERENCE */}
            {intakeMode === 'ADD_LINK' && (
              <form onSubmit={handleAddSingleSource} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Source Title *</label>
                  <input
                    type="text"
                    required
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    placeholder="e.g. eCFR 21 CFR Part 1 Subpart L Official Portal"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Reference URL or DOI *</label>
                  <input
                    type="text"
                    required
                    value={sourceUrlOrFile}
                    onChange={(e) => setSourceUrlOrFile(e.target.value)}
                    placeholder="https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-1/subpart-L"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Summary / Excerpt</label>
                  <textarea
                    rows={3}
                    value={sourceSnippet}
                    onChange={(e) => setSourceSnippet(e.target.value)}
                    placeholder="Brief description or key statute excerpts..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddSourceModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    {isProcessing ? 'Attaching...' : 'Attach Reference Link'}
                  </button>
                </div>
              </form>
            )}

            {/* MODE 4: ADD NOTES */}
            {intakeMode === 'ADD_NOTES' && (
              <form onSubmit={handleAddSingleSource} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Note Title *</label>
                  <input
                    type="text"
                    required
                    value={sourceTitle}
                    onChange={(e) => {
                      setSourceTitle(e.target.value);
                      setSourceType('MEMBER_NOTES');
                      setProvenanceKind('MEMBER_PROVIDED');
                    }}
                    placeholder="e.g. Samar's Preliminary Notes on FSVP Importer of Record Determination"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Notes Content *</label>
                  <textarea
                    rows={4}
                    required
                    value={sourceSnippet}
                    onChange={(e) => setSourceSnippet(e.target.value)}
                    placeholder="Document your observations, statutory inquiries, or study considerations..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddSourceModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    {isProcessing ? 'Saving...' : 'Save Member Note'}
                  </button>
                </div>
              </form>
            )}

            {/* MODE 5: ADD PREVIOUS STUDY PACKAGE */}
            {intakeMode === 'ADD_PREVIOUS_PACKAGE' && (
              <form onSubmit={handleAddSingleSource} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Study Package Reference *</label>
                  <input
                    type="text"
                    required
                    value={sourceTitle}
                    onChange={(e) => {
                      setSourceTitle(e.target.value);
                      setSourceType('PREVIOUS_STUDY_PACKAGE');
                      setProvenanceKind('MEMBER_GENERATED_STUDY_PACKAGE');
                    }}
                    placeholder="e.g. MSU-FSVP-Onboarding-Foundations-Synthesis-Package"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Package Summary / Key Findings</label>
                  <textarea
                    rows={3}
                    value={sourceSnippet}
                    onChange={(e) => setSourceSnippet(e.target.value)}
                    placeholder="Summary of foundational learning outputs, previously verified requirements, or trace..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddSourceModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    {isProcessing ? 'Attaching...' : 'Attach Study Package'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SOURCE DETAILS VIEWER */}
      {viewingSource && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400">{viewingSource.sourceId}</span>
                <h3 className="text-base font-black text-slate-900">{viewingSource.title}</h3>
              </div>
              <button 
                onClick={() => setViewingSource(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Source Type</span>
                <span className="font-bold text-slate-800">{viewingSource.sourceType?.replace(/_/g, ' ')}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Provenance</span>
                <span className="font-bold text-slate-800">{viewingSource.provenanceKind?.replace(/_/g, ' ')}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Source Scope</span>
                <span className="font-bold text-indigo-700">
                  {viewingSource.sourceScope === 'COURSE_WIDE' ? 'COURSE-WIDE SOURCE' : 'MODULE-SPECIFIC SOURCE'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">File Information</span>
                <span className="font-bold text-slate-800">{viewingSource.originalFilename || 'Direct Entry'} {viewingSource.fileSize ? `(${viewingSource.fileSize})` : ''}</span>
              </div>
            </div>

            {viewingSource.currentModuleRelevantSections && (
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-900 block">
                  Module 1 Scoped Scope
                </span>
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-950 font-medium">
                  {viewingSource.currentModuleRelevantSections}
                </div>
              </div>
            )}

            {(viewingSource.fullContent || viewingSource.contentSnippet) && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Extracted Text / Verified Content
                  </span>
                  {(viewingSource.originalFilename?.endsWith('.html') || viewingSource.originalFilename?.endsWith('.htm') || viewingSource.fileType?.includes('HTML')) && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Sanitized HTML Study Content
                    </span>
                  )}
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                  {viewingSource.fullContent || viewingSource.contentSnippet}
                </div>
              </div>
            )}

            {viewingSource.notes && (
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Notes & Ingestion Trace</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {viewingSource.notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                viewingSource.sourceScope === 'COURSE_WIDE'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : viewingSource.isInherited
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {viewingSource.sourceScope === 'COURSE_WIDE' ? 'Course-Wide Canonical Source' : (viewingSource.isInherited ? 'Inherited Syllabus Source (Protected)' : 'Module Study Material')}
              </span>
              
              <button
                onClick={() => setViewingSource(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COURSE-WIDE SOURCE TO MODULE MAPPING (PRJ-324 / MODULES 1–7) */}
      {isCourseMappingModalOpen && selectedMappingSource && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    CANONICAL COURSE-WIDE SOURCE
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">PRJ-324 Food Import Law & FSVP</span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">{selectedMappingSource.title}</h3>
              </div>
              <button 
                onClick={() => {
                  setIsCourseMappingModalOpen(false);
                  setSelectedMappingSource(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-950">
                <Layers className="h-4 w-4 text-indigo-600" />
                <span>Single Canonical Record Architecture (No Multi-Upload Required)</span>
              </div>
              <p className="text-xs text-indigo-900 leading-relaxed">
                This workbook contains material for all 7 modules of the course. It is registered once at the project level and dynamically mapped to each module's requirements analysis. Advancing to Modules 2 through 7 does not require re-uploading this source.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Module-by-Module Chapter & Exercise Mapping (Modules 1–7)
              </span>

              {/* Module 1 - ACTIVE */}
              <div className="p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      MODULE 1 (MA-324-01)
                    </span>
                    <span className="text-xs font-black text-slate-900">FSMA & FSVP Foundations</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-indigo-800 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-indigo-600" /> Active Scope (Primary)
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-1 bg-white p-3 rounded-xl border border-indigo-200">
                  <div className="font-bold text-indigo-950">Chapter 1 / Section 1: FSMA & FSVP Foundations & Statutory Scope (pp. 1–38)</div>
                  <p className="text-slate-600">
                    <strong>Included Exercises:</strong> Exercise 1.1 (Determining FSVP Applicability — Direct Importer vs. U.S. Agent), Exercise 1.2 (Qualified Individual Identification & Competency Records).
                  </p>
                  <p className="text-emerald-700 font-medium text-[11px] pt-1">
                    ✓ Scoped for immediate synthesis in Module 1 Requirements Analysis.
                  </p>
                </div>
              </div>

              {/* Module 2 - RETAINED */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5 opacity-90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      MODULE 2 (MA-324-02)
                    </span>
                    <span className="text-xs font-bold text-slate-800">Hazard Analysis & Risk Evaluation</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    Future Module 2 • Retained
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="font-medium text-slate-700">Chapter 2 / Section 2: Biological, Chemical & Physical Hazards in Imported Foods (pp. 39–78)</div>
                  <p className="text-slate-500 text-[11px]">Exercise 2.1 (Hazard Identification Matrix), Exercise 2.2 (Foreign Supplier Risk Grading).</p>
                </div>
              </div>

              {/* Module 3 - RETAINED */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5 opacity-90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      MODULE 3 (MA-324-03)
                    </span>
                    <span className="text-xs font-bold text-slate-800">Foreign Supplier Verification Activities</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    Future Module 3 • Retained
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="font-medium text-slate-700">Chapter 3 / Section 3: Verification Methods, Onsite Audits & Testing (§ 1.506) (pp. 79–124)</div>
                  <p className="text-slate-500 text-[11px]">Exercise 3.1 (Audit Protocol Selection), Exercise 3.2 (SAHCODHA Annual Onsite Audit Mandate).</p>
                </div>
              </div>

              {/* Module 4 - RETAINED */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5 opacity-90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      MODULE 4 (MA-324-04)
                    </span>
                    <span className="text-xs font-bold text-slate-800">Modified FSVP Requirements & Exemptions</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    Future Module 4 • Retained
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="font-medium text-slate-700">Chapter 4 / Section 4: Very Small Importers & Small Supplier Modified Provisions (§ 1.512) (pp. 125–168)</div>
                  <p className="text-slate-500 text-[11px]">Exercise 4.1 (Revenue Threshold Determination), Exercise 4.2 (Written Assurances & Attestations).</p>
                </div>
              </div>

              {/* Module 5 - RETAINED */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5 opacity-90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      MODULE 5 (MA-324-05)
                    </span>
                    <span className="text-xs font-bold text-slate-800">FSVP Records & Governance</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    Future Module 5 • Retained
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="font-medium text-slate-700">Chapter 5 / Section 5: Record Retention, Translation & Regulatory Disclosure (§ 1.510) (pp. 169–204)</div>
                  <p className="text-slate-500 text-[11px]">Exercise 5.1 (Two-Year Retention Schedule), Exercise 5.2 (FDA Electronic Access Protocols).</p>
                </div>
              </div>

              {/* Module 6 - RETAINED */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5 opacity-90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      MODULE 6 (MA-324-06)
                    </span>
                    <span className="text-xs font-bold text-slate-800">Import Alerts, Refusals & Enforcement</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    Future Module 6 • Retained
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="font-medium text-slate-700">Chapter 6 / Section 6: FDA Form 483a, Warning Letters & Detention Without Physical Examination (pp. 205–248)</div>
                  <p className="text-slate-500 text-[11px]">Exercise 6.1 (483a Response Drafting), Exercise 6.2 (Import Alert 99-33 Removal Petition).</p>
                </div>
              </div>

              {/* Module 7 - RETAINED */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5 opacity-90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      MODULE 7 (MA-324-07)
                    </span>
                    <span className="text-xs font-bold text-slate-800">Comprehensive Consulting Capstone</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                    Future Module 7 • Retained
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="font-medium text-slate-700">Chapter 7 / Section 7: Full Program Development & Regulatory Audit Simulation (pp. 249–310)</div>
                  <p className="text-slate-500 text-[11px]">Capstone Exercise 7.1 (End-to-End FSVP Implementation & Mock FDA Defense).</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400">
                Active Module: <strong>MA-324-01 (Module 1)</strong>
              </span>
              <button
                onClick={() => {
                  setIsCourseMappingModalOpen(false);
                  setSelectedMappingSource(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW SOURCE EVIDENCE & STATUTORY AUTHORITY HIERARCHY */}
      {/* ========================================================================= */}
      {selectedEvidenceReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {selectedEvidenceReq.id}
                  </span>
                  <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedEvidenceReq.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    ORIGIN: {selectedEvidenceReq.origin}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    selectedEvidenceReq.reviewStatus === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedEvidenceReq.reviewStatus === 'FLAGGED_UNSUPPORTED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : selectedEvidenceReq.reviewStatus === 'CORRECTION_REQUESTED'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : selectedEvidenceReq.reviewStatus === 'CLARIFICATION_REQUESTED'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedEvidenceReq.reviewStatus ? selectedEvidenceReq.reviewStatus?.replace(/_/g, ' ') : 'PENDING REVIEW'}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedEvidenceReq.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvidenceReq(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Requirement Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-700 uppercase text-[10px]">Requirement Specification</div>
              <p className="text-slate-700 leading-relaxed">{selectedEvidenceReq.description}</p>
              {selectedEvidenceReq.statutoryCitations && selectedEvidenceReq.statutoryCitations.length > 0 && (
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-emerald-800 text-[11px]">Statutory Citations:</span>
                  {selectedEvidenceReq.statutoryCitations.map((c, i) => (
                    <span key={i} className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Authority Hierarchy Guide Banner */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
              <div className="font-black flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-indigo-700" /> Source Authority Hierarchy (Rank 1 to 5)
              </div>
              <p className="text-indigo-800/80 leading-relaxed text-[10px]">
                <strong>Rank 1:</strong> Academic/Regulatory Original Source • <strong>Rank 2:</strong> Course-wide Academic Source (Module 1 Scoped) • <strong>Rank 3:</strong> Module-Specific Source • <strong>Rank 4:</strong> Previous Study Package (Context Only) • <strong>Rank 5:</strong> AI Interpretation
              </p>
            </div>

            {/* Evidence List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-indigo-600" />
                Supporting Source Evidence & Citations ({selectedEvidenceReq.evidenceList?.length || 0})
              </h4>

              {selectedEvidenceReq.origin === 'SOURCE_DERIVED' && (!selectedEvidenceReq.evidenceList || selectedEvidenceReq.evidenceList.length === 0) ? (
                <div className="p-5 bg-rose-50 border-2 border-dashed border-rose-200 rounded-2xl text-center space-y-2">
                  <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                  <div className="text-sm font-black text-rose-900">SOURCE TRACEABILITY MISSING</div>
                  <p className="text-xs text-rose-700 max-w-md mx-auto">
                    This requirement is labeled SOURCE_DERIVED but no supporting source evidence exists in the attached repository. It cannot be treated as verified source-derived content until corroborated or corrected.
                  </p>
                  <button
                    onClick={() => {
                      const req = selectedEvidenceReq;
                      setSelectedEvidenceReq(null);
                      openReviewActionModal(req, 'FLAGGED_UNSUPPORTED');
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5 mt-2"
                  >
                    <Flag className="h-3.5 w-3.5" /> Flag as Unsupported
                  </button>
                </div>
              ) : selectedEvidenceReq.evidenceList && selectedEvidenceReq.evidenceList.length > 0 ? (
                <div className="space-y-4">
                  {selectedEvidenceReq.evidenceList.map((ev, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                      {/* Evidence Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                            ev.authorityRank === 1
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : ev.authorityRank === 2
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                : ev.authorityRank === 3
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : ev.authorityRank === 4
                                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                                    : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            <Scale className="h-3 w-3" />
                            {ev.authorityRank === 1 && 'Rank 1 • Academic / Regulatory Original Source'}
                            {ev.authorityRank === 2 && 'Rank 2 • Course-wide Academic Source (Module 1 Scoped)'}
                            {ev.authorityRank === 3 && 'Rank 3 • Module-Specific Source'}
                            {ev.authorityRank === 4 && 'Rank 4 • Previous Study Package (Context Only)'}
                            {ev.authorityRank === 5 && 'Rank 5 • AI Interpretation'}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {ev.sourceId}
                          </span>
                        </div>

                        {ev.pageOrRange && (
                          <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            Pages: {ev.pageOrRange}
                          </span>
                        )}
                      </div>

                      {/* Source Title & Provenance */}
                      <div>
                        <div className="text-xs font-black text-slate-900">{ev.sourceTitle}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          {ev.chapterOrSection && <span>Chapter/Section: <strong>{ev.chapterOrSection}</strong></span>}
                          {ev.provenance && <span>• Provenance: <strong>{ev.provenance}</strong></span>}
                        </div>
                      </div>

                      {/* Verbatim Supporting Extract */}
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs space-y-1">
                        <div className="text-[10px] font-black uppercase text-amber-900 flex items-center gap-1">
                          <Quote className="h-3 w-3 text-amber-700" /> Verbatim Source Evidence Extract
                        </div>
                        <p className="text-slate-800 leading-relaxed font-serif italic text-xs">
                          "{ev.extract}"
                        </p>
                      </div>

                      {/* Citation Reference */}
                      {ev.citation && (
                        <div className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <strong>Citation:</strong> {ev.citation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 italic text-center">
                  Direct requirement established by instructor prompt or framework standard.
                </div>
              )}
            </div>

            {/* Quick Actions Footer inside Evidence Modal */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Reviewer: <strong>Samar Baydoun (Capability Developer)</strong>
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const req = selectedEvidenceReq;
                    setSelectedEvidenceReq(null);
                    handleExecuteItemReview(req.id, 'CONFIRMED');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" /> Confirm Requirement
                </button>

                <button
                  onClick={() => {
                    const req = selectedEvidenceReq;
                    setSelectedEvidenceReq(null);
                    openReviewActionModal(req, 'FLAGGED_UNSUPPORTED');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Flag className="h-3.5 w-3.5" /> Flag Unsupported
                </button>

                <button
                  onClick={() => {
                    const req = selectedEvidenceReq;
                    setSelectedEvidenceReq(null);
                    openReviewActionModal(req, 'CORRECTION_REQUESTED');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Correct AI
                </button>

                <button
                  onClick={() => setSelectedEvidenceReq(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MEMBER REVIEW ACTION & AI CORRECTION FORM */}
      {/* ========================================================================= */}
      {selectedActionModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {selectedActionModalReq.id} • {selectedActionModalReq.category}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Member Review Action Station
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record Samar's verification decision, correct AI inferences, or flag out-of-scope items.
                </p>
              </div>
              <button
                onClick={() => setSelectedActionModalReq(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Requirement Summary Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-black text-slate-900">{selectedActionModalReq.title}</div>
              <p className="text-slate-600 leading-relaxed text-[11px]">{selectedActionModalReq.description}</p>
            </div>

            {/* Action Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 block">
                Review Decision / Action Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {selectedActionModalReq.origin === 'AI_RECOMMENDATION' ? (
                  <button
                    type="button"
                    onClick={() => setActionFormStatus('MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      actionFormStatus === 'MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION' || actionFormStatus === 'CONFIRMED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`h-4 w-4 ${actionFormStatus === 'MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION' || actionFormStatus === 'CONFIRMED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Accept Recommendation</span>
                  </button>
                ) : selectedActionModalReq.origin === 'HUSNI_DIRECTION' ? (
                  <button
                    type="button"
                    onClick={() => setActionFormStatus('DIRECTION_ACKNOWLEDGED')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      actionFormStatus === 'DIRECTION_ACKNOWLEDGED' || actionFormStatus === 'CONFIRMED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`h-4 w-4 ${actionFormStatus === 'DIRECTION_ACKNOWLEDGED' || actionFormStatus === 'CONFIRMED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Acknowledge Direction</span>
                  </button>
                ) : selectedActionModalReq.origin === 'CROSS_MODULE_REFERENCE' || selectedActionModalReq.origin === 'AI_INTERPRETATION' ? (
                  <button
                    type="button"
                    onClick={() => setActionFormStatus('MODULE_BOUNDARY_ACKNOWLEDGED')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      actionFormStatus === 'MODULE_BOUNDARY_ACKNOWLEDGED' || actionFormStatus === 'CONFIRMED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`h-4 w-4 ${actionFormStatus === 'MODULE_BOUNDARY_ACKNOWLEDGED' || actionFormStatus === 'CONFIRMED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Acknowledge Boundary</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActionFormStatus('CONFIRMED')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      actionFormStatus === 'CONFIRMED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`h-4 w-4 ${actionFormStatus === 'CONFIRMED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Confirm Requirement</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActionFormStatus('FLAGGED_UNSUPPORTED')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    actionFormStatus === 'FLAGGED_UNSUPPORTED'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Flag className={`h-4 w-4 ${actionFormStatus === 'FLAGGED_UNSUPPORTED' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span>Flag Unsupported</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionFormStatus('CORRECTION_REQUESTED')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    actionFormStatus === 'CORRECTION_REQUESTED'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Edit3 className={`h-4 w-4 ${actionFormStatus === 'CORRECTION_REQUESTED' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Correct AI Inference</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionFormStatus('CLARIFICATION_REQUESTED')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    actionFormStatus === 'CLARIFICATION_REQUESTED'
                      ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <HelpCircle className={`h-4 w-4 ${actionFormStatus === 'CLARIFICATION_REQUESTED' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>Ask Clarification</span>
                </button>
              </div>
            </div>

            {/* Dynamic Input Fields based on Status */}
            {actionFormStatus === 'CORRECTION_REQUESTED' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-900 block">
                  Samar's Corrected Requirement (Preserves Original AI Record Separately) *
                </label>
                <textarea
                  rows={3}
                  value={actionFormCorrection}
                  onChange={(e) => setActionFormCorrection(e.target.value)}
                  placeholder="Enter the precise regulatory wording, adjusted scope, or corrected statutory standard..."
                  className="w-full text-xs p-3 bg-indigo-50/40 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            )}

            {actionFormStatus === 'FLAGGED_UNSUPPORTED' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-rose-900 block">
                  Reason for Flagging as Unsupported / Out-of-Scope *
                </label>
                <textarea
                  rows={3}
                  value={actionFormFlagReason}
                  onChange={(e) => setActionFormFlagReason(e.target.value)}
                  placeholder="e.g., Not covered in Module 1 scope; unsupported by 21 CFR § 1.500; requires verification in Module 3..."
                  className="w-full text-xs p-3 bg-rose-50/40 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            )}

            {actionFormStatus === 'CLARIFICATION_REQUESTED' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-sky-900 block">
                  Clarification Question / Nuance Query *
                </label>
                <textarea
                  rows={3}
                  value={actionFormClarificationQuestion}
                  onChange={(e) => setActionFormClarificationQuestion(e.target.value)}
                  placeholder="Ask for clarification regarding applicability, statutory scope, or exercise alignment..."
                  className="w-full text-xs p-3 bg-sky-50/40 border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* General Member Note / Annotation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 block">
                Additional Member Observation / Regulatory Annotation (Optional)
              </label>
              <textarea
                rows={2}
                value={actionFormComment}
                onChange={(e) => setActionFormComment(e.target.value)}
                placeholder="Add contextual observations, cross-references, or study guidance..."
                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedActionModalReq(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleExecuteItemReview(selectedActionModalReq.id, actionFormStatus, {
                    comment: actionFormComment,
                    correction: actionFormCorrection,
                    flagReason: actionFormFlagReason,
                    clarificationQuestion: actionFormClarificationQuestion
                  });
                }}
                disabled={isProcessing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Save Review Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. REMOVE FROM MODULE WORKSPACE / DELETE SOURCE ACTION MODAL */}
      {sourceActionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  sourceActionTarget.actionType === 'REMOVE_FROM_MODULE' 
                    ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}>
                  {sourceActionTarget.actionType === 'REMOVE_FROM_MODULE' ? (
                    <FolderMinus className="h-6 w-6" />
                  ) : (
                    <AlertTriangle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {sourceActionTarget.actionType === 'REMOVE_FROM_MODULE'
                      ? 'Remove Source from Module Workspace'
                      : 'Delete Member Source Material'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {sourceActionTarget.actionType === 'REMOVE_FROM_MODULE'
                      ? `Module-scoped exclusion for ${currentModuleId} (${currentProjectId})`
                      : `Permanent deletion from course repository`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSourceActionTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Source Card Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                  {sourceActionTarget.source.sourceId}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-white text-slate-700 border-slate-300">
                  {sourceActionTarget.source.creationMethod ? sourceActionTarget.source.creationMethod?.replace(/_/g, ' ') : 'SYSTEM SEEDED'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {sourceActionTarget.source.sourceType?.replace(/_/g, ' ')}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {sourceActionTarget.source.title}
              </h4>
              {sourceActionTarget.source.originalFilename && (
                <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <File className="h-3 w-3 text-slate-400" /> {sourceActionTarget.source.originalFilename}
                </p>
              )}
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                {getProvenanceAttribution(sourceActionTarget.source)}
              </div>
            </div>

            {/* Context & Semantics Notice */}
            {sourceActionTarget.actionType === 'REMOVE_FROM_MODULE' ? (
              <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl space-y-1.5 text-xs text-amber-950">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Info className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>Preserves Canonical Record & Audit Trail</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-900/90">
                  This action removes this material from the <strong>{currentModuleId} active workspace</strong> and excludes it from AI requirements grounding. The canonical baseline record in the repository remains untouched and available for other modules.
                </p>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl space-y-1.5 text-xs text-rose-950">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Permanent File Deletion</span>
                </div>
                <p className="leading-relaxed text-[11px] text-rose-800">
                  Are you sure you want to permanently delete this member-uploaded file from the repository? This cannot be undone. Alternatively, you can choose to remove it from this module workspace only.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSourceActionTarget(null)}
                disabled={isRemovingSource}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              {sourceActionTarget.actionType === 'DELETE_PERMANENT' && (
                <button
                  type="button"
                  onClick={() => setSourceActionTarget(prev => prev ? { ...prev, actionType: 'REMOVE_FROM_MODULE' } : null)}
                  disabled={isRemovingSource}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Remove from Module Only
                </button>
              )}

              <button
                type="button"
                onClick={handleExecuteSourceAction}
                disabled={isRemovingSource}
                className={`px-4 py-2 font-bold text-xs rounded-xl text-white shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  sourceActionTarget.actionType === 'REMOVE_FROM_MODULE'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isRemovingSource ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : sourceActionTarget.actionType === 'REMOVE_FROM_MODULE' ? (
                  <>
                    <FolderMinus className="h-3.5 w-3.5" />
                    <span>Remove from Module Workspace</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
