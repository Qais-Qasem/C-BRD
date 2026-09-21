import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle2, LogOut, AlertTriangle } from 'lucide-react';
import { getFirebaseConfigInfo } from '../lib/firebase';

interface UnverifiedEmailScreenProps {
  userEmail: string;
  onLogout: () => void;
  onResendVerification?: () => Promise<void>;
}

export const UnverifiedEmailScreen: React.FC<UnverifiedEmailScreenProps> = ({
  userEmail,
  onLogout,
  onResendVerification
}) => {
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<{ code?: string; message: string } | null>(null);

  const firebaseInfo = getFirebaseConfigInfo();

  const handleResend = async () => {
    setIsSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (onResendVerification) {
        await onResendVerification();
      } else {
        throw {
          code: 'auth/handler-missing',
          message: 'No verification handler attached.'
        };
      }
      setSuccessMessage('Verification email sent successfully.');
    } catch (err: any) {
      const code = err?.code || 'auth/unknown-error';
      const msg = err?.message || 'Failed to dispatch verification email.';
      setErrorMessage({
        code,
        message: msg
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="cbridge-unverified-email" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-md mx-auto w-full my-auto text-center space-y-6 bg-slate-950 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8" />
        </div>

        <div>
          <span className="bg-amber-950 text-amber-300 border border-amber-800 text-xs px-3 py-1 rounded-full font-mono font-bold">
            EMAIL VERIFICATION REQUIRED
          </span>
          <h2 className="text-2xl font-black text-white mt-3">Verify Your Email</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            A verification link was dispatched to <strong className="text-slate-200">{userEmail}</strong>. Please confirm your email address to activate your portal access.
          </p>
        </div>

        {/* Runtime Firebase Configuration Info Badge */}
        {firebaseInfo && (
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[11px] font-mono text-slate-400 text-left space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Project ID:</span>
              <span className={`font-bold ${firebaseInfo.projectId === 'c-bridge-regulatory-platform' ? 'text-teal-400' : 'text-rose-400'}`}>
                {firebaseInfo.projectId || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">App ID:</span>
              <span className="text-slate-300 truncate max-w-[210px]">{firebaseInfo.appId || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-950/80 border border-emerald-800 p-3 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert with Code */}
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800 p-3.5 rounded-xl text-xs text-rose-300 text-left space-y-1.5">
            <div className="font-bold flex items-center space-x-1.5 text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Email Verification Error</span>
            </div>
            {errorMessage.code && (
              <div className="font-mono text-[11px] bg-rose-900/60 px-2 py-0.5 rounded text-rose-200 inline-block">
                {errorMessage.code}
              </div>
            )}
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {errorMessage.message}
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleResend}
            disabled={isSending}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isSending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>RESEND VERIFICATION EMAIL</span>
              </>
            )}
          </button>

          <button
            onClick={onLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        C-Bridge Operating Platform • Identity Assurance
      </div>
    </div>
  );
};
