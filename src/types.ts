export type UserRole = 'HUSNI' | 'SAMAR';

export type AccountAccessType = 'OWNER_ADMIN' | 'SUPERVISOR' | 'ACTIVE_MEMBER' | 'APPLICANT' | 'INACTIVE_MEMBER' | 'UNVERIFIED_EMAIL';

export interface UserProfile {
  id: UserRole;
  name: string;
  title: string;
  roleDescription: string;
  avatar: string;
  scope: string;
}

export type PriorityLevel = 
  | 'P0 — CRITICAL'
  | 'P1 — DECISION / APPROVAL REQUIRED'
  | 'P2 — BLOCKING'
  | 'P3 — TIME-SENSITIVE'
  | 'P4 — NORMAL EXECUTION'
  | 'P5 — LEARNING / DEVELOPMENT'
  | 'P6 — INFORMATION / BACKGROUND';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'READY_FOR_QA' | 'COMPLETED' | 'BLOCKED';

export interface TaskStartAuditData {
  isoTimestamp: string;
  localDate: string;
  localTime: string;
  utcOffset: string;
  timeZone: string;
  timeZoneAbbr: string;
}

export interface TaskResultData {
  resultSummary: string;
  workCompleted?: string;
  remainingWork?: string;
  evidenceRef?: string;
  blocker?: string;
  submittedBy?: string;
  submittedAt?: string; // e.g. "RESULT SUBMITTED — 2026-08-08 — 19:35:10 — EDT"
  submittedAuditData?: TaskStartAuditData;
  isDraft?: boolean;
}

export interface TaskEvidenceRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  uploadedBy: string;
  timestamp: string;
  title: string;
  evidenceType: string;
  fileOrLink: string;
  notes?: string;
  supervisorVisibility: 'YES';
  supervisor: string;
  attentionClassification: 'ROUTINE REVIEW' | 'DECISION REQUIRED' | 'APPROVAL REQUIRED' | 'ESCALATION REQUIRED' | 'EXPLICIT ATTENTION REQUESTED';
}

export type DelayReason = 
  | 'MEMBER-CONTROLLED DELAY'
  | 'APPROVED RESCHEDULE'
  | 'SUPERVISOR CHANGE'
  | 'EXTERNAL BLOCKER'
  | 'DEPENDENCY BLOCKER'
  | 'MATERIAL NOT AVAILABLE'
  | 'TIME OFF'
  | 'OTHER'
  | 'APPROVED_PAUSE'
  | 'SUPERVISOR_DIRECTION'
  | 'ACADEMIC_STUDY_REQUIRED'
  | 'UNRESOLVED_BLOCKER'
  | 'MISSING_SOURCE_MATERIAL'
  | 'DEPENDENCY_NOT_MET'
  | 'MEMBER_CAPACITY_LIMIT'
  | 'MEMBER_UNPLANNED_ABSENCE'
  | 'SCOPE_EXPANSION'
  | 'QA_REVISION_CYCLE';

export type MemberExecutionStatus = 
  | 'PENDING_MEMBER_ACCEPTANCE'
  | 'ACCEPTED'
  | 'ACCEPTED_PENDING_SCHEDULING'
  | 'WAITING_FOR_PREREQUISITE'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'READY_FOR_QA'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'PENDING_RESCHEDULING'
  | 'DEFERRED';

export type MasterAgendaStatus = 'APPROVED' | 'PROVISIONAL' | 'CONFIRMED' | 'DRAFT';

export type MemberAcceptanceAction = 
  | 'ACCEPT'
  | 'REQUEST_SCHEDULE_CHANGE'
  | 'REQUEST_EFFORT_CHANGE'
  | 'DEFER'
  | 'ASK_SUPERVISOR';

export interface CapacityValidationResult {
  isValid: boolean;
  valid?: boolean;
  status: 'PASS' | 'CAPACITY_CONFLICT' | 'SCHEDULE_RISK';
  requiredHours: number;
  availableProjectHours: number;
  availableMemberHours: number;
  shortage: number;
  affectedDates: string[];
  affectedMilestones: string[];
  reasons: string[];
  options: string[];
  rejectionReason?: string;
  allocatedProjectHours?: number;
  consumedProjectHours?: number;
  requestedEffortHours?: number;
  shortageHours?: number;
  remainingProjectHours?: number;
}

export interface ScheduleAuditEntry {
  id: string;
  taskId?: string;
  masterAgendaItemId?: string;
  action: 
    | 'INITIAL_SCHEDULE' 
    | 'RESCHEDULE' 
    | 'CAPACITY_REBALANCE' 
    | 'SUPERVISOR_OVERRIDE' 
    | 'BLOCKER_DEFERRAL'
    | 'MEMBER_ACCEPTANCE'
    | 'MEMBER_DEFERRAL'
    | 'SCHEDULE_CHANGE_REQUEST'
    | 'EFFORT_CHANGE_REQUEST'
    | 'ALLOCATION_INCREASE'
    | 'ALLOCATION_DECREASE'
    | 'AVAILABILITY_CHANGE'
    | 'CAPACITY_GATE_REJECTION'
    | 'LEGACY_SCHEDULE_CLEANUP';
  previousPlannedDueAt?: string;
  newPlannedDueAt?: string;
  previousAllocationHours?: number;
  newAllocationHours?: number;
  reason: DelayReason | string;
  reasonNotes?: string;
  changedBy: string; // 'Husni Hasan' | 'Samar Baydoun' | 'CB-9119 Engine'
  timestamp: string;
  scheduleVersion: number;
  capacityImpact?: string;
}

export interface ScheduleRiskAlert {
  id: string;
  taskId: string;
  masterAgendaItemId?: string;
  title: string;
  riskType: 'DEPENDENCY_PREREQUISITE' | 'OVERDUE' | 'CAPACITY_OVERLOAD' | 'BLOCKER_IDLE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendedAction: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignedTo: 'Samar Baydoun' | 'Husni Hasan' | string;
  assignedBy: string;
  status: TaskStatus;
  executionStatus?: MemberExecutionStatus;
  priority: PriorityLevel;
  urgency: string;
  governanceImpact: string;
  moduleCode: string; // e.g., 'SB-9111', 'SB-9113', 'CB-9119'
  moduleName: string; // e.g., 'Samar Agenda', 'FSVP Development'
  dueDate: string;
  startedAt?: string; // e.g. "TASK PERFORMANCE STARTED — 2026-08-08 — 19:25:25 — EDT"
  startAuditData?: TaskStartAuditData;
  evidenceUrl?: string;
  resultSummary?: string;
  blockerNotes?: string;
  qaNotes?: string;
  isDemoAgendaItem?: boolean;
  resultData?: TaskResultData;
  evidenceRecords?: TaskEvidenceRecord[];
  
  // Project & Master Agenda Hierarchy Extensions
  projectId?: string;
  projectName?: string;
  masterAgendaItemId?: string;
  scheduledReason?: string; // e.g., 'P1 Priority + Deadline Today + Dependency Cleared'
  scheduledDate?: string;
  requiresQaDoc?: boolean; // Controls whether SUBMIT FOR QA is shown
  rescheduleReason?: 'CONTINUE TOMORROW' | 'RESCHEDULE' | 'BLOCKED' | 'WAITING' | 'CHANGE PRIORITY';
  
  // Task Effort & Capacity Extensions
  estimatedEffortHours?: number;
  actualTimeHours?: number;
  remainingEffortHours?: number;
  aiSuggestedEffortHours?: number;
  actualWorkMinutes?: number;
  
  // Capacity-Based Execution & Traceability Fields
  masterAgendaApprovalTimestamp?: string;
  memberAcceptanceTimestamp?: string;
  operationalScheduledTimestamp?: string;
  memberAcceptanceAction?: MemberAcceptanceAction;
  memberAcceptanceNotes?: string;
  plannedStartAt?: string;
  plannedDueAt?: string;
  actualStartedAt?: string;
  actualCompletedAt?: string;
  scheduleVersion?: number;
  delayReason?: DelayReason;
  delayNotes?: string;
  isOverdue?: boolean;
  overdueDurationText?: string;
  scheduleAudits?: ScheduleAuditEntry[];
}

export type OfficialDocStatus = 
  | 'DRAFT'
  | 'UNDER DEVELOPMENT'
  | 'READY FOR QA'
  | 'QA REVIEWED'
  | 'REVISION REQUIRED'
  | 'PENDING SUPERVISOR APPROVAL'
  | 'SUPERVISOR APPROVED'
  | 'SUPERSEDED'
  | 'ARCHIVED';

export interface ControlDocument {
  id: string;
  documentName: string;
  code: string;
  version: string;
  author: string;
  currentStatus: OfficialDocStatus;
  qaFindings: string[];
  supervisorFeedback?: string;
  approvalStatus: 'NOT_SUBMITTED' | 'QA_PASSED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  updatedAt: string;
  moduleCode: string;
  fileType: string;
  description: string;
}

export interface GovernanceDecision {
  id: string;
  title: string;
  requestedBy: string;
  dateSubmitted: string;
  governanceImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'OUTSIDE CURRENT PHASE';
  phaseAlignment: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ON_HOLD';
  requiredAuthority: 'Husni Hasan';
  details: string;
  recommendedAction: string;
  moduleCode: 'CB-9110';
}

export interface FollowUpItem {
  id: string;
  subject: string;
  stakeholder: string;
  assignedTo: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  dueDate: string;
  notes: string;
  moduleCode: string;
}

