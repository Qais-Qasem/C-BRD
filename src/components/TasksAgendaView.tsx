import React, { useState } from 'react';
import { TaskItem, TaskStatus, UserRole, TaskEvidenceRecord, MemberWorkflowPosition } from '../types';
import { ResumeWorkflowBanner } from './ResumeWorkflowBanner';
import { SubmitResultModal } from './SubmitResultModal';
import { UploadEvidenceModal } from './UploadEvidenceModal';
import { ViewEvidenceModal } from './ViewEvidenceModal';
import { 
  FolderKanban, 
  CheckSquare, 
  Play, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertOctagon, 
  FileCheck, 
  Filter, 
  PlusCircle,
  ShieldCheck,
  Eye,
  Trash2,
  AlertCircle,
  Clock,
  Calendar,
  Users
} from 'lucide-react';

interface TasksAgendaViewProps {
  tasks: TaskItem[];
  currentUser: UserRole;
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
    evidenceRecord?: TaskEvidenceRecord | any
  ) => void;
  onRemoveEvidence?: (taskId: string, recordId?: string) => void;
  onOpenNewTask: () => void;
  onOpenAskAI: () => void;
  onResumeWorkflow?: (position?: MemberWorkflowPosition) => void;
}

export const TasksAgendaView: React.FC<TasksAgendaViewProps> = ({
  tasks,
  currentUser,
  onStartTask,
  onSubmitForQA,
  onCompleteTask,
  onSubmitTaskResult,
  onReportBlocker,
  onUploadEvidence,
  onRemoveEvidence,
  onOpenNewTask,
  onOpenAskAI,
  onResumeWorkflow
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [blockerTaskId, setBlockerTaskId] = useState<string | null>(null);
  const [blockerReason, setBlockerReason] = useState('');
  const [submitResultTask, setSubmitResultTask] = useState<TaskItem | null>(null);
  const [uploadEvidenceTask, setUploadEvidenceTask] = useState<TaskItem | null>(null);
  const [viewEvidenceTask, setViewEvidenceTask] = useState<TaskItem | null>(null);
  const [confirmRemoveRecord, setConfirmRemoveRecord] = useState<{ taskId: string; recordId: string; title: string } | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchAssignee = 
      assigneeFilter === 'ALL' || 
      (assigneeFilter === 'SAMAR' && t.assignedTo === 'Samar Baydoun') ||
      (assigneeFilter === 'HUSNI' && t.assignedTo === 'Husni Hasan');
    return matchStatus && matchAssignee;
  });

  const handleBlockerSubmit = (id: string) => {
    if (!blockerReason.trim()) return;
    onReportBlocker(id, blockerReason);
    setBlockerTaskId(null);
    setBlockerReason('');
  };

  return (
    <div id="tasks-agenda-view" className="space-y-6 pb-12">
      
      {/* Persistent Workflow Resume Banner */}
      {onResumeWorkflow && (
        <ResumeWorkflowBanner 
          currentUser={currentUser}
          onResume={(pos) => onResumeWorkflow(pos)}
          variant="banner"
        />
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-white">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-300 font-mono font-bold mb-1">
            <span className="bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
              CB-9119 OPERATIONS & PROGRESS CENTER
            </span>
            <span>•</span>
            <span>SB-9111 Member Execution</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Operations, Agenda & Progress Center
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Cross-functional operational tracking for Phase 1 U.S. Food Import Readiness & FSVP Documentation Support.
          </p>
        </div>

        <button
          id="btn-tasks-new-task"
          onClick={onOpenNewTask}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>NEW TASK + PRIORITY INFERENCE</span>
        </button>
      </div>

      {/* CB-9119 Member Capacity Advisory Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
              CB-9119 Member Daily Capacity & Planning Integration (Samar Baydoun)
            </span>
          </div>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
            ACTIVE CAPACITY: 5.0 HOURS / TODAY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Available Today</div>
            <div className="text-base font-black text-emerald-400 font-mono">5.0 hrs</div>
            <div className="text-[10px] text-slate-500">Normal schedule 09:00 AM - 02:00 PM</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Already Scheduled</div>
            <div className="text-base font-black text-amber-400 font-mono">3.0 hrs</div>
            <div className="text-[10px] text-slate-500">2 active tasks in daily agenda</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Remaining Capacity</div>
            <div className="text-base font-black text-blue-400 font-mono">2.0 hrs</div>
            <div className="text-[10px] text-slate-500">Available bandwidth today</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Capacity Status</div>
            <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              AVAILABLE (NEAR CAP)
            </div>
          </div>
        </div>

        {/* Capacity Action Recommendation Options */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="text-slate-300">
            <span className="font-bold text-amber-300 mr-1 font-mono">[AI CAPACITY ADVISORY]:</span>
            For a new 5-hour task, C-Bridge avoids over-allocating remaining 2.0h capacity. Select planning action:
          </div>
          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">PARTIAL WORK TODAY</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">SCHEDULE TOMORROW</span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">REPRIORITIZE</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">SUPERVISOR DIRECTION</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-bold mr-1">Status:</span>
          {['ALL', 'PENDING', 'IN_PROGRESS', 'READY_FOR_QA', 'COMPLETED', 'BLOCKED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {st?.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-slate-500 font-bold">Assignee:</span>
          <button
            onClick={() => setAssigneeFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
              assigneeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setAssigneeFilter('SAMAR')}
            className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
              assigneeFilter === 'SAMAR' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Samar
          </button>
          <button
            onClick={() => setAssigneeFilter('HUSNI')}
            className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
              assigneeFilter === 'HUSNI' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Husni
          </button>
        </div>

      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 shadow-xs">
            No operational tasks match the selected filter criteria.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="bg-white border border-slate-200 hover:border-slate-300 p-5 rounded-2xl transition space-y-3 shadow-xs text-slate-800">
              
              {/* Hierarchy Context Badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                {task.projectName && (
                  <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded font-extrabold">
                    Project: {task.projectName}
                  </span>
                )}

                {task.masterAgendaItemId && (
                  <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded font-bold">
                    Master Item: {task.masterAgendaItemId}
                  </span>
                )}

                {task.scheduledReason && (
                  <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded font-medium">
                    Scheduled: {task.scheduledReason}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{task.title}</span>
                    <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-300">
                      {task.moduleCode}
                    </span>
                    <span className="text-xs text-slate-500">({task.moduleName})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    task.priority.includes('P0') ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    task.priority.includes('P1') ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    task.priority.includes('P3') ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                    'bg-blue-100 text-blue-800 border-blue-300'
                  }`}>
                    {task.priority}
                  </span>

                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    task.executionStatus === 'WAITING_FOR_PREREQUISITE' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    task.status === 'READY_FOR_QA' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                    task.status === 'BLOCKED' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    task.executionStatus === 'SCHEDULED' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {task.executionStatus === 'WAITING_FOR_PREREQUISITE' ? 'WAITING FOR PREREQUISITE' : task.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Performance Started Badge */}
              {task.startedAt && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="font-bold">{task.startedAt}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">Logged</span>
                  </div>
                  {task.startAuditData && (
                    <div className="text-[10px] text-emerald-700/80 font-mono pt-1 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-x-4">
                      <span>Timezone: {task.startAuditData.timeZone}</span>
                      <span>UTC Offset: {task.startAuditData.utcOffset}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Result Submission Badge if submitted or saved draft */}
              {task.resultData && (
                task.resultData.submittedAt ? (
                  <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-900 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 font-mono">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="font-bold">{task.resultData.submittedAt}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-blue-700 font-extrabold bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                        Submitted By {task.resultData.submittedBy || 'Samar Baydoun'}
                      </span>
                    </div>

                    <div className="text-slate-800 space-y-1 text-xs pt-2 border-t border-blue-200/60 font-sans">
                      <div>
                        <strong className="text-blue-950">Result Summary:</strong> {task.resultData.resultSummary}
                      </div>
                      {task.resultData.workCompleted && (
                        <div>
                          <strong className="text-slate-700">Work Completed:</strong> {task.resultData.workCompleted}
                        </div>
                      )}
                      {task.resultData.remainingWork && (
                        <div>
                          <strong className="text-slate-700">Remaining Work / Next Step:</strong> {task.resultData.remainingWork}
                        </div>
                      )}
                      {task.resultData.evidenceRef && (
                        <div>
                          <strong className="text-slate-700">Evidence Ref:</strong> <span className="font-mono text-[11px] underline text-blue-700">{task.resultData.evidenceRef}</span>
                        </div>
                      )}
                      {task.resultData.blocker && (
                        <div className="text-rose-700">
                          <strong>Blocker:</strong> {task.resultData.blocker}
                        </div>
                      )}
                    </div>
                  </div>
                ) : task.resultData.isDraft ? (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-amber-800">[DRAFT RESULT SAVED]</span>
                      <span className="text-[10px] text-amber-700 font-bold uppercase">Draft Result</span>
                    </div>
                    <div className="text-slate-800 text-xs font-sans">
                      <strong>Summary:</strong> {task.resultData.resultSummary || 'Draft summary'}
                    </div>
                  </div>
                ) : null
              )}

              {/* Blocker Notes if Blocked */}
              {task.blockerNotes && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800">
                  <strong>Operational Blocker Note:</strong> {task.blockerNotes}
                </div>
              )}

              {/* Evidence Added Card Block */}
              {((task.evidenceRecords && task.evidenceRecords.length > 0) || task.evidenceUrl) && (() => {
                const recs = task.evidenceRecords && task.evidenceRecords.length > 0
                  ? task.evidenceRecords
                  : [
                      {
                        id: `EVD-LEGACY-${task.id}`,
                        taskId: task.id,
                        taskTitle: task.title,
                        uploadedBy: 'Samar Baydoun',
                        timestamp: '2026-08-09 06:00:00 EDT',
                        title: task.evidenceUrl?.split('] ')[1]?.split(' (')[0] || `${task.title} Evidence`,
                        evidenceType: task.evidenceUrl?.startsWith('[') ? task.evidenceUrl.split(']')[0]?.replace('[', '') : 'WORK PRODUCT',
                        fileOrLink: task.evidenceUrl || 'doc-ref.pdf',
                        notes: task.resultData?.workCompleted || '',
                        supervisorVisibility: 'YES',
                        supervisor: 'Husni Hasan',
                        attentionClassification: 'ROUTINE REVIEW',
                      }
                    ];

                const latest = recs[recs.length - 1];

                return (
                  <div className="bg-emerald-50/90 border border-emerald-300 p-3 rounded-xl text-xs space-y-2 text-emerald-950 shadow-2xs my-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-200/80 pb-2">
                      <div className="flex items-center space-x-1.5 font-extrabold text-emerald-900">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="uppercase tracking-wider text-[11px]">EVIDENCE ADDED</span>
                        <span className="text-[10px] font-mono bg-emerald-200/90 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                          {recs.length} Record{recs.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          id={`btn-agenda-view-evidence-${task.id}`}
                          onClick={() => setViewEvidenceTask(task)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-[11px] font-bold px-2 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="h-3 w-3 text-indigo-600" />
                          <span>VIEW EVIDENCE</span>
                        </button>

                        <button
                          id={`btn-agenda-remove-evidence-${task.id}`}
                          onClick={() => setConfirmRemoveRecord({ taskId: task.id, recordId: latest.id, title: latest.title })}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-bold px-2 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3 text-rose-600" />
                          <span>REMOVE EVIDENCE</span>
                        </button>
                      </div>
                    </div>

                    {/* Removal Confirmation Dialog */}
                    {confirmRemoveRecord && confirmRemoveRecord.taskId === task.id && (
                      <div className="bg-rose-100 border border-rose-300 p-2 rounded-lg text-rose-900 text-xs space-y-1 animate-fadeIn">
                        <div className="flex items-center space-x-1 font-bold">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          <span>Remove Evidence Record?</span>
                        </div>
                        <p className="text-[11px] text-rose-800">
                          Confirm deletion of <strong>"{confirmRemoveRecord.title}"</strong>. An audit trail event will be preserved.
                        </p>
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => {
                              if (onRemoveEvidence) {
                                onRemoveEvidence(task.id, confirmRemoveRecord.recordId);
                              }
                              setConfirmRemoveRecord(null);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-2.5 py-0.5 rounded text-[11px] cursor-pointer"
                          >
                            YES, REMOVE
                          </button>
                          <button
                            onClick={() => setConfirmRemoveRecord(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px] cursor-pointer"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Displayed Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Evidence Title</span>
                        <span className="font-extrabold text-slate-900">{latest.title}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Evidence Type</span>
                        <span className="font-mono bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded text-[10px] font-extrabold inline-block">
                          {latest.evidenceType}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Uploaded By</span>
                        <span className="font-semibold text-slate-800">{latest.uploadedBy}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Timestamp</span>
                        <span className="font-mono text-slate-700 text-[10px]">{latest.timestamp}</span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">File / Reference</span>
                        <span className="font-mono text-indigo-700 font-semibold truncate block">{latest.fileOrLink}</span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Attention Classification</span>
                        <span className="font-mono font-bold text-[10px] text-slate-800 bg-amber-100/80 px-1.5 py-0.5 rounded inline-block">
                          {latest.attentionClassification}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Task Meta Details */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <div>
                    Assigned To: <strong className="text-slate-800">{task.assignedTo}</strong> • Due: {task.dueDate}
                  </div>
                  <div className="bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Est: {task.estimatedEffortHours || 2.5}h</span>
                    {task.actualTimeHours !== undefined && <span>• Actual: {task.actualTimeHours}h</span>}
                    {task.remainingEffortHours !== undefined && <span>• Rem: {task.remainingEffortHours}h</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  {!task.startedAt && (
                    task.executionStatus === 'WAITING_FOR_PREREQUISITE' ? (
                      <span className="bg-amber-50 text-amber-800 border border-amber-300 font-bold text-[11px] px-2.5 py-1 rounded inline-flex items-center gap-1 cursor-not-allowed">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>WAITING PREREQ</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onStartTask(task.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-2.5 py-1 rounded transition cursor-pointer shadow-xs"
                      >
                        START TASK
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setSubmitResultTask(task)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 text-xs font-bold px-2.5 py-1 rounded transition cursor-pointer"
                  >
                    SUBMIT RESULT
                  </button>

                  <button
                    onClick={() => setUploadEvidenceTask(task)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded transition cursor-pointer flex items-center space-x-1"
                  >
                    <Upload className="h-3 w-3 text-slate-500" />
                    <span>EVIDENCE</span>
                  </button>

                  {((task.evidenceRecords && task.evidenceRecords.length > 0) || task.evidenceUrl) && (
                    <button
                      onClick={() => setViewEvidenceTask(task)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded transition cursor-pointer flex items-center space-x-1"
                    >
                      <Eye className="h-3 w-3 text-emerald-600" />
                      <span>VIEW EVIDENCE</span>
                    </button>
                  )}

                  <button
                    onClick={() => setBlockerTaskId(task.id)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded border border-rose-200 transition cursor-pointer"
                  >
                    BLOCKER
                  </button>

                  <button
                    onClick={() => onSubmitForQA(task.id)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-2.5 py-1 rounded transition cursor-pointer shadow-xs"
                  >
                    SUBMIT FOR QA
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Blocker Modal */}
      {blockerTaskId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-base">
              <AlertOctagon className="h-5 w-5" />
              <span>Report Operational Blocker</span>
            </div>
            <textarea
              value={blockerReason}
              onChange={(e) => setBlockerReason(e.target.value)}
              placeholder="Detail the blocker holding up progress..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-rose-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setBlockerTaskId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlockerSubmit(blockerTaskId)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                Submit Blocker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Result Modal */}
      {submitResultTask && (
        <SubmitResultModal
          task={submitResultTask}
          onClose={() => setSubmitResultTask(null)}
          onSubmitResult={(taskId, data) => {
            if (onSubmitTaskResult) {
              onSubmitTaskResult(taskId, data);
            } else {
              onCompleteTask(taskId);
            }
          }}
        />
      )}

      {/* Upload Evidence Modal */}
      {uploadEvidenceTask && (
        <UploadEvidenceModal
          task={uploadEvidenceTask}
          onClose={() => setUploadEvidenceTask(null)}
          onConfirmUpload={(taskId, data) => {
            onUploadEvidence(taskId, data);
            setUploadEvidenceTask(null);
          }}
        />
      )}

      {/* View Evidence Modal */}
      {viewEvidenceTask && (
        <ViewEvidenceModal
          task={viewEvidenceTask}
          onClose={() => setViewEvidenceTask(null)}
          onOpenUploadNew={() => {
            setUploadEvidenceTask(viewEvidenceTask);
            setViewEvidenceTask(null);
          }}
          onRemoveEvidence={onRemoveEvidence}
        />
      )}

    </div>
  );
};
