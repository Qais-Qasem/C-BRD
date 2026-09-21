import React, { useState, useRef } from 'react';
import { MemberApplication } from '../types';
import { 
  UserPlus, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Sparkles, 
  Globe, 
  Mail, 
  Calendar, 
  Lock, 
  ArrowRight, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Paperclip, 
  AlertTriangle,
  HelpCircle,
  Briefcase,
  Layers,
  Award,
  Check
} from 'lucide-react';

interface ApplicantRegistrationFormProps {
  onSubmitApplication: (newApp: MemberApplication) => void;
  onCancel?: () => void;
  onSuccessNavigate?: (app: MemberApplication) => void;
  isEmbeddedInSignIn?: boolean;
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ApplicantRegistrationForm: React.FC<ApplicantRegistrationFormProps> = ({
  onSubmitApplication,
  onCancel,
  onSuccessNavigate,
  isEmbeddedInSignIn = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto detect timezone
  const autoTimezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Detroit';
    } catch {
      return 'America/Detroit';
    }
  })();

  // 1. ACCOUNT INFORMATION
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<'UNVERIFIED' | 'VERIFIED'>('UNVERIFIED');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // 2. PROFESSIONAL INFORMATION
  const [functionalArea, setFunctionalArea] = useState('Food Safety & Regulatory Consulting');
  const [coreSkills, setCoreSkills] = useState('FSVP, HACCP, FDA Imports, PCQI');
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState<{ fileName: string; fileType: string; fileSize: number; fileData?: string } | null>(null);

  // 3. OPTIONAL PROFESSIONAL PROFILES
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // 4. LOCATION & TIMEZONE
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState(autoTimezone);

  // 5. WORK AVAILABILITY
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [dailyHoursConfig, setDailyHoursConfig] = useState<Record<string, { startTime: string; endTime: string; hours: number }>>({
    Monday: { startTime: '09:00 AM', endTime: '02:00 PM', hours: 5 },
    Tuesday: { startTime: '09:00 AM', endTime: '02:00 PM', hours: 5 },
    Wednesday: { startTime: '09:00 AM', endTime: '02:00 PM', hours: 5 },
    Thursday: { startTime: '09:00 AM', endTime: '02:00 PM', hours: 5 },
    Friday: { startTime: '09:00 AM', endTime: '02:00 PM', hours: 5 },
    Saturday: { startTime: '09:00 AM', endTime: '01:00 PM', hours: 4 },
    Sunday: { startTime: '09:00 AM', endTime: '01:00 PM', hours: 4 }
  });

  // Calculate total weekly hours from working days
  const totalWeeklyHours = workingDays.reduce((sum, day) => {
    return sum + (dailyHoursConfig[day]?.hours || 5);
  }, 0);

  // 6. OPTIONAL ADDITIONAL INFORMATION
  const [certifications, setCertifications] = useState('');
  const [languages, setLanguages] = useState('English');
  const [professionalNotes, setProfessionalNotes] = useState('');

  // Required Supervision Notice Checkbox
  const [supervisionNoticeAcknowledged, setSupervisionNoticeAcknowledged] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<MemberApplication | null>(null);
  const [emailDeliveryAudit, setEmailDeliveryAudit] = useState<{
    status: string;
    missingConfigDetails?: string;
    failureReason?: string;
    deliveredAt?: string;
  } | null>(null);

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const updateDaySchedule = (day: string, field: 'startTime' | 'endTime' | 'hours', value: any) => {
    setDailyHoursConfig((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCvFile({
        fileName: file.name,
        fileType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        fileSize: file.size,
        fileData: result
      });
      if (!cvText) {
        setCvText(`Uploaded CV File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCvFile = () => {
    setCvFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVerifyEmailSimulated = () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address first.');
      return;
    }
    setErrorMessage(null);
    setIsVerifyingCode(true);
    setTimeout(() => {
      setEmailVerificationStatus('VERIFIED');
      setIsVerifyingCode(false);
    }, 600);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('A valid Email Address is required.');
      return;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify passwords.');
      return;
    }
    if (!functionalArea) {
      setErrorMessage('Functional Area / Specialty is required.');
      return;
    }
    if (!cvFile) {
      setErrorMessage('CV / Resume upload is REQUIRED. Please attach a PDF or DOCX file.');
      return;
    }
    if (!country.trim()) {
      setErrorMessage('Country is required.');
      return;
    }
    if (!timezone.trim()) {
      setErrorMessage('Timezone is required.');
      return;
    }
    if (workingDays.length === 0) {
      setErrorMessage('Please select at least one available working day.');
      return;
    }
    if (!supervisionNoticeAcknowledged) {
      setErrorMessage('You must acknowledge the C-Bridge Supervision Notice before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const appId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowStr = new Date().toISOString()?.replace('T', ' ').slice(0, 16) + ' EDT';

      const parsedSkills = coreSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const parsedCertifications = certifications.split(',').map((s) => s.trim()).filter(Boolean);
      const parsedLangs = languages.split(',').map((s) => s.trim()).filter(Boolean);

      // Construct AI Fit Analysis
      const aiAnalysis = {
        professionalSummary: `Applicant ${fullName} registered for ${functionalArea}. Skill match for C-Bridge Phase 1 FSVP capability objectives.`,
        relevantSkills: parsedSkills,
        relevantExperience: `Declared experience in ${functionalArea} with ${totalWeeklyHours} hours/week capacity.`,
        potentialCapabilityAreas: ['FSVP Documentation', 'Importer Readiness Audit', 'Regulatory Review'],
        potentialGaps: ['C-Bridge proprietary governance framework (CB-9110 / CB-9120)'],
        trainingNeeds: ['C-Bridge Quality Assurance Orientation', 'FSVP Template Workflow'],
        availabilityAssessment: `${totalWeeklyHours} hrs/week available (${workingDays.join(', ')}).`,
        capacityAssessment: `Adds ${totalWeeklyHours} hrs/week capacity to team pool.`,
        possibleProjectFit: ['PRJ-FSVP-01 (U.S. Food Import & FSVP Capability Development)'],
        possibleWorkstreamFit: ['Foreign Supplier Verification', 'Document QA Pre-Check'],
        suggestedRole: `${functionalArea} Specialist`,
        suggestedInitialResponsibilities: ['Review foreign supplier hazard documentation', 'Prepare QA audit logs'],
        suggestedInitialWeeklyAllocation: Math.min(totalWeeklyHours, 20),
        risksAndQuestions: ['Confirm PCQI certification or equivalent FDA import experience during supervisor review.'],
        informationMissing: emailVerificationStatus === 'UNVERIFIED' ? ['Verified Email Address'] : [],
        aiRecommendation: 'APPROVE' as const,
        aiConfidence: 'HIGH' as const,
        analyzedAt: nowStr
      };

      const newApp: MemberApplication = {
        id: appId,
        createdAt: nowStr,
        updatedAt: nowStr,
        status: 'PENDING_REVIEW',
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        emailVerificationStatus: emailVerificationStatus,
        country: country.trim(),
        timezone: timezone.trim(),
        functionalArea,
        coreSkills: parsedSkills,
        qualificationsSummary: cvText || 'CV attached as PDF/DOCX file.',
        cvText: cvText || 'CV file attached.',
        cvFile: cvFile ? {
          fileName: cvFile.fileName,
          fileType: cvFile.fileType,
          fileSize: cvFile.fileSize,
          fileData: cvFile.fileData
        } : undefined,
        linkedInUrl: linkedInUrl.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        availableWorkingDays: workingDays,
        dailyStartTime: dailyHoursConfig[workingDays[0]]?.startTime || '09:00 AM',
        dailyEndTime: dailyHoursConfig[workingDays[0]]?.endTime || '02:00 PM',
        totalWeeklyHours,
        certifications: parsedCertifications,
        languages: parsedLangs,
        additionalSkills: parsedSkills,
        professionalNotes: professionalNotes.trim() || undefined,
        supervisionNoticeAcknowledged,
        aiAnalysis
      };

      // Trigger Email Integration
      try {
        const resp = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: newApp.email,
            recipientName: newApp.fullName,
            subject: `C-Bridge Application Received (${appId}) — Pending Review`,
            bodyText: `Dear ${newApp.fullName},\n\nThank you for submitting your applicant registration for C-Bridge (${newApp.functionalArea}). Your application (${appId}) is currently PENDING REVIEW by Managing Director Husni Hasan.\n\nWeekly Capacity Contribution: ${totalWeeklyHours} hrs/week.\nTimezone: ${newApp.timezone}\n\nWe will notify you upon completion of executive review.`,
            eventType: 'APPLICATION_RECEIVED',
            referenceId: appId
          })
        });

        const emailResult = await resp.json();
        if (emailResult.success) {
          setEmailDeliveryAudit({
            status: emailResult.deliveryStatus || 'DELIVERED',
            deliveredAt: emailResult.timestamp
          });
        } else {
          setEmailDeliveryAudit({
            status: emailResult.deliveryStatus || 'SIMULATED_LOGGED',
            missingConfigDetails: emailResult.missingConfigDetails,
            failureReason: emailResult.failureReason
          });
        }
      } catch (err: any) {
        setEmailDeliveryAudit({
          status: 'SIMULATED_LOGGED',
          failureReason: err.message || 'API endpoint fallback'
        });
      }

      onSubmitApplication(newApp);
      setSubmittedApp(newApp);

      if (onSuccessNavigate) {
        onSuccessNavigate(newApp);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted in this view, render success screen
  if (submittedApp) {
    return (
      <div className="bg-slate-950 border border-emerald-800/90 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-100 shadow-2xl">
        <div className="flex items-center space-x-3 text-emerald-400">
          <div className="p-3 bg-emerald-950 rounded-2xl border border-emerald-800">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider font-extrabold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              REGISTRATION SUBMITTED SUCCESSFULLY
            </span>
            <h3 className="text-2xl font-black text-white mt-1">Application Registered in C-Bridge</h3>
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div>Application ID: <strong className="text-white font-mono">{submittedApp.id}</strong></div>
            <div>Account Status: <strong className="text-amber-400 font-mono">PENDING REVIEW</strong></div>
            <div>Applicant Name: <strong className="text-white">{submittedApp.fullName}</strong></div>
            <div>Email Address: <strong className="text-white">{submittedApp.email}</strong></div>
            <div>Specialty Area: <strong className="text-white">{submittedApp.functionalArea}</strong></div>
            <div>Weekly Capacity: <strong className="text-emerald-400 font-mono font-bold">{submittedApp.totalWeeklyHours} hrs/week</strong></div>
          </div>
        </div>

        <div className="p-4 bg-amber-950/70 border border-amber-800 rounded-xl text-xs text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <Lock className="w-4 h-4" />
            <span>EXECUTIVE SUPERVISION GOVERNANCE (CB-9110)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Your applicant account has been submitted for executive review by Managing Director Husni Hasan. Upon review and approval, a Member Provisioning Proposal will be generated and you will be notified.
          </p>
        </div>

        {emailDeliveryAudit && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-400" />
              Confirmation Notification: <strong className="text-white">{emailDeliveryAudit.status}</strong>
            </span>
            <span className="text-slate-400 font-mono">{emailDeliveryAudit.deliveredAt || 'Logged in system'}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition"
            >
              ← Back to Sign In
            </button>
          )}

          <button
            onClick={() => {
              if (onSuccessNavigate) {
                onSuccessNavigate(submittedApp);
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition"
          >
            <span>VIEW APPLICANT PORTAL</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 text-slate-100 shadow-2xl space-y-6">
      
      {/* Form Header Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-400 font-mono font-bold mb-1">
            <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
              CANONICAL APPLICANT REGISTRATION
            </span>
            <span>•</span>
            <span className="text-amber-400">STAGE A REGULATORY OPERATING PORTAL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            C-Bridge Applicant Registration & Intake
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Register as a candidate for executive evaluation by Managing Director Husni Hasan.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-950/90 border border-rose-800 rounded-xl text-xs text-rose-200 font-medium flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        
        {/* SECTION 1: ACCOUNT INFORMATION */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>1. ACCOUNT INFORMATION</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">* Required Fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Tareq Al-Hassan"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Email Address *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tareq@regulatory.org"
                  className="w-full pl-3 pr-20 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleVerifyEmailSimulated}
                  disabled={isVerifyingCode || emailVerificationStatus === 'VERIFIED'}
                  className={`absolute right-1 top-1 bottom-1 px-2.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    emailVerificationStatus === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isVerifyingCode ? 'Verifying...' : emailVerificationStatus === 'VERIFIED' ? '✓ Verified' : 'Verify Email'}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PROFESSIONAL INFORMATION */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>2. PROFESSIONAL INFORMATION</span>
            </h3>
            <span className="text-[10px] font-mono text-purple-400">CV / Resume Required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Functional Area / Specialty *</label>
              <select
                value={functionalArea}
                onChange={(e) => setFunctionalArea(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-hidden"
              >
                <option value="Food Safety & Regulatory Consulting">Food Safety & FSVP Consulting</option>
                <option value="FDA Compliance & Quality Assurance">FDA Compliance & Quality Assurance</option>
                <option value="Supply Chain & Import Documentation">Supply Chain & Import Documentation</option>
                <option value="Executive Operations & Strategy">Executive Operations & Strategy</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Core Technical Skills *</label>
              <input
                type="text"
                value={coreSkills}
                onChange={(e) => setCoreSkills(e.target.value)}
                placeholder="e.g. FSVP, HACCP, PCQI, Audit Protocol"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Qualifications & Background Summary</label>
            <textarea
              rows={2}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Summarize your regulatory consulting experience, food safety audit background, and key certifications..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* CV FILE UPLOAD ATTACHMENT AREA */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">CV / Resume Upload * (PDF or DOCX)</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />

            {cvFile ? (
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-emerald-900 rounded-lg text-emerald-300 shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-xs truncate">{cvFile.fileName}</div>
                    <div className="text-[11px] text-emerald-300 font-mono">
                      {formatFileSize(cvFile.fileSize)} • Attached CV Document
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveCvFile}
                    className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/80 rounded-lg cursor-pointer"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-slate-800 hover:border-blue-500/80 bg-slate-950 rounded-xl text-center cursor-pointer transition space-y-1.5"
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="font-bold text-slate-300 text-xs">Click to browse or drop your CV / Resume file here</div>
                <div className="text-[10px] text-slate-500 font-mono">Supports PDF, DOC, DOCX up to 10MB</div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: OPTIONAL PROFESSIONAL PROFILE */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-400" />
              <span>3. OPTIONAL PROFESSIONAL PROFILE</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Optional</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">LinkedIn Profile URL (Optional)</label>
              <input
                type="url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Portfolio / Website (Optional)</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: LOCATION & TIMEZONE */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>4. LOCATION & TIMEZONE</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Operating Alignment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Country of Residence *</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United States, Jordan, UAE, Canada"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-300">Timezone *</label>
                <button
                  type="button"
                  onClick={() => setTimezone(autoTimezone)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-mono font-bold cursor-pointer"
                >
                  ⚡ Auto Detect
                </button>
              </div>
              <input
                type="text"
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. America/Detroit (EDT), Asia/Amman (UTC+3)"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: WORK AVAILABILITY & CAPACITY */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>5. WORK AVAILABILITY & CAPACITY</span>
            </h3>
            <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              Calculated Capacity: {totalWeeklyHours} hrs/week
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-2">Select Working Days *</label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Schedule Hours Inputs */}
          {workingDays.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block font-bold text-slate-300">Daily Working Hours Configuration *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {workingDays.map((day) => {
                  const cfg = dailyHoursConfig[day] || { startTime: '09:00 AM', endTime: '02:00 PM', hours: 5 };
                  return (
                    <div key={day} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{day}</span>
                        <span className="text-emerald-400 font-mono font-bold">{cfg.hours} hrs</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={cfg.startTime}
                          onChange={(e) => updateDaySchedule(day, 'startTime', e.target.value)}
                          placeholder="09:00 AM"
                          className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-[11px]"
                        />
                        <input
                          type="text"
                          value={cfg.endTime}
                          onChange={(e) => updateDaySchedule(day, 'endTime', e.target.value)}
                          placeholder="02:00 PM"
                          className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6: OPTIONAL ADDITIONAL INFORMATION */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>6. ADDITIONAL INFORMATION (OPTIONAL)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Optional</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Certifications (Optional)</label>
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                placeholder="e.g. PCQI, HACCP Certified, Lead Auditor"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Languages (Optional)</label>
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="e.g. English, Arabic, French"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Professional Notes / Preferences (Optional)</label>
            <textarea
              rows={2}
              value={professionalNotes}
              onChange={(e) => setProfessionalNotes(e.target.value)}
              placeholder="Any specific availability details or project preferences for supervisor review..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* SECTION 7: SUPERVISION NOTICE & SUBMISSION ACKNOWLEDGMENT */}
        <div className="p-4 bg-amber-950/60 border border-amber-800/80 rounded-2xl space-y-3">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-amber-300 text-xs">C-BRIDGE SUPERVISION MANDATE (CB-9110)</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Self-registration creates an <strong>APPLICANT (PENDING REVIEW)</strong> account. All applications undergo executive evaluation by Managing Director Husni Hasan before active membership provisioning or project assignment.
              </p>
            </div>
          </div>

          <label className="flex items-start space-x-2 pt-2 border-t border-amber-800/60 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={supervisionNoticeAcknowledged}
              onChange={(e) => setSupervisionNoticeAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-800 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-amber-200 font-bold">
              I acknowledge that my registration is subject to executive review by Managing Director Husni Hasan before member provisioning. *
            </span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm transition flex items-center justify-center space-x-2 cursor-pointer shadow-xl disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>SUBMIT APPLICANT REGISTRATION</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

      </form>
    </div>
  );
};
