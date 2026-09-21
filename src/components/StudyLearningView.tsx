import React, { useState } from 'react';
import { 
  LiveLearningSession, 
  TaskItem, 
  LiveQuizOption, 
  SupervisorAttentionLevel, 
  AssetTaskSuggestion, 
  CBridgeAssetType,
  MemberWorkflowPosition 
} from '../types';
import { ResumeWorkflowBanner } from './ResumeWorkflowBanner';
import { 
  BookOpen, 
  Upload, 
  Sparkles, 
  Eye, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Send, 
  FileText, 
  Shield, 
  MessageSquare, 
  BrainCircuit, 
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Zap,
  ArrowRight,
  PlusCircle,
  FileCode,
  Target,
  Check,
  CheckSquare,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

interface StudyLearningViewProps {
  session: LiveLearningSession;
  tasks: TaskItem[];
  onSendMessage: (text: string, type?: 'CHAT' | 'EXPLANATION' | 'QUESTION' | 'SUMMARY') => void;
  onAnswerQuiz: (messageId: string, optionIndex: number) => void;
  onTriggerAIAction: (actionType: 'EXPLAIN' | 'QUIZ' | 'CASE' | 'EXPLAIN_OWN_WORDS' | 'WEAK_AREAS' | 'SUMMARY') => void;
  onUploadMaterial: (fileName: string) => void;
  onSelectTask: (taskId: string) => void;
  onConfirmAssetTasks?: (taskSuggestions: AssetTaskSuggestion[]) => void;
  onResumeWorkflow?: (position?: MemberWorkflowPosition) => void;
}

export const StudyLearningView: React.FC<StudyLearningViewProps> = ({
  session,
  tasks,
  onSendMessage,
  onAnswerQuiz,
  onTriggerAIAction,
  onUploadMaterial,
  onSelectTask,
  onConfirmAssetTasks,
  onResumeWorkflow
}) => {
  const [inputText, setInputText] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showQuestionsDrawer, setShowQuestionsDrawer] = useState(false);
  const [showHandoffCard, setShowHandoffCard] = useState(true);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    session.handoffData?.suggestedTasks.map(t => t.id) || ['AST-9114-1', 'AST-9114-2', 'AST-9114-3']
  );
  const [confirmationSuccessMsg, setConfirmationSuccessMsg] = useState<string | null>(null);

  const fsvpTasks = tasks.filter((t) => t.assignedTo === 'Samar Baydoun');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'CHAT');
    setInputText('');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFileName.trim()) return;
    onUploadMaterial(uploadedFileName.trim());
    setUploadedFileName('');
    setShowUploadModal(false);
  };

  const toggleTaskSelection = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter(tId => tId !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const handleConfirmSelectedTasks = () => {
    if (!session.handoffData?.suggestedTasks) return;
    const tasksToConfirm = session.handoffData.suggestedTasks.filter(t => selectedTaskIds.includes(t.id));
    if (tasksToConfirm.length === 0) return;

    if (onConfirmAssetTasks) {
      onConfirmAssetTasks(tasksToConfirm);
    }

    setConfirmationSuccessMsg(`Successfully confirmed and added ${tasksToConfirm.length} asset task(s) directly to Samar Baydoun's Agenda!`);
    setTimeout(() => setConfirmationSuccessMsg(null), 5000);
  };

  const handleGenerateIdeas = () => {
    onTriggerAIAction('SUMMARY');
    setShowHandoffCard(true);
    onSendMessage('C-Bridge AI: Analyzing session context to generate recommended follow-on operational asset task proposals...', 'EXPLANATION');
  };

  return (
    <div id="study-learning-view" className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Persistent Workflow Resume Banner */}
      {onResumeWorkflow && (
        <ResumeWorkflowBanner 
          currentUser="SAMAR"
          onResume={(pos) => onResumeWorkflow(pos)}
          variant="banner"
        />
      )}

      {/* Top Banner: Transparency & Supervisor Visibility */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700 rounded-2xl p-4 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300 shrink-0">
            <Eye className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                SUPERVISOR VISIBILITY: ACTIVE
              </span>
              <span className="text-xs font-mono text-slate-300">
                Supervisor: <strong>{session.supervisor}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Professional C-Bridge work and learning sessions are reviewable by the assigned supervisor in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Session ID</div>
            <div className="text-xs font-mono font-bold text-indigo-300">{session.sessionId}</div>
          </div>
          <span className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE MEMBER ACTIVITY
          </span>
        </div>
      </div>

      {/* MANDATORY STUDY SESSION HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="h-4 w-4" />
              <span>C-Bridge Professional Study Workspace</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{session.topic}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Member: <strong className="text-slate-800">{session.member}</strong></span>
              <span>•</span>
              <span>Started: <strong className="font-mono text-slate-800">{session.startTime}</strong></span>
            </p>
          </div>

          {/* Task Linker & Progress */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 shrink-0 min-w-[300px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Learning Progress</span>
              <span className="font-mono font-bold text-indigo-600">{session.learningProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${session.learningProgress}%` }}
              />
            </div>
            
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-bold">Related Task:</span>
              <select
                value={session.relatedTaskId}
                onChange={(e) => onSelectTask(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800 focus:outline-hidden"
              >
                {fsvpTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — {t.title.slice(0, 28)}...
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 6 Mandatory Header Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">1. Related Task</span>
            <span className="font-mono font-bold text-indigo-700 block">{session.relatedTaskId}</span>
            <span className="text-[11px] text-slate-700 font-medium truncate block">{session.relatedTaskTitle}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">2. Assigned Material</span>
            <span className="font-semibold text-slate-900 block line-clamp-2">{session.sourceMaterial}</span>
          </div>

          <div className="space-y-0.5 md:col-span-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">3. Learning Objective</span>
            <p className="text-[11px] text-slate-800 font-medium leading-tight">
              {session.learningObjective || 'Master 21 CFR 1.500-1.506 Foreign Supplier Verification & Hazard Analysis Requirements.'}
            </p>
          </div>

          <div className="space-y-0.5 md:col-span-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">4. Expected C-Bridge Application</span>
            <p className="text-[11px] text-indigo-950 font-semibold leading-tight">
              {session.expectedCBridgeApplication || 'Develop original C-Bridge Foreign Supplier Evaluation Checklist, SOP Workflow, and LinkedIn Educational Content.'}
            </p>
          </div>
        </div>

        {/* Session Meta Row */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-100 gap-2">
          <div className="flex items-center space-x-3 text-slate-600">
            <span><strong>Supervisor:</strong> {session.supervisor}</span>
            <span>•</span>
            <span><strong>Status:</strong> <span className="text-emerald-700 font-bold">{session.status}</span></span>
            <span>•</span>
            <span><strong>Review Model:</strong> <span className="font-mono font-bold text-amber-700">{session.attentionLevel}</span></span>
          </div>

          <button
            onClick={() => setShowQuestionsDrawer(!showQuestionsDrawer)}
            className="text-indigo-700 font-bold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{showQuestionsDrawer ? 'Hide Open Questions' : `View Open Questions (${session.openQuestions.length})`}</span>
          </button>
        </div>

        {showQuestionsDrawer && (
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 text-xs space-y-2">
            <h4 className="font-bold text-indigo-950 flex items-center gap-1">
              <HelpCircle className="h-4 w-4 text-indigo-600" />
              <span>Current Open Session Questions for Review:</span>
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-indigo-900">
              {session.openQuestions.map((q, idx) => (
                <li key={idx} className="bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* PROTECTED MSU MATERIAL SEPARATION RULE BANNER */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border-2 border-amber-500/60 rounded-2xl p-5 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <span>PROTECTED MSU MATERIAL SEPARATION & DERIVATIVE ASSET RULE</span>
          </div>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">
            POLICY MANDATE
          </span>
        </div>

        {/* Flow Graphic */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] text-center font-bold font-mono">
          <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-xl text-amber-200">
            MSU SOURCE MATERIAL
            <span className="block text-[9px] font-sans font-normal text-slate-400">Protected Reference</span>
          </div>
          <div className="flex items-center justify-center text-amber-400 font-sans text-xs font-black">→</div>
          <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-xl text-indigo-200">
            SAMAR LEARNING
            <span className="block text-[9px] font-sans font-normal text-slate-400">Study & Understanding</span>
          </div>
          <div className="flex items-center justify-center text-amber-400 font-sans text-xs font-black">→</div>
          <div className="bg-emerald-950/80 border border-emerald-500/60 p-2 rounded-xl text-emerald-300">
            ORIGINAL C-BRIDGE ASSET
            <span className="block text-[9px] font-sans font-normal text-emerald-200/80">Independent Asset Task</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed pt-1">
          <strong>Rule Statement:</strong> Protected MSU material is used exclusively for internal learning, discussion, and understanding. It must <strong>NOT</strong> be directly copied, paraphrased line-by-line, or transformed into commercial C-Bridge assets. Every new asset is drafted independently using learned concepts and appropriate regulatory sources (21 CFR Part 1).
        </p>
      </div>

      {/* PROMINENT ACTION SECTION: TURN LEARNING INTO C-BRIDGE VALUE */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border-2 border-indigo-500 rounded-2xl p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/30 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 font-extrabold text-xs uppercase tracking-wider">
              <Zap className="h-5 w-5 text-amber-400 animate-bounce" />
              <span>CAPABILITY CONVERSION ENGINE</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">TURN LEARNING INTO C-BRIDGE VALUE</h2>
            <p className="text-xs text-slate-300">
              Learning is not a standalone activity. Convert verified study outcomes into active C-Bridge operational assets.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>C-BRIDGE METHODOLOGY</span>
            </span>
          </div>
        </div>

        {/* 3 Prominent Conversion Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleGenerateIdeas}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl transition cursor-pointer text-left space-y-2 border border-indigo-400/40 shadow-lg group"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wide text-indigo-200">STEP 1</span>
              <Sparkles className="h-5 w-5 text-indigo-300 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-extrabold text-white">[GENERATE ASSET TASK IDEAS]</div>
            <p className="text-[11px] text-indigo-200/90 leading-tight">
              Ask C-Bridge AI to evaluate topic & scope to infer 1–3 high-value asset task proposals.
            </p>
          </button>

          <button
            onClick={() => setShowHandoffCard(true)}
            className="bg-purple-900/80 hover:bg-purple-800 text-white p-4 rounded-xl transition cursor-pointer text-left space-y-2 border border-purple-500/40 shadow-lg group"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wide text-purple-200">STEP 2</span>
              <Award className="h-5 w-5 text-purple-300 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-extrabold text-white">[CREATE LEARNING HANDOFF]</div>
            <p className="text-[11px] text-purple-200/90 leading-tight">
              Format verified concepts, Samar understanding, and scope policy checks for supervisor review.
            </p>
          </button>

          <button
            onClick={handleConfirmSelectedTasks}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl transition cursor-pointer text-left space-y-2 border border-emerald-400/40 shadow-lg group"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wide text-emerald-200">STEP 3</span>
              <CheckSquare className="h-5 w-5 text-emerald-300 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-extrabold text-white">[ADD SELECTED TASKS TO AGENDA]</div>
            <p className="text-[11px] text-emerald-200/90 leading-tight">
              Instantly assign proposed asset tasks to Samar's Agenda for execution & QA review.
            </p>
          </button>
        </div>

        {confirmationSuccessMsg && (
          <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-pulse">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{confirmationSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* C-BRIDGE AI LEARNING INTERACTION TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-300 font-extrabold text-xs">
            <BrainCircuit className="h-4 w-4 text-indigo-400" />
            <span>C-BRIDGE AI TUTOR & LEARNING ACTIONS</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Select a learning action:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-bold">
          <button
            onClick={() => onTriggerAIAction('EXPLAIN')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition cursor-pointer text-center space-y-1 flex flex-col items-center justify-center border border-indigo-500/40"
          >
            <Sparkles className="h-4 w-4 text-indigo-200" />
            <span>EXPLAIN TOPIC</span>
          </button>

          <button
            onClick={() => onTriggerAIAction('QUIZ')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl transition cursor-pointer text-center space-y-1 flex flex-col items-center justify-center border border-slate-700"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>TAKE QUIZ</span>
          </button>

          <button
            onClick={() => onTriggerAIAction('CASE')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl transition cursor-pointer text-center space-y-1 flex flex-col items-center justify-center border border-slate-700"
          >
            <Layers className="h-4 w-4 text-amber-400" />
            <span>GIVE FSVP CASE</span>
          </button>

          <button
            onClick={() => onTriggerAIAction('EXPLAIN_OWN_WORDS')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl transition cursor-pointer text-center space-y-1 flex flex-col items-center justify-center border border-slate-700"
          >
            <MessageSquare className="h-4 w-4 text-blue-400" />
            <span>CHECK MY WORDS</span>
          </button>

          <button
            onClick={() => onTriggerAIAction('WEAK_AREAS')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl transition cursor-pointer text-center space-y-1 flex flex-col items-center justify-center border border-slate-700"
          >
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>WEAK AREAS</span>
          </button>

          <button
            onClick={() => onTriggerAIAction('SUMMARY')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl transition cursor-pointer text-center space-y-1 flex flex-col items-center justify-center border border-slate-700"
          >
            <Award className="h-4 w-4 text-purple-400" />
            <span>LEARNING SUMMARY</span>
          </button>
        </div>
      </div>

      {/* LEARNING-TO-ASSET HANDOFF & RECOMMENDED ASSET TASKS CARD */}
      {showHandoffCard && session.handoffData && (
        <div className="bg-white border-2 border-indigo-600 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider">
                <Target className="h-5 w-5 text-indigo-600" />
                <span>C-BRIDGE LEARNING-TO-ASSET HANDOFF</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {session.handoffData.topicLearned}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Scope & Policy Approved</span>
              </span>
            </div>
          </div>

          {/* Handoff Details Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Key Concepts Mastered</span>
              <ul className="space-y-1 list-disc list-inside text-slate-800 font-medium">
                {session.handoffData.keyConcepts.map((kc, idx) => (
                  <li key={idx}>{kc}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Member Understanding Confirmation</span>
              <p className="text-slate-800 font-semibold leading-relaxed">
                {session.handoffData.samarUnderstanding}
              </p>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-indigo-900 font-mono">
                Source Classification: <strong>{session.handoffData.sourceClassification}</strong>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Potential C-Bridge Application</span>
              <p className="text-indigo-950 font-bold leading-relaxed">
                {session.handoffData.potentialCBridgeApplication}
              </p>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-2">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Scope & Policy Check</span>
              <p className="text-emerald-950 text-[11px] font-semibold leading-relaxed">
                {session.handoffData.scopePolicyCheck}
              </p>
            </div>
          </div>

          {/* ASSET TASK SUGGESTIONS HEADER */}
          <div className="pt-2 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  <span>RECOMMENDED C-BRIDGE ASSET TASKS ({session.handoffData.suggestedTasks.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select and confirm follow-on tasks to immediately add to Samar Baydoun's Agenda.
                </p>
              </div>

              <button
                onClick={handleConfirmSelectedTasks}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <CheckSquare className="h-4 w-4" />
                <span>CONFIRM SELECTED ({selectedTaskIds.length})</span>
              </button>
            </div>

            {/* Asset Task Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {session.handoffData.suggestedTasks.map((task) => {
                const isSelected = selectedTaskIds.includes(task.id);
                const isConfirmed = task.isConfirmed;

                // Determine routing rule
                let routingText = "CB-9120 QA Review Required";
                if (task.assetType === 'LINKEDIN EDUCATIONAL POST') {
                  routingText = "Content Task → Claim Review → Applicable QA → Husni Publication Approval";
                } else if (['SOP', 'CHECKLIST', 'WORKFLOW', 'GAP-ASSESSMENT TOOL'].includes(task.assetType)) {
                  routingText = "Routes to CB-9120 QA after development";
                }

                return (
                  <div
                    key={task.id}
                    className={`border-2 rounded-2xl p-4 transition space-y-3 relative flex flex-col justify-between ${
                      isConfirmed
                        ? 'bg-emerald-50/90 border-emerald-500'
                        : isSelected
                        ? 'bg-indigo-50/50 border-indigo-600'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                          {task.assetType}
                        </span>

                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTaskSelection(task.id)}
                            disabled={isConfirmed}
                            className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                        {task.taskTitle}
                      </h4>

                      <p className="text-[11px] text-slate-600 leading-tight">
                        {task.purpose}
                      </p>

                      <div className="space-y-1 text-[10px] bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                        <div><strong>Assigned Member:</strong> {task.assignedMember}</div>
                        <div><strong>Suggested Priority:</strong> <span className="text-indigo-700 font-bold">{task.suggestedPriority}</span></div>
                        <div><strong>Destination:</strong> <span className="font-mono text-slate-800">{task.destination}</span></div>
                        <div><strong>Deliverable:</strong> {task.expectedDeliverable}</div>
                        <div><strong>QA Requirement:</strong> {task.qaRequirement}</div>
                        <div><strong>Supervisor Review:</strong> {task.supervisorReviewRequirement}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 space-y-2">
                      <div className="text-[10px] font-bold text-indigo-900 bg-indigo-100/70 p-1.5 rounded text-center">
                        ROUTING: {routingText}
                      </div>

                      {isConfirmed ? (
                        <div className="bg-emerald-600 text-white font-black text-xs p-2 rounded-xl text-center flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>CONFIRMED & ON AGENDA</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (onConfirmAssetTasks) onConfirmAssetTasks([task]);
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>CONFIRM & ADD TO AGENDA</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIVE SESSION CHAT STREAM */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[520px]">
        <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 font-bold text-slate-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE CHRONOLOGICAL SESSION RECORD</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">{session.messages.length} Events Logged</span>
        </div>

        {/* Message Stream Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {session.messages.map((msg) => {
            const isSamar = msg.sender === 'SAMAR';
            const isAI = msg.sender === 'C_BRIDGE_AI';
            const isSupervisor = msg.sender === 'SUPERVISOR' || msg.type === 'INTERVENTION';

            return (
              <div key={msg.id} className="space-y-1">
                {/* SUPERVISOR INTERVENTION BANNER ITEM */}
                {isSupervisor ? (
                  <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-2xl p-4 text-white shadow-md space-y-2 my-2">
                    <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-indigo-400" />
                        <span className="font-extrabold text-xs uppercase tracking-wider text-indigo-300">
                          SUPERVISOR INTERVENTION — {msg.senderName || 'Husni Hasan'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                ) : isAI ? (
                  /* AI MESSAGE ITEM */
                  <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-2xs space-y-3 max-w-3xl mr-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                          C-BRIDGE AI
                        </div>
                        <span className="text-xs font-bold text-slate-800">{msg.senderName}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{msg.timestamp}</span>
                    </div>

                    <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>

                    {/* QUIZ WIDGET IF PRESENT */}
                    {msg.type === 'QUIZ' && msg.quizOptions && (
                      <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-xl space-y-2 mt-2">
                        <div className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                          <span>Interactive Quiz</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.quizOptions.map((opt) => {
                            const isSelected = msg.selectedOptionIndex === opt.id;
                            const isCorrectOpt = msg.correctOptionIndex === opt.id;
                            const hasAnswered = msg.selectedOptionIndex !== undefined;

                            let btnStyle = "bg-white border-slate-300 hover:border-indigo-400 text-slate-800";
                            if (hasAnswered) {
                              if (isCorrectOpt) btnStyle = "bg-emerald-100 border-emerald-400 text-emerald-900 font-bold";
                              else if (isSelected && !msg.isCorrect) btnStyle = "bg-rose-100 border-rose-400 text-rose-900 font-bold";
                            }

                            return (
                              <button
                                key={opt.id}
                                disabled={hasAnswered}
                                onClick={() => onAnswerQuiz(msg.id, opt.id)}
                                className={`w-full text-left p-2 rounded-lg text-xs border transition cursor-pointer ${btnStyle}`}
                              >
                                {opt.text}
                              </button>
                            );
                          })}
                        </div>

                        {msg.explanation && (
                          <div className="text-[11px] text-indigo-900 pt-1 font-medium border-t border-indigo-200/60">
                            {msg.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* SAMAR USER MESSAGE ITEM */
                  <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-2xs space-y-2 max-w-2xl ml-auto">
                    <div className="flex items-center justify-between border-b border-indigo-500 pb-1.5 text-[11px]">
                      <span className="font-bold">{msg.senderName}</span>
                      <span className="font-mono text-indigo-200 text-[10px]">{msg.timestamp}</span>
                    </div>
                    <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Samar Input Bar */}
        <form onSubmit={handleSend} className="bg-white p-3 border-t border-slate-200 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Attach Material"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask C-Bridge AI a question, request clarification, or explain in your own words..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
          >
            <span>Send</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* UPLOAD MATERIAL MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold">
              <Upload className="h-5 w-5" />
              <span>Attach Learning / FSVP Reference Material</span>
            </div>
            <p className="text-xs text-slate-500">
              Attach course packs, regulatory documents, or supplier verification files to this C-Bridge learning session.
            </p>
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document / Material Title
                </label>
                <input
                  type="text"
                  required
                  value={uploadedFileName}
                  onChange={(e) => setUploadedFileName(e.target.value)}
                  placeholder="E.g. 21 CFR 1.505 Foreign Supplier Audit SOP Guidance.pdf"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Attach to Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
