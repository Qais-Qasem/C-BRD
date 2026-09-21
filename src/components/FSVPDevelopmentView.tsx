import React, { useState } from 'react';
import { Layers, FileCheck, ShieldCheck, Download, Plus, CheckCircle2 } from 'lucide-react';

export const FSVPDevelopmentView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checklists' | 'hazard' | 'importer'>('checklists');

  const checklistItems = [
    { title: 'Foreign Facility FDA Registration Verification', section: '21 CFR 1.503', status: 'VERIFIED' },
    { title: 'Foreign Supplier Hazard Analysis Review (Biological, Chemical, Physical)', section: '21 CFR 1.504', status: 'IN_REVIEW' },
    { title: 'Verification Activity Determination (Audit / Records / Testing)', section: '21 CFR 1.506', status: 'IN_REVIEW' },
    { title: 'Corrective Action Procedures Review', section: '21 CFR 1.508', status: 'PENDING' },
    { title: 'FSVP Importer DUNS / U.S. Agent Identifier Entry', section: '21 CFR 1.509', status: 'VERIFIED' },
  ];

  return (
    <div id="fsvp-development-view" className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm text-white">
        <div className="flex items-center space-x-2 text-xs text-blue-300 font-mono font-bold mb-1">
          <span className="bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
            SB-9113 FSVP SERVICE DEVELOPMENT
          </span>
          <span>•</span>
          <span>Phase 1 Operating Workspace</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          FSVP & U.S. Food Import Development Workspace
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Core toolsets for Samar Baydoun&apos;s Phase 1 execution: Foreign Supplier Verification Program checklists, hazard analysis templates, and importer readiness scorecards.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('checklists')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'checklists' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          FSVP Supplier Review Checklist (21 CFR 1.500)
        </button>
        <button
          onClick={() => setActiveTab('hazard')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'hazard' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          Hazard Analysis Verification Protocol
        </button>
        <button
          onClick={() => setActiveTab('importer')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'importer' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          Importer Readiness Scorecard
        </button>
      </div>

      {/* Tab 1: Checklists */}
      {activeTab === 'checklists' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">FSVP Foreign Supplier Review 12-Point Checklist</h3>
              <p className="text-xs text-slate-500">Standardized verification checklist drafted under SB-9113</p>
            </div>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1">
              <Download className="h-3.5 w-3.5" />
              <span>Export Template</span>
            </button>
          </div>

          <div className="space-y-2">
            {checklistItems.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center font-mono text-[11px]">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{item.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">FDA Regulation: {item.section}</div>
                  </div>
                </div>

                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                  item.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  item.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                  'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Hazard Analysis */}
      {activeTab === 'hazard' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs text-slate-800">
          <h3 className="text-sm font-bold text-slate-900">Hazard Analysis Verification Framework</h3>
          <p className="text-xs text-slate-500">
            Assesses foreign supplier hazard analysis for biological (pathogens), chemical (mycotoxins, allergens), and physical hazards under HARPC standards.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div><strong className="text-slate-900">Step 1:</strong> Identify known or reasonably foreseeable hazards associated with food type.</div>
            <div><strong className="text-slate-900">Step 2:</strong> Evaluate severity of illness/injury and probability of occurrence.</div>
            <div><strong className="text-slate-900">Step 3:</strong> Confirm supplier controls applied at foreign manufacturing facility.</div>
          </div>
        </div>
      )}

      {/* Tab 3: Importer Readiness Scorecard */}
      {activeTab === 'importer' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs text-slate-800">
          <h3 className="text-sm font-bold text-slate-900">U.S. Food Importer Readiness Scorecard</h3>
          <p className="text-xs text-slate-500">Client evaluation metric for entry clearance readiness</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-2xl font-black text-emerald-600">92 / 100</div>
              <div className="text-slate-700 mt-1 font-bold">AmeriFood Importers</div>
              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Ready for Entry</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-2xl font-black text-amber-600">74 / 100</div>
              <div className="text-slate-700 mt-1 font-bold">GlobalSpice Logistics</div>
              <div className="text-[10px] text-amber-700 font-bold mt-0.5">DUNS Registration Pending</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-2xl font-black text-slate-500">Draft</div>
              <div className="text-slate-700 mt-1 font-bold">New Prospect Client</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Assessment In Progress</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
