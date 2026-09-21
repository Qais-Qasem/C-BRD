import React, { useState } from 'react';
import { CBridgeAssetLibraryRecord, CBridgeAssetType, UserRole } from '../types';
import { ShieldCheck, Search, Filter, BookOpen, Layers, CheckCircle2, FileText, Download, ExternalLink, Tag, RefreshCw } from 'lucide-react';

interface CBridgeAssetLibraryViewProps {
  assets: CBridgeAssetLibraryRecord[];
  currentUser: UserRole;
  onOpenAssetDetail?: (asset: CBridgeAssetLibraryRecord) => void;
}

export const CBridgeAssetLibraryView: React.FC<CBridgeAssetLibraryViewProps> = ({
  assets,
  currentUser,
  onOpenAssetDetail
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<CBridgeAssetLibraryRecord | null>(null);

  const filteredAssets = assets.filter(a => {
    const matchesSearch =
      a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.relatedCapability.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.relatedService.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || a.assetType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div id="cbridge-asset-library-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-emerald-300">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md">
                OFFICIAL REUSABLE INTELLECTUAL PROPERTY
              </span>
              <span className="text-xs font-mono text-slate-300">
                Total Approved Assets: <strong>{assets.length}</strong>
              </span>
            </div>
            <h1 className="text-xl font-black mt-1">C-Bridge Approved Asset Library</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Centralized repository of Husni-approved C-Bridge SOPs, Checklists, Workflows, Intake Forms, Decision Trees, and Consulting Tools available for active service delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets by name, capability, service..."
            className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto font-bold text-slate-700"
          >
            <option value="ALL">All Asset Types</option>
            <option value="CHECKLIST">CHECKLIST</option>
            <option value="SOP">SOP</option>
            <option value="WORKFLOW">WORKFLOW</option>
            <option value="INTAKE FORM">INTAKE FORM</option>
            <option value="GAP-ASSESSMENT TOOL">GAP-ASSESSMENT TOOL</option>
            <option value="INTERNAL KNOWLEDGE NOTE">INTERNAL KNOWLEDGE NOTE</option>
            <option value="TRAINING TOOL">TRAINING TOOL</option>
            <option value="SERVICE DEVELOPMENT TOOL">SERVICE DEVELOPMENT TOOL</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Approved Assets Match Your Query</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Assets enter this library upon final Supervisor (Husni Hasan) sign-off in the Asset Lab environment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 font-black text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {asset.assetType}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-extrabold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {asset.version}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{asset.assetName}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">ID: {asset.id} | Origin: {asset.projectOfOrigin}</p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div><strong>Related Capability:</strong> {asset.relatedCapability}</div>
                  <div><strong>Approved By:</strong> {asset.approvedBy} ({asset.approvalDate})</div>
                  <div><strong>Author / Developer:</strong> {asset.createdBy}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">STATUS: ACTIVE</span>
                <button
                  onClick={() => setSelectedAsset(asset)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" /> Inspect Content
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Asset Modal Viewer */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md">
                      APPROVED C-BRIDGE ASSET
                    </span>
                    <span className="font-mono text-xs text-indigo-200">{selectedAsset.version}</span>
                  </div>
                  <h2 className="text-lg font-bold">{selectedAsset.assetName}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                <FileText className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap bg-slate-50 space-y-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 font-sans text-xs">
                <div><strong>Asset Code:</strong> {selectedAsset.id}</div>
                <div><strong>Approved By:</strong> {selectedAsset.approvedBy} on {selectedAsset.approvalDate}</div>
                <div><strong>Project of Origin:</strong> {selectedAsset.projectOfOrigin}</div>
                <div><strong>Capability Area:</strong> {selectedAsset.relatedCapability}</div>
              </div>

              <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-2xs">
                {selectedAsset.content || 'Content payload currently loaded.'}
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
