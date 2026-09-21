// Capacity-Based Scheduling Engine for C-Bridge Platform
// Enforces: Master Agenda Approval -> Pending Member Acceptance -> Capacity Validation -> Operational Scheduling
// Uses real TeamMember working capacity, dependency chains, effort tracking, and audit logging.

import {
  MasterAgendaItem,
  MasterAgendaItemState,
  TaskItem,
  TeamMember,
  ScheduleAuditEntry,
  DelayReason,
  ScheduleRiskAlert,
  TaskStatus,
  PriorityLevel,
  MemberExecutionStatus,
  MemberAcceptanceAction,
  CapacityValidationResult
} from '../types';

/**
 * Validates member availability data completeness.
 * If required data is missing, returns missing fields instead of fabricating fake schedules.
 */
export function validateMemberAvailability(member: TeamMember): {
  isValid: boolean;
  missingFields: string[];
  statusText: string;
} {
  const missing: string[] = [];
  if (!member.timezone) missing.push('Timezone');
  if (!member.schedule?.workingDays || member.schedule.workingDays.length === 0) missing.push('Working Days');
  if (!member.schedule?.normalStartTime) missing.push('Daily Start Time');
  if (!member.schedule?.normalEndTime) missing.push('Daily End Time');
  if (!member.schedule?.hoursAvailablePerWeek || member.schedule.hoursAvailablePerWeek <= 0) missing.push('Weekly Capacity');

  if (missing.length > 0) {
    return {
      isValid: false,
      missingFields: missing,
      statusText: 'CAPACITY DATA REQUIRED'
    };
  }

  return {
    isValid: true,
    missingFields: [],
    statusText: 'CAPACITY DATA COMPLETE'
  };
}

/**
 * AI-assisted default effort estimator based on academic module / task scope
 */
export function estimateEffortHoursForAgendaItem(item: Partial<MasterAgendaItem>): number {
  if (item.estimatedEffortHours && item.estimatedEffortHours > 0) {
    return item.estimatedEffortHours;
  }

  // Determine standard estimate by module or category
  if (item.moduleNumber === 'SETUP' || item.taskTitle?.includes('Course Setup')) {
    return 4; // 4 hours for workspace setup
  }
  if (item.moduleNumber === 1 || item.taskTitle?.includes('Module 1')) {
    return 10; // 10 hours for foundation statutory scope
  }
  if (item.moduleNumber === 2 || item.taskTitle?.includes('Module 2')) {
    return 12; // 12 hours for Hazard Analysis & SAHC
  }
  if (item.moduleNumber === 3 || item.taskTitle?.includes('Module 3')) {
    return 12; // 12 hours for Verification Selection
  }
  if (item.moduleNumber === 4 || item.taskTitle?.includes('Module 4')) {
    return 14; // 14 hours for Audits & SAHC
  }
  if (item.moduleNumber === 5 || item.taskTitle?.includes('Module 5')) {
    return 10; // 10 hours for CAPA & Investigations
  }
  if (item.moduleNumber === 6 || item.taskTitle?.includes('Module 6')) {
    return 10; // 10 hours for Dietary Supplements / Modified rules
  }
  if (item.moduleNumber === 7 || item.taskTitle?.includes('Module 7')) {
    return 12; // 12 hours for Inspections & Import Alerts
  }
  if (item.moduleNumber === 'SYNTHESIS' || item.taskTitle?.includes('Synthesis')) {
    return 8; // 8 hours for Course Synthesis
  }
  if (item.moduleNumber === 'CONSOLIDATION' || item.taskTitle?.includes('Consolidation')) {
    return 6; // 6 hours for Consulting Consolidation
  }
  if (item.moduleNumber === 'ASSET_REVIEW' || item.taskTitle?.includes('Asset Opportunity')) {
    return 5; // 5 hours for Asset Triage
  }

  if (item.category === 'ASSET DEVELOPMENT TASK') return 8;
  if (item.category === 'LEARNING TASK') return 6;
  if (item.category === 'QA / REVIEW') return 3;

  return 5; // Standard 5 hours default
}

/**
 * Capacity Gate: Validates proposed item against remaining member & project capacity BEFORE scheduling.
 * PENDING WORK DOES NOT CONSUME EXECUTION CAPACITY.
 */
