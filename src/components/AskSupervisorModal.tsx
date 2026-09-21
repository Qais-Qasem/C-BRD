import React, { useState } from 'react';
import { AskSupervisorQuestion, UserRole } from '../types';
import { HelpCircle, Send, X, Shield, Sparkles, MessageSquare } from 'lucide-react';

interface AskSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserRole;
  projectId: string;
  projectName: string;
  moduleCode?: string;
  studySessionId?: string;
  clientScenario?: string;
  onSubmitQuestion: (question: AskSupervisorQuestion) => void;
}

export const AskSupervisorModal: React.FC<AskSupervisorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  projectId,
  projectName,
  moduleCode,
  studySessionId,
  clientScenario,
  onSubmitQuestion
}) => {
  const [questionText, setQuestionText] = useState('');
  const [contextNotes, setContextNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSubmitting(true);
    const newQuestion: AskSupervisorQuestion = {
      id: `ASK-${Date.now().toString().slice(-6)}`,
      member: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
      projectId,
      moduleCode,
      studySessionId,
      clientScenario,
      question: questionText.trim(),
      relevantContext: contextNotes.trim() || `Submitted from project ${projectName} (${projectId}) context.`,
      timestamp: new Date().toISOString(),
      status: 'OPEN'
    };

    onSubmitQuestion(newQuestion);
    setIsSubmitting(false);
    setSubmittedSuccess(true);

    setTimeout(() => {
      setSubmittedSuccess(false);
      setQuestionText('');
      setContextNotes('');
      onClose();
    }, 1500);
  };

  return (
    <div id="ask-supervisor-modal" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ask Supervisor (Husni Hasan)</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Direct linked governance inquiry for project: <span className="font-semibold text-indigo-200">{projectName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form or Success State */}
        {submittedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <Sparkles className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Question Submitted to Husni Hasan</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your inquiry has been linked to project <span className="font-mono font-bold text-slate-800">{projectId}</span> and logged in the supervisor governance queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900 flex items-start gap-2.5">
              <Shield className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Supervisor Governance Linkage:</strong> All questions submitted via this workspace become part of the official project governance record. Husni Hasan will review and respond directly within your active workspace.
              </div>
            </div>

            {/* Context Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Project:</span>
                <span className="font-semibold text-slate-800">{projectName} ({projectId})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Module Code:</span>
                <span className="font-semibold text-slate-800">{moduleCode || 'General Capability'}</span>
              </div>
            </div>

            {/* Question Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Specific Question for Husni <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={4}
                required
                placeholder="Ask Husni regarding regulatory interpretation, project scope, study approach, or asset approval criteria..."
                className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Context Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Relevant Context / References (Optional)
              </label>
              <input
                type="text"
                value={contextNotes}
                onChange={(e) => setContextNotes(e.target.value)}
                placeholder="e.g. Reference 21 CFR 1.506(d) or Virtual Client scenario Global Food Imports LLC"
                className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !questionText.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Submit Question to Husni
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
