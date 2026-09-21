import React, { useState, useId } from 'react';
import { 
  TeamMember, 
  Project, 
  UserRole, 
  TaskItem, 
  MasterAgendaItem, 
  ScheduleAuditEntry,
  MemberProjectAllocation
} from '../types';
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  ArrowRight, 
  Info, 
  Sliders, 
  Sparkles,
  Lock,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Layers
} from 'lucide-react';

interface ProjectAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserRole;
  member: TeamMember;
  targetProjectId?: string;
  projects: Project[];
  tasks?: TaskItem[];
  masterAgendaItems?: MasterAgendaItem[];
  onSaveAllocation: (
    updatedMember: TeamMember,
    auditEntry: ScheduleAuditEntry,
    note: string,
    requiresSupervisorReview: boolean
  ) => void;
}

export const ProjectAllocationModal: React.FC<ProjectAllocationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  member,
  targetProjectId = 'PRJ-324',
  projects,
  tasks = [],
  masterAgendaItems = [],
  onSaveAllocation
}) => {
  const selectedProjId = targetProjectId;
  const targetProject = projects.find(p => p.id === selectedProjId) || {
    id: 'PRJ-324',
    name: 'MSU FSVP Capability Development (FSC 851 / LAW 810V)'
  };

  const totalWeeklyCapacity = member.schedule?.hoursAvailablePerWeek || 25;
  const currentAllocations: MemberProjectAllocation[] = member.projectAllocations || [
    {
      projectId: 'PRJ-324',
      projectName: 'MSU FSVP Capability Development (FSC 851 / LAW 810V)',
      allocatedHoursPerWeek: 15,
      dailyAllocatedHours: 3,
      source: 'HUSNI_ASSIGNMENT',
      status: 'CONFIRMED',
      lastUpdated: '2026-08-01 09:30 EDT'
    },
    {
      projectId: 'PRJ-FSVP-01',
      projectName: 'U.S. Food Import & FSVP Client Readiness',
      allocatedHoursPerWeek: 7,
      dailyAllocatedHours: 1.4,
      source: 'HUSNI_ASSIGNMENT',
      status: 'CONFIRMED',
      lastUpdated: '2026-08-01 09:30 EDT'
    }
  ];

  const currentTargetAlloc = currentAllocations.find(a => a.projectId === selectedProjId)?.allocatedHoursPerWeek ?? 15;
  const otherProjectsAlloc = currentAllocations
    .filter(a => a.projectId !== selectedProjId)
    .reduce((sum, a) => sum + a.allocatedHoursPerWeek, 0);

  // Form State
  const [newAllocation, setNewAllocation] = useState<number>(currentTargetAlloc);
  const [reasonNote, setReasonNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Capacity calculations
  const totalAllocatedWithNew = otherProjectsAlloc + newAllocation;
  const remainingBuffer = totalWeeklyCapacity - totalAllocatedWithNew;
  const isOverCapacity = totalAllocatedWithNew > totalWeeklyCapacity;
  const capacityOverdraft = Math.max(0, totalAllocatedWithNew - totalWeeklyCapacity);
  const isBufferFullyConsumed = remainingBuffer === 0;

  // Governance evaluation
  const isHusni = currentUser === 'HUSNI';
  const isSamar = currentUser === 'SAMAR';

  // Samar change rules:
  // 1. Total capacity not exceeded
  // 2. No other project allocation reduced
  // 3. No material milestone risk (allocation >= 10h for PRJ-324)
  // 4. No governed minimum allocation breached
  const causesMaterialRisk = newAllocation < 10 && selectedProjId === 'PRJ-324';
  const isMaterialChangeForSamar = causesMaterialRisk || isOverCapacity;
  const canDirectlyApply = isHusni || (isSamar && !isMaterialChangeForSamar && !isOverCapacity);
  const requiresSupervisorReview = isSamar && isMaterialChangeForSamar && !isOverCapacity;

  // Projected daily hours across 5 working days
  const dailyHours = Math.round((newAllocation / 5) * 10) / 10;
  const previousDailyHours = Math.round((currentTargetAlloc / 5) * 10) / 10;

  const handleApplyChange = () => {
    if (isOverCapacity) return;
    setIsSubmitting(true);

    const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 19) + ' EDT';
    const timestamp = '2026-08-14 11:35:00 EDT';

    // Build updated allocations
    const updatedAllocations: MemberProjectAllocation[] = currentAllocations.map(a => {
      if (a.projectId === selectedProjId) {
        return {
          ...a,
          allocatedHoursPerWeek: newAllocation,
          dailyAllocatedHours: dailyHours,
          scheduledHoursPerWeek: newAllocation,
          lastUpdated: timestamp,
          status: 'CONFIRMED' as const
        };
      }
      return a;
    });

    // If target project was not yet in allocations, add it
    if (!updatedAllocations.some(a => a.projectId === selectedProjId)) {
      updatedAllocations.push({
        projectId: selectedProjId,
        projectName: targetProject.name || selectedProjId,
        allocatedHoursPerWeek: newAllocation,
        dailyAllocatedHours: dailyHours,
        scheduledHoursPerWeek: newAllocation,
        source: isHusni ? 'HUSNI_ASSIGNMENT' : 'TEAM_CAPACITY_UPDATE',
        status: 'CONFIRMED',
        lastUpdated: timestamp
      });
    }

    const prj324Alloc = updatedAllocations.find(a => a.projectId === 'PRJ-324')?.allocatedHoursPerWeek ?? 15;
    const prjFsvpAlloc = updatedAllocations.find(a => a.projectId === 'PRJ-FSVP-01')?.allocatedHoursPerWeek ?? 7;
    const newBufferCalculated = Math.max(0, totalWeeklyCapacity - (prj324Alloc + prjFsvpAlloc));

    const updatedMember: TeamMember = {
      ...member,
      projectAllocations: updatedAllocations,
      availabilityProvenance: {
        value: `Mon–Fri 09:00 AM – 02:00 PM (${totalWeeklyCapacity}h/week) • PRJ-324: ${prj324Alloc}h/week, PRJ-FSVP-01: ${prjFsvpAlloc}h/week, Buffer: ${newBufferCalculated}h/week`,
        source: isHusni 
          ? `HUSNI OWNER_ADMIN CAPACITY ADJUSTMENT — ${timestamp}` 
          : `SAMAR OPERATIONAL ALLOCATION UPDATE — ${timestamp}`,
        lastUpdated: timestamp,
        status: isHusni ? 'HUSNI CONFIRMED' : 'MEMBER_SUBMITTED'
      }
    };

    // Build Schedule Audit Record
    const auditEntry: ScheduleAuditEntry = {
      id: `AUD-ALLOC-${Date.now().toString().slice(-6)}`,
      action: newAllocation > currentTargetAlloc ? 'ALLOCATION_INCREASE' : 'ALLOCATION_DECREASE',
      previousAllocationHours: currentTargetAlloc,
      newAllocationHours: newAllocation,
      reason: reasonNote || (newAllocation > currentTargetAlloc 
        ? `Capacity increase for ${selectedProjId} (${currentTargetAlloc}h → ${newAllocation}h/week)`
        : `Operational capacity adjustment for ${selectedProjId} (${currentTargetAlloc}h → ${newAllocation}h/week)`),
      reasonNotes: `Total allocated: ${totalAllocatedWithNew}h/wk. Buffer remaining: ${remainingBuffer}h/wk. Daily pacing: ${dailyHours}h/day across Mon–Fri.`,
      changedBy: isHusni ? 'Husni Hasan' : 'Samar Baydoun',
      timestamp: timestamp,
      scheduleVersion: 4,
      capacityImpact: `${selectedProjId}: ${newAllocation}h/week. Remaining buffer: ${remainingBuffer}h/week. Working schedule unchanged.`
    };

    setTimeout(() => {
      onSaveAllocation(updatedMember, auditEntry, reasonNote, requiresSupervisorReview);
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">Project Allocation Control</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-900 border border-indigo-700 text-indigo-200">
                  {selectedProjId}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Canonical Capacity & Workload Allocation Management
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Member & Total Capacity Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">MEMBER</div>
              <div className="font-bold text-slate-900 text-sm">{member.name || 'Samar Baydoun'}</div>
              <div className="text-[11px] text-slate-500 font-mono">{member.id || 'MBR-001'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">TOTAL WEEKLY CAPACITY</div>
              <div className="font-extrabold text-emerald-700 text-sm">{totalWeeklyCapacity}.0 h / week</div>
              <div className="text-[11px] text-slate-500">Mon–Fri (5.0 h/day)</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">CURRENT USER AUTHORITY</div>
              <div className="font-bold text-indigo-700 text-sm">
                {isHusni ? 'Husni Hasan (OWNER_ADMIN)' : 'Samar Baydoun (MEMBER)'}
              </div>
              <div className="text-[10px] text-slate-500">
                {isHusni ? 'Direct change authority' : 'Operational adjustment scope'}
              </div>
            </div>
          </div>

          {/* Current Project Allocations Breakdown */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 flex items-center justify-between text-xs">
              <span>CURRENT ACTIVE PROJECT ALLOCATIONS</span>
              <span className="font-mono text-[10px] text-slate-500">Total Committed: {otherProjectsAlloc + currentTargetAlloc}h / 25h</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* PRJ-324 */}
              <div className={`p-3 rounded-xl border ${selectedProjId === 'PRJ-324' ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 mb-1">
                  <span>PRJ-324 (MSU FSVP)</span>
                  {selectedProjId === 'PRJ-324' && <span className="text-indigo-600 font-bold">ACTIVE</span>}
                </div>
                <div className="font-mono font-black text-indigo-900 text-sm">
                  {currentAllocations.find(a => a.projectId === 'PRJ-324')?.allocatedHoursPerWeek || 15}h / week
                </div>
                <div className="text-[10px] text-slate-500">3.0 h / day (60%)</div>
              </div>

              {/* PRJ-FSVP-01 */}
              <div className={`p-3 rounded-xl border ${selectedProjId === 'PRJ-FSVP-01' ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 mb-1">
                  <span>PRJ-FSVP-01 (Client FSVP)</span>
                  {selectedProjId === 'PRJ-FSVP-01' && <span className="text-blue-600 font-bold">ACTIVE</span>}
                </div>
                <div className="font-mono font-black text-slate-900 text-sm">
                  {currentAllocations.find(a => a.projectId === 'PRJ-FSVP-01')?.allocatedHoursPerWeek || 7}h / week
                </div>
                <div className="text-[10px] text-slate-500">1.4 h / day (28%)</div>
              </div>

              {/* BUFFER */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex justify-between items-center text-[10px] font-bold text-emerald-800 mb-1">
                  <span>BUFFER / RESERVE</span>
                  <span className="text-emerald-700 font-mono">3h / week</span>
                </div>
                <div className="font-mono font-black text-emerald-900 text-sm">
                  {Math.max(0, totalWeeklyCapacity - (otherProjectsAlloc + currentTargetAlloc))}h / week
                </div>
                <div className="text-[10px] text-emerald-700">0.6 h / day (12%)</div>
              </div>
            </div>
          </div>

          {/* Allocation Adjustment Controls */}
          <div className="p-4 rounded-xl bg-slate-50 border-2 border-indigo-100 space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>NEW {selectedProjId} ALLOCATION (HOURS / WEEK):</span>
              </label>
              <span className="font-mono font-black text-base text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-xs">
                {newAllocation}.0 h/week
              </span>
            </div>

            {/* Slider and Stepper */}
            <div className="space-y-2">
              <input 
                type="range"
                min={5}
                max={25}
                step={1}
                value={newAllocation}
                onChange={(e) => setNewAllocation(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              
              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>5h (Min)</span>
                <span>10h (Pace Min)</span>
                <span className="font-bold text-slate-700">15h (Standard Baseline)</span>
                <span className="font-bold text-indigo-700">18h (Full Buffer)</span>
                <span>25h (Max Total)</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[12, 15, 18, 20].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setNewAllocation(hours)}
                  className={`py-1 px-2.5 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
                    newAllocation === hours 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {hours}h/wk ({Math.round((hours / 5) * 10) / 10}h/day)
                </button>
              ))}
            </div>

            {/* Reason / Justification Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
              <label className="font-bold text-slate-700 text-[11px] flex items-center justify-between">
                <span>REASON / JUSTIFICATION NOTE:</span>
                {causesMaterialRisk && (
                  <span className="text-[10px] text-amber-700 font-medium">Required for supervisor review</span>
                )}
              </label>
              <textarea
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder={
                  newAllocation > currentTargetAlloc 
                    ? "e.g. Accelerating Module 1 & 2 capability development using available operational buffer."
                    : "e.g. Adjusting weekly study bandwidth while maintaining curriculum progress."
                }
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* CAPACITY IMPACT PREVIEW */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Capacity Impact Preview
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isOverCapacity 
                  ? 'bg-rose-900 text-rose-200 border border-rose-700' 
                  : isBufferFullyConsumed 
                  ? 'bg-amber-900 text-amber-200 border border-amber-700' 
                  : 'bg-emerald-900 text-emerald-200 border border-emerald-700'
              }`}>
                {isOverCapacity ? 'CAPACITY CONFLICT' : isBufferFullyConsumed ? 'BUFFER FULLY CONSUMED' : 'VALID CAPACITY'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400 text-[10px]">Previous Allocation:</div>
                <div className="font-mono font-bold text-slate-200">{currentTargetAlloc}.0 h/week</div>
                <div className="text-[10px] text-slate-400 font-mono">({previousDailyHours}h / day)</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400 text-[10px]">Requested Allocation:</div>
                <div className="font-mono font-black text-indigo-300">{newAllocation}.0 h/week</div>
                <div className="text-[10px] text-slate-400 font-mono">({dailyHours}h / day)</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400 text-[10px]">Total Allocated Hours:</div>
                <div className={`font-mono font-black ${isOverCapacity ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {totalAllocatedWithNew}.0 / {totalWeeklyCapacity}.0 h
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Across all projects</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400 text-[10px]">Remaining Buffer:</div>
                <div className={`font-mono font-black ${
                  isOverCapacity ? 'text-rose-400' : isBufferFullyConsumed ? 'text-amber-300' : 'text-emerald-300'
                }`}>
                  {remainingBuffer}.0 h/week
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {isBufferFullyConsumed ? 'Reserve: 0h' : `${Math.round((remainingBuffer / 5) * 10) / 10}h / day`}
                </div>
              </div>
            </div>

            {/* Impact Details */}
            <div className="space-y-1.5 pt-1 text-[11px] text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 font-bold shrink-0">Affected Scheduled Work:</span>
                <span>
                  Daily execution for {selectedProjId} adjusts from {previousDailyHours}h/day to {dailyHours}h/day across 5 active working days (Mon–Fri 09:00–14:00 EDT).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 font-bold shrink-0">Projected Milestone Impact:</span>
                <span>
                  {newAllocation > currentTargetAlloc 
                    ? `Curriculum completion timeline accelerated. Module 1 through 7 effort distribution absorbs ${newAllocation - currentTargetAlloc} additional weekly hours.`
                    : newAllocation < currentTargetAlloc 
                    ? `Curriculum pace reduced. Module 1 projected completion window extends by ~1-2 working days.`
                    : `Baseline schedule maintained without timeline alteration.`}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-slate-400 font-bold shrink-0">Projects Affected:</span>
                <span className="text-indigo-300 font-mono">{selectedProjId} ({targetProject.name})</span>
              </div>
            </div>

            {/* Hard Gate Conflict Warning */}
            {isOverCapacity && (
              <div className="p-3 rounded-lg bg-rose-950/90 border border-rose-700 text-rose-200 space-y-1 text-xs">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>CAPACITY CONFLICT: {capacityOverdraft} HOURS OVER WEEKLY CAPACITY</span>
                </div>
                <p className="text-[11px] text-rose-200">
                  Total project allocation ({totalAllocatedWithNew}h) exceeds Samar's confirmed 25.0h weekly capacity limit. Cannot save this change without reducing another project allocation or expanding weekly capacity.
                </p>
              </div>
            )}

            {/* Buffer Consumed Note */}
            {isBufferFullyConsumed && !isOverCapacity && (
              <div className="p-2.5 rounded-lg bg-amber-950/70 border border-amber-700 text-amber-200 text-[11px] flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>BUFFER FULLY CONSUMED:</strong> Operational reserve is 0h. Deep learning and contingency buffer is fully dedicated to project execution.
                </span>
              </div>
            )}
          </div>

          {/* Execution History Integrity Statement */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-slate-700 space-y-1">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Execution History & Timestamp Integrity Protected</span>
            </div>
            <p className="text-slate-600">
              Applying this allocation change will <strong>never rewrite historical timestamps</strong> (e.g. Course Setup actual start <code className="font-mono text-blue-800 font-bold">2026-08-14 11:13:56 EDT</code>), completed tasks, or QA records. Only future/remaining operational work is rescheduled.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            {canDirectlyApply && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isHusni ? 'Supervisor change authority confirmed' : 'Operational change within autonomous scope'}</span>
              </span>
            )}
            {requiresSupervisorReview && (
              <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Supervisor review required (Material pace reduction)</span>
              </span>
            )}
            {isOverCapacity && (
              <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Hard gate active: Overallocation prohibited</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none py-2 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="btn-save-project-allocation"
              onClick={handleApplyChange}
              disabled={isOverCapacity || isSubmitting}
              className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer ${
                isOverCapacity 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300' 
                  : requiresSupervisorReview 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isSubmitting ? (
                <span>SAVING ALLOCATION...</span>
              ) : isOverCapacity ? (
                <span>CANNOT SAVE — CAPACITY CONFLICT</span>
              ) : requiresSupervisorReview ? (
                <span>SUBMIT FOR SUPERVISOR REVIEW</span>
              ) : isHusni ? (
                <span>CONFIRM & APPLY ALLOCATION</span>
              ) : (
                <span>APPLY OPERATIONAL ALLOCATION</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
