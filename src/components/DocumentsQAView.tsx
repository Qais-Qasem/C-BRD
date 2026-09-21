import React, { useState } from 'react';
import { ControlDocument, OfficialDocStatus, UserRole } from '../types';
import { 
  FileText, 
  FileCheck, 
  ShieldCheck, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RotateCcw, 
  Lock, 
  Plus, 
  FilePlus 
} from 'lucide-react';

interface DocumentsQAViewProps {
  documents: ControlDocument[];
  currentUser: UserRole;
  onApproveDocument: (docId: string) => void;
  onUpdateDocStatus: (docId: string, newStatus: OfficialDocStatus, feedback?: string) => void;
  onCreateDocument: (doc: Partial<ControlDocument>) => void;
}

export const DocumentsQAView: React.FC<DocumentsQAViewProps> = ({
  documents,
  currentUser,
  onApproveDocument,
  onUpdateDocStatus,
  onCreateDocument,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<ControlDocument | null>(null);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocDesc, setNewDocDesc] = useState('');

  const isHusni = currentUser === 'HUSNI';

  const officialStatuses: OfficialDocStatus[] = [
    'DRAFT',
    'UNDER DEVELOPMENT',
    'READY FOR QA',
    'QA REVIEWED',
    'REVISION REQUIRED',
    'PENDING SUPERVISOR APPROVAL',
    'SUPERVISOR APPROVED',
    'SUPERSEDED',
    'ARCHIVED',
  ];

  const filteredDocs = selectedStatus === 'ALL' 
    ? documents 
    : documents.filter((d) => d.currentStatus === selectedStatus);

  const handleCreateNewDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    onCreateDocument({
      documentName: newDocName,
      description: newDocDesc || 'Draft controlled document.',
      code: `CB-DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      version: 'v0.1',
      author: isHusni ? 'Husni Hasan' : 'Samar Baydoun',
      currentStatus: 'DRAFT',
      qaFindings: ['Document initialized in DRAFT status.'],
      supervisorFeedback: '',
      approvalStatus: 'NOT_SUBMITTED',
      updatedAt: new Date().toISOString()?.replace('T', ' ').substring(0, 16) + ' EST',
      moduleCode: 'CB-9120',
      fileType: 'PDF / SOP',
    });

    setNewDocName('');
    setNewDocDesc('');
    setShowNewDocModal(false);
  };

  return (
    <div id="documents-qa-view" className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-white">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-300 font-mono font-bold mb-1">
            <span className="bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
              CB-9120 QUALITY ASSURANCE & DOCUMENT CONTROL
            </span>
            <span>•</span>
            <span>Official Controlled Document Repository</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Quality Assurance & Document Control Center
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Controlled document lifecycle management. Controlled documents move strictly through official QA finding protocols. Final approval rests strictly with Husni Hasan.
          </p>
        </div>

        <button
          id="btn-create-doc"
          onClick={() => setShowNewDocModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>DRAFT NEW DOCUMENT</span>
        </button>
      </div>

      {/* Governance Rules Notice */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <strong className="text-slate-900">Strict Authority Enforcement:</strong> Samar Baydoun cannot self-approve controlled documents. AI recommendations do not grant official regulatory status. Only Husni Hasan holds final supervisor approval authority.
          </div>
        </div>
        <div className="font-mono text-[11px] font-bold text-blue-700 shrink-0 bg-blue-50 px-3 py-1 rounded border border-blue-200">
          Module: CB-9120
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-slate-800">
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-bold mb-3">
          <Filter className="h-4 w-4 text-blue-600" />
          <span>Filter by Official Document Status:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              selectedStatus === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ALL ({documents.length})
          </button>
          {officialStatuses.map((st) => {
            const count = documents.filter((d) => d.currentStatus === st).length;
            const isActive = selectedStatus === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center space-x-1 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{st}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Document List Column */}
        <div className="lg:col-span-2 space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500 shadow-xs">
              No controlled documents match the selected status filter.
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`bg-white border p-5 rounded-2xl transition cursor-pointer space-y-3 text-slate-800 ${
                    isSelected ? 'border-blue-600 shadow-sm ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">{doc.documentName}</span>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-300">
                          {doc.version}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Code: <span className="font-mono text-slate-700 font-semibold">{doc.code}</span> • Author: <strong className="text-slate-800">{doc.author}</strong>
                      </div>
                    </div>

                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border self-start sm:self-auto ${
                      doc.currentStatus === 'SUPERVISOR APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      doc.currentStatus === 'PENDING SUPERVISOR APPROVAL' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      doc.currentStatus === 'READY FOR QA' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                      doc.currentStatus === 'REVISION REQUIRED' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {doc.currentStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{doc.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Module: {doc.moduleCode}</span>
                    <span>Last Updated: {doc.updatedAt}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Document Details & QA Control Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-slate-800">
          {selectedDoc ? (
            <>
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-bold">CONTROLLED DOCUMENT DETAILED QA</span>
                  <span className="font-mono text-blue-600 font-bold">{selectedDoc.code}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedDoc.documentName}</h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Author: {selectedDoc.author} • Version: {selectedDoc.version}
                </div>
              </div>

              {/* Status Badge */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500 font-semibold">Current Official Status:</div>
                <div className="font-extrabold text-amber-800 text-sm flex items-center space-x-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>{selectedDoc.currentStatus}</span>
                </div>
              </div>

              {/* QA Findings */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <FileCheck className="h-4 w-4 text-indigo-600" />
                  <span>QA Findings & Review Log (CB-9120):</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700 max-h-48 overflow-y-auto">
                  {selectedDoc.qaFindings.length === 0 ? (
                    <span className="text-slate-400 italic">No QA findings logged yet.</span>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      {selectedDoc.qaFindings.map((finding, idx) => (
                        <li key={idx} className="text-[11px]">{finding}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Supervisor Feedback */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span>Supervisor Feedback (Husni Hasan):</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 italic font-medium">
                  {selectedDoc.supervisorFeedback || 'No supervisor feedback provided yet.'}
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-800 mb-2">Transition Document Status:</div>
                
                {/* Samar & Husni Action: Submit for QA */}
                {selectedDoc.currentStatus === 'DRAFT' || selectedDoc.currentStatus === 'UNDER DEVELOPMENT' ? (
                  <button
                    onClick={() => onUpdateDocStatus(selectedDoc.id, 'READY FOR QA')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>SUBMIT FOR QA REVIEW</span>
                  </button>
                ) : null}

                {/* QA Reviewed -> Submit for Supervisor Approval */}
                {selectedDoc.currentStatus === 'READY FOR QA' || selectedDoc.currentStatus === 'QA REVIEWED' ? (
                  <button
                    onClick={() => onUpdateDocStatus(selectedDoc.id, 'PENDING SUPERVISOR APPROVAL')}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                  >
                    <Clock className="h-4 w-4" />
                    <span>SUBMIT FOR SUPERVISOR APPROVAL</span>
                  </button>
                ) : null}

                {/* Husni Approval Button */}
                {isHusni && selectedDoc.currentStatus === 'PENDING SUPERVISOR APPROVAL' && (
                  <button
                    id={`btn-supervisor-approve-${selectedDoc.id}`}
                    onClick={() => onApproveDocument(selectedDoc.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>GRANT SUPERVISOR APPROVAL</span>
                  </button>
                )}

                {/* Non-Husni Lock warning */}
                {!isHusni && selectedDoc.currentStatus === 'PENDING SUPERVISOR APPROVAL' && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Awaiting Husni Hasan final supervisor sign-off.</span>
                  </div>
                )}

                {/* Revision Request Button */}
                {selectedDoc.currentStatus !== 'SUPERVISOR APPROVED' && (
                  <button
                    onClick={() => onUpdateDocStatus(selectedDoc.id, 'REVISION REQUIRED', 'Revision requested for technical accuracy.')}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>REQUEST REVISION</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-xs text-slate-500 space-y-2">
              <FileText className="h-8 w-8 text-slate-400 mx-auto" />
              <p>Select any controlled document on the left to inspect QA findings & supervisor approval status.</p>
            </div>
          )}
        </div>

      </div>

      {/* NEW DOCUMENT MODAL */}
      {showNewDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateNewDoc} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-base">
              <FilePlus className="h-5 w-5" />
              <span>Draft Controlled Document (CB-9120)</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Document Title:</label>
              <input
                type="text"
                required
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="e.g. FSVP Foreign Supplier Audit Checklist"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description / Scope:</label>
              <textarea
                value={newDocDesc}
                onChange={(e) => setNewDocDesc(e.target.value)}
                placeholder="Brief description of regulatory purpose..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
              />
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              New document will be initialized as <strong className="text-blue-600">DRAFT</strong>. Author set to <strong>{isHusni ? 'Husni Hasan' : 'Samar Baydoun'}</strong>.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewDocModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
              >
                Create Controlled Draft
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