export interface WeeklyReport {
  id: string;
  weekEnding: string;
  author: string;
  summary: string;
  keyAchievements: string[];
  blockersResolved: string[];
  plannedForNextWeek: string[];
  supervisorStatus: 'REVIEWED' | 'AWAITING_REVIEW';
  moduleCode: string;
}

export interface PriorityInferenceResult {
  source?: string;
  classification: string;
  suggestedPriority: PriorityLevel;
  urgency: string;
  governanceImpact: string;
  responsiblePerson: string;
  suggestedDestination: string;
  moduleCode: string;
  supervisorAttention: string;
  suggestedTool: string;
  confidence: number;
  reasoning: string;
  isScopeExpansion?: boolean;
}

export interface LogicalModule {
  code: string;
  name: string;
  category: 'Governance' | 'Operations' | 'QA' | 'Member Execution';
  description: string;
}

export type SupervisorAttentionLevel = 
  | 'ROUTINE REVIEW'
  | 'COMMENT REQUESTED'
  | 'DECISION REQUIRED'
  | 'APPROVAL REQUIRED'
  | 'ESCALATION REQUIRED';

export type LiveMessageType = 
  | 'CHAT'
  | 'EXPLANATION'
  | 'QUESTION'
  | 'QUIZ'
  | 'ANSWER'
  | 'CASE_STUDY'
  | 'SUMMARY'
  | 'INTERVENTION';

export interface LiveQuizOption {
  id: number;
  text: string;
}

export interface LiveSessionMessage {
  id: string;
  sender: 'SAMAR' | 'C_BRIDGE_AI' | 'SUPERVISOR';
  senderName: string;
  timestamp: string;
  text: string;
  type: LiveMessageType;
  quizQuestion?: string;
  quizOptions?: LiveQuizOption[];
  correctOptionIndex?: number;
  selectedOptionIndex?: number;
  isCorrect?: boolean;
  explanation?: string;
  supervisorActionType?: 'COMMENT' | 'QUESTION' | 'DIRECTION' | 'CLARIFICATION' | 'MORE_STUDY' | 'FLAG' | 'INTERVENE';
}

export interface SupervisorIntervention {
  id: string;
  supervisorName: string;
  timestamp: string;
  instruction: string;
  actionType: 'COMMENT' | 'QUESTION' | 'DIRECTION' | 'CLARIFICATION' | 'MORE_STUDY' | 'FLAG' | 'INTERVENE';
}

export type CBridgeAssetType = 
  | 'CHECKLIST'
  | 'SOP'
  | 'WORKFLOW'
  | 'INTAKE FORM'
  | 'SUPPLIER REQUEST TEMPLATE'
  | 'GAP-ASSESSMENT TOOL'
  | 'INTERNAL KNOWLEDGE NOTE'
  | 'TRAINING TOOL'
  | 'FICTIONAL CASE'
  | 'FAQ'
  | 'LINKEDIN EDUCATIONAL POST'
  | 'SERVICE DEVELOPMENT TOOL';

export interface AssetTaskSuggestion {
  id: string;
  taskTitle: string;
  assetType: CBridgeAssetType;
  purpose: string;
  learningSource: string;
  relatedLearningSession: string;
  assignedMember: string;
  suggestedPriority: PriorityLevel;
  destination: string;
  expectedDeliverable: string;
  qaRequirement: string;
  supervisorReviewRequirement: string;
  isSelected?: boolean;
  isConfirmed?: boolean;
}

export interface LearningHandoffData {
  topicLearned: string;
  keyConcepts: string[];
  samarUnderstanding: string;
  openQuestions: string[];
  potentialCBridgeApplication: string;
  recommendedAssetTypes: CBridgeAssetType[];
  scopePolicyCheck: string;
  sourceClassification: string;
  suggestedTasks: AssetTaskSuggestion[];
}

export interface LiveLearningSession {
  sessionId: string;
  member: string; // 'Samar Baydoun'
  topic: string;
  relatedTaskId: string;
  relatedTaskTitle: string;
  startTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  sourceMaterial: string;
  learningProgress: number; // 0 - 100
  attentionLevel: SupervisorAttentionLevel;
  supervisorVisibility: 'ACTIVE';
  supervisor: 'Husni Hasan';
  supervisorReviewable: boolean;
  openQuestions: string[];
  weakAreas: string[];
  messages: LiveSessionMessage[];
  supervisorComments: string[];
  supervisorInterventions: SupervisorIntervention[];
  
  // Learning-to-Asset Workflow extensions
  learningObjective?: string;
  expectedCBridgeApplication?: string;
  handoffData?: LearningHandoffData;
  confirmedAssetTasks?: AssetTaskSuggestion[];
}

export type ProjectEnvironment = 'REAL ACTIVE' | 'PILOT / TEST' | 'LEGACY / DEMO' | 'ARCHIVED';

export type ProjectOrigin =
  | 'COURSE / ACADEMIC PROGRAM'
  | 'TRAINING PROGRAM'
  | 'RESEARCH'
  | 'REGULATION / STANDARD'
  | 'CAPABILITY DEVELOPMENT'
  | 'COMPANY DEVELOPMENT'
  | 'MARKET OPPORTUNITY'
  | 'CONFERENCE / PROFESSIONAL INPUT'
  | 'CLIENT-DERIVED DEVELOPMENT NEED'
  | 'HUSNI DIRECTION'
  | 'OTHER'
  | 'LEGACY / NOT CLASSIFIED';

export interface OriginContext {
  // Shared / General
  otherDescription?: string;
  notes?: string;
  linksOrReferences?: string;
  relatedCapability?: string;
  potentialCapabilityDeveloper?: string;
  institution?: string;
  targetRole?: string;

  // Course / Academic Program
  courseName?: string;
  providerInstitution?: string;
  coursePurposeDescription?: string;
  startDate?: string;
  endDate?: string;
  expectedStudyDuration?: string;
  availableStudyHoursPerWeek?: string;
  knownNumberOfModules?: string;
  syllabusFileRef?: string;
  courseOverviewFileRef?: string;
  methodologyFileRef?: string;

  // Training Program
  trainingName?: string;
  trainingProvider?: string;
  trainingPurpose?: string;
  trainingFormat?: string;
  trainingOutline?: string;
  trainingMaterialsRef?: string;

  // Research
  researchTopic?: string;
  researchQuestion?: string;
  whyResearchingThis?: string;
  existingKnowledge?: string;
  expectedOutcome?: string;

  // Regulation / Standard
  regulationName?: string;
  jurisdictionCountry?: string;
  regulatoryAuthority?: string;
  whyItMatters?: string;
  knownRequirementChange?: string;

  // Capability Development
  capabilityName?: string;
  currentKnowledge?: string;
  capabilityGap?: string;
  developmentObjective?: string;
  potentialFutureServiceRelevance?: string;

  // Company Development
  companyDevelopmentArea?: string;
  problemOpportunity?: string;
  desiredOutcome?: string;
  affectedArea?: string;

  // Market Opportunity
  opportunityName?: string;
  marketGeography?: string;
  opportunityDescription?: string;
  howIdentified?: string;
  potentialRelevance?: string;
  marketEvidence?: string;
  existingInternalCapability?: string;
  potentialKnowledgeGap?: string;

  // Conference / Professional Input
  conferenceName?: string;
  eventDate?: string;
  participantMember?: string;
  keyObservation?: string;
  recommendationIdentified?: string;

  // Client-Derived Development Need
  clientContext?: string;
  observedNeed?: string;
  observedProblem?: string;
  knowledgeGap?: string;
  processGap?: string;
  assetGap?: string;
  potentialBroaderValue?: string;

  // Husni Direction
  husniDirectionInstructions?: string;
  priority?: string;
  knownSources?: string;
}

export type ProjectStatus = 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';

export interface Project {
  id: string; // e.g. 'PRJ-FSVP-01'
  name: string; // e.g. 'U.S. Food Import & FSVP Capability Development'
  purpose: string;
  businessObjective: string;
  scope: string;
  outOfScopeBoundaries: string;
  supervisor: string; // 'Husni Hasan'
  assignedMembers: string[]; // ['Samar Baydoun', 'Husni Hasan']
  startDate: string;
  targetDate: string;
  currentPhase: string;
  status: ProjectStatus;
  expectedDeliverables: string[];
  risks: string[];
  dependencies: string[];
  relatedGovernanceDecisions: string[];
  overviewAnalysis?: ProjectOverviewAnalysis;

  // Master Spec & Origin Extensions
  projectId?: string;
  projectName?: string;
  projectOrigin?: string;
  inScopeBoundary?: string;
  origin?: ProjectOrigin;
  originContext?: OriginContext;
  createdByUid?: string;
  createdAt?: string;
  updatedAt?: string;
  projectSponsor?: string;
  projectProposer?: string;
  potentialCapabilityDeveloper?: string;
  capabilityDeveloper?: string;
  capabilityLead?: string;
  environment?: ProjectEnvironment;
  proposalId?: string;
}

export type MasterAgendaCategory =
  | 'PHASE'
  | 'WORKSTREAM'
  | 'MILESTONE'
  | 'TASK'
  | 'LEARNING TASK'
  | 'ASSET DEVELOPMENT TASK'
  | 'FOLLOW-UP'
  | 'QA / REVIEW'
  | 'SUPERVISOR ACTION';

export type MasterAgendaItemState =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SCHEDULED_DAILY'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'QA_PENDING'
  | 'SUPERVISOR_APPROVED';

