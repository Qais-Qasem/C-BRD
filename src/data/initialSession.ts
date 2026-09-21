import { LiveLearningSession } from '../types';

export const INITIAL_LIVE_SESSION: LiveLearningSession = {
  sessionId: 'SES-2026-9114',
  member: 'Samar Baydoun',
  topic: 'FSVP Hazard Analysis & Supplier Verification (21 CFR 1.500 - 1.506)',
  relatedTaskId: 'SB-9114',
  relatedTaskTitle: 'Study FSVP Hazard Analysis & Verification Requirements',
  startTime: '2026-08-08 — 15:45:00 — EDT',
  status: 'ACTIVE',
  sourceMaterial: '21 CFR 1.500 FSVP Rulebook & MSU Course Pack Guidance (Protected Material)',
  learningProgress: 78,
  attentionLevel: 'ROUTINE REVIEW',
  supervisorVisibility: 'ACTIVE',
  supervisor: 'Husni Hasan',
  supervisorReviewable: true,
  learningObjective: 'Master 21 CFR 1.500-1.506 Foreign Supplier Hazard Analysis & Verification Requirements for C-Bridge Client Service Delivery.',
  expectedCBridgeApplication: 'Develop original C-Bridge Foreign Supplier Evaluation Checklist, FSVP Verification SOP Workflow, and LinkedIn Educational Content for Importers.',
  openQuestions: [
    'How do biological hazards in dried fruits differ from chemical hazards under 21 CFR 1.504?',
    'What verification activities satisfy SAHC exemption qualification under 21 CFR 1.507?'
  ],
  weakAreas: [
    'Onsite audit frequency rules for SAHC hazards vs non-SAHC hazards',
    'Documenting modified verification procedures for small foreign suppliers'
  ],
  supervisorComments: [
    'Ensure clear documentation of SAHC hazards vs non-SAHC hazards for foreign suppliers.'
  ],
  supervisorInterventions: [
    {
      id: 'int-1',
      supervisorName: 'Husni Hasan',
      timestamp: '2026-08-08 16:10:22 EDT',
      instruction: 'Good progress on SAHC verification rules. Make sure to draft a 1-page summary matrix for our internal C-Bridge SOP before concluding this study block.',
      actionType: 'DIRECTION'
    }
  ],
  handoffData: {
    topicLearned: 'Foreign Supplier Evaluation & Hazard Analysis (21 CFR 1.500 - 1.506)',
    keyConcepts: [
      'SAHC Hazard Classification (21 CFR 1.504 / 1.506)',
      'Mandatory Annual Onsite Foreign Supplier Audits for SAHC Hazards',
      'Written Justification Rules for Alternative Verification Procedures',
      'Approved Foreign Supplier List & Recordkeeping Audit Trails'
    ],
    samarUnderstanding: 'Confirmed 85% Mastery — Samar demonstrates accurate classification of biological vs chemical hazards and understands mandatory annual audit triggers for SAHC hazards under 21 CFR 1.506.',
    openQuestions: [
      'Verification exemptions and modified requirements for very small foreign suppliers under 21 CFR 1.512'
    ],
    potentialCBridgeApplication: 'Develop standardized C-Bridge Foreign Supplier Evaluation Checklist, FSVP Verification SOP Workflow, and Public Educational LinkedIn Post for Importers.',
    recommendedAssetTypes: ['CHECKLIST', 'SOP', 'LINKEDIN EDUCATIONAL POST', 'INTAKE FORM'],
    scopePolicyCheck: 'PASSED — Protected MSU material used for internal learning only. New C-Bridge commercial assets will be drafted independently using original regulatory references.',
    sourceClassification: 'Protected MSU Material — Confidential Internal Guidance',
    suggestedTasks: [
      {
        id: 'AST-9114-1',
        taskTitle: 'Create Original C-Bridge Foreign Supplier Evaluation Checklist',
        assetType: 'CHECKLIST',
        purpose: 'Standardize foreign supplier verification intake and SAHC hazard screening for C-Bridge importer clients under 21 CFR 1.506.',
        learningSource: '21 CFR 1.500-1.506 & Session SES-2026-9114',
        relatedLearningSession: 'SES-2026-9114',
        assignedMember: 'Samar Baydoun',
        suggestedPriority: 'P4 — NORMAL EXECUTION',
        destination: 'FSVP Development',
        expectedDeliverable: 'Clean 2-page verification checklist with SAHC flags and audit frequency rules',
        qaRequirement: 'CB-9120 QA Review Required prior to client deployment',
        supervisorReviewRequirement: 'Husni Hasan Approval Required',
        isSelected: true,
        isConfirmed: false
      },
      {
        id: 'AST-9114-2',
        taskTitle: 'Draft Foreign Supplier Audit SOP Workflow',
        assetType: 'SOP',
        purpose: 'Establish internal C-Bridge step-by-step operating procedure for evaluating foreign supplier audit certificates.',
        learningSource: '21 CFR 1.506 & MSU FSVP Course Pack',
        relatedLearningSession: 'SES-2026-9114',
        assignedMember: 'Samar Baydoun',
        suggestedPriority: 'P4 — NORMAL EXECUTION',
        destination: 'FSVP Development',
        expectedDeliverable: 'SOP Document with process flowchart and escalation triggers',
        qaRequirement: 'CB-9120 QA Review Required',
        supervisorReviewRequirement: 'Husni Hasan Approval Required',
        isSelected: true,
        isConfirmed: false
      },
      {
        id: 'AST-9114-3',
        taskTitle: 'Draft Educational LinkedIn Post: What Importers Must Know About Foreign Supplier Verification',
        assetType: 'LINKEDIN EDUCATIONAL POST',
        purpose: 'Educate food importers on 21 CFR 1.506 audit rules and drive inbound interest for C-Bridge FSVP services.',
        learningSource: '21 CFR 1.506 SAHC Key Learnings',
        relatedLearningSession: 'SES-2026-9114',
        assignedMember: 'Samar Baydoun',
        suggestedPriority: 'P4 — NORMAL EXECUTION',
        destination: 'Content Production Task',
        expectedDeliverable: '300-word informative LinkedIn post draft with regulatory citations',
        qaRequirement: 'Regulatory Claim Review & CB-9120 QA',
        supervisorReviewRequirement: 'Husni Hasan Publication Approval',
        isSelected: true,
        isConfirmed: false
      }
    ]
  },
  confirmedAssetTasks: [],
  messages: [
    {
      id: 'msg-1',
      sender: 'C_BRIDGE_AI',
      senderName: 'C-Bridge AI Tutor',
      timestamp: '2026-08-08 15:45:05 EDT',
      text: 'Welcome Samar to today\'s C-Bridge FSVP Learning Session. We are referencing 21 CFR 1.500 through 1.506 and MSU Course Pack materials.\n\n⚠️ DISCLAMER: Protected MSU Material — Use for internal learning only. Do not copy protected source text directly into commercial C-Bridge outputs.',
      type: 'EXPLANATION'
    },
    {
      id: 'msg-2',
      sender: 'SAMAR',
      senderName: 'Samar Baydoun',
      timestamp: '2026-08-08 15:48:30 EDT',
      text: 'Can you explain how 21 CFR 1.506 requires us to evaluate SAHC (Serious Adverse Health Consequences or Death) hazards for foreign suppliers?',
      type: 'CHAT'
    },
    {
      id: 'msg-3',
      sender: 'C_BRIDGE_AI',
      senderName: 'C-Bridge AI Tutor',
      timestamp: '2026-08-08 15:49:00 EDT',
      text: 'Under 21 CFR 1.506(d)(1)(i), if a hazard identified in your 21 CFR 1.504 hazard analysis presents a risk of Serious Adverse Health Consequences or Death (SAHC) to humans or animals:\n\n1. DEFAULT RULE: Annual onsite audit conducted by a qualified auditor prior to importing food from that foreign supplier.\n2. MODIFICATION ALLOWED: Importer may establish that an alternative verification activity (e.g. testing or sampling) or less frequent audit provides adequate assurance, provided the rationale is documented in writing.',
      type: 'EXPLANATION'
    },
    {
      id: 'msg-4',
      sender: 'C_BRIDGE_AI',
      senderName: 'C-Bridge AI Tutor',
      timestamp: '2026-08-08 15:52:10 EDT',
      text: 'Quick Check Quiz: Under 21 CFR 1.506, what is the default required verification activity when a foreign supplier hazard is classified as SAHC?',
      type: 'QUIZ',
      quizQuestion: 'What is the default required verification activity for a SAHC hazard?',
      quizOptions: [
        { id: 0, text: 'A) Phone interview with supplier QA manager twice a year' },
        { id: 1, text: 'B) Annual onsite audit conducted by a qualified auditor' },
        { id: 2, text: 'C) Simple certificate of analysis (COA) batch review' },
        { id: 3, text: 'D) Self-declaration certificate from foreign facility' }
      ],
      correctOptionIndex: 1,
      selectedOptionIndex: 1,
      isCorrect: true,
      explanation: 'Correct! An annual onsite audit by a qualified auditor is the default regulatory requirement for SAHC hazards under 21 CFR 1.506(d)(1)(i).'
    },
    {
      id: 'msg-5',
      sender: 'SUPERVISOR',
      senderName: 'Husni Hasan',
      timestamp: '2026-08-08 16:10:22 EDT',
      text: 'SUPERVISOR DIRECTION — Good progress on SAHC verification rules. Make sure to draft a 1-page summary matrix for our internal C-Bridge SOP before concluding this study block.',
      type: 'INTERVENTION',
      supervisorActionType: 'DIRECTION'
    }
  ]
};
