import React from 'react';
import { PhoneCall } from 'lucide-react';
import { EMERGENCY_HELPLINES } from '../lib/mock-data';

export const EmergencyDirectory: React.FC = () => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 rounded-lg text-blue-600 dark:text-blue-400">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              24/7 EMERGENCY HELPLINE DIRECTORY
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Immediate Voice Dispatch Hotlines for Citizens &amp; Responders
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {EMERGENCY_HELPLINES.map((hl, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl transition flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {hl.name}
                </h3>
                {hl.tollFree && (
                  <span className="text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded">
                    Toll-Free
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {hl.desc}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                {hl.number}
              </span>
              <a
                href={`tel:${hl.number}`}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
