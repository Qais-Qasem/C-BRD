import React, { useState } from 'react';
import { MemberApplication, InAppNotification } from '../types';
import { 
  UserPlus, 
  Lock, 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  FileText,
  Mail,
  Send,
  AlertCircle
} from 'lucide-react';
import { ApplicantRegistrationForm } from './ApplicantRegistrationForm';

interface PublicSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: MemberApplication[];
  notifications: InAppNotification[];
  onSubmitApplication: (newApp: MemberApplication) => void;
  onRespondToInfoRequest: (appId: string, requestId: string, responseText: string, docName?: string) => void;
  onLoginAsActiveMember?: (memberEmail: string) => void;
}

export const PublicSignUpModal: React.FC<PublicSignUpModalProps> = ({
  isOpen,
  onClose,
  applications,
  notifications,
  onSubmitApplication,
  onRespondToInfoRequest,
  onLoginAsActiveMember
}) => {
  const [activeTab, setActiveTab] = useState<'signup' | 'portal'>('signup');
  const [lookupEmail, setLookupEmail] = useState('');
  const [selectedPortalApp, setSelectedPortalApp] = useState<MemberApplication | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseDocName, setResponseDocName] = useState('');
  const [responseSuccessMsg, setResponseSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleLookupPortal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail) return;
    const found = applications.find(
      (a) => a.email.toLowerCase() === lookupEmail.toLowerCase() || a.id.toLowerCase() === lookupEmail.toLowerCase()
    );
    if (found) {
      setSelectedPortalApp(found);
    } else {
      alert(`No application found for ID or email: "${lookupEmail}".`);
    }
  };

  const handleSendResponse = (requestId: string) => {
    if (!selectedPortalApp || !responseText) {
      alert('Please enter your response before submitting.');
      return;
    }
    onRespondToInfoRequest(selectedPortalApp.id, requestId, responseText, responseDocName || undefined);
    setResponseSuccessMsg(true);
    setTimeout(() => {
      setResponseSuccessMsg(false);
      setResponseText('');
      setResponseDocName('');
      const updated = applications.find((a) => a.id === selectedPortalApp.id);
      if (updated) setSelectedPortalApp(updated);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full text-slate-100 shadow-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md">
              CB
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">C-BRIDGE MEMBER REGISTRATION & APPLICANT PORTAL</h2>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                  CANONICAL REGISTRATION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Join C-Bridge Phase 1 Regulatory Consulting & FSVP Support Team
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Rule Banner */}
        <div className="bg-amber-950/80 border-b border-amber-800/80 p-3 px-6 text-xs text-amber-200 flex items-start space-x-2 shrink-0">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 uppercase font-mono font-bold mr-1">[CORE GOVERNANCE RULE]:</strong>
            Sign-up creates an <strong>APPLICANT / PENDING MEMBER</strong> record. Applicants gain <strong>NO project, document, or confidential access</strong> until formally approved by Managing Director Husni Hasan.
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="bg-slate-950 px-6 pt-3 border-b border-slate-800 flex space-x-4 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('signup')}
            className={`pb-3 px-2 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'signup' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>1. NEW APPLICANT REGISTRATION</span>
          </button>

          <button
            onClick={() => setActiveTab('portal')}
            className={`pb-3 px-2 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'portal' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>2. APPLICANT STATUS PORTAL</span>
            {applications.length > 0 && (
              <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded-full">
                {applications.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'signup' && (
            <ApplicantRegistrationForm
              onSubmitApplication={(newApp) => {
                onSubmitApplication(newApp);
              }}
              onCancel={onClose}
              onSuccessNavigate={() => {
                onClose();
              }}
            />
          )}

          {activeTab === 'portal' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Check Application Status / Upload Requested Evidence</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your registered email address or Application ID (e.g. <code className="text-blue-300 font-mono">APP-2026-9101</code>) to view status updates or respond to Husni information requests.
                </p>

                <form onSubmit={handleLookupPortal} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    required
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="Enter email or Application ID (e.g. tareq@regulatory.org)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shrink-0"
                  >
                    SEARCH STATUS
                  </button>
                </form>
              </div>

              {selectedPortalApp && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div>
                      <span className="text-xs font-mono text-slate-400">{selectedPortalApp.id}</span>
                      <h3 className="text-lg font-bold text-white">{selectedPortalApp.fullName}</h3>
                      <p className="text-xs text-slate-400">{selectedPortalApp.functionalArea}</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border shrink-0 ${
                      selectedPortalApp.status === 'PENDING_REVIEW'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : selectedPortalApp.status === 'MORE_INFO_REQUIRED'
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : selectedPortalApp.status === 'APPROVED_PENDING_PROVISIONING'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600 animate-pulse'
                        : selectedPortalApp.status === 'APPROVED'
                        ? 'bg-emerald-900 text-emerald-200 border-emerald-500'
                        : selectedPortalApp.status === 'REJECTED'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {selectedPortalApp.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <div><span className="text-slate-400 block text-[10px]">Email:</span> <strong className="text-white">{selectedPortalApp.email}</strong></div>
                    <div><span className="text-slate-400 block text-[10px]">Timezone:</span> <strong className="text-white">{selectedPortalApp.timezone}</strong></div>
                    <div><span className="text-slate-400 block text-[10px]">Weekly Hours:</span> <strong className="text-emerald-400 font-mono font-bold">{selectedPortalApp.totalWeeklyHours} hrs</strong></div>
                    <div><span className="text-slate-400 block text-[10px]">Submitted:</span> <strong className="text-white font-mono text-[11px]">{selectedPortalApp.createdAt}</strong></div>
                  </div>

                  {/* Information Requests from Husni */}
                  {selectedPortalApp.infoRequests && selectedPortalApp.infoRequests.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span>Clarification / Evidence Requests from Husni Hasan</span>
                      </h4>

                      {selectedPortalApp.infoRequests.map((req) => (
                        <div key={req.id} className="bg-amber-950/40 border border-amber-800/80 p-4 rounded-xl text-xs space-y-3">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-amber-300 font-bold">{req.id}</span>
                            <span className="text-slate-400">{req.createdAt}</span>
                          </div>

                          <div className="text-slate-200 font-medium bg-slate-950 p-3 rounded-lg border border-slate-800">
                            "{req.question}"
                          </div>

                          {req.requestedEvidenceDocument && (
                            <div className="text-[11px] text-amber-200">
                              Requested Document: <strong className="text-white">{req.requestedEvidenceDocument}</strong>
                            </div>
                          )}

                          {req.status === 'RESPONDED' ? (
                            <div className="bg-emerald-950/80 border border-emerald-800 p-3 rounded-lg text-[11px] text-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />
                              Response Submitted: "{req.responseDetails}" ({req.responseAt})
                            </div>
                          ) : (
                            <div className="space-y-2 pt-2 border-t border-amber-800/60">
                              <label className="block text-slate-300 font-bold">Your Response / Clarification *</label>
                              <textarea
                                rows={2}
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Type your answer or explanation here..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                              />

                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={responseDocName}
                                  onChange={(e) => setResponseDocName(e.target.value)}
                                  placeholder="Document name / reference link (optional)"
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendResponse(req.id)}
                                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer"
                                >
                                  Submit Response
                                </button>
                              </div>

                              {responseSuccessMsg && (
                                <div className="text-emerald-400 font-bold text-[11px]">
                                  Response sent! Status returned to Husni Pending Review.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Member Login Link if approved */}
                  {selectedPortalApp.status === 'APPROVED' && onLoginAsActiveMember && (
                    <div className="p-4 bg-emerald-950/90 border border-emerald-700 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-emerald-200 text-xs">Account Activated as Active Member!</div>
                        <div className="text-[11px] text-emerald-300">You now have access to C-Bridge Master Agenda & QA Center.</div>
                      </div>
                      <button
                        onClick={() => onLoginAsActiveMember(selectedPortalApp.email)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer shadow-md"
                      >
                        ENTER MEMBER PORTAL
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
