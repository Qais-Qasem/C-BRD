import React, { useState } from 'react';
import { ProjectSource, ProjectSourceCategory, UserRole } from '../types';
import { BookOpen, Upload, Link, FileText, Plus, X, Shield, Sparkles, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

interface ProjectSourceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  sources: ProjectSource[];
  currentUser: UserRole;
  onAddSource: (source: ProjectSource) => void;
}

const CATEGORIES: ProjectSourceCategory[] = [
  'OVERVIEW',
  'SYLLABUS',
  'COURSE OUTLINE',
  'MODULE OVERVIEW',
  'COURSE METHODOLOGY',
  'TRAINING MATERIAL',
  'STUDY MATERIAL',
  'READING MATERIAL',
  'ASSIGNMENT INSTRUCTIONS',
  'RESEARCH PAPER',
  'REGULATION',
  'STANDARD',
  'GOVERNMENT GUIDANCE',
  'WEBSITE / LINK',
  'CONFERENCE NOTES',
  'WEBINAR NOTES',
  'MEETING OUTCOME',
  'MARKET INTELLIGENCE',
  'PROFESSIONAL NOTES',
  'PREVIOUS C-BRIDGE WORK',
  'MEMBER KNOWLEDGE BACKGROUND',
  'HUSNI DIRECTION',
  'OTHER'
];

export const ProjectSourceLibraryModal: React.FC<ProjectSourceLibraryModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  sources,
  currentUser,
  onAddSource
}) => {
  const [activeTab, setActiveTab] = useState<'VIEW' | 'ADD'>('VIEW');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectSourceCategory>('STUDY MATERIAL');
  const [description, setDescription] = useState('');
  const [fileOrUrl, setFileOrUrl] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [protectedFlag, setProtectedFlag] = useState(false);
  const [sourceNotes, setSourceNotes] = useState('');
  const [relatedModuleCode, setRelatedModuleCode] = useState('SB-9113');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSource: ProjectSource = {
      id: `SRC-${Date.now().toString().slice(-6)}`,
      projectId,
      title: title.trim(),
      category,
      description: description.trim(),
      fileOrUrl: fileOrUrl.trim(),
      fileContent: fileContent.trim(),
      uploadedBy: currentUser === 'HUSNI' ? 'Husni Hasan' : 'Samar Baydoun',
      uploadedAt: new Date().toISOString(),
      relatedModuleCode,
      protectedMaterialFlag: protectedFlag,
      sourceNotes: sourceNotes.trim(),
      aiProcessingStatus: 'ANALYZED',
      provenance: {
        sourceDerivedInfo: [description.trim() || title.trim()],
        aiInterpretation: "Source analyzed and indexed into project library.",
        memberContribution: sourceNotes.trim() || "Uploaded by Capability Developer",
        husniDirection: currentUser === 'HUSNI' ? "Approved source upload by Husni Hasan" : "Pending routine supervisor review",
        cbridgeOriginalOutput: "Source Library Entry"
      }
    };

    onAddSource(newSource);
    setTitle('');
    setDescription('');
    setFileOrUrl('');
    setFileContent('');
    setSourceNotes('');
    setActiveTab('VIEW');
  };

  const projectSources = sources.filter(s => s.projectId === projectId);

  return (
    <div id="project-source-library-modal" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Project Source Library</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Traceable source documents for project: <span className="font-semibold text-indigo-200">{projectName} ({projectId})</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('VIEW')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'VIEW' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Library Sources ({projectSources.length})
          </button>
          <button
            onClick={() => setActiveTab('ADD')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'ADD' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="h-4 w-4" />
            Add New Source to Project
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto grow">
          {activeTab === 'VIEW' ? (
            <div className="space-y-4">
              {projectSources.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">No Sources Added Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Projects can start with a syllabus, regulation, training material, research paper, or meeting notes. Add your first source to build traceable knowledge.
                  </p>
                  <button
                    onClick={() => setActiveTab('ADD')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add First Source
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectSources.map((source) => (
                    <div key={source.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-indigo-300 transition-all shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="bg-indigo-100 text-indigo-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                          {source.category}
                        </span>
                        {source.protectedMaterialFlag && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Protected Third-Party
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{source.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{source.description || 'No description provided.'}</p>
                      </div>

                      {/* Provenance Box */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-1">
                        <div className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Source Traceability</div>
                        <div className="text-slate-700"><strong>Uploaded by:</strong> {source.uploadedBy} ({new Date(source.uploadedAt).toLocaleDateString()})</div>
                        {source.relatedModuleCode && (
                          <div className="text-slate-700"><strong>Module:</strong> {source.relatedModuleCode}</div>
                        )}
                      </div>

                      {source.fileOrUrl && (
                        <div className="text-xs font-mono text-indigo-600 truncate bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                          {source.fileOrUrl}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleAddSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Source Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MSU FSVP Syllabus / FDA Guidance for Industry Part 1"
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Source Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProjectSourceCategory)}
                    className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Related Module Code
                  </label>
                  <input
                    type="text"
                    value={relatedModuleCode}
                    onChange={(e) => setRelatedModuleCode(e.target.value)}
                    placeholder="e.g. SB-9113"
                    className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Source Description / Purpose
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what this source contains and how it will be used in capability development..."
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  File Name or Reference URL / Link
                </label>
                <input
                  type="text"
                  value={fileOrUrl}
                  onChange={(e) => setFileOrUrl(e.target.value)}
                  placeholder="e.g. https://www.fda.gov/media/fsvp-guidance.pdf or syllabus.docx"
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Source Text or Key Notes
                </label>
                <textarea
                  rows={4}
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  placeholder="Paste relevant text or syllabus topics here..."
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  id="protectedFlag"
                  checked={protectedFlag}
                  onChange={(e) => setProtectedFlag(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded-sm border-slate-300"
                />
                <label htmlFor="protectedFlag" className="text-xs text-amber-900 font-medium">
                  <strong>Protected Material Flag:</strong> Check if this source contains third-party proprietary text that must NOT be copied verbatim into final C-Bridge deliverables.
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('VIEW')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Source to Library
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