export interface MasterAgendaItem {
  id: string; // e.g. 'MA-FSVP-01'
  projectId: string; // 'PRJ-FSVP-01'
  projectName: string;
  category: MasterAgendaCategory;
  workstream: string;
  objective: string;
  taskTitle: string;
  expectedDeliverable: string;
  assignedMember: string; // 'Samar Baydoun'
  priority: PriorityLevel;
  targetDate: string;
  dependencies: string[];
  requiredSourceMaterial?: string;
  requiredAiTool?: string;
  currentState: MasterAgendaItemState;
  evidenceRequirement: string;
  qaRequirement: string;
  supervisorReviewRequirement: string;
  relatedAssetId?: string;
  relatedFollowUpId?: string;
  
  // Dynamic Execution Sync
  dailyTaskId?: string;
  progressPercent: number; // 0 - 100
  latestResultSummary?: string;
  latestEvidenceRef?: string;
  latestBlocker?: string;
  supervisorReviewStatus?: string;

  // Progressive Planning Extensions
  masterAgendaStatus?: MasterAgendaStatus;
  memberExecutionStatus?: MemberExecutionStatus;
  masterAgendaApprovalTimestamp?: string;
  memberAcceptanceTimestamp?: string;
  operationalScheduledTimestamp?: string;
  memberAcceptanceAction?: MemberAcceptanceAction;
  memberAcceptanceNotes?: string;
  planningWave?: 'WAVE 1 — Foundation' | 'WAVE 2 — Capability Dev' | 'WAVE 3 — Application & Testing' | 'WAVE 4 — Assets & Communication' | 'WAVE 5 — QA & Review' | string;
  isProvisional?: boolean;
  confirmedByHusni?: boolean;
  sourceMaterialRef?: string;

  // Task Effort Extensions
  estimatedEffortHours?: number;
  actualTimeHours?: number;
  remainingEffortHours?: number;
  aiSuggestedEffortHours?: number;

  // Capacity Planning & Schedule Traceability
  plannedStartAt?: string;
  plannedDueAt?: string;
  actualStartedAt?: string;
  actualCompletedAt?: string;
  scheduleVersion?: number;
  delayReason?: DelayReason;
  delayNotes?: string;

  // Syllabus & Module Structure Extensions
  moduleNumber?: number | string;
  modulePurpose?: string;
  learningObjectives?: string[];
  requiredTopics?: string[];
  requiredReading?: string[];
  assignments?: string[];
  knownDeadlines?: string;
  expectedLearningOutput?: string;
  outsideScopeLabel?: string; // e.g. "COURSE TOPIC — OUTSIDE CURRENT C-BRIDGE SCOPE"
  clientStudyReadiness?: string;
  proposalSetId?: string;
}
export type SourceAttachmentMode = 'UPLOAD FILE' | 'PASTE TEXT' | 'ADD LINK / REFERENCE' | 'ADD NOTES';

export type ProjectInputType =
  | 'PROJECT OVERVIEW'
  | 'SYLLABUS'
  | 'MSU MATERIAL'
  | 'COURSE OVERVIEW'
  | 'COURSE METHODOLOGY'
  | 'MODULE OVERVIEW'
  | 'COURSE MATERIAL'
  | 'TRAINING MATERIAL'
  | 'ASSIGNMENT INSTRUCTIONS'
  | 'REGULATORY SOURCE'
  | 'REGULATION'
  | 'STANDARD'
  | 'EXAM_MATERIAL'
  | 'SUPPLIER_DOSSIER'
  | 'MEETING_NOTES'
  | 'RESEARCH'
  | 'MEETING OUTCOME'
  | 'MEETING / CONFERENCE INPUT'
  | 'CONSULTATION OUTCOME'
  | 'EXISTING DOCUMENT'
  | 'MEMBER REPORT'
  | 'LEARNING HANDOFF'
  | 'HUSNI DIRECTION'
  | 'HUSNI COMMENT / DIRECTION'
  | 'EXTERNAL TECHNICAL INPUT'
  | 'OTHER';

export interface ProjectOverviewAnalysis {
  suggestedProjectName: string;
  projectType: string;
  projectPurpose: string;
  mainObjective: string;
  inScopeBoundary: string;
  outOfScopeBoundary: string;
  expectedOutcomes: string[];
  potentialDeliverables: string[];
  possibleWorkstreams: string[];
  relevantCBridgeArea: string;
  recommendedMembers: string[];
  potentialDependencies: string[];
  importantSources: string[];
  risks: string[];
  questionsUncertainties: string[];
  relationshipToCurrentCBridgeScope: string;
  recommendedFirstPlanningWave: string;
  hasScopeConflict: boolean;
  scopeConflictDescription?: string;

  sourceDerivedInfo: string[];
  husniDirectionText?: string;
  aiInterpretationText: string;
  aiRecommendationText: string;
  potentialScopeChanges: string[];

  processingMethod?: string;
  documentStructureSummary?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  analysisVerified?: boolean;
}

export interface SourceAnalysisResult {
  summary: string;
  relevance: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  mainTopics?: string[];
  keyConcepts?: string[];
  relevantSections?: string[];
  projectRelevance?: string;
  learningOpportunities?: string[];
  possibleTasks?: string[];
  possibleCBridgeApplications?: string[];
  possibleAssetIdeas?: string[];
  dependencies?: string[];
  risksAndLimitations?: string[];
  openQuestions?: string[];
  potentialMasterAgendaImpact?: string;
  aiConfidence?: number;

  processingMethod?: string;
  documentStructureSummary?: string;

  sourceDerived?: {
    mainTopics: string[];
    keyConcepts: string[];
    relevantSections: string[];
  };
  aiInterpretation?: {
    projectRelevance: string;
    learningOpportunities: string[];
    possibleCBridgeApplications: string[];
    risksAndLimitations: string[];
  };
  aiRecommendation?: {
    possibleTasks: string[];
    possibleAssetIdeas: string[];
    potentialMasterAgendaImpact: string;
    openQuestions: string[];
    aiConfidence: number;
  };

  potentialImpacts: {
    category: 'PROJECT SCOPE' | 'MASTER AGENDA' | 'PRIORITIES' | 'DEPENDENCIES' | 'DAILY PLAN' | 'LEARNING' | 'ASSET DEVELOPMENT' | 'FOLLOW-UP' | 'QA' | 'SUPERVISOR DECISION';
    applicable: boolean;
    explanation: string;
  }[];
  newInformationDetected: string[];
  possibleNewTasks: string[];
  possibleDependencyChanges?: string[];
  possibleRisks: string[];
  possibleCBridgeAssets: string[];
  questionsOrUncertainties?: string[];
  planningAssumptions: string[];
}

export interface ProjectInput {
  id: string;
  projectId: string;
  type: ProjectInputType;
  inputType?: ProjectInputType;
  title: string;
  content: string;
  addedBy: string; // e.g. 'Husni Hasan' or 'Samar Baydoun'
  timestamp: string;
  attachmentMode?: SourceAttachmentMode;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  fileData?: string;
  linkOrRef?: string;
  notes?: string;
  analysisStatus?: 'ANALYZED' | 'PENDING_ANALYSIS' | 'FAILED';
  agendaImpact?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  agendaProposalStatus?: 'PROPOSED' | 'ACCEPTED' | 'NO_PROPOSAL' | 'DEFERRED';
  relatedAgendaItems?: string[];
  processedByAi?: boolean;
  aiAnalysis?: SourceAnalysisResult;
  fileAnalysisVerified?: boolean;
  fileAnalysisFailedReason?: string;
  processingMethod?: string;
  documentStructureSummary?: string;
}

export interface PlanningAssumption {
  id: string;
  projectId: string;
  assumption: string;
  basis: string;
  status: 'ACTIVE' | 'VALIDATED' | 'REVISED';
}

export type ProposalStatus = 'PROPOSED' | 'ACCEPTED' | 'ACCEPTED_WITH_COMMENT' | 'REJECTED' | 'REVISED' | 'DEFERRED';

export interface AgendaUpdateProposal {
  id: string;
  projectId: string;
  reasonForChange: string;
  sourceOfChange: string;
  existingItemAffectedId?: string;
  existingItemAffectedTitle?: string;
  proposedChangeType: 'ADDITION' | 'MODIFICATION' | 'REMOVAL' | 'REORDER_PREREQUISITE';
  proposedItem?: Partial<MasterAgendaItem>;
  dependencyImpact: string;
  priorityImpact: string;
  scheduleImpact: string;
  memberImpact: string;
  scopeImpact: string;
  aiRecommendation: string;
  status: ProposalStatus;
  husniComment?: string;
  createdAt: string;
  reviewedAt?: string;

  // Proposal Set & Source Integration Extensions
  proposalSetId?: string;
  proposalSetTitle?: string;
  sourceInputId?: string;
  sourceAnalysisVersion?: number | string;
  idempotencyKey?: string;
  proposedItems?: Array<Partial<MasterAgendaItem>>;
  outsideScopeTopics?: string[];
  isDuplicateOrError?: boolean;
  auditStatus?: 'ACTIVE' | 'FLAGGED_DUPLICATE_ERROR' | 'SUPERSEDED' | 'ARCHIVED';
  auditNote?: string;
}

export interface SupervisorDirectionRecord {
  id: string;
  projectId: string;
  supervisorName: string; // 'Husni Hasan'
  rawComment: string;
  interpretedProposalId?: string;
  timestamp: string;
}

export interface AgendaHistoryRecord {
  id: string;
  projectId: string;
  action: string;
  itemTitle: string;
  sourceOfChange: string;
  aiRecommendation: string;
  husniDecision: string;
  husniComment?: string;
  timestamp: string;
}

// ==================================================
// TEAM ADMINISTRATION, CAPACITY & PERFORMANCE TYPES
// ==================================================

