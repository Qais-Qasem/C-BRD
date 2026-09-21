import React, { useState, useEffect } from 'react';
import { getFirebaseAuth } from '../lib/firebase';
import {
  Project,
  ProjectSource,
  ModuleRequirementsMap,
  StudyAgenda,
  StudyAgendaDay,
  StudyMode,
  ClientScenario,
  StudyPackage,
  ConsultingInsight,
  AssetOpportunity,
  AssetBrief,
  ProjectAsset,
  CBridgeAssetLibraryRecord,
  AskSupervisorQuestion,
  UserRole,
  OfficialDocStatus,
  CBridgeAssetType
} from '../types';
import {
  Layers,
  BookOpen,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Send,
  Plus,
  HelpCircle,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Brain,
  MessageSquare,
  Shield,
  Eye,
  RefreshCw,
  Zap,
  CheckSquare,
  ChevronRight,
  UserCheck,
  Award,
  Upload,
  Bot,
  User,
  Sliders,
  Tag
} from 'lucide-react';
import { AskSupervisorModal } from './AskSupervisorModal';
import { ProjectSourceLibraryModal } from './ProjectSourceLibraryModal';

interface CapabilityDevelopmentWorkspaceProps {
  currentProject: Project;
  projects: Project[];
  sources: ProjectSource[];
  currentUser: UserRole;
  onSelectProject: (projectId: string) => void;
  onAddSource: (source: ProjectSource) => void;
  onSubmitSupervisorQuestion: (question: AskSupervisorQuestion) => void;
  onPromoteAssetToLibrary: (libraryRecord: CBridgeAssetLibraryRecord) => void;
  onNavigateToCaseRoom?: () => void;
  supervisorQuestions: AskSupervisorQuestion[];
}

