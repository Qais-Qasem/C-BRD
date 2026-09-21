import React, { useState } from 'react';
import { TaskItem } from '../types';
import { FileText, X } from 'lucide-react';

interface SubmitResultModalProps {
  task: TaskItem;
  onClose: () => void;
  onSubmitResult: (
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
}

export const SubmitResultModal: React.FC<SubmitResultModalProps> = ({
  task,
  onClose,
  onSubmitResult,
}) => {
  const existing = task.resultData;

  const [resultSummary, setResultSummary] = useState(existing?.resultSummary || task.resultSummary || '');
  const [workCompleted, setWorkCompleted] = useState(existing?.workCompleted || '');
  const [remainingWork, setRemainingWork] = useState(existing?.remainingWork || '');
  const [evidenceRef, setEvidenceRef] = useState(existing?.evidenceRef || task.evidenceUrl || '');
  const [blocker, setBlocker] = useState(existing?.blocker || task.blockerNotes || '');
  const [error, setError] = useState('');

  const handleSaveDraft = () => {
    onSubmitResult(task.id, {
      resultSummary,
      workCompleted,
      remainingWork,
      evidenceRef,
      blocker,
      isDraft: true,
    });
    onClose();
  };

  const handleSubmitFinal = () => {
    if (!resultSummary.trim()) {
      setError('Result Summary is required before submitting.');
      return;
    }
    setError('');
    onSubmitResult(task.id, {
      resultSummary,
      workCompleted,
      remainingWork,
      evidenceRef,
      blocker,
      isDraft: false,
    });
    onClose();
  };

  return (
    <div id="submit-result-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-800 relative">
        <button
          onClick={onClose}
          id="btn-close-result-modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-extrabold text-lg">
            <FileText className="h-5 w-5" />
            <span>SUBMIT TASK RESULT</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Record task completion summary and operational metrics for supervisor review.
          </p>
        </div>

        {/* Header Task Details */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">{task.title}</span>
            <span className="font-mono bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {task.id}
            </span>
          </div>
          <div className="text-[11px] text-slate-600">
            <strong>Started Time:</strong> {task.startedAt || 'Not recorded yet'}
          </div>
        </div>

        {error && (
          <div className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* Result Summary */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Result Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="input-result-summary"
              value={resultSummary}
              onChange={(e) => setResultSummary(e.target.value)}
              placeholder="Provide a concise summary of the result achieved..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Work Completed */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Work Completed</label>
            <textarea
              id="input-work-completed"
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              placeholder="Detail specific deliverables or tasks completed..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Remaining Work / Next Step */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Remaining Work / Next Step</label>
            <input
              id="input-remaining-work"
              type="text"
              value={remainingWork}
              onChange={(e) => setRemainingWork(e.target.value)}
              placeholder="E.g. Awaiting Husni QA review or customer signoff..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Evidence / Attachment Reference (optional) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Evidence / Attachment Reference <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="input-evidence-ref"
              type="text"
              value={evidenceRef}
              onChange={(e) => setEvidenceRef(e.target.value)}
              placeholder="URL, document ID, or folder link..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Blocker (optional) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Blocker <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="input-blocker"
              type="text"
              value={blocker}
              onChange={(e) => setBlocker(e.target.value)}
              placeholder="Any active blockers or dependencies..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            id="btn-modal-cancel-result"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            id="btn-modal-save-draft-result"
            onClick={handleSaveDraft}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            SAVE DRAFT
          </button>
          <button
            type="button"
            id="btn-modal-submit-result"
            onClick={handleSubmitFinal}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
          >
            SUBMIT RESULT
          </button>
        </div>
      </div>
    </div>
  );
};