export type EmploymentStatus = 'FULL TIME' | 'PART TIME' | 'CONTRACTOR' | 'SUPERVISOR / OWNER';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED';

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isWorkingDay: boolean;
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "02:00 PM"
  hoursAvailable: number; // e.g. 5
}

export interface WorkSchedule {
  workingDays: string[]; // e.g. ["Monday", "Tuesday", "Thursday", "Friday"]
  normalStartTime: string; // "09:00 AM"
  normalEndTime: string;   // "02:00 PM"
  hoursAvailablePerDay: number; // 5
  hoursAvailablePerWeek: number; // 20
  timezone: string; // "EDT (UTC-4)"
  dailySchedules: DaySchedule[];
}

export type AvailabilityExceptionType = 
  | 'TIME OFF' 
  | 'TEMPORARY AVAILABILITY CHANGE' 
  | 'EXTRA AVAILABLE HOURS' 
  | 'UNAVAILABLE PERIOD';

export interface AvailabilityException {
  id: string;
  memberId: string;
  type: AvailabilityExceptionType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  adjustedHoursPerDay: number;
  reason: string;
  approvedBy: string; // 'Husni Hasan'
  createdAt: string;
}

export type MemberCapacityStatus = 
  | 'AVAILABLE' 
  | 'NEAR CAPACITY' 
  | 'FULLY ALLOCATED' 
  | 'OVERALLOCATED' 
  | 'UNAVAILABLE';

export interface MemberCapacityMetrics {
  weeklyAvailableCapacity: number;
  todayAvailableCapacity: number;
  alreadyAllocatedHours: number;
  remainingCapacity: number;
  overallocatedHours: number;
  status: MemberCapacityStatus;
}

export type AvailabilitySourceStatus = 
  | 'MEMBER PROVIDED' 
  | 'HUSNI CONFIRMED' 
  | 'TEAM & CAPACITY UPDATED' 
  | 'TEMPORARY EXCEPTION' 
  | 'CAPACITY DATA REQUIRED';

export interface AvailabilityProvenance {
  value: string;
  source: string;
  lastUpdated: string;
  status: AvailabilitySourceStatus;
  missingFields?: string[];
}

export interface MemberProjectAllocation {
  projectId: string;
  projectName: string;
  allocatedHoursPerWeek: number;
  dailyAllocatedHours?: number; // e.g. 3h/day
  scheduledHoursPerWeek?: number;
  remainingAllocatedHours?: number;
  source: 'HUSNI_ASSIGNMENT' | 'PROVISIONING_PROPOSAL' | 'TEAM_CAPACITY_UPDATE';
  status: 'CONFIRMED' | 'PROVISIONAL';
  lastUpdated: string;
}

export interface TeamMember {
  id: string; // e.g. "MBR-001"
  name: string; // "Samar Baydoun"
  email: string;
  country?: string;
  title: string; // "Food Import and FSVP Service Development Coordinator"
  functionalRole: string; // "FSVP Service Development Coordinator"
  supervisor: string; // "Husni Hasan"
  employmentStatus: EmploymentStatus;
  timezone: string; // "EDT (UTC-4)"
  projectAssignments: string[]; // e.g. ["PRJ-FSVP-01", "PRJ-324"]
  projectAllocations?: MemberProjectAllocation[];
  availabilityProvenance?: AvailabilityProvenance;
  roleScope: string;
  responsibilities: string[];
  authority: string; // "Follows Husni-approved member governance CB-9110 / SB-9100"
  requiredApprovals: string[];
  accessPermissions: string[]; // ["EXECUTION", "QA_SUBMISSION", "FSVP_DEV"]
  startDate: string;
  accountStatus: AccountStatus;
  accountAccessStatus?: 'NOT ACTIVATED' | 'INVITATION PENDING' | 'EMAIL VERIFIED' | 'ACTIVE' | 'DISABLED';
  linkedUid?: string;
  activationToken?: string;
  activationEmail?: string;
  activationSentAt?: string;
  schedule: WorkSchedule;
  exceptions: AvailabilityException[];
}

export interface PerformanceReviewRecord {
  id: string;
  memberId: string;
  memberName: string;
  reviewPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  reviewDate: string;
  evaluator: string; // 'Husni Hasan'
  
  // Input Context
  assignedWorkSummary: string;
  availableCapacityHours: number;
  allocatedHours: number;
  completedHours: number;
  tasksStarted: number;
  tasksCompleted: number;
  carryForwardTasks: number;
  resultsEvidenceSummary: string;
  
  // Evaluation Details
  qualityObservations: string;
  strengths: string[];
  gaps: string[];
  blockers: string[];
  developmentNeeds: string[];
  
  // AI Suggested Score & Reasoning
  aiSuggestedScore: number; // 0 - 100
  aiReasoning: string;
  
  // Husni Supervisor Review
  husniFinalScore?: number; // 0 - 100
  husniComments?: string;
  supervisorAction: 'PENDING_REVIEW' | 'ACCEPTED' | 'CHANGED_SCORE' | 'EXPLAINED' | 'IMPROVEMENT_REQUESTED';
  developmentActions?: string[];
  reviewedAt?: string;
}

export type AuditChangeCategory = 
  | 'ROLE_CHANGE' 
  | 'SCHEDULE_CHANGE' 
  | 'AVAILABILITY_CHANGE' 
  | 'PROJECT_ASSIGNMENT' 
  | 'SUPERVISOR_CHANGE' 
  | 'PERFORMANCE_REVIEW' 
  | 'ACCOUNT_STATUS'
  | 'MEMBER_APPLICATION'
  | 'INFORMATION_REQUEST'
  | 'PROVISIONING_PROPOSAL'
  | 'WORK_PLAN_APPROVAL';

export interface TeamAuditLog {
  id: string;
  timestamp: string;
  performedBy?: string; // 'Husni Hasan' or 'Applicant' or 'C-Bridge AI'
  targetMemberId?: string;
  targetMemberName?: string;
  memberId?: string;
  memberName?: string;
  action?: string;
  changedBy?: string;
  changeCategory?: AuditChangeCategory;
  details: string;
}

// ==================================================
// SELF-SERVICE MEMBER SIGN-UP & AI ONBOARDING TYPES
// ==================================================

export type ApplicantStatus = 
  | 'PENDING_REVIEW' 
  | 'MORE_INFO_REQUIRED' 
  | 'ON_HOLD' 
  | 'APPROVED_PENDING_PROVISIONING' 
  | 'APPROVED' 
  | 'REJECTED'
  | 'INACTIVE_MEMBER';

export type EmailVerificationStatus = 'UNVERIFIED' | 'VERIFIED';

export interface AIMemberFitAnalysis {
  professionalSummary: string;
  relevantSkills: string[];
  relevantExperience: string;
  potentialCapabilityAreas: string[];
  potentialGaps: string[];
  trainingNeeds: string[];
  availabilityAssessment: string;
  capacityAssessment: string;
  possibleProjectFit: string[];
  possibleWorkstreamFit: string[];
  suggestedRole: string;
  suggestedInitialResponsibilities: string[];
  suggestedInitialWeeklyAllocation: number; // hours/week
  risksAndQuestions: string[];
  informationMissing: string[];
  aiRecommendation: 'APPROVE' | 'REQUEST_MORE_INFO' | 'REJECT';
  aiConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  analyzedAt: string;
}

export interface InformationRequest {
  id: string;
  requestedAt: string;
  requestedBy: string; // 'Husni Hasan'
  question: string;
  requestedDocument?: string;
  requestedClarification?: string;
  requestedAvailabilityUpdate?: string;
  requestedEvidence?: string;
  status: 'OPEN' | 'ANSWERED';
  responseAt?: string;
  responseDetails?: string;
  responseDocumentName?: string;
}

export interface MemberProvisioningProposal {
  proposalId: string;
  createdAt: string;
  createdBy: string; // 'Husni Hasan'
  memberName: string;
  approvedTitle: string;
  functionalRole: string;
  supervisor: string; // 'Husni Hasan'
  roleScope: string;
  authority: string;
  permissions: string[];
  weeklyCapacity: number;
  workingSchedule: WorkSchedule;
  approvedProjects: string[];
  suggestedWorkstreams: string[];
  requiredOnboarding: string[];
  requiredLearning: string[];
  initialTasks: string[];
  reportingRequirements: string;
  status: 'DRAFT' | 'CONFIRMED';
}

export interface DailyWorkPlanAllocation {
  day: string;
  taskSummary: string;
  targetHours: number;
  projectRef: string;
}

export interface SuggestedWorkPlan {
  planId: string;
  memberName: string;
  weeklyHours: number;
  timezone: string;
  dailyAllocations: DailyWorkPlanAllocation[];
  masterAgendaPriorities: string[];
  learningRequirements: string[];
  dependencies: string[];
  husniStatus: 'PENDING' | 'ACCEPTED' | 'EDITED' | 'REPRIORITIZED' | 'REDUCED' | 'INCREASED' | 'DEFERRED';
  husniNotes?: string;
}

export interface MemberApplication {
  id: string; // e.g. "APP-2026-0801"
  createdAt: string;
  updatedAt: string;
  status: ApplicantStatus;