export const CapabilityDevelopmentWorkspace: React.FC<CapabilityDevelopmentWorkspaceProps> = ({
  currentProject,
  projects,
  sources,
  currentUser,
  onSelectProject,
  onAddSource,
  onSubmitSupervisorQuestion,
  onPromoteAssetToLibrary,
  onNavigateToCaseRoom,
  supervisorQuestions
}) => {
  // Main Environment State: 1. STUDY WORKSPACE, 2. CONSULTING LAB, 3. ASSET LAB
  const [activeEnvironment, setActiveEnvironment] = useState<'STUDY' | 'CONSULTING' | 'ASSET'>('STUDY');

  // Modals
  const [isAskSupervisorOpen, setIsAskSupervisorOpen] = useState(false);
  const [isSourceLibraryOpen, setIsSourceLibraryOpen] = useState(false);

  // Workspace Local Data State
  const [moduleMap, setModuleMap] = useState<ModuleRequirementsMap>({
    id: `MAP-${currentProject.id}`,
    projectId: currentProject.id,
    moduleCode: 'SB-9113',
    moduleName: 'U.S. Food Import & FSVP Development',
    description: 'Study and practical development of 21 CFR 1.500 Foreign Supplier Verification Programs.',
    objectives: [
      'Master statutory requirements under 21 CFR 1.500 subparts A through L',
      'Analyze hazard determination obligations for foreign food facilities',
      'Establish foreign supplier verification activities and onsite audit protocols',
      'Develop client-facing audit readiness tools and checklists'
    ],
    requiredKnowledgeAreas: ['21 CFR Part 1 Subpart L', 'FDA FSVP Draft Guidance for Industry', 'GFSI & SAHC Standards'],
    requiredTopics: ['FSVP Importer Definition', 'Hazard Analysis', 'Supplier Verification Activities', 'Corrective Actions', 'Recordkeeping'],
    requiredReading: ['21 CFR 1.500 - 1.514', 'FDA FSVP Importer Guidance'],
    requiredTasks: ['Evaluate foreign supplier compliance records', 'Review Qualified Auditor qualifications'],
    assignments: ['Draft FSVP Importer Determination Procedure'],
    discussionRequirements: ['Discussion on SAHC audit exemption criteria'],
    expectedDeliverables: ['FSVP Foreign Supplier Review Checklist'],
    instructorDirections: 'NOT PROVIDED',
    dueDates: 'NOT PROVIDED',
    availableStudyPeriod: 'NOT PROVIDED',
    availableMemberTimeHours: 25,
    status: 'CONFIRMED',
    updatedAt: new Date().toISOString()
  });

  // Get Firebase Auth ID token header helper
  const getAuthHeaders = async () => {
    const auth = getFirebaseAuth();
    if (auth?.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        return { 'Authorization': `Bearer ${token}` };
      } catch (err) {
        console.error('Failed to get Firebase ID token:', err);
      }
    }
    return {};
  };

  const recordTypeMap: Record<string, string> = {
    project_proposals: 'PROJECT_PROPOSAL',
    project_sources: 'PROJECT_SOURCE',
    module_requirements_maps: 'MODULE_REQUIREMENTS_MAP',
    study_agendas: 'STUDY_AGENDA',
    study_sessions: 'STUDY_SESSION',
    client_scenarios: 'CLIENT_SCENARIO',
    study_packages: 'STUDY_PACKAGE',
    consulting_insights: 'CONSULTING_INSIGHT',
    asset_opportunities: 'ASSET_OPPORTUNITY',
    asset_briefs: 'ASSET_BRIEF',
    project_assets: 'PROJECT_ASSET',
    supervisor_questions: 'SUPERVISOR_QUESTION'
  };

  // Save record to Firestore helper
  const saveRecord = async (collectionName: string, docId: string, record: any) => {
    try {
      const headers = await getAuthHeaders();
      const recordType = recordTypeMap[collectionName] || collectionName;
      await fetch('/api/workspace/save-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ recordType, docId, record })
      });
    } catch (err) {
      console.error(`Error saving ${collectionName} record:`, err);
    }
  };

  // Sync workspace records with Firestore
  useEffect(() => {
    const loadWorkspaceRecords = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/workspace/records', { headers });
        const result = await res.json();
        if (result.success && result.data) {
          const d = result.data;
          if (d.moduleRequirementsMaps && d.moduleRequirementsMaps.length > 0) {
            const matchMap = d.moduleRequirementsMaps.find((m: any) => m.projectId === currentProject.id);
            if (matchMap) setModuleMap(matchMap);
          }
          if (d.studyAgendas && d.studyAgendas.length > 0) {
            const matchAgenda = d.studyAgendas.find((a: any) => a.projectId === currentProject.id);
            if (matchAgenda && matchAgenda.days) setStudyAgenda(matchAgenda.days);
          }
          if (d.consultingInsights && d.consultingInsights.length > 0) {
            const matchInsight = d.consultingInsights.find((i: any) => i.projectId === currentProject.id);
            if (matchInsight) setConsultingInsight(matchInsight);
          }
          if (d.assetOpportunities && d.assetOpportunities.length > 0) {
            const matchOpps = d.assetOpportunities.filter((o: any) => o.projectId === currentProject.id);
            if (matchOpps.length > 0) setAssetOpportunities(matchOpps);
          }
          if (d.assetBriefs && d.assetBriefs.length > 0) {
            const matchBrief = d.assetBriefs.find((b: any) => b.projectId === currentProject.id);
            if (matchBrief) setAssetBrief(matchBrief);
          }
          if (d.projectAssets && d.projectAssets.length > 0) {
            const matchAssets = d.projectAssets.filter((a: any) => a.projectId === currentProject.id);
            if (matchAssets.length > 0) setProjectAssets(matchAssets);
          }
        }
      } catch (err) {
        console.error('Failed to load workspace records from Firestore:', err);
      }
    };
    loadWorkspaceRecords();
  }, [currentProject.id]);

  const [studyAgenda, setStudyAgenda] = useState<StudyAgendaDay[]>([
    {
      dayNumber: 1,
      date: 'Day 1',
      objective: 'Master FSVP Scope & Importer Definitions under 21 CFR 1.500',
      relevantMaterial: '21 CFR 1.500 - 1.501; FDA Importer Guidance',
      academicTask: 'Analyze statutory definition of FSVP Importer vs Owner/Consignee',
      aiStudyActivity: 'Roleplay FDA border inspection inquiry on Importer of Record',
      clientDrivenApplication: 'Determine statutory FSVP Importer status for Global Food Imports LLC',
      expectedSessionOutcome: 'FSVP Importer Identification Determination Note',
      status: 'COMPLETED'
    },
    {
      dayNumber: 2,
      date: 'Day 2',
      objective: 'Analyze Hazard Analysis Obligations under 21 CFR 1.504',
      relevantMaterial: '21 CFR 1.504; FDA Hazard Analysis Draft Guidance',
      academicTask: 'Identify mandatory biological, chemical, and physical hazards in food imports',
      aiStudyActivity: 'Brainstorm SAHC-specific hazards for imported bakery ingredients',
      clientDrivenApplication: 'Evaluate foreign supplier hazard analysis document for compliance gaps',
      expectedSessionOutcome: 'Hazard Verification Review Protocol for Client',
      status: 'IN_PROGRESS'
    },
    {
      dayNumber: 3,
      date: 'Day 3',
      objective: 'Evaluate Verification Activities & Annual Audits (21 CFR 1.506)',
      relevantMaterial: '21 CFR 1.506; Onsite Auditing & Sampling Guidance',
      academicTask: 'Study requirements for annual onsite audits vs record reviews',
      aiStudyActivity: 'AI Coach Q&A on GFSI audit certificate acceptance rules',
      clientDrivenApplication: 'Determine verification procedure for Supplier X (high risk vs standard)',
      expectedSessionOutcome: 'Foreign Supplier Verification Selection Matrix',
      status: 'PENDING'
    },
    {
      dayNumber: 4,
      date: 'Day 4',
      objective: 'Formulate Corrective Action Protocols (21 CFR 1.508)',
      relevantMaterial: '21 CFR 1.508; Corrective Actions & Import Alerts',
      academicTask: 'Review statutory steps when supplier non-compliance is detected',
      aiStudyActivity: 'Simulate emergency audit failure escalation with client',
      clientDrivenApplication: 'Draft Corrective Action Response for Client foreign supplier',
      expectedSessionOutcome: 'Supplier Discontinuation & CA Protocol',
      status: 'PENDING'
    },
    {
      dayNumber: 5,
      date: 'Day 5',
      objective: 'Synthesize Study Package & Identify C-Bridge Asset Opportunities',
      relevantMaterial: 'All Module outputs; C-Bridge Asset Taxonomy',
      academicTask: 'Consolidate study notes and regulatory citations',
      aiStudyActivity: 'Consulting Lab: derive reusable C-Bridge SOPs & Checklists',
      clientDrivenApplication: 'Present full FSVP Readiness Package to Virtual Client',
      expectedSessionOutcome: 'Completed Study Package & Asset Opportunities Proposal',
      status: 'PENDING'
    }
  ]);

  // Interactive Client-Driven Study State
  const [selectedStudyMode, setSelectedStudyMode] = useState<StudyMode>('CLIENT-DRIVEN STUDY');
  const [activeAiRole, setActiveAiRole] = useState<'SIMULATED_CLIENT' | 'AI_COACH'>('SIMULATED_CLIENT');
  const [chatMessages, setChatMessages] = useState<{ sender: 'SAMAR' | 'SIMULATED_CLIENT' | 'AI_COACH' | 'SUPERVISOR'; text: string; timestamp: string }[]>([
    {
      sender: 'SIMULATED_CLIENT',
      text: 'Hello Samar, we are Global Food Imports LLC. We import specialty olive oils and bakery ingredients from Mediterranean suppliers. FDA requested our FSVP records during entry. Do we need our foreign supplier to give us their full hazard analysis, or can we just rely on their ISO 22000 certificate?',
      timestamp: '10:00 AM'
    },
    {
      sender: 'AI_COACH',
      text: 'AI Coach Tip: Under 21 CFR 1.504, the FSVP importer must have a written hazard analysis or review the foreign supplier hazard analysis. An ISO 22000 certificate alone does NOT replace a statutory hazard analysis under US FDA rules.',
      timestamp: '10:01 AM'
    }
  ]);
  const [chatInputText, setChatInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Study Package & Consulting Insights State
  const [currentStudyPackage, setCurrentStudyPackage] = useState<StudyPackage | null>(null);
  const [consultingInsight, setConsultingInsight] = useState<ConsultingInsight | null>({
    id: `INS-${currentProject.id}`,
    projectId: currentProject.id,
    observedNeed: 'U.S. food importers struggle to distinguish between FDA Facility Registration and FSVP Importer Verification, leading to compliance risk during border entry.',
    recurringInformationNeeds: ['Statutory FSVP Importer Definition', 'GFSI vs FDA Audit Standards', 'SAHC Hazard Exemption Criteria'],
    recurringClientQuestions: ['Is an ISO certificate sufficient for FDA FSVP?', 'Who is the legal FSVP Importer if goods are consigned to a warehouse?'],
    recurringDocumentNeeds: ['Foreign Supplier Review Checklist', 'FSVP Importer Declaration Form', 'Corrective Action Protocol'],
    consultingProcessSteps: ['1. Determine Statutory Importer Status', '2. Review Foreign Supplier Hazard Analysis', '3. Select Verification Activity', '4. Archive Audit Trail'],
    riskPoints: ['FDA Import Alert placement due to missing written hazard analysis'],
    missingTemplatesChecklists: ['FSVP Foreign Supplier Evaluation Checklist', 'Qualified Auditor Certificate Audit Log'],
    serviceOpportunities: ['Turnkey FSVP Audit Readiness Package for Food Distributors'],
    createdAt: new Date().toISOString()
  });

  const [assetOpportunities, setAssetOpportunities] = useState<AssetOpportunity[]>([
    {
      id: `OPP-01`,
      projectId: currentProject.id,
      originatingMember: 'Samar Baydoun',
      observedNeed: 'Standardized foreign supplier food safety evaluation checklist for 21 CFR 1.506 audits',
      proposedAsset: 'FSVP Foreign Supplier Review Checklist',
      assetType: 'CHECKLIST',
      problemItSolves: 'Standardizes foreign supplier evaluation and eliminates missed statutory verification steps',
      intendedUser: 'C-Bridge Regulatory Consultants & Client QA Managers',
      potentialConsultingValue: 'Accelerates client FSVP audit preparation by 60%',
      supportingKnowledge: ['21 CFR 1.506', 'FDA FSVP Guidance'],
      relatedSources: ['FDA FSVP Draft Guidance'],
      protectedSourceConsideration: 'C-Bridge original synthesis; no external text copied verbatim.',
      aiRationale: 'Derived from recurring client inquiry during virtual case analysis.',
      memberComments: 'Crucial asset needed for Samar Baydoun daily consulting execution.',
      createdAt: new Date().toISOString()
    }
  ]);

  const [assetBrief, setAssetBrief] = useState<AssetBrief | null>(null);
  const [projectAssets, setProjectAssets] = useState<ProjectAsset[]>([
    {
      id: `AST-FSVP-01`,
      projectId: currentProject.id,
      assetName: 'FSVP Foreign Supplier Review Checklist',
      assetType: 'CHECKLIST',
      version: 'v0.1-DRAFT',
      content: `# C-BRIDGE CONTROLLED DOCUMENT

**DOCUMENT NAME:** FSVP Foreign Supplier Review Checklist
**DOCUMENT CODE:** AST-FSVP-01
**VERSION:** v0.1-DRAFT
**AUTHOR:** Samar Baydoun
**SUPERVISOR / FINAL AUTHORITY:** Husni Hasan
**REGULATORY BASIS:** 21 CFR Part 1 Subpart L (21 CFR 1.500 - 1.514)

---

## 1. PURPOSE
This checklist establishes a standardized verification procedure for C-Bridge consultants to evaluate whether a foreign food supplier satisfies all statutory requirements under 21 CFR 1.506 prior to food import into the United States.

## 2. SCOPE
Applies to all foreign suppliers providing food products imported by C-Bridge clients subject to FDA Foreign Supplier Verification Program (FSVP) regulations.

## 3. CHECKLIST PROTOCOL
- [ ] **A.1** Importer DUNS Number verified on FDA Portal.
- [ ] **A.2** Foreign Supplier Facility FDA Registration confirmed.
- [ ] **B.1** Written Hazard Analysis reviewed for biological, chemical, and physical hazards.
- [ ] **C.1** Annual onsite audit on file if SAHC hazard is present.
`,
      status: 'UNDER DEVELOPMENT',
      author: 'Samar Baydoun',
      contributors: ['C-Bridge AI Coach'],
      qaFindings: ['Awaiting Husni Hasan Supervisor QA Review & Signoff'],
      updatedAt: new Date().toISOString()
    }
  ]);

  // Extract / Update Requirements Map with Gemini
  const handleExtractRequirements = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/cbridge-ai/extract-module-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleCode: moduleMap.moduleCode,
          moduleName: moduleMap.moduleName,
          sourceText: sources.map(s => s.description || s.title).join('\n'),
          availableHours: moduleMap.availableMemberTimeHours
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.map) {
        setModuleMap({
          ...moduleMap,
          ...data.map,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to extract module requirements:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Recalculate Study Agenda
  const handleRecalculateAgenda = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/cbridge-ai/generate-study-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleMap,
          deadlineDate: 'End of Current Cycle'
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.days) {
        setStudyAgenda(data.days);
      }
    } catch (err) {
      console.error('Failed to generate study agenda:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Interactive Chat (Client or AI Coach)
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const userText = chatInputText.trim();
    const newMsg = { sender: 'SAMAR' as const, text: userText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInputText('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/cbridge-ai/client-study-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedStudyMode,
          role: activeAiRole,
          userPrompt: userText,
          scenarioContext: { clientName: 'Global Food Imports LLC', clientProblem: 'FSVP setup for Mediterranean supplier' },
          moduleContext: { moduleName: moduleMap.moduleName },
          moduleRequirements: moduleMap
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.text) {
        setChatMessages(prev => [
          ...prev,
          {
            sender: activeAiRole,
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Synthesize Study Package
  const handleSynthesizeStudyPackage = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/cbridge-ai/synthesize-study-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleName: moduleMap.moduleName,
          memberName: 'Samar Baydoun',
          notes: moduleMap.objectives,
          discussionHistory: chatMessages,
          clientScenario: { clientName: 'Global Food Imports LLC' }
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.packageData) {
        setCurrentStudyPackage({
          id: `PKG-${Date.now().toString().slice(-6)}`,
          projectId: currentProject.id,
          memberId: 'MBR-001',
          memberName: 'Samar Baydoun',
          ...data.packageData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to synthesize study package:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Analyze Consulting Insights & Derive Asset Opportunities
  const handleAnalyzeConsultingInsights = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/cbridge-ai/analyze-consulting-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyPackage: currentStudyPackage,
          clientScenario: { clientName: 'Global Food Imports LLC' }
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success) {
        if (data.insight) {
          setConsultingInsight({
            id: `INS-${Date.now().toString().slice(-6)}`,
            projectId: currentProject.id,
            ...data.insight,
            createdAt: new Date().toISOString()
          });
        }
        if (data.assetOpportunities) {
          const newOpps = data.assetOpportunities.map((opp: any, idx: number) => ({
            id: `OPP-${Date.now().toString().slice(-4)}-${idx}`,
            projectId: currentProject.id,
            originatingMember: 'Samar Baydoun',
            ...opp,
            createdAt: new Date().toISOString()
          }));
          setAssetOpportunities(prev => [...prev, ...newOpps]);
        }
      }
    } catch (err) {
      console.error('Failed to analyze consulting insights:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Generate Asset Brief
  const handleGenerateAssetBrief = async (opportunity: AssetOpportunity) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/cbridge-ai/generate-asset-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.brief) {
        setAssetBrief({
          id: `BRF-${Date.now().toString().slice(-6)}`,
          assetOpportunityId: opportunity.id,
          ...data.brief,
          createdAt: new Date().toISOString()
        });
        setActiveEnvironment('ASSET');
      }
    } catch (err) {
      console.error('Failed to generate asset brief:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit Asset for QA Review
  const handleSubmitForQa = async (assetId: string) => {
    setIsAiLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/governance/authorized-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          actionType: 'SUBMIT_FOR_QA',
          targetId: assetId
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.asset) {
        setProjectAssets(prev => prev.map(a => a.id === assetId ? data.asset : a));
      }
    } catch (err) {
      console.error('Submit for QA error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Perform QA Review
  const handlePerformQaReview = async (assetId: string, qaPassed: boolean) => {
    setIsAiLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/governance/authorized-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          actionType: 'PERFORM_QA_REVIEW',
          targetId: assetId,
          payload: { qaPassed, qaFindings: ['QA Review completed by authorized reviewer. Statutory 21 CFR 1.500 compliance confirmed.'] }
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.asset) {
        setProjectAssets(prev => prev.map(a => a.id === assetId ? data.asset : a));
      } else if (data.flag || data.error) {
        alert(`${data.flag || 'QA AUTHORIZATION REQUIRED'}: ${data.error}`);
      }
    } catch (err) {
      console.error('Perform QA Review error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Promote Asset to Library via Server-Side Authorization Check
  const handlePromoteToLibrary = async (asset: ProjectAsset) => {
    setIsAiLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/governance/authorized-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          actionType: 'SUPERVISOR_APPROVE_ASSET',
          targetId: asset.id,
          payload: { projectName: currentProject.name, sources: sources.map(s => s.title) }
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.asset && data.libraryRecord) {
        onPromoteAssetToLibrary(data.libraryRecord);
        setProjectAssets(prev => prev.map(a => a.id === asset.id ? data.asset : a));
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Promote asset error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div id="capability-development-workspace" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Workspace Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-600/30 border border-indigo-400/40 rounded-2xl text-indigo-300">
            <Layers className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md">
                ENVIRONMENT: {currentProject.environment || 'REAL ACTIVE'}
              </span>
              <span className="text-xs font-mono text-slate-300">
                Project ID: <strong>{currentProject.id}</strong>
              </span>
            </div>
            <h1 className="text-xl font-black mt-1">{currentProject.name}</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              C-Bridge Capability Development Workspace connecting study, virtual client consulting, and reusable asset creation under Husni Hasan supervisor governance.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsSourceLibraryOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-indigo-300" /> Source Library ({sources.filter(s => s.projectId === currentProject.id).length})
          </button>
          <button
            onClick={() => setIsAskSupervisorOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <HelpCircle className="h-4 w-4" /> Ask Supervisor (Husni)
          </button>
        </div>
      </div>

      {/* Environments Bar (3 Connected Workspace Environments) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveEnvironment('STUDY')}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeEnvironment === 'STUDY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            1. STUDY WORKSPACE
          </button>

          <button
            onClick={() => setActiveEnvironment('CONSULTING')}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeEnvironment === 'CONSULTING'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            2. CONSULTING LAB
          </button>

          <button
            onClick={() => setActiveEnvironment('ASSET')}
            className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeEnvironment === 'ASSET'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            3. ASSET LAB
          </button>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto px-2">
          <span className="text-xs text-slate-500 font-bold hidden md:inline">Project Context:</span>
          <select
            value={currentProject.id}
            onChange={(e) => onSelectProject(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ================================================== */}
      {/* ENVIRONMENT 1 — STUDY WORKSPACE */}
      {/* ================================================== */}
      {activeEnvironment === 'STUDY' && (
        <div className="space-y-6">
          
          {/* Module Requirements Map Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Module Requirements Map</h3>
                  <p className="text-xs text-slate-500">
                    Extracted study objectives, required reading, and deliverables. Missing inputs are explicitly flagged as "NOT PROVIDED".
                  </p>
                </div>
              </div>

              <button
                onClick={handleExtractRequirements}
                disabled={isAiLoading}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAiLoading ? 'animate-spin' : ''}`} /> Re-Extract Map
              </button>
            </div>

            {/* Grid of Extracted Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider">Objectives ({moduleMap.objectives.length})</div>
                <ul className="space-y-1.5 text-slate-700">
                  {moduleMap.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider">Required Reading & Tasks</div>
                <div className="space-y-1 text-slate-700">
                  <div className="font-semibold text-slate-900">Readings:</div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {moduleMap.requiredReading.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  <div className="font-semibold text-slate-900 mt-2">Assignments:</div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    {moduleMap.assignments.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider">Course Boundaries & Timeline</div>
                <div className="space-y-1.5 text-slate-700">
                  <div><strong>Instructor Directions:</strong> <span className="font-mono text-amber-700">{moduleMap.instructorDirections}</span></div>
                  <div><strong>Due Dates:</strong> <span className="font-mono text-amber-700">{moduleMap.dueDates}</span></div>
                  <div><strong>Available Study Period:</strong> <span className="font-mono text-amber-700">{moduleMap.availableStudyPeriod}</span></div>
                  <div><strong>Member Available Hours:</strong> <span className="font-bold text-slate-900">{moduleMap.availableMemberTimeHours} hrs/week</span></div>
                </div>
              </div>

            </div>
          </div>

          {/* AI Calculated Study Agenda */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">AI Calculated Study Agenda</h3>
                  <p className="text-xs text-slate-500">
                    Day-by-day study sessions directly linking study tasks to Client-Driven Applications.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRecalculateAgenda}
                disabled={isAiLoading}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAiLoading ? 'animate-spin' : ''}`} /> Recalculate Agenda
              </button>
            </div>

            <div className="space-y-3">
              {studyAgenda.map((day) => (
                <div key={day.dayNumber} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 md:max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-800 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                        DAY {day.dayNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{day.objective}</h4>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Client Application:</strong> {day.clientDrivenApplication}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500 font-mono hidden lg:inline">{day.expectedSessionOutcome}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                      day.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      day.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {day.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Client-Driven Study Workspace */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Client-Driven Study & Continuous Client Case</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Interactive case simulation with two distinct AI roles: Simulated Client & C-Bridge AI Coach.
                </p>
              </div>

              {/* AI Role Switcher */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveAiRole('SIMULATED_CLIENT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeAiRole === 'SIMULATED_CLIENT' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <User className="h-3.5 w-3.5 text-indigo-600" /> Virtual Client
                </button>
                <button
                  onClick={() => setActiveAiRole('AI_COACH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeAiRole === 'AI_COACH' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Bot className="h-3.5 w-3.5 text-emerald-600" /> C-Bridge AI Coach
                </button>
              </div>
            </div>

            {/* Chat History Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-80 overflow-y-auto space-y-3 font-sans text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-2xl p-3 rounded-2xl space-y-1 ${
                    msg.sender === 'SAMAR'
                      ? 'ml-auto bg-indigo-600 text-white rounded-br-none'
                      : msg.sender === 'AI_COACH'
                      ? 'mr-auto bg-slate-800 border border-emerald-500/40 text-emerald-200 rounded-bl-none'
                      : 'mr-auto bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-80">
                    <span className="font-bold uppercase tracking-wider">
                      {msg.sender === 'SAMAR' ? 'Samar Baydoun (Capability Developer)' : msg.sender === 'AI_COACH' ? 'C-Bridge AI Coach' : 'Virtual Client (Global Food Imports LLC)'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="leading-relaxed text-xs whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))}
              {isAiLoading && (
                <div className="mr-auto bg-slate-800 text-slate-400 p-3 rounded-xl flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                  <span>C-Bridge AI is processing your input...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={
                  activeAiRole === 'SIMULATED_CLIENT'
                    ? 'Respond to the Virtual Client as Samar Baydoun...'
                    : 'Ask C-Bridge AI Coach: "Help me think", "Explain 21 CFR 1.506", "Suggest client questions"...'
                }
                className="flex-1 text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isAiLoading || !chatInputText.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Send
              </button>
            </form>

            {/* Quick Helper Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChatInputText('Help me think through the hazard analysis required under 21 CFR 1.504 for olive oil imports.')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
              >
                💡 "Help Me Think"
              </button>
              <button
                type="button"
                onClick={() => setChatInputText('What specific questions should I ask Global Food Imports LLC regarding their foreign supplier GFSI certificates?')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
              >
                ❓ "Suggest Client Questions"
              </button>
              <button
                type="button"
                onClick={handleSynthesizeStudyPackage}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold ml-auto flex items-center gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" /> Synthesize Study Package
              </button>
            </div>
          </div>

          {/* Module Coverage (NO Student Score or Student Grades!) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              <CheckSquare className="h-4 w-4 text-emerald-600" /> Module Coverage Progress
            </div>
            <p>
              Coverage tracking monitors objective completion, assignment addressing, and source reading. <strong>Anti-Exam Philosophy Enforced:</strong> No numeric 0-100 student capability scores or student grades are generated.
            </p>
          </div>

          {/* CLEAR TRANSITION BOUNDARY BANNER (PART 22) */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 rounded-2xl p-6 text-white shadow-lg text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
              <ArrowRight className="h-4 w-4 text-indigo-400" />
              CLEAR TRANSITION BOUNDARY
            </div>
            <h2 className="text-lg font-black text-white">
              END OF COURSE / TRAINING-BASED LEARNING → C-BRIDGE PROFESSIONAL APPLICATION
            </h2>
            <p className="text-xs text-indigo-200 max-w-2xl mx-auto">
              Academic study and training material have been completed and synthesized into a structured Study Package. Move into the <strong>Consulting Lab</strong> to derive reusable consulting insights and service offerings.
            </p>
            <button
              onClick={() => {
                handleAnalyzeConsultingInsights();
                setActiveEnvironment('CONSULTING');
              }}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" /> Enter Consulting Lab & Derive Asset Opportunities
            </button>
          </div>

        </div>
      )}

      {/* ================================================== */}
      {/* ENVIRONMENT 2 — CONSULTING LAB */}
      {/* ================================================== */}
      {activeEnvironment === 'CONSULTING' && (
        <div className="space-y-6">
          
          {/* Pilot Banner for Consulting Case Room */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    PILOT AVAILABLE
                  </span>
                  <span className="text-xs font-mono text-slate-300">PRJ-324 / MA-324-01</span>
                </div>
                <h4 className="font-bold text-sm text-slate-100 mt-1">Live Module Consulting Case Room (Apex Mediterranean Imports)</h4>
                <p className="text-xs text-slate-300 mt-0.5">Engage in diagnostic questioning with the virtual client executive team and access C-Bridge backstage coaching.</p>
              </div>
            </div>

            {onNavigateToCaseRoom && (
              <button
                onClick={onNavigateToCaseRoom}
                className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                Enter Consulting Case Room <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">C-Bridge Consulting Lab & Insights Engine</h3>
                  <p className="text-xs text-slate-500">
                    Professional development environment deriving client problems, document requirements, and service opportunities.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAnalyzeConsultingInsights}
                disabled={isAiLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Sparkles className="h-4 w-4" /> Derive New Insights & Asset Opportunities
              </button>
            </div>

            {/* Derived Consulting Insights */}
            {consultingInsight && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider">Observed Client Need</div>
                  <p className="text-slate-800 font-medium">{consultingInsight.observedNeed}</p>
                  
                  <div className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider pt-2">Recurring Client Questions</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {consultingInsight.recurringClientQuestions.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider">Consulting Process Steps</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    {consultingInsight.consultingProcessSteps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>

                  <div className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider pt-2">Service Opportunities</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {consultingInsight.serviceOpportunities.map((so, i) => <li key={i}>{so}</li>)}
                  </ul>
                </div>

              </div>
            )}

            {/* Identified Asset Opportunities List */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" /> Identified Asset Opportunities ({assetOpportunities.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assetOpportunities.map((opp) => (
                  <div key={opp.id} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="bg-indigo-100 text-indigo-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-md uppercase">
                        {opp.assetType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{opp.id}</span>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{opp.proposedAsset}</h5>
                      <p className="text-xs text-slate-600 mt-1">{opp.problemItSolves}</p>
                    </div>

                    <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-slate-700">
                      <div><strong>Consulting Value:</strong> {opp.potentialConsultingValue}</div>
                      <div><strong>Intended User:</strong> {opp.intendedUser}</div>
                    </div>

                    <button
                      onClick={() => handleGenerateAssetBrief(opp)}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="h-4 w-4" /> Generate Asset Brief & Proceed to Asset Lab
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ================================================== */}
      {/* ENVIRONMENT 3 — ASSET LAB */}
      {/* ================================================== */}
      {activeEnvironment === 'ASSET' && (
        <div className="space-y-6">
          
          {/* Asset Brief Display if generated */}
          {assetBrief && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Active Asset Brief Specification</h3>
                  <p className="text-xs text-slate-500">
                    Brief controlling formal asset creation in C-Bridge Asset Lab.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div><span className="text-slate-500 block">Asset Name:</span><span className="font-bold text-slate-800">{assetBrief.assetName}</span></div>
                <div><span className="text-slate-500 block">Asset Type:</span><span className="font-bold text-slate-800">{assetBrief.assetType}</span></div>
                <div><span className="text-slate-500 block">Owner / Developer:</span><span className="font-bold text-slate-800">{assetBrief.developmentOwner}</span></div>
                <div><span className="text-slate-500 block">Supervisor:</span><span className="font-bold text-slate-800">{assetBrief.supervisor}</span></div>
              </div>
            </div>
          )}

          {/* Project Assets in Development */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Project Assets in Development</h3>
                  <p className="text-xs text-slate-500">
                    Collaborative asset drafting. Approval promotes project asset to C-Bridge Asset Library.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {projectAssets.map((asset) => (
                <div key={asset.id} className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-md uppercase">
                          {asset.assetType}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500">{asset.version}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{asset.assetName}</h4>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${
                      asset.status === 'SUPERVISOR APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      asset.status === 'READY FOR QA' ? 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse' :
                      'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}>
                      {asset.status}
                    </span>
                  </div>

                  {/* Asset Document Content Preview Box */}
                  <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {asset.content}
                  </div>

                  {/* Governance Approval & Promotion Controls */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      <strong>Author:</strong> {asset.author} | <strong>Supervisor:</strong> Husni Hasan
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Step 1: Submit for QA (for DRAFT / UNDER DEVELOPMENT) */}
                      {(asset.status === 'UNDER DEVELOPMENT' || asset.status === 'DRAFT') && (
                        <button
                          onClick={() => handleSubmitForQa(asset.id)}
                          disabled={isAiLoading}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                        >
                          <Clock className="h-4 w-4" /> Submit for QA Review
                        </button>
                      )}

                      {/* Step 2: READY FOR QA */}
                      {asset.status === 'READY FOR QA' && (
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-500/10 text-amber-800 border border-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-amber-600" /> QA AUTHORIZATION REQUIRED
                          </span>
                          {currentUser === 'HUSNI' && (
                            <button
                              onClick={() => handlePerformQaReview(asset.id, true)}
                              disabled={isAiLoading}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                            >
                              <CheckSquare className="h-4 w-4" /> Pass QA Review
                            </button>
                          )}
                        </div>
                      )}

                      {/* Step 3: QA REVIEWED or PENDING SUPERVISOR APPROVAL -> HUSNI APPROVAL */}
                      {(asset.status === 'QA REVIEWED' || asset.status === 'PENDING SUPERVISOR APPROVAL') && currentUser === 'HUSNI' && (
                        <button
                          onClick={() => handlePromoteToLibrary(asset)}
                          disabled={isAiLoading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                          <ShieldCheck className="h-4 w-4" /> Husni Supervisor Approve & Publish to Asset Library
                        </button>
                      )}

                      {/* Non-Husni viewing QA REVIEWED or PENDING SUPERVISOR APPROVAL */}
                      {(asset.status === 'QA REVIEWED' || asset.status === 'PENDING SUPERVISOR APPROVAL') && currentUser !== 'HUSNI' && (
                        <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1">
                          <Shield className="h-4 w-4 text-indigo-600" /> Pending Husni Supervisor Approval
                        </span>
                      )}

                      {asset.status === 'SUPERVISOR APPROVED' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Promoted to Reusable Asset Library
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Ask Supervisor Modal */}
      <AskSupervisorModal
        isOpen={isAskSupervisorOpen}
        onClose={() => setIsAskSupervisorOpen(false)}
        currentUser={currentUser}
        projectId={currentProject.id}
        projectName={currentProject.name}
        moduleCode={moduleMap.moduleCode}
        onSubmitQuestion={onSubmitSupervisorQuestion}
      />

      {/* Source Library Modal */}
      <ProjectSourceLibraryModal
        isOpen={isSourceLibraryOpen}
        onClose={() => setIsSourceLibraryOpen(false)}
        projectId={currentProject.id}
        projectName={currentProject.name}
        sources={sources}
        currentUser={currentUser}
        onAddSource={onAddSource}
      />

    </div>
  );
};
