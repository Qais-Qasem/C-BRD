import React, { useState } from 'react';
import { TaskItem, TaskEvidenceRecord } from '../types';
import { Upload, X, FileCheck, CheckCircle2, FileText, AlertCircle, Eye, ShieldCheck, Link as LinkIcon } from 'lucide-react';

interface UploadEvidenceModalProps {
  task: TaskItem;
  onClose: () => void;
  onConfirmUpload: (
    taskId: string,
    evidenceRecord: TaskEvidenceRecord
  ) => void;
}

export const UploadEvidenceModal: React.FC<UploadEvidenceModalProps> = ({
  task,
  onClose,
  onConfirmUpload,
}) => {
  const [docTitle, setDocTitle] = useState(
    task.evidenceUrl ? task.evidenceUrl.split('] ')[1]?.split(' (')[0] || `${task.title} Evidence` : `${task.title} Work Output`
  );
  const [docType, setDocType] = useState('WORK PRODUCT');
  const [fileRef, setFileRef] = useState('');
  const [notes, setNotes] = useState('');
  const [attentionClassification, setAttentionClassification] = useState<
    'ROUTINE REVIEW' | 'DECISION REQUIRED' | 'APPROVAL REQUIRED' | 'ESCALATION REQUIRED' | 'EXPLICIT ATTENTION REQUESTED'
  >('ROUTINE REVIEW');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!docTitle || docTitle === `${task.title} Work Output`) {
        setDocTitle(file.name?.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!docTitle || docTitle === `${task.title} Work Output`) {
        setDocTitle(file.name?.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hasFile = !!selectedFile;
    const hasLink = !!fileRef.trim();

    if (!hasFile && !hasLink) {
      setError('Please attach a file or enter a valid evidence reference.');
      return;
    }

    if (!docTitle.trim()) {
      setError('Evidence title is required.');
      return;
    }

    setError('');

    const formattedDate = new Date().toISOString().slice(0, 10);
    const formattedTime = new Date().toTimeString().slice(0, 8);

    const record: TaskEvidenceRecord = {
      id: `EVD-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      uploadedBy: 'Samar Baydoun',
      timestamp: `${formattedDate} ${formattedTime} EDT`,
      title: docTitle.trim(),
      evidenceType: docType,
      fileOrLink: selectedFile ? selectedFile.name : fileRef.trim(),
      notes: notes.trim(),
      supervisorVisibility: 'YES',
      supervisor: 'Husni Hasan',
      attentionClassification,
    };

    onConfirmUpload(task.id, record);
    onClose();
  };

  return (
    <div
      id="upload-evidence-modal"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
    >
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          id="btn-close-upload-evidence-modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-extrabold text-lg">
            <Upload className="h-5 w-5 text-blue-600" />
            <span className="uppercase tracking-wide">UPLOAD TASK EVIDENCE</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Attach work evidence, drafts, references, source files, screenshots, records, or other supporting material related to this task.
          </p>
        </div>

        {/* Task Details Banner */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">{task.title}</span>
            <span className="font-mono bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
              {task.moduleCode || task.id}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center space-x-2 pt-0.5">
            <span>Task ID: <strong className="font-mono text-slate-800">{task.id}</strong></span>
            <span>•</span>
            <span>Assigned: <strong className="text-slate-800">{task.assignedTo}</strong></span>
          </div>
        </div>

        {error && (
          <div className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Document Title */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Evidence Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-evidence-doc-title"
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="E.g. Hazard Analysis Synthesis Draft, Site Visit Notes, etc."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 font-medium"
            />
          </div>

          {/* Document Type / Category */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Evidence Type</label>
            <select
              id="select-evidence-doc-type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="WORK PRODUCT">WORK PRODUCT</option>
              <option value="DRAFT DOCUMENT">DRAFT DOCUMENT</option>
              <option value="REFERENCE / SOURCE">REFERENCE / SOURCE</option>
              <option value="SCREENSHOT">SCREENSHOT</option>
              <option value="MEETING NOTE">MEETING NOTE</option>
              <option value="RESEARCH OUTPUT">RESEARCH OUTPUT</option>
              <option value="LEARNING EVIDENCE">LEARNING EVIDENCE</option>
              <option value="COMMUNICATION RECORD">COMMUNICATION RECORD</option>
              <option value="REGULATORY SOURCE">REGULATORY SOURCE</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Upload File (Optional if Link provided)</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/60'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80'
              }`}
            >
              <input
                type="file"
                id="file-upload-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer space-y-1 block">
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-slate-400 mx-auto" />
                    <div className="font-bold text-slate-700">
                      Click to select file or drag & drop here
                    </div>
                    <p className="text-[10px] text-slate-400">PDF, DOCX, XLSX, JPG, PNG, TXT (Max 25MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* External / Reference Link */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span>External / Reference Link or File ID</span>
              <span className="text-[10px] text-slate-400 font-normal">Required if no file uploaded</span>
            </label>
            <div className="relative">
              <LinkIcon className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                id="input-evidence-file-ref"
                type="text"
                value={fileRef}
                onChange={(e) => setFileRef(e.target.value)}
                placeholder="Paste external link or reference ID if applicable"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>

          {/* Supervisor Visibility & Attention Classification */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-indigo-900 font-bold">
              <span className="flex items-center space-x-1.5">
                <Eye className="h-4 w-4 text-indigo-600" />
                <span>Supervisor Visibility: YES</span>
              </span>
              <span className="bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded font-mono text-[10px]">
                Supervisor: Husni Hasan
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                Attention Classification
              </label>
              <select
                id="select-attention-classification"
                value={attentionClassification}
                onChange={(e) => setAttentionClassification(e.target.value as any)}
                className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                <option value="ROUTINE REVIEW">ROUTINE REVIEW (No Immediate Alert)</option>
                <option value="DECISION REQUIRED">DECISION REQUIRED (Alert Supervisor)</option>
                <option value="APPROVAL REQUIRED">APPROVAL REQUIRED (Alert Supervisor)</option>
                <option value="ESCALATION REQUIRED">ESCALATION REQUIRED (Alert Supervisor)</option>
                <option value="EXPLICIT ATTENTION REQUESTED">EXPLICIT ATTENTION REQUESTED (Alert Supervisor)</option>
              </select>
            </div>

            <p className="text-[10px] text-indigo-700 leading-tight">
              Routine evidence is reviewable by Husni Hasan but does <strong>NOT</strong> automatically create an immediate alert. Alerts are sent only if Decision, Approval, or Escalation is required.
            </p>
          </div>

          {/* Notes / Context */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Notes / Context <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="input-evidence-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add relevant notes, summary context, or key takeaways for this evidence..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              id="btn-cancel-upload-evidence"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-upload-evidence"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
            >
              <FileCheck className="h-4 w-4" />
              <span>CONFIRM UPLOAD</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