  // Required Sign Up Fields
  fullName: string;
  email: string;
  password?: string;
  emailVerificationStatus: EmailVerificationStatus;
  country: string;
  timezone: string; // e.g. "America/Detroit (EDT/UTC-4)"
  functionalArea: string;
  coreSkills: string[];
  qualificationsSummary?: string;
  cvText: string;
  cvFile?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData?: string;
  };
  availableWorkingDays: string[];
  dailyStartTime: string;
  dailyEndTime: string;
  dailyHoursConfig?: Record<string, { startTime: string; endTime: string; hours: number }>;
  totalWeeklyHours: number;

  // Optional Professional Fields
  linkedInUrl?: string;
  portfolioUrl?: string;
  certifications?: string[];
  training?: string[];
  languages?: string[];
  additionalSkills?: string[];
  professionalNotes?: string;
  availabilityNotes?: string;

  // Notice Acknowledgement
  supervisionNoticeAcknowledged: boolean;

  // Audit & Origin Classification
  isDemoData?: boolean;
  isTestAccount?: boolean;

  // Intelligence & Review
  aiAnalysis?: AIMemberFitAnalysis;
  husniDecision?: 'APPROVE' | 'APPROVE_WITH_CHANGES' | 'REQUEST_MORE_INFO' | 'HOLD' | 'REJECT';
  husniComments?: string;
  infoRequests?: InformationRequest[];
  provisioningProposal?: MemberProvisioningProposal;
  suggestedWorkPlan?: SuggestedWorkPlan;
  createdMemberId?: string;
  rejectionReason?: string;
}

export type NotificationEventType = 
  | 'APPLICATION_RECEIVED'
  | 'EMAIL_VERIFICATION'
  | 'MORE_INFO_REQUESTED'
  | 'APPLICATION_ON_HOLD'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'ACCOUNT_ACTIVATION'
  | 'PROJECT_ASSIGNMENT'
  | 'FIRST_AGENDA_READY'
  | 'PROPOSAL_CONFIRMED';

export type EmailDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'EMAIL SERVICE NOT CONFIGURED';

export interface InAppNotification {
  id: string;
  timestamp: string;
  recipientEmail: string;
  recipientName: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  deliveryStatus: EmailDeliveryStatus | 'EMAIL INTEGRATION PENDING';
  read: boolean;
  failureReason?: string;
}

export interface EmailAuditRecord {
  id: string;
  notificationType: NotificationEventType | string;
  recipientEmail: string;
  recipientName: string;
  triggeredBy: string;
  relatedAppOrMemberId: string;
  subject: string;
  createdAt: string;
  deliveryStatus: EmailDeliveryStatus;
  deliveredAt?: string;
  failureReason?: string;
  missingConfigDetails?: string;
}

// ==================================================
// C-BRIDGE CAPABILITY DEVELOPMENT WORKSPACE TYPES
// ==================================================

export type ProposalStatusType =
  | 'PENDING'
  | 'APPROVED'
  | 'APPROVED_WITH_CHANGES'
  | 'REQUEST_MORE_DEVELOPMENT'
  | 'DEFERRED'
  | 'REJECTED';

export interface ProjectProposal {
  id: string;
  title: string;
  proposedBy: string; // e.g. "Samar Baydoun"
  proposalDate: string;
  origin: ProjectOrigin;
  originalReason: string;
  targetCapabilityArea: string;
  uploadedSources: { name: string; fileType?: string; size?: string; content?: string; link?: string }[];
  aiAnalysis?: SourceAnalysisResult;
  status: ProposalStatusType;
  husniDecision?: string;
  decisionDate?: string;
  modifications?: string;
  createdProjectId?: string;
}

export type ProjectSourceCategory =
  | 'OVERVIEW'
  | 'SYLLABUS'
  | 'COURSE OUTLINE'
  | 'MODULE OVERVIEW'
  | 'COURSE METHODOLOGY'
  | 'TRAINING MATERIAL'
  | 'STUDY MATERIAL'
  | 'READING MATERIAL'
  | 'ASSIGNMENT INSTRUCTIONS'
  | 'RESEARCH PAPER'
  | 'REGULATION'
  | 'STANDARD'
  | 'GOVERNMENT GUIDANCE'
  | 'WEBSITE / LINK'
  | 'CONFERENCE NOTES'
  | 'WEBINAR NOTES'
  | 'MEETING OUTCOME'
  | 'MARKET INTELLIGENCE'
  | 'PROFESSIONAL NOTES'
  | 'PREVIOUS C-BRIDGE WORK'
  | 'MEMBER KNOWLEDGE BACKGROUND'
  | 'HUSNI DIRECTION'
  | 'OTHER';

export interface SourceProvenance {
  sourceDerivedInfo: string[];
  aiInterpretation: string;
  memberContribution: string;
  husniDirection: string;
  cbridgeOriginalOutput: string;
}

export interface ProjectSource {
  id: string;
  projectId: string;
  title: string;
  category: ProjectSourceCategory;
  description: string;
  fileOrUrl?: string;
  fileType?: string;
  fileContent?: string;
  uploadedBy: string;
  uploadedAt: string;
  relatedModuleCode?: string;
  relatedAgendaItemId?: string;
  protectedMaterialFlag: boolean;
  sourceNotes?: string;
  aiProcessingStatus?: 'PENDING' | 'ANALYZED' | 'FAILED';
  provenance: SourceProvenance;
  analysisResult?: SourceAnalysisResult;
}

export interface LegacyCourseRequirementsMap {
  id: string;
  projectId: string;
  moduleCode: string;
  moduleName: string;
  description: string;
  objectives: string[];
  requiredKnowledgeAreas: string[];
  requiredTopics: string[];
  requiredReading: string[];
  requiredTasks: string[];
  assignments: string[];
  discussionRequirements: string[];
  expectedDeliverables: string[];
  instructorDirections: string; // "NOT PROVIDED" if missing
  dueDates: string; // "NOT PROVIDED" if missing
  availableStudyPeriod: string; // "NOT PROVIDED" if missing
  availableMemberTimeHours: number;
  extractedByAi?: boolean;
  status: 'DRAFT' | 'CONFIRMED';
  updatedAt: string;
}

export interface StudyAgendaDay {
  dayNumber: number;
  date: string;
  objective: string;
  relevantMaterial: string;
  academicTask: string;
  aiStudyActivity: string;
  clientDrivenApplication: string;
  expectedSessionOutcome: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVIEW';
}

export interface StudyAgenda {
  id: string;
  projectId: string;
  moduleCode: string;
  memberId: string;
  memberName: string;
  days: StudyAgendaDay[];
  availableStudyTimeHours: number;
  deadlineDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'REVISED';
  lastUpdated: string;
}

export type StudyMode =
  | 'CLIENT-DRIVEN STUDY'
  | 'GUIDED STUDY'
  | 'OPEN AI STUDY'
  | 'ACADEMIC TASK SUPPORT'
  | 'SOURCE DISCUSSION'
  | 'BRAINSTORMING'
  | 'RESEARCH DISCUSSION'
  | 'CONSULTING CONNECTION';

export interface ClientScenario {
  id: string;
  projectId: string;
  moduleCode: string;
  clientName: string;
  clientIndustry: string;
  clientProblem: string;
  currentStage: string;
  facts: string[];
  moduleConnections: string[];
  history: { sender: 'SIMULATED_CLIENT' | 'SAMAR' | 'AI_COACH' | 'SUPERVISOR'; text: string; timestamp: string }[];
}

