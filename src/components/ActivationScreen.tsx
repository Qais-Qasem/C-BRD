import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  User,
  Award,
  Layers
} from 'lucide-react';
import { TeamMember } from '../types';
import { authSignUp, authSignIn, isFirebaseConnected } from '../lib/firebase';

interface ActivationScreenProps {
  member: TeamMember;
  activationToken?: string;
  initialToken?: string;
  initialEmail?: string;
  onCompleteActivation: (details: {
    memberId: string;
    confirmedEmail: string;
    uid: string;
    password: string;
  }) => Promise<void> | void;
  onCancel: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({
  member,
  activationToken,
  initialToken,
  initialEmail,
  onCompleteActivation,
  onCancel
}) => {
  const effectiveToken = initialToken || activationToken || '';

  // Check token validity with server
  const isAlreadyActive = member.accountAccessStatus === 'ACTIVE';
  const [isValidatingServer, setIsValidatingServer] = useState(true);
  const [serverValidation, setServerValidation] = useState<{
    valid: boolean;
    error?: string;
    reason?: string;
    invitationId?: string;
    memberId?: string;
    memberName?: string;
    confirmedEmail?: string;
    invitationStatus?: string;
    expiresAt?: string;
    invitation?: any;
    revokedAt?: string;
    revokedBy?: string;
    revocationReason?: string;
  } | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const validateServerToken = async () => {
      if (!effectiveToken) {
        if (isMounted) {
          setServerValidation({
            valid: false,
            error: 'ACTIVATION LINK INVALID OR EXPIRED',
            reason: 'NO_TOKEN_PROVIDED'
          });
          setIsValidatingServer(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/invitations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: effectiveToken,
            memberId: member.id
          })
        });
        const contentType = res.headers.get("content-type"); if (contentType && contentType.includes("text/html")) { throw new Error("Server returned HTML. It may be restarting or unreachable."); } const data = await res.json();
        if (isMounted) {
          setServerValidation(data);
          setIsValidatingServer(false);
        }
      } catch (err) {
        if (isMounted) {
          setServerValidation({
            valid: false,
            error: 'ACTIVATION LINK INVALID OR EXPIRED',
            reason: 'SERVER_ERROR'
          });
          setIsValidatingServer(false);
        }
      }
    };

    validateServerToken();
    return () => { isMounted = false; };
  }, [effectiveToken, member.id]);

  // Source of Truth: Confirmed email strictly comes from server-side invitation record
  const confirmedEmail = serverValidation?.confirmedEmail || serverValidation?.invitation?.email || '';

  // Safety Failure Check: Data Mismatch Detection (verifies confirmed email exists and member ID matches)
  const hasDataMismatch = Boolean(
    serverValidation?.valid && (
      !confirmedEmail ||
      (serverValidation.memberId && serverValidation.memberId !== member.id)
    )
  );

  const isTokenValid = !isAlreadyActive && Boolean(serverValidation?.valid) && !hasDataMismatch;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMessage('Please enter and confirm your new account password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!serverValidation?.valid || !confirmedEmail || hasDataMismatch) {
      setErrorMessage('ACCOUNT ACTIVATION DATA MISMATCH: Cannot complete activation due to missing or mismatched server invitation email.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let uid = `uid-samar-${Date.now()}`;
      if (isFirebaseConnected()) {
        try {
          const userObj = await authSignUp(confirmedEmail, password);
          if (userObj?.uid) {
            uid = userObj.uid;
          }
        } catch (authErr: any) {
          // If user already exists in Firebase Auth, sign in
          if (authErr.code === 'auth/email-already-in-use') {
            const userObj = await authSignIn(confirmedEmail, password);
            if (userObj?.uid) {
              uid = userObj.uid;
            }
          } else {
            throw authErr;
          }
        }
      }

      setSuccessMessage('Account activated successfully! Linking profile and navigating to dashboard...');
      
      await onCompleteActivation({
        memberId: member.id,
        confirmedEmail,
        uid,
        password
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Account activation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="cbridge-activation-container" className="min-h-screen bg-slate-900 bg-opacity-95 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Branding Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg">
            CB
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">C-BRIDGE</h1>
            <p className="text-xs text-slate-400 font-medium">Existing Approved Member Account Activation</p>
          </div>
        </div>

        <span className="bg-emerald-950/90 border border-emerald-800 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Approved Member Profile Attached
        </span>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-blue-950/80 border border-blue-800 text-blue-300 text-xs px-4 py-1.5 rounded-full font-semibold mb-3">
            <UserCheck className="h-4 w-4 text-blue-400" />
            <span>Welcome, {member.name}! Activate Your C-Bridge Account</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Account Activation & Password Setup
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Set your secure password to activate access to your existing approved C-Bridge member workspace.
          </p>
        </div>

        {/* Member Profile Summary Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-6 space-y-3">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-800">
            <span>Approved C-Bridge Member Profile</span>
            <span className="text-slate-400 font-mono text-[10px]">ID: {member.id}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Member Name:</span>
              <div className="text-white font-bold text-sm">{member.name}</div>
            </div>
            <div>
              <span className="text-slate-400">Functional Role:</span>
              <div className="text-emerald-300 font-bold">{member.functionalRole}</div>
            </div>
            <div>
              <span className="text-slate-400">Supervisor:</span>
              <div className="text-slate-200 font-bold">{member.supervisor}</div>
            </div>
            <div>
              <span className="text-slate-400">Account Access Email:</span>
              <div className="text-amber-300 font-mono font-bold">{confirmedEmail || 'NOT SET'}</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-900 flex items-center justify-between">
            <span>Member Status: <strong className="text-emerald-400">{member.accountStatus}</strong></span>
            <span>Activation Link Status: <strong className={isTokenValid ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>{isTokenValid ? 'VERIFIED BY SERVER' : 'INVALID / REVOKED'}</strong></span>
          </div>
        </div>

        {/* Server Validation Spinner */}
        {isValidatingServer && !isAlreadyActive && (
          <div className="mb-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs flex items-center space-x-3 shadow-xl">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
            <span>Verifying activation token with secure C-Bridge server & Firestore...</span>
          </div>
        )}

        {/* Invalid, Revoked, or Data Mismatch Callout */}
        {!isValidatingServer && !isTokenValid && (
          <div className="mb-6 p-5 rounded-2xl bg-rose-950/90 border border-rose-800/80 text-rose-200 text-xs space-y-3 shadow-xl">
            <div className="flex items-center space-x-2 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>
                {hasDataMismatch
                  ? 'ACCOUNT ACTIVATION DATA MISMATCH'
                  : isAlreadyActive
                    ? 'Account Already Activated'
                    : serverValidation?.error || 'ACTIVATION LINK INVALID OR EXPIRED'}
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed font-mono">
              {hasDataMismatch
                ? `ACTIVATION HALTED: Server-side invitation email (${confirmedEmail || 'MISSING'}) does not match the active member profile context (${member.email || member.activationEmail || 'NONE'}). No Firebase account will be created until this mismatch is resolved.`
                : isAlreadyActive 
                  ? `Samar Baydoun's profile (${member.id}) has already been successfully activated and linked to Firebase Auth UID (${member.linkedUid}). You can sign in directly.`
                  : `ACTIVATION LINK INVALID OR EXPIRED. The activation link is invalid, expired, or has been revoked by Managing Director Husni Hasan. Tokens are strictly single-use and invalid after revocation.`
              }
            </p>
            {hasDataMismatch && (
              <div className="text-[11px] text-rose-300 bg-rose-900/40 p-2.5 rounded border border-rose-800/60 space-y-1 font-mono">
                <div><strong>Invitation ID:</strong> {serverValidation?.invitationId || 'N/A'}</div>
                <div><strong>Member ID:</strong> {serverValidation?.memberId || 'N/A'}</div>
                <div><strong>Server Confirmed Email:</strong> {confirmedEmail || 'NOT SET'}</div>
                <div><strong>Client Profile Email:</strong> {member.email || member.activationEmail || 'NOT SET'}</div>
              </div>
            )}
            {serverValidation?.revokedAt && !hasDataMismatch && (
              <div className="text-[11px] text-rose-300 bg-rose-900/40 p-2 rounded border border-rose-800/60">
                Revoked At: {serverValidation.revokedAt} • Revoked By: {serverValidation.revokedBy || 'Husni Hasan'}
                {serverValidation.revocationReason && ` • Reason: ${serverValidation.revocationReason}`}
              </div>
            )}
            <div className="pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Return to Sign In Page
              </button>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Activation Form - Only render if token is valid */}
        {isTokenValid && (
          <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">CONFIRMED ACCOUNT EMAIL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  readOnly
                  value={confirmedEmail}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono font-bold cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Email confirmed by Managing Director Husni Hasan for this invitation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">New Account Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Confirm New Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>COMPLETE ACCOUNT ACTIVATION & SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                Cancel & Return to Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
        C-Bridge Member Activation Service • Stage A Validated Logic
      </div>
    </div>
  );
};
