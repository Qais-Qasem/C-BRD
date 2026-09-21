import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Bot, 
  Shield, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  Layers, 
  BookOpen, 
  Send, 
  RefreshCw, 
  Briefcase, 
  Lock, 
  ExternalLink,
  ChevronRight,
  Filter,
  PlusCircle,
  FileCheck2,
  FolderLock,
  Paperclip,
  Upload,
  X,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Eye,
  Check,
  Loader2,
  Scale
} from 'lucide-react';
import { SourceTraceViewer } from './SourceTraceViewer';
import { 
  UserRole,
  CaseRoomChannelType,
  CaseParticipantRole,
  CaseRoomParticipant,
  CaseRoomMessage,
  CaseRoomAttachment,
  CaseWorkingTool,
  VirtualClientCompanyProfile,
  SourceProvenanceRecord,
  StructuredRequirementAnalysis,
  RoleSwitchAuditLog,
  ProjectAsset
} from '../types';
import { getFirebaseAuth } from '../lib/firebase';

interface ConsultingCaseRoomProps {
  currentUser: UserRole;
  currentProjectId: string;
  currentModuleId: string;
  selectedTopic?: any;
  onNavigateToAssetLab?: (opportunityData?: any) => void;
  onNavigateToWorkspace?: () => void;
}

