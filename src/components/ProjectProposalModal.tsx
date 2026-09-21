import React, { useState } from 'react';
import { ProjectProposal, ProjectOrigin, UserRole, ProposalStatusType } from '../types';
import { Sparkles, Plus, X, Shield, Send, CheckCircle2, Clock, AlertTriangle, UserCheck, FileText } from 'lucide-react';

interface ProjectProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserRole;
  proposals: ProjectProposal[];
  onSubmitProposal: (proposal: ProjectProposal) => void;
  onReviewProposal: (proposalId: string, status: ProposalStatusType, comments?: string) => void;
}

const ORIGIN_OPTIONS: ProjectOrigin[] = [
  'COURSE / ACADEMIC PROGRAM',
  'TRAINING PROGRAM',
  'RESEARCH',
  'REGULATION / STANDARD',
  'CAPABILITY DEVELOPMENT',
  'COMPANY DEVELOPMENT',
  'MARKET OPPORTUNITY',
  'CONFERENCE / PROFESSIONAL INPUT',
  'CLIENT-DERIVED DEVELOPMENT NEED',
  'HUSNI DIRECTION',
  'OTHER'
];

export const ProjectProposalModal: React.FC<ProjectProposalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  proposals,
  onSubmitProposal,
  onReviewProposal
}) => {
  const [activeTab, setActiveTab] = useState<'VIEW' | 'SUBMIT'>('VIEW');
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState<ProjectOrigin>('COURSE / ACADEMIC PROGRAM');
  const [targetArea, setTargetArea] = useState('U.S. Food Import & FSVP Development');
  const [originalReason, setOriginalReason] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !originalReason.trim()) return;

    const newProposal: ProjectProposal = {
      id: `PROP-${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      proposedBy: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
      proposalDate: new Date().toISOString(),
      origin,
      targetCapabilityArea: targetArea.trim(),
      originalReason: originalReason.trim(),
      uploadedSources: sourceName.trim() ? [{ name: sourceName.trim() }] : [],
      status: 'PENDING'
    };

    onSubmitProposal(newProposal);
    setTitle('');
    setOriginalReason('');
    setSourceName('');
    setActiveTab('VIEW');
  };

  const handleHusniReview = (status: ProposalStatusType) => {
    if (!selectedProposalId) return;
    onReviewProposal(selectedProposalId, status, reviewComments);
    setSelectedProposalId(null);
    setReviewComments('');
  };

  return (
    <div id="project-proposal-modal" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Project Proposals & Governance Review</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Member project proposals subject to Husni Hasan final supervisor authorization
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('VIEW')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'VIEW' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            Proposals Queue ({proposals.length})
          </button>
          <button
            onClick={() => setActiveTab('SUBMIT')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'SUBMIT' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="h-4 w-4" />
            Submit New Project Proposal
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto grow">
          {activeTab === 'VIEW' ? (
            <div className="space-y-4">
              {proposals.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50">
                  <Sparkles className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">No Project Proposals Submitted</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Active team members can submit project proposals originating from client experiences, external courses, market opportunities, or research.
                  </p>
                  <button
                    onClick={() => setActiveTab('SUBMIT')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Submit Proposal
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <div key={proposal.id} className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3 shadow-2xs hover:border-indigo-300 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                              {proposal.origin}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-500">{proposal.id}</span>
                          </div>
                          <h4 className="font-bold text-base text-slate-900 mt-1">{proposal.title}</h4>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                          proposal.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          proposal.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                          proposal.status === 'REQUEST_MORE_DEVELOPMENT' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-indigo-50 text-indigo-800 border-indigo-200 animate-pulse'
                        }`}>
                          {proposal.status?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <strong>Original Proposal Reason / Need:</strong> {proposal.originalReason}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                        <div><strong>Proposed By:</strong> {proposal.proposedBy}</div>
                        <div><strong>Target Capability:</strong> {proposal.targetCapabilityArea}</div>
                      </div>

                      {/* Husni Decision Comments if present */}
                      {proposal.husniDecision && (
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 space-y-1">
                          <div className="flex items-center gap-1.5 text-indigo-900 font-bold uppercase text-[10px]">
                            <UserCheck className="h-4 w-4 text-indigo-600" />
                            Husni Hasan Supervisor Decision ({proposal.decisionDate})
                          </div>
                          <p>{proposal.husniDecision}</p>
                        </div>
                      )}

                      {/* Supervisor Governance Actions for Husni */}
                      {currentUser === 'HUSNI' && proposal.status === 'PENDING' && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <textarea
                            rows={2}
                            value={selectedProposalId === proposal.id ? reviewComments : ''}
                            onChange={(e) => {
                              setSelectedProposalId(proposal.id);
                              setReviewComments(e.target.value);
                            }}
                            placeholder="Add supervisor feedback or mandatory scope modifications..."
                            className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <button
                              onClick={() => { setSelectedProposalId(proposal.id); handleHusniReview('APPROVED'); }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                            >
                              Approve & Convert to Project
                            </button>
                            <button
                              onClick={() => { setSelectedProposalId(proposal.id); handleHusniReview('REQUEST_MORE_DEVELOPMENT'); }}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                            >
                              Request More Development
                            </button>
                            <button
                              onClick={() => { setSelectedProposalId(proposal.id); handleHusniReview('REJECTED'); }}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                            >
                              Reject Proposal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Foreign Supplier Audit Readiness Capability Development"
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Project Origin / Genesis
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as ProjectOrigin)}
                    className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {ORIGIN_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Capability Area
                  </label>
                  <input
                    type="text"
                    value={targetArea}
                    onChange={(e) => setTargetArea(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Original Proposal Reason & Value to C-Bridge <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={originalReason}
                  onChange={(e) => setOriginalReason(e.target.value)}
                  placeholder="Describe the background, rationale, and expected C-Bridge capability deliverable resulting from this project..."
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Source Material / Syllabus Ref (Optional)
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. MSU FSVP Module 1 Document / FDA Guidance Part 2"
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('VIEW')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" /> Submit Proposal for Review
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
