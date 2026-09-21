import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  AlertTriangle, 
  BookOpen, 
  FileText, 
  Sparkles, 
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Scale
} from 'lucide-react';
import { SourceTrace, ClaimTrace, AuthorityLevel, ConfidenceState } from '../types';

interface SourceTraceViewerProps {
  sourceTrace: SourceTrace;
  defaultExpanded?: boolean;
}

export const SourceTraceViewer: React.FC<SourceTraceViewerProps> = ({
  sourceTrace,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!sourceTrace) return null;

  const getConfidenceBadge = (state: ConfidenceState) => {
    switch (state) {
      case 'SUPPORTED':
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
          label: 'EVIDENCE SUPPORTED'
        };
      case 'PARTIALLY_SUPPORTED':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
          label: 'PARTIALLY SUPPORTED'
        };
      case 'CONFLICTING_EVIDENCE':
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800',
          icon: <AlertTriangle className="w-3 h-3 text-rose-400" />,
          label: 'CONFLICTING EVIDENCE'
        };
      case 'INSUFFICIENT_EVIDENCE':
        return {
          bg: 'bg-orange-950/80 text-orange-300 border-orange-800',
          icon: <HelpCircle className="w-3 h-3 text-orange-400" />,
          label: 'INSUFFICIENT EVIDENCE'
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <ShieldCheck className="w-3 h-3 text-teal-400" />,
          label: state
        };
    }
  };

  const getAuthorityBadge = (level: AuthorityLevel) => {
    switch (level) {
      case 'LEVEL_1_PRIMARY_AUTHORITATIVE':
        return { label: 'L1: PRIMARY REGULATION', color: 'text-sky-300 bg-sky-950/70 border-sky-800' };
      case 'LEVEL_2_APPROVED_PROJECT_MATERIALS':
        return { label: 'L2: APPROVED COURSE MATERIAL', color: 'text-indigo-300 bg-indigo-950/70 border-indigo-800' };
      case 'LEVEL_3_CANONICAL_CASE_EVIDENCE':
        return { label: 'L3: CASE EVIDENCE & ATTACHMENT', color: 'text-teal-300 bg-teal-950/70 border-teal-800' };
      case 'LEVEL_4_APPROVED_INTERNAL_KNOWLEDGE':
        return { label: 'L4: C-BRIDGE GOVERNANCE SOP', color: 'text-purple-300 bg-purple-950/70 border-purple-800' };
      case 'LEVEL_5_AUTHORITATIVE_EXTERNAL_RESEARCH':
        return { label: 'L5: VERIFIED EXTERNAL RESEARCH', color: 'text-cyan-300 bg-cyan-950/70 border-cyan-800' };
      case 'LEVEL_6_AI_INFERENCE':
        return { label: 'L6: AI REASONING / INFERENCE', color: 'text-amber-300 bg-amber-950/70 border-amber-800' };
      default:
        return { label: level, color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  const getClaimClassBadge = (classification: string) => {
    switch (classification) {
      case 'SOURCE_DERIVED':
        return 'bg-sky-950 text-sky-300 border-sky-800';
      case 'CLIENT_EVIDENCE':
      case 'DOCUMENT_FACT':
      case 'CANONICAL_CASE_FACT':
        return 'bg-teal-950 text-teal-300 border-teal-800';
      case 'CLIENT_ASSERTION':
      case 'SESSION_ASSERTION':
      case 'PERSONA_BELIEF':
        return 'bg-violet-950 text-violet-300 border-violet-800';
      case 'PERSONA_UNCERTAINTY':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'AUTHORITATIVE_RESEARCH':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'AI_INFERENCE':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const confidenceBadge = getConfidenceBadge(sourceTrace.overallConfidence);

  return (
    <div className="mt-2.5 rounded-xl border border-slate-700/80 bg-slate-900/90 overflow-hidden shadow-md text-xs">
      {/* Clickable Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-slate-950/70 hover:bg-slate-800/80 flex items-center justify-between transition-colors border-b border-slate-800/80 cursor-pointer text-left"
      >
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-[11px] text-slate-200">
            <Scale className="w-3.5 h-3.5 text-teal-400" />
            <span className="tracking-wide">SOURCE TRACE / WHY THIS ANSWER</span>
          </div>

          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${confidenceBadge.bg}`}>
            {confidenceBadge.icon}
            <span>{confidenceBadge.label}</span>
          </span>

          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            Trace ID: {sourceTrace.traceId}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-slate-400 hover:text-slate-200">
            {isExpanded ? 'Hide Evidence Tree' : 'Inspect Evidence'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-3 bg-slate-900/60">
          {/* Claim Validation Gate Status & Verification Checks */}
          {sourceTrace.validationMetrics && (
            <div className="p-2.5 rounded-lg bg-slate-950/90 border border-teal-900/60 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-1.5 font-bold text-[10.5px] text-teal-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>CLAIM VALIDATION GATE & SCHEMA VERIFICATION METRICS</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[9.5px]">
                  <span className={`px-2 py-0.5 rounded font-mono font-semibold border ${
                    sourceTrace.validationMetrics.passed 
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                      : 'bg-rose-950/80 text-rose-300 border-rose-800'
                  }`}>
                    {sourceTrace.validationMetrics.passed ? 'GATE: PASSED' : 'GATE: RESTRICTED'}
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800">
                    {sourceTrace.validationMetrics.schemaVerificationStatus?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Validation Check List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {sourceTrace.validationMetrics.validationChecks.map((chk, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-slate-900/90 border border-slate-800 flex items-start space-x-2 text-[10px]">
                    <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] shrink-0 ${
                      chk.status === 'PASS' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : chk.status === 'FLAGGED'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {chk.status}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 truncate">{chk.checkName}</div>
                      <div className="text-[9px] text-slate-400 leading-tight">{chk.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Authority Levels Involved */}
          {sourceTrace.authorityLevelsInvolved && sourceTrace.authorityLevelsInvolved.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Governed Authority Levels In Reasoning:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sourceTrace.authorityLevelsInvolved.map((lvl, idx) => {
                  const badge = getAuthorityBadge(lvl);
                  return (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Claim-Level Evidence Breakdown */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Claim-Level Evidence Attribution ({sourceTrace.claims?.length || 0} Substantive Claims):
            </span>
            <div className="space-y-2">
              {sourceTrace.claims?.map((claim: ClaimTrace, idx: number) => (
                <div
                  key={claim.claimId || idx}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] text-teal-400 font-bold">
                        {claim.claimId || `CLM-0${idx + 1}`}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${getClaimClassBadge(claim.classification)}`}>
                        {claim.classification}
                      </span>
                      {claim.location?.blockNumber && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-mono text-[9px] font-bold">
                          Block {claim.location.blockNumber} (Verified)
                        </span>
                      )}
                      {claim.location?.section && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-800 text-teal-300 font-mono text-[9px] font-bold">
                          Section {claim.location.section}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      {claim.fieldLocationStatus === 'VERIFIED_IN_OFFICIAL_SCHEMA' && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[8.5px] font-mono">
                          ✓ SCHEMA VERIFIED
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 font-mono">
                        {claim.authorityLevel?.replace('LEVEL_', 'L')?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Substantive Claim Text */}
                  <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                    "{claim.claimText}"
                  </p>

                  {/* Supporting Sources / Documents */}
                  {(claim.supportingSourceIds?.length > 0 || claim.supportingDocumentIds?.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      <span className="text-slate-400 font-semibold">Sources:</span>
                      {claim.supportingSourceIds?.map(src => (
                        <span key={src} className="px-1.5 py-0.2 rounded bg-sky-950/60 border border-sky-800/80 text-sky-300 font-mono text-[9px]">
                          {src}
                        </span>
                      ))}
                      {claim.supportingDocumentIds?.map(doc => (
                        <span key={doc} className="px-1.5 py-0.2 rounded bg-teal-950/60 border border-teal-800/80 text-teal-300 font-mono text-[9px]">
                          {doc}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Exact Evidence Snippet */}
                  {claim.evidenceSnippet && (
                    <div className="p-2 rounded bg-slate-900/90 border-l-2 border-teal-500 text-[10.5px] text-slate-300 space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-teal-400 block tracking-wider">
                        Authoritative Excerpt / Case Record:
                      </span>
                      <p className="italic font-serif leading-relaxed">
                        {claim.evidenceSnippet}
                      </p>
                    </div>
                  )}

                  {/* AI Reasoning / Rationale */}
                  {claim.reasoningRationale && (
                    <div className="text-[10px] text-slate-400 flex items-start space-x-1 pt-0.5">
                      <span className="font-semibold text-slate-300 shrink-0">Logical Link:</span>
                      <span>{claim.reasoningRationale}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Unknowns or Gaps to be Verified */}
          {sourceTrace.unknownsOrGaps && sourceTrace.unknownsOrGaps.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/60 space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-[10px] uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Known Evidentiary Gaps / Unverified Facts:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-amber-200/90 pl-1">
                {sourceTrace.unknownsOrGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Verification Action */}
          {sourceTrace.requiredNextVerification && (
            <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 flex items-start space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-300">Required Next Inquiry / Verification: </span>
                <span>{sourceTrace.requiredNextVerification}</span>
              </div>
            </div>
          )}

          {/* Official Human Governance Notice */}
          <div className="pt-2 border-t border-slate-800/80 flex items-start space-x-2 text-[9.5px] text-slate-400 leading-snug">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
            <span>{sourceTrace.humanGovernanceNotice}</span>
          </div>
        </div>
      )}
    </div>
  );
};