export const ConsultingCaseRoom: React.FC<ConsultingCaseRoomProps> = ({
  currentUser,
  currentProjectId = 'PRJ-324',
  currentModuleId = 'MA-324-01',
  selectedTopic,
  onNavigateToAssetLab,
  onNavigateToWorkspace
}) => {
  // Available Consulting Practice Topics
  const practiceTopics = [
    {
      id: 'TOPIC-01',
      title: 'Statutory FSVP Importer Determination for Multi-Tier Specialty Importers',
      citation: '21 CFR 1.500',
      dilemma: 'Customs Broker vs Consignee vs Importer of Record financial ownership at port of entry.',
      category: 'STATUTORY_LIABILITY'
    },
    {
      id: 'TOPIC-02',
      title: 'SAHC Hazard Categorization for Imported Dairy & Acidified Foods',
      citation: '21 CFR 1.504 & 1.506',
      dilemma: 'Biological hazard verification for raw milk pecorino and thermal processing for acidified canned artichokes.',
      category: 'HAZARD_ANALYSIS'
    },
    {
      id: 'TOPIC-03',
      title: 'Foreign Supplier Verification & FDA Port of Ingress Hold Mitigation',
      citation: '21 CFR 1.506(d)(1)',
      dilemma: 'Overcoming reliance on unverified GFSI certificates during active FDA Port of Newark hold.',
      category: 'SUPPLIER_VERIFICATION'
    }
  ];

  const [activeTopic, setActiveTopic] = useState<any>(selectedTopic || practiceTopics[0]);

  // Navigation & View Sub-states
  const [activeChannel, setActiveChannel] = useState<CaseRoomChannelType>('CLIENT_ENGAGEMENT');
  const [activeConversationalRole, setActiveConversationalRole] = useState<CaseParticipantRole>(
    currentUser === 'HUSNI' ? 'HUSNI_SUPERVISOR' : 'SAMAR_CONSULTANT'
  );
  
  // In-app Notification Toast State (replaces all window.alert calls)
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Modals / Drawers
  const [isProvenanceDrawerOpen, setIsProvenanceDrawerOpen] = useState(false);
  const [isRequirementDrawerOpen, setIsRequirementDrawerOpen] = useState(false);
  const [isNewWorkingToolModalOpen, setIsNewWorkingToolModalOpen] = useState(false);
  const [isAssetOpportunityModalOpen, setIsAssetOpportunityModalOpen] = useState(false);
  const [customToolTitle, setCustomToolTitle] = useState('');
  const [selectedToolForViewing, setSelectedToolForViewing] = useState<CaseWorkingTool | null>(null);

  // Asset Opportunity Form State
  const [opportunityObservedNeed, setOpportunityObservedNeed] = useState('');
  const [opportunityProposedAsset, setOpportunityProposedAsset] = useState('');
  const [opportunityProblemSolved, setOpportunityProblemSolved] = useState('');
  const [opportunityIntendedUser, setOpportunityIntendedUser] = useState('C-Bridge Regulatory Consultants');
  const [opportunitySupportingEvidence, setOpportunitySupportingEvidence] = useState('');

  // Core Data States
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isStartNewSessionModalOpen, setIsStartNewSessionModalOpen] = useState(false);
  const [isRestartingSession, setIsRestartingSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState<'SCOPE' | 'HAZARD_ANALYSIS' | 'SUPPLIER_VERIFICATION' | 'STATUTORY_LIABILITY'>('SCOPE');

  // Attachment States
  interface PendingAttachmentItem {
    id: string;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    formattedSize: string;
    base64Data: string;
    progress: number;
    status: 'QUEUED' | 'UPLOADING' | 'READY' | 'ERROR';
    errorMessage?: string;
    uploadedRecord?: CaseRoomAttachment;
  }

  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachmentItem[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedAttachmentForPreview, setSelectedAttachmentForPreview] = useState<CaseRoomAttachment | null>(null);
  const [caseAttachmentsList, setCaseAttachmentsList] = useState<CaseRoomAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loaded Entities
  const [clientProfile, setClientProfile] = useState<VirtualClientCompanyProfile | null>(null);
  const [provenanceSources, setProvenanceSources] = useState<SourceProvenanceRecord[]>([]);
  const [requirements, setRequirements] = useState<StructuredRequirementAnalysis | null>(null);
  const [messages, setMessages] = useState<CaseRoomMessage[]>([]);
  const [isAiPending, setIsAiPending] = useState(false);
  const latestHydrationRef = useRef<number>(0);
  const [workingTools, setWorkingTools] = useState<CaseWorkingTool[]>([]);
  const [auditLogs, setAuditLogs] = useState<RoleSwitchAuditLog[]>([]);

  // Participants definitions
  const participants: CaseRoomParticipant[] = [
    {
      id: 'SAMAR-MBR-001',
      name: 'Samar Baydoun',
      role: 'SAMAR_CONSULTANT',
      team: 'CBRIDGE_TEAM',
      title: 'Capability Developer / Lead Associate',
      isHuman: true,
      avatarBg: 'bg-emerald-600',
      allowedChannels: ['CLIENT_ENGAGEMENT', 'INTERNAL_CBRIDGE']
    },
    {
      id: 'HUSNI-SUP-001',
      name: 'Husni Hasan',
      role: 'HUSNI_SUPERVISOR',
      team: 'CBRIDGE_TEAM',
      title: 'Owner & Supervisor (CB-9110)',
      isHuman: true,
      avatarBg: 'bg-indigo-600',
      allowedChannels: ['CLIENT_ENGAGEMENT', 'INTERNAL_CBRIDGE']
    },
    {
      id: 'CLI-ROLEPLAY',
      name: 'Role-Play Participant',
      role: 'CLIENT_ROLEPLAY_PARTICIPANT',
      team: 'CLIENT_TEAM',
      title: 'Client Counterpart (Role-Play)',
      isHuman: true,
      avatarBg: 'bg-amber-700',
      allowedChannels: ['CLIENT_ENGAGEMENT']
    },
    {
      id: 'OBSERVER-001',
      name: 'Silent Observer',
      role: 'OBSERVER',
      team: 'CBRIDGE_TEAM',
      title: 'Auditing / Observer',
      isHuman: true,
      avatarBg: 'bg-slate-600',
      allowedChannels: ['CLIENT_ENGAGEMENT', 'INTERNAL_CBRIDGE']
    },
    {
      id: 'AI-COACH',
      name: 'C-Bridge AI Coach',
      role: 'AI_COACH',
      team: 'CBRIDGE_TEAM',
      title: 'Regulatory & Socratic Mentor',
      isHuman: false,
      avatarBg: 'bg-teal-600',
      allowedChannels: ['INTERNAL_CBRIDGE'] // Strictly prohibited from Client Engagement
    },
    ...(clientProfile?.contacts && clientProfile.contacts.length > 0
      ? clientProfile.contacts.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role as CaseParticipantRole,
          team: 'CLIENT_TEAM' as const,
          title: c.title,
          isHuman: false,
          avatarBg: c.avatarBg || 'bg-amber-600',
          allowedChannels: ['CLIENT_ENGAGEMENT' as CaseRoomChannelType]
        }))
      : [
          {
            id: 'PER-01',
            name: 'Elena Rostova',
            role: 'CLIENT_EXEC' as CaseParticipantRole,
            team: 'CLIENT_TEAM' as const,
            title: 'Chief Executive Officer & Founder',
            isHuman: false,
            avatarBg: 'bg-amber-600',
            allowedChannels: ['CLIENT_ENGAGEMENT' as CaseRoomChannelType]
          },
          {
            id: 'PER-02',
            name: 'Marco Bellini',
            role: 'CLIENT_QA' as CaseParticipantRole,
            team: 'CLIENT_TEAM' as const,
            title: 'Quality & Technical Operations Director',
            isHuman: false,
            avatarBg: 'bg-emerald-600',
            allowedChannels: ['CLIENT_ENGAGEMENT' as CaseRoomChannelType]
          }
        ])
  ];

  // Helper for auth headers
  const getAuthHeaders = async () => {
    try {
      const auth = getFirebaseAuth();
      if (auth && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        return { 
          Authorization: `Bearer ${token}`,
          'x-acting-role': activeConversationalRole
        };
      }
    } catch (e) {
      console.warn('Could not retrieve Firebase token:', e);
    }
    return { 'x-acting-role': activeConversationalRole };
  };

  // Helper: Format file size
  const formatAttachmentSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper: Return corresponding icon based on file category/mime
  const getFileCategoryIcon = (category?: string, name?: string, size = 'h-4 w-4') => {
    const lowerName = (name || '').toLowerCase();
    if (category === 'SPREADSHEET' || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
      return <FileSpreadsheet className={`${size} text-emerald-500`} />;
    }
    if (category === 'IMAGE' || lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp')) {
      return <FileImage className={`${size} text-purple-400`} />;
    }
    if (category === 'DOCUMENT' || lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      return <FileText className={`${size} text-blue-400`} />;
    }
    return <File className={`${size} text-slate-400`} />;
  };

  // Disallowed extensions list for client-side instant check
  const DISALLOWED_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.sh', '.bash', '.js', '.ts', '.html', '.htm', '.php', '.py',
    '.vbs', '.dll', '.bin', '.jar', '.apk', '.msi', '.scr', '.ps1', '.vbe', '.wsf', '.cpl'
  ];

  // Helper: Process and Upload Files
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    if (activeConversationalRole === 'OBSERVER') {
      showNotification('Observer role is in read-only mode and cannot attach files.', 'error');
      return;
    }

    const files = Array.from(fileList);
    if (files.length === 0) return;

    const newPendingItems: PendingAttachmentItem[] = [];
    const validFilesToUpload: { item: PendingAttachmentItem; file: File }[] = [];

    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      const extMatch = lowerName.match(/\.[0-9a-z]+$/i);
      const ext = extMatch ? extMatch[0] : '';

      const tempId = `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const item: PendingAttachmentItem = {
        id: tempId,
        originalFileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        formattedSize: formatAttachmentSize(file.size),
        base64Data: '',
        progress: 0,
        status: 'QUEUED'
      };

      if (DISALLOWED_EXTENSIONS.includes(ext)) {
        item.status = 'ERROR';
        item.errorMessage = `Executable/script file types (${ext}) are prohibited.`;
        showNotification(`File rejected: "${file.name}" has an unsafe extension.`, 'error');
        newPendingItems.push(item);
        continue;
      }

      if (file.size > 25 * 1024 * 1024) {
        item.status = 'ERROR';
        item.errorMessage = 'Exceeds 25MB maximum limit.';
        showNotification(`File rejected: "${file.name}" exceeds 25 MB.`, 'error');
        newPendingItems.push(item);
        continue;
      }

      item.status = 'UPLOADING';
      newPendingItems.push(item);
      validFilesToUpload.push({ item, file });
    }

    setPendingAttachments(prev => [...prev, ...newPendingItems]);

    if (validFilesToUpload.length === 0) return;

    setIsUploadingAttachments(true);

    try {
      // Convert valid files to base64
      const uploadPayload = await Promise.all(
        validFilesToUpload.map(async ({ item, file }) => {
          return new Promise<{ item: PendingAttachmentItem; originalFileName: string; mimeType: string; base64Data: string }>(
            (resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64 = e.target?.result as string;
                resolve({
                  item,
                  originalFileName: file.name,
                  mimeType: file.type || 'application/octet-stream',
                  base64Data: base64
                });
              };
              reader.onerror = () => {
                resolve({
                  item,
                  originalFileName: file.name,
                  mimeType: file.type || 'application/octet-stream',
                  base64Data: ''
                });
              };
              reader.readAsDataURL(file);
            }
          );
        })
      );

      const headers = await getAuthHeaders();
      const res = await fetch('/api/case-room/attachments/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          files: uploadPayload.map(p => ({
            originalFileName: p.originalFileName,
            mimeType: p.mimeType,
            base64Data: p.base64Data
          })),
          projectId: currentProjectId,
          moduleId: currentModuleId,
          channel: activeChannel,
          actingRole: activeConversationalRole
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();

      if (data.success && data.attachments) {
        setPendingAttachments(prev =>
          prev.map(pItem => {
            const matchIndex = uploadPayload.findIndex(u => u.item.id === pItem.id);
            if (matchIndex !== -1 && data.attachments[matchIndex]) {
              return {
                ...pItem,
                status: 'READY',
                progress: 100,
                uploadedRecord: data.attachments[matchIndex]
              };
            }
            return pItem;
          })
        );
        showNotification(`Uploaded ${data.attachments.length} attachment(s) securely.`, 'success');
      } else {
        const errorMsg = data.error || 'Upload failed';
        setPendingAttachments(prev =>
          prev.map(pItem => {
            if (uploadPayload.some(u => u.item.id === pItem.id)) {
              return { ...pItem, status: 'ERROR', errorMessage: errorMsg };
            }
            return pItem;
          })
        );
        showNotification(`Attachment upload failed: ${errorMsg}`, 'error');
      }
    } catch (uploadErr: any) {
      console.error('Attachment upload network error:', uploadErr);
      setPendingAttachments(prev =>
        prev.map(pItem => (pItem.status === 'UPLOADING' ? { ...pItem, status: 'ERROR', errorMessage: 'Network error' } : pItem))
      );
      showNotification('Attachment upload failed due to network error.', 'error');
    } finally {
      setIsUploadingAttachments(false);
    }
  };

  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Helper: Download attachment securely
  const handleDownloadAttachment = async (attachment: CaseRoomAttachment) => {
    try {
      const url = `/api/case-room/attachments/${attachment.id}/download?actingRole=${activeConversationalRole}`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.originalFileName || 'case-attachment');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification(`Downloading "${attachment.originalFileName}"...`, 'info');
    } catch (e) {
      console.error('Download failed:', e);
      showNotification('Failed to download attachment.', 'error');
    }
  };

  // Preview Attachment with Evidence Review Trace Logging
  const handlePreviewAttachment = async (attachment: CaseRoomAttachment) => {
    setSelectedAttachmentForPreview(attachment);
    try {
      const headers = await getAuthHeaders();
      fetch('/api/case-room/evidence-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          attachmentId: attachment.id,
          documentId: attachment.documentId || 'DOC-SYNTH',
          caseId: attachment.caseId || 'CASE-LEVANT-01',
          sessionId: attachment.sessionId || 'SESS-MA324-01',
          projectId: currentProjectId,
          moduleId: currentModuleId,
          actingRole: activeConversationalRole,
          action: 'EVIDENCE_INSPECTION_OPENED'
        })
      }).catch(err => console.warn('Evidence trace warning:', err));
    } catch (e) {
      console.warn('Evidence trace error:', e);
    }
  };

  // Fetch initial case room data
  const loadCaseRoomData = async (targetSessionId?: string) => {
    const hydrationId = Date.now();
    latestHydrationRef.current = hydrationId;
    setIsLoading(true);
    setLoadError(null);
    try {
      const headers = await getAuthHeaders();
      const sessParam = targetSessionId || activeSessionId;
      
      const url = `/api/case-room/data/${currentProjectId}/${currentModuleId}?actingRole=${activeConversationalRole}&channel=${activeChannel}${sessParam ? `&sessionId=${encodeURIComponent(sessParam)}` : ''}`;
      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      
      if (latestHydrationRef.current !== hydrationId) {
        return;
      }

      if (data.success) {
        // If the server explicitly rejected active session resolution
        if (sessParam && data.activeSessionId && data.activeSessionId !== sessParam) {
           setLoadError('ACTIVE_SESSION_POINTER_MISMATCH');
           return;
        }

        setActiveSessionId(data.activeSessionId || data.session?.id || '');
        setClientProfile(data.clientProfile);
        setProvenanceSources(data.provenanceSources || []);
        setRequirements(data.requirements || null);
        
        setMessages(prev => {
          const map = new Map();
          prev.forEach(m => map.set(m.id, m));
          (data.messages || []).forEach((m: any) => map.set(m.id, m));
          return Array.from(map.values()).sort((a: any, b: any) => new Date(a.isoTimestamp || 0).getTime() - new Date(b.isoTimestamp || 0).getTime());
        });
        
        setWorkingTools(data.workingTools || []);
        setAuditLogs(data.auditLogs || []);
        setCaseAttachmentsList(data.attachments || []);
      } else {
        setLoadError(data.error || 'Failed to load conversation state');
      }
    } catch (err: any) {
      console.error('Failed to load Case Room data:', err);
      if (latestHydrationRef.current === hydrationId) {
        setLoadError('PERSISTENCE_UNAVAILABLE - ' + err.message);
      }
    } finally {
      if (latestHydrationRef.current === hydrationId) {
        setIsLoading(false);
      }
    }
  };

  // Controlled Start New Session (Supervisor / Owner Action)
  const handleStartNewSession = async () => {
    if (isRestartingSession) return;
    setIsRestartingSession(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/case-room/sessions/start-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          projectId: currentProjectId,
          moduleId: currentModuleId,
          caseId: clientProfile?.caseId || 'CASE-LEVANT-01',
          purpose: 'PILOT_V1',
          actingRole: activeConversationalRole
        })
      });
      const result = await res.json();
      if (result.success) {
        showNotification('New PILOT V1 conversation session activated. Previous session archived.', 'success');
        setIsStartNewSessionModalOpen(false);
        await loadCaseRoomData();
      } else {
        showNotification(result.error || 'Failed to start new session', 'error');
      }
    } catch (err: any) {
      console.error('Error starting new session:', err);
      showNotification('Network error while starting new session: ' + err.message, 'error');
    } finally {
      setIsRestartingSession(false);
    }
  };

  useEffect(() => {
    loadCaseRoomData();
  }, [currentProjectId, currentModuleId, activeConversationalRole, activeChannel]);

  // Handle active role switch with audit logging
  const handleSwitchRole = async (newRole: CaseParticipantRole) => {
    if (newRole === activeConversationalRole) return;
    const prev = activeConversationalRole;
    setActiveConversationalRole(newRole);

    // If switched to client role, force channel to CLIENT_ENGAGEMENT
    const isClient = 
      newRole === 'CLIENT_EXEC' || 
      newRole === 'CLIENT_QA' || 
      newRole === 'CLIENT_COMPLIANCE' || 
      newRole === 'CLIENT_ROLEPLAY_PARTICIPANT';

    if (isClient && activeChannel === 'INTERNAL_CBRIDGE') {
      setActiveChannel('CLIENT_ENGAGEMENT');
      showNotification('Switched to Client Perspective. Internal Backstage is strictly restricted to C-Bridge team.', 'info');
    } else {
      showNotification(`Switched active perspective to ${newRole?.replace(/_/g, ' ')}.`, 'success');
    }

    try {
      const headers = await getAuthHeaders();
      await fetch('/api/case-room/role-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          previousRole: prev,
          newRole,
          reason: `Role switched to ${newRole} in Consulting Case Room.`,
          roomId: `ROOM-${currentProjectId}-${currentModuleId}`,
          projectId: currentProjectId
        })
      });
    } catch (e) {
      console.error('Role switch audit failed:', e);
    }
  };

  // Handle sending a message with attachments
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isUploadingAttachments) {
      showNotification('Please wait for file attachments to finish uploading before sending.', 'info');
      return;
    }

    const readyAttachments = pendingAttachments
      .filter(a => a.status === 'READY' && a.uploadedRecord)
      .map(a => a.uploadedRecord!);

    const hasText = inputMessage.trim().length > 0;
    const hasReadyAttachments = readyAttachments.length > 0;

    if (!hasText && !hasReadyAttachments) return;
    if (isSending) return;

    if (activeConversationalRole === 'OBSERVER') {
      showNotification('Observer role is in read-only mode and cannot post messages.', 'error');
      return;
    }

    const userText = inputMessage.trim();
    setInputMessage('');
    setPendingAttachments([]);
    setIsSending(true);

    const activeParticipant = participants.find(p => p.role === activeConversationalRole);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/case-room/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          roomId: `ROOM-${currentProjectId}-${currentModuleId}`,
          sessionId: activeSessionId,
          channel: activeChannel,
          text: userText,
          actingRole: activeConversationalRole,
          senderName: activeParticipant?.name || 'Samar Baydoun',
          senderTeam: activeParticipant?.team || 'CBRIDGE_TEAM',
          consultingCategory: selectedQuestionCategory,
          projectId: currentProjectId,
          moduleId: currentModuleId,
          attachments: readyAttachments
        })
      });

      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success) {
        if (data.message) {
          // CANONICAL MESSAGE ID RECONCILIATION
          setMessages(prev => {
            const map = new Map();
            prev.forEach(m => map.set(m.id, m));
            map.set(data.message.id, data.message);
            return Array.from(map.values()).sort((a: any, b: any) => new Date(a.isoTimestamp || 0).getTime() - new Date(b.isoTimestamp || 0).getTime());
          });
        }
        
        // Immediately unlock the input to maintain optimistic UI state
        setIsSending(false);
        
        if (data.requiresAiResponse) {
          setIsAiPending(true);
          try {
            // We use a separate request to fetch the AI response to not block the message persistence
            const aiRes = await fetch('/api/case-room/messages/generate-reply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...headers },
              body: JSON.stringify({
                messageBodyText: userText,
                sanitizedAttachments: readyAttachments,
                roomId: `ROOM-${currentProjectId}-${currentModuleId}`,
                sessionId: activeSessionId,
                channel: activeChannel,
                actingRole: activeConversationalRole,
                senderName: activeParticipant?.name || 'Unknown',
                projectId: currentProjectId,
                moduleId: currentModuleId,
                caseId: clientProfile?.caseId || 'CASE-LEVANT-01'
              })
            });
            const aiData = await aiRes.json();
            
            if (!aiRes.ok || aiData.error) {
               console.error("AI Generation Failed:", aiData.error || aiData.details);
               setMessages(prev => {
                  const map = new Map();
                  prev.forEach(m => map.set(m.id, m));
                  
                  const errorMsg = {
                    id: "ERR-" + Date.now().toString(),
                    roomId: `ROOM-${currentProjectId}-${currentModuleId}`,
                    sessionId: activeSessionId,
                    channel: activeChannel,
                    senderName: "System Controller",
                    senderRole: "SYSTEM",
                    bodyText: `Client response unavailable (Code: ${aiData.error || 'SERVER_ERROR'}). ${aiData.details || ''}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isoTimestamp: new Date().toISOString(),
                    attachments: [],
                    isSystemMessage: true,
                    isControlledError: true
                  };
                  
                  map.set(errorMsg.id, errorMsg);
                  return Array.from(map.values()).sort((a: any, b: any) => new Date(a.isoTimestamp || 0).getTime() - new Date(b.isoTimestamp || 0).getTime());
               });
            } else if (aiData.success && aiData.autoResponses && aiData.autoResponses.length > 0) {
              setMessages(prev => {
                const map = new Map();
                prev.forEach(m => map.set(m.id, m));
                aiData.autoResponses.forEach((m: any) => map.set(m.id, m));
                return Array.from(map.values()).sort((a: any, b: any) => new Date(a.isoTimestamp || 0).getTime() - new Date(b.isoTimestamp || 0).getTime());
              });
            }
          } catch (aiErr) {
            console.error('Failed to generate AI reply:', aiErr);
          } finally {
            setIsAiPending(false);
          }
        }
      } else if (data.error) {
        showNotification(`Message rejected: ${data.error}`, 'error');
        setIsSending(false);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      showNotification('Network issue sending message. Please try again.', 'error');
      setIsSending(false);
    }
  };

  // Create or regenerate a Case Working Tool
  const handleGenerateWorkingTool = async (toolType: string, customName?: string) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/case-room/generate-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          toolType,
          customName,
          clientData: clientProfile,
          moduleContext: { moduleId: currentModuleId, projectId: currentProjectId, activeTopic },
          projectId: currentProjectId,
          moduleId: currentModuleId
        })
      });
      const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
      if (data.success && data.tool) {
        setWorkingTools(prev => [data.tool, ...prev]);
        setSelectedToolForViewing(data.tool);
        setIsNewWorkingToolModalOpen(false);
        showNotification(`Generated new diagnostic tool: ${data.tool.title}`, 'success');
      }
    } catch (err) {
      console.error('Failed to generate tool:', err);
      showNotification('Failed to generate tool. Please try again.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Check if current acting role is Client
  const isActingAsClient = 
    activeConversationalRole === 'CLIENT_EXEC' || 
    activeConversationalRole === 'CLIENT_QA' || 
    activeConversationalRole === 'CLIENT_COMPLIANCE' ||
    activeConversationalRole === 'CLIENT_ROLEPLAY_PARTICIPANT';

  // Filter messages for current channel and active session
  const filteredMessages = messages.filter(m => 
    m.channel === activeChannel && 
    (!activeSessionId || !m.sessionId || m.sessionId === activeSessionId)
  );

  return (
    <div id="cbridge-consulting-case-room" className="max-w-7xl mx-auto space-y-6 pb-16 font-sans relative">
      
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

      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-400">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md">
                PILOT V1: CLIENT-DRIVEN CONSULTING CASE ROOM
              </span>
              <span className="text-xs font-mono text-slate-300">
                {currentProjectId} • {currentModuleId}
              </span>
            </div>
            <h1 className="text-xl font-black mt-1 text-slate-100">
              MSU Module 1 — Foundational FSVP Framework & Statutory Authority
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Simulated commercial engagement with <strong>{clientProfile?.companyName || 'Levant Culinary Traditions Corp'}</strong>. Grounded in Module 1 sources and 21 CFR 1.500 statutory criteria.
            </p>
          </div>
        </div>

        {/* Top Control Drawer Links */}
        <div className="flex items-center gap-2 shrink-0">
          {(currentUser === 'HUSNI' || activeConversationalRole === 'HUSNI_SUPERVISOR') && (
            <button
              onClick={() => setIsStartNewSessionModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-700/90 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl border border-emerald-500/50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Supervisor / Owner: Archive current session into history and start a clean Pilot session"
            >
              <RefreshCw className="h-4 w-4 text-emerald-200" /> Start New Session
            </button>
          )}

          <button
            onClick={() => setIsProvenanceDrawerOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-emerald-400" /> Source Library ({provenanceSources.length})
          </button>
          
          <button
            onClick={() => setIsRequirementDrawerOpen(true)}
            className="px-3.5 py-2 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-bold text-xs rounded-xl border border-indigo-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCheck2 className="h-4 w-4 text-indigo-300" /> Requirements Map
          </button>
        </div>
      </div>

      {/* 1.5 Consulting Practice Topic Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Selected Consulting Practice Topic (Derived from Module Requirements)
          </span>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            Grounding Citation: {activeTopic?.citation || '21 CFR 1.500'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {practiceTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                setActiveTopic(topic);
                showNotification(`Case Room focused on: ${topic.title}`, 'info');
              }}
              className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer space-y-1 ${
                activeTopic?.id === topic.id
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-900 line-clamp-1">{topic.title}</div>
              <div className="text-[10px] text-slate-500 line-clamp-2">{topic.dilemma}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Role Switcher & Strict One-Active-Role Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Active Conversational Perspective (Audited)
            </div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Current Role:</span>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-300">
                {participants.find(p => p.role === activeConversationalRole)?.name} ({activeConversationalRole})
              </span>
            </div>
          </div>
        </div>

        {/* Role Selector Chips */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Switch Perspective:</span>
          {participants.filter(p => p.role !== 'AI_COACH').map(p => (
            <button
              key={p.id}
              onClick={() => handleSwitchRole(p.role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeConversationalRole === p.role
                  ? `${p.avatarBg} text-white shadow-xs scale-102`
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${p.avatarBg}`} />
              {p.name.split(' ')[0]} ({p.team === 'CLIENT_TEAM' ? 'Client' : 'C-Bridge'})
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (4 cols): Virtual Client Profile & Case Working Tools */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Virtual Client Card */}
          {clientProfile && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{clientProfile.companyName}</h3>
                    <div className="text-[11px] text-slate-500 font-medium">{clientProfile.industryCategory}</div>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200">
                  ACTIVE CASE
                </span>
              </div>

              {/* Company Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Import Volume</div>
                  <div className="font-bold text-slate-800 mt-0.5">{clientProfile.annualImportVolume || 'TO BE DISCOVERED'}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Primary Ingress</div>
                  <div className="font-bold text-slate-800 mt-0.5">{clientProfile.headquarters || 'Port of Chicago'}</div>
                </div>
              </div>

              {/* Product Lines & Supplier Risk Exposure */}
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Imported Commodities & Risk Classification
                </div>
                <div className="space-y-1.5 text-xs">
                  {clientProfile.productLines.map((prod, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{prod.name}</div>
                        <div className="text-[10px] text-slate-500">Origin: {prod.originCountry}</div>
                      </div>
                      {prod.sahcPotential ? (
                        <span className="shrink-0 bg-rose-100 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded border border-rose-200" title="Serious Adverse Health Consequences">
                          SAHC Hazard
                        </span>
                      ) : (
                        <span className="shrink-0 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                          Standard Risk
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Situation Callout */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  Primary Compliance Challenge:
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  {clientProfile.primaryComplianceRisk}
                </p>
              </div>

              {/* Client Key Contacts */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Client Interlocutors
                </div>
                <div className="space-y-1">
                  {clientProfile.contacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full ${c.avatarBg} text-white flex items-center justify-center text-[10px] font-bold`}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{c.name}</div>
                          <div className="text-[10px] text-slate-500">{c.title}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Case Working Tools Section (Strictly distinguished from C-Bridge Official Asset) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Case Working Tools</h3>
                  <div className="text-[10px] text-slate-500">Engagement-Specific Artifacts</div>
                </div>
              </div>

              <button
                onClick={() => setIsNewWorkingToolModalOpen(true)}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <PlusCircle className="h-3 w-3" /> New Tool
              </button>
            </div>

            {/* Tooling Hierarchy Banner */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                Hierarchy Distinction Rule:
              </div>
              <p className="text-[10px]">
                <strong>Case Working Tools</strong> are temporary diagnostic worksheets for this case. Approved IP becomes a <strong>C-Bridge Asset</strong> only through QA & Supervisor signoff.
              </p>
            </div>

            {/* List of Working Tools */}
            <div className="space-y-2">
              {workingTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => setSelectedToolForViewing(tool)}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-xl text-xs space-y-1.5 cursor-pointer transition-all hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{tool.title}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {tool.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {tool.summary}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>By: {tool.createdBy}</span>
                    {tool.hasAssetPotential && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-emerald-600" /> Asset Potential
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Governed Save as Asset Opportunity Button */}
            <button
              onClick={() => {
                setOpportunityObservedNeed('Need for standardized diagnostic tools identified during live consulting engagement.');
                setOpportunityProposedAsset('FSVP Importer & Supplier Verification Diagnostic Matrix');
                setOpportunityProblemSolved('Streamlines 21 CFR 1.500 statutory determination for multi-tier food importers.');
                setOpportunitySupportingEvidence(`Observed in case with ${clientProfile?.companyName || 'Levant Culinary Traditions Corp'}`);
                setIsAssetOpportunityModalOpen(true);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="h-4 w-4" /> SAVE AS ASSET OPPORTUNITY
            </button>
          </div>

        </div>

        {/* Center Column (5 cols): Dual Communication Channels */}
        <div className="lg:col-span-5 space-y-4 flex flex-col h-[750px]">
          
          {/* Dual Channel Switcher Tabs */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveChannel('CLIENT_ENGAGEMENT')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeChannel === 'CLIENT_ENGAGEMENT'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-amber-600" />
              1. Client Engagement Room
            </button>

            <button
              onClick={() => {
                if (isActingAsClient) {
                  showNotification('SECURITY RESTRICTION: Client roles are barred from accessing the Internal C-Bridge Backstage Room.', 'error');
                  return;
                }
                setActiveChannel('INTERNAL_CBRIDGE');
              }}
              disabled={isActingAsClient}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeChannel === 'INTERNAL_CBRIDGE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : isActingAsClient
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isActingAsClient ? <Lock className="h-3.5 w-3.5 text-rose-500" /> : <Bot className="h-4 w-4 text-emerald-400" />}
              2. Internal C-Bridge Room (Backstage)
            </button>
          </div>

          {/* Channel Description Banner */}
          {activeChannel === 'CLIENT_ENGAGEMENT' ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-amber-600" />
                <span className="font-bold text-[11px]">Visible to: Client Team ({clientProfile?.companyName || 'Levant Culinary Traditions Corp'}) + C-Bridge Team</span>
              </div>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                AI COACH ABSENT
              </span>
            </div>
          ) : (
            <div className="p-3 bg-indigo-950 border border-indigo-800 rounded-xl text-xs flex items-center justify-between text-indigo-200 shadow-xs">
              <div className="flex items-center space-x-2">
                <FolderLock className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-[11px]">Strictly Internal: Samar + Husni + C-Bridge AI Coach</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-black bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                BACKSTAGE ONLY
              </span>
            </div>
          )}

          {/* Messages Scroll Feed with Drag and Drop Support */}
          <div 
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFilesSelected(e.dataTransfer.files);
              }
            }}
            className={`flex-1 overflow-y-auto p-4 rounded-2xl border space-y-3 font-sans text-xs transition-all relative ${
              isDragOver ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20' :
              activeChannel === 'CLIENT_ENGAGEMENT'
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            {isDragOver && (
              <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-300 font-bold z-20 pointer-events-none rounded-2xl">
                <Upload className="h-10 w-10 mb-2 animate-bounce text-emerald-400" />
                <span className="text-sm">Drop consulting files here to attach securely</span>
                <span className="text-[10px] text-emerald-200/70 mt-1">PDF, DOCX, XLSX, CSV, TXT, PNG, JPG (Max 25MB)</span>
              </div>
            )}

            {loadError ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-rose-500">
                <AlertTriangle className="h-8 w-8 mb-2 opacity-60" />
                <p className="font-bold">CONVERSATION LOAD FAILED — RETRY</p>
                <p className="text-xs mt-1">{loadError}</p>
                <button onClick={() => loadCaseRoomData()} className="mt-4 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">Retry Connection</button>
              </div>
            ) : isLoading && filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-indigo-400">
                <RefreshCw className="h-8 w-8 mb-2 opacity-40 animate-spin" />
                <p className="font-bold">LOADING CONVERSATION...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                <p className="font-bold">No messages in this channel yet.</p>
                <p className="text-xs mt-1">Start by asking a diagnostic question or attaching case documents below.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSamar = msg.senderRole === 'SAMAR_CONSULTANT';
                const isCoach = msg.senderRole === 'AI_COACH';
                const isSupervisor = msg.senderRole === 'HUSNI_SUPERVISOR';
                const isClient = msg.senderTeam === 'CLIENT_TEAM';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-xl p-3.5 rounded-2xl space-y-2 shadow-2xs ${
                      isSamar
                        ? 'ml-auto bg-indigo-600 text-white rounded-br-none'
                        : isCoach
                        ? 'mr-auto bg-slate-800 border border-emerald-500/50 text-emerald-100 rounded-bl-none'
                        : isSupervisor
                        ? 'mr-auto bg-indigo-900/80 border border-indigo-700 text-white rounded-bl-none'
                        : 'mr-auto bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between text-[10px] opacity-85 font-mono">
                      <span className="font-bold uppercase tracking-wider">
                        {msg.senderName} ({msg.senderRole})
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Content */}
                    {msg.text && (
                      <p className="leading-relaxed text-xs whitespace-pre-wrap font-sans">
                        {msg.text}
                      </p>
                    )}

                    {/* Render Message File Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (() => {
                      const uniqueAttsMap = new Map<string, CaseRoomAttachment>();
                      msg.attachments.forEach((att: CaseRoomAttachment) => {
                        if (att.auditStatus === 'SUPERSEDED') return;
                        const key = att.documentType ? `TYPE-${att.documentType}` : (att.documentId || att.id);
                        if (!uniqueAttsMap.has(key)) {
                          uniqueAttsMap.set(key, att);
                        }
                      });
                      const uniqueAtts = Array.from(uniqueAttsMap.values());
                      if (uniqueAtts.length === 0) return null;

                      return (
                        <div className="space-y-1.5 pt-1">
                          {uniqueAtts.map((att: CaseRoomAttachment) => {
                            const isImg = att.fileCategory === 'IMAGE' || (att.mimeType && att.mimeType.startsWith('image/'));
                            return (
                              <div
                                key={att.id}
                                className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                                  isSamar
                                    ? 'bg-indigo-700/70 border-indigo-500/60 text-white'
                                    : isCoach
                                    ? 'bg-slate-900/80 border-emerald-500/40 text-slate-200'
                                    : isSupervisor
                                    ? 'bg-indigo-950/70 border-indigo-700/60 text-indigo-100'
                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <div className="shrink-0 p-1.5 rounded-lg bg-black/10">
                                      {getFileCategoryIcon(att.fileCategory, att.originalFileName, 'h-4 w-4')}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-[11px] truncate max-w-[200px]" title={att.originalFileName}>
                                        {att.originalFileName}
                                      </div>
                                      <div className="text-[9px] opacity-75 flex items-center gap-1.5 flex-wrap">
                                        <span>{att.formattedSize || formatAttachmentSize(att.fileSize)}</span>
                                        <span>•</span>
                                        <span className="uppercase font-semibold">{att.fileCategory || 'DOCUMENT'}</span>
                                        {att.synthetic && (
                                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[8px] font-bold tracking-tight">
                                            SYNTHETIC EVIDENCE
                                          </span>
                                        )}
                                        {att.visibilityScope === 'INTERNAL_CBRIDGE' && (
                                          <span className="px-1 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[8px] font-bold">
                                            BACKSTAGE
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handlePreviewAttachment(att)}
                                      className={`p-1.5 rounded-lg transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1 ${
                                        isSamar
                                          ? 'bg-indigo-500/80 hover:bg-indigo-400 text-white'
                                          : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                                      }`}
                                      title="Preview Document Details & Content"
                                    >
                                      <Eye className="h-3 w-3" />
                                      <span>Preview</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDownloadAttachment(att)}
                                      className={`p-1.5 rounded-lg transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1 ${
                                        isSamar
                                          ? 'bg-indigo-500/80 hover:bg-indigo-400 text-white'
                                          : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                                      }`}
                                      title="Download File"
                                    >
                                      <Download className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Image Thumbnail Quick Preview */}
                                {isImg && (
                                  <div 
                                    onClick={() => setSelectedAttachmentForPreview(att)}
                                    className="mt-1 rounded-lg overflow-hidden border border-white/20 max-h-36 bg-black/20 flex items-center justify-center cursor-pointer group relative"
                                  >
                                    <img 
                                      src={`/api/case-room/attachments/${att.id}/view?actingRole=${activeConversationalRole}`}
                                      alt={att.originalFileName}
                                      referrerPolicy="no-referrer"
                                      className="object-cover max-h-36 w-full group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[10px] gap-1">
                                      <Eye className="h-3.5 w-3.5" /> Click to Expand
                                    </div>
                                  </div>
                                )}

                                {/* Brief extracted snippet badge */}
                                {att.extractedTextSummary && !isImg && (
                                  <div className={`text-[10px] px-2 py-1 rounded-md line-clamp-1 italic ${
                                    isSamar ? 'bg-indigo-800/60 text-indigo-100' : 'bg-black/5 text-slate-600'
                                  }`}>
                                    "{att.extractedTextSummary}"
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Coach Evaluation Footer if present */}
                    {msg.coachEvaluation && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/30 text-[11px] text-emerald-200 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-[10px] text-emerald-300 uppercase">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Question Quality: {msg.coachEvaluation.questionQuality}
                        </div>
                        <p className="italic text-[10px] opacity-90">{msg.coachEvaluation.feedback}</p>
                      </div>
                    )}

                    {/* Source Trace / Why This Answer Inspector */}
                    {msg.sourceTrace && (
                      <SourceTraceViewer sourceTrace={msg.sourceTrace} />
                    )}
                  </div>
                );
              })
            )}
            {isSending && (
              <div className="mr-auto bg-slate-800 text-slate-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                <span>Processing conversational response...</span>
              </div>
            )}
            {isAiPending && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 flex-shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4 text-indigo-700" />
                </div>
                <div className="bg-white border border-indigo-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm w-32 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Question Prompts Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
            <span className="font-bold text-slate-400 shrink-0">Inquiry Starters:</span>
            <button
              type="button"
              onClick={() => setInputMessage(`At the moment the shipment arrived at the port of entry, did ${clientProfile?.companyName || 'Levant'} hold financial title or a written agreement to purchase the goods?`)}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 shrink-0 font-medium cursor-pointer"
            >
              1. U.S. Ownership at Entry (§ 1.500)
            </button>
            <button
              type="button"
              onClick={() => setInputMessage("What specific authorization does your customs broker have regarding FSVP entity declarations on CBP Form 7501?")}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 shrink-0 font-medium cursor-pointer"
            >
              2. Customs Broker Role (§ 1.500)
            </button>
            <button
              type="button"
              onClick={() => setInputMessage("Who is designated as the ultimate consignee on shipping documents and who handles ACE electronic entry filings?")}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 shrink-0 font-medium cursor-pointer"
            >
              3. Consignee & ACE Entry (§ 1.500)
            </button>
          </div>

          {/* Pending Attachment Chips above Composer */}
          {pendingAttachments.length > 0 && (
            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 px-1">
                <span>Selected File Attachments ({pendingAttachments.length})</span>
                {isUploadingAttachments && (
                  <span className="flex items-center gap-1 text-indigo-600">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading & Parsing...
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingAttachments.map((pItem) => (
                  <div
                    key={pItem.id}
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs shadow-2xs ${
                      pItem.status === 'ERROR'
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : pItem.status === 'READY'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="shrink-0">
                      {pItem.status === 'UPLOADING' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                      ) : pItem.status === 'ERROR' ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      ) : (
                        getFileCategoryIcon(undefined, pItem.originalFileName, 'h-3.5 w-3.5')
                      )}
                    </div>
                    <div className="max-w-[150px] truncate text-[11px] font-bold" title={pItem.originalFileName}>
                      {pItem.originalFileName}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      ({pItem.formattedSize})
                    </span>
                    {pItem.status === 'READY' && (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePendingAttachment(pItem.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Composer Input Form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
              multiple
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />

            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => {
                if (activeConversationalRole === 'OBSERVER') {
                  showNotification('Observer role is in read-only mode.', 'error');
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={isSending || isUploadingAttachments}
              className={`p-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                pendingAttachments.length > 0 ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' : ''
              }`}
              title="Attach Consulting Files (PDF, DOCX, XLSX, CSV, TXT, PNG, JPG)"
            >
              <Paperclip className="h-4 w-4" />
              <span className="hidden sm:inline">Attach Files</span>
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                activeChannel === 'CLIENT_ENGAGEMENT'
                  ? `Ask Elena / Marco a diagnostic question as ${participants.find(p => p.role === activeConversationalRole)?.name}...`
                  : `Ask C-Bridge AI Coach: "Verify 21 CFR 1.506 rule", "Evaluate my question", "Help me draft decision tree"...`
              }
              className="flex-1 text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <button
              type="submit"
              disabled={isSending || isUploadingAttachments || (!inputMessage.trim() && !pendingAttachments.some(a => a.status === 'READY'))}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Send</span>
            </button>
          </form>

        </div>

        {/* Right Column (3 cols): Question-Driven Learning & Regulatory Grounding */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Question-Driven Learning Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Consulting Method</h3>
                <div className="text-[10px] text-slate-500">Question-Driven Learning</div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-950">
              <div className="font-bold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Anti-Exam Mandate:
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-900">
                You are not here to answer multiple-choice quizzes. Your skill is measured by <strong>asking the right consulting questions</strong> to uncover client risk vectors.
              </p>
            </div>

            {/* Suggested Question Vectors */}
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Critical Inquiry Vectors (Module 1)
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 text-[11px]">1. Statutory Scope Definition</div>
                  <p className="text-[10px] text-slate-600">Determine whether U.S. owner or consignee exists at moment of entry (§ 1.500).</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 text-[11px]">2. Commercial Contract & Title Transfer</div>
                  <p className="text-[10px] text-slate-600">Evaluate Incoterms, payment timing, and financial ownership transfer at border entry.</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 text-[11px]">3. Customs Broker vs Importer Role</div>
                  <p className="text-[10px] text-slate-600">Clarify filing agent designation vs statutory FSVP responsibility on CBP Form 7501.</p>
                </div>
                <div className="p-2 bg-slate-100/70 rounded-xl border border-dashed border-slate-300 text-[9px] text-slate-500 italic">
                  [CROSS-MODULE REFERENCE — NOT CURRENT CASE OBJECTIVE: 21 CFR 1.504 Hazard Analysis & 21 CFR 1.506 Foreign Supplier Verification (Modules 2/3)]
                </div>
              </div>
            </div>
          </div>

          {/* Statutory References Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Regulatory Cross-Walk</h3>
              </div>
              <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                21 CFR 1.500
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
                <div className="font-bold text-emerald-300 text-[11px]">§ 1.500: FSVP Importer Definition</div>
                <p className="text-[10px] text-slate-300 mt-0.5">U.S. owner or consignee of an article of food at the time of entry.</p>
              </div>
              <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
                <div className="font-bold text-emerald-300 text-[11px]">§ 1.500: Ownership & Purchase Agreement</div>
                <p className="text-[10px] text-slate-300 mt-0.5">Direct purchase or written agreement to purchase by a U.S. entity at entry.</p>
              </div>
              <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
                <div className="font-bold text-emerald-300 text-[11px]">§ 1.500 / CBP 7501: Broker vs Importer</div>
                <p className="text-[10px] text-slate-300 mt-0.5">Customs broker files entry but cannot be designated as FSVP Importer without written consent as U.S. agent.</p>
              </div>
              <div className="p-1.5 bg-slate-950/60 rounded-lg border border-slate-800 text-[9px] text-slate-400 italic">
                [CROSS-MODULE REFERENCE: § 1.504 Hazard Analysis & § 1.506 Verification Activities are Module 2/3 scopes]
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Multi-Source Provenance Drawer Modal */}
      {isProvenanceDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Module Multi-Source Provenance Library</h2>
                  <p className="text-xs text-slate-500">Track all course uploads, syllabi, and legal citations with verifiable origin provenance.</p>
                </div>
              </div>
              <button
                onClick={() => setIsProvenanceDrawerOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {provenanceSources.map((src) => (
                <div key={src.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{src.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {src.verifiedStatus}
                      </span>
                      {src.isProtectedCourseMaterial && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          PROTECTED MATERIAL
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 font-mono">
                    <div>Type: <strong>{src.sourceType}</strong></div>
                    <div>Uploader: <strong>{src.uploadedBy}</strong></div>
                    <div>Date: <strong>{new Date(src.uploadedAt).toLocaleDateString()}</strong></div>
                  </div>
                  {src.extractedSnippet && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 font-sans italic">
                      "{src.extractedSnippet}"
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">
                    Citation: {src.referenceCitation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Requirements Map Modal (Distinguishing Source-Derived vs AI-Interpreted) */}
      {isRequirementDrawerOpen && requirements && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <FileCheck2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Module Requirement Analysis (Pilot PRJ-324)</h2>
                  <p className="text-xs text-slate-500">Explicitly distinguishing Source-Derived statutory facts from AI-Interpreted consulting recommendations.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRequirementDrawerOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Left Box: Source-Derived Requirements */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  A. Source-Derived Statutory Rules ({requirements.sourceDerived.statutoryRules.length})
                </div>
                <div className="space-y-2">
                  {requirements.sourceDerived.statutoryRules.map((rule) => (
                    <div key={rule.id} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-800 text-[11px]">{rule.rule}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rule.citation}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Box: AI-Interpreted Recommendations */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <div className="font-bold text-emerald-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  B. AI-Interpreted Consulting Questions ({requirements.aiInterpreted.criticalConsultingQuestionsToAskClient.length})
                </div>
                <div className="space-y-2">
                  {requirements.aiInterpreted.criticalConsultingQuestionsToAskClient.map((q) => (
                    <div key={q.id} className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-1">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase">{q.category}</div>
                      <div className="font-bold text-slate-800 text-[11px]">"{q.question}"</div>
                      <div className="text-[10px] text-slate-500 italic">Purpose: {q.purpose}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 6. View Working Tool Modal */}
      {selectedToolForViewing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-teal-600 tracking-wider">
                    {selectedToolForViewing.lifecycleCategory} ({selectedToolForViewing.toolType})
                  </div>
                  <h2 className="text-lg font-black text-slate-900">{selectedToolForViewing.title}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedToolForViewing(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {selectedToolForViewing.summary}
            </div>

            {/* Render Tool Payload */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-96">
              <pre>{JSON.stringify(selectedToolForViewing.dataPayload, null, 2)}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">Created: {new Date(selectedToolForViewing.createdAt).toLocaleDateString()} by {selectedToolForViewing.createdBy}</span>
              {selectedToolForViewing.hasAssetPotential && (
                <button
                  onClick={() => {
                    setSelectedToolForViewing(null);
                    onNavigateToAssetLab && onNavigateToAssetLab({
                      observedNeed: selectedToolForViewing.summary,
                      proposedAsset: selectedToolForViewing.title,
                      assetType: 'TOOL'
                    });
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" /> Propose as C-Bridge Asset Opportunity
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. New Working Tool Generator Modal */}
      {isNewWorkingToolModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Generate New Case Working Tool</h2>
              <button
                onClick={() => setIsNewWorkingToolModalOpen(false)}
                className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Select a specialized diagnostic template to generate for the {clientProfile?.companyName || 'Levant Culinary Traditions Corp'} case engagement.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleGenerateWorkingTool('FSVP_IMPORTER_DETERMINATION_MATRIX')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-xs space-y-1 transition-all cursor-pointer"
              >
                <div className="font-bold text-slate-900">1. FSVP Importer Determination Matrix</div>
                <div className="text-[11px] text-slate-500">Evaluates U.S. ownership at entry under 21 CFR 1.500 across suppliers.</div>
              </button>
              <button
                onClick={() => handleGenerateWorkingTool('FOREIGN_SUPPLIER_HAZARD_WORKSHEET')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-xs space-y-1 transition-all cursor-pointer"
              >
                <div className="font-bold text-slate-900">2. Foreign Supplier Hazard Worksheet</div>
                <div className="text-[11px] text-slate-500">Assesses biological (Listeria/Salmonella) and chemical hazards under 21 CFR 1.504.</div>
              </button>
              <button
                onClick={() => handleGenerateWorkingTool('SAHC_VERIFICATION_ACTIVITY_DECISION_TREE')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-xs space-y-1 transition-all cursor-pointer"
              >
                <div className="font-bold text-slate-900">3. SAHC Verification Decision Tree</div>
                <div className="text-[11px] text-slate-500">Maps when annual onsite audits by Qualified Auditors are mandatory under § 1.506(d)(1).</div>
              </button>
            </div>

            {/* Custom Tool Option */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-700">Or Create Custom Diagnostic Tool:</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customToolTitle}
                  onChange={(e) => setCustomToolTitle(e.target.value)}
                  placeholder="e.g., Supplier Audit Compliance Checklist..."
                  className="flex-1 text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                />
                <button
                  onClick={() => {
                    if (!customToolTitle.trim()) return;
                    handleGenerateWorkingTool('CUSTOM_DIAGNOSTIC_TOOL', customToolTitle.trim());
                    setCustomToolTitle('');
                  }}
                  disabled={!customToolTitle.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Governed Asset Opportunity Modal */}
      {isAssetOpportunityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">
                  GOVERNED RECORDING
                </span>
                <h2 className="text-base font-black text-slate-900">Save as Asset Opportunity</h2>
              </div>
              <button
                onClick={() => setIsAssetOpportunityModalOpen(false)}
                className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Record a potential C-Bridge capability asset discovered during this live simulation. Does not bypass QA approval governance.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onNavigateToAssetLab) {
                  onNavigateToAssetLab({
                    observedNeed: opportunityObservedNeed,
                    proposedAsset: opportunityProposedAsset,
                    problemItSolves: opportunityProblemSolved,
                    intendedUser: opportunityIntendedUser,
                    supportingCaseEvidence: opportunitySupportingEvidence,
                    assetType: 'TOOL'
                  });
                }
                setIsAssetOpportunityModalOpen(false);
                showNotification(`Asset Opportunity recorded: ${opportunityProposedAsset}`, 'success');
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Originating Member</label>
                <input
                  type="text"
                  disabled
                  value="Samar Baydoun (Capability Developer)"
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Proposed Asset Title *</label>
                <input
                  type="text"
                  required
                  value={opportunityProposedAsset}
                  onChange={(e) => setOpportunityProposedAsset(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Observed Need in Case *</label>
                <textarea
                  rows={2}
                  required
                  value={opportunityObservedNeed}
                  onChange={(e) => setOpportunityObservedNeed(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Problem It Solves *</label>
                <textarea
                  rows={2}
                  required
                  value={opportunityProblemSolved}
                  onChange={(e) => setOpportunityProblemSolved(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Intended User</label>
                <input
                  type="text"
                  value={opportunityIntendedUser}
                  onChange={(e) => setOpportunityIntendedUser(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssetOpportunityModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" /> Save Opportunity Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Secure Attachment Detail & Preview Modal */}
      {selectedAttachmentForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  {getFileCategoryIcon(selectedAttachmentForPreview.fileCategory, selectedAttachmentForPreview.originalFileName, 'h-6 w-6')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base max-w-md truncate" title={selectedAttachmentForPreview.originalFileName}>
                      {selectedAttachmentForPreview.originalFileName}
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold">
                      {selectedAttachmentForPreview.fileCategory || 'DOCUMENT'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{selectedAttachmentForPreview.formattedSize || formatAttachmentSize(selectedAttachmentForPreview.fileSize)}</span>
                    <span>•</span>
                    <span>Uploaded {selectedAttachmentForPreview.uploadedAt || 'recently'}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">By {selectedAttachmentForPreview.uploaderRole || 'Consultant'}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttachmentForPreview(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Synthetic Training Document Watermark Banner */}
            {(selectedAttachmentForPreview.synthetic || selectedAttachmentForPreview.trainingOnly) && (
              <div className="p-3.5 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-1">
                <div className="flex items-center space-x-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <span>SIMULATED TRAINING DOCUMENT — NOT FOR REGULATORY OR COMMERCIAL SUBMISSION</span>
                </div>
                <div className="text-[11px] text-amber-800/90 leading-relaxed font-mono flex items-center gap-3 flex-wrap pt-0.5">
                  <span>Governance: FSMA 21 CFR 1.500 Compliance Diagnostic</span>
                  <span>•</span>
                  <span>Session: {selectedAttachmentForPreview.sessionId || 'SESS-MA324-01'}</span>
                  <span>•</span>
                  <span>Case: {selectedAttachmentForPreview.caseId || 'CASE-LEVANT-01'}</span>
                </div>
              </div>
            )}

            {/* Scope / Security Badge */}
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
              selectedAttachmentForPreview.visibilityScope === 'INTERNAL_CBRIDGE'
                ? 'bg-indigo-950 border-indigo-800 text-indigo-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center space-x-2">
                {selectedAttachmentForPreview.visibilityScope === 'INTERNAL_CBRIDGE' ? (
                  <FolderLock className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Users className="h-4 w-4 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold">
                    {selectedAttachmentForPreview.visibilityScope === 'INTERNAL_CBRIDGE'
                      ? 'Backstage Internal Security Scope'
                      : 'Client Engagement Channel Scope'}
                  </span>
                  <p className="text-[11px] opacity-80">
                    {selectedAttachmentForPreview.visibilityScope === 'INTERNAL_CBRIDGE'
                      ? 'Strictly accessible by C-Bridge consulting members and AI Coach. Client roles cannot view or download.'
                      : `Shared engagement context accessible to both ${clientProfile?.companyName || 'Levant Culinary Traditions Corp'} client participants and C-Bridge consultants.`}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 border ${
                selectedAttachmentForPreview.visibilityScope === 'INTERNAL_CBRIDGE'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {selectedAttachmentForPreview.visibilityScope === 'INTERNAL_CBRIDGE' ? 'INTERNAL' : 'CLIENT FACING'}
              </span>
            </div>

            {/* Structured Evidence Breakdown (if synthetic artifact) */}
            {selectedAttachmentForPreview.structuredEvidenceData && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>Structured Case Evidence Variables</span>
                  </span>
                  <span className="text-[10px] font-mono text-indigo-600 font-semibold uppercase">
                    {selectedAttachmentForPreview.documentType || 'CASE_ARTIFACT'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  {Object.entries(selectedAttachmentForPreview.structuredEvidenceData).map(([k, v]) => {
                    if (typeof v === 'object') return null;
                    return (
                      <div key={k} className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">{k?.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-semibold text-slate-800 break-words">{String(v)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visual Preview if Image */}
            {(selectedAttachmentForPreview.fileCategory === 'IMAGE' || (selectedAttachmentForPreview.mimeType && selectedAttachmentForPreview.mimeType.startsWith('image/'))) && (
              <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 flex items-center justify-center max-h-72 overflow-hidden">
                <img
                  src={`/api/case-room/attachments/${selectedAttachmentForPreview.id}/view?actingRole=${activeConversationalRole}`}
                  alt={selectedAttachmentForPreview.originalFileName}
                  referrerPolicy="no-referrer"
                  className="max-h-64 object-contain rounded-xl"
                />
              </div>
            )}

            {/* PDF Embedded Document Viewer */}
            {(selectedAttachmentForPreview.mimeType === 'application/pdf' || selectedAttachmentForPreview.originalFileName?.endsWith('.pdf')) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-rose-600" />
                    <span>Document View</span>
                  </span>
                  <a
                    href={`/api/case-room/attachments/${selectedAttachmentForPreview.id}/view?actingRole=${activeConversationalRole}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1"
                  >
                    Open Fullscreen in New Tab
                  </a>
                </div>
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 h-80">
                  <iframe
                    src={`/api/case-room/attachments/${selectedAttachmentForPreview.id}/view?actingRole=${activeConversationalRole}`}
                    title={selectedAttachmentForPreview.originalFileName}
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            )}

            {/* AI Ingestion Intelligence Summary */}
            {selectedAttachmentForPreview.extractedTextSummary && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1.5">
                <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-xs">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>AI Ingestion & Analysis Summary</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {selectedAttachmentForPreview.extractedTextSummary}
                </p>
              </div>
            )}

            {/* Extracted Document Content / Text Snippet */}
            {selectedAttachmentForPreview.extractedTextSnippet && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Parsed Content Excerpt</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Usable by AI Consulting Assistant & Coach
                  </span>
                </div>
                <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap border border-slate-800 selection:bg-indigo-500">
                  {selectedAttachmentForPreview.extractedTextSnippet}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {selectedAttachmentForPreview.id}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedAttachmentForPreview(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(selectedAttachmentForPreview)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" /> Download File
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Start New Session Confirmation Modal (Supervisor/Owner) */}
      {isStartNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Start New Pilot Session</h3>
                  <p className="text-xs text-slate-500">Supervisor / Owner Controlled Operation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isRestartingSession && setIsStartNewSessionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-900">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                Session Lifecycle & Data Preservation Protocol
              </div>
              <p className="leading-relaxed">
                Starting a new session will <strong>archive</strong> the current conversation into immutable historical records. Nothing is lost or deleted.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800/90 font-medium">
                <li>Historical messages & source traces remain in audit records.</li>
                <li>Learner case progress, evidence documents, and approved files are 100% preserved.</li>
                <li>The active case room will cleanly re-initialize with Elena's canonical opening inquiry.</li>
              </ul>
            </div>

            {activeSessionId && (
              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                Active Session ID: <span className="font-bold text-slate-700">{activeSessionId}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsStartNewSessionModalOpen(false)}
                disabled={isRestartingSession}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartNewSession}
                disabled={isRestartingSession}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isRestartingSession ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Archiving & Initializing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm & Start New Session
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
