"use client";

import React from 'react';
import { 
  Crosshair, 
  Globe2, 
  Loader2, 
  ShieldAlert, 
  Waves, 
  Mountain, 
  MapPin, 
  Compass 
} from 'lucide-react';
import { INDIA_DISASTER_ZONES, DisasterZone } from '../lib/india-zones';
import { LiveDisaster } from '../types';

interface OperationalRegionsTabProps {
  selectedZoneId: string | null;
  onSelectZone: (zone: DisasterZone | null) => void;
  disasters: LiveDisaster[];
  isScanningSector?: boolean;
}

export const OperationalRegionsTab: React.FC<OperationalRegionsTabProps> = ({
  selectedZoneId,
  onSelectZone,
  disasters = [],
  isScanningSector = false,
}) => {
  // Northern Himalayas is default when selectedZoneId is not specified
  const effectiveId = selectedZoneId ?? 'ZONE-1-HIMALAYAN';
  const selectedZone = INDIA_DISASTER_ZONES.find((z) => z.id === effectiveId) || INDIA_DISASTER_ZONES[0];
  const isContinentalMode = selectedZoneId === null;

  // Compute live incident count per zone
  const getZoneIncidentCount = (zoneId: string) => {
    return disasters.filter((d) => (d as any).zone === zoneId).length;
  };

  const activeZoneIncidents = isContinentalMode 
    ? disasters.length 
    : getZoneIncidentCount(selectedZone.id);

  return (
    <div className="space-y-4 text-neutral-900 dark:text-white font-sans">
      {/* 1. Direct 1-Click Sector Switcher (Rounded, Sleek, Zero Dropdown) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase">Operational Sectors</span>
          </div>
          <button
            onClick={() => onSelectZone(null)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition cursor-pointer flex items-center space-x-1.5 ${
              isContinentalMode 
                ? 'bg-black text-white dark:bg-white dark:text-black font-bold border-black dark:border-white shadow-xs' 
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white bg-neutral-100 dark:bg-neutral-900/90 border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <Globe2 className="w-3 h-3" />
            <span>Continental View</span>
          </button>
        </div>

        {/* 1-Click Sector Switcher Grid with Sleek Rounded Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INDIA_DISASTER_ZONES.map((zone) => {
            const isSelected = !isContinentalMode && selectedZone.id === zone.id;
            const count = getZoneIncidentCount(zone.id);

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onSelectZone(zone)}
                style={{
                  borderColor: isSelected ? zone.color : undefined,
                }}
                className={`p-2.5 rounded-xl text-left transition duration-150 border cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'bg-neutral-50/70 dark:bg-neutral-950/90 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border-neutral-200 dark:border-neutral-800/80'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span 
                    style={{ backgroundColor: zone.color }}
                    className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'animate-pulse' : ''}`}
                  />
                  <span className="text-xs font-bold truncate">
                    {zone.shortName}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono">
                  <span className="truncate opacity-75">{zone.subtitle.split(',')[0]}</span>
                  <span className={`px-1.5 py-0.2 rounded-md ${
                    isSelected 
                      ? 'bg-black text-white dark:bg-white dark:text-black font-bold' 
                      : 'bg-neutral-200 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400'
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Live Scanning Telemetry Indicator */}
      {isScanningSector && (
        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950/90 border border-neutral-200 dark:border-neutral-800 flex items-center space-x-2.5 text-neutral-700 dark:text-neutral-300 text-xs animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-900 dark:text-white shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-wider">
            Fetching real-time satellite & ground telemetry for {selectedZone.name}...
          </span>
        </div>
      )}

      {/* 3. Primary Focused Regional Dossier (Rounded-2xl, Clean & Professional) */}
      {!isContinentalMode ? (
        <div 
          style={{ borderColor: selectedZone.color }}
          className="rounded-2xl bg-white dark:bg-neutral-950/95 border shadow-xl overflow-hidden transition-all duration-200"
        >
          {/* Dossier Header Bar */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-900 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <span 
                style={{ backgroundColor: selectedZone.color }}
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                  Active Operational Sector
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {selectedZone.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => onSelectZone(selectedZone)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition cursor-pointer flex items-center space-x-1.5 shrink-0 shadow-xs"
              title="Recenter camera on this sector"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Recenter</span>
            </button>
          </div>

          {/* Geological & Hydrological Summary */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-900">
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {selectedZone.description}
            </p>
          </div>

          {/* Detailed Regional Specification Breakdown */}
          <div className="divide-y divide-neutral-200 dark:divide-neutral-900 text-xs">
            {/* Territory Jurisdiction */}
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block font-semibold flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                <span>Territorial Scope & States Covered</span>
              </span>
              <p className="text-xs text-neutral-900 dark:text-white font-medium">
                {selectedZone.subtitle}
              </p>
            </div>

            {/* Monitored River Basins */}
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block font-semibold flex items-center space-x-1.5">
                <Waves className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                <span>Monitored River Basins & Waterways</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedZone.keyBasins.map((basin, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
                  >
                    {basin}
                  </span>
                ))}
              </div>
            </div>

            {/* Vulnerable Mountain & Highway Slopes */}
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block font-semibold flex items-center space-x-1.5">
                <Mountain className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                <span>Vulnerable Highway & Landslide Corridors</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedZone.keyLandslideCorridors.map((corridor, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
                  >
                    {corridor}
                  </span>
                ))}
              </div>
            </div>

            {/* Threat Dynamics */}
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block font-semibold flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                <span>Primary Disaster Dynamics</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedZone.primaryThreats.map((threat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-300 font-semibold"
                  >
                    {threat}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Hazard Count */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">Active Verified Hazards (Past 7 Days)</span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                {activeZoneIncidents} Verified
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Continental Mode Banner */
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/95 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe2 className="w-5 h-5 text-neutral-900 dark:text-white" />
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Full Continental Surveillance</h4>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Simultaneous monitoring across all 5 disaster operational commands</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black">
            {disasters.length} HAZARDS
          </span>
        </div>
      )}
    </div>
  );
};
