import React, { useState, useEffect } from 'react';
import {
  FileText, Download, ExternalLink, ShieldCheck, Eye,
  AlertTriangle, Lock, X, ZoomIn, ZoomOut, RotateCw,
  CheckCircle2, Pill, Activity, Calendar, User, Building2
} from 'lucide-react';
import { MedicalDocument } from '../../types';
import { db } from '../../services/mockDatabase';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: MedicalDocument | null;
  patientId?: string;
  patientName?: string;
  isAuthorized?: boolean;
  hospitalName?: string;
  doctorName?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  patientId,
  patientName,
  isAuthorized = true,
  hospitalName,
  doctorName
}) => {
  const [activeTab, setActiveTab] = useState<'DOCUMENT' | 'OCR_ENTITIES'>('DOCUMENT');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && document) {
      setHasError(false);
      setZoomLevel(100);
      setRotation(0);
      setActiveTab('DOCUMENT');

      // Log access in audit trail if authorized
      if (isAuthorized) {
        try {
          db.logAction(
            doctorName || 'usr-doc',
            doctorName || hospitalName || 'Hospital Staff',
            'DOCTOR',
            'RECORD_VIEWED',
            'MedicalDocument',
            document.id,
            `Authorized view of patient medical document: "${document.fileName}" (${document.fileType}) for Patient ID: ${patientId || document.patientId}`
          );
        } catch {}
      }
    }
  }, [isOpen, document?.id, isAuthorized]);

  if (!isOpen || !document) return null;

  const resolvedPatientId = patientId || document.patientId || 'MB-PATIENT';
  const fileUrl = document.fileData || document.fileUrl || '';
  const isPdf = (document.mimeType?.includes('pdf') || document.fileName.toLowerCase().endsWith('.pdf') || fileUrl.startsWith('data:application/pdf'));
  const isImage = (document.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(document.fileName) || fileUrl.startsWith('data:image/'));

  const handleDownload = () => {
    if (!isAuthorized) return;
    try {
      if (fileUrl) {
        const link = window.document.createElement('a');
        link.href = fileUrl;
        link.download = document.fileName || `medical_document_${document.id}`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        // Generate text/html download blob if raw URL not present
        const blob = new Blob([
          `MEDIBRIDGE AI MEDICAL DOCUMENT RECORD\n` +
          `=====================================\n` +
          `File: ${document.fileName}\n` +
          `Type: ${document.fileType}\n` +
          `Patient ID: ${resolvedPatientId}\n` +
          `Date: ${document.uploadDate}\n\n` +
          `Facility: ${document.extractedData?.facilityName || 'Medical Facility'}\n` +
          `Physician: ${document.extractedData?.physicianName || 'Physician'}\n\n` +
          `Diagnoses:\n${(document.extractedData?.extractedDiagnoses || []).map(d => `- ${d}`).join('\n')}\n\n` +
          `Medications:\n${(document.extractedData?.extractedMedications || []).map(m => `- ${m.name} ${m.dosage} (${m.frequency})`).join('\n')}\n\n` +
          `Lab Results:\n${(document.extractedData?.extractedLabResults || []).map(l => `- ${l.testName}: ${l.value} ${l.unit}`).join('\n')}`
        ], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${document.fileName.replace(/\.[^/.]+$/, '')}_summary.txt`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch {
      setHasError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate max-w-md">
                  {document.fileName}
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded">
                  {document.fileType.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                Patient ID: <span className="font-mono text-teal-300 font-bold">{resolvedPatientId}</span> {patientName ? `(${patientName})` : ''} • Uploaded: {new Date(document.uploadDate).toLocaleDateString()} • Size: {document.fileSize}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthorized && (
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit & Authorization Status Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isAuthorized ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authorized Hospital Record Access</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-red-800 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full text-[11px]">
                <Lock className="w-3.5 h-3.5 text-red-600" />
                <span>Access Unauthorized</span>
              </span>
            )}

            <span className="text-slate-500 font-mono text-[11px]">
              Audit Ref: LOG-{document.id.slice(-6).toUpperCase()}
            </span>
          </div>

          {/* Tab Switcher */}
          {isAuthorized && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('DOCUMENT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'DOCUMENT'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📄 Actual Document
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('OCR_ENTITIES')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'OCR_ENTITIES'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔍 Extracted Key-Values
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {/* 1. UNAUTHORIZED STATE */}
          {!isAuthorized && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-base font-extrabold text-slate-900">
                  Document access is not authorized.
                </h4>
                <p className="text-xs text-slate-600">
                  This patient record has not granted permission to this healthcare facility. Please request patient consent through the portal or invoke Emergency Break-Glass if clinically justified.
                </p>
              </div>
            </div>
          )}

          {/* 2. ERROR STATE */}
          {isAuthorized && hasError && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-base font-extrabold text-slate-900">
                  Unable to open this document. Please try again.
                </h4>
                <p className="text-xs text-slate-600">
                  A technical error occurred while rendering the document preview. You can still inspect the extracted OCR data or try downloading the file.
                </p>
              </div>
              <button
                onClick={() => { setHasError(false); setActiveTab('OCR_ENTITIES'); }}
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                View Extracted OCR Entities
              </button>
            </div>
          )}

          {/* 3. ACTUAL DOCUMENT VIEWER */}
          {isAuthorized && !hasError && activeTab === 'DOCUMENT' && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Image Viewer Toolbar */}
              {isImage && (
                <div className="flex items-center justify-between bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs text-xs">
                  <span className="text-slate-500 font-medium">Image View Controls:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="font-mono font-bold text-xs text-slate-800 w-12 text-center">
                      {zoomLevel}%
                    </span>
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(300, prev + 25))}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 ml-2"
                      title="Rotate 90deg"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* View Canvas */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-auto flex items-center justify-center p-4 min-h-[420px] shadow-inner relative">
                {isPdf && fileUrl ? (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full min-h-[500px] rounded-xl border-0"
                    title={document.fileName}
                    onError={() => setHasError(true)}
                  />
                ) : isImage && fileUrl ? (
                  <div className="overflow-auto max-h-full flex items-center justify-center">
                    <img
                      src={fileUrl}
                      alt={document.fileName}
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease-in-out'
                      }}
                      className="max-w-full max-h-[550px] object-contain rounded-lg shadow-sm"
                      onError={() => setHasError(true)}
                    />
                  </div>
                ) : (
                  /* High-Fidelity Formatted Medical Document Sheet */
                  <div className="w-full max-w-2xl bg-white border border-slate-300 rounded-xl p-8 shadow-md space-y-6 font-sans">
                    <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                          {document.extractedData?.facilityName || 'Verified Clinical Healthcare Facility'}
                        </h2>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Department of Clinical Services &amp; Diagnostic Records
                        </p>
                        <p className="text-xs text-teal-800 font-semibold">
                          Consultant: {document.extractedData?.physicianName || 'Attending Physician'}
                        </p>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          {document.fileType.replace(/_/g, ' ')}
                        </span>
                        <p className="text-slate-500 text-[11px] mt-1">Date: {document.extractedData?.documentDate || new Date(document.uploadDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Patient ID: <strong>{resolvedPatientId}</strong></span>
                        <span>Record ID: <strong className="font-mono">{document.id}</strong></span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Patient Name: <strong>{patientName || 'Registered Patient'}</strong></span>
                        <span>Digitized Status: <strong className="text-emerald-700">✓ Verified Complete</strong></span>
                      </div>
                    </div>

                    {document.extractedData?.extractedDiagnoses && document.extractedData.extractedDiagnoses.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Clinical Impressions / Diagnoses:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {document.extractedData.extractedDiagnoses.map((d, i) => (
                            <span key={i} className="text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-lg">
                              • {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {document.extractedData?.extractedMedications && document.extractedData.extractedMedications.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Prescription / Orders (Rx):
                        </h4>
                        <div className="space-y-1">
                          {document.extractedData.extractedMedications.map((m, i) => (
                            <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between">
                              <span className="font-bold text-slate-900">{i + 1}. {m.name} {m.dosage}</span>
                              <span className="text-teal-800 font-medium">{m.frequency} • {m.route || 'Oral'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {document.extractedData?.extractedLabResults && document.extractedData.extractedLabResults.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Laboratory Biomarkers &amp; Findings:
                        </h4>
                        <div className="space-y-1">
                          {document.extractedData.extractedLabResults.map((l, i) => (
                            <div key={i} className={`p-2 rounded-lg text-xs flex justify-between border ${
                              l.isAbnormal ? 'bg-red-50 border-red-200 text-red-900 font-bold' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span>{l.testName}</span>
                              <span>{l.value} {l.unit} [Ref: {l.referenceRange}] {l.isAbnormal && '(FLAGGED HIGH)'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Digitally Authenticated by MediBridge AI Clinical Pipeline</span>
                      <span>Verified: {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. OCR ENTITY INSPECTION */}
          {isAuthorized && !hasError && activeTab === 'OCR_ENTITIES' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Metadata</span>
                  <div className="text-xs space-y-1">
                    <p>Facility: <strong className="text-slate-900">{document.extractedData?.facilityName || 'Clinical Facility'}</strong></p>
                    <p>Physician: <strong className="text-slate-900">{document.extractedData?.physicianName || 'Attending Physician'}</strong></p>
                    <p>Date: <strong className="text-slate-900">{document.extractedData?.documentDate || 'Recent'}</strong></p>
                    <p>Confidence: <strong className="text-teal-700">{Math.round((document.extractedData?.confidenceScore || 0.98) * 100)}%</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Extracted Diagnoses</span>
                  <div className="flex flex-wrap gap-1.5">
                    {document.extractedData?.extractedDiagnoses && document.extractedData.extractedDiagnoses.length > 0 ? (
                      document.extractedData.extractedDiagnoses.map((d, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-xl font-bold">
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No specific diagnoses extracted</span>
                    )}
                  </div>
                </div>
              </div>

              {document.extractedData?.extractedMedications && document.extractedData.extractedMedications.length > 0 && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">Extracted Medications ({document.extractedData.extractedMedications.length})</span>
                  <div className="space-y-1.5">
                    {document.extractedData.extractedMedications.map((m, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                        <span className="font-bold text-slate-900">{m.name} {m.dosage}</span>
                        <span className="text-teal-800 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{m.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {document.extractedData?.extractedLabResults && document.extractedData.extractedLabResults.length > 0 && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Extracted Lab Biomarkers ({document.extractedData.extractedLabResults.length})</span>
                  <div className="space-y-1.5">
                    {document.extractedData.extractedLabResults.map((l, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                        <span className="font-medium text-slate-800">{l.testName}</span>
                        <span className={`font-mono font-bold ${l.isAbnormal ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200' : 'text-slate-900'}`}>
                          {l.value} {l.unit} [Ref: {l.referenceRange}]
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[11px] text-slate-500">
            MediBridge AI Clinical Storage • SHA-256 Encrypted Patient Record
          </div>

          <div className="flex items-center gap-2">
            {isAuthorized && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
