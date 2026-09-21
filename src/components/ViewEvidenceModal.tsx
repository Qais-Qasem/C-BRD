import React, { useState } from 'react';
import { TaskItem, TaskEvidenceRecord } from '../types';
import { X, FileText, ExternalLink, Eye, ShieldCheck, Clock, User, Tag, AlertCircle, Trash2 } from 'lucide-react';

interface ViewEvidenceModalProps {
  task: TaskItem;
  onClose: () => void;
  onOpenUploadNew?: () => void;
  onRemoveEvidence?: (taskId: string, recordId?: string) => void;
}

export const ViewEvidenceModal: React.FC<ViewEvidenceModalProps> = ({
  task,
  onClose,
  onOpenUploadNew,
  onRemoveEvidence,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const records: TaskEvidenceRecord[] = task.evidenceRecords && task.evidenceRecords.length > 0
    ? task.evidenceRecords
    : task.evidenceUrl
    ? [
        {
          id: `EVD-LEGACY-${task.id}`,
          taskId: task.id,
          taskTitle: task.title,
          uploadedBy: 'Samar Baydoun',
          timestamp: '2026-08-09 06:00:00 EDT',
          title: task.evidenceUrl.split('] ')[1]?.split(' (')[0] || `${task.title} Evidence Record`,
          evidenceType: task.evidenceUrl.startsWith('[') ? task.evidenceUrl.split(']')[0]?.replace('[', '') : 'WORK PRODUCT',
          fileOrLink: task.evidenceUrl,
          notes: task.resultData?.workCompleted || 'Evidence uploaded for task performance.',
          supervisorVisibility: 'YES',
          supervisor: 'Husni Hasan',
          attentionClassification: 'ROUTINE REVIEW',
        },
      ]
    : [];

  const handleRemove = (recordId: string, recordTitle: string) => {
    if (confirmDeleteId === recordId) {
      if (onRemoveEvidence) {
        onRemoveEvidence(task.id, recordId);
      }
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(recordId);
    }
  };

  return (
    <div
      id="view-evidence-modal"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
    >
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4 text-slate-800 relative">
        <button
          onClick={onClose}
          id="btn-close-view-evidence-modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="shrink-0">
          <div className="flex items-center space-x-2 text-indigo-600 font-extrabold text-lg">
            <FileText className="h-5 w-5 text-indigo-600" />
            <span className="uppercase tracking-wide">TASK EVIDENCE RECORDS</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View all uploaded work products, drafts, sources, and supporting evidence for this task.
          </p>
        </div>

        {/* Task Header Summary */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div>
            <span className="font-bold text-slate-900">{task.title}</span>
            <div className="text-[11px] text-slate-500 font-mono">
              Task ID: {task.id} • Assigned: {task.assignedTo}
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-md uppercase flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            EVIDENCE ADDED ({records.length})
          </span>
        </div>

        {/* Scrollable Records List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {records.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto text-slate-300" />
              <p>No evidence records uploaded for this task yet.</p>
            </div>
          ) : (
            records.map((rec, idx) => {
              const isAlerting = ['DECISION REQUIRED', 'APPROVAL REQUIRED', 'ESCALATION REQUIRED'].includes(
                rec.attentionClassification
              );

              return (
                <div
                  key={rec.id || idx}
                  className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 hover:border-indigo-300 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-indigo-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                        {rec.evidenceType}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-900">{rec.title}</h4>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{rec.timestamp}</span>
                      
                      {onRemoveEvidence && (
                        confirmDeleteId === rec.id ? (
                          <div className="flex items-center space-x-1 ml-2 bg-rose-50 border border-rose-300 p-1 rounded text-rose-800">
                            <span className="font-sans font-bold text-[10px] text-rose-700">Confirm audit delete?</span>
                            <button
                              onClick={() => handleRemove(rec.id, rec.title)}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                            >
                              YES, REMOVE
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                            >
                              CANCEL
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRemove(rec.id, rec.title)}
                            className="ml-2 text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 cursor-pointer hover:bg-rose-50 px-1.5 py-0.5 rounded transition border border-rose-200"
                            title="Remove Evidence Record (Logs Audit Event)"
                          >
                            <Trash2 className="h-3 w-3 text-rose-600" />
                            <span>REMOVE EVIDENCE</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">File / Link Reference</span>
                      <span className="font-mono text-indigo-700 font-semibold truncate block">
                        {rec.fileOrLink}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Uploaded By</span>
                      <span className="font-medium text-slate-800 block">{rec.uploadedBy}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Supervisor Visibility</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {rec.supervisorVisibility} ({rec.supervisor})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Attention Classification</span>
                      <span
                        className={`font-mono font-bold text-[11px] ${
                          isAlerting ? 'text-amber-700 font-black' : 'text-slate-700'
                        }`}
                      >
                        {rec.attentionClassification}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Context */}
                  {rec.notes && (
                    <div className="text-xs text-slate-700 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 space-y-0.5">
                      <span className="text-[10px] text-indigo-900 font-bold uppercase block">Notes / Context</span>
                      <p className="leading-relaxed whitespace-pre-wrap">{rec.notes}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          {onOpenUploadNew && (
            <button
              onClick={() => {
                onClose();
                onOpenUploadNew();
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              + Upload Additional Evidence
            </button>
          )}

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer ml-auto"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