export interface StudyPackage {
  id: string;
  projectId: string;
  memberId: string;
  memberName: string;
  courseModuleName: string;
  moduleObjectives: string[];
  requirements: string[];
  sourcesUsed: string[];
  requiredReading: string[];
  assignmentsAddressed: string[];
  keyConcepts: string[];
  memberNotes: string;
  importantAiDiscussions: { question: string; answer: string }[];
  importantQuestions: string[];
  importantAnswers: string[];
  externalReferences: string[];
  regulatoryReferences: string[];
  practicalApplications: string;
  clientScenarioHistory: string[];
  consultingObservations: string[];
  unresolvedQuestions: string[];
  topicsRequiringFurtherResearch: string[];
  potentialRelevanceToCBridge: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultingInsight {
  id: string;
  projectId: string;
  observedNeed: string;
  recurringInformationNeeds: string[];
  recurringClientQuestions: string[];
  recurringDocumentNeeds: string[];
  consultingProcessSteps: string[];
  riskPoints: string[];
  missingTemplatesChecklists: string[];
  researchGaps: string[];
  serviceOpportunities: string[];
  createdAt: string;
}

export interface AssetOpportunity {
  id: string;
  projectId: string;
  originatingMember: string;
  sourceStudyPackageId?: string;
  relatedStudySessionId?: string;
  relatedClientScenario?: string;
  observedNeed: string;
  proposedAsset: string;
  assetType: CBridgeAssetType;
  problemItSolves: string;
  intendedUser: string;
  potentialConsultingValue: string;
  supportingKnowledge: string[];
  relatedSources: string[];
  protectedSourceConsideration: string;
  aiRationale: string;
  memberComments: string;
  createdAt: string;
}

export interface AssetBrief {
  id: string;
  assetOpportunityId: string;
  assetName: string;
  assetType: CBridgeAssetType;
  problemItSolves: string;
  intendedUser: string;
  intendedUse: string;
  whenItIsUsed: string;
  requiredInputs: string[];
  expectedOutput: string;
  relatedCBridgeCapability: string;
  relatedService: string;
  sourceKnowledge: string[];
  regulatoryResearchBasis: string[];
  protectedSourceConsiderations: string;
  relatedExistingAssets: string[];
  developmentOwner: string;
  requiredQa: string; // 'Husni Hasan QA Signoff'
  supervisor: string; // 'Husni Hasan'
  aiDraftingRole: string;
  memberContribution: string;
  createdAt: string;
}

export interface ProjectAsset {
  id: string;
  projectId: string;
  assetBriefId?: string;
  assetName: string;
  assetType: CBridgeAssetType;
  version: string; // e.g. "v0.1-DRAFT"
  content: string;
  status: OfficialDocStatus;
  author: string;
  contributors: string[];
  qaFindings: string[];
  supervisorFeedback?: string;
  updatedAt: string;
}

export interface CBridgeAssetLibraryRecord {
  id: string;
  projectAssetId: string;
  assetName: string;
  assetType: CBridgeAssetType;
  version: string; // e.g. "v1.0"
  effectiveVersion: string;
  createdBy: string;
  contributors: string[];
  projectOfOrigin: string;
  approvedBy: string; // 'Husni Hasan'
  approvalDate: string;
  revisionHistory: { version: string; updatedBy: string; date: string; notes: string }[];
  relatedCapability: string;
  relatedService: string;
  relatedSources: string[];
  regulatoryBasis: string[];
  country: string;
  industry: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  content: string;
}

export interface AskSupervisorQuestion {
  id: string;
  member: string;
  projectId: string;
  moduleCode?: string;
  studySessionId?: string;
  clientScenario?: string;
  question: string;
  relevantContext: string;
  timestamp: string;
  supervisorResponse?: string;
  responseTimestamp?: string;
  status: 'OPEN' | 'ANSWERED';
}

// ==================================================
// C-BRIDGE CONSULTING CASE ROOM & PILOT V1 TYPES
// ==================================================

export type SourceProvenanceType = 
  | 'SYLLABUS'
  | 'SLIDE_DECK'
  | 'REGULATORY_TEXT'
  | 'FDA_GUIDANCE'
  | 'INSTRUCTOR_NOTES'
  | 'CASE_STUDY'
  | 'CLIENT_COMMUNICATION'
  | 'STATUTORY_CODE';

export interface SourceProvenanceRecord {
  id: string;
  projectId: string;
  moduleId: string;
  title: string;
  sourceType: SourceProvenanceType;
  uploadedBy: string;
  uploaderRole: string;
  uploadedAt: string;
  verifiedStatus: 'VERIFIED' | 'UNVERIFIED';
  referenceCitation: string;
  fileOrUrl?: string;
  extractedSnippet?: string;
  isProtectedCourseMaterial: boolean;
  notes?: string;
}

export interface StructuredRequirementAnalysis {
  id: string;
  projectId: string;
  moduleId: string;
  moduleTitle: string;
  sourceDerived: {
    statutoryRules: { id: string; rule: string; citation: string; sourceId: string }[];
    requiredReading: { id: string; title: string; section: string; sourceId: string }[];
    academicAssignments: { id: string; task: string; dueDate?: string }[];
    discussionTopics: { id: string; topic: string; context: string }[];
    instructorDirections: string;
    identifiedDeadlines: string;
  };
  aiInterpreted: {
    recommendedConsultingTopics: { id: string; topic: string; rationale: string }[];
    criticalConsultingQuestionsToAskClient: { id: string; category: string; question: string; purpose: string }[];
    observedRegulatoryRiskVectors: { id: string; risk: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; citation: string }[];
    potentialAssetOpportunities: { id: string; proposedName: string; type: CBridgeAssetType; problemSolved: string }[];
    unresolvedRequirementsGaps: { id: string; gap: string; recommendedAction: string }[];
  };
  lastSynthesizedAt: string;
}

export interface VirtualClientContact {
  id: string;
  name: string;
  title: string;
  role: 'CLIENT_CEO' | 'CLIENT_QUALITY_DIRECTOR' | 'CLIENT_COMPLIANCE_MGR' | 'CLIENT_OPERATIONS_LEAD';
  email: string;
  avatarBg: string;
  personalityNotes: string;
}

export interface VirtualClientCompanyProfile {
  companyId: string;
  companyName: string;
  brandIdentity: string;
  industryCategory: string;
  headquarters: string;
  annualImportVolume: string;
  operationalScale: string;
  productLines: { name: string; originCountry: string; highRiskCategory: boolean; sahcPotential: boolean }[];
  foreignSupplierFacilities: { facilityName: string; country: string; productsSupplied: string; certification: string; fdaRegistered: boolean }[];
  currentRegulatorySituation: string;
  primaryComplianceRisk: string;
  clientExecutiveObjectives: string[];
  contacts: VirtualClientContact[];
}

export type CaseRoomChannelType = 'CLIENT_ENGAGEMENT' | 'INTERNAL_CBRIDGE';

export interface ConsultingPracticeTopic {
  id: string;
  moduleId: string;
  title: string;
  regulatoryCitation: string;
  coreDilemma: string;
  suggestedDiagnosticGoal: string;
  relevantSourceIds: string[];
}

export type CaseParticipantRole = 
  | 'SAMAR_CONSULTANT'
  | 'CBRIDGE_CONSULTANT'
  | 'HUSNI_SUPERVISOR'
  | 'CONSULTING_SUPERVISOR'
  | 'AI_COACH'
  | 'CLIENT_EXEC'
  | 'CLIENT_QA'
  | 'CLIENT_COMPLIANCE'
  | 'CLIENT_ROLEPLAY_PARTICIPANT'
  | 'OBSERVER';

export interface CaseRoomParticipant {
  id: string;
  name: string;
  role: CaseParticipantRole;
  team: 'CLIENT_TEAM' | 'CBRIDGE_TEAM';
  title: string;
  isHuman: boolean;
  avatarBg: string;
  allowedChannels: CaseRoomChannelType[];
}

export type CaseRoomAttachmentVisibility = 'CLIENT_FACING' | 'INTERNAL_CBRIDGE';
export type CaseRoomAttachmentStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
export type CaseRoomFileCategory = 'DOCUMENT' | 'SPREADSHEET' | 'IMAGE' | 'TEXT' | 'OTHER';

export interface CaseRoomAttachment {
  id: string;
  projectId: string;
  moduleId: string;
  caseId: string;
  sessionId: string;
  messageId?: string;
  channelId: CaseRoomChannelType;
  uploadedByMemberId: string;
  activeRole: CaseParticipantRole;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  formattedSize: string;
  storageReference: string;
  uploadedAt: string;
  visibilityScope: CaseRoomAttachmentVisibility;
  processingStatus: CaseRoomAttachmentStatus;
  fileCategory: CaseRoomFileCategory;
  extractedTextSummary?: string;
  extractedTextSnippet?: string;
  downloadUrl?: string;
  errorMessage?: string;

