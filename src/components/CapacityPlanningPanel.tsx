import React, { useState } from 'react';
import { 
  TeamMember, 
  TaskItem, 
  MasterAgendaItem, 
  ScheduleAuditEntry, 
  DelayReason 
} from '../types';
import { 
  Calendar, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  ArrowRight, 
  Zap, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  BarChart3,
  Layers
} from 'lucide-react';
import { evaluateOverdueStatus, estimateEffortHoursForAgendaItem } from '../utils/schedulingEngine';

interface CapacityPlanningPanelProps {
  teamMembers: TeamMember[];
  tasks: TaskItem[];
  masterAgendaItems: MasterAgendaItem[];
  currentUser: 'HUSNI' | 'SAMAR';
  onRescheduleTask?: (taskId: string, newPlannedDueAt: string, delayReason: DelayReason, delayNotes: string) => void;
  onRebalanceCapacity?: () => void;
  onOpenAskAI?: () => void;
}

export const CapacityPlanningPanel: React.FC<CapacityPlanningPanelProps> = ({
  teamMembers,
  tasks,
  masterAgendaItems,
  currentUser,
  onRescheduleTask,
  onRebalanceCapacity,
  onOpenAskAI
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(teamMembers[0]?.id || 'MBR-001');
  const [filterWave, setFilterWave] = useState<string>('ALL');
  const [rescheduleModalTask, setRescheduleModalTask] = useState<TaskItem | null>(null);
  const [newDueDateInput, setNewDueDateInput] = useState<string>('');
  const [selectedDelayReason, setSelectedDelayReason] = useState<DelayReason>('MEMBER_CAPACITY_LIMIT');
  const [delayNotesInput, setDelayNotesInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'CAPACITY' | 'AUDIT'>('SCHEDULE');

  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId) || teamMembers[0];
  const memberSchedule = selectedMember?.schedule || {
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    normalStartTime: '09:00 AM',
    normalEndTime: '02:00 PM',
    hoursAvailablePerDay: 5,
    hoursAvailablePerWeek: 25,
    timezone: 'EDT (UTC-4)'
  };

  // Member's assigned tasks
  const memberTasks = tasks.filter((t) => t.assignedTo === selectedMember.name);
  
  // Total assigned hours & capacity calculation
  const totalAssignedHours = memberTasks
    .filter((t) => t.status !== 'COMPLETED')
    .reduce((sum, t) => sum + (t.remainingEffortHours ?? t.estimatedEffortHours ?? 5), 0);

  const weeklyCapacity = memberSchedule.hoursAvailablePerWeek || 25;
  const dailyCapacity = memberSchedule.hoursAvailablePerDay || 5;
  const loadPercentage = Math.min(150, Math.round((totalAssignedHours / weeklyCapacity) * 100));

  // Overdue and risk analysis
  const overdueTasks = memberTasks.filter((t) => {
    const ov = evaluateOverdueStatus(t, selectedMember);
    return ov.isOverdue;
  });

  const handleOpenReschedule = (task: TaskItem) => {
    setRescheduleModalTask(task);
    setNewDueDateInput(task.plannedDueAt?.slice(0, 10) || new Date().toISOString().slice(0, 10));
    setSelectedDelayReason(task.delayReason || 'MEMBER_CAPACITY_LIMIT');
    setDelayNotesInput(task.delayNotes || '');
  };

  const handleConfirmReschedule = () => {
    if (rescheduleModalTask && onRescheduleTask) {
      const formattedTime = `${newDueDateInput} ${memberSchedule.normalEndTime || '02:00 PM'}`;
      onRescheduleTask(rescheduleModalTask.id, formattedTime, selectedDelayReason, delayNotesInput);
      setRescheduleModalTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#10243E] border border-[#28476B] rounded-2xl p-6 shadow-sm text-[#F8FAFC] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-mono mb-1 font-bold">
            <span className="bg-[#163153] px-2.5 py-0.5 rounded border border-[#28476B]">
              CB-9119 CAPACITY SCHEDULING & AUDIT TRACEABILITY
            </span>
            <span>•</span>
            <span className="text-slate-300">Progressive Execution Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
            Capacity-Based Operational Planning
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Decoupled operational daily/study schedules calculated directly from verified member working calendars, dependency chains, and planned vs. actual effort.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRebalanceCapacity && currentUser === 'HUSNI' && (
            <button
              onClick={onRebalanceCapacity}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>REBALANCE CAPACITY ENGINE</span>
            </button>
          )}
          {onOpenAskAI && (
            <button
              onClick={onOpenAskAI}
              className="bg-[#163153] hover:bg-[#20416B] text-sky-300 border border-[#28476B] font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-sky-400" />
              <span>ASK C-BRIDGE AI ADVISOR</span>
            </button>
          )}
        </div>
      </div>

      {/* Member Selector & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Member Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono">Select Assigned Member</span>
            <UserCheck className="h-4 w-4 text-indigo-600" />
          </div>

          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
          >
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Weekly Available:</span>
              <strong className="text-slate-800">{weeklyCapacity} Hours</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Daily Capacity:</span>
              <strong className="text-slate-800">{dailyCapacity} Hours/Day</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Working Days:</span>
              <span className="font-mono text-[11px] text-indigo-700 font-bold">
                {memberSchedule.workingDays?.length || 5} Days ({memberSchedule.workingDays?.map(d => d.slice(0, 3)).join(', ')})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Working Hours:</span>
              <span className="font-mono text-[11px] text-slate-700">
                {memberSchedule.normalStartTime} – {memberSchedule.normalEndTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timezone:</span>
              <span className="font-mono text-[11px] text-slate-700">{memberSchedule.timezone}</span>
            </div>
          </div>
        </div>

        {/* Workload Progress Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">Current Workload & Buffer</span>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{totalAssignedHours}h</span>
                <span className="text-xs font-bold text-slate-500">/ {weeklyCapacity}h Capacity</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full rounded-full transition-all ${
                    loadPercentage > 100 ? 'bg-rose-500' : loadPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, loadPercentage)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {loadPercentage > 100 ? (
              <span className="text-rose-700 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Over capacity! Rebalance or reschedule lower priority tasks.</span>
              </span>
            ) : (
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Balanced within member&apos;s verified working schedule.</span>
              </span>
            )}
          </div>
        </div>

        {/* Overdue Tracking Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">Overdue & Delay Engine</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-600">
                {overdueTasks.length} Task{overdueTasks.length !== 1 ? 's' : ''}
              </div>
              <span className="text-xs text-slate-500 font-medium">Requiring reschedule or blocker resolution</span>
            </div>
          </div>

          <div className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 p-2.5 rounded-xl">
            Traceable delay classification: Member, Blocker, or Approved Pause.
          </div>
        </div>

        {/* Master Agenda Wave Sync */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">Governance vs Execution</span>
              <Layers className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-indigo-900">
                {masterAgendaItems.length} Governed Items
              </div>
              <span className="text-xs text-slate-500 font-medium">Distinct from dynamic daily execution slots</span>
            </div>
          </div>

          <div className="text-[11px] bg-indigo-50 text-indigo-900 border border-indigo-200 p-2.5 rounded-xl">
            Governed Master Agenda remains unchanged during daily rescheduling.
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SCHEDULE')}
          className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'SCHEDULE'
              ? 'bg-white text-indigo-900 border-t-2 border-indigo-600 border-x border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span>EXECUTION SCHEDULE ({memberTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CAPACITY')}
          className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'CAPACITY'
              ? 'bg-white text-indigo-900 border-t-2 border-blue-600 border-x border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="h-4 w-4 text-blue-600" />
          <span>HOURLY EFFORT & PLANNED VS ACTUAL</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2.5 rounded-t-xl font-extrabold text-xs flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'AUDIT'
              ? 'bg-white text-indigo-900 border-t-2 border-purple-600 border-x border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="h-4 w-4 text-purple-600" />
          <span>SCHEDULE AUDIT TRAIL</span>
        </button>
      </div>

      {/* TAB 1: EXECUTION SCHEDULE */}
      {activeTab === 'SCHEDULE' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-700">Filter Workstream / Wave:</span>
              <select
                value={filterWave}
                onChange={(e) => setFilterWave(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-medium focus:outline-hidden"
              >
                <option value="ALL">All Active Tasks</option>
                <option value="PRJ-324">MSU FSVP Modules (PRJ-324)</option>
                <option value="OVERDUE">Overdue Tasks Only</option>
                <option value="BLOCKED">Blocked Tasks Only</option>
              </select>
            </div>

            <span className="text-slate-400 font-mono text-[11px]">
              Showing {memberTasks.length} execution tasks for {selectedMember.name}
            </span>
          </div>

          <div className="space-y-3">
            {memberTasks.map((task) => {
              const overdueEval = evaluateOverdueStatus(task, selectedMember);
              const effort = task.estimatedEffortHours || 5;

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition space-y-3 ${
                    overdueEval.isOverdue
                      ? 'border-rose-300 bg-rose-50/20'
                      : task.status === 'COMPLETED'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className="bg-slate-800 text-white font-extrabold px-2 py-0.5 rounded">
                        {task.id}
                      </span>
                      {task.masterAgendaItemId && (
                        <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold px-2 py-0.5 rounded">
                          Linked MA: {task.masterAgendaItemId}
                        </span>
                      )}
                      <span className="bg-slate-100 text-slate-700 border border-slate-300 font-bold px-2 py-0.5 rounded">
                        {task.moduleCode}
                      </span>
                      {task.scheduleVersion && task.scheduleVersion > 1 && (
                        <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded border border-amber-300">
                          v{task.scheduleVersion} Rescheduled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      {overdueEval.isOverdue && (
                        <span className="bg-rose-600 text-white font-extrabold text-[10px] font-mono px-2 py-0.5 rounded animate-pulse">
                          {overdueEval.overdueDurationText}
                        </span>
                      )}

                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : task.status === 'BLOCKED'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        STATUS: {task.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{task.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                  </div>

                  {/* Planned vs Actual Schedule Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Planned Window:</span>
                      <strong className="text-slate-800">{task.plannedStartAt || '2026-08-14 09:00 AM'}</strong>
                      <div className="text-[11px] text-slate-500">Due: {task.plannedDueAt || task.dueDate}</div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Estimated Effort:</span>
                      <strong className="text-indigo-900">{effort} Hours</strong>
                      <div className="text-[11px] text-slate-500">
                        Remaining: {task.remainingEffortHours ?? effort}h
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block text-[10px]">Actual Execution:</span>
                      <strong className="text-slate-800">
                        {task.actualStartedAt || (task.startedAt ? 'Recorded' : 'Not Started')}
                      </strong>
                      <div className="text-[11px] text-emerald-700 font-mono">
                        {task.actualWorkMinutes ? `${task.actualWorkMinutes} Mins logged` : 'Awaiting start'}
                      </div>
                    </div>
                  </div>

                  {/* Reschedule Button & Reason Display */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      {task.delayReason && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
                          Reason: <strong>{task.delayReason}</strong> {task.delayNotes && `— ${task.delayNotes}`}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenReschedule(task)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Reschedule / Shift Window</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: EFFORT & PLANNED VS ACTUAL */}
      {activeTab === 'CAPACITY' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Planned vs. Actual Execution Effort</h3>
              <p className="text-slate-600 mt-0.5">Tracking task duration variances against member calendar baseline.</p>
            </div>
            <span className="font-mono text-slate-400 text-[11px]">Formula: Variance = Actual - Planned</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-800">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="pb-2">Task</th>
                  <th className="pb-2">Planned Hours</th>
                  <th className="pb-2">Actual Minutes</th>
                  <th className="pb-2">Remaining Hours</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Delay Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-900">{t.title}</td>
                    <td className="py-2.5 font-mono text-indigo-900 font-bold">{t.estimatedEffortHours || 5}h</td>
                    <td className="py-2.5 font-mono text-slate-600">{t.actualWorkMinutes || 0}m</td>
                    <td className="py-2.5 font-mono text-amber-700 font-bold">{t.remainingEffortHours ?? t.estimatedEffortHours ?? 5}h</td>
                    <td className="py-2.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-[10px] text-slate-500">
                      {t.delayReason || 'On Schedule'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULE AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Schedule Audit & Version History</h3>
              <p className="text-slate-600 mt-0.5">Immutable change log of all dates, rebalances, and supervisor overrides.</p>
            </div>
            <span className="font-mono text-slate-400 text-[11px]">Audit Policy: Zero History Erasure</span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded">
                  AUDIT-2026-0813-001
                </span>
                <span className="text-slate-400">2026-08-13 15:00 EDT</span>
              </div>
              <div className="font-bold text-slate-900">Initial Capacity Scheduling Alignment for PRJ-324</div>
              <p className="text-slate-600 leading-relaxed">
                Separated Master Agenda governance structure from operational Daily Scheduling. Calculated working windows using Samar Baydoun&apos;s verified 5h/day EDT calendar.
              </p>
              <div className="text-[10px] text-slate-500 font-mono">
                Initiated By: CB-9119 Capacity Engine • Approved By: Husni Hasan
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleModalTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-base">
                <Clock className="h-5 w-5" />
                <span>Reschedule Daily Execution Task</span>
              </div>
              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                {rescheduleModalTask.id}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <strong className="text-slate-900 block">{rescheduleModalTask.title}</strong>
              <span className="text-slate-500">Current Due: {rescheduleModalTask.plannedDueAt || rescheduleModalTask.dueDate}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Planned Due Date:</label>
                <input
                  type="date"
                  value={newDueDateInput}
                  onChange={(e) => setNewDueDateInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Traceable Delay Reason:</label>
                <select
                  value={selectedDelayReason}
                  onChange={(e) => setSelectedDelayReason(e.target.value as DelayReason)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-hidden"
                >
                  <option value="MEMBER-CONTROLLED DELAY">Member-Controlled Delay</option>
                  <option value="APPROVED RESCHEDULE">Approved Reschedule (Controlled deferral)</option>
                  <option value="SUPERVISOR CHANGE">Supervisor Change (Husni instruction)</option>
                  <option value="EXTERNAL BLOCKER">External Blocker (Awaiting external info / supplier)</option>
                  <option value="DEPENDENCY BLOCKER">Dependency Blocker (Prerequisite task in progress)</option>
                  <option value="MATERIAL NOT AVAILABLE">Material Not Available (Missing source syllabus / materials)</option>
                  <option value="TIME OFF">Time Off / Schedule Exception</option>
                  <option value="MEMBER_CAPACITY_LIMIT">Member Capacity Limit (Max daily allocated hours reached)</option>
                  <option value="ACADEMIC_STUDY_REQUIRED">Academic Study / Research in Progress</option>
                  <option value="QA_REVISION_CYCLE">QA Revision Cycle</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Notes / Explanation:</label>
                <textarea
                  value={delayNotesInput}
                  onChange={(e) => setDelayNotesInput(e.target.value)}
                  placeholder="Explain reason for schedule adjustment to maintain historical traceability..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRescheduleModalTask(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                Confirm & Log Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
