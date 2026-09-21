import React, { useState } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  FileText, 
  Building2, 
  Calendar,
  Lock,
  Mail,
  User,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { MemberApplication, InformationRequest, InAppNotification } from '../types';

interface ApplicantPortalViewProps {
  applicant: MemberApplication;
  notifications: InAppNotification[];
  onRespondToInfoRequest: (appId: string, requestId: string, responseText: string, docName?: string) => void;
  onRefreshStatus?: () => void;
  onNavigateMemberDashboard?: () => void;
  onLogout: () => void;
}

export const ApplicantPortalView: React.FC<ApplicantPortalViewProps> = ({
  applicant,
  notifications,
  onRespondToInfoRequest,
  onRefreshStatus,
  onNavigateMemberDashboard,
  onLogout
}) => {
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [docNames, setDocNames] = useState<Record<string, string>>({});
  const [submittedRequests, setSubmittedRequests] = useState<Record<string, boolean>>({});

  const handleSendResponse = (reqId: string) => {
    const text = responseTexts[reqId];
    if (!text) {
      alert('Please enter your response before submitting.');
      return;
    }
    const doc = docNames[reqId];
    onRespondToInfoRequest(applicant.id, reqId, text, doc || undefined);
    setSubmittedRequests((prev) => ({ ...prev, [reqId]: true }));
  };

  const applicantNotifs = notifications.filter(
    (n) => n.recipientEmail.toLowerCase() === applicant.email.toLowerCase()
  );

  return (
    <div id="cbridge-applicant-portal" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg">
            CB
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <h1 className="text-xl font-extrabold tracking-tight text-white">C-BRIDGE APPLICANT PORTAL</h1>
              {applicant.status === 'PENDING_REVIEW' && (
                <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold">
                  APPLICANT • PENDING REVIEW
                </span>
              )}
              {applicant.status === 'MORE_INFO_REQUIRED' && (
                <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold">
                  APPLICANT • PENDING ADDITIONAL INFORMATION
                </span>
              )}
              {applicant.status === 'ON_HOLD' && (
                <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold">
                  APPLICANT • ON HOLD
                </span>
              )}
              {applicant.status === 'APPROVED_PENDING_PROVISIONING' && (
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold animate-pulse">
                  APPROVED — PENDING PROVISIONING
                </span>
              )}
              {applicant.status === 'APPROVED' && (
                <span className="bg-emerald-900 text-emerald-100 border border-emerald-500 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold">
                  ACTIVE MEMBER
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Self-Service Member Application Status & Review Communication</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onRefreshStatus && (
            <button
              onClick={onRefreshStatus}
              className="bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Re-fetch current application review status from system state"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>REFRESH STATUS</span>
            </button>
          )}

          <div className="hidden sm:block text-right text-xs">
            <div className="font-bold text-white">{applicant.fullName}</div>
            <div className="text-slate-400 text-[11px]">{applicant.email}</div>
          </div>

          <button
            onClick={onLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </div>

      {/* Main Portal Body */}
      <div className="max-w-5xl mx-auto w-full my-6 flex-1 space-y-6">
        
        {/* Dynamic Status Banners */}
        {applicant.status === 'APPROVED_PENDING_PROVISIONING' && (
          <div className="bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl p-6 space-y-4 shadow-2xl text-emerald-100">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-7 h-7 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-xl font-black text-white">APPLICATION APPROVED</h3>
                <p className="text-xs font-mono text-emerald-300 font-bold uppercase tracking-wider">C-BRIDGE MEMBERSHIP SETUP IN PROGRESS</p>
              </div>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Congratulations! Your C-Bridge application ref <strong className="text-white font-mono">{applicant.id}</strong> has been executive-approved by Managing Director Husni Hasan. Our administrative supervisor team is currently finalizing your Member Provisioning Proposal, role scope, assigned projects, and initial agenda. Full member dashboard access will be unlocked upon final provisioning confirmation.
            </p>
            {applicant.provisioningProposal && (
              <div className="bg-slate-900/90 border border-emerald-800/80 p-4 rounded-xl text-xs text-slate-200 space-y-2">
                <div className="font-bold text-emerald-400 text-xs border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>MEMBER PROVISIONING PROPOSAL SUMMARY</span>
                  <span className="text-[10px] font-mono text-slate-400">PROP ID: {applicant.provisioningProposal.proposalId}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[11px] pt-1">
                  <div>Approved Title: <strong className="text-white block mt-0.5">{applicant.provisioningProposal.approvedTitle}</strong></div>
                  <div>Functional Role: <strong className="text-white block mt-0.5">{applicant.provisioningProposal.functionalRole}</strong></div>
                  <div>Supervisor: <strong className="text-white block mt-0.5">{applicant.provisioningProposal.supervisor}</strong></div>
                  <div>Weekly Allocation: <strong className="text-white block mt-0.5">{applicant.provisioningProposal.weeklyCapacity} hrs/week</strong></div>
                  <div>Assigned Project: <strong className="text-white block mt-0.5">{applicant.provisioningProposal.approvedProjects?.join(', ')}</strong></div>
                  <div>Authority: <strong className="text-white block mt-0.5">{applicant.provisioningProposal.authority}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {applicant.status === 'APPROVED' && (
          <div className="bg-emerald-950/90 border-2 border-emerald-400 rounded-2xl p-6 space-y-4 shadow-2xl text-emerald-100">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-xl font-black text-white">CONGRATULATIONS — C-BRIDGE MEMBERSHIP ACTIVE!</h3>
                <p className="text-xs font-mono text-emerald-300 font-bold uppercase tracking-wider">PROVISIONING CONFIRMED & ACCOUNT ACTIVATED</p>
              </div>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Managing Director Husni Hasan has confirmed your Member Provisioning Proposal and activated your account as <strong className="text-white">{applicant.provisioningProposal?.approvedTitle || applicant.functionalArea}</strong>.
            </p>
            {onNavigateMemberDashboard && (
              <button
                onClick={onNavigateMemberDashboard}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-lg"
              >
                <span>ENTER MEMBER DASHBOARD</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Primary Application Detail Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-[11px] text-slate-400 font-mono">APPLICATION REF: {applicant.id}</div>
              <h2 className="text-2xl font-black text-white mt-0.5">{applicant.fullName}</h2>
              <p className="text-xs text-slate-300">{applicant.functionalArea} • {applicant.timezone}</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold border ${
                applicant.status === 'PENDING_REVIEW'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : applicant.status === 'MORE_INFO_REQUIRED'
                  ? 'bg-blue-950 text-blue-300 border-blue-800'
                  : applicant.status === 'APPROVED_PENDING_PROVISIONING'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 animate-pulse'
                  : applicant.status === 'APPROVED'
                  ? 'bg-emerald-900 text-emerald-200 border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                STATUS: {applicant.status === 'APPROVED_PENDING_PROVISIONING' ? 'APPROVED — PENDING PROVISIONING' : applicant.status?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Details Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Weekly Capacity</span>
              <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                {applicant.totalWeeklyHours} hrs/week
              </div>
              <div className="text-[10px] text-slate-500">{(applicant.availableWorkingDays || []).join(', ')}</div>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Submitted On</span>
              <div className="text-xs font-bold text-slate-200 font-mono mt-1">{applicant.createdAt}</div>
              <div className="text-[10px] text-slate-500">{applicant.country}</div>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Executive Reviewer</span>
              <div className="text-xs font-bold text-slate-200 mt-1">Managing Director Husni Hasan</div>
              <div className="text-[10px] text-slate-500">C-Bridge Executive Review</div>
            </div>
          </div>

          {applicant.status !== 'APPROVED' && applicant.status !== 'APPROVED_PENDING_PROVISIONING' && (
            <div className="bg-amber-950/60 border border-amber-800/80 p-3.5 rounded-xl text-xs text-amber-200 flex items-start space-x-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-mono font-bold">[C-BRIDGE SECURITY RULES]:</strong> Your application is currently under executive review. As an applicant, confidential project documents and internal master agendas remain locked until your account is formally provisioned by Husni Hasan.
              </div>
            </div>
          )}
        </div>

        {/* Information Requests Section */}
        {applicant.infoRequests && applicant.infoRequests.length > 0 && (
          <div className="bg-slate-950 border border-blue-900/80 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-blue-300 font-bold text-sm border-b border-slate-800 pb-3">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <span>INFORMATION & CLARIFICATION REQUESTS FROM HUSNI HASAN</span>
            </div>

            {applicant.infoRequests.map((req) => (
              <div key={req.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>REQUEST ID: {req.id} • Issued: {req.requestedAt}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    req.status === 'OPEN' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <div className="text-white font-medium bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-amber-300 font-bold mr-1">[Husni Question]:</span>
                  {req.question}
                </div>

                {req.requestedEvidence && (
                  <div className="text-[11px] text-blue-300 bg-blue-950/50 p-2.5 rounded border border-blue-900">
                    <strong>Requested Evidence:</strong> {req.requestedEvidence}
                  </div>
                )}

                {req.status === 'RESPONDED' ? (
                  <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded-lg space-y-1">
                    <div className="text-emerald-300 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Responded on {req.responseAt}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{req.responseDetails}</p>
                    {req.responseDocumentName && (
                      <div className="text-[10px] text-emerald-400 font-mono">Doc: {req.responseDocumentName}</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Your Clarification Answer *</label>
                      <textarea
                        rows={3}
                        value={responseTexts[req.id] || ''}
                        onChange={(e) => setResponseTexts({ ...responseTexts, [req.id]: e.target.value })}
                        placeholder="Provide your complete clarification or regulatory credentials details..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Evidence Document Reference (Optional)</label>
                      <input
                        type="text"
                        value={docNames[req.id] || ''}
                        onChange={(e) => setDocNames({ ...docNames, [req.id]: e.target.value })}
                        placeholder="e.g. FSPCA_PCQI_Certificate.pdf"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    {submittedRequests[req.id] && (
                      <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Clarification submitted! Your application has been returned to Husni's review queue.</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleSendResponse(req.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Clarification Response to Husni</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notifications Timeline */}
        {applicantNotifs.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
            <div className="font-bold text-sm text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span>In-Platform Review Notifications</span>
            </div>

            <div className="space-y-2">
              {applicantNotifs.map((notif) => (
                <div key={notif.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="font-bold text-blue-300">{notif.title}</span>
                    <span>{notif.timestamp}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
        C-Bridge Candidate & Member Portal • Executive Review Mode
      </div>

    </div>
  );
};
