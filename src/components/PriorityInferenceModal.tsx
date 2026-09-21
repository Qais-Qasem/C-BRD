import React, { useState } from 'react';
import { PriorityInferenceResult, TaskItem } from '../types';
import { 
  Sparkles, 
  PlusCircle, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Zap, 
  Info, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';

interface PriorityInferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTask: (newTask: Partial<TaskItem>) => void;
}

export const PriorityInferenceModal: React.FC<PriorityInferenceModalProps> = ({
  isOpen,
  onClose,
  onConfirmTask,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inferenceResult, setInferenceResult] = useState<PriorityInferenceResult | null>(null);

  if (!isOpen) return null;

  const samplePrompts = [
    'Prepare an FSVP supplier checklist.',
    'Start commercial ISO 22000 consulting.',
    'What needs to be done?',
    'Review Professor Haskell email regarding curriculum.',
  ];

  const handleRunInference = async (textToAnalyze?: string) => {
    const promptText = textToAnalyze || inputPrompt;
    if (!promptText.trim()) return;

    setIsAnalyzing(true);
    setInferenceResult(null);

    try {
      const res = await fetch('/api/infer-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: promptText }),
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
        setInferenceResult(data);
      } else {
        throw new Error('Inference call failed');
      }
    } catch (err) {
      console.error('Inference error:', err);
      // Fallback display
      setInferenceResult({
        classification: 'Operational Checklist Task',
        suggestedPriority: 'P4 — NORMAL EXECUTION',
        urgency: 'Moderate',
        governanceImpact: 'IN-SCOPE PHASE 1',
        responsiblePerson: 'Samar Baydoun',
        suggestedDestination: 'FSVP Development',
        moduleCode: 'SB-9113',
        supervisorAttention: 'Not Required',
        suggestedTool: 'FSVP Document Control',
        confidence: 94,
        reasoning: 'Routine task aligned with Phase 1 Food Import readiness.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (!inferenceResult) return;

    onConfirmTask({
      title: inputPrompt || 'New C-Bridge Task',
      description: inferenceResult.reasoning,
      assignedTo: inferenceResult.responsiblePerson.includes('Husni') ? 'Husni Hasan' : 'Samar Baydoun',
      assignedBy: 'Priority Inference Engine',
      status: inferenceResult.isScopeExpansion ? 'BLOCKED' : 'PENDING',
      priority: inferenceResult.suggestedPriority,
      urgency: inferenceResult.urgency,
      governanceImpact: inferenceResult.governanceImpact,
      moduleCode: inferenceResult.moduleCode || 'CB-9119',
      moduleName: inferenceResult.suggestedDestination,
      dueDate: 'Today',
      isDemoAgendaItem: !inferenceResult.isScopeExpansion,
    });

    setInputPrompt('');
    setInferenceResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-teal-950 border border-teal-800 text-teal-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Priority & Routing Inference Engine</h2>
              <p className="text-xs text-slate-400">Analyze natural language inputs against C-Bridge Governance & Phase 1 Scope</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Natural Language Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>Enter Task or Question:</span>
            <span className="text-[11px] text-teal-400 font-mono">Phase 1 Model Active</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunInference()}
              placeholder="e.g. Prepare an FSVP supplier checklist or Start commercial ISO 22000 consulting..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500"
            />
            <button
              onClick={() => handleRunInference()}
              disabled={isAnalyzing || !inputPrompt.trim()}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white text-xs font-bold px-4 py-3 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              {isAnalyzing ? (
                <span className="animate-pulse">Analyzing...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 mr-1">Quick Demo Tests:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputPrompt(p);
                  handleRunInference(p);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 text-[11px] px-2.5 py-1 rounded-md border border-slate-800 transition cursor-pointer"
              >
                &ldquo;{p}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Inference Output Result Box */}
        {inferenceResult && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400">INFERENCE CLASSIFICATION:</span>
                <span className="text-xs font-bold text-teal-300">{inferenceResult.classification}</span>
              </div>
              <span className="bg-teal-950 text-teal-300 text-[10px] font-mono px-2 py-0.5 rounded border border-teal-800">
                Confidence: {inferenceResult.confidence}%
              </span>
            </div>

            {/* Inference Grid Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Suggested Priority</div>
                <div className="font-extrabold text-amber-300 mt-0.5">{inferenceResult.suggestedPriority}</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Urgency</div>
                <div className="font-bold text-white mt-0.5">{inferenceResult.urgency}</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Governance Impact</div>
                <div className={`font-bold mt-0.5 ${
                  inferenceResult.governanceImpact.includes('OUTSIDE') ? 'text-rose-400 font-extrabold' : 'text-emerald-400'
                }`}>
                  {inferenceResult.governanceImpact}
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Responsible Person</div>
                <div className="font-bold text-teal-300 mt-0.5">{inferenceResult.responsiblePerson}</div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Suggested Destination</div>
                <div className="font-bold text-slate-200 mt-0.5 flex items-center space-x-1">
                  <span>{inferenceResult.suggestedDestination}</span>
                  <span className="text-[10px] font-mono text-teal-400">[{inferenceResult.moduleCode}]</span>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Supervisor Attention</div>
                <div className="font-bold text-amber-400 mt-0.5">{inferenceResult.supervisorAttention}</div>
              </div>

            </div>

            {/* Reasoning Note */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300">
              <div className="font-semibold text-slate-400 mb-0.5">C-Bridge Reasoning:</div>
              <p className="text-[11px] leading-relaxed">{inferenceResult.reasoning}</p>
            </div>

            {/* Scope Alert Banner if Scope Expansion */}
            {inferenceResult.isScopeExpansion && (
              <div className="bg-rose-950/40 border border-rose-800/80 p-3 rounded-xl text-xs text-rose-200 flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Governance Scope Guardrail Triggered:</strong> Request involves services outside Phase 1 (U.S. Food Import & FSVP). Operational execution is put on <strong>HOLD</strong> pending Husni Hasan governance decision.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Tool: {inferenceResult.suggestedTool}
              </span>

              {inferenceResult.isScopeExpansion ? (
                <button
                  onClick={handleConfirm}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>SUBMIT TO GOVERNANCE HOLD</span>
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>CONFIRM & ASSIGN</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
