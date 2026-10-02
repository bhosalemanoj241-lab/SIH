import React from 'react';
import {
  FileText, Download, Printer, ShieldAlert, CheckCircle2,
  AlertTriangle, Pill, Activity, HeartPulse, User, Calendar,
  Globe, Clock, MapPin, Sparkles, X, Stethoscope, Building2
} from 'lucide-react';
import { ClinicalSession, ClinicalHistorySummary, PhysicianShortReport, PatientProfile, ClinicalSourceTag } from '../../types';
import { db } from '../../services/mockDatabase';
import { FHIRService } from '../../services/fhirService';
import { useNotification } from '../../context/NotificationContext';

interface ClinicalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClinicalSession | null;
  patient?: PatientProfile;
  hospitalName?: string;
  doctorName?: string;
  isAuthorized?: boolean;
}

const SourceBadge: React.FC<{ source?: ClinicalSourceTag }> = ({ source = 'PATIENT REPORTED' }) => {
  const styles: Record<ClinicalSourceTag, { bg: string; text: string; border: string }> = {
    'PATIENT REPORTED': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    'DOCUMENT EXTRACTED': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    'AI SUMMARIZED': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    'DOCTOR ENTERED': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' }
  };
  const current = styles[source] || styles['PATIENT REPORTED'];
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${current.bg} ${current.text} ${current.border} uppercase tracking-wider`}>
      {source}
    </span>
  );
};

export const ClinicalSummaryModal: React.FC<ClinicalSummaryModalProps> = ({
  isOpen,
  onClose,
  session,
  patient,
  hospitalName,
  doctorName,
  isAuthorized = true
}) => {
  const { showToast } = useNotification();

  if (!isOpen || !session) return null;

  const summary = session.aiSummary;
  const report: PhysicianShortReport | undefined = session.shortReport || summary?.shortReport;

  const handlePrint = () => {
    window.print();
  };

  const handleExportFHIR = () => {
    if (summary) {
      const resolvedPatient: PatientProfile = patient || {
        id: session.patientId,
        userId: '',
        patientId: session.patientId,
        fullName: session.patientName || 'Patient',
        dob: '1995-01-01',
        age: session.patientAge || 35,
        gender: session.patientGender === 'Female' ? 'FEMALE' : 'MALE',
        bloodGroup: 'B+',
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: session.patientPhone || '+91 98000 00000',
        emergencyContactRelation: 'Family',
        address: 'Residential Address',
        city: 'City',
        pincode: '400001',
        createdAt: new Date().toISOString()
      };
      const fhirBundle = FHIRService.generateFHIRBundle(resolvedPatient, summary);
      FHIRService.downloadJSON(fhirBundle, `FHIR_R4_ClinicalBundle_${session.patientId}_${session.id}.json`);
      showToast('FHIR Bundle Exported', 'Downloaded ABDM & HL7 FHIR R4 compliant clinical bundle JSON.', 'VERIFICATION');
    }
  };

  const chiefComplaintText = report?.chiefComplaint?.mainReason || summary?.chiefComplaints || session.chiefComplaint || 'Patient presents for clinical evaluation.';
  const chiefComplaintSource: ClinicalSourceTag = report?.chiefComplaint?.source || 'PATIENT REPORTED';

  const symptomsList = report?.symptoms?.importantSymptoms || summary?.symptomsList?.map(s => s.name) || [chiefComplaintText];
  const symptomsDuration = report?.symptoms?.duration || summary?.symptomsList?.[0]?.duration || '2-3 days';
  const symptomsSeverity = report?.symptoms?.severity || (summary?.painScore ? `${summary.painScore}/10` : 'Moderate');
  const symptomsLocation = report?.symptoms?.location || 'Reported during intake';
  const symptomsOnset = report?.symptoms?.onset || 'Gradual';
  const symptomsAssociated = report?.symptoms?.associatedSymptoms || [];
  const symptomsSource: ClinicalSourceTag = report?.symptoms?.source || 'PATIENT REPORTED';

  const existingConditions = report?.medicalHistory?.existingConditions || summary?.pastMedicalHistory?.map(p => p.condition) || [];
  const medicalHistorySource: ClinicalSourceTag = report?.medicalHistory?.source || 'PATIENT REPORTED';

  const currentMedications = report?.medicationsAndAllergies?.currentMedications || summary?.currentMedications?.map(m => `${m.name} (${m.dosage})`) || [];
  const knownAllergies = report?.medicationsAndAllergies?.knownAllergies || summary?.allergies?.map(a => `${a.allergen}`) || [];
  const medsAllergiesSource: ClinicalSourceTag = report?.medicationsAndAllergies?.source || 'PATIENT REPORTED';

  const summaryText = report?.summary?.text || summary?.historyOfPresentIllness || summary?.translatedSummary || 'Patient completed pre-arrival conversational intake.';
  const summarySource: ClinicalSourceTag = report?.summary?.source || 'AI SUMMARIZED';

  const redFlagsDetected = Boolean(report?.redFlags?.detected || session.isRedFlagTriggered || (session.redFlagsDetected && session.redFlagsDetected.length > 0));
  const redFlagsList = report?.redFlags?.flags || session.redFlagsDetected || [];

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-4xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 flex-shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white truncate">
                  AI Intake Clinical Summary
                </h3>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                  session.triagePriority === 'RED' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                  session.triagePriority === 'ORANGE' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' :
                  'bg-teal-500/20 text-teal-300 border-teal-400/30'
                }`}>
                  Triage Priority: {session.triagePriority}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                Patient ID: <strong className="text-teal-300 font-mono">{session.patientId}</strong> • Patient: <strong className="text-white">{session.patientName || patient?.fullName || 'Patient'}</strong> • Generated: {new Date(session.startedAt || session.completedAt || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Download / Print PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Disclaimer Warning Box */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3 flex items-start gap-3 text-amber-900 text-xs flex-shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>AI Clinical Safety Disclaimer:</strong> AI-generated preliminary clinical summary — physician verification required. Not a final medical diagnosis or prescription. Attending physician remains responsible for clinical decisions.
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 bg-slate-50 font-sans">
          
          {/* Red Flag Alert if detected */}
          {redFlagsDetected && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-red-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
                  <span>Clinical Red Flags Detected</span>
                </span>
                <SourceBadge source="PATIENT REPORTED" />
              </div>
              <div className="space-y-1">
                {redFlagsList.map((rf, idx) => (
                  <p key={idx} className="text-xs font-bold text-red-800 bg-white p-2 rounded-lg border border-red-200">
                    🚨 {rf}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Chief Complaint & Present Illness */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>1. Chief Complaint &amp; History of Present Illness</span>
              </h4>
              <SourceBadge source={chiefComplaintSource} />
            </div>

            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 text-xs space-y-1">
              <span className="font-bold text-teal-900">Primary Complaint:</span>
              <p className="font-bold text-slate-900 text-sm">{chiefComplaintText}</p>
            </div>

            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-900">Conversational Narrative &amp; Clinical Synthesis:</span>
                <SourceBadge source={summarySource} />
              </div>
              <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line text-xs">
                {summaryText}
              </p>
            </div>
          </div>

          {/* Section 2: Symptoms Breakdown Grid */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-blue-600" />
                <span>2. Symptom Mapping &amp; Character</span>
              </h4>
              <SourceBadge source={symptomsSource} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Duration</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{symptomsDuration}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Reported Severity</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{symptomsSeverity}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Onset</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{symptomsOnset}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Anatomical Location</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{symptomsLocation}</span>
              </div>
            </div>

            {symptomsList.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5">
                {symptomsList.map((sym, idx) => (
                  <span key={idx} className="text-xs bg-slate-100 text-slate-800 border border-slate-200 font-semibold px-2.5 py-1 rounded-lg">
                    • {sym}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Chronic History, Medications & Allergies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medications */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>3. Active Medications</span>
                </h4>
                <SourceBadge source={medsAllergiesSource} />
              </div>
              {currentMedications.length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {currentMedications.map((m, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-800">
                      💊 {m}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-xl">
                  No active medications reported
                </p>
              )}
            </div>

            {/* Allergies & Conditions */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>4. Allergies &amp; Chronic History</span>
                </h4>
                <SourceBadge source={medicalHistorySource} />
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Known Allergies</span>
                  {knownAllergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {knownAllergies.map((a, idx) => (
                        <span key={idx} className="bg-red-50 text-red-900 border border-red-200 font-bold px-2 py-0.5 rounded-lg text-xs">
                          ⚠️ {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No known drug allergies reported</span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pre-Existing Conditions</span>
                  {existingConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {existingConditions.map((c, idx) => (
                        <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-200 font-medium px-2 py-0.5 rounded-lg text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No chronic illnesses reported</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFHIR}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200 shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Export FHIR R4</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