export function validateCapacityGate(params: {
  member: TeamMember;
  proposedItem?: Partial<MasterAgendaItem> | Partial<TaskItem>;
  existingAcceptedTasks?: TaskItem[];
  tasks?: TaskItem[];
  masterAgendaItems?: MasterAgendaItem[];
  targetProjectId?: string;
  projectId?: string;
  requestedEffort?: number;
  requestedEffortHours?: number;
  targetDate?: string;
}): CapacityValidationResult {
  const { 
    member, 
    proposedItem = {}, 
    existingAcceptedTasks = [], 
    tasks = [], 
    targetProjectId, 
    projectId, 
    requestedEffort, 
    requestedEffortHours, 
    targetDate 
  } = params;

  const allExistingTasks = tasks.length > 0 ? tasks : existingAcceptedTasks;
  const totalMemberCapacity = member.schedule?.hoursAvailablePerWeek || 25;
  const projId = (proposedItem as any).projectId || projectId || targetProjectId || 'PRJ-FSVP-01';

  // Get project allocation
  let projectAlloc = 0;
  if (member.projectAllocations) {
    const pAlloc = member.projectAllocations.find((p) => p.projectId === projId);
    if (pAlloc) projectAlloc = pAlloc.allocatedHoursPerWeek;
    else if (projId === 'PRJ-324') projectAlloc = 15;
    else if (projId === 'PRJ-FSVP-01') projectAlloc = 7;
  } else {
    projectAlloc = projId === 'PRJ-324' ? 15 : projId === 'PRJ-FSVP-01' ? 7 : 0;
  }

  const rawItem = proposedItem as any;
  const effortNeeded = requestedEffortHours || requestedEffort || rawItem.estimatedEffortHours || estimateEffortHoursForAgendaItem(rawItem) || 4;

  // Active consumed hours in this project (ONLY ACCEPTED, SCHEDULED, IN_PROGRESS consume capacity)
  const consumedInProject = allExistingTasks
    .filter(
      (t) =>
        t.assignedTo === member.name &&
        t.projectId === projId &&
        t.status !== 'COMPLETED' &&
        (t.executionStatus === 'ACCEPTED' || t.executionStatus === 'SCHEDULED' || t.executionStatus === 'IN_PROGRESS' || t.status === 'IN_PROGRESS')
    )
    .reduce((acc, t) => acc + (t.remainingEffortHours ?? t.estimatedEffortHours ?? 2), 0);

  // Total active consumed hours across all projects
  const consumedTotal = allExistingTasks
    .filter(
      (t) =>
        t.assignedTo === member.name &&
        t.status !== 'COMPLETED' &&
        (t.executionStatus === 'ACCEPTED' || t.executionStatus === 'SCHEDULED' || t.executionStatus === 'IN_PROGRESS' || t.status === 'IN_PROGRESS')
    )
    .reduce((acc, t) => acc + (t.remainingEffortHours ?? t.estimatedEffortHours ?? 2), 0);

  const availableProjectHours = Math.max(0, projectAlloc - consumedInProject);
  const availableMemberHours = Math.max(0, totalMemberCapacity - consumedTotal);

  const affectedDates = [targetDate || rawItem.targetDate || rawItem.plannedDueAt?.slice(0, 10) || '2026-08-14'];
  const affectedMilestones = [rawItem.planningWave || rawItem.moduleCode || 'Foundation Phase'];

  // Check if fits in project allocation
  if (effortNeeded > availableProjectHours) {
    const shortage = effortNeeded - availableProjectHours;
    return {
      isValid: false,
      valid: false,
      status: 'CAPACITY_CONFLICT',
      requiredHours: effortNeeded,
      requestedEffortHours: effortNeeded,
      availableProjectHours,
      availableMemberHours,
      remainingProjectHours: availableProjectHours,
      allocatedProjectHours: projectAlloc,
      consumedProjectHours: consumedInProject,
      shortage,
      shortageHours: shortage,
      rejectionReason: `Required effort (${effortNeeded}h) exceeds available weekly allocation for ${projId} (${availableProjectHours}h available of ${projectAlloc}h total).`,
      affectedDates,
      affectedMilestones,
      reasons: [
        `Required effort (${effortNeeded}h) exceeds available weekly allocation for ${projId} (${availableProjectHours}h available of ${projectAlloc}h total).`,
        `Shortage of ${shortage}h prevents immediate full operational scheduling.`
      ],
      options: [
        'REDUCE EFFORT ESTIMATE',
        'INCREASE PROJECT ALLOCATION',
        'MOVE TO NEXT WEEK',
        'DEFER ITEM',
        'REDUCE OTHER PROJECT ALLOCATION',
        'REQUEST SUPERVISOR REVIEW'
      ]
    };
  }

  // Check if fits in total member capacity
  if (effortNeeded > availableMemberHours) {
    const shortage = effortNeeded - availableMemberHours;
    return {
      isValid: false,
      valid: false,
      status: 'CAPACITY_CONFLICT',
      requiredHours: effortNeeded,
      requestedEffortHours: effortNeeded,
      availableProjectHours,
      availableMemberHours,
      remainingProjectHours: availableProjectHours,
      allocatedProjectHours: projectAlloc,
      consumedProjectHours: consumedInProject,
      shortage,
      shortageHours: shortage,
      rejectionReason: `Required effort (${effortNeeded}h) exceeds Samar's total remaining weekly capacity (${availableMemberHours}h available of ${totalMemberCapacity}h).`,
      affectedDates,
      affectedMilestones,
      reasons: [
        `Required effort (${effortNeeded}h) exceeds Samar's total remaining weekly capacity (${availableMemberHours}h available of ${totalMemberCapacity}h).`,
        `Member total capacity cap reached across all active projects.`
      ],
      options: [
        'REDUCE EFFORT ESTIMATE',
        'INCREASE PROJECT ALLOCATION',
        'MOVE TO NEXT WEEK',
        'DEFER ITEM',
        'REDUCE OTHER PROJECT ALLOCATION',
        'REQUEST SUPERVISOR REVIEW'
      ]
    };
  }

  return {
    isValid: true,
    valid: true,
    status: 'PASS',
    requiredHours: effortNeeded,
    requestedEffortHours: effortNeeded,
    availableProjectHours,
    availableMemberHours,
    remainingProjectHours: availableProjectHours,
    allocatedProjectHours: projectAlloc,
    consumedProjectHours: consumedInProject,
    shortage: 0,
    shortageHours: 0,
    affectedDates,
    affectedMilestones,
    reasons: [
      `Capacity validation passed. Fits within ${projId} allocation (${availableProjectHours}h remaining) and weekly capacity (${availableMemberHours}h remaining).`
    ],
    options: []
  };
}

