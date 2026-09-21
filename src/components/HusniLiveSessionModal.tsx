import React, { useState } from 'react';
import { LiveLearningSession, SupervisorAttentionLevel } from '../types';
import { 
  X, 
  UserCheck, 
  MessageSquare, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  Send, 
  Eye, 
  ShieldAlert, 
  BrainCircuit,
  CornerDownRight,
  Sparkles,
  Target,
  Layers,
  Award,
  Check,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface HusniLiveSessionModalProps {
  session: LiveLearningSession;
  onClose: () => void;
  onAddIntervention: (
    instruction: string,
    actionType: 'COMMENT' | 'QUESTION' | 'DIRECTION' | 'CLARIFICATION' | 'MORE_STUDY' | 'FLAG' | 'INTERVENE'
  ) => void;
  onChangeAttentionLevel: (level: SupervisorAttentionLevel) => void;
}

export const HusniLiveSessionModal: React.FC<HusniLiveSessionModalProps> = ({
  session,
  onClose,
  onAddIntervention,
  onChangeAttentionLevel,
}) => {
  const [activeTab, setActiveTab] = useState<'STREAM' | 'HANDOFF'>('STREAM');
  const [instructionText, setInstructionText] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<
    'COMMENT' | 'QUESTION' | 'DIRECTION' | 'CLARIFICATION' | 'MORE_STUDY' | 'FLAG' | 'INTERVENE'
  >('DIRECTION');
  const [error, setError] = useState('');

  const handleSendIntervention = (
    actionTypeOverride?: 'COMMENT' | 'QUESTION' | 'DIRECTION' | 'CLARIFICATION' | 'MORE_STUDY' | 'FLAG' | 'INTERVENE',
    customText?: string
  ) => {
    const actionToUse = actionTypeOverride || selectedActionType;
    const textToUse = customText || instructionText;
    if (!textToUse.trim()) {
      setError('Please enter an instruction or message before submitting.');
      return;
    }
    setError('');
    onAddIntervention(textToUse.trim(), actionToUse);
    setInstructionText('');
  };

  return (
    <div id="husni-live-session-modal" className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-white">HUSNI SUPERVISOR LIVE SESSION VIEW</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  ACTIVE SYNC
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono">
                Member: <strong>{session.member}</strong> • Session: <strong>{session.sessionId}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-husni-session-modal"
            className="text-slate-400 hover:text-white transition cursor-pointer p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Sub-Header Session Status & Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 px-5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('STREAM')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'STREAM'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>LIVE LOG STREAM ({session.messages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('HANDOFF')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'HANDOFF'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-indigo-900 hover:bg-indigo-50 border border-indigo-300'
              }`}
            >
              <Target className="h-3.5 w-3.5 text-amber-400" />
              <span>LEARNING HANDOFF & RECOMMENDED ASSETS</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 text-[11px] font-bold uppercase">Supervisor Review Model:</span>
              <select
                value={session.attentionLevel}
                onChange={(e) => onChangeAttentionLevel(e.target.value as SupervisorAttentionLevel)}
                className="bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs px-2.5 py-1 rounded-lg focus:outline-hidden cursor-pointer"
              >
                <option value="ROUTINE REVIEW">ROUTINE REVIEW</option>
                <option value="COMMENT REQUESTED">COMMENT REQUESTED</option>
                <option value="DECISION REQUIRED">DECISION REQUIRED</option>
                <option value="APPROVAL REQUIRED">APPROVAL REQUIRED</option>
                <option value="ESCALATION REQUIRED">ESCALATION REQUIRED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Content Body */}
        {activeTab === 'STREAM' ? (
          /* Scrollable Chronological Message Stream */
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-100/60">
            <div className="text-center my-1">
              <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase">
                CHRONOLOGICAL SESSION LOG — {session.messages.length} EVENTS RECORDED
              </span>
            </div>

            {session.messages.map((msg) => {
              const isSamar = msg.sender === 'SAMAR';
              const isAI = msg.sender === 'C_BRIDGE_AI';
              const isSupervisor = msg.sender === 'SUPERVISOR' || msg.type === 'INTERVENTION';

              return (
                <div key={msg.id} className="space-y-1">
                  {isSupervisor ? (
                    /* SUPERVISOR INTERVENTION RECORD */
                    <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-4 text-white shadow-md space-y-2">
                      <div className="flex items-center justify-between border-b border-indigo-500/40 pb-2">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4 text-indigo-400" />
                          <span className="font-extrabold text-xs uppercase tracking-wider text-indigo-300">
                            SUPERVISOR INTERVENTION ({msg.supervisorActionType || 'DIRECTION'}) — {msg.senderName}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{msg.timestamp}</span>
                      </div>
                      <div className="text-xs text-slate-100 font-semibold leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    </div>
                  ) : isAI ? (
                    /* C-BRIDGE AI MESSAGE */
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2 max-w-2xl mr-auto">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                            C-BRIDGE AI
                          </span>
                          <span className="text-xs font-bold text-slate-800">{msg.senderName}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{msg.timestamp}</span>
                      </div>
                      <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </div>

                      {msg.type === 'QUIZ' && msg.quizOptions && (
                        <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl space-y-1 text-xs">
                          <div className="font-bold text-indigo-950">Quiz Options & Samar Selection:</div>
                          {msg.quizOptions.map((opt) => {
                            const isSelected = msg.selectedOptionIndex === opt.id;
                            return (
                              <div 
                                key={opt.id}
                                className={`p-1.5 rounded text-xs ${
                                  isSelected ? 'bg-indigo-200 text-indigo-950 font-bold border border-indigo-400' : 'text-slate-700'
                                }`}
                              >
                                {opt.text} {isSelected ? '✓ (Selected by Samar)' : ''}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SAMAR MESSAGE */
                    <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-2xs space-y-1.5 max-w-xl ml-auto">
                      <div className="flex items-center justify-between border-b border-indigo-500 pb-1 text-[11px]">
                        <span className="font-bold">Samar Baydoun</span>
                        <span className="font-mono text-indigo-200 text-[10px]">{msg.timestamp}</span>
                      </div>
                      <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Learning Handoff & Recommended Asset Tasks Tab */
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50">
            {session.handoffData ? (
              <div className="space-y-5">
                {/* Handoff Header */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2 text-indigo-600 font-extrabold text-xs uppercase">
                      <Target className="h-5 w-5" />
                      <span>C-BRIDGE LEARNING-TO-ASSET HANDOFF</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Scope Policy Approved
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900">{session.handoffData.topicLearned}</h3>
                  <p className="text-xs text-slate-600">
                    <strong>Samar Understanding:</strong> {session.handoffData.samarUnderstanding}
                  </p>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-950 text-xs leading-relaxed">
                    <strong>Protected MSU Separation Rule:</strong> {session.handoffData.scopePolicyCheck}
                  </div>
                </div>

                {/* Supervisor Handoff Quick Actions */}
                <div className="bg-indigo-950 border border-indigo-800 p-4 rounded-2xl text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-indigo-300">SUPERVISOR HANDOFF ACTIONS (Husni Hasan)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Select a direct supervisor action:</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <button
                      onClick={() => handleSendIntervention('COMMENT', 'APPROVED LEARNING HANDOFF & RECOMMENDED C-BRIDGE ASSET TASKS. Proceed with execution.')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>APPROVE HANDOFF & ASSETS</span>
                    </button>

                    <button
                      onClick={() => handleSendIntervention('MORE_STUDY', 'REQUEST MORE STUDY: Samar, please conduct deeper analysis on 21 CFR 1.506(d) SAHC verification exemptions before finalizing assets.')}
                      className="bg-purple-800 hover:bg-purple-700 text-purple-100 border border-purple-600 px-3 py-2 rounded-xl transition cursor-pointer"
                    >
                      + REQUEST MORE STUDY
                    </button>

                    <button
                      onClick={() => handleSendIntervention('DIRECTION', 'REQUEST DIFFERENT ASSET: Let us prioritize drafting the Foreign Supplier Evaluation Checklist over the LinkedIn post for now.')}
                      className="bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600 px-3 py-2 rounded-xl transition cursor-pointer"
                    >
                      + REQUEST DIFFERENT ASSET
                    </button>

                    <button
                      onClick={() => handleSendIntervention('DIRECTION', 'CHANGE PRIORITY: Escalating Checklist asset task priority from P4 to P3 due to upcoming client onboarding.')}
                      className="bg-blue-800 hover:bg-blue-700 text-blue-100 border border-blue-600 px-3 py-2 rounded-xl transition cursor-pointer"
                    >
                      + CHANGE PRIORITY TO P3
                    </button>
                  </div>
                </div>

                {/* Recommended Asset Tasks List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>RECOMMENDED ASSET TASKS ({session.handoffData.suggestedTasks.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {session.handoffData.suggestedTasks.map((ast) => (
                      <div key={ast.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 relative shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                            {ast.assetType}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{ast.suggestedPriority}</span>
                        </div>

                        <h5 className="font-bold text-slate-900 leading-snug">{ast.taskTitle}</h5>
                        <p className="text-slate-600 text-[11px] leading-tight">{ast.purpose}</p>

                        <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                          <div>Destination: <strong className="text-slate-800">{ast.destination}</strong></div>
                          <div>Deliverable: {ast.expectedDeliverable}</div>
                          <div>QA: {ast.qaRequirement}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No handoff data compiled yet. Use "LEARNING SUMMARY" or "[CREATE LEARNING HANDOFF]" in session.
              </div>
            )}
          </div>
        )}

        {/* SUPERVISOR CONTROL & INTERVENTION PANEL */}
        <div className="bg-white p-4 border-t border-slate-200 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-900 font-extrabold text-xs">
              <CornerDownRight className="h-4 w-4 text-indigo-600" />
              <span>SUPERVISOR INTERVENTION CONTROLS (Husni Hasan)</span>
            </div>
            <span className="text-[10px] text-slate-500">Inserts instruction directly into Samar's session stream</span>
          </div>

          {error && (
            <div className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded border border-rose-200">
              {error}
            </div>
          )}

          {/* Quick Action Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
            <button
              onClick={() => handleSendIntervention('COMMENT')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              + ADD COMMENT
            </button>
            <button
              onClick={() => handleSendIntervention('QUESTION')}
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              + ASK QUESTION
            </button>
            <button
              onClick={() => handleSendIntervention('DIRECTION')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition cursor-pointer font-extrabold shadow-xs"
            >
              + GIVE DIRECTION
            </button>
            <button
              onClick={() => handleSendIntervention('CLARIFICATION')}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              + REQUEST CLARIFICATION
            </button>
            <button
              onClick={() => handleSendIntervention('MORE_STUDY')}
              className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              + REQUEST MORE STUDY
            </button>
            <button
              onClick={() => handleSendIntervention('FLAG')}
              className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              + FLAG ISSUE
            </button>
          </div>

          {/* Text Input & Submit */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              placeholder="Type supervisor instruction or direction for Samar..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-indigo-600"
            />
            <button
              onClick={() => handleSendIntervention()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <span>SUBMIT INTERVENTION</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
