"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Crosshair, 
  Globe2, 
  Loader2, 
  ShieldAlert, 
  Waves, 
  Mountain, 
  MapPin, 
  ChevronDown,
  Check 
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
  // Custom Dropdown State & Ref
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Click outside and escape key handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <div className="space-y-4 text-neutral-900 dark:text-white font-sans">
      {/* 1. Executive Sector Dropdown Selector (Custom SaaS Component) */}
      <div className="space-y-1.5" ref={dropdownRef}>
        <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold uppercase">Operational Sector</span>
          <span className="text-[10px] text-neutral-400">
            {isContinentalMode ? 'All Sectors' : selectedZone.name}
          </span>
        </div>

        <div className="relative">
          {/* Custom Trigger Button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full bg-white dark:bg-black text-neutral-900 dark:text-white border rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between shadow-xs transition cursor-pointer select-none ${
              isDropdownOpen 
                ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/10' 
                : 'border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              {isContinentalMode ? (
                <Globe2 className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300 shrink-0" />
              ) : (
                <span 
                  style={{ backgroundColor: selectedZone.color }}
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                />
              )}
              <span className="truncate text-left font-bold">
                {isContinentalMode 
                  ? 'All Continental Sectors (India & Neighboring Basins)' 
                  : selectedZone.name}
              </span>
            </div>

            <div className="flex items-center space-x-2 shrink-0 ml-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                {activeZoneIncidents} hazards
              </span>
              <ChevronDown 
                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-neutral-900 dark:text-white' : ''
                }`} 
              />
            </div>
          </button>

          {/* Custom Dropdown Popover Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden py-1 divide-y divide-neutral-100 dark:divide-neutral-900 animate-in fade-in zoom-in-95 duration-100">
              {/* Option: Continental Surveillance */}
              <button
                type="button"
                onClick={() => {
                  onSelectZone(null);
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between transition cursor-pointer ${
                  isContinentalMode 
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold' 
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Globe2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs truncate block">All Continental Sectors</span>
                    <span className="text-[10px] text-neutral-500 font-mono block">Complete Subcontinent Surveillance</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {disasters.length}
                  </span>
                  {isContinentalMode && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                </div>
              </button>

              {/* Individual Sectors */}
              <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                {INDIA_DISASTER_ZONES.map((zone) => {
                  const isSelected = !isContinentalMode && selectedZone.id === zone.id;
                  const count = getZoneIncidentCount(zone.id);

                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        onSelectZone(zone);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between transition cursor-pointer ${
                        isSelected 
                          ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold' 
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span 
                          style={{ backgroundColor: zone.color }}
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                        />
                        <div className="min-w-0">
                          <span className="text-xs truncate block font-semibold">
                            {zone.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono block truncate">
                            {zone.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {count}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Live Scanning Telemetry Indicator */}
      {isScanningSector && (
        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center space-x-2.5 text-neutral-700 dark:text-neutral-300 text-xs animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-900 dark:text-white shrink-0" />
          <span className="text-[11px] font-mono uppercase tracking-wider">
            Fetching telemetry for {selectedZone.name}...
          </span>
        </div>
      )}

      {/* 3. Primary Sector Information Dossier */}
      {!isContinentalMode ? (
        <div 
          style={{ borderColor: selectedZone.color }}
          className="rounded-2xl bg-white dark:bg-neutral-950 border shadow-lg overflow-hidden transition-all duration-200"
        >
          {/* Dossier Header Bar */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
            <div className="flex items-center space-x-3 min-w-0">
              <span 
                style={{ backgroundColor: selectedZone.color }}
                className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                  Active Command Sector
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {selectedZone.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => onSelectZone(selectedZone)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition cursor-pointer flex items-center space-x-1.5 shrink-0 shadow-xs active:scale-95"
              title="Recenter camera on this sector"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Recenter</span>
            </button>
          </div>

          {/* Geological & Hydrological Summary */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {selectedZone.description}
            </p>
          </div>

          {/* Detailed Specification Breakdown (Strict Monochrome Black & White) */}
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
            {/* Territory Jurisdiction */}
            <div className="p-4 space-y-1.5">
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

            {/* Primary Hazard Vectors */}
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block font-semibold flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                <span>Primary Disaster Dynamics</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedZone.primaryThreats.map((threat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
                  >
                    {threat}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Hazard Count */}
            <div className="p-4 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">Active Verified Hazards (Past 7 Days)</span>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-xs">
                {activeZoneIncidents} Verified
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Continental Mode Overview */
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe2 className="w-5 h-5 text-neutral-900 dark:text-white" />
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Continental Surveillance Active</h4>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Monitoring all 5 operational sectors and border corridors</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black">
              {disasters.length} HAZARDS
            </span>
          </div>

          <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800 overflow-hidden shadow-sm">
            {INDIA_DISASTER_ZONES.map((zone) => {
              const count = getZoneIncidentCount(zone.id);
              return (
                <button
                  key={zone.id}
                  onClick={() => onSelectZone(zone)}
                  className="w-full p-3.5 text-left flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span 
                      style={{ backgroundColor: zone.color }}
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white block truncate">
                        {zone.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate block">
                        {zone.subtitle}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0 ml-2">
                    {count} hazards
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