/**
 * Calculates next available working window for a team member given required effort hours.
 * Uses member's actual workingDays, working hours, project-specific allocation, and prevents overallocation.
 */
export function calculateMemberWorkingWindow(
  member: TeamMember,
  startDateStr: string,
  effortHours: number,
  existingTasks: TaskItem[] = [],
  targetProjectId?: string
): { 
  plannedStartAt: string; 
  plannedDueAt: string; 
  workingDaysCount: number; 
  scheduledDate: string;
  dailyAllocatedHours: number;
} {
  const schedule = member.schedule || {
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    normalStartTime: '09:00 AM',
    normalEndTime: '02:00 PM',
    hoursAvailablePerDay: 5,
    hoursAvailablePerWeek: 25,
    timezone: 'EDT (UTC-4)',
    dailySchedules: []
  };

  const workingDaysList = schedule.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Project-specific allocation if defined
  let dailyCapacity = schedule.hoursAvailablePerDay || 5;
  if (targetProjectId && member.projectAllocations) {
    const alloc = member.projectAllocations.find((p) => p.projectId === targetProjectId);
    if (alloc && alloc.allocatedHoursPerWeek > 0) {
      const numWorkingDays = Math.max(1, workingDaysList.length);
      dailyCapacity = alloc.dailyAllocatedHours || Math.round((alloc.allocatedHoursPerWeek / numWorkingDays) * 10) / 10;
    }
  }

  // Parse start date
  let currDate = new Date(startDateStr);
  if (isNaN(currDate.getTime())) {
    currDate = new Date('2026-08-14'); // C-Bridge operational anchor
  }

  // Find first valid working day
  while (!workingDaysList.includes(dayNames[currDate.getDay()])) {
    currDate.setDate(currDate.getDate() + 1);
  }

  const plannedStartDate = currDate.toISOString().slice(0, 10);
  const plannedStartAt = `${plannedStartDate} ${schedule.normalStartTime || '09:00 AM'}`;

  let remainingHoursNeeded = Math.max(1, effortHours);
  let workingDaysCount = 0;
  let finalDueDate = new Date(currDate);

  while (remainingHoursNeeded > 0) {
    const dayName = dayNames[finalDueDate.getDay()];
    if (workingDaysList.includes(dayName)) {
      const dateStr = finalDueDate.toISOString().slice(0, 10);
      
      // Deduct already scheduled tasks on this day for the member that are active/scheduled
      const bookedHoursOnDay = existingTasks
        .filter(
          (t) =>
            t.assignedTo === member.name &&
            (t.plannedStartAt?.startsWith(dateStr) || t.scheduledDate === dateStr) &&
            (t.executionStatus === 'SCHEDULED' || t.executionStatus === 'IN_PROGRESS' || t.status === 'IN_PROGRESS')
        )
        .reduce((acc, t) => acc + (t.estimatedEffortHours || 2), 0);

      // Prevent overallocating the daily capacity (max 5h/day for Samar)
      const maxDailyLimit = schedule.hoursAvailablePerDay || 5;
      const netAvailable = Math.max(0, maxDailyLimit - bookedHoursOnDay);

      if (netAvailable > 0) {
        const hoursApplied = Math.min(netAvailable, remainingHoursNeeded);
        remainingHoursNeeded -= hoursApplied;
        workingDaysCount++;
        if (remainingHoursNeeded <= 0) break;
      }
    }
    finalDueDate.setDate(finalDueDate.getDate() + 1);
  }

  const plannedDueDateStr = finalDueDate.toISOString().slice(0, 10);
  const plannedDueAt = `${plannedDueDateStr} ${schedule.normalEndTime || '02:00 PM'}`;

  return {
    plannedStartAt,
    plannedDueAt,
    workingDaysCount,
    scheduledDate: plannedStartDate,
    dailyAllocatedHours: dailyCapacity
  };
}

