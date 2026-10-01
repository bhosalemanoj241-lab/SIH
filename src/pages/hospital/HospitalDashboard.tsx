import React, { useState } from 'react';
import { HospitalPortalSuite } from '../../components/admin/HospitalPortalSuite';
import { DoctorDashboard } from '../doctor/DoctorDashboard';
import { Building2, Stethoscope } from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<'OPERATIONS' | 'CLINICAL'>('OPERATIONS');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Hospital Suite Navigation Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentModule('OPERATIONS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentModule === 'OPERATIONS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hospital Operations &amp; Resources</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentModule('CLINICAL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              currentModule === 'CLINICAL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Clinical Triage &amp; Doctor Review</span>
          </button>
        </div>
      </div>

      {currentModule === 'OPERATIONS' ? <HospitalPortalSuite /> : <DoctorDashboard />}
    </div>
  );
};

