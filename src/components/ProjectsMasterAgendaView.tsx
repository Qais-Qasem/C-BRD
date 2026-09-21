import React, { useState } from 'react';
import { 
  Project, 
  ProjectOrigin,
  OriginContext,
  MasterAgendaItem, 
  TaskItem, 
  UserRole, 
  MasterAgendaCategory, 
  MasterAgendaItemState, 
  PriorityLevel,
  ProjectInput,
  ProjectInputType,
  SourceAttachmentMode,
  SourceAnalysisResult,
  PlanningAssumption,
  AgendaUpdateProposal,
  SupervisorDirectionRecord,
  AgendaHistoryRecord,
  ProposalStatus,
  ProjectOverviewAnalysis
} from '../types';
import { 
  FolderKanban, 
  GitMerge, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Play, 
  Eye, 
  ArrowRight, 
  Layers, 
  UserCheck, 
  Calendar, 
  BookOpen, 
  FileText, 
  ShieldAlert, 
  ChevronRight,
  ChevronDown,
  Filter,
  RefreshCw,
  Sliders,
  X,
  PlusCircle,
  MessageSquare,
  HelpCircle,
  History,
  Check,
  Send,
  FileCode,
  Link,
  Info,
  Zap,
  Tag,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  Lightbulb,
  Upload,
  Paperclip,
  FileUp,
  FilePlus,
  AlignLeft,
  ExternalLink,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Search,
  CheckCheck,
  FileCheck,
  AlertTriangle,
  Loader2,
  Brain
} from 'lucide-react';

interface ProjectsMasterAgendaViewProps {
  projects: Project[];
  masterAgendaItems: MasterAgendaItem[];
  tasks: TaskItem[];
  currentUser: UserRole;
  projectInputs: ProjectInput[];
  planningAssumptions: PlanningAssumption[];
  agendaUpdateProposals: AgendaUpdateProposal[];
  supervisorDirections: SupervisorDirectionRecord[];
  agendaHistory: AgendaHistoryRecord[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onAddMasterAgendaItem: (item: MasterAgendaItem) => void;
  onUpdateMasterAgendaItem: (item: MasterAgendaItem) => void;
  onRemoveMasterAgendaItem: (id: string) => void;
  onRunCb9119Engine: (projectId?: string) => void;
  onOpenAskAI: () => void;
  onAddProjectInput: (input: ProjectInput) => void;
  onAddPlanningAssumption: (assumption: PlanningAssumption) => void;
  onAddAgendaUpdateProposal: (proposal: AgendaUpdateProposal) => void;
  onReviewAgendaUpdateProposal: (
    proposalId: string, 
    decision: ProposalStatus, 
    comment?: string, 
    modifiedItem?: Partial<MasterAgendaItem>,
    selectedItemIndices?: number[]
  ) => void;
  onAddSupervisorDirection: (direction: SupervisorDirectionRecord) => void;
}

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper: Validate file for real AI analysis
function validateUploadedFile(file: File): { isValid: boolean; errorMsg?: string } {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  const isDocx = type.includes('wordprocessingml') || type.includes('msword') || name.endsWith('.docx') || name.endsWith('.doc');
  const isPdf = type === 'application/pdf' || name.endsWith('.pdf');
  const isTxt = type === 'text/plain' || name.endsWith('.txt');
  const isPng = type === 'image/png' || name.endsWith('.png');
  const isJpg = type === 'image/jpeg' || type === 'image/jpg' || name.endsWith('.jpg') || name.endsWith('.jpeg');

  if (!isDocx && !isPdf && !isTxt && !isPng && !isJpg) {
    return {
      isValid: false,
      errorMsg: "File type not supported. Please upload a Word Document (.docx), PDF, TXT, PNG, or JPG/JPEG."
    };
  }

  if (file.size > 50 * 1024 * 1024) {
    return {
      isValid: false,
      errorMsg: "File size exceeds maximum allowed 50MB."
    };
  }

  return { isValid: true };
}

// Helper: AI Input Analysis Generator
function generateAiAnalysisForInput(
  title: string,
  type: ProjectInputType,
  content: string,
  mode?: SourceAttachmentMode
): SourceAnalysisResult {
  const isHigh = type === 'SYLLABUS' || type === 'REGULATORY SOURCE' || type === 'HUSNI DIRECTION' || type === 'HUSNI COMMENT / DIRECTION';
  const relevance: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = isHigh ? 'HIGH' : 'MEDIUM';

  return {
    summary: `C-Bridge AI analyzed source "${title}" (${type}). Extracted operational requirements and compliance boundaries to align active master agenda.`,
    relevance,
    potentialImpacts: [
      {
        category: 'PROJECT SCOPE',
        applicable: true,
        explanation: `Defines precise technical and compliance boundary criteria for ${title}.`
      },
      {
        category: 'MASTER AGENDA',
        applicable: true,
        explanation: `Suggests progressive sequencing alignment in Wave 2 & Wave 3 workstreams.`
      },
      {
        category: 'PRIORITIES',
        applicable: isHigh,
        explanation: isHigh ? 'High urgency requirement; requires supervisor or member attention.' : 'Standard execution priority.'
      },
      {
        category: 'DEPENDENCIES',
        applicable: type === 'HUSNI DIRECTION' || type === 'SYLLABUS' || type === 'HUSNI COMMENT / DIRECTION',
        explanation: 'Establishes prerequisite ordering between learning and deliverable creation.'
      },
      {
        category: 'DAILY PLAN',
        applicable: true,
        explanation: 'Provides concrete task candidates for Daily Agenda Engine dispatch.'
      },
      {
        category: 'LEARNING',
        applicable: type === 'SYLLABUS' || type === 'TRAINING MATERIAL' || type === 'MEMBER REPORT' || type === 'MSU MATERIAL',
        explanation: 'Directly informs member learning modules and evaluation topics.'
      },
      {
        category: 'ASSET DEVELOPMENT',
        applicable: type === 'REGULATORY SOURCE' || type === 'SYLLABUS' || type === 'EXISTING DOCUMENT' || type === 'EXTERNAL TECHNICAL INPUT',
        explanation: 'Requires drafting or updating C-Bridge SOPs, forms, or checklists.'
      },
      {
        category: 'FOLLOW-UP',
        applicable: type === 'MEETING OUTCOME' || type === 'CONSULTATION OUTCOME' || type === 'LEARNING HANDOFF',
        explanation: 'Identifies action items requiring follow-up verification.'
      },
      {
        category: 'QA',
        applicable: true,
        explanation: 'Requires verification against compliance standards before supervisor review.'
      },
      {
        category: 'SUPERVISOR DECISION',
        applicable: isHigh,
        explanation: isHigh ? 'Requires Husni Hasan confirmation before agenda activation.' : 'Informational input.'
      }
    ],
    newInformationDetected: [
      `Specific regulatory/technical guidelines for ${title}`,
      `Operational requirements extracted from ${mode || 'attached content'}`
    ],
    possibleNewTasks: [
      `Incorporate ${title} into active workstream deliverables`,
      `Verify compliance alignment for ${type.toLowerCase()}`
    ],
    possibleDependencyChanges: [
      `Sequence prerequisite review before deliverable publication.`
    ],
    possibleRisks: [
      `Risk of non-compliance if ${title} standards are omitted from SOPs.`
    ],
    possibleCBridgeAssets: [
      `Asset Checklist / SOP based on ${title}`
    ],
    questionsOrUncertainties: [
      `Does Husni Hasan require additional verification before proposal generation?`
    ],
    planningAssumptions: [
      `Assumes standard C-Bridge workflow applies unless overridden by supervisor.`
    ]
  };
}

// Helper: Agenda Proposal Generator from Input Analysis & Direction
function createProposalFromInputAndDirection(
  input: ProjectInput,
  husniDirectionText: string,
  projectId: string,
  projectName: string
): AgendaUpdateProposal {
  const customNote = husniDirectionText.trim() ? ` (Supervisor Instruction: "${husniDirectionText}")` : '';
  const isSyllabus = input.type === 'SYLLABUS' || 
                     input.type === 'MSU MATERIAL' || 
                     input.type === 'COURSE OVERVIEW' || 
                     input.type === 'COURSE MATERIAL' || 
                     input.type === 'TRAINING MATERIAL' ||
                     (input.fileName || '').toLowerCase().includes('syllabus') ||
                     (input.title || '').toLowerCase().includes('syllabus');

  const propSetId = `PROP-SET-${Date.now().toString().slice(-4)}`;

  if (isSyllabus) {
    // FORENSIC 2D: Syllabus agenda generation is deferred to Phase 1B.
    // Displaying pending status instead of hardcoded 7-Module Master Agenda.
    return {
      id: propSetId,
      proposalSetId: propSetId,
      proposalSetTitle: `Master Agenda Proposal: ${input.title}`,
      projectId,
      reasonForChange: `Cannot generate deterministic Master Agenda. Phase 1B agenda generation is pending canonical extraction.\n${customNote}`,
      sourceOfChange: `Syllabus — ${input.title}`,
      sourceInputId: input.id,
      idempotencyKey: `${projectId}_${input.id}`,
      proposedChangeType: 'ADDITION',
      scheduleImpact: 'PENDING',
      memberImpact: 'PENDING',
      scopeImpact: 'PENDING',
      proposedItems: [
        {
          projectId,
          projectName,
          category: 'LEARNING TASK',
          workstream: 'Source Material Integration',
          taskTitle: `Source Integration: ${input.title}`,
          objective: `Pending Phase 1B Agenda Generation for "${input.title}".`,
          expectedDeliverable: `Master Agenda Extraction`,
          assignedMember: 'Samar Baydoun',
          priority: 'P3 — TIME-SENSITIVE',
          targetDate: '2026-08-20',
          planningWave: 'WAVE 2 — Capability Dev',
          evidenceRequirement: 'Agenda Generation',
          qaRequirement: 'Pending',
          supervisorReviewRequirement: 'Husni Hasan Signoff',
          isProvisional: true,
          confirmedByHusni: false,
          sourceMaterialRef: input.title
        }
      ],
      outsideScopeTopics: [],
      dependencyImpact: "Agenda generation deferred.",
      priorityImpact: "Pending.",
      aiRecommendation: "RECOMMENDATION PENDING: Syllabus canonical extraction and agenda generation pipeline is pending Phase 1B.",
      status: 'PROPOSED',
      auditStatus: 'ACTIVE',
      createdAt: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT'
    };
  }

  // Non-syllabus fallback
  const singlePropItem = {
    projectId,
    projectName,
    category: (input.type === 'HUSNI DIRECTION' || input.type === 'HUSNI COMMENT / DIRECTION') ? ('SUPERVISOR ACTION' as MasterAgendaCategory) : ('LEARNING TASK' as MasterAgendaCategory),
    workstream: 'Source Material Integration',
    taskTitle: `Source Integration: ${input.title}`,
    objective: `Execute tasks aligned with source input "${input.title}". ${husniDirectionText}`,
    expectedDeliverable: `Technical Study Notes & Verification Summary`,
    assignedMember: 'Samar Baydoun',
    priority: (input.type === 'HUSNI DIRECTION' || input.type === 'HUSNI COMMENT / DIRECTION') ? ('P1 — DECISION / APPROVAL REQUIRED' as PriorityLevel) : ('P3 — TIME-SENSITIVE' as PriorityLevel),
    targetDate: '2026-08-20',
    planningWave: 'WAVE 2 — Capability Dev',
    evidenceRequirement: 'Source Integration Report',
    qaRequirement: 'QA Compliance Review Required',
    supervisorReviewRequirement: 'Husni Hasan Signoff',
    isProvisional: true,
    confirmedByHusni: false,
    sourceMaterialRef: input.title
  };

  return {
    id: propSetId,
    proposalSetId: propSetId,
    proposalSetTitle: `Master Agenda Proposal: ${input.title}`,
    projectId,
    reasonForChange: `AI Input Analysis for "${input.title}" (${input.type})${customNote}`,
    sourceOfChange: `${input.type} — ${input.title}`,
    sourceInputId: input.id,
    idempotencyKey: `${projectId}_${input.id}`,
    proposedChangeType: 'ADDITION',
    proposedItems: [singlePropItem],
    proposedItem: singlePropItem,
    dependencyImpact: 'Sequential wave alignment; requires prerequisite learning completion.',
    priorityImpact: (input.type === 'HUSNI DIRECTION' || input.type === 'HUSNI COMMENT / DIRECTION') ? 'P1 Urgent Supervisor Priority' : 'P3 Time-Sensitive Execution',
    scheduleImpact: 'Integrates into Wave 2 schedule target.',
    memberImpact: 'Assigned to Samar Baydoun.',
    scopeImpact: 'In-scope capability enhancement.',
    aiRecommendation: `RECOMMEND APPROVAL: Aligns active agenda with newly analyzed ${input.type.toLowerCase()} source.`,
    status: 'PROPOSED',
    auditStatus: 'ACTIVE',
    createdAt: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT'
  };
}

export const ProjectsMasterAgendaView: React.FC<ProjectsMasterAgendaViewProps> = ({
  projects,
  masterAgendaItems,
  tasks,
  currentUser,
  projectInputs,
  planningAssumptions,
  agendaUpdateProposals,
  supervisorDirections,
  agendaHistory,
  onAddProject,
  onUpdateProject,
  onAddMasterAgendaItem,
  onUpdateMasterAgendaItem,
  onRemoveMasterAgendaItem,
  onRunCb9119Engine,
  onOpenAskAI,
  onAddProjectInput,
  onAddPlanningAssumption,
  onAddAgendaUpdateProposal,
  onReviewAgendaUpdateProposal,
  onAddSupervisorDirection,
}) => {
  const isHusni = currentUser === 'HUSNI';
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'PRJ-FSVP-01');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PROPOSALS' | 'INPUTS' | 'COMMENTS' | 'ASSUMPTIONS' | 'HISTORY'>('ACTIVE');
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [waveFilter, setWaveFilter] = useState<string>('ALL');