/**
 * Computes overdue status and working delay duration against member's calendar.
 * RULE: Overdue begins ONLY after operational schedule exists and plannedDueAt has passed without completion.
 * An item pending member acceptance is NEVER overdue.
 */
export function evaluateOverdueStatus(
  task: TaskItem,
  member?: TeamMember,
  referenceDateStr: string = '2026-08-14'
): {
  isOverdue: boolean;
  overdueWorkingDays: number;
  overdueWorkingHours: number;
  overdueDurationText: string;
  scheduleRiskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'CRITICAL';
} {
  // If task is completed or not yet scheduled (e.g. pending acceptance), it is NOT overdue
  if (task.status === 'COMPLETED' || task.executionStatus === 'PENDING_MEMBER_ACCEPTANCE' || task.executionStatus === 'DEFERRED') {
    return {
      isOverdue: false,
      overdueWorkingDays: 0,
      overdueWorkingHours: 0,
      overdueDurationText: task.status === 'COMPLETED' ? 'Completed on time' : 'Pending Member Review',
      scheduleRiskLevel: 'NONE'
    };
  }

  // Extract planned due date
  const dueTarget = task.plannedDueAt?.slice(0, 10) || task.dueDate?.slice(0, 10) || task.scheduledDate;
  if (!dueTarget || dueTarget.includes('Today')) {
    return {
      isOverdue: false,
      overdueWorkingDays: 0,
      overdueWorkingHours: 0,
      overdueDurationText: 'Due today',
      scheduleRiskLevel: 'NONE'
    };
  }

  const dueTime = new Date(dueTarget).getTime();
  const refTime = new Date(referenceDateStr).getTime();

  if (isNaN(dueTime) || isNaN(refTime) || refTime <= dueTime) {
    return {
      isOverdue: false,
      overdueWorkingDays: 0,
      overdueWorkingHours: 0,
      overdueDurationText: 'On Schedule',
      scheduleRiskLevel: 'NONE'
    };
  }

  // Overdue detected!
  const diffDays = Math.ceil((refTime - dueTime) / (1000 * 60 * 60 * 24));
  const dailyHours = member?.schedule?.hoursAvailablePerDay || 5;
  const overdueWorkingHours = diffDays * dailyHours;

  let riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'CRITICAL' = 'LOW';
  if (diffDays >= 5 || task.priority.includes('P1') || task.priority.includes('P2')) {
    riskLevel = 'CRITICAL';
  } else if (diffDays >= 2) {
    riskLevel = 'MEDIUM';
  }

  return {
    isOverdue: true,
    overdueWorkingDays: diffDays,
    overdueWorkingHours,
    overdueDurationText: `${diffDays} Day${diffDays > 1 ? 's' : ''} Overdue (${overdueWorkingHours}h)`,
    scheduleRiskLevel: riskLevel
  };
}