  // Synthetic Case Document Engine Fields
  documentId?: string;
  documentType?: 
    | 'MASTER_PURCHASE_AGREEMENT'
    | 'CBP_ENTRY_SUMMARY_7501'
    | 'FDA_ACE_FSVP_ENTRY_DATA'
    | 'COMMERCIAL_INVOICE'
    | 'BILL_OF_LADING'
    | 'CUSTOMS_BROKER_AUTHORIZATION'
    | 'FDA_INQUIRY_NOTICE'
    | 'OTHER';
  title?: string;
  synthetic?: boolean;
  trainingOnly?: boolean;
  isHumanUploaded?: boolean;
  generatedByPersonaId?: string;
  generatedAt?: string;
  version?: string;
  auditStatus?: 'ACTIVE' | 'SUPERSEDED' | 'CANONICAL_INITIAL_OPENING' | string;
  auditNote?: string;
  auditHistory?: Array<{
    timestamp: string;
    action: string;
    auditStatus: string;
    actor: string;
    note: string;
  }>;
  disclosureStatus?: 'AVAILABLE_IN_CASE' | 'DISCLOSED';
  disclosedAt?: string;
  structuredEvidenceData?: any;
  evidenceReviewLogs?: Array<{
    reviewedAt: string;
    reviewerId: string;
    reviewerRole: string;
    action: string;
  }>;
}

export type AuthorityLevel =
  | 'LEVEL_1_PRIMARY_AUTHORITATIVE'
  | 'LEVEL_2_APPROVED_PROJECT_MATERIALS'
  | 'LEVEL_3_CANONICAL_CASE_EVIDENCE'
  | 'LEVEL_4_APPROVED_INTERNAL_KNOWLEDGE'
  | 'LEVEL_5_AUTHORITATIVE_EXTERNAL_RESEARCH'
  | 'LEVEL_6_AI_INFERENCE'
  | 'CLIENT_PROVIDED_INFORMATION'
  | 'NO_INDEPENDENT_AUTHORITY';

export type ClaimEvidenceClass =
  | 'SOURCE_DERIVED'
  | 'CLIENT_EVIDENCE'
  | 'CLIENT_ASSERTION'
  | 'AUTHORITATIVE_RESEARCH'
  | 'AI_INFERENCE'
  | 'CANONICAL_CASE_FACT'
  | 'DOCUMENT_FACT'
  | 'SESSION_ASSERTION'
  | 'PERSONA_BELIEF'
  | 'PERSONA_UNCERTAINTY'
  | 'CONFLICTING_EVIDENCE'
  | 'UNKNOWN';

export type ConfidenceState =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONFLICTING_EVIDENCE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'REQUIRES_CURRENT_VERIFICATION'
  | 'HUMAN_REVIEW_REQUIRED';

export type ClaimSupportStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'UNSUPPORTED'
  | 'CONFLICTING'
  | 'REQUIRES_VERIFICATION';

export interface ClaimLocation {
  page?: string | number;
  section?: string;
  field?: string;
  blockNumber?: string;
  regulationSubsection?: string;
  clause?: string;
  fieldVerifiedInOfficialSchema?: boolean;
  officialReference?: string;
}

export interface ClaimTrace {
  claimId: string;
  claimText: string;
  classification: ClaimEvidenceClass;
  supportingSourceIds: string[];
  supportingDocumentIds: string[];
  evidenceSnippet: string;
  reasoningRationale: string;
  confidenceState: ConfidenceState;
  authorityLevel: AuthorityLevel;
  location?: ClaimLocation;
  fieldLocationStatus?: 'VERIFIED_IN_OFFICIAL_SCHEMA' | 'FIELD_LOCATION_NOT_VERIFIED' | 'NOT_APPLICABLE';
  validationNotes?: string;
  wasSanitizedOrCorrected?: boolean;
}

export interface ClaimValidationMetrics {
  passed: boolean;
  unsupportedClaimsBlockedCount: number;
  falseLabelsPreventedCount: number;
  fieldNumberSanitizations: number;
  redundantDocumentRequestsPrevented: number;
  schemaVerificationStatus: 'PASSED_OFFICIAL_SCHEMA' | 'NO_SCHEMA_CLAIMS' | 'CORRECTED_TO_SCHEMA';
  validationChecks: Array<{
    checkName: string;
    status: 'PASS' | 'FAIL' | 'FLAGGED';
    details: string;
  }>;
}

export interface SourceTrace {
  traceId: string;
  queryOrContext: string;
  generatedAt: string;
  projectId: string;
  moduleId: string;
  caseId?: string;
  actingRole?: string;
  channel?: string;
  claims: ClaimTrace[];
  overallConfidence: ConfidenceState;
  authorityLevelsInvolved: AuthorityLevel[];
  evidenceSummary: string;
  unknownsOrGaps: string[];
  requiredNextVerification?: string;
  conflictDetails?: string;
  researchPerformed?: boolean;
  researchRecordIds?: string[];
  humanGovernanceNotice: string;
  validationMetrics?: ClaimValidationMetrics;
}

export interface CaseRoomMessage {
  id: string;
  roomId: string;
  projectId?: string;
  moduleId?: string;
  caseId?: string;
  sessionId?: string;
  channel: CaseRoomChannelType;
  senderId: string;
  senderName: string;
  senderRole: CaseParticipantRole;
  senderTeam: 'CLIENT_TEAM' | 'CBRIDGE_TEAM';
  text: string;
  messageType: 'CONSULTING_QUESTION' | 'CLIENT_ANSWER' | 'AI_COACH_TIP' | 'SUPERVISOR_NOTE' | 'TOOL_DRAFT' | 'SYSTEM_EVENT';
  timestamp: string;
  isoTimestamp: string;
  referencedProvenanceSources?: string[];
  consultingCategory?: 'SCOPE' | 'HAZARD_ANALYSIS' | 'SUPPLIER_VERIFICATION' | 'CORRECTIVE_ACTION' | 'STATUTORY_LIABILITY';
  coachEvaluation?: {
    questionQuality: 'EXCELLENT' | 'SOLID' | 'NEEDS_FOCUS';
    feedback: string;
    suggestedNextQuestion?: string;
  };
  attachments?: CaseRoomAttachment[];
  attachmentIds?: string[];
  sourceTrace?: SourceTrace;
  sourceTraceId?: string;
}

export type CaseWorkingToolType = 
  | 'CLIENT_DIAGNOSTIC_QUESTION_TREE'
  | 'FSVP_IMPORTER_DETERMINATION_MATRIX'
  | 'FOREIGN_SUPPLIER_HAZARD_WORKSHEET'
  | 'SAHC_VERIFICATION_ACTIVITY_DECISION_TREE'
  | 'CLIENT_INTAKE_GAP_REPORT';

export interface CaseWorkingTool {
  id: string;
  projectId: string;
  moduleId: string;
  roomId: string;
  title: string;
  toolType: CaseWorkingToolType;
  lifecycleCategory: 'CASE_WORKING_TOOL';
  status: 'DRAFT' | 'IN_REVIEW' | 'CLIENT_SHARED' | 'FINALIZED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  dataPayload: Record<string, any>;
  hasAssetPotential: boolean;
  assetOpportunityNote?: string;
}

export interface RoleSwitchAuditLog {
  id: string;
  caseParticipantId?: string;
  memberId?: string;
  userId: string;
  userName: string;
  previousRole: CaseParticipantRole;
  newRole: CaseParticipantRole;
  actor?: string;
  timestamp: string;
  isoTimestamp: string;
  reason: string;
  roomId?: string;
  projectId?: string;
}

export type ModuleStudySourceScope = 
  | 'MODULE_SPECIFIC'
  | 'COURSE_WIDE'
  | 'CROSS_MODULE_REFERENCE'
  | 'PREVIOUS_STUDY_PACKAGE';

export type ModuleStudySourceType = 
  | 'COURSE_WORKBOOK'
  | 'COURSE_MATERIAL'
  | 'MODULE_MATERIAL'
  | 'COURSE_READING'
  | 'ASSIGNMENT_INSTRUCTIONS'
  | 'REGULATORY_SOURCE'
  | 'RESEARCH'
  | 'MEMBER_NOTES'
  | 'HUSNI_DIRECTION'
  | 'PREVIOUS_STUDY_PACKAGE'
  | 'INHERITED_COURSE_SOURCE'
  | 'OTHER';

export type SourceProvenanceKind = 
  | 'ACADEMIC_COURSE_SOURCE'
  | 'ACADEMIC_REGULATORY_SOURCE'
  | 'MEMBER_GENERATED_STUDY_PACKAGE'
  | 'MEMBER_PROVIDED'
  | 'SUPERVISOR_DIRECTION'
  | 'EXTERNAL_RESEARCH'
  | 'AI_INTERPRETATION';

export type SourceCreationMethod = 
  | 'MANUAL_UPLOAD'
  | 'INHERITED_COURSE_SOURCE'
  | 'MEMBER_GENERATED'
  | 'AI_GENERATED'
  | 'MIGRATED_LEGACY'
  | 'SYSTEM_SEEDED'
  | 'EXTERNAL_REFERENCE';

export interface SourceModuleSectionMapping {
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  chapterOrSection: string;
  pageRange?: string;
  relevantTopics: string[];
  exercisesAndAssignments: string[];
  relevanceKind: 'PRIMARY_MODULE_CONTENT' | 'CROSS_MODULE_REFERENCE' | 'PREREQUISITE_FOUNDATION';
  notes?: string;
}

export interface SourceDeletionAudit {
  deletedAt: string;
  deletedByMemberId: string;
  deletedByDisplayName: string;
  reason?: string;
}

export interface ModuleStudySource {
  sourceId: string;
  projectId: string;
  moduleId: string;
  title: string;
  sourceType: ModuleStudySourceType;
  sourceScope?: ModuleStudySourceScope;
  provenanceKind: SourceProvenanceKind;
  creationMethod?: SourceCreationMethod;
  createdByMemberId?: string;
  createdByDisplayName?: string;
  createdAt?: string;
  originalFilename?: string;
  physicalDocumentId?: string;
  fileOrUrl?: string;
  fileSize?: string;
  fileType?: string;
  contentSnippet?: string;
  fullContent?: string;
  addedBy: string;
  addedByRole?: string;
  addedAt: string;
  analysisStatus: 'PENDING' | 'ANALYZED' | 'EXCLUDED';
  auditStatus?: 'ACTIVE' | 'REMOVED_FROM_MODULE' | 'ARCHIVED' | 'DELETED';
  isInherited?: boolean;
  isProtected?: boolean;
  selectedForGrounding?: boolean;
  citationRef?: string;
  notes?: string;
  applicableModules?: string[];
  moduleSectionMappings?: SourceModuleSectionMapping[];
  currentModuleRelevantSections?: string;
  sourceAuthorityRank?: number; // 1: Academic/Regulatory Original, 2: Course-wide Academic scoped, 3: Module-specific, 4: Member study package, 5: AI interpretation
  deletionAudit?: SourceDeletionAudit;
}

export type RequirementOrigin = 
  | 'SOURCE_DERIVED'
  | 'MEMBER_PROVIDED'
  | 'HUSNI_DIRECTION'
  | 'AI_INTERPRETATION'
  | 'AI_RECOMMENDATION'
  | 'CROSS_MODULE_REFERENCE';

export interface RequirementSourceEvidence {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  sourceScope: string;
  provenanceKind: string;
  chapterOrSection?: string;
  pageRange?: string;
  supportingExtract: string;
  regulatoryCitation?: string;
  authorityRank: number; // 1: Academic/Regulatory, 2: Course-wide Scoped, 3: Module-specific, 4: Study package supporting, 5: AI
  authorityLabel: string;
}

export type RequirementReviewStatus = 
  | 'PENDING_REVIEW'
  | 'PENDING_AI_RECOMMENDATION_REVIEW'
  | 'PENDING_DIRECTION_ACKNOWLEDGEMENT'
  | 'PENDING_MODULE_BOUNDARY_REVIEW'
  | 'CONFIRMED'
  | 'MEMBER_ACCEPTED_AI_STUDY_RECOMMENDATION'
  | 'DIRECTION_ACKNOWLEDGED'
  | 'MODULE_BOUNDARY_ACKNOWLEDGED'
  | 'FLAGGED_UNSUPPORTED'
  | 'CORRECTION_REQUESTED'
  | 'CLARIFICATION_REQUESTED';

export interface RequirementItem {
  id: string;
  category: 
    | 'OBJECTIVE'
    | 'KNOWLEDGE'
    | 'TOPIC'
    | 'READING'
    | 'ASSIGNMENT'
    | 'TASK'
    | 'DELIVERABLE'
    | 'REGULATORY_REF'
    | 'DEADLINE'
    | 'INSTRUCTOR_DIRECTION'
    | 'CROSS_MODULE_REFERENCE'
    | 'OUTSTANDING';
  title: string;
  description: string;
  origin: RequirementOrigin;
  sourceReferences: string[];
  statutoryCitations?: string[];
  evidenceList?: RequirementSourceEvidence[];
  reviewStatus?: RequirementReviewStatus;
  reviewAction?: string;
  status?: 'ACTIVE' | 'FLAGGED' | 'CONFIRMED' | 'CORRECTED';
  originalAiExtraction?: string;
  memberCorrection?: string;
  memberNotes?: string;
  flaggedReason?: string;
  clarificationQuestion?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedByMemberId?: string;
  reviewedByUid?: string;
  reviewedAt?: string;
}

export interface MemberRequirementComment {
  id: string;
  requirementId?: string;
  memberId: string;
  memberUid?: string;
  memberName: string;
  comment: string;
  action: 'CONFIRM' | 'COMMENT' | 'CORRECT_AI' | 'ADD_SOURCE' | 'ASK_AI' | 'FLAG_UNSUPPORTED' | 'REQUEST_CLARIFICATION' | string;
  timestamp: string;
}

export interface ModuleRequirementsMap {
  id: string;
  projectId: string;
  moduleId: string;
  moduleTitle: string;
  status: 'DRAFT' | 'MEMBER_REVIEWED';
  analyzedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  requirements: RequirementItem[];
  objectives: RequirementItem[];
  requiredReadings: RequirementItem[];
  assignmentsAndTasks: RequirementItem[];
  regulatoryReferences: RequirementItem[];
  deadlinesAndDirections: RequirementItem[];
  outstandingQuestions: RequirementItem[];
  memberReviewComments: MemberRequirementComment[];
}

export type TopicModuleRelevance = 'PRIMARY_MODULE_TOPIC' | 'CROSS_MODULE_REFERENCE';

export interface GroundedConsultingPracticeTopic {
  id: string;
  projectId: string;
  moduleId: string;
  topicName: string;
  whyThisTopicExists: string;
  moduleObjectivesCovered: string[];
  moduleRequirementsCovered: string[];
  supportingSources: string[];
  regulatoryReferences: string[];
  aiInterpretation?: string;
  relevanceCategory: TopicModuleRelevance;
  crossModuleNote?: string;
  suggestedDiagnosticGoal: string;
  isSelected?: boolean;
}

export interface CaseHiddenFact {
  id: string;
  category: string;
  fact: string;
  discoveryTrigger: string;
  isDiscovered: boolean;
}

export interface ConsultingCaseSetup {
  caseId: string;
  projectId: string;
  moduleId: string;
  selectedTopicId: string;
  topicTitle: string;
  isDemoCase?: boolean;
  