  // Modals / Panels
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isProgressiveBuilderOpen, setIsProgressiveBuilderOpen] = useState(false);
  const [isAddInputModalOpen, setIsAddInputModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [reviewingProposal, setReviewingProposal] = useState<AgendaUpdateProposal | null>(null);
  const [editingItem, setEditingItem] = useState<MasterAgendaItem | null>(null);
  const [traceabilityItem, setTraceabilityItem] = useState<MasterAgendaItem | null>(null);

  // Progressive Wave AI Wizard State
  const [builderStep, setBuilderStep] = useState<'OPTIONAL_INPUT' | 'GENERATING' | 'REVIEW_WAVES'>('OPTIONAL_INPUT');
  const [generatedWaves, setGeneratedWaves] = useState<{ waveName: string; items: Partial<MasterAgendaItem>[] }[]>([]);
  const [builderAssumptions, setBuilderAssumptions] = useState<string[]>([]);

  // Add Input Modal Form State
  const [attachmentMode, setAttachmentMode] = useState<SourceAttachmentMode>('UPLOAD FILE');
  const [inputType, setInputType] = useState<ProjectInputType>('SYLLABUS');
  const [inputTitle, setInputTitle] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [inputRef, setInputRef] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');

  // Add Input Modal Real File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const processFileSelection = (file: File) => {
    const val = validateUploadedFile(file);
    setSelectedFile(file);
    setUploadFileName(file.name);
    setUploadFileSize(formatFileSize(file.size));
    if (!val.isValid) {
      setFileValidationError(val.errorMsg || 'Invalid file type');
    } else {
      setFileValidationError(null);
      if (!inputTitle.trim()) {
        const cleanName = file.name?.replace(/\.[^/.]+$/, "")?.replace(/[-_]/g, " ");
        setInputTitle(cleanName);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileSelection(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileValidationError(null);
    setUploadFileName('');
    setUploadFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileSelection(e.dataTransfer.files[0]);
    }
  };

  // Source Register Multi-Select & Co-Analysis
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isCoAnalysisModalOpen, setIsCoAnalysisModalOpen] = useState(false);
  const [jointHusniDirection, setJointHusniDirection] = useState('');

  // C-Bridge AI Source Analysis Modal State
  const [analyzingSource, setAnalyzingSource] = useState<ProjectInput | null>(null);
  const [husniDirectionOption, setHusniDirectionOption] = useState<'USE AI RECOMMENDATION' | 'ADD COMMENT / DIRECTION' | 'ASK AI A QUESTION' | 'DO NOT AFFECT AGENDA' | 'DEFER' | 'GENERATE AGENDA UPDATE PROPOSAL'>('USE AI RECOMMENDATION');
  const [husniDirectionCustomText, setHusniDirectionCustomText] = useState('');
  const [generatedProposalFromAnalysis, setGeneratedProposalFromAnalysis] = useState<AgendaUpdateProposal | null>(null);

  // Proposal Generation & Set Review State (Idempotency & Selection)
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [generatingProposalSourceId, setGeneratingProposalSourceId] = useState<string | null>(null);
  const [selectedProposalItemsMap, setSelectedProposalItemsMap] = useState<Record<string, number[]>>({});
  const [expandedProposalSetId, setExpandedProposalSetId] = useState<string | null>(null);
  const [proposalGenFeedback, setProposalGenFeedback] = useState<string | null>(null);

  // Natural Language Supervisor Chat State
  const [supervisorChatText, setSupervisorChatText] = useState('');
  const [isAiProcessingComment, setIsAiProcessingComment] = useState(false);

  // New Project Form & Origin State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPurpose, setNewProjectPurpose] = useState('');
  const [newProjectObjective, setNewProjectObjective] = useState('');
  const [newProjectScope, setNewProjectScope] = useState('');
  const [newProjectOutOfScope, setNewProjectOutOfScope] = useState('');
  const [newProjectTargetDate, setNewProjectTargetDate] = useState('2026-12-31');

  // Intake Origin State
  const [selectedOrigin, setSelectedOrigin] = useState<ProjectOrigin>('COURSE / ACADEMIC PROGRAM');
  const [potentialCapabilityDeveloper, setPotentialCapabilityDeveloper] = useState<string>('');
  const [originContext, setOriginContext] = useState<OriginContext>({
    courseName: '',
    providerInstitution: '',
    coursePurposeDescription: '',
    startDate: '',
    endDate: '',
    expectedStudyDuration: '',
    availableStudyHoursPerWeek: '',
    knownNumberOfModules: '',
    relatedCapability: 'U.S. Food Import & FSVP Development',
    notes: '',
    linksOrReferences: '',
    otherDescription: ''
  });

  // Project Intake Step Sequence
  const [newProjectStep, setNewProjectStep] = useState<'ORIGIN_INTAKE' | 'OVERVIEW_INTAKE' | 'INTAKE_SOURCES' | 'UNDERSTANDING_REVIEW' | 'CONFIRM_DEFINITION'>('ORIGIN_INTAKE');
  const [overviewMode, setOverviewMode] = useState<'UPLOAD FILE' | 'PASTE TEXT' | 'WRITE DESCRIPTION' | 'ADD DIRECTION' | 'NONE'>('UPLOAD FILE');
  const [overviewFile, setOverviewFile] = useState<File | null>(null);
  const [overviewFileData, setOverviewFileData] = useState<string>('');
  const [overviewFileName, setOverviewFileName] = useState<string>('');
  const [overviewMimeType, setOverviewMimeType] = useState<string>('');
  const [overviewFileSize, setOverviewFileSize] = useState<string>('');
  const [overviewText, setOverviewText] = useState<string>('');
  const [overviewHusniDirection, setOverviewHusniDirection] = useState<string>('');

  // Initial Intake Sources State
  const [intakeSources, setIntakeSources] = useState<ProjectInput[]>([]);
  const [intakeAttachmentMode, setIntakeAttachmentMode] = useState<SourceAttachmentMode>('UPLOAD FILE');
  const [intakeType, setIntakeType] = useState<ProjectInputType>('SYLLABUS');
  const [intakeTitle, setIntakeTitle] = useState<string>('');
  const [intakeContent, setIntakeContent] = useState<string>('');
  const [intakeNotes, setIntakeNotes] = useState<string>('');
  const [intakeFile, setIntakeFile] = useState<File | null>(null);
  const [intakeFileName, setIntakeFileName] = useState<string>('');
  const [intakeFileData, setIntakeFileData] = useState<string>('');
  const [intakeMimeType, setIntakeMimeType] = useState<string>('');
  const [intakeFileSize, setIntakeFileSize] = useState<string>('');
  const [viewingIntakeSource, setViewingIntakeSource] = useState<ProjectInput | null>(null);

  const [isAnalyzingOverview, setIsAnalyzingOverview] = useState<boolean>(false);
  const [overviewAnalysis, setOverviewAnalysis] = useState<ProjectOverviewAnalysis | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Husni Interactive Review Controls
  const [husniComment, setHusniComment] = useState<string>('');
  const [isHusniCommentOpen, setIsHusniCommentOpen] = useState<boolean>(false);
  const [husniQuestion, setHusniQuestion] = useState<string>('');
  const [aiQuestionAnswer, setAiQuestionAnswer] = useState<string | null>(null);
  const [isAskingAiQuestion, setIsAskingAiQuestion] = useState<boolean>(false);
  const [isHusniCorrecting, setIsHusniCorrecting] = useState<boolean>(false);
  const [husniCorrectionText, setHusniCorrectionText] = useState<string>('');

  // New Item Form State
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MasterAgendaCategory>('TASK');
  const [newItemWorkstream, setNewItemWorkstream] = useState('FSVP Service Protocols');
  const [newItemObjective, setNewItemObjective] = useState('');
  const [newItemDeliverable, setNewItemDeliverable] = useState('');
  const [newItemAssignee, setNewItemAssignee] = useState('Samar Baydoun');
  const [newItemPriority, setNewItemPriority] = useState<PriorityLevel>('P4 — NORMAL EXECUTION');
  const [newItemWave, setNewItemWave] = useState<string>('WAVE 1 — Foundation');
  const [newItemTargetDate, setNewItemTargetDate] = useState('2026-08-15');

  // Proposal Review Form State
  const [reviewComment, setReviewComment] = useState('');

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Filtered Items
  const projectMasterItems = masterAgendaItems.filter((m) => m.projectId === selectedProjectId);
  const activeMasterItems = projectMasterItems.filter((m) => m.confirmedByHusni !== false);
  const pendingProposals = agendaUpdateProposals.filter((p) => {
    if (p.projectId !== selectedProjectId || p.status !== 'PROPOSED') return false;
    if (p.auditStatus === 'FLAGGED_DUPLICATE_ERROR' || p.isDuplicateOrError) return false;
    if (p.proposedItem?.taskTitle?.toLowerCase().includes('incorporate material: syllabus')) return false;
    return true;
  });
  const projectInputsFiltered = projectInputs.filter((i) => i.projectId === selectedProjectId);
  const projectAssumptionsFiltered = planningAssumptions.filter((a) => a.projectId === selectedProjectId);
  const projectDirectionsFiltered = supervisorDirections.filter((d) => d.projectId === selectedProjectId);
  const projectHistoryFiltered = agendaHistory.filter((h) => h.projectId === selectedProjectId);

  const filteredMasterItems = activeMasterItems.filter((item) => {
    const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchState = stateFilter === 'ALL' || item.currentState === stateFilter;
    const matchWave = waveFilter === 'ALL' || (item.planningWave || 'WAVE 1 — Foundation') === waveFilter;
    return matchCategory && matchState && matchWave;
  });

  const completedCount = activeMasterItems.filter((i) => i.currentState === 'COMPLETED' || i.currentState === 'SUPERVISOR_APPROVED').length;
  const progressPercent = activeMasterItems.length > 0 ? Math.round((completedCount / activeMasterItems.length) * 100) : 0;

  // Handle Progressive AI Wave Builder Execution
  const handleStartProgressiveBuilder = (withInputOption: boolean) => {
    setBuilderStep('GENERATING');

    setTimeout(() => {
      const assumptions: string[] = [];
      if (!withInputOption && projectInputsFiltered.length === 0) {
        assumptions.push("Working without explicit syllabus source material — relying on FDA 21 CFR 1.500 regulatory knowledge.");
        assumptions.push("Wave 3 & Wave 4 client intake workflows use provisional templates until client data is submitted.");
      } else {
        assumptions.push("Refining progressive wave planning using available source material and Husni directions.");
      }

      const waves = [
        {
          waveName: 'WAVE 1 — Foundation / Immediate Work',
          items: [
            {
              category: 'PHASE' as MasterAgendaCategory,
              workstream: 'Scope & Setup',
              taskTitle: 'Confirm Phase 1 FSVP Service Boundary & Policy Framework',
              objective: 'Establish FDA 21 CFR 1.500 importer requirements & Phase 1 boundary.',
              expectedDeliverable: 'Governance Charter Boundary DEC-001',
              assignedMember: 'Husni Hasan',
              priority: 'P1 — DECISION / APPROVAL REQUIRED' as PriorityLevel,
              targetDate: '2026-08-10',
              planningWave: 'WAVE 1 — Foundation',
              evidenceRequirement: 'Signed Governance Decision',
              qaRequirement: 'None',
              supervisorReviewRequirement: 'Husni Hasan Signoff'
            },
            {
              category: 'TASK' as MasterAgendaCategory,
              workstream: 'FSVP Service Protocols',
              taskTitle: 'Formulate FSVP Supplier Document Review Checklist',
              objective: 'Build 12-point checklist for verifying foreign supplier compliance records.',
              expectedDeliverable: 'FSVP Review Checklist (CB-CHK-012)',
              assignedMember: 'Samar Baydoun',
              priority: 'P4 — NORMAL EXECUTION' as PriorityLevel,
              targetDate: '2026-08-12',
              planningWave: 'WAVE 1 — Foundation',
              evidenceRequirement: 'Checklist uploaded to Repository',
              qaRequirement: 'QA Review Required',
              supervisorReviewRequirement: 'Husni Hasan Review'
            }
          ]
        },
        {
          waveName: 'WAVE 2 — Capability Development',
          items: [
            {
              category: 'LEARNING TASK' as MasterAgendaCategory,
              workstream: 'Capability Training',
              taskTitle: 'Study 21 CFR 1.506 SAHC Hazard Audit Exemptions',
              objective: 'Analyze FDA rules on annual onsite audit exceptions for serious hazards.',
              expectedDeliverable: 'Live Tutoring Quiz & Handoff Summary',
              assignedMember: 'Samar Baydoun',
              priority: 'P5 — LEARNING / DEVELOPMENT' as PriorityLevel,
              targetDate: '2026-08-14',
              planningWave: 'WAVE 2 — Capability Dev',
              evidenceRequirement: 'Live Session Interactive Quiz Record',
              qaRequirement: 'None',
              supervisorReviewRequirement: 'Husni Reviewable'
            },
            {
              category: 'ASSET DEVELOPMENT TASK' as MasterAgendaCategory,
              workstream: 'FSVP Service Protocols',
              taskTitle: 'Draft Foreign Supplier Verification Protocol SOP',
              objective: 'Create standardized SOP for auditing 21 CFR 1.506 verification activities.',
              expectedDeliverable: 'SOP Document (SOP-FSVP-201)',
              assignedMember: 'Samar Baydoun',
              priority: 'P2 — BLOCKING' as PriorityLevel,
              targetDate: '2026-08-15',
              planningWave: 'WAVE 2 — Capability Dev',
              evidenceRequirement: 'PDF uploaded to Repository',
              qaRequirement: 'QA Review Required',
              supervisorReviewRequirement: 'Husni Hasan Signoff'
            }
          ]
        },
        {
          waveName: 'WAVE 3 — Application & Testing',
          items: [
            {
              category: 'TASK' as MasterAgendaCategory,
              workstream: 'Client Verification Testing',
              taskTitle: 'Verify Foreign Supplier HACCP Validation - Processed Spices',
              objective: 'Perform initial document validation for foreign supplier verification records.',
              expectedDeliverable: 'Supplier Verification Report PDF',
              assignedMember: 'Samar Baydoun',
              priority: 'P3 — TIME-SENSITIVE' as PriorityLevel,
              targetDate: '2026-08-18',
              planningWave: 'WAVE 3 — Application & Testing',
              evidenceRequirement: 'Supplier Verification Report',
              qaRequirement: 'QA Passed',
              supervisorReviewRequirement: 'Husni Hasan Approval'
            }
          ]
        },
        {
          waveName: 'WAVE 4 — Assets & Communication',
          items: [
            {
              category: 'ASSET DEVELOPMENT TASK' as MasterAgendaCategory,
              workstream: 'Client Intake Framework',
              taskTitle: 'Develop Importer FSVP Exemption & Classification Form',
              objective: 'Construct interactive intake form to evaluate foreign supplier exemption eligibility.',
              expectedDeliverable: 'Client Intake Form Asset (FORM-FSVP-102)',
              assignedMember: 'Samar Baydoun',
              priority: 'P4 — NORMAL EXECUTION' as PriorityLevel,
              targetDate: '2026-08-22',
              planningWave: 'WAVE 4 — Assets & Communication',
              evidenceRequirement: 'Form Template uploaded',
              qaRequirement: 'QA Review Required',
              supervisorReviewRequirement: 'Husni Hasan Review'
            }
          ]
        },
        {
          waveName: 'WAVE 5 — QA & Review',
          items: [
            {
              category: 'QA / REVIEW' as MasterAgendaCategory,
              workstream: 'Quality Control',
              taskTitle: 'QA Compliance Audit of FSVP Checklist & SOP Assets',
              objective: 'Perform multi-point compliance verification under CB-9120 standards.',
              expectedDeliverable: 'QA Compliance Findings Record',
              assignedMember: 'Husni Hasan',
              priority: 'P1 — DECISION / APPROVAL REQUIRED' as PriorityLevel,
              targetDate: '2026-08-25',
              planningWave: 'WAVE 5 — QA & Review',
              evidenceRequirement: 'QA Audit Log',
              qaRequirement: 'QA Passed',
              supervisorReviewRequirement: 'Husni Hasan Signoff'
            }
          ]
        }
      ];

      setGeneratedWaves(waves);
      setBuilderAssumptions(assumptions);
      setBuilderStep('REVIEW_WAVES');
    }, 900);
  };

  // Submit Generated Wave Items as Agenda Update Proposals
  const handleSubmitWavesAsProposals = () => {
    let count = 0;
    generatedWaves.forEach((wave) => {
      wave.items.forEach((item) => {
        count++;
        const proposal: AgendaUpdateProposal = {
          id: `PROP-WAVE-${Date.now().toString().slice(-4)}-${count}`,
          projectId: selectedProject.id,
          reasonForChange: `Progressive AI Planning Proposal — ${wave.waveName}`,
          sourceOfChange: 'C-Bridge Progressive AI Wave Builder',
          proposedChangeType: 'ADDITION',
          proposedItem: {
            ...item,
            projectId: selectedProject.id,
            projectName: selectedProject.name
          },
          dependencyImpact: 'Sequential wave dependency structure.',
          priorityImpact: `${item.priority?.split(' — ')[0]} Execution Priority`,
          scheduleImpact: `Target Completion: ${item.targetDate}`,
          memberImpact: `Assigned to ${item.assignedMember}`,
          scopeImpact: 'In-scope Phase 1 capability deliverable.',
          aiRecommendation: 'RECOMMEND APPROVAL: Essential wave deliverable for progressive capability build.',
          status: 'PROPOSED',
          createdAt: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT'
        };
        onAddAgendaUpdateProposal(proposal);
      });
    });

    builderAssumptions.forEach((asmText) => {
      onAddPlanningAssumption({
        id: `ASM-${Date.now().toString().slice(-4)}`,
        projectId: selectedProject.id,
        assumption: asmText,
        basis: 'Progressive Planning Engine Execution',
        status: 'ACTIVE'
      });
    });

    setIsProgressiveBuilderOpen(false);
    setActiveTab('PROPOSALS');
  };

  // Handle Save Project Input & Trigger Real AI Document Analysis
  const handleSaveProjectInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;

    if (attachmentMode === 'UPLOAD FILE') {
      if (!selectedFile) {
        setFileValidationError('Please choose a file to upload.');
        return;
      }
      const val = validateUploadedFile(selectedFile);
      if (!val.isValid) {
        setFileValidationError(val.errorMsg || 'Invalid file type selected.');
        return;
      }
    }

    setIsAnalyzingFile(true);

    try {
      let fileData: string | undefined = undefined;
      let textContent: string | undefined = inputContent;

      if (attachmentMode === 'UPLOAD FILE' && selectedFile) {
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(selectedFile);
        });
      }

      // Send actual file/document data to secure server endpoint for real Gemini analysis
              const existingSyllabusForFetch = inputType === 'SYLLABUS' ? projectInputs.find(inp => inp.projectId === selectedProject.id && inp.type === 'SYLLABUS') : null;
      const res = await fetch('/api/analyze-source-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName: selectedFile ? selectedFile.name : undefined,
          mimeType: selectedFile ? (selectedFile.type || 'application/pdf') : undefined,
          sourceType: inputType,
          sourceTitle: inputTitle,
          userNotes: inputNotes,
          textContent,
          attachmentMode,
          projectId: selectedProject.id,
          logicalInputId: existingSyllabusForFetch ? existingSyllabusForFetch.id : undefined,
          logicalSourceId: existingSyllabusForFetch ? (existingSyllabusForFetch.id === 'INP-324-SYLLABUS' ? 'SRC-MA324-00-SYLLABUS' : undefined) : undefined
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();

      if (data.success && data.analysis) {
        const existingSyllabus = inputType === 'SYLLABUS' ? projectInputs.find(inp => inp.projectId === selectedProject.id && inp.type === 'SYLLABUS') : null;
        const inputId = existingSyllabus ? existingSyllabus.id : `INP-${Date.now().toString().slice(-4)}`;

        const newInput: ProjectInput = {
          ...(existingSyllabus || {}),
          id: inputId,
          projectId: selectedProject.id,
          type: inputType,
          title: inputTitle,
          content: inputContent || (selectedFile ? `File: ${selectedFile.name} (${formatFileSize(selectedFile.size)})` : inputRef || inputNotes || inputTitle),
          addedBy: isHusni ? 'Husni Hasan' : 'Samar Baydoun',
          timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
          attachmentMode,
          fileName: selectedFile ? selectedFile.name : (uploadFileName || undefined),
          fileSize: selectedFile ? formatFileSize(selectedFile.size) : (uploadFileSize || undefined),
          fileType: selectedFile ? (selectedFile.type || 'Document') : undefined,
          linkOrRef: attachmentMode === 'ADD LINK / REFERENCE' ? inputRef : (selectedFile ? selectedFile.name : inputRef),
          notes: attachmentMode === 'ADD NOTES' ? inputNotes : undefined,
          analysisStatus: 'ANALYZED',
          agendaImpact: data.analysis.relevance || 'HIGH',
          agendaProposalStatus: existingSyllabus ? existingSyllabus.agendaProposalStatus : 'NO_PROPOSAL',
          relatedAgendaItems: existingSyllabus ? existingSyllabus.relatedAgendaItems : [],
          processedByAi: true,
          aiAnalysis: data.analysis,
          fileAnalysisVerified: true,
          processingMethod: data.processingMethod || data.analysis?.processingMethod,
          documentStructureSummary: data.documentStructureSummary || data.analysis?.documentStructureSummary
        };

        onAddProjectInput(newInput);

        // Reset Form
        setInputTitle('');
        setInputContent('');
        setInputRef('');
        setInputNotes('');
        setSelectedFile(null);
        setFileValidationError(null);
        setUploadFileName('');
        setUploadFileSize('');
        setIsAddInputModalOpen(false);

        // Open AI Analysis Modal with real verified analysis
        setAnalyzingSource(newInput);
        setHusniDirectionOption('USE AI RECOMMENDATION');
        setHusniDirectionCustomText('');
        setGeneratedProposalFromAnalysis(null);
      } else {
        // Failed analysis state
        const existingSyllabus = inputType === 'SYLLABUS' ? projectInputs.find(inp => inp.projectId === selectedProject.id && inp.type === 'SYLLABUS') : null;
        const inputId = existingSyllabus ? existingSyllabus.id : `INP-${Date.now().toString().slice(-4)}`;

        const newInput: ProjectInput = {
          ...(existingSyllabus || {}),
          id: inputId,
          projectId: selectedProject.id,
          type: inputType,
          title: inputTitle,
          content: inputContent || (selectedFile ? `File: ${selectedFile.name}` : inputTitle),
          addedBy: isHusni ? 'Husni Hasan' : 'Samar Baydoun',
          timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
          attachmentMode,
          fileName: selectedFile ? selectedFile.name : undefined,
          fileSize: selectedFile ? formatFileSize(selectedFile.size) : undefined,
          fileType: selectedFile ? selectedFile.type : undefined,
          linkOrRef: inputRef || (selectedFile ? selectedFile.name : undefined),
          notes: inputNotes,
          analysisStatus: 'FAILED',
          agendaImpact: 'NONE',
          agendaProposalStatus: existingSyllabus ? existingSyllabus.agendaProposalStatus : 'NO_PROPOSAL',
          relatedAgendaItems: existingSyllabus ? existingSyllabus.relatedAgendaItems : [],
          processedByAi: false,
          fileAnalysisVerified: false,
          fileAnalysisFailedReason: data.error || "FILE ANALYSIS FAILED: Actual file content was not processed."
        };

        onAddProjectInput(newInput);

        // Reset Form
        setInputTitle('');
        setInputContent('');
        setInputRef('');
        setInputNotes('');
        setSelectedFile(null);
        setFileValidationError(null);
        setUploadFileName('');
        setUploadFileSize('');
        setIsAddInputModalOpen(false);

        // Open AI Analysis Modal with error banner
        setAnalyzingSource(newInput);
      }
    } catch (err: any) {
      console.error("Analysis request error:", err);
      const existingSyllabus = inputType === 'SYLLABUS' ? projectInputs.find(inp => inp.projectId === selectedProject.id && inp.type === 'SYLLABUS') : null;
        const inputId = existingSyllabus ? existingSyllabus.id : `INP-${Date.now().toString().slice(-4)}`;

        const newInput: ProjectInput = {
          ...(existingSyllabus || {}),
          id: inputId,
        projectId: selectedProject.id,
        type: inputType,
        title: inputTitle,
        content: inputContent || 'Source Material',
        addedBy: isHusni ? 'Husni Hasan' : 'Samar Baydoun',
        timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
        attachmentMode,
        fileName: selectedFile ? selectedFile.name : undefined,
        fileSize: selectedFile ? formatFileSize(selectedFile.size) : undefined,
        analysisStatus: 'FAILED',
        agendaImpact: 'NONE',
        agendaProposalStatus: existingSyllabus ? existingSyllabus.agendaProposalStatus : 'NO_PROPOSAL',
        relatedAgendaItems: existingSyllabus ? existingSyllabus.relatedAgendaItems : [],
        processedByAi: false,
        fileAnalysisVerified: false,
        fileAnalysisFailedReason: `FILE ANALYSIS FAILED: ${err.message || 'Error executing file upload.'}`
      };

      onAddProjectInput(newInput);
      setIsAddInputModalOpen(false);
      setAnalyzingSource(newInput);
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  // Generate Agenda Proposal after Husni Review in AI Source Analysis View (with Idempotency & Backend Integration)
  const handleGenerateProposalFromAnalysis = async (source: ProjectInput) => {
    if (isGeneratingProposal || generatingProposalSourceId === source.id) {
      return;
    }

    // Check for existing active proposal for this source to guarantee idempotency
    const existingActiveProposal = agendaUpdateProposals.find(
      (p) => p.projectId === selectedProject.id && 
             (p.sourceInputId === source.id || (p.sourceOfChange && p.sourceOfChange.includes(source.title))) && 
             p.status === 'PROPOSED' &&
             p.auditStatus !== 'FLAGGED_DUPLICATE_ERROR'
    );

    if (existingActiveProposal) {
      setGeneratedProposalFromAnalysis(existingActiveProposal);
      setProposalGenFeedback(`An active Master Agenda Proposal (${existingActiveProposal.id}) already exists for "${source.title}". Loaded existing proposal.`);
      return;
    }

    setIsGeneratingProposal(true);
    setGeneratingProposalSourceId(source.id);
    setProposalGenFeedback(null);

    try {
      const resp = await fetch("/api/generate-source-agenda-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          projectName: selectedProject.name,
          source: {
            id: source.id,
            title: source.title,
            type: source.type,
            inputType: source.inputType,
            fileName: source.fileName,
            fileData: source.fileData,
            fileType: source.fileType,
            content: source.content,
            notes: source.notes,
            aiAnalysis: source.aiAnalysis,
            documentStructureSummary: source.documentStructureSummary
          },
          husniDirection: husniDirectionCustomText,
          assignedMember: "Samar Baydoun",
          idempotencyKey: `${selectedProject.id}_${source.id}`
        })
      });

      const data = await resp.json();
      if (data.success && data.proposal) {
        onAddAgendaUpdateProposal(data.proposal);
        source.agendaProposalStatus = 'PROPOSED';
        if (!source.relatedAgendaItems || source.relatedAgendaItems.length === 0) {
          source.relatedAgendaItems = [data.proposal.id];
        }
        setGeneratedProposalFromAnalysis(data.proposal);
        setProposalGenFeedback(`Generated Master Agenda Proposal Set with ${data.proposal.proposedItems?.length || 1} proposed items.`);
      } else {
        throw new Error(data.error || "Failed to generate proposal via server.");
      }
    } catch (err: any) {
      console.warn("Server proposal generation error, using structured client generator:", err);
      const prop = createProposalFromInputAndDirection(
        source,
        husniDirectionCustomText,
        selectedProject.id,
        selectedProject.name
      );
      onAddAgendaUpdateProposal(prop);
      source.agendaProposalStatus = 'PROPOSED';
      if (!source.relatedAgendaItems || source.relatedAgendaItems.length === 0) {
        source.relatedAgendaItems = [prop.id];
      }
      setGeneratedProposalFromAnalysis(prop);
    } finally {
      setIsGeneratingProposal(false);
      setGeneratingProposalSourceId(null);
    }
  };

  // Toggle multi-source selection
  const toggleSourceSelection = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllSources = () => {
    if (selectedSourceIds.length === projectInputsFiltered.length) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(projectInputsFiltered.map((i) => i.id));
    }
  };

  // Multi-source co-analysis proposal generator
  const handleGenerateJointProposalFromSources = () => {
    const selectedSources = projectInputsFiltered.filter((s) => selectedSourceIds.includes(s.id));
    if (selectedSources.length === 0) return;

    const combinedTitles = selectedSources.map((s) => s.title).join(', ');
    const jointProp: AgendaUpdateProposal = {
      id: `PROP-JOINT-${Date.now().toString().slice(-4)}`,
      projectId: selectedProject.id,
      reasonForChange: `Synthesized Multi-Source Analysis of ${selectedSources.length} sources (${combinedTitles}) ${jointHusniDirection ? `• Supervisor Direction: "${jointHusniDirection}"` : ''}`,
      sourceOfChange: `Co-Analysis of ${selectedSources.length} Project Sources`,
      proposedChangeType: 'ADDITION',
      proposedItem: {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        category: 'ASSET DEVELOPMENT TASK',
        workstream: 'Synthesized Multi-Source Integration',
        taskTitle: `Multi-Source Integration: ${selectedSources[0]?.title} & ${selectedSources.length - 1} related sources`,
        objective: `Synthesize requirements from ${selectedSources.length} combined source materials. ${jointHusniDirection}`,
        expectedDeliverable: `Integrated Master Compliance Deliverable Package`,
        assignedMember: 'Samar Baydoun',
        priority: 'P2 — BLOCKING',
        targetDate: '2026-08-22',
        planningWave: 'WAVE 2 — Capability Dev',
        evidenceRequirement: 'Multi-Source Synthesis Report & Deliverable Package',
        qaRequirement: 'Full QA Compliance Audit',
        supervisorReviewRequirement: 'Husni Hasan Formal Signoff'
      },
      dependencyImpact: 'Harmonizes dependencies across multiple intake sources.',
      priorityImpact: 'P2 High Priority Co-Analysis',
      scheduleImpact: 'Integrated Wave 2 deliverable target.',
      memberImpact: 'Assigned to Samar Baydoun with Husni oversight.',
      scopeImpact: 'Ensures comprehensive multi-source coverage.',
      aiRecommendation: 'RECOMMEND APPROVAL: Synthesizes multiple project inputs into unified deliverable.',
      status: 'PROPOSED',
      createdAt: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT'
    };

    onAddAgendaUpdateProposal(jointProp);

    selectedSources.forEach((s) => {
      s.agendaProposalStatus = 'PROPOSED';
    });

    setIsCoAnalysisModalOpen(false);
    setSelectedSourceIds([]);
    setJointHusniDirection('');

    setActiveTab('PROPOSALS');
  };

  // Handle Natural Language Supervisor Chat Comment
  const handleSendSupervisorComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorChatText.trim()) return;

    setIsAiProcessingComment(true);
    const commentText = supervisorChatText;
    setSupervisorChatText('');

    setTimeout(() => {
      // 1. Record input & supervisor direction
      const inputRec: ProjectInput = {
        id: `INP-DIR-${Date.now().toString().slice(-4)}`,
        projectId: selectedProject.id,
        type: 'HUSNI COMMENT / DIRECTION',
        title: `Supervisor Direction: "${commentText.slice(0, 45)}..."`,
        content: commentText,
        addedBy: 'Husni Hasan',
        timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT',
        processedByAi: true
      };
      onAddProjectInput(inputRec);

      // 2. Interpret comment into Proposed Agenda Update
      const propId = `PROP-DIR-${Date.now().toString().slice(-4)}`;
      const interpretedProposal: AgendaUpdateProposal = {
        id: propId,
        projectId: selectedProject.id,
        reasonForChange: `Husni Comment Interpretation: "${commentText}"`,
        sourceOfChange: 'Husni Natural Language Direction',
        proposedChangeType: commentText.toLowerCase().includes('before') || commentText.toLowerCase().includes('prerequisite') ? 'REORDER_PREREQUISITE' : 'ADDITION',
        existingItemAffectedId: 'MA-FSVP-01',
        existingItemAffectedTitle: 'Draft FSVP Supplier Document Review Checklist',
        proposedItem: {
          category: 'TASK',
          workstream: 'FSVP Service Protocols',
          taskTitle: `[Supervisor Direction] Refine Workstream per Comment`,
          objective: commentText,
          expectedDeliverable: 'Updated Workstream Sequence & Deliverable',
          assignedMember: 'Samar Baydoun',
          priority: 'P2 — BLOCKING',
          targetDate: '2026-08-14',
          planningWave: 'WAVE 1 — Foundation'
        },
        dependencyImpact: 'Re-orders prerequisites to enforce supervisor sequencing.',
        priorityImpact: 'P2 Blocking Sequence adjustment.',
        scheduleImpact: 'Slight shift in checklist publication timeline.',
        memberImpact: 'Samar Baydoun to prioritize supplier evaluation step first.',
        scopeImpact: 'In-scope execution refinement.',
        aiRecommendation: 'RECOMMEND APPROVAL: Aligns agenda structure directly with Husni Hasan supervisor comment.',
        status: 'PROPOSED',
        createdAt: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT'
      };

      onAddAgendaUpdateProposal(interpretedProposal);

      // 3. Record direction
      onAddSupervisorDirection({
        id: `DIR-${Date.now().toString().slice(-4)}`,
        projectId: selectedProject.id,
        supervisorName: 'Husni Hasan',
        rawComment: commentText,
        interpretedProposalId: propId,
        timestamp: new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT'
      });

      setIsAiProcessingComment(false);
      setActiveTab('PROPOSALS');
    }, 700);
  };

  // Handle Manual Item Creation
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: MasterAgendaItem = {
      id: `MA-${selectedProject.id?.replace('PRJ-', '')}-${Date.now().toString().slice(-3)}`,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      category: newItemCategory,
      workstream: newItemWorkstream,
      objective: newItemObjective || newItemTitle,
      taskTitle: newItemTitle,
      expectedDeliverable: newItemDeliverable || 'Deliverable Document',
      assignedMember: newItemAssignee,
      priority: newItemPriority,
      targetDate: newItemTargetDate,
      planningWave: newItemWave,
      dependencies: [],
      currentState: 'NOT_STARTED',
      evidenceRequirement: 'Standard Evidence Upload',
      qaRequirement: 'Standard QA',
      supervisorReviewRequirement: isHusni ? 'Husni Hasan Approved' : 'Husni Hasan Approval Required',
      confirmedByHusni: true,
      progressPercent: 0
    };

    onAddMasterAgendaItem(newItem);

    // Reset Form
    setNewItemTitle('');
    setNewItemObjective('');
    setNewItemDeliverable('');
    setIsNewItemModalOpen(false);
  };

  const handleIntakeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIntakeFile(file);
    setIntakeFileName(file.name);
    setIntakeMimeType(file.type || 'application/octet-stream');
    setIntakeFileSize(`${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setIntakeFileData(base64 || '');
    };
    reader.readAsDataURL(file);
  };

  const handleAddIntakeSource = () => {
    if (!intakeTitle.trim() && !intakeFileName && !intakeContent.trim() && !intakeNotes.trim()) {
      return;
    }

    const newSource: ProjectInput = {
      id: `INTAKE-SRC-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: 'INTAKE-PROVISIONAL',
      type: intakeType,
      title: intakeTitle.trim() || `${intakeType}: ${intakeFileName || 'Initial Source'}`,
      content: intakeContent.trim() || intakeTitle.trim() || (intakeFileName ? `Uploaded file: ${intakeFileName}` : 'Intake source material attached.'),
      addedBy: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
      timestamp: new Date().toISOString().slice(0, 10),
      attachmentMode: intakeAttachmentMode,
      fileName: intakeFileName || undefined,
      fileSize: intakeFileSize || undefined,
      fileType: intakeMimeType || undefined,
      fileData: intakeFileData || undefined,
      notes: intakeNotes.trim() || undefined,
      analysisStatus: 'ANALYZED',
      agendaImpact: 'MEDIUM',
      processedByAi: true,
      inputType: intakeType
    };

    setIntakeSources((prev) => [...prev, newSource]);

    // Reset Form
    setIntakeTitle('');
    setIntakeContent('');
    setIntakeNotes('');
    setIntakeFile(null);
    setIntakeFileName('');
    setIntakeFileData('');
    setIntakeMimeType('');
    setIntakeFileSize('');
  };

  const handleRemoveIntakeSource = (sourceId: string) => {
    setIntakeSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  const openNewProjectModal = () => {
    setNewProjectStep('ORIGIN_INTAKE');
    setSelectedOrigin('COURSE / ACADEMIC PROGRAM');
    setPotentialCapabilityDeveloper('');
    setOriginContext({
      courseName: '',
      providerInstitution: '',
      coursePurposeDescription: '',
      startDate: '',
      endDate: '',
      expectedStudyDuration: '',
      availableStudyHoursPerWeek: '',
      knownNumberOfModules: '',
      relatedCapability: 'U.S. Food Import & FSVP Development',
      notes: '',
      linksOrReferences: '',
      otherDescription: ''
    });
    setOverviewMode('UPLOAD FILE');
    setOverviewFile(null);
    setOverviewFileData('');
    setOverviewFileName('');
    setOverviewMimeType('');
    setOverviewFileSize('');
    setOverviewText('');
    setOverviewHusniDirection('');
    setOverviewAnalysis(null);
    setOverviewError(null);
    setNewProjectName('');
    setNewProjectPurpose('');
    setNewProjectObjective('');
    setNewProjectScope('');
    setNewProjectOutOfScope('');
    setHusniComment('');
    setIsHusniCommentOpen(false);
    setHusniQuestion('');
    setAiQuestionAnswer(null);
    setIsAskingAiQuestion(false);
    setIsHusniCorrecting(false);
    setHusniCorrectionText('');
    setIntakeSources([]);
    setIntakeTitle('');
    setIntakeContent('');
    setIntakeNotes('');
    setIntakeFile(null);
    setIntakeFileName('');
    setIntakeFileData('');
    setIntakeMimeType('');
    setIntakeFileSize('');
    setIsNewProjectModalOpen(true);
  };

  const handleOverviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOverviewFile(file);
    setOverviewFileName(file.name);
    setOverviewMimeType(file.type || 'application/octet-stream');
    setOverviewFileSize(`${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setOverviewFileData(base64 || '');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeOverview = async (overrideCorrectionInstruction?: string) => {
    setIsAnalyzingOverview(true);
    setOverviewError(null);

    const correctionText = typeof overrideCorrectionInstruction === 'string' && overrideCorrectionInstruction.trim()
      ? overrideCorrectionInstruction.trim()
      : undefined;

    try {
      const response = await fetch('/api/analyze-project-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectOrigin: selectedOrigin,
          originContext,
          overviewMode,
          fileData: overviewFileData,
          fileName: overviewFileName,
          mimeType: overviewMimeType,
          fileSize: overviewFileSize,
          overviewText,
          husniDirection: overviewHusniDirection,
          intakeSources,
          correctionInstruction: correctionText
        })
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setOverviewAnalysis(data.analysis);
        setNewProjectName(data.analysis.suggestedProjectName || `${selectedOrigin} Project`);
        setNewProjectPurpose(data.analysis.projectPurpose || originContext.coursePurposeDescription || originContext.trainingPurpose || '');
        setNewProjectObjective(data.analysis.mainObjective || originContext.developmentObjective || '');
        setNewProjectScope(data.analysis.inScopeBoundary || '');
        setNewProjectOutOfScope(data.analysis.outOfScopeBoundary || '');
        setNewProjectStep('UNDERSTANDING_REVIEW');
      } else if (data.noOverview) {
        setNewProjectName(originContext.courseName || originContext.trainingName || originContext.capabilityName || originContext.regulationName || originContext.opportunityName || `${selectedOrigin} Project`);
        setNewProjectPurpose(originContext.coursePurposeDescription || originContext.trainingPurpose || originContext.whyItMatters || originContext.opportunityDescription || 'Operational capability development');
        setNewProjectStep('CONFIRM_DEFINITION');
      } else {
        setOverviewError(data.error || 'Overview processing failed.');
      }
    } catch (err: any) {
      console.error('Overview analysis fetch error:', err);
      setOverviewError(`Overview processing error: ${err.message || 'Server communication error'}`);
    } finally {
      setIsAnalyzingOverview(false);
    }
  };

  // Handle Create Project
  const handleCreateNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const prjId = `PRJ-${Math.floor(100 + Math.random() * 900)}`;

    const newPrj: Project = {
      id: prjId,
      name: newProjectName,
      purpose: newProjectPurpose || 'Operational capability development',
      businessObjective: newProjectObjective || 'Strengthen C-Bridge service capabilities',
      scope: newProjectScope || 'Phase 1 in-scope execution',
      outOfScopeBoundaries: newProjectOutOfScope || 'Phase 2 custom engineering',
      supervisor: 'Husni Hasan',
      assignedMembers: overviewAnalysis?.recommendedMembers?.length ? overviewAnalysis.recommendedMembers : ['Samar Baydoun', 'Husni Hasan'],
      startDate: originContext.startDate || new Date().toISOString().slice(0, 10),
      targetDate: originContext.endDate || newProjectTargetDate,
      currentPhase: 'Phase 1 — Definition & Setup',
      status: currentUser === 'HUSNI' ? 'APPROVED' : 'PROPOSED',
      expectedDeliverables: overviewAnalysis?.potentialDeliverables?.length ? overviewAnalysis.potentialDeliverables : ['Standard Operating Procedures', 'Member Capabilities'],
      risks: overviewAnalysis?.risks?.length ? overviewAnalysis.risks : ['Timeline constraints'],
      dependencies: overviewAnalysis?.potentialDependencies?.length ? overviewAnalysis.potentialDependencies : ['CB-9110 Governance Approval'],
      relatedGovernanceDecisions: ['DEC-001'],
      overviewAnalysis: overviewAnalysis || undefined,
      origin: selectedOrigin,
      originContext: originContext,
      projectSponsor: 'Husni Hasan',
      projectProposer: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
      potentialCapabilityDeveloper: potentialCapabilityDeveloper || undefined,
      capabilityDeveloper: potentialCapabilityDeveloper || undefined,
      createdByUid: currentUser === 'HUSNI' ? 'HUSNI-UID' : 'SAMAR-UID',
      createdAt: new Date().toISOString()
    };

    onAddProject(newPrj);

    // Transfer/link pre-project intake sources into official PROJECT SOURCE LIBRARY without duplication
    intakeSources.forEach((src) => {
      const transferredSource: ProjectInput = {
        ...src,
        projectId: prjId,
        timestamp: new Date().toISOString().slice(0, 10),
      };
      onAddProjectInput(transferredSource);
    });

    // Initial Source Handoff: automatically register uploaded overview if present and not duplicated
    if ((overviewFileName || overviewText) && intakeSources.length === 0) {
      const overviewSourceInput: ProjectInput = {
        id: `SRC-${Math.floor(1000 + Math.random() * 9000)}`,
        projectId: prjId,
        type: 'PROJECT OVERVIEW',
        title: `Project Source Material (${selectedOrigin}): ${overviewFileName || newPrj.name}`,
        content: overviewText || originContext.notes || originContext.linksOrReferences || overviewAnalysis?.projectPurpose || newPrj.purpose,
        addedBy: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
        timestamp: new Date().toISOString().slice(0, 10),
        attachmentMode: overviewMode === 'UPLOAD FILE' ? 'UPLOAD FILE' : 'PASTE TEXT',
        fileName: overviewFileName || undefined,
        fileSize: overviewFileSize || undefined,
        fileType: overviewMimeType || undefined,
        notes: overviewHusniDirection || originContext.notes || undefined,
        analysisStatus: 'ANALYZED',
        agendaImpact: overviewAnalysis?.hasScopeConflict ? 'HIGH' : 'MEDIUM',
        processedByAi: true,
        fileAnalysisVerified: true,
        processingMethod: overviewAnalysis?.processingMethod || 'DIRECT TEXT ANALYSIS',
        documentStructureSummary: overviewAnalysis?.documentStructureSummary
      };

      onAddProjectInput(overviewSourceInput);
    }

    setSelectedProjectId(newPrj.id);
    setIsNewProjectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Progressive Mode Indicator */}
      <div className="bg-[#10243E] text-[#F8FAFC] p-6 rounded-2xl shadow-md border border-[#28476B] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-[#163153] text-sky-300 border border-[#28476B] text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-bold">
                CB-9119 Progressive Agenda Engine
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-extrabold flex items-center space-x-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>MODE: PROGRESSIVE PLANNING</span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2 text-[#F8FAFC]">
              <FolderKanban className="h-7 w-7 text-sky-400" />
              <span>Project & Master Agenda Center</span>
            </h1>
            <p className="text-slate-300 text-xs max-w-3xl">
              Source-informed, AI-assisted, and supervisor-confirmed master agenda evolution. Plans progress in waves as learning outcomes and directions arrive.
            </p>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openNewProjectModal()}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4 text-blue-100" />
              <span>+ NEW PROJECT</span>
            </button>

            <div className="h-4 w-[1px] bg-[#28476B] mx-0.5 hidden sm:block"></div>

            <button
              onClick={() => setIsAddInputModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
            >
              <PlusCircle className="h-4 w-4 text-emerald-100" />
              <span>+ ADD SOURCE / MATERIAL</span>
            </button>

            <button
              onClick={() => {
                setBuilderStep('OPTIONAL_INPUT');
                setIsProgressiveBuilderOpen(true);
              }}
              className="bg-[#163153] hover:bg-[#20416B] text-slate-100 border border-[#28476B] font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-sky-400" />
              <span>BUILD / REFINE MASTER AGENDA</span>
            </button>

            <button
              onClick={() => onRunCb9119Engine(selectedProjectId)}
              className="bg-[#163153] hover:bg-[#20416B] text-slate-100 border border-[#28476B] font-extrabold text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
              title="Schedules active confirmed items into Daily Tasks"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              <span>RUN DAILY ENGINE</span>
            </button>
          </div>
        </div>

        {/* Project Selector Bar */}
        <div className="pt-4 border-t border-[#28476B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-medium">Selected Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#163153] text-[#F8FAFC] border border-[#28476B] font-bold rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-sky-500 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-300">
            <div>
              Active Wave Items: <span className="font-bold text-white">{activeMasterItems.length}</span>
            </div>
            <div>
              Pending Proposals: <span className={`font-bold ${pendingProposals.length > 0 ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>{pendingProposals.length}</span>
            </div>
            <div>
              Source Materials: <span className="font-bold text-emerald-400">{projectInputsFiltered.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Project Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono mb-1">
              <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold px-2 py-0.5 rounded">
                {selectedProject.id}
              </span>
              <span className="bg-purple-100 text-purple-900 border border-purple-300 font-black px-2 py-0.5 rounded uppercase text-[10px]">
                ORIGIN: {selectedProject.origin || 'LEGACY / NOT CLASSIFIED'}
              </span>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded">
                STATUS: {selectedProject.status}
              </span>
              <span className="text-slate-500 text-[11px]">
                Supervisor: <strong className="text-slate-700">{selectedProject.supervisor}</strong>
              </span>
              {selectedProject.potentialCapabilityDeveloper && (
                <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-bold text-[10px]">
                  Dev: {selectedProject.potentialCapabilityDeveloper}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">{selectedProject.name}</h2>
            <p className="text-xs text-slate-600 mt-1">{selectedProject.purpose}</p>
          </div>

          {/* Overall Progress Gauge */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl min-w-[200px] text-center space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-600 font-bold">
              <span>Active Agenda Execution</span>
              <span className="text-indigo-600 font-mono font-extrabold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {completedCount} of {activeMasterItems.length} active deliverables completed
            </div>
          </div>
        </div>

        {/* Scope & Objective Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-extrabold text-slate-800 flex items-center space-x-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>In-Scope Phase 1 Boundary:</span>
            </span>
            <p className="text-slate-600 leading-relaxed">{selectedProject.scope}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <span className="font-extrabold text-slate-800 flex items-center space-x-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              <span>Out-of-Scope Boundary:</span>
            </span>
            <p className="text-slate-600 leading-relaxed">{selectedProject.outOfScopeBoundaries}</p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 gap-2 pb-1">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-white text-indigo-900 border-t-2 border-indigo-600 border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>ACTIVE AGENDA</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {activeMasterItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PROPOSALS')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'PROPOSALS'
                ? 'bg-white text-indigo-900 border-t-2 border-amber-500 border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>PROPOSED UPDATES</span>
            {pendingProposals.length > 0 ? (
              <span className="bg-amber-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
                {pendingProposals.length} REVIEW
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-600 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                0
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('INPUTS')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'INPUTS'
                ? 'bg-white text-indigo-900 border-t-2 border-emerald-600 border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span>SOURCE MATERIALS & DIRECTIONS</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {projectInputsFiltered.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COMMENTS')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'COMMENTS'
                ? 'bg-white text-indigo-900 border-t-2 border-purple-600 border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="h-4 w-4 text-purple-600" />
            <span>HUSNI COMMENTS</span>
            <span className="bg-purple-100 text-purple-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {projectDirectionsFiltered.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ASSUMPTIONS')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'ASSUMPTIONS'
                ? 'bg-white text-indigo-900 border-t-2 border-blue-600 border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <span>PLANNING ASSUMPTIONS</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {projectAssumptionsFiltered.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-white text-indigo-900 border-t-2 border-slate-600 border-x border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="h-4 w-4 text-slate-600" />
            <span>CHANGE HISTORY</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {projectHistoryFiltered.length}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2 pb-1">
          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Agenda Item</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE AGENDA */}
      {activeTab === 'ACTIVE' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-bold text-slate-700">Wave:</span>
                <select
                  value={waveFilter}
                  onChange={(e) => setWaveFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium focus:outline-hidden"
                >
                  <option value="ALL">All Waves (1 — 5)</option>
                  <option value="WAVE 1 — Foundation">Wave 1 — Foundation</option>
                  <option value="WAVE 2 — Capability Dev">Wave 2 — Capability Dev</option>
                  <option value="WAVE 3 — Application & Testing">Wave 3 — Application & Testing</option>
                  <option value="WAVE 4 — Assets & Communication">Wave 4 — Assets & Communication</option>
                  <option value="WAVE 5 — QA & Review">Wave 5 — QA & Review</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-700">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium focus:outline-hidden"
                >
                  <option value="ALL">All Categories</option>
                  <option value="PHASE">Phase</option>
                  <option value="WORKSTREAM">Workstream</option>
                  <option value="TASK">Task</option>
                  <option value="LEARNING TASK">Learning Task</option>
                  <option value="ASSET DEVELOPMENT TASK">Asset Development Task</option>
                  <option value="QA / REVIEW">QA / Review</option>
                  <option value="SUPERVISOR ACTION">Supervisor Action</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-700">Execution State:</span>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium focus:outline-hidden"
                >
                  <option value="ALL">All States</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="SCHEDULED_DAILY">Scheduled Daily</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="QA_PENDING">QA Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="BLOCKED">Blocked / On Hold</option>
                </select>
              </div>
            </div>

            <div className="text-slate-500 font-mono text-[11px]">
              Showing <strong className="text-slate-800">{filteredMasterItems.length}</strong> of {activeMasterItems.length} active items
            </div>
          </div>

          {/* Active Agenda List */}
          {filteredMasterItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <FolderKanban className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700">No active agenda items match filters</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Build progressive planning waves or approve proposed update items from the review queue to populate the active agenda.
              </p>
              <button
                onClick={() => setIsProgressiveBuilderOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl"
              >
                Launch Progressive Builder
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMasterItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className="bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded">
                        {item.planningWave || 'WAVE 1 — Foundation'}
                      </span>
                      <span className="bg-slate-100 text-slate-800 border border-slate-300 font-extrabold px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold px-2 py-0.5 rounded">
                        {item.id}
                      </span>
                      <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 font-extrabold px-2 py-0.5 rounded flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>CONFIRMED BY HUSNI</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                        item.currentState === 'COMPLETED' || item.currentState === 'SUPERVISOR_APPROVED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : item.currentState === 'SCHEDULED_DAILY'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300 font-extrabold'
                          : item.currentState === 'BLOCKED'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        STATE: {item.currentState}
                      </span>

                      <span className="text-slate-400 font-mono text-[11px]">
                        Target: <strong className="text-slate-700">{item.targetDate}</strong>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{item.taskTitle}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.objective}</p>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Workstream & Deliverable:</span>
                      <strong className="text-slate-800">{item.workstream}</strong>
                      <div className="text-[11px] text-indigo-700 font-medium truncate">{item.expectedDeliverable}</div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Assignee & Priority:</span>
                      <strong className="text-slate-800">{item.assignedMember}</strong>
                      <div className="text-[11px] text-amber-700 font-semibold">{item.priority.split(' — ')[0]}</div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Governance & QA Rule:</span>
                      <strong className="text-slate-800">{item.supervisorReviewRequirement}</strong>
                      <div className="text-[11px] text-slate-500">{item.qaRequirement}</div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setTraceabilityItem(item)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Traceability & Evidence Rule</span>
                      </button>

                      {item.dailyTaskId && (
                        <span className="bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                          Linked Daily Task: {item.dailyTaskId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {isHusni && (
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                          title="Edit Agenda Item"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                      {isHusni && (
                        <button
                          onClick={() => onRemoveMasterAgendaItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROPOSED UPDATES (Husni Review Queue) */}
      {activeTab === 'PROPOSALS' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-900 text-xs">
            <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-extrabold text-amber-950 block">
                Husni Review Queue — Proposed Master Agenda Changes
              </strong>
              <p className="text-amber-800 leading-relaxed">
                In C-Bridge Progressive Planning, C-Bridge AI creates <strong>Agenda Update Proposals</strong> from source material, natural supervisor comments, and live learning outcomes. <strong>AI never silently modifies the active Master Agenda</strong>. Items enter execution only after Husni Hasan accepts them.
              </p>
            </div>
          </div>

          {pendingProposals.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-800">No pending agenda proposals awaiting review</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All proposed agenda updates have been reviewed by Husni Hasan. Add a project input or enter a natural supervisor comment below to generate new proposals.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingProposals.map((prop) => {
                const isProposalSet = prop.proposedItems && prop.proposedItems.length > 0;
                const itemsList = prop.proposedItems || (prop.proposedItem ? [prop.proposedItem] : []);
                const isExpanded = expandedProposalSetId === prop.id;
                const selectedIndices = selectedProposalItemsMap[prop.id] || itemsList.map((_, i) => i);
                const selectedCount = selectedIndices.length;

                const toggleSelectItem = (index: number) => {
                  setSelectedProposalItemsMap((prev) => {
                    const current = prev[prop.id] || itemsList.map((_, i) => i);
                    const updated = current.includes(index)
                      ? current.filter((i) => i !== index)
                      : [...current, index];
                    return { ...prev, [prop.id]: updated };
                  });
                };

                const toggleSelectAll = () => {
                  setSelectedProposalItemsMap((prev) => {
                    const current = prev[prop.id] || itemsList.map((_, i) => i);
                    if (current.length === itemsList.length) {
                      return { ...prev, [prop.id]: [] };
                    } else {
                      return { ...prev, [prop.id]: itemsList.map((_, i) => i) };
                    }
                  });
                };

                return (
                  <div 
                    key={prop.id} 
                    className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                        <span className="bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded uppercase">
                          {isProposalSet ? 'MASTER AGENDA PROPOSAL SET' : `PROPOSAL: ${prop.proposedChangeType}`}
                        </span>
                        <span className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded">
                          {prop.id}
                        </span>
                        <span className="text-slate-500">
                          Source: <strong className="text-slate-800">{prop.sourceOfChange}</strong>
                        </span>
                        {isProposalSet && (
                          <span className="bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded">
                            {itemsList.length} Proposed Items
                          </span>
                        )}
                      </div>

                      <span className="text-slate-400 text-[11px] font-mono">
                        Created: {prop.createdAt}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {prop.proposalSetTitle || prop.proposedItem?.taskTitle || prop.existingItemAffectedTitle || 'Proposed Master Agenda Course Structure'}
                      </h3>
                      <p className="text-xs text-slate-700 font-medium mt-1">
                        Reason for Change: <span className="text-slate-600 font-normal">{prop.reasonForChange}</span>
                      </p>
                    </div>

                    {/* PROPOSAL SET ITEMS BREAKDOWN */}
                    {isProposalSet && (
                      <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <Layers className="h-4 w-4 text-indigo-600" />
                            <span className="font-extrabold text-xs text-slate-900 uppercase font-mono">
                              Proposed Course Items & Modules ({itemsList.length})
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({selectedCount} of {itemsList.length} selected for activation)
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={toggleSelectAll}
                              className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer"
                            >
                              {selectedCount === itemsList.length ? 'Deselect All' : 'Select All Items'}
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setExpandedProposalSetId(isExpanded ? null : prop.id)}
                              className="text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition"
                            >
                              <span>{isExpanded ? 'Collapse Module Details' : 'Review All Module Details'}</span>
                              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Module List Grid */}
                        <div className="space-y-2.5 mt-2">
                          {itemsList.map((item, idx) => {
                            const isSelected = selectedIndices.includes(idx);
                            return (
                              <div
                                key={idx}
                                className={`p-3.5 rounded-xl border transition ${
                                  isSelected 
                                    ? 'bg-white border-indigo-200 shadow-xs' 
                                    : 'bg-slate-100/70 border-slate-200 opacity-60'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start space-x-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSelectItem(idx)}
                                      className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                      id={`prop-${prop.id}-item-${idx}`}
                                    />
                                    <label htmlFor={`prop-${prop.id}-item-${idx}`} className="cursor-pointer space-y-1">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="bg-slate-800 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                                          #{idx + 1}
                                        </span>
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                          item.category === 'LEARNING TASK'
                                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                            : item.category === 'ASSET DEVELOPMENT TASK'
                                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                                        }`}>
                                          {item.category}
                                        </span>
                                        <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-1.5 py-0.5 rounded">
                                          {item.planningWave || 'WAVE 1'}
                                        </span>
                                        {item.outsideScopeLabel && (
                                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                                            {item.outsideScopeLabel}
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="font-extrabold text-xs text-slate-900">
                                        {item.taskTitle}
                                      </h4>
                                      <p className="text-[11px] text-slate-600">
                                        {item.objective}
                                      </p>
                                    </label>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="text-[10px] font-mono text-slate-400 block">Assigned</span>
                                    <span className="text-[11px] font-bold text-slate-800">{item.assignedMember || 'Samar Baydoun'}</span>
                                  </div>
                                </div>

                                {/* Expanded Module Details */}
                                {(isExpanded || idx < 2) && (
                                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2 text-[11px] bg-slate-50 p-2.5 rounded-lg">
                                    {item.modulePurpose && (
                                      <div>
                                        <strong className="text-slate-700 block">Module Purpose:</strong>
                                        <span className="text-slate-600">{item.modulePurpose}</span>
                                      </div>
                                    )}

                                    {item.learningObjectives && item.learningObjectives.length > 0 && (
                                      <div>
                                        <strong className="text-slate-700 block">Learning Objectives:</strong>
                                        <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                                          {item.learningObjectives.map((obj, oIdx) => (
                                            <li key={oIdx}>{obj}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {item.requiredTopics && item.requiredTopics.length > 0 && (
                                      <div>
                                        <strong className="text-slate-700 block">Required Course Topics:</strong>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                          {item.requiredTopics.map((top, tIdx) => (
                                            <span key={tIdx} className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                                              {top}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {item.requiredReading && item.requiredReading.length > 0 && (
                                      <div>
                                        <strong className="text-slate-700 block">Required Regulatory Reading:</strong>
                                        <span className="text-slate-600 font-mono text-[10px]">
                                          {item.requiredReading.join(' • ')}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                      {item.expectedDeliverable && (
                                        <div>
                                          <strong className="text-slate-700">Expected Output: </strong>
                                          <span className="text-indigo-900 font-medium">{item.expectedDeliverable}</span>
                                        </div>
                                      )}
                                      {item.clientStudyReadiness && (
                                        <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded italic">
                                          {item.clientStudyReadiness}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Impact Matrix Grid */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                      <span className="font-bold text-slate-800 text-[11px] font-mono uppercase tracking-wider block text-indigo-900">
                        AI Agenda Impact Analysis
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="font-bold text-slate-700 block">Dependency Impact:</span>
                          <p className="text-slate-600">{prop.dependencyImpact}</p>
                        </div>

                        <div>
                          <span className="font-bold text-slate-700 block">Priority & Schedule Impact:</span>
                          <p className="text-slate-600">{prop.priorityImpact} • {prop.scheduleImpact}</p>
                        </div>

                        <div>
                          <span className="font-bold text-slate-700 block">Member Assignment & Scope:</span>
                          <p className="text-slate-600">{prop.memberImpact} • {prop.scopeImpact}</p>
                        </div>

                        <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100">
                          <span className="font-extrabold text-indigo-900 block flex items-center space-x-1">
                            <Zap className="h-3.5 w-3.5 text-indigo-600" />
                            <span>AI Recommendation:</span>
                          </span>
                          <p className="text-indigo-800 font-medium">{prop.aiRecommendation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Review Actions */}
                    {isHusni ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          {isProposalSet ? (
                            <>
                              <button
                                onClick={() => onReviewAgendaUpdateProposal(prop.id, 'ACCEPTED', 'Approved all items in course proposal set by Husni Hasan.')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                              >
                                <Check className="h-4 w-4" />
                                <span>ACCEPT ALL ({itemsList.length} ITEMS)</span>
                              </button>

                              {selectedCount > 0 && selectedCount < itemsList.length && (
                                <button
                                  onClick={() => onReviewAgendaUpdateProposal(prop.id, 'ACCEPTED', `Approved ${selectedCount} selected items by Husni Hasan.`, undefined, selectedIndices)}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                                >
                                  <Check className="h-4 w-4" />
                                  <span>ACCEPT SELECTED ({selectedCount})</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => onReviewAgendaUpdateProposal(prop.id, 'ACCEPTED', 'Approved as proposed by Husni Hasan.')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                            >
                              <Check className="h-4 w-4" />
                              <span>ACCEPT & ACTIVATE AGENDA ITEM</span>
                            </button>
                          )}

                          <button
                            onClick={() => setReviewingProposal(prop)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                          >
                            ACCEPT WITH COMMENT / MODIFY
                          </button>

                          <button
                            onClick={() => onReviewAgendaUpdateProposal(prop.id, 'REJECTED', 'Rejected during supervisor review.')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                          >
                            REJECT
                          </button>

                          <button
                            onClick={() => onReviewAgendaUpdateProposal(prop.id, 'DEFERRED', 'Deferred to future planning wave.')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                          >
                            DEFER
                          </button>
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono italic">
                          Requires Husni Hasan Authority
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-100 p-3 rounded-xl text-center text-xs text-slate-600 font-medium">
                        Awaiting supervisor review by Husni Hasan. Samar Baydoun cannot activate proposals directly.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SOURCE MATERIALS & DIRECTIONS REGISTER */}
      {activeTab === 'INPUTS' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  <span>Source Materials & Directions Register</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Persistent source register for {selectedProject.name}. Adding materials allows C-Bridge AI to perform structural analysis before proposing agenda updates.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedSourceIds.length >= 2 && (
                  <button
                    onClick={() => setIsCoAnalysisModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-xs animate-pulse"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>ANALYZE SELECTED SOURCES TOGETHER ({selectedSourceIds.length})</span>
                  </button>
                )}

                <button
                  onClick={() => setIsAddInputModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>+ Add Source / Direction</span>
                </button>
              </div>
            </div>

            {/* Selection Bar */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleSelectAllSources}
                  className="flex items-center space-x-1.5 text-indigo-700 hover:text-indigo-900 font-bold cursor-pointer"
                >
                  {selectedSourceIds.length === projectInputsFiltered.length && projectInputsFiltered.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                  <span>
                    {selectedSourceIds.length === projectInputsFiltered.length && projectInputsFiltered.length > 0
                      ? 'Deselect All'
                      : 'Select All Sources for Co-Analysis'}
                  </span>
                </button>
                <span className="text-slate-400">|</span>
                <span>{selectedSourceIds.length} of {projectInputsFiltered.length} selected</span>
              </div>

              <span className="text-[11px] text-slate-500 italic hidden sm:inline">
                Check 2+ sources to run joint AI co-analysis
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {projectInputsFiltered.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
                <BookOpen className="h-8 w-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-700">No source materials added to this project yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Adding sources (syllabus, regulatory references, meeting notes, or supervisor directions) enables AI source analysis. Sources remain optional.
                </p>
                <button
                  onClick={() => setIsAddInputModalOpen(true)}
                  className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl mt-2 inline-flex items-center space-x-1.5"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add First Project Source</span>
                </button>
              </div>
            ) : (
              projectInputsFiltered.map((inp) => {
                const isSelected = selectedSourceIds.includes(inp.id);
                return (
                  <div
                    key={inp.id}
                    className={`bg-white rounded-2xl border transition p-5 shadow-xs space-y-3 ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <button
                          onClick={() => toggleSourceSelection(inp.id)}
                          className="text-slate-600 hover:text-indigo-600 cursor-pointer p-0.5"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>

                        <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold px-2.5 py-0.5 rounded">
                          {inp.type}
                        </span>

                        {inp.attachmentMode && (
                          <span className="bg-slate-100 text-slate-700 border border-slate-300 font-medium px-2 py-0.5 rounded flex items-center space-x-1">
                            <Paperclip className="h-3 w-3 text-slate-500" />
                            <span>{inp.attachmentMode}</span>
                          </span>
                        )}

                        <span className="text-slate-400">{inp.id}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                        <span>
                          Added by <strong className="text-slate-700">{inp.addedBy}</strong>
                        </span>
                        <span>•</span>
                        <span>{inp.timestamp}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">{inp.title}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1.5">
                        {inp.content}
                      </p>
                    </div>

                    {/* Metadata & Attachment Row */}
                    {(inp.fileName || inp.linkOrRef || inp.notes) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {inp.fileName && (
                          <div className="flex items-center space-x-1 text-emerald-800 font-medium">
                            <FileUp className="h-3.5 w-3.5 text-emerald-600" />
                            <span>File: {inp.fileName} ({inp.fileSize || '2.4 MB'})</span>
                          </div>
                        )}
                        {inp.linkOrRef && (
                          <div className="flex items-center space-x-1 text-indigo-700 font-medium">
                            <Link className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Ref/Link: {inp.linkOrRef}</span>
                          </div>
                        )}
                        {inp.notes && (
                          <div className="flex items-center space-x-1 text-purple-800 font-medium">
                            <AlignLeft className="h-3.5 w-3.5 text-purple-600" />
                            <span>Note: {inp.notes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Register Status Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Analysis Status:</span>
                        <span className="font-extrabold text-emerald-700 flex items-center space-x-1">
                          <CheckCheck className="h-3.5 w-3.5" />
                          <span>{inp.analysisStatus || 'ANALYZED'}</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Agenda Impact:</span>
                        <span className={`font-extrabold ${
                          inp.agendaImpact === 'HIGH' ? 'text-amber-700' : 'text-indigo-700'
                        }`}>
                          {inp.agendaImpact || 'HIGH'} IMPACT
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Proposal Status:</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] font-mono inline-block ${
                          inp.agendaProposalStatus === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : inp.agendaProposalStatus === 'PROPOSED'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {inp.agendaProposalStatus || 'NO_PROPOSAL'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Related Agenda Items:</span>
                        <span className="font-mono text-slate-700 font-medium">
                          {inp.relatedAgendaItems && inp.relatedAgendaItems.length > 0
                            ? inp.relatedAgendaItems.join(', ')
                            : 'None Linked'}
                        </span>
                      </div>
                    </div>

                    {/* Source Register Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Source preserved in project register
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setAnalyzingSource(inp);
                            setHusniDirectionOption('USE AI RECOMMENDATION');
                            setHusniDirectionCustomText('');
                            setGeneratedProposalFromAnalysis(null);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-extrabold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 transition cursor-pointer"
                        >
                          <Zap className="h-3.5 w-3.5 text-indigo-600" />
                          <span>View AI Analysis</span>
                        </button>

                        <button
                          disabled={isGeneratingProposal && generatingProposalSourceId === inp.id}
                          onClick={() => handleGenerateProposalFromAnalysis(inp)}
                          className="bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-900 border border-emerald-200 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 transition cursor-pointer"
                        >
                          {isGeneratingProposal && generatingProposalSourceId === inp.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                              <span>GENERATING AGENDA PROPOSAL...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Generate Agenda Proposal</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HUSNI COMMENTS & NATURAL LANGUAGE CHAT */}
      {activeTab === 'COMMENTS' && (
        <div className="space-y-6">
          <div className="bg-purple-900 text-white p-6 rounded-2xl shadow-md space-y-4">
            <div className="space-y-1">
              <span className="bg-purple-700 text-purple-200 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                Supervisor Direction Intake
              </span>
              <h3 className="text-lg font-extrabold flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-300" />
                <span>Natural Language AI Planning Assistant</span>
              </h3>
              <p className="text-purple-200 text-xs max-w-2xl">
                Husni Hasan can talk naturally to C-Bridge AI about project timing, sequence, or dependencies. C-Bridge AI interprets the comment, generates a proposed agenda update, and presents it for approval.
              </p>
            </div>

            {/* Natural Comment Form */}
            <form onSubmit={handleSendSupervisorComment} className="space-y-3">
              <div className="relative">
                <textarea
                  value={supervisorChatText}
                  onChange={(e) => setSupervisorChatText(e.target.value)}
                  placeholder="e.g. 'Before creating the checklist, I want Samar to finish the supplier evaluation section and SAHC Foreign Supplier Verification SOP.'"
                  rows={3}
                  className="w-full bg-purple-950/80 border border-purple-700 text-white rounded-xl p-3.5 text-xs focus:outline-hidden focus:border-purple-400 placeholder:text-purple-400"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-purple-300 font-mono text-[11px]">
                  Preserved in Supervisor Direction Record
                </span>

                <button
                  type="submit"
                  disabled={isAiProcessingComment || !supervisorChatText.trim()}
                  className="bg-amber-500 hover:bg-amber-400 text-purple-950 font-extrabold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isAiProcessingComment ? 'Interpreting Comment...' : 'Interpret Comment & Propose Agenda Update'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Comment History List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-extrabold text-slate-500 uppercase tracking-wider">
              Recorded Supervisor Directions ({projectDirectionsFiltered.length})
            </h4>

            {projectDirectionsFiltered.map((dir) => (
              <div key={dir.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="bg-purple-100 text-purple-900 border border-purple-300 font-extrabold px-2 py-0.5 rounded">
                    {dir.id}
                  </span>
                  <span className="text-slate-400">{dir.timestamp}</span>
                </div>

                <p className="text-xs font-bold text-slate-800 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                  "{dir.rawComment}"
                </p>

                {dir.interpretedProposalId && (
                  <div className="text-[11px] font-mono text-indigo-600 flex items-center space-x-1 pt-1">
                    <CornerDownRight className="h-3.5 w-3.5" />
                    <span>Linked Interpreted Proposal: <strong>{dir.interpretedProposalId}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PLANNING ASSUMPTIONS */}
      {activeTab === 'ASSUMPTIONS' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-900 text-xs space-y-1">
            <strong className="font-extrabold block text-blue-950">
              AI Planning Assumptions (Ask, Not Require Principle)
            </strong>
            <p className="text-blue-800 leading-relaxed">
              In accordance with C-Bridge rules, optional source inputs improve agenda fidelity, but projects are <strong>never blocked</strong> by missing materials. When C-Bridge AI generates agendas without supporting project-specific sources, it explicitly documents its assumptions here.
            </p>
          </div>

          <div className="space-y-3">
            {projectAssumptionsFiltered.map((asm) => (
              <div key={asm.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="bg-blue-100 text-blue-900 border border-blue-300 font-extrabold px-2 py-0.5 rounded">
                    {asm.id}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded">
                    {asm.status}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-slate-900">{asm.assumption}</h4>
                <p className="text-xs text-slate-600">
                  Basis: <span className="font-medium text-slate-800">{asm.basis}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CHANGE HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <History className="h-5 w-5 text-slate-600" />
              <span>Master Agenda Change Audit Log</span>
            </h3>

            <div className="space-y-3">
              {projectHistoryFiltered.map((hist) => (
                <div key={hist.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="bg-slate-800 text-white font-extrabold px-2 py-0.5 rounded">
                      {hist.action}
                    </span>
                    <span className="text-slate-500">{hist.timestamp}</span>
                  </div>

                  <strong className="text-slate-900 block font-extrabold">{hist.itemTitle}</strong>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700 text-[11px] pt-1">
                    <div>
                      Source: <strong className="text-slate-900">{hist.sourceOfChange}</strong>
                    </div>
                    <div>
                      Supervisor Decision: <strong className="text-indigo-900">{hist.husniDecision}</strong>
                    </div>
                  </div>

                  {hist.husniComment && (
                    <div className="text-[11px] text-slate-600 font-medium italic border-t border-slate-200 pt-1">
                      Husni Comment: "{hist.husniComment}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Progressive Wave AI Generator (With Section 2 Optional Input Prompt) */}
      {isProgressiveBuilderOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Progressive Master Agenda Builder</h3>
                  <p className="text-xs text-slate-500">
                    C-Bridge AI Progressive Wave Planner for {selectedProject.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsProgressiveBuilderOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* STEP 1: Section 2 Optional Planning Input Prompt */}
            {builderStep === 'OPTIONAL_INPUT' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="bg-indigo-600 text-white text-[10px] font-mono px-2 py-0.5 rounded font-extrabold">
                      OPTIONAL PLANNING INPUT
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-indigo-950">
                    "Do you have any materials, sources, syllabus, previous work, meeting outcomes, comments, or directions that should help me build or refine this agenda?"
                  </h4>

                  <p className="text-indigo-800 leading-relaxed font-medium">
                    Additional materials may improve the agenda fidelity, but they are <strong>not required to continue</strong>. C-Bridge AI can generate a reasonable progressive plan directly from approved project objectives and regulatory knowledge.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                  <button
                    onClick={() => {
                      setIsProgressiveBuilderOpen(false);
                      setIsAddInputModalOpen(true);
                    }}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl flex items-center space-x-2 transition cursor-pointer text-left"
                  >
                    <BookOpen className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <div>+ ADD MATERIAL / SYLLABUS</div>
                      <div className="text-[10px] font-normal text-slate-500">Upload course syllabus, regulations, or research</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsProgressiveBuilderOpen(false);
                      setActiveTab('COMMENTS');
                    }}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl flex items-center space-x-2 transition cursor-pointer text-left"
                  >
                    <MessageSquare className="h-4 w-4 text-purple-600 shrink-0" />
                    <div>
                      <div>+ ADD HUSNI COMMENT</div>
                      <div className="text-[10px] font-normal text-slate-500">Provide direct supervisor comments or direction</div>
                    </div>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Inputs present: {projectInputsFiltered.length} source records
                  </span>

                  <button
                    onClick={() => handleStartProgressiveBuilder(false)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 shadow-xs cursor-pointer transition"
                  >
                    <span>CONTINUE WITHOUT ADDITIONAL INPUT</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Generating Loading Screen */}
            {builderStep === 'GENERATING' && (
              <div className="py-12 text-center space-y-4">
                <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
                <h4 className="font-extrabold text-slate-900">Formulating Progressive Planning Waves...</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Generating Wave 1 (Foundation) through Wave 5 (QA) agenda proposals while recording AI assumptions...
                </p>
              </div>
            )}

            {/* STEP 3: Review Generated Waves */}
            {builderStep === 'REVIEW_WAVES' && (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900">
                  <strong className="font-extrabold block">Generated Progressive Wave Proposals</strong>
                  <p className="text-emerald-800 text-[11px]">
                    Submitting these wave proposals will place them into the <strong>Proposed Updates queue</strong> for Husni Hasan supervisor approval.
                  </p>
                </div>

                {builderAssumptions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                    <span className="font-bold text-[10px] font-mono uppercase block">AI Planning Assumptions Recorded:</span>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      {builderAssumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-4">
                  {generatedWaves.map((wave, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <strong className="font-extrabold text-indigo-900 block font-mono text-[11px]">
                        {wave.waveName} ({wave.items.length} items)
                      </strong>

                      <div className="space-y-1.5">
                        {wave.items.map((it, i) => (
                          <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                            <div>
                              <strong className="text-slate-800">{it.taskTitle}</strong>
                              <div className="text-[10px] text-slate-500">{it.workstream} • Deliverable: {it.expectedDeliverable}</div>
                            </div>

                            <span className="bg-amber-100 text-amber-900 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                              PROPOSED
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setBuilderStep('OPTIONAL_INPUT')}
                    className="text-xs text-slate-500 font-bold hover:underline"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleSubmitWavesAsProposals}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>SUBMIT WAVE PROPOSALS FOR HUSNI REVIEW</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL 2: Add Project Input / Source Material Modal */}
      {isAddInputModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <PlusCircle className="h-5 w-5 text-emerald-600" />
                  <span>ADD SOURCE / MATERIAL TO EXISTING PROJECT</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Attach or paste source materials. C-Bridge AI will analyze the content before suggesting agenda updates.
                </p>
              </div>
              <button onClick={() => setIsAddInputModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Selection Tabs */}
            <div>
              <label className="font-bold text-slate-700 block text-xs mb-1.5">1. Select Attachment Mode:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(['UPLOAD FILE', 'PASTE TEXT', 'ADD LINK / REFERENCE', 'ADD NOTES'] as SourceAttachmentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAttachmentMode(mode)}
                    className={`p-2.5 rounded-xl border font-bold flex flex-col items-center justify-center text-center space-y-1 transition cursor-pointer ${
                      attachmentMode === mode
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mode === 'UPLOAD FILE' && <FileUp className="h-4 w-4" />}
                    {mode === 'PASTE TEXT' && <FileText className="h-4 w-4" />}
                    {mode === 'ADD LINK / REFERENCE' && <ExternalLink className="h-4 w-4" />}
                    {mode === 'ADD NOTES' && <AlignLeft className="h-4 w-4" />}
                    <span className="text-[10px] uppercase font-mono">{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveProjectInput} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Source Type Classification:</label>
                  <select
                    value={inputType}
                    onChange={(e) => setInputType(e.target.value as ProjectInputType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="SYLLABUS">SYLLABUS</option>
                    <option value="MSU MATERIAL">MSU MATERIAL</option>
                    <option value="TRAINING MATERIAL">TRAINING MATERIAL</option>
                    <option value="REGULATORY SOURCE">REGULATORY SOURCE</option>
                    <option value="RESEARCH">RESEARCH</option>
                    <option value="MEETING OUTCOME">MEETING OUTCOME</option>
                    <option value="CONSULTATION OUTCOME">CONSULTATION OUTCOME</option>
                    <option value="EXISTING DOCUMENT">EXISTING DOCUMENT</option>
                    <option value="MEMBER REPORT">MEMBER REPORT</option>
                    <option value="LEARNING HANDOFF">LEARNING HANDOFF</option>
                    <option value="HUSNI DIRECTION">HUSNI DIRECTION</option>
                    <option value="EXTERNAL TECHNICAL INPUT">EXTERNAL TECHNICAL INPUT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Title / Subject Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FSPCA FSVP Chapter 4 Hazard Rules"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Attachment-Specific Fields */}
              {attachmentMode === 'UPLOAD FILE' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".docx,.doc,.pdf,.txt,.png,.jpg,.jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf,text/plain,image/png,image/jpeg"
                    className="hidden"
                  />

                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-2 cursor-pointer transition ${
                        isDragging ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'
                      }`}
                    >
                      <Upload className="h-9 w-9 text-indigo-600 mx-auto" />
                      <div className="text-xs font-extrabold text-slate-800">
                        Drag & Drop or Choose Local File
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Supported for real C-Bridge AI analysis: <strong>Word DOCX, PDF, TXT, PNG, JPG</strong> (Max 50MB)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                          <FileCheck className="h-4 w-4 text-emerald-600" />
                          <span>SELECTED FILE</span>
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded font-mono">
                          REAL FILE READY
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-500 text-[10px] block font-mono">FILE NAME</span>
                          <span className="font-bold text-slate-900 truncate block" title={selectedFile.name}>
                            {selectedFile.name}
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-500 text-[10px] block font-mono">FILE TYPE</span>
                          <span className="font-bold text-slate-800 font-mono block">
                            {selectedFile.type || 'Unknown'}
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-slate-500 text-[10px] block font-mono">FILE SIZE</span>
                          <span className="font-bold text-slate-800 font-mono block">
                            {formatFileSize(selectedFile.size)}
                          </span>
                        </div>
                      </div>

                      {fileValidationError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <strong className="font-bold block">File Type Disabled</strong>
                            <p className="text-[11px] leading-tight">{fileValidationError}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                          <span>REPLACE FILE</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs flex items-center space-x-1 cursor-pointer transition"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                          <span>REMOVE FILE</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {attachmentMode === 'PASTE TEXT' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paste Source Text Content:</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Paste full text excerpt, syllabus section, or regulatory rule text..."
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden font-mono text-[11px]"
                  />
                </div>
              )}

              {attachmentMode === 'ADD LINK / REFERENCE' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Web URL / Database Citation Reference:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. https://www.fda.gov/food/guidance-regulation-food-articles"
                      value={inputRef}
                      onChange={(e) => setInputRef(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Reference Notes / Context:</label>
                    <textarea
                      rows={2}
                      placeholder="Brief context regarding this reference..."
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {attachmentMode === 'ADD NOTES' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Supervisor / Member Notes:</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Record meeting outcomes, consultation decisions, or supervisor guidance..."
                      value={inputNotes}
                      onChange={(e) => {
                        setInputNotes(e.target.value);
                        setInputContent(e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* General Summary / Context fallback if not PASTE TEXT */}
              {attachmentMode !== 'PASTE TEXT' && attachmentMode !== 'ADD NOTES' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Short Description / Excerpt Summary:</label>
                  <textarea
                    rows={2}
                    placeholder="Provide brief context for C-Bridge AI analysis..."
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>C-Bridge Protocol:</strong> Clicking <strong>SAVE & ANALYZE INPUT</strong> sends actual file/document content for secure server-side Gemini analysis. The active Master Agenda is <strong>never modified automatically</strong>.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddInputModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isAnalyzingFile ||
                    (attachmentMode === 'UPLOAD FILE' && (!selectedFile || !!fileValidationError)) ||
                    !inputTitle.trim()
                  }
                  className={`font-extrabold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 transition ${
                    isAnalyzingFile || (attachmentMode === 'UPLOAD FILE' && (!selectedFile || !!fileValidationError)) || !inputTitle.trim()
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  }`}
                >
                  {isAnalyzingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>ANALYZING CONTENT WITH GEMINI AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span>SAVE & ANALYZE INPUT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2B: C-BRIDGE AI SOURCE ANALYSIS & HUSNI REVIEW MODAL */}
      {analyzingSource && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="bg-indigo-600 text-white font-extrabold px-2.5 py-0.5 rounded">
                    C-BRIDGE AI SOURCE ANALYSIS
                  </span>
                  <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                    {analyzingSource.type}
                  </span>
                  {analyzingSource.type === 'MSU MATERIAL' && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded text-[10px]">
                      PROTECTED ACADEMIC LEARNING MATERIAL
                    </span>
                  )}
                  <span className="text-slate-400">{analyzingSource.id}</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Analysis Results: {analyzingSource.title}
                </h3>
              </div>

              <button
                onClick={() => setAnalyzingSource(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Analysis Verification Status Banner */}
            {analyzingSource.fileAnalysisVerified ? (
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2 font-mono text-xs font-extrabold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>
                      {analyzingSource.fileName?.toLowerCase().endsWith('.docx') || analyzingSource.fileName?.toLowerCase().endsWith('.doc') || analyzingSource.fileType?.includes('word')
                        ? 'WORD DOCUMENT CONTENT: PROCESSED'
                        : 'DOCUMENT CONTENT: PROCESSED'}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded font-mono font-bold">
                    AI EXTRACTION
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block">FILE NAME</span>
                    <span className="font-bold text-slate-100 truncate block" title={analyzingSource.fileName || analyzingSource.title}>
                      {analyzingSource.fileName || analyzingSource.title}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block">FILE SIZE</span>
                    <span className="font-bold text-slate-200 block">
                      {analyzingSource.fileSize || 'Attached File'}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block">DOCUMENT TYPE</span>
                    <span className="font-bold text-amber-300 block">
                      {analyzingSource.fileName?.toLowerCase().endsWith('.docx') || analyzingSource.fileName?.toLowerCase().endsWith('.doc') || analyzingSource.fileType?.includes('word')
                        ? 'Microsoft Word DOCX'
                        : analyzingSource.fileType || 'Document'}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block">PROCESSING METHOD</span>
                    <span className="font-bold text-indigo-300 block truncate" title={analyzingSource.processingMethod || analyzingSource.aiAnalysis?.processingMethod || 'DOCX CONTENT EXTRACTION'}>
                      {analyzingSource.processingMethod || analyzingSource.aiAnalysis?.processingMethod || 'DOCX CONTENT EXTRACTION'}
                    </span>
                  </div>
                </div>

                {(analyzingSource.documentStructureSummary || analyzingSource.aiAnalysis?.documentStructureSummary) && (
                  <div className="text-[11px] text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 flex items-start space-x-2">
                    <FileCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Extracted Document Structure:</strong> {analyzingSource.documentStructureSummary || analyzingSource.aiAnalysis?.documentStructureSummary}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-rose-950 text-white rounded-2xl p-5 space-y-3 border border-rose-800 shadow-md">
                <div className="flex items-center space-x-2 text-rose-300 font-extrabold font-mono text-sm">
                  <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                  <span>
                    {analyzingSource.fileName?.toLowerCase().endsWith('.docx') || analyzingSource.fileName?.toLowerCase().endsWith('.doc')
                      ? 'WORD DOCUMENT PROCESSING FAILED'
                      : 'DOCUMENT PROCESSING FAILED'}
                  </span>
                </div>
                <p className="text-xs text-rose-200">
                  {analyzingSource.fileAnalysisFailedReason || "Actual Word document content could not be extracted or processed."}
                </p>
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setAnalyzingSource(null);
                      setIsAddInputModalOpen(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer transition shadow-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>RETRY / REPLACE FILE</span>
                  </button>
                  <button
                    onClick={() => setAnalyzingSource(null)}
                    className="px-4 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-bold text-xs rounded-xl border border-rose-700 cursor-pointer transition"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {analyzingSource.aiAnalysis && (
              <>
                {/* AI Summary Box */}
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-900 text-xs flex items-center space-x-1.5">
                      <Zap className="h-4 w-4 text-indigo-600" />
                      <span>AI Structural Summary & Relevance Assessment</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono ${
                      analyzingSource.aiAnalysis.relevance === 'HIGH'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                    }`}>
                      RELEVANCE: {analyzingSource.aiAnalysis.relevance}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    {analyzingSource.aiAnalysis.summary}
                  </p>
                </div>

                {/* Clearly Distinguished C-Bridge Analysis Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* BLOCK 1: SOURCE-DERIVED INFORMATION */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-extrabold text-slate-900 block font-mono text-[11px] uppercase tracking-wider text-indigo-900 flex items-center space-x-1">
                      <FileCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>SOURCE-DERIVED INFORMATION</span>
                    </span>
                    
                    {analyzingSource.aiAnalysis.mainTopics && analyzingSource.aiAnalysis.mainTopics.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block">Main Topics</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {analyzingSource.aiAnalysis.mainTopics.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analyzingSource.aiAnalysis.keyConcepts && analyzingSource.aiAnalysis.keyConcepts.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block">Key Concepts</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {analyzingSource.aiAnalysis.keyConcepts.map((k, i) => (
                            <li key={i}>{k}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analyzingSource.aiAnalysis.relevantSections && analyzingSource.aiAnalysis.relevantSections.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block">Relevant Sections</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {analyzingSource.aiAnalysis.relevantSections.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* BLOCK 2: AI INTERPRETATION */}
                  <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200/80 space-y-2">
                    <span className="font-extrabold text-indigo-950 block font-mono text-[11px] uppercase tracking-wider flex items-center space-x-1">
                      <Brain className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>AI INTERPRETATION</span>
                    </span>

                    {analyzingSource.aiAnalysis.projectRelevance && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-indigo-800 font-mono uppercase block">Phase 1 Project Impact</span>
                        <p className="text-[11px] text-slate-800 leading-tight">
                          {analyzingSource.aiAnalysis.projectRelevance}
                        </p>
                      </div>
                    )}

                    {analyzingSource.aiAnalysis.learningOpportunities && analyzingSource.aiAnalysis.learningOpportunities.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-indigo-200/60">
                        <span className="text-[10px] font-bold text-indigo-800 font-mono uppercase block">Learning Opportunities</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {analyzingSource.aiAnalysis.learningOpportunities.map((l, i) => (
                            <li key={i}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analyzingSource.aiAnalysis.risksAndLimitations && analyzingSource.aiAnalysis.risksAndLimitations.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-indigo-200/60">
                        <span className="text-[10px] font-bold text-indigo-800 font-mono uppercase block">Compliance Risks Identified</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                          {analyzingSource.aiAnalysis.risksAndLimitations.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* BLOCK 3: AI RECOMMENDATION */}
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                    <span className="font-extrabold text-emerald-950 block font-mono text-[11px] uppercase tracking-wider flex items-center space-x-1">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>AI RECOMMENDATION</span>
                    </span>

                    {analyzingSource.aiAnalysis.possibleTasks && analyzingSource.aiAnalysis.possibleTasks.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 font-mono uppercase block">Possible Deliverable Tasks</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-800 text-[11px]">
                          {analyzingSource.aiAnalysis.possibleTasks.map((task, i) => (
                            <li key={i}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analyzingSource.aiAnalysis.possibleAssetIdeas && analyzingSource.aiAnalysis.possibleAssetIdeas.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-emerald-200/60">
                        <span className="text-[10px] font-bold text-emerald-800 font-mono uppercase block">Possible C-Bridge Assets</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-800 text-[11px]">
                          {analyzingSource.aiAnalysis.possibleAssetIdeas.map((asset, i) => (
                            <li key={i}>{asset}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analyzingSource.aiAnalysis.potentialMasterAgendaImpact && (
                      <div className="space-y-1 pt-1 border-t border-emerald-200/60">
                        <span className="text-[10px] font-bold text-emerald-800 font-mono uppercase block">Master Agenda Impact</span>
                        <p className="text-[11px] text-slate-800 leading-tight">
                          {analyzingSource.aiAnalysis.potentialMasterAgendaImpact}
                        </p>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between font-mono text-[10px] text-emerald-900 font-bold">
                      <span>AI CONFIDENCE:</span>
                      <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded">
                        {analyzingSource.aiAnalysis.aiConfidence || 95}%
                      </span>
                    </div>
                  </div>
                </div>

            {/* Potential Impact Matrix across 10 Categories */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Sliders className="h-4 w-4 text-slate-600" />
                <span>Potential Impact Matrix Across 10 Operational Categories</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {analyzingSource.aiAnalysis.potentialImpacts.map((imp, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-start space-x-2 ${
                      imp.applicable
                        ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {imp.applicable ? (
                        <CheckCircle2 className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="font-extrabold block text-[11px] font-mono">
                        {imp.category}
                      </span>
                      <p className="text-[11px] leading-tight mt-0.5">{imp.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key AI Findings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block font-mono text-[11px]">
                  NEW INFORMATION DETECTED
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  {analyzingSource.aiAnalysis.newInformationDetected.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block font-mono text-[11px]">
                  POSSIBLE NEW DELIVERABLE TASKS
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  {analyzingSource.aiAnalysis.possibleNewTasks.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* HUSNI REVIEW ACTION SECTION */}
            <div className="bg-purple-900 text-white p-5 rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-purple-700 pb-2">
                <span className="bg-purple-700 text-purple-200 text-[10px] font-mono px-2.5 py-0.5 rounded font-extrabold uppercase">
                  Husni Supervisor Review Action Panel
                </span>
                <span className="text-[11px] text-purple-300 italic font-mono">
                  Rule: AI never silently modifies the Master Agenda
                </span>
              </div>

              <div>
                <label className="font-bold text-purple-100 block text-xs mb-2">
                  How should C-Bridge use this input?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: 'USE AI RECOMMENDATION', label: 'Use AI Rec' },
                    { key: 'ADD COMMENT / DIRECTION', label: 'Add Comment' },
                    { key: 'ASK AI A QUESTION', label: 'Ask AI' },
                    { key: 'DO NOT AFFECT AGENDA', label: 'Do Not Affect' },
                    { key: 'DEFER', label: 'Defer' },
                    { key: 'GENERATE AGENDA UPDATE PROPOSAL', label: 'Generate Proposal' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setHusniDirectionOption(opt.key as any)}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] transition cursor-pointer border ${
                        husniDirectionOption === opt.key
                          ? 'bg-amber-400 text-purple-950 border-amber-300 font-extrabold shadow-xs'
                          : 'bg-purple-800 text-purple-200 border-purple-700 hover:bg-purple-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Natural Language Direction Box */}
              <div>
                <label className="font-bold text-purple-200 block text-xs mb-1">
                  Optional Supervisor Instructions / Custom Guidance for C-Bridge AI:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ensure Wave 2 includes supplier audit checklist based on Chapter 4 rules..."
                  value={husniDirectionCustomText}
                  onChange={(e) => setHusniDirectionCustomText(e.target.value)}
                  className="w-full bg-purple-950/80 border border-purple-700 rounded-xl p-2.5 text-purple-100 placeholder-purple-400 text-xs focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAnalyzingSource(null)}
                  className="text-xs text-purple-300 hover:text-white font-medium underline"
                >
                  Keep Source in Register Only (No Agenda Action)
                </button>

                <button
                  type="button"
                  disabled={isGeneratingProposal}
                  onClick={() => handleGenerateProposalFromAnalysis(analyzingSource)}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer transition"
                >
                  {isGeneratingProposal ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      <span>GENERATING AGENDA PROPOSAL...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-purple-950" />
                      <span>GENERATE AGENDA UPDATE PROPOSAL</span>
                    </>
                  )}
                </button>
              </div>

              {/* Display Generated Proposal Status if generated */}
              {generatedProposalFromAnalysis && (
                <div className="bg-emerald-950/90 border border-emerald-500 p-3.5 rounded-xl text-emerald-200 text-xs space-y-2 mt-3 animate-fade-in">
                  <div className="flex items-center space-x-2 font-bold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Agenda Update Proposal Generated Successfully!</span>
                  </div>
                  <p className="text-[11px] text-emerald-100">
                    Proposal ID: <strong>{generatedProposalFromAnalysis.id}</strong> has been created and placed in the <strong>Proposed Updates Queue</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setAnalyzingSource(null);
                      setActiveTab('PROPOSALS');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer"
                  >
                    Go to Proposed Updates Queue to Confirm & Activate
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )}

      {/* MODAL 2C: MULTI-SOURCE AI CO-ANALYSIS MODAL */}
      {isCoAnalysisModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Multi-Source Joint AI Co-Analysis ({selectedSourceIds.length} Sources Selected)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Synthesize requirements across multiple intake materials simultaneously.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCoAnalysisModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-800 font-mono uppercase block">Selected Sources for Synthesis:</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {projectInputsFiltered.filter((s) => selectedSourceIds.includes(s.id)).map((s) => (
                  <div key={s.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900">{s.title}</strong>
                      <span className="text-slate-400 text-[10px] ml-2">({s.type})</span>
                    </div>
                    <span className="bg-indigo-100 text-indigo-900 font-bold text-[10px] px-2 py-0.5 rounded font-mono">
                      {s.id}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Joint Supervisor Direction / Focus Area:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Combine FDA rules with internal syllabus to create unified Wave 2 task..."
                  value={jointHusniDirection}
                  onChange={(e) => setJointHusniDirection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCoAnalysisModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGenerateJointProposalFromSources}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>GENERATE SYNTHESIZED MASTER AGENDA PROPOSAL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Proposal Review / Comment Modal */}
      {reviewingProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Husni Supervisor Decision & Comment
              </h3>
              <button onClick={() => setReviewingProposal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block font-bold">
                {reviewingProposal.proposedItem?.taskTitle || reviewingProposal.existingItemAffectedTitle}
              </strong>
              <p className="text-slate-600">{reviewingProposal.reasonForChange}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supervisor Comment / Guidance:</label>
                <textarea
                  rows={3}
                  placeholder="Enter supervisor guidance or modification instructions..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setReviewingProposal(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl text-xs"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    onReviewAgendaUpdateProposal(reviewingProposal.id, 'ACCEPTED_WITH_COMMENT', reviewComment);
                    setReviewingProposal(null);
                    setReviewComment('');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl"
                >
                  Accept with Comment & Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: New Manual Agenda Item Modal */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Add Confirmed Master Agenda Item</h3>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Planning Wave:</label>
                <select
                  value={newItemWave}
                  onChange={(e) => setNewItemWave(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                >
                  <option value="WAVE 1 — Foundation">WAVE 1 — Foundation</option>
                  <option value="WAVE 2 — Capability Dev">WAVE 2 — Capability Dev</option>
                  <option value="WAVE 3 — Application & Testing">WAVE 3 — Application & Testing</option>
                  <option value="WAVE 4 — Assets & Communication">WAVE 4 — Assets & Communication</option>
                  <option value="WAVE 5 — QA & Review">WAVE 5 — QA & Review</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Item Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Formulate Foreign Supplier Qualification Form"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category:</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as MasterAgendaCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="PHASE">PHASE</option>
                    <option value="WORKSTREAM">WORKSTREAM</option>
                    <option value="TASK">TASK</option>
                    <option value="LEARNING TASK">LEARNING TASK</option>
                    <option value="ASSET DEVELOPMENT TASK">ASSET DEVELOPMENT TASK</option>
                    <option value="QA / REVIEW">QA / REVIEW</option>
                    <option value="SUPERVISOR ACTION">SUPERVISOR ACTION</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority:</label>
                  <select
                    value={newItemPriority}
                    onChange={(e) => setNewItemPriority(e.target.value as PriorityLevel)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="P1 — DECISION / APPROVAL REQUIRED">P1 — DECISION REQUIRED</option>
                    <option value="P2 — BLOCKING">P2 — BLOCKING</option>
                    <option value="P3 — TIME-SENSITIVE">P3 — TIME-SENSITIVE</option>
                    <option value="P4 — NORMAL EXECUTION">P4 — NORMAL EXECUTION</option>
                    <option value="P5 — LEARNING / DEVELOPMENT">P5 — LEARNING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Objective:</label>
                <textarea
                  rows={2}
                  placeholder="Clear operational goal for this deliverable..."
                  value={newItemObjective}
                  onChange={(e) => setNewItemObjective(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-xs"
                >
                  Add Active Master Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Traceability View Modal */}
      {traceabilityItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <span>Governance & Evidence Traceability</span>
              </h3>
              <button onClick={() => setTraceabilityItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 space-y-1">
                <span className="font-bold text-indigo-950 block">{traceabilityItem.taskTitle}</span>
                <span className="text-[11px] font-mono text-indigo-700">ID: {traceabilityItem.id} • Wave: {traceabilityItem.planningWave || 'WAVE 1'}</span>
              </div>

              <div className="space-y-2 text-slate-700">
                <div>
                  <strong className="block text-slate-900">Evidence Upload Requirement:</strong>
                  <p className="bg-slate-50 p-2 rounded border border-slate-200 mt-0.5">{traceabilityItem.evidenceRequirement}</p>
                </div>

                <div>
                  <strong className="block text-slate-900">QA Compliance Audit Rule:</strong>
                  <p className="bg-slate-50 p-2 rounded border border-slate-200 mt-0.5">{traceabilityItem.qaRequirement}</p>
                </div>

                <div>
                  <strong className="block text-slate-900">Supervisor Authority & Sign-Off:</strong>
                  <p className="bg-slate-50 p-2 rounded border border-slate-200 mt-0.5">{traceabilityItem.supervisorReviewRequirement}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setTraceabilityItem(null)}
                className="bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Close Traceability
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: New Project Creation Modal with Optional Project Overview */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                    NEW PROJECT INTAKE
                  </span>
                  {newProjectStep === 'ORIGIN_INTAKE' && (
                    <span className="text-xs font-medium text-indigo-600 font-bold">Step 1: Project Origin Classification</span>
                  )}
                  {newProjectStep === 'OVERVIEW_INTAKE' && (
                    <span className="text-xs font-medium text-slate-500 font-bold">Step 2: Optional Overview Context</span>
                  )}
                  {newProjectStep === 'INTAKE_SOURCES' && (
                    <span className="text-xs font-medium text-amber-600 font-bold">Step 3: Initial Project Sources / Materials</span>
                  )}
                  {newProjectStep === 'UNDERSTANDING_REVIEW' && (
                    <span className="text-xs font-medium text-indigo-600 font-bold">Step 4: C-Bridge AI Project Understanding</span>
                  )}
                  {newProjectStep === 'CONFIRM_DEFINITION' && (
                    <span className="text-xs font-medium text-emerald-600 font-bold">Step 5: Confirm Project Definition</span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {newProjectStep === 'ORIGIN_INTAKE' && 'STEP 1 — PROJECT ORIGIN'}
                  {newProjectStep === 'OVERVIEW_INTAKE' && 'STEP 2 — PROJECT OVERVIEW / CONTEXT (OPTIONAL)'}
                  {newProjectStep === 'INTAKE_SOURCES' && 'STEP 3 — INITIAL PROJECT SOURCES / MATERIALS'}
                  {newProjectStep === 'UNDERSTANDING_REVIEW' && 'STEP 4 — AI UNDERSTANDING REVIEW'}
                  {newProjectStep === 'CONFIRM_DEFINITION' && 'STEP 5 — PROJECT DEFINITION & INITIALIZATION'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* STEP 1: PROJECT ORIGIN */}
            {newProjectStep === 'ORIGIN_INTAKE' && (
              <div className="space-y-5 text-xs">
                {/* Description Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>PROJECT ORIGIN CLASSIFICATION</span>
                  </div>
                  <p className="leading-relaxed">
                    Select how this project is starting. <strong>Project Origin describes how the project started — it does NOT restrict what the project may later contain.</strong>
                  </p>
                </div>

                {/* Origin Options Grid */}
                <div>
                  <label className="font-extrabold text-slate-800 block mb-2 uppercase tracking-wider text-[11px]">
                    Select Primary Project Origin:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {[
                      { key: 'COURSE / ACADEMIC PROGRAM', label: 'Course / Academic Program', desc: 'University, certification, or academic program' },
                      { key: 'TRAINING PROGRAM', label: 'Training Program', desc: 'Structured professional training workshop or course' },
                      { key: 'RESEARCH', label: 'Research', desc: 'Targeted research question or knowledge gap study' },
                      { key: 'REGULATION / STANDARD', label: 'Regulation / Standard', desc: 'New regulatory mandate, rule update, or standard' },
                      { key: 'CAPABILITY DEVELOPMENT', label: 'Capability Development', desc: 'Internal C-Bridge capability expansion' },
                      { key: 'COMPANY DEVELOPMENT', label: 'Company Development', desc: 'Internal operations, web, marketing, or governance' },
                      { key: 'MARKET OPPORTUNITY', label: 'Market Opportunity', desc: 'Identified client or commercial market gap' },
                      { key: 'CONFERENCE / PROFESSIONAL INPUT', label: 'Conference / Input', desc: 'Event, webinar, or member recommendation' },
                      { key: 'CLIENT-DERIVED DEVELOPMENT NEED', label: 'Client-Derived Need', desc: 'Observed client engagement problem or gap' },
                      { key: 'HUSNI DIRECTION', label: 'Husni Direction', desc: 'Direct strategic directive from Husni Hasan' },
                      { key: 'OTHER', label: 'Other Origin', desc: 'Custom or unclassified project origin' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSelectedOrigin(item.key as ProjectOrigin)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer space-y-1 ${
                          selectedOrigin === item.key
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-black text-xs ${selectedOrigin === item.key ? 'text-indigo-900' : 'text-slate-900'}`}>
                            {item.label}
                          </span>
                          {selectedOrigin === item.key && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tailored Context Form for Selected Origin */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <span>OPTIONAL ORIGIN CONTEXT DETAILS: {selectedOrigin}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">All fields optional</span>
                  </div>

                  {selectedOrigin === 'COURSE / ACADEMIC PROGRAM' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Course / Program Name:</label>
                          <input
                            type="text"
                            placeholder="e.g. Master of Food Safety & FSVP Practice"
                            value={originContext.courseName || ''}
                            onChange={(e) => setOriginContext({ ...originContext, courseName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Provider / Institution:</label>
                          <input
                            type="text"
                            placeholder="e.g. FSPCA / University / Online Academy"
                            value={originContext.providerInstitution || ''}
                            onChange={(e) => setOriginContext({ ...originContext, providerInstitution: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Course Purpose / Description:</label>
                        <textarea
                          rows={2}
                          placeholder="What does this course cover and why is C-Bridge studying it?"
                          value={originContext.coursePurposeDescription || ''}
                          onChange={(e) => setOriginContext({ ...originContext, coursePurposeDescription: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Start Date:</label>
                          <input
                            type="date"
                            value={originContext.startDate || ''}
                            onChange={(e) => setOriginContext({ ...originContext, startDate: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">End Date:</label>
                          <input
                            type="date"
                            value={originContext.endDate || ''}
                            onChange={(e) => setOriginContext({ ...originContext, endDate: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Study Duration:</label>
                          <input
                            type="text"
                            placeholder="e.g. 12 weeks"
                            value={originContext.expectedStudyDuration || ''}
                            onChange={(e) => setOriginContext({ ...originContext, expectedStudyDuration: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Hours / Week:</label>
                          <input
                            type="text"
                            placeholder="e.g. 10 hrs"
                            value={originContext.availableStudyHoursPerWeek || ''}
                            onChange={(e) => setOriginContext({ ...originContext, availableStudyHoursPerWeek: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Known Modules:</label>
                          <input
                            type="text"
                            placeholder="e.g. 8 modules"
                            value={originContext.knownNumberOfModules || ''}
                            onChange={(e) => setOriginContext({ ...originContext, knownNumberOfModules: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Related C-Bridge Capability:</label>
                        <input
                          type="text"
                          placeholder="e.g. U.S. Food Import & FSVP Development"
                          value={originContext.relatedCapability || ''}
                          onChange={(e) => setOriginContext({ ...originContext, relatedCapability: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'TRAINING PROGRAM' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Training Program Name:</label>
                          <input
                            type="text"
                            placeholder="e.g. Advanced Preventive Controls Lead Instructor Training"
                            value={originContext.trainingName || ''}
                            onChange={(e) => setOriginContext({ ...originContext, trainingName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Training Provider:</label>
                          <input
                            type="text"
                            placeholder="e.g. IFPTI / FSPCA"
                            value={originContext.trainingProvider || ''}
                            onChange={(e) => setOriginContext({ ...originContext, trainingProvider: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Training Purpose & Format:</label>
                        <textarea
                          rows={2}
                          placeholder="Specify workshop goals, format (online / in-person), and target outcomes..."
                          value={originContext.trainingPurpose || ''}
                          onChange={(e) => setOriginContext({ ...originContext, trainingPurpose: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'RESEARCH' && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Research Topic & Question:</label>
                        <input
                          type="text"
                          placeholder="e.g. FDA Enforcement Trends in Foreign Supplier Audits 2025-2026"
                          value={originContext.researchTopic || ''}
                          onChange={(e) => setOriginContext({ ...originContext, researchTopic: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Why C-Bridge Is Researching This & Expected Outcome:</label>
                        <textarea
                          rows={2}
                          placeholder="Explain research motivation, current knowledge gap, and desired deliverable..."
                          value={originContext.whyResearchingThis || ''}
                          onChange={(e) => setOriginContext({ ...originContext, whyResearchingThis: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'REGULATION / STANDARD' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Regulation / Standard Name:</label>
                          <input
                            type="text"
                            placeholder="e.g. 21 CFR Part 1 Subpart L — FSVP Regulation"
                            value={originContext.regulationName || ''}
                            onChange={(e) => setOriginContext({ ...originContext, regulationName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Jurisdiction & Authority:</label>
                          <input
                            type="text"
                            placeholder="e.g. U.S. FDA / Department of HHS"
                            value={originContext.regulatoryAuthority || ''}
                            onChange={(e) => setOriginContext({ ...originContext, regulatoryAuthority: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Why It Matters to C-Bridge & Requirement Changes:</label>
                        <textarea
                          rows={2}
                          placeholder="Specify compliance requirements, regulatory changes, or C-Bridge service implications..."
                          value={originContext.whyItMatters || ''}
                          onChange={(e) => setOriginContext({ ...originContext, whyItMatters: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'CAPABILITY DEVELOPMENT' && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Capability Name & Gap:</label>
                        <input
                          type="text"
                          placeholder="e.g. Foreign Supplier FSVP Protocol Verification & Audit Support"
                          value={originContext.capabilityName || ''}
                          onChange={(e) => setOriginContext({ ...originContext, capabilityName: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Development Objective & Service Relevance:</label>
                        <textarea
                          rows={2}
                          placeholder="Describe current knowledge, missing capability, and commercial consulting goal..."
                          value={originContext.developmentObjective || ''}
                          onChange={(e) => setOriginContext({ ...originContext, developmentObjective: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'COMPANY DEVELOPMENT' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Development Area:</label>
                          <input
                            type="text"
                            placeholder="e.g. C-Bridge Client Portal & Digital Intake"
                            value={originContext.companyDevelopmentArea || ''}
                            onChange={(e) => setOriginContext({ ...originContext, companyDevelopmentArea: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Affected Operating Area:</label>
                          <select
                            value={originContext.affectedArea || 'Internal Process'}
                            onChange={(e) => setOriginContext({ ...originContext, affectedArea: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden cursor-pointer"
                          >
                            <option value="Website & Digital Presence">Website & Digital Presence</option>
                            <option value="Marketing & Brand">Marketing & Brand</option>
                            <option value="Operations & Workflows">Operations & Workflows</option>
                            <option value="Technology & Infrastructure">Technology & Infrastructure</option>
                            <option value="Governance & QA">Governance & QA</option>
                            <option value="Client Portal">Client Portal</option>
                            <option value="Internal Process">Internal Process</option>
                            <option value="Business Development">Business Development</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Problem / Opportunity & Desired Outcome:</label>
                        <textarea
                          rows={2}
                          placeholder="Describe the company development need..."
                          value={originContext.problemOpportunity || ''}
                          onChange={(e) => setOriginContext({ ...originContext, problemOpportunity: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'MARKET OPPORTUNITY' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Opportunity Name & Geography:</label>
                          <input
                            type="text"
                            placeholder="e.g. Middle East Exporters to U.S. FDA Compliance"
                            value={originContext.opportunityName || ''}
                            onChange={(e) => setOriginContext({ ...originContext, opportunityName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">How Identified & Evidence:</label>
                          <input
                            type="text"
                            placeholder="e.g. Industry trade inquiries, FDA import alert trends"
                            value={originContext.howIdentified || ''}
                            onChange={(e) => setOriginContext({ ...originContext, howIdentified: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'CONFERENCE / PROFESSIONAL INPUT' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Conference / Event Name:</label>
                          <input
                            type="text"
                            placeholder="e.g. 2026 Global Food Safety & FSVP Summit"
                            value={originContext.conferenceName || ''}
                            onChange={(e) => setOriginContext({ ...originContext, conferenceName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 block mb-1">Participant / Member:</label>
                          <input
                            type="text"
                            placeholder="e.g. Samar Baydoun"
                            value={originContext.participantMember || ''}
                            onChange={(e) => setOriginContext({ ...originContext, participantMember: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Key Observations & Recommendation:</label>
                        <textarea
                          rows={2}
                          placeholder="What was learned at the event and what opportunity was recommended?"
                          value={originContext.keyObservation || ''}
                          onChange={(e) => setOriginContext({ ...originContext, keyObservation: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'CLIENT-DERIVED DEVELOPMENT NEED' && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Client Engagement Context:</label>
                        <input
                          type="text"
                          placeholder="e.g. Client X Import Clearance Delay under FSVP Verification"
                          value={originContext.clientContext || ''}
                          onChange={(e) => setOriginContext({ ...originContext, clientContext: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Observed Need & Asset / Process Gap:</label>
                        <textarea
                          rows={2}
                          placeholder="What gap was observed during the engagement and how does it benefit C-Bridge generally?"
                          value={originContext.observedNeed || ''}
                          onChange={(e) => setOriginContext({ ...originContext, observedNeed: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'HUSNI DIRECTION' && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Husni Direction & Instructions:</label>
                        <textarea
                          rows={3}
                          placeholder="Direct supervisor strategic instructions and requirements..."
                          value={originContext.husniDirectionInstructions || ''}
                          onChange={(e) => setOriginContext({ ...originContext, husniDirectionInstructions: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrigin === 'OTHER' && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Origin Description / Explanation:</label>
                        <textarea
                          rows={3}
                          placeholder="Describe how this project is starting..."
                          value={originContext.otherDescription || ''}
                          onChange={(e) => setOriginContext({ ...originContext, otherDescription: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Shared optional fields: Source links, notes, capability developer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Source Links / Document References (Optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. https://www.fda.gov/fsvp-guidance or Course URL"
                        value={originContext.linksOrReferences || ''}
                        onChange={(e) => setOriginContext({ ...originContext, linksOrReferences: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Potential Capability Developer (Optional):
                      </label>
                      <select
                        value={potentialCapabilityDeveloper}
                        onChange={(e) => setPotentialCapabilityDeveloper(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden cursor-pointer"
                      >
                        <option value="">Unassigned (Assign Capability Developer Later)</option>
                        <option value="Samar Baydoun">Samar Baydoun</option>
                        <option value="Husni Hasan">Husni Hasan</option>
                      </select>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Capability Developer assignment is OPTIONAL. Husni may create the project now and assign a Developer later.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setNewProjectStep('CONFIRM_DEFINITION')}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>SKIP TO PROJECT DEFINITION →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProjectStep('OVERVIEW_INTAKE')}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                  >
                    <span>PROCEED TO STEP 2: PROJECT OVERVIEW CONTEXT →</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: OVERVIEW INTAKE */}
            {newProjectStep === 'OVERVIEW_INTAKE' && (
              <div className="space-y-4 text-xs">
                {/* Selected Origin Classification Badge */}
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 flex items-center justify-between text-indigo-950">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-200/60 text-indigo-900">
                      PROJECT ORIGIN
                    </span>
                    <span className="font-extrabold text-xs">{selectedOrigin}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProjectStep('ORIGIN_INTAKE')}
                    className="text-indigo-700 hover:text-indigo-900 font-bold underline text-[11px] cursor-pointer"
                  >
                    Change Origin
                  </button>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">Purpose of Project Overview:</p>
                  <p className="leading-relaxed">
                    Allow Husni to provide a document or description that helps C-Bridge AI understand the overall project before proposing the project definition and Master Agenda.
                  </p>
                  <div className="flex items-center space-x-1.5 text-indigo-700 font-bold pt-1">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Project Overview is OPTIONAL. Creation will not be blocked if no overview is supplied.</span>
                  </div>
                </div>

                {/* Intake Mode Buttons */}
                <div>
                  <label className="font-bold text-slate-800 block mb-2">Project Overview Input Method:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => setOverviewMode('UPLOAD FILE')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                        overviewMode === 'UPLOAD FILE'
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-[11px] leading-tight">UPLOAD OVERVIEW</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOverviewMode('PASTE TEXT')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                        overviewMode === 'PASTE TEXT'
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <AlignLeft className="h-4 w-4" />
                      <span className="text-[11px] leading-tight">PASTE OVERVIEW</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOverviewMode('WRITE DESCRIPTION')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                        overviewMode === 'WRITE DESCRIPTION'
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Edit3 className="h-4 w-4" />
                      <span className="text-[11px] leading-tight">WRITE DESCRIPTION</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOverviewMode('ADD DIRECTION')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                        overviewMode === 'ADD DIRECTION'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                      <span className="text-[11px] leading-tight">HUSNI DIRECTION</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOverviewMode('NONE');
                        setNewProjectStep('INTAKE_SOURCES');
                      }}
                      className="p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span className="text-[11px] leading-tight">CONTINUE WITHOUT OVERVIEW</span>
                    </button>
                  </div>
                </div>

                {/* File Upload Mode */}
                {overviewMode === 'UPLOAD FILE' && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="font-bold text-slate-800 block">Upload Project Overview Document (.docx, .pdf, .txt, image):</label>
                    <input
                      type="file"
                      accept=".docx,.doc,.pdf,.txt,.png,.jpg,.jpeg"
                      onChange={handleOverviewFileChange}
                      className="hidden"
                      id="overview-file-upload"
                    />
                    <label
                      htmlFor="overview-file-upload"
                      className="border-2 border-dashed border-indigo-300 bg-white hover:bg-indigo-50/50 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-slate-600"
                    >
                      <FileUp className="h-6 w-6 text-indigo-600 mb-1" />
                      <span className="font-bold text-slate-800">
                        {overviewFileName ? overviewFileName : 'Click to Upload Project Overview Document'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        Supports Word (.docx), PDF, Text (.txt), or PNG/JPG images
                      </span>
                    </label>

                    {overviewFileName && (
                      <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 flex items-center justify-between text-indigo-900">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-indigo-600" />
                          <span className="font-bold">{overviewFileName}</span>
                          <span className="text-slate-500">({overviewFileSize})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOverviewFile(null);
                            setOverviewFileName('');
                            setOverviewFileData('');
                            setOverviewMimeType('');
                          }}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Paste Text Mode */}
                {overviewMode === 'PASTE TEXT' && (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="font-bold text-slate-800 block">Paste Project Overview Document / Context Text:</label>
                    <textarea
                      rows={5}
                      placeholder="Paste overall project context, purpose, proposal, or background document text here..."
                      value={overviewText}
                      onChange={(e) => setOverviewText(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Write Description Mode */}
                {overviewMode === 'WRITE DESCRIPTION' && (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="font-bold text-slate-800 block">Write Short Description:</label>
                    <textarea
                      rows={4}
                      placeholder="Type a high-level summary describing what this overall project aims to achieve..."
                      value={overviewText}
                      onChange={(e) => setOverviewText(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Add Husni Direction Mode */}
                {overviewMode === 'ADD DIRECTION' && (
                  <div className="space-y-2 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                    <label className="font-bold text-amber-900 block flex items-center space-x-1.5">
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                      <span>Husni Hasan Supervisor Strategic Direction & Guidelines:</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Specify explicit supervisor preferences, constraints, strategic imperatives, or boundaries for this project..."
                      value={overviewHusniDirection}
                      onChange={(e) => setOverviewHusniDirection(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl p-3 text-slate-800 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Optional Husni Direction Note for all other modes */}
                {overviewMode !== 'ADD DIRECTION' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block text-[11px]">
                      Add Husni Direction (Optional Supervisor Guidance):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ensure focus remains strictly on U.S. FDA FSVP Phase 1 compliance..."
                      value={overviewHusniDirection}
                      onChange={(e) => setOverviewHusniDirection(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                    />
                  </div>
                )}

                {overviewError && (
                  <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{overviewError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewProjectStep('CONFIRM_DEFINITION')}
                      className="underline font-bold hover:text-rose-900 text-xs"
                    >
                      Skip & Continue
                    </button>
                  </div>
                )}

                {/* Bottom Action Controls */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setNewProjectStep('ORIGIN_INTAKE')}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>← BACK TO PROJECT ORIGIN</span>
                  </button>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setOverviewMode('NONE');
                        setNewProjectStep('INTAKE_SOURCES');
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>CONTINUE TO INITIAL SOURCES →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewProjectStep('INTAKE_SOURCES')}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 text-xs cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4 text-indigo-200" />
                      <span>PROCEED TO STEP 3: INITIAL SOURCES / MATERIALS →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: INITIAL PROJECT SOURCES / MATERIALS */}
            {newProjectStep === 'INTAKE_SOURCES' && (
              <div className="space-y-4 text-xs">
                {/* Notice Banner */}
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                  <p className="text-xs leading-relaxed font-medium">
                    Add any sources that should help C-Bridge understand this project. This step is optional. Additional sources can be added after project creation.
                  </p>
                </div>

                {/* Selected Origin Banner */}
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 flex items-center justify-between text-indigo-950">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-200/60 text-indigo-900">
                      PROJECT ORIGIN
                    </span>
                    <span className="font-extrabold text-xs">{selectedOrigin}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProjectStep('ORIGIN_INTAKE')}
                    className="text-indigo-700 hover:text-indigo-900 font-bold underline text-[11px] cursor-pointer"
                  >
                    Change Origin
                  </button>
                </div>

                {/* Prominent Syllabus Callout for Academic / Training projects */}
                {(selectedOrigin === 'COURSE / ACADEMIC PROGRAM' || selectedOrigin === 'TRAINING PROGRAM') && (
                  <div className="bg-amber-50 p-3.5 rounded-xl border-2 border-amber-300 text-amber-950 space-y-1">
                    <div className="flex items-center space-x-2 font-black text-amber-900 text-xs">
                      <BookOpen className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>RECOMMENDED FOR {selectedOrigin}: UPLOAD SYLLABUS / COURSE OUTLINE</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-900">
                      Adding a syllabus or course outline now ensures AI Project Understanding is directly grounded in real source facts rather than preliminary AI interpretations.
                    </p>
                  </div>
                )}

                {/* Intake Source Form Container */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                      <FilePlus className="h-4 w-4 text-indigo-600" />
                      <span>Attach Initial Source Material / Syllabus</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Optional — You can add more materials later</span>
                  </div>

                  {/* Input Type & Attachment Mode Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Source Material Type:</label>
                      <select
                        value={intakeType}
                        onChange={(e) => setIntakeType(e.target.value as ProjectInputType)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-bold focus:outline-hidden cursor-pointer"
                      >
                        <option value="SYLLABUS">SYLLABUS (Recommended First Source)</option>
                        <option value="COURSE OVERVIEW">COURSE OVERVIEW</option>
                        <option value="COURSE METHODOLOGY">COURSE METHODOLOGY</option>
                        <option value="MODULE OVERVIEW">MODULE OVERVIEW</option>
                        <option value="COURSE MATERIAL">COURSE MATERIAL</option>
                        <option value="TRAINING MATERIAL">TRAINING MATERIAL</option>
                        <option value="ASSIGNMENT INSTRUCTIONS">ASSIGNMENT INSTRUCTIONS</option>
                        <option value="REGULATORY SOURCE">REGULATORY SOURCE</option>
                        <option value="RESEARCH">RESEARCH</option>
                        <option value="MEETING / CONFERENCE INPUT">MEETING / CONFERENCE INPUT</option>
                        <option value="HUSNI DIRECTION">HUSNI DIRECTION</option>
                        <option value="EXTERNAL TECHNICAL INPUT">EXTERNAL TECHNICAL INPUT</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Attachment Method:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => setIntakeAttachmentMode('UPLOAD FILE')}
                          className={`py-1.5 px-1.5 rounded-lg border text-center font-bold text-[10px] transition cursor-pointer ${
                            intakeAttachmentMode === 'UPLOAD FILE'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          UPLOAD FILE
                        </button>
                        <button
                          type="button"
                          onClick={() => setIntakeAttachmentMode('PASTE TEXT')}
                          className={`py-1.5 px-1.5 rounded-lg border text-center font-bold text-[10px] transition cursor-pointer ${
                            intakeAttachmentMode === 'PASTE TEXT'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          PASTE TEXT
                        </button>
                        <button
                          type="button"
                          onClick={() => setIntakeAttachmentMode('LINK REFERENCE')}
                          className={`py-1.5 px-1.5 rounded-lg border text-center font-bold text-[10px] transition cursor-pointer ${
                            intakeAttachmentMode === 'LINK REFERENCE'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          ADD LINK
                        </button>
                        <button
                          type="button"
                          onClick={() => setIntakeAttachmentMode('ADD NOTES')}
                          className={`py-1.5 px-1.5 rounded-lg border text-center font-bold text-[10px] transition cursor-pointer ${
                            intakeAttachmentMode === 'ADD NOTES'
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          ADD NOTES
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Material Title / Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. FSVP Lead Auditor Course Syllabus 2026"
                      value={intakeTitle}
                      onChange={(e) => setIntakeTitle(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  {intakeAttachmentMode === 'UPLOAD FILE' && (
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Upload Source File (.docx, .pdf, .txt, images):</label>
                      <input
                        type="file"
                        accept=".docx,.doc,.pdf,.txt,.png,.jpg,.jpeg"
                        onChange={handleIntakeFileChange}
                        className="hidden"
                        id="intake-file-upload"
                      />
                      <label
                        htmlFor="intake-file-upload"
                        className="border-2 border-dashed border-slate-300 bg-white hover:bg-slate-100/50 p-3.5 rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition text-slate-600"
                      >
                        <FileUp className="h-5 w-5 text-indigo-600" />
                        <span className="font-bold text-slate-800 text-xs">
                          {intakeFileName ? intakeFileName : 'Click to Upload Syllabus or Source File'}
                        </span>
                        {intakeFileSize && <span className="text-slate-500 text-[10px]">({intakeFileSize})</span>}
                      </label>
                    </div>
                  )}

                  {intakeAttachmentMode === 'PASTE TEXT' && (
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Paste Source Content / Syllabus Text:</label>
                      <textarea
                        rows={4}
                        placeholder="Paste syllabus outline, module schedule, or background text here..."
                        value={intakeContent}
                        onChange={(e) => setIntakeContent(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden text-xs"
                      />
                    </div>
                  )}

                  {intakeAttachmentMode === 'LINK REFERENCE' && (
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Source URL / Web Link:</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={intakeContent}
                        onChange={(e) => setIntakeContent(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  )}

                  {intakeAttachmentMode === 'ADD NOTES' && (
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Supervisor / Analyst Notes / Guidance:</label>
                      <textarea
                        rows={3}
                        placeholder="Type explicit notes, directives, or constraints for this source material..."
                        value={intakeNotes}
                        onChange={(e) => setIntakeNotes(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden text-xs"
                      />
                    </div>
                  )}

                  {intakeAttachmentMode !== 'ADD NOTES' && (
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Supervisor / Analyst Notes (Optional):</label>
                      <input
                        type="text"
                        placeholder="e.g. Focus on Module 3 & Module 4 during FSVP development planning"
                        value={intakeNotes}
                        onChange={(e) => setIntakeNotes(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddIntakeSource}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                      <span>ATTACH THIS SOURCE TO INTAKE SESSION</span>
                    </button>
                  </div>
                </div>

                {/* Attached Intake Sources List */}
                {intakeSources.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                        INITIAL SOURCES ADDED ({intakeSources.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIntakeTitle('');
                          setIntakeContent('');
                          setIntakeNotes('');
                          setIntakeFile(null);
                          setIntakeFileName('');
                          setIntakeFileData('');
                          setIntakeMimeType('');
                          setIntakeFileSize('');
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ ADD ANOTHER SOURCE</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {intakeSources.map((src) => (
                        <div key={src.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-900 block">{src.title}</span>
                              <span className="text-[10px] text-slate-500 block">
                                Type: {src.inputType || src.type} • Mode: {src.attachmentMode} {src.fileName ? `• File: ${src.fileName}` : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingIntakeSource(src)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10px] transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Eye className="h-3 w-3" />
                              <span>VIEW</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveIntakeSource(src.id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[10px] transition flex items-center space-x-1 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                              <span>REMOVE</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Banner in Step 3 */}
                {overviewError && (
                  <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span className="font-medium">{overviewError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewProjectStep('CONFIRM_DEFINITION')}
                      className="underline font-bold hover:text-rose-900 text-xs cursor-pointer ml-2 shrink-0"
                    >
                      Skip & Continue
                    </button>
                  </div>
                )}

                {/* Bottom Action Controls */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={isAnalyzingOverview}
                    onClick={() => setNewProjectStep('OVERVIEW_INTAKE')}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>← BACK TO PROJECT OVERVIEW</span>
                  </button>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleAnalyzeOverview()}
                      disabled={isAnalyzingOverview}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <span>SKIP SOURCES & ANALYZE →</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAnalyzeOverview()}
                      disabled={isAnalyzingOverview}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
                    >
                      {isAnalyzingOverview ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-200" />
                          <span>ANALYZING PROJECT...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-indigo-200" />
                          <span>ANALYZE PROJECT WITH CURRENT SOURCES</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: C-BRIDGE AI PROJECT UNDERSTANDING */}
            {newProjectStep === 'UNDERSTANDING_REVIEW' && overviewAnalysis && (
              <div className="space-y-4 text-xs">
                
                {/* Verification Badge */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-extrabold text-slate-100">
                        OVERVIEW PROCESSED ({overviewAnalysis.processingMethod || 'GEMINI AI'})
                      </span>
                      {overviewAnalysis.fileName && (
                        <span className="text-slate-400 text-[11px] block">
                          Source Document: {overviewAnalysis.fileName} ({overviewAnalysis.fileSize})
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/30">
                    PROCESSED CONTENT
                  </span>
                </div>

                {/* Governance Alert if Scope Conflict detected */}
                {overviewAnalysis.hasScopeConflict && (
                  <div className="bg-amber-50 border-2 border-amber-400 p-3.5 rounded-xl text-amber-900 space-y-1.5 shadow-sm">
                    <div className="flex items-center space-x-2 font-black text-amber-950">
                      <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                      <span className="text-sm">GOVERNANCE RULE & SCOPE CONFLICT FLAG</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      Information found in a Project Overview does NOT automatically become approved company scope.
                      The AI detected that this overview contains topics (e.g. ISO 22000 or non-U.S. regulations) outside approved C-Bridge Phase 1 boundary (U.S. Food Import & FSVP).
                    </p>
                    <div className="bg-amber-100/80 p-2.5 rounded-lg border border-amber-300 text-xs font-bold text-amber-950">
                      Scope Conflict Description: {overviewAnalysis.scopeConflictDescription || 'Potential commercial scope expansion beyond Phase 1.'}
                    </div>
                  </div>
                )}

                {/* Categorized Distinction Panel */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>Governance Distinction & Categorized Breakdown:</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase block w-fit">
                        📄 SOURCE-DERIVED INFORMATION
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                        {overviewAnalysis.sourceDerivedInfo.map((info, idx) => (
                          <li key={idx}>{info}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200 space-y-1">
                      <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] uppercase block w-fit">
                        👑 HUSNI DIRECTION
                      </span>
                      <p className="text-slate-800 font-medium italic">
                        {overviewAnalysis.husniDirectionText || overviewHusniDirection || 'No explicit supervisor constraint provided.'}
                      </p>
                    </div>

                    <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-200 space-y-1">
                      <span className="font-bold text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded text-[10px] uppercase block w-fit">
                        🧠 AI INTERPRETATION
                      </span>
                      <p className="text-slate-800 leading-normal">
                        {overviewAnalysis.aiInterpretationText}
                      </p>
                    </div>

                    <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200 space-y-1">
                      <span className="font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] uppercase block w-fit">
                        ✨ AI RECOMMENDATION
                      </span>
                      <p className="text-slate-800 leading-normal">
                        {overviewAnalysis.aiRecommendationText}
                      </p>
                    </div>
                  </div>

                  {overviewAnalysis.potentialScopeChanges.length > 0 && (
                    <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-rose-900 text-[11px]">
                      <span className="font-bold uppercase text-rose-950 block mb-1">⚠️ POTENTIAL SCOPE CHANGE ITEMS:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {overviewAnalysis.potentialScopeChanges.map((sc, idx) => (
                          <li key={idx}>{sc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Proposed Project Parameters Summary Grid */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
                  <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>AI Proposed Project Definition</span>
                    <span className="text-indigo-600 font-bold text-[11px]">
                      Type: {overviewAnalysis.projectType}
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <strong className="text-slate-700 block">Suggested Project Name:</strong>
                      <p className="text-slate-900 font-bold bg-slate-50 p-2 rounded-lg border border-slate-200 mt-0.5">
                        {overviewAnalysis.suggestedProjectName}
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-700 block">Relevant C-Bridge Area:</strong>
                      <p className="text-slate-900 font-bold bg-slate-50 p-2 rounded-lg border border-slate-200 mt-0.5">
                        {overviewAnalysis.relevantCBridgeArea}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <strong className="text-slate-700 block">Project Purpose & Core Objective:</strong>
                      <p className="text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-0.5 leading-relaxed">
                        {overviewAnalysis.projectPurpose}
                      </p>
                    </div>

                    <div>
                      <strong className="text-emerald-800 block">In-Scope Boundary:</strong>
                      <p className="text-emerald-950 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-0.5">
                        {overviewAnalysis.inScopeBoundary}
                      </p>
                    </div>

                    <div>
                      <strong className="text-rose-800 block">Out-of-Scope Boundary:</strong>
                      <p className="text-rose-950 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-0.5">
                        {overviewAnalysis.outOfScopeBoundary}
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-700 block">Potential Deliverables:</strong>
                      <p className="text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-0.5">
                        {overviewAnalysis.potentialDeliverables.join('; ')}
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-700 block">Workstreams & Members:</strong>
                      <p className="text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-0.5">
                        {overviewAnalysis.possibleWorkstreams.join(' | ')} ({overviewAnalysis.recommendedMembers.join(', ')})
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-700 block">Relationship to Current C-Bridge Scope:</strong>
                      <p className="text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-0.5 font-medium">
                        {overviewAnalysis.relationshipToCurrentCBridgeScope}
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-700 block">Recommended First Planning Wave:</strong>
                      <p className="text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-0.5 font-medium">
                        {overviewAnalysis.recommendedFirstPlanningWave}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Husni Review Toolbar Controls */}
                <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                      Husni Review & Action Toolbar:
                    </span>
                    <span className="text-slate-500 text-[11px]">Choose how to process C-Bridge AI's understanding</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        // ACCEPT UNDERSTANDING
                        setNewProjectName(overviewAnalysis.suggestedProjectName);
                        setNewProjectPurpose(overviewAnalysis.projectPurpose);
                        setNewProjectObjective(overviewAnalysis.mainObjective);
                        setNewProjectScope(overviewAnalysis.inScopeBoundary);
                        setNewProjectOutOfScope(overviewAnalysis.outOfScopeBoundary);
                        setNewProjectStep('CONFIRM_DEFINITION');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>ACCEPT UNDERSTANDING</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsHusniCommentOpen(!isHusniCommentOpen)}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                      <span>ADD COMMENT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsHusniCorrecting(!isHusniCorrecting)}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                      <span>CORRECT AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAskingAiQuestion(!isAskingAiQuestion)}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                      <span>ASK AI A QUESTION</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewProjectStep('INTAKE_SOURCES')}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-slate-600" />
                      <span>ADD MORE MATERIAL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewProjectStep('CONFIRM_DEFINITION');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-2 rounded-xl transition flex items-center space-x-1 cursor-pointer ml-auto"
                    >
                      <span>CONTINUE TO PROJECT DEFINITION</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Inline Comment Panel */}
                  {isHusniCommentOpen && (
                    <div className="bg-white p-3 rounded-xl border border-slate-300 space-y-2 mt-2">
                      <label className="font-bold text-slate-800 block">Add Husni Supervisor Comment:</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Type Husni's comment or note regarding this project understanding..."
                          value={husniComment}
                          onChange={(e) => setHusniComment(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (overviewAnalysis && husniComment.trim()) {
                              setOverviewAnalysis({
                                ...overviewAnalysis,
                                husniDirectionText: `${overviewAnalysis.husniDirectionText || ''} [Husni Comment: ${husniComment}]`
                              });
                              setHusniComment('');
                              setIsHusniCommentOpen(false);
                            }
                          }}
                          className="bg-indigo-600 text-white font-bold px-3 py-2 rounded-lg text-xs"
                        >
                          Save Comment
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Correct AI Panel */}
                  {isHusniCorrecting && (
                    <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-2.5 mt-2">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-amber-950 block text-xs flex items-center space-x-1.5">
                          <Sliders className="h-3.5 w-3.5 text-amber-700" />
                          <span>SUPERVISOR CONTROL INSTRUCTION (CORRECT AI UNDERSTANDING):</span>
                        </label>
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300">
                          CONTROL INSTRUCTION ONLY
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-normal">
                        Provide supervisor guidance or scope correction. This text will be sent to the AI as a control instruction to re-analyze sources and regenerate clean outputs. It will NOT be self-fed into project content fields.
                      </p>
                      <textarea
                        rows={2}
                        placeholder="e.g. Ensure global trade tariffs are classified as Course Topic — Outside Current Scope. Do not pre-commit consulting tools."
                        value={husniCorrectionText}
                        onChange={(e) => setHusniCorrectionText(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-amber-800 italic">
                          Preserves source provenance &amp; re-analyzes with current syllabus materials.
                        </span>
                        <button
                          type="button"
                          disabled={isAnalyzingOverview || !husniCorrectionText.trim()}
                          onClick={async () => {
                            if (husniCorrectionText.trim()) {
                              const currentCorrection = husniCorrectionText.trim();
                              setHusniCorrectionText('');
                              setIsHusniCorrecting(false);
                              await handleAnalyzeOverview(currentCorrection);
                            }
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                        >
                          {isAnalyzingOverview ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                              <span>Regenerating Analysis...</span>
                            </>
                          ) : (
                            <span>APPLY CORRECTION &amp; REGENERATE →</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Ask AI Panel */}
                  {isAskingAiQuestion && (
                    <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 space-y-2 mt-2">
                      <label className="font-bold text-indigo-900 block flex items-center space-x-1">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Ask C-Bridge AI About This Overview:</span>
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="e.g. Does this project require Samar to conduct audits directly?"
                          value={husniQuestion}
                          onChange={(e) => setHusniQuestion(e.target.value)}
                          className="flex-1 bg-white border border-indigo-200 rounded-lg p-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!husniQuestion.trim()) return;
                            try {
                              const res = await fetch('/api/ask-cbridge-ai', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ question: husniQuestion, userRole: 'HUSNI' })
                              });
                              const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
                              setAiQuestionAnswer(data.answer || 'No answer generated.');
                            } catch (err) {
                              setAiQuestionAnswer('Error communicating with C-Bridge AI assistant.');
                            }
                          }}
                          className="bg-indigo-600 text-white font-bold px-3 py-2 rounded-lg text-xs cursor-pointer"
                        >
                          Ask AI
                        </button>
                      </div>

                      {aiQuestionAnswer && (
                        <div className="bg-white p-3 rounded-lg border border-indigo-200 text-slate-800 text-xs mt-2 space-y-1">
                          <strong className="text-indigo-900 block">C-Bridge AI Answer:</strong>
                          <p className="leading-relaxed whitespace-pre-line">{aiQuestionAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: CONFIRM DEFINITION & INITIALIZE */}
            {newProjectStep === 'CONFIRM_DEFINITION' && (
              <form onSubmit={handleCreateNewProject} className="space-y-4 text-xs">
                
                {/* Top Origin Classification Banner */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">PROJECT CLASSIFICATION</span>
                    <span className="text-sm font-extrabold text-white">PROJECT ORIGIN: {selectedOrigin}</span>
                  </div>
                  <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[11px] px-3 py-1 rounded-lg border border-indigo-500/30 font-bold">
                    {potentialCapabilityDeveloper ? `Dev: ${potentialCapabilityDeveloper}` : 'Dev: Unassigned'}
                  </span>
                </div>

                {/* Initial Sources Summary Card if added */}
                {intakeSources.length > 0 && (
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-emerald-900 flex items-center space-x-1.5">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span>INITIAL SOURCES READY FOR TRANSFER ({intakeSources.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewProjectStep('INTAKE_SOURCES')}
                        className="text-[11px] text-emerald-800 font-bold underline hover:text-emerald-950 cursor-pointer"
                      >
                        Edit Sources
                      </button>
                    </div>
                    <ul className="list-disc pl-4 text-[11px] text-emerald-900 font-medium space-y-0.5">
                      {intakeSources.map((src) => (
                        <li key={src.id}>
                          {src.title} <span className="text-[10px] text-emerald-700">({src.inputType || src.type})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Banner when no overview was provided */}
                {!overviewAnalysis && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 text-slate-700 space-y-1">
                    <div className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                      <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>NO PROJECT OVERVIEW PROVIDED</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      AI-assisted project definition can continue using Husni's description, selected project origin, existing approved C-Bridge context, and available source materials.
                    </p>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Project Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Foreign Supplier Audit Capabilities Phase 2"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Core Purpose & Objective:</label>
                  <textarea
                    rows={2}
                    placeholder="Define high-level purpose of this capability project..."
                    value={newProjectPurpose}
                    onChange={(e) => setNewProjectPurpose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-emerald-800 block mb-1">In-Scope Boundary:</label>
                    <input
                      type="text"
                      placeholder="e.g. U.S. Food import readiness under 21 CFR 1.500"
                      value={newProjectScope}
                      onChange={(e) => setNewProjectScope(e.target.value)}
                      className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-rose-800 block mb-1">Out-of-Scope Boundary:</label>
                    <input
                      type="text"
                      placeholder="e.g. Custom ISO 22000 external consulting"
                      value={newProjectOutOfScope}
                      onChange={(e) => setNewProjectOutOfScope(e.target.value)}
                      className="w-full bg-rose-50/50 border border-rose-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Potential Capability Developer Field */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Potential Capability Developer (Optional):
                  </label>
                  <select
                    value={potentialCapabilityDeveloper}
                    onChange={(e) => setPotentialCapabilityDeveloper(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden cursor-pointer font-bold"
                  >
                    <option value="">Unassigned (Assign Capability Developer Later)</option>
                    <option value="Samar Baydoun">Samar Baydoun</option>
                    <option value="Husni Hasan">Husni Hasan</option>
                  </select>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Capability Developer assignment is OPTIONAL. Husni may create the project now and assign a Capability Developer later.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setNewProjectStep('INTAKE_SOURCES')}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition cursor-pointer text-xs"
                  >
                    ← Back to Initial Sources
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsNewProjectModalOpen(false)}
                      className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Create & Initialize Project
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Viewing Intake Source Preview Modal */}
      {viewingIntakeSource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                  {viewingIntakeSource.inputType || viewingIntakeSource.type}
                </span>
                <h4 className="font-extrabold text-sm text-slate-900 mt-1">{viewingIntakeSource.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setViewingIntakeSource(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <strong className="text-slate-700 block mb-0.5">Attachment Mode:</strong>
                <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded">{viewingIntakeSource.attachmentMode}</span>
              </div>
              {viewingIntakeSource.fileName && (
                <div>
                  <strong className="text-slate-700 block mb-0.5">File Details:</strong>
                  <span className="text-slate-900 font-medium">{viewingIntakeSource.fileName} ({viewingIntakeSource.fileSize || 'Standard'})</span>
                </div>
              )}
              {viewingIntakeSource.content && (
                <div>
                  <strong className="text-slate-700 block mb-0.5">Content / Material Text:</strong>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                    {viewingIntakeSource.content}
                  </div>
                </div>
              )}
              {viewingIntakeSource.notes && (
                <div>
                  <strong className="text-amber-900 block mb-0.5">Supervisor / Analyst Notes:</strong>
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-950 font-medium">
                    {viewingIntakeSource.notes}
                  </div>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingIntakeSource(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