/**
 * Calculates real workload buckets for Samar / Team Member
 * Ensures pending and waiting prerequisite work does NOT consume today's scheduled execution capacity.
 */
export function calculateMemberWorkloadBuckets(params: {
  member: TeamMember;
  tasks: TaskItem[];
  masterAgendaItems: MasterAgendaItem[];
  targetDateStr?: string;
}) {
  const { member, tasks, masterAgendaItems, targetDateStr = '2026-08-14' } = params;

  const totalWeeklyCapacity = member.schedule?.hoursAvailablePerWeek || 25;
  const totalDailyCapacity = member.schedule?.hoursAvailablePerDay || 5;

  const memberTasks = tasks.filter((t) => t.assignedTo === member.name);

  // 1. Pending Member Acceptance (unreviewed / unaccepted items)
  const pendingTasks = memberTasks.filter(
    (t) => t.executionStatus === 'PENDING_MEMBER_ACCEPTANCE' || (t.status === 'PENDING' && !t.scheduledDate && !t.actualStartedAt && !t.memberAcceptanceTimestamp)
  );

  const pendingMasterItems = masterAgendaItems.filter(
    (m) =>
      m.assignedMember === member.name &&
      (m.memberExecutionStatus === 'PENDING_MEMBER_ACCEPTANCE' || (!m.memberExecutionStatus && m.currentState === 'NOT_STARTED')) &&
      m.currentState !== 'COMPLETED' &&
      m.currentState !== 'IN_PROGRESS' &&
      !tasks.some((t) => t.masterAgendaItemId === m.id && (t.memberAcceptanceTimestamp || t.executionStatus === 'SCHEDULED' || t.executionStatus === 'WAITING_FOR_PREREQUISITE'))
  );

  const pendingAcceptanceHours = [...pendingTasks, ...pendingMasterItems].reduce(
    (acc, item) => acc + (item.remainingEffortHours ?? item.estimatedEffortHours ?? 2),
    0
  );

  // 2. Waiting for Prerequisite (Accepted by member, but gated by uncompleted dependency)
  const waitingPrerequisiteTasks = memberTasks.filter(
    (t) => t.executionStatus === 'WAITING_FOR_PREREQUISITE'
  );

  const waitingPrerequisiteHours = waitingPrerequisiteTasks.reduce(
    (acc, t) => acc + (t.remainingEffortHours ?? t.estimatedEffortHours ?? 0),
    0
  );

  // 3. Accepted Pending Scheduling
  const acceptedPendingSchedulingTasks = memberTasks.filter(
    (t) => t.executionStatus === 'ACCEPTED_PENDING_SCHEDULING'
  );

  const acceptedPendingSchedulingHours = acceptedPendingSchedulingTasks.reduce(
    (acc, t) => acc + (t.remainingEffortHours ?? t.estimatedEffortHours ?? 0),
    0
  );

  // 4. Scheduled Active Work (all future and current scheduled tasks)
  const scheduledTasks = memberTasks.filter(
    (t) =>
      t.executionStatus === 'SCHEDULED' ||
      (t.scheduledDate && t.status === 'PENDING' && t.executionStatus !== 'PENDING_MEMBER_ACCEPTANCE' && t.executionStatus !== 'WAITING_FOR_PREREQUISITE')
  );

  // 5. In Progress
  const inProgressTasks = memberTasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.executionStatus === 'IN_PROGRESS'
  );

  // 6. Ready for QA (in QA queue, does not consume daily execution hours)
  const readyForQaTasks = memberTasks.filter(
    (t) => t.status === 'READY_FOR_QA' || t.executionStatus === 'READY_FOR_QA'
  );

  // 7. Blocked
  const blockedTasks = memberTasks.filter(
    (t) => t.status === 'BLOCKED' || t.executionStatus === 'BLOCKED'
  );

  // 8. Completed
  const completedTasks = memberTasks.filter(
    (t) => t.status === 'COMPLETED' || t.executionStatus === 'COMPLETED'
  );

  // 9. Daily Workload Scheduled Today (ONLY tasks with valid work windows on current date, max 5h)
  const scheduledTodayTasks = memberTasks.filter(
    (t) =>
      (t.scheduledDate === targetDateStr || (t.plannedStartAt?.startsWith(targetDateStr) && t.executionStatus === 'SCHEDULED')) &&
      (t.executionStatus === 'SCHEDULED' || t.executionStatus === 'IN_PROGRESS' || t.status === 'IN_PROGRESS') &&
      t.status !== 'COMPLETED' &&
      t.status !== 'READY_FOR_QA' &&
      t.executionStatus !== 'WAITING_FOR_PREREQUISITE'
  );

  const scheduledTodayHours = scheduledTodayTasks.reduce(
    (acc, t) => acc + (t.remainingEffortHours ?? t.estimatedEffortHours ?? 2),
    0
  );

  // 10. Scheduled This Week (Monday 2026-08-10 to Friday 2026-08-14)
  const scheduledThisWeekTasks = memberTasks.filter((t) => {
    if (t.status === 'COMPLETED' || t.status === 'READY_FOR_QA' || t.executionStatus === 'WAITING_FOR_PREREQUISITE' || t.executionStatus === 'PENDING_MEMBER_ACCEPTANCE') {
      return false;
    }
    const sDate = t.scheduledDate || t.plannedStartAt?.slice(0, 10);
    return sDate && sDate >= '2026-08-10' && sDate <= '2026-08-14';
  });

  const scheduledThisWeekHours = scheduledThisWeekTasks.reduce(
    (acc, t) => acc + (t.remainingEffortHours ?? t.estimatedEffortHours ?? 2),
    0
  );

  const availableTodayHours = totalDailyCapacity;
  const remainingTodayHours = Math.max(0, totalDailyCapacity - scheduledTodayHours);

  return {
    totalWeeklyCapacity,
    totalDailyCapacity,
    authorizedCapacityToday: totalDailyCapacity,
    availableTodayHours,
    scheduledTodayHours,
    validScheduledHoursToday: scheduledTodayHours,
    totalScheduledHours: scheduledTodayHours,
    remainingTodayHours,
    remainingDailyCapacity: remainingTodayHours,
    remainingCapacityToday: remainingTodayHours,
    scheduledThisWeekHours,
    scheduledThisWeekTasks,
    waitingPrerequisiteHours,
    waitingPrerequisiteTasks,
    acceptedPendingSchedulingHours,
    acceptedPendingSchedulingTasks,
    pendingAcceptanceHours,
    pendingTasksCount: pendingTasks.length + pendingMasterItems.length,
    pendingTasks,
    pendingMasterItems,
    scheduledTasks,
    inProgressTasks,
    readyForQaTasks,
    blockedTasks,
    completedTasks,
    scheduledTodayTasks
  };
}

