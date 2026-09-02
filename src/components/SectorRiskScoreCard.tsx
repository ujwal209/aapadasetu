"use client";

import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  Activity,
  FileCheck
} from 'lucide-react';

interface SectorRiskScoreCardProps {
  score: number;
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  locationName: string;
  weather?: {
    temperature_c?: number;
    wind_speed_kmh?: number;
    precipitation_mm?: number;
  } | null;
  corroboratingSourcesCount: number;
  hasFatalities?: boolean;
  hasEvacuation?: boolean;
  nearestQuake?: {
    place: string;
    magnitude: number;
    distanceKm: number;
  };
}

export const SectorRiskScoreCard: React.FC<SectorRiskScoreCardProps> = ({
  score,
  level,
  locationName,
  weather,
  corroboratingSourcesCount,
  hasFatalities = false,
  hasEvacuation = false,
  nearestQuake,
}) => {
  const severityBadge = 
    level === 'CRITICAL' ? { text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/15', bar: 'bg-rose-500' } :
    level === 'HIGH' ? { text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/15', bar: 'bg-orange-500' } :
    level === 'MODERATE' ? { text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/15', bar: 'bg-amber-500' } :
    { text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/15', bar: 'bg-emerald-500' };

  return (
    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-2.5 font-sans select-text shadow-xs">
      {/* 1. Header & Score Row */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 block">
            Multi-Hazard Risk Assessment
          </span>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">
            {locationName}
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${severityBadge.bg} ${severityBadge.border} ${severityBadge.text}`}>
            {level}
          </span>
          <div className="text-right font-mono">
            <span className={`text-xl font-black ${severityBadge.text}`}>{score}</span>
            <span className="text-[10px] text-neutral-400 font-normal">/100</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Progress Bar */}
      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full ${severityBadge.bar} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(6, score))}%` }}
        />
      </div>

      {/* 3. 4 Ultra-Dense Verification Status Badges */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-0.5">
        <div className="flex items-center space-x-1.5 p-1.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          {hasFatalities ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          )}
          <span className="truncate text-neutral-700 dark:text-neutral-300">
            {hasFatalities ? 'Casualties Reported' : 'Zero Casualties'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 p-1.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Radio className={`w-3.5 h-3.5 flex-shrink-0 ${hasEvacuation ? 'text-red-500 animate-pulse' : 'text-neutral-400'}`} />
          <span className="truncate text-neutral-700 dark:text-neutral-300">
            {hasEvacuation ? 'Evacuation Ordered' : 'Corridors Normal'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 p-1.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Activity className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <span className="truncate text-neutral-700 dark:text-neutral-300 font-mono text-[10px]">
            {weather?.precipitation_mm ?? 0}mm • {weather?.wind_speed_kmh ?? 0}km/h
          </span>
        </div>

        <div className="flex items-center space-x-1.5 p-1.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <FileCheck className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          <span className="truncate text-neutral-700 dark:text-neutral-300 font-mono text-[10px]">
            {nearestQuake ? `M${nearestQuake.magnitude.toFixed(1)} (${nearestQuake.distanceKm}km)` : 'Seismic: Stable'}
          </span>
        </div>
      </div>
    </div>
  );
};
