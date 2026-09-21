export interface ActiveObjectiveContext {
  projectId: string;
  moduleId: string;
  caseId: string;
  sessionId: string;
  channelId?: string;
  memberId?: string;
}

export async function resolveActiveObjectiveContext(
  ctx: ActiveObjectiveContext,
  fetchCollectionDocs: (col: string) => Promise<any[]>
): Promise<string> {
  const { projectId, moduleId, memberId = "MBR-001" } = ctx;
  const stateId = `MWS_${memberId}_${projectId}_${moduleId}`;
  
  const wfDocs = await fetchCollectionDocs("module_workflow_states");
  let workflowState = wfDocs.find((w: any) => w.id === stateId || (w.projectId === projectId && w.moduleId === moduleId));
  
  if (!workflowState) {
    throw new Error("OBJECTIVE_CONTEXT_UNAVAILABLE");
  }

  const objective = workflowState.activeObjective || workflowState.moduleTitle || workflowState.stepDescription;
  
  if (!objective) {
    throw new Error("OBJECTIVE_CONTEXT_UNAVAILABLE");
  }

  return objective;
}