/**
 * Builds progressive operational schedule for Master Agenda items respecting dependencies
 * and Samar's exact working schedule.
 */
export function buildProgressiveOperationalSchedule(
  masterItems: MasterAgendaItem[],
  member: TeamMember,
  existingTasks: TaskItem[] = [],
  targetProjectId: string = 'PRJ-324',
  anchorStartDate: string = '2026-08-14'
): {
  updatedMasterAgendaItems: MasterAgendaItem[];
  newTasks: TaskItem[];
  auditEntries: ScheduleAuditEntry[];
  riskAlerts: ScheduleRiskAlert[];
} {
  const auditEntries: ScheduleAuditEntry[] = [];
  const riskAlerts: ScheduleRiskAlert[] = [];
  const newTasks: TaskItem[] = [];

  let rollingStartDate = anchorStartDate;

  // Filter master items for target project
  const projectItems = masterItems.filter((m) => m.projectId === targetProjectId);

  const updatedMasterAgendaItems: MasterAgendaItem[] = projectItems.map((item) => {
    // Check if this item already has a task
    const existingTask = existingTasks.find(
      (t) => t.masterAgendaItemId === item.id || t.id === item.dailyTaskId
    );

    const effort = item.estimatedEffortHours || estimateEffortHoursForAgendaItem(item);

    // Calculate working window
    const window = calculateMemberWorkingWindow(
      member,
      rollingStartDate,
      effort,
      [...existingTasks, ...newTasks],
      targetProjectId
    );

    const taskId = existingTask ? existingTask.id : `TSK-${item.moduleNumber === 'SETUP' ? '101' : item.moduleNumber === 1 ? '102' : item.moduleNumber === 2 ? '103' : item.moduleNumber === 3 ? '104' : `324-${item.moduleNumber}`}`;

    // Audit entry for schedule assignment
    const audit: ScheduleAuditEntry = {
      id: `AUD-SCHED-${Date.now()}-${taskId}`,
      taskId,
      masterAgendaItemId: item.id,
      action: 'INITIAL_SCHEDULE',
      newPlannedDueAt: window.plannedDueAt,
      reason: 'Progressive schedule generated via Capacity Engine',
      reasonNotes: `Allocated ${effort}h across ${window.workingDaysCount} working day(s). Starts ${window.plannedStartAt}.`,
      changedBy: 'Husni Hasan (Supervisor)',
      timestamp: '2026-08-14 09:00:00 EDT',
      scheduleVersion: 1,
      capacityImpact: `Consumes ${effort}h of ${targetProjectId} weekly allocation.`
    };
    auditEntries.push(audit);

    const plannedTask: TaskItem = {
      id: taskId,
      projectId: targetProjectId,
      projectName: item.projectName || 'MSU Food Safety Master of Science Course Development (Online & Offline)',
      masterAgendaItemId: item.id,
      title: item.taskTitle,
      description: item.objective || item.taskTitle,
      assignedTo: member.name,
      assignedBy: 'Husni Hasan',
      status: existingTask ? existingTask.status : 'PENDING',
      executionStatus: existingTask?.executionStatus || 'PENDING_MEMBER_ACCEPTANCE',
      priority: item.priority || 'P3 — TIME-SENSITIVE',
      urgency: 'Scheduled',
      governanceImpact: 'IN-SCOPE PHASE 1',
      moduleCode: item.moduleNumber === 'SETUP' ? 'SB-9100' : `MSU-M${item.moduleNumber}`,
      moduleName: item.workstream || 'Capability Training',
      dueDate: window.plannedDueAt.slice(0, 10),
      plannedStartAt: window.plannedStartAt,
      plannedDueAt: window.plannedDueAt,
      scheduledDate: window.scheduledDate,
      estimatedEffortHours: effort,
      remainingEffortHours: existingTask ? (existingTask.remainingEffortHours ?? effort) : effort,
      actualTimeHours: existingTask?.actualTimeHours || 0,
      actualStartedAt: existingTask?.actualStartedAt,
      actualCompletedAt: existingTask?.actualCompletedAt,
      scheduleVersion: existingTask?.scheduleVersion || 1,
      isDemoAgendaItem: true,
      requiresQaDoc: item.category === 'ASSET DEVELOPMENT TASK' || item.category === 'QA / REVIEW'
    };

    newTasks.push(plannedTask);

    // Advance rolling start date to next business day after this item's due date
    const dueD = new Date(window.plannedDueAt.slice(0, 10));
    dueD.setDate(dueD.getDate() + 1);
    rollingStartDate = dueD.toISOString().slice(0, 10);

    const nextState: MasterAgendaItemState = existingTask && existingTask.status === 'IN_PROGRESS' 
      ? 'IN_PROGRESS' 
      : existingTask && existingTask.status === 'COMPLETED'
      ? 'COMPLETED'
      : 'SCHEDULED_DAILY';

    return {
      ...item,
      dailyTaskId: taskId,
      currentState: nextState,
      memberExecutionStatus: 'SCHEDULED' as MemberExecutionStatus,
      targetDate: window.plannedDueAt.slice(0, 10),
      plannedStartAt: window.plannedStartAt,
      plannedDueAt: window.plannedDueAt,
      estimatedEffortHours: effort
    };
  });

  return {
    updatedMasterAgendaItems,
    newTasks,
    auditEntries,
    riskAlerts
  };
}