  // Virtual Company Profile (Non-hardcoded)
  virtualCompanyName: string;
  country: string;
  industry: string;
  businessModel: string;
  importActivities: string;
  products: { name: string; originCountry: string; category: string; highRiskCategory: boolean; sahcPotential: boolean }[];
  clientSituation: string;
  reasonForSeekingConsulting: string;
  relevantCaseConstraints: string;
  
  // Separation of Visible Initial Context vs Hidden Case Facts
  visibleInitialClientContext: string;
  hiddenCaseFacts: CaseHiddenFact[];
  
  status: 'DRAFT_PROPOSED' | 'CONFIRMED';
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export type CaseTeamMembershipType = 'CBRIDGE_CONSULTING' | 'CLIENT_ROLEPLAY';

export interface CaseHumanParticipant {
  caseParticipantId: string;
  memberId: string;
  name: string;
  title: string;
  teamMemberships: CaseTeamMembershipType[];
  permittedRoles: CaseParticipantRole[];
  defaultActiveRole: CaseParticipantRole;
  currentActiveRole?: CaseParticipantRole;
  isLead?: boolean;
  assignedClientPersonaId?: string;
  addedBy: string;
  addedAt: string;
}

export interface CaseTeamPersona {
  personaId: string;
  name: string;
  title: string;
  role: CaseParticipantRole;
  avatarBg: string;
  personality: string;
  isHumanParticipant: boolean;
  isAiClientLead?: boolean;
  assignedHumanMemberId?: string;
  assignedHumanName?: string;
}

export interface CaseTeamSetup {
  caseId: string;
  projectId?: string;
  moduleId?: string;
  clientTeam: CaseTeamPersona[];
  consultingTeam: {
    memberId: string;
    name: string;
    role: CaseParticipantRole;
    title: string;
    isLead: boolean;
    isAiCoach?: boolean;
  }[];
  humanParticipants?: CaseHumanParticipant[];
  activeHumanRole: CaseParticipantRole; // Enforces ONE active conversational role at a time
  confirmed: boolean;
  status?: 'DRAFT_PROPOSED' | 'CONFIRMED';
  confirmedAt?: string;
  confirmedBy?: string;
  gatesReviewed?: {
    clientPersonasReviewed: boolean;
    consultingTeamReviewed: boolean;
    humanRolesReviewed: boolean;
    defaultActiveRoleDefined: boolean;
  };
}

export interface AssetOpportunityRecord {
  id: string;
  projectId: string;
  moduleId: string;
  caseId: string;
  originatingMember: string;
  originatingMemberRole: string;
  observedNeed: string;
  proposedAsset: string;
  assetType: CBridgeAssetType;
  problemItSolves: string;
  intendedUser: string;
  supportingCaseEvidence: string;
  fromWorkingToolId?: string;
  status: 'IDENTIFIED_OPPORTUNITY' | 'BRIEF_REQUESTED' | 'IN_DEVELOPMENT' | 'ARCHIVED';
  createdAt: string;
}

export interface ConsultingLearningTrace {
  id: string;
  caseId: string;
  projectId: string;
  moduleId: string;
  consultingQuestionsAsked: number;
  factsDiscovered: string[];
  regulatoryConnectionsMade: string[];
  aiCoachTipsReceived: number;
  workingToolsCreated: string[];
  assetOpportunitiesIdentified: string[];
  synthesisSummary: string;
  lastUpdated: string;
}

export interface ModuleStudyPackage {
  id: string;
  projectId: string;
  moduleId: string;
  moduleName: string;
  memberId: string;
  memberName: string;
  packageTitle: string;
  createdAt: string;
  sourceReferences: string[];
  reviewedRequirementsSummary: string;
  keyConceptsSynthesized: string[];
  caseSimulationsCompleted: {
    caseId: string;
    companyName: string;
    topicName: string;
    keyTakeaway: string;
  }[];
  assetOpportunitiesProduced: string[];
  memberReflectionNotes: string;
  status: 'DRAFT_SYNTHESIS' | 'COMPLETED_STUDY_PACKAGE';
}

export type WorkflowWorkspaceType = 
  | 'MODULE_STUDY' 
  | 'COURSE_SETUP' 
  | 'CAPABILITY_DEV' 
  | 'CASE_ROOM' 
  | 'TODAYS_AGENDA' 
  | 'TASKS_OPERATIONS' 
  | 'PROJECTS_AGENDA' 
  | 'ASSET_LIBRARY';

export interface MemberWorkflowPosition {
  id?: string;
  memberId: string;
  memberName?: string;
  projectId: string;
  projectName?: string;
  moduleId: string;
  moduleName?: string;
  workspaceType: WorkflowWorkspaceType;
  workflowStep: number;
  workflowStepName: string;
  subview?: string;
  caseId?: string;
  caseTitle?: string;
  lastVisitedAt: string;
  activeHumanRole?: CaseParticipantRole;
  completionPercent?: number;
  statusLabel?: string;
  stepDescription?: string;
}

export interface ActiveWorkSummaryItem {
  id: string;
  projectId: string;
  projectName: string;
  moduleId: string;
  moduleName: string;
  workspaceType: WorkflowWorkspaceType;
  workflowStep: number;
  workflowStepName: string;
  stepDescription?: string;
  lastVisitedAt: string;
  caseId?: string;
  caseTitle?: string;
  priority?: string;
  targetDate?: string;
  statusText: string;
  badgeColor?: string;
}

export interface ModuleWorkflowState {
  id: string;
  projectId: string;
  projectName?: string;
  moduleId: string;
  moduleName?: string;
  memberId: string;
  memberName?: string;

  currentStep: number;
  workflowStatus: 'IN_PROGRESS' | 'READY_FOR_SIMULATION' | 'SIMULATION_ACTIVE' | 'COMPLETED';

  step1SourcesStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  step2AnalysisStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  step3MemberReviewStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'MEMBER_REVIEWED';
  step4PracticeTopicStatus: 'NOT_STARTED' | 'SELECTED' | 'COMPLETED';
  step5CaseSetupStatus: 'NOT_STARTED' | 'PROPOSED' | 'CONFIRMED';
  step6TeamSetupStatus: 'NOT_STARTED' | 'CONFIGURED' | 'CONFIRMED';
  step7CaseStatus: 'NOT_STARTED' | 'READY_TO_START' | 'IN_PROGRESS' | 'COMPLETED';
  step8StudyPackageStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

  selectedTopicId?: string;
  selectedTopicTitle?: string;

  acceptedCaseId?: string;
  acceptedCompanyName?: string;
  currentCaseId?: string;

  teamSetupId?: string;
  activeHumanRole?: CaseParticipantRole | string;

  lastVisitedStep: number;
  lastVisitedAt: string;

  updatedAt: string;
  workflowVersion: number;
}







