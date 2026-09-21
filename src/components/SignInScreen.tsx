import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  UserPlus, 
  UserCheck,
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Award,
  Layers,
  FileCheck
} from 'lucide-react';
import { AccountAccessType, MemberApplication, InAppNotification } from '../types';
import { isFirebaseConnected } from '../lib/firebase';
import { ApplicantRegistrationForm } from './ApplicantRegistrationForm';

interface SignInScreenProps {
  onSubmitLogin: (email: string, pass: string) => Promise<void> | void;
  onSubmitSignUp: (details: {
    fullName: string;
    email: string;
    pass: string;
    functionalArea: string;
    bio: string;
  }) => Promise<void> | void;
  onSubmitApplication?: (newApp: MemberApplication) => void;
  onSubmitForgotPassword: (email: string) => Promise<void> | void;
  onOpenActivationPage?: () => void;
  authError?: string | null;
  applications?: MemberApplication[];
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSubmitLogin,
  onSubmitSignUp,
  onSubmitApplication,
  onSubmitForgotPassword,
  onOpenActivationPage,
  authError,
  applications = []
}) => {
  const [viewMode, setViewMode] = useState<'SIGN_IN' | 'CREATE_ACCOUNT' | 'FORGOT_PASSWORD'>('SIGN_IN');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localMessage, setLocalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sign Up Form State
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpFunctionalArea, setSignUpFunctionalArea] = useState('Food Safety & Regulatory Consulting');
  const [signUpBio, setSignUpBio] = useState('');

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');

  const firebaseActive = isFirebaseConnected();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLocalMessage({ type: 'error', text: 'Please enter both email address and password.' });
      return;
    }
    setLocalMessage(null);
    setIsSubmitting(true);
    try {
      await onSubmitLogin(loginEmail, loginPassword);
    } catch (err: any) {
      setLocalMessage({ type: 'error', text: err.message || 'Authentication failed. Please check credentials.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpFullName || !signUpEmail || !signUpPassword) {
      setLocalMessage({ type: 'error', text: 'Please fill out all required fields.' });
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setLocalMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (signUpPassword.length < 6) {
      setLocalMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLocalMessage(null);
    setIsSubmitting(true);
    try {
      await onSubmitSignUp({
        fullName: signUpFullName,
        email: signUpEmail,
        pass: signUpPassword,
        functionalArea: signUpFunctionalArea,
        bio: signUpBio
      });
      setLocalMessage({
        type: 'success',
        text: 'Applicant registration submitted successfully! Your account status is PENDING REVIEW by Managing Director Husni Hasan.'
      });
      setViewMode('SIGN_IN');
      setLoginEmail(signUpEmail);
      setLoginPassword('');
    } catch (err: any) {
      setLocalMessage({ type: 'error', text: err.message || 'Registration failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setLocalMessage({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }
    setLocalMessage(null);
    setIsSubmitting(true);
    try {
      await onSubmitForgotPassword(resetEmail);
      setLocalMessage({
        type: 'success',
        text: `Password reset instructions sent to ${resetEmail}. Check your inbox.`
      });
    } catch (err: any) {
      setLocalMessage({ type: 'error', text: err.message || 'Could not send reset link.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="cbridge-auth-container" className="min-h-screen bg-slate-900 bg-opacity-95 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      
      {/* Top Header Branding Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg">
            CB
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">C-BRIDGE</h1>
            <p className="text-xs text-slate-400 font-medium">Regulatory Consulting Operating Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {firebaseActive ? (
            <span className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Firebase Auth Active
            </span>
          ) : (
            <span className="bg-amber-950/80 border border-amber-800 text-amber-300 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Real Auth Setup Required
            </span>
          )}
        </div>
      </div>

      {/* Main Authentication Card Box */}
      <div className={`${viewMode === 'CREATE_ACCOUNT' ? 'max-w-3xl' : 'max-w-md'} mx-auto w-full my-auto py-8`}>
        
        {/* Banner Notice Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-blue-950/80 border border-blue-800 text-blue-300 text-xs px-4 py-1.5 rounded-full font-semibold mb-3">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>Secure C-Bridge Operating Portal Access</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {viewMode === 'SIGN_IN' && 'Sign In to C-Bridge'}
            {viewMode === 'CREATE_ACCOUNT' && 'New Applicant Registration'}
            {viewMode === 'FORGOT_PASSWORD' && 'Reset Account Password'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {viewMode === 'SIGN_IN' && 'Enter your authorized email credentials to access your operating dashboard.'}
            {viewMode === 'CREATE_ACCOUNT' && 'Register as a candidate for executive review by Managing Director Husni Hasan.'}
            {viewMode === 'FORGOT_PASSWORD' && 'Enter your email address to receive password reset instructions.'}
          </p>
        </div>

        {/* Global Error or Local Alert Box */}
        {(authError || localMessage) && (
          <div className={`mb-5 p-3.5 rounded-xl border text-xs font-medium ${
            (localMessage?.type === 'success')
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
              : 'bg-red-950/90 border-red-800 text-red-200'
          }`}>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{localMessage?.text || authError}</div>
            </div>
          </div>
        )}

        {/* FORM 1: SIGN IN */}
        {viewMode === 'SIGN_IN' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. husni.alashqar@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setViewMode('FORGOT_PASSWORD')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
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
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 flex flex-col space-y-2 text-center">
              <div>
                <span className="text-xs text-slate-400">New applicant? </span>
                <button
                  onClick={() => {
                    setViewMode('CREATE_ACCOUNT');
                    setLocalMessage(null);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                >
                  CREATE ACCOUNT
                </button>
              </div>

              {onOpenActivationPage && (
                <div>
                  <button
                    onClick={onOpenActivationPage}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer flex items-center justify-center space-x-1 mx-auto"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Have an Account Activation Code? Activate Member Account</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FORM 2: CREATE ACCOUNT (Canonical Applicant Registration) */}
        {viewMode === 'CREATE_ACCOUNT' && (
          <ApplicantRegistrationForm
            onSubmitApplication={(newApp) => {
              if (onSubmitApplication) {
                onSubmitApplication(newApp);
              } else if (onSubmitSignUp) {
                onSubmitSignUp({
                  fullName: newApp.fullName,
                  email: newApp.email,
                  pass: 'SecurePass123!',
                  functionalArea: newApp.functionalArea,
                  bio: newApp.qualificationsSummary || ''
                });
              }
            }}
            onCancel={() => {
              setViewMode('SIGN_IN');
              setLocalMessage(null);
            }}
            onSuccessNavigate={(newApp) => {
              setLoginEmail(newApp.email);
              setViewMode('SIGN_IN');
              setLocalMessage({
                type: 'SUCCESS',
                text: `Application ${newApp.id} submitted! Status: PENDING REVIEW by Managing Director Husni Hasan. Please log in with your email.`
              });
            }}
          />
        )}

        {/* FORM 3: FORGOT PASSWORD */}
        {viewMode === 'FORGOT_PASSWORD' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>SEND PASSWORD RESET LINK</span>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                onClick={() => {
                  setViewMode('SIGN_IN');
                  setLocalMessage(null);
                }}
                className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ← Back to SIGN IN
              </button>
            </div>
          </div>
        )}

        {/* REQUIREMENT 9: REAL AUTHENTICATION SETUP REQUIRED DIAGNOSTIC NOTICE */}
        {!firebaseActive && (
          <div className="mt-6 bg-slate-950/90 border border-amber-800/90 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-bold text-amber-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>REAL AUTHENTICATION SETUP REQUIRED</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Firebase Authentication configuration (<code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-amber-200">firebase-applet-config.json</code>) is not currently connected in this workspace environment.
            </p>
            <div className="text-slate-400 text-[11px] space-y-1 pl-2 border-l-2 border-amber-800">
              <div>1. Provision Firebase database and authentication for this applet.</div>
              <div>2. Enable Email/Password authentication in Firebase Console.</div>
              <div>3. Save <code className="font-mono text-slate-300">firebase-applet-config.json</code> in project root.</div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-4 gap-3">
        <div>
          C-Bridge Operating Platform • Stage A Validated Logic • Confidential
        </div>
      </div>

    </div>
  );
};
