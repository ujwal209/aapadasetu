"use client";

import React, { useState } from 'react';
import { 
  Crosshair, 
  Layers, 
  MapPin, 
  ShieldAlert, 
  Radio, 
  Anchor, 
  Info,
  Maximize2
} from 'lucide-react';
import { DisasterAlert, ReliefShelter } from '../types';

interface TacticalRadarMapProps {
  alerts: DisasterAlert[];
  shelters: ReliefShelter[];
  onSelectAlert: (alert: DisasterAlert) => void;
  onSelectShelter: (shelter: ReliefShelter) => void;
}

export const TacticalRadarMap: React.FC<TacticalRadarMapProps> = ({
  alerts,
  shelters,
  onSelectAlert,
  onSelectShelter,
}) => {
  const [filterLayer, setFilterLayer] = useState<'ALL' | 'HAZARDS' | 'SHELTERS' | 'UNITS'>('ALL');
  const [selectedPin, setSelectedPin] = useState<{
    type: 'ALERT' | 'SHELTER' | 'RESCUE';
    title: string;
    details: string;
    coords: string;
    severity?: string;
  } | null>({
    type: 'ALERT',
    title: "Cyclone 'Varuna' Landfall Impact Zone",
    details: "High-risk storm surge of 2.5m with 145km/h wind field. Evacuation active.",
    coords: "19.8135° N, 85.8312° E (Puri Coastal Belt)",
    severity: "CRITICAL",
  });

  const hazardPins = [
    { id: 'h1', x: 620, y: 340, alertId: 'ALT-2026-0901', name: "Cyclone 'Varuna' Eye", radius: 80, severity: 'CRITICAL', type: 'CYCLONE' },
    { id: 'h2', x: 780, y: 190, alertId: 'ALT-2026-0902', name: "Brahmaputra Flood Basin", radius: 60, severity: 'SEVERE', type: 'FLOOD' },
    { id: 'h3', x: 380, y: 490, alertId: 'ALT-2026-0903', name: "Chooralmala Debris Zone", radius: 40, severity: 'CRITICAL', type: 'LANDSLIDE' },
    { id: 'h4', x: 360, y: 160, alertId: 'ALT-2026-0904', name: "Chamoli Seismic Sector", radius: 50, severity: 'MODERATE', type: 'EARTHQUAKE' },
  ];

  const shelterPins = [
    { id: 's1', x: 580, y: 350, shelterId: 'SHL-PURI-01', name: "Puri Cyclone Shelter", capacity: "1,180 / 1,500" },
    { id: 's2', x: 645, y: 320, shelterId: 'SHL-PURI-02', name: "Konark High School Shelter", capacity: "320 / 800" },
    { id: 's3', x: 760, y: 210, shelterId: 'SHL-GHY-01', name: "Guwahati Stadium Camp", capacity: "1,450 / 2,200" },
    { id: 's4', x: 395, y: 510, shelterId: 'SHL-WYD-01', name: "St. Joseph Wayanad Hall", capacity: "540 / 600" },
  ];

  const rescueUnits = [
    { id: 'r1', x: 605, y: 335, name: "NDRF Bravo-04 (Gemini Boat)", task: "Puri Coastal Rescue" },
    { id: 'r2', x: 770, y: 200, name: "SDRF Water Wing 2", task: "Guwahati Evacuation Patrol" },
    { id: 'r3', x: 390, y: 480, name: "Army Engineering Reg 14", task: "Chooralmala Road Clearing" },
  ];

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      {/* Map Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-lg text-red-600 dark:text-red-400">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                GEOSPATIAL SITUATION HUD
              </span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded font-medium">
                GIS COORDINATES
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              National Disaster Management Operations Grid
            </p>
          </div>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs w-full sm:w-auto justify-between sm:justify-start">
          <Layers className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:inline" />
          {(['ALL', 'HAZARDS', 'SHELTERS', 'UNITS'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setFilterLayer(layer)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex-1 sm:flex-initial text-center ${
                filterLayer === layer
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive GIS Surface */}
      <div className="relative w-full h-[320px] sm:h-[420px] bg-slate-100/60 dark:bg-[#070A10] enterprise-grid overflow-hidden flex items-center justify-center select-none">
        {/* Geographic Topography SVG */}
        <svg
          viewBox="0 0 1000 600"
          className="absolute inset-0 w-full h-full object-contain"
        >
          {/* Territory Contour Paths */}
          <path
            d="M 330,80 L 420,110 L 460,160 L 510,190 L 610,210 L 760,180 L 840,210 L 800,280 L 660,320 L 610,380 L 520,440 L 450,540 L 400,560 L 370,500 L 350,380 L 300,280 L 310,160 Z"
            className="fill-slate-200/70 dark:fill-slate-900/80 stroke-slate-300 dark:stroke-slate-700/60"
            strokeWidth="1.5"
          />

          {/* Grid lines */}
          <line x1="200" y1="300" x2="900" y2="300" className="stroke-slate-300/40 dark:stroke-slate-800/40" strokeDasharray="3 3" />
          <line x1="550" y1="50" x2="550" y2="550" className="stroke-slate-300/40 dark:stroke-slate-800/40" strokeDasharray="3 3" />

          {/* Hazard Risk Zones */}
          {(filterLayer === 'ALL' || filterLayer === 'HAZARDS') &&
            hazardPins.map((h) => (
              <g key={h.id} className="cursor-pointer">
                {/* Danger zone impact radius circle */}
                <circle
                  cx={h.x}
                  cy={h.y}
                  r={h.radius}
                  className="fill-red-500/10 dark:fill-red-600/15 stroke-red-500/40 dark:stroke-red-500/50"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                />
                {/* Epicenter Marker */}
                <circle
                  cx={h.x}
                  cy={h.y}
                  r="7"
                  className="fill-red-600 stroke-white dark:stroke-slate-950"
                  strokeWidth="2"
                  onClick={() => {
                    const match = alerts.find((a) => a.id === h.alertId);
                    if (match) onSelectAlert(match);
                    setSelectedPin({
                      type: 'ALERT',
                      title: h.name,
                      details: `Hazard Type: ${h.type} • Impact Radius: ${h.radius * 1.5} km`,
                      coords: `${h.x}E, ${h.y}N (Grid Position)`,
                      severity: h.severity,
                    });
                  }}
                />
                <text
                  x={h.x + 12}
                  y={h.y + 4}
                  className="fill-slate-800 dark:fill-slate-200 text-[10px] font-semibold"
                  fontFamily="var(--font-google-sans)"
                >
                  {h.name}
                </text>
              </g>
            ))}

          {/* Relief Shelter Pins */}
          {(filterLayer === 'ALL' || filterLayer === 'SHELTERS') &&
            shelterPins.map((s) => (
              <g
                key={s.id}
                className="cursor-pointer"
                onClick={() => {
                  const match = shelters.find((sh) => sh.id === s.shelterId);
                  if (match) onSelectShelter(match);
                  setSelectedPin({
                    type: 'SHELTER',
                    title: s.name,
                    details: `Relief Shelter Capacity: ${s.capacity} Occupants • Rations & Medical Available`,
                    coords: `${s.x}E, ${s.y}N (Shelter Sector)`,
                  });
                }}
              >
                <circle cx={s.x} cy={s.y} r="6" className="fill-blue-600 stroke-white dark:stroke-slate-950" strokeWidth="1.5" />
                <text
                  x={s.x + 10}
                  y={s.y + 3}
                  className="fill-slate-600 dark:fill-slate-400 text-[9px] font-medium"
                  fontFamily="var(--font-google-sans)"
                >
                  {s.name}
                </text>
              </g>
            ))}

          {/* Rescue Units */}
          {(filterLayer === 'ALL' || filterLayer === 'UNITS') &&
            rescueUnits.map((r) => (
              <g
                key={r.id}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedPin({
                    type: 'RESCUE',
                    title: r.name,
                    details: `Operation: ${r.task} • Comm Link: VHF Frequency 156.8 MHz`,
                    coords: `${r.x}E, ${r.y}N (Field Vector)`,
                  })
                }
              >
                <polygon
                  points={`${r.x},${r.y - 6} ${r.x + 5},${r.y + 4} ${r.x - 5},${r.y + 4}`}
                  className="fill-emerald-600 stroke-white dark:stroke-slate-950"
                  strokeWidth="1"
                />
              </g>
            ))}
        </svg>

        {/* Selected Pin Telemetry Card */}
        {selectedPin && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-md text-xs z-10 animate-in fade-in">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white text-xs">
                {selectedPin.type === 'ALERT' && <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
                {selectedPin.type === 'SHELTER' && <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                {selectedPin.type === 'RESCUE' && <Anchor className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                <span className="truncate">{selectedPin.title}</span>
              </span>
              {selectedPin.severity && (
                <span className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 text-[10px] font-bold px-1.5 py-0.2 rounded flex-shrink-0">
                  {selectedPin.severity}
                </span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] mb-2 leading-relaxed">
              {selectedPin.details}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-1.5">
              <span className="font-mono">{selectedPin.coords}</span>
              <span className="font-semibold text-red-600 dark:text-red-400">ACTIVE TELEMETRY</span>
            </div>
          </div>
        )}

        {/* Map Legend (Desktop) */}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 hidden md:block shadow-xs">
          <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 border-b border-slate-200 dark:border-slate-800 pb-1">
            Map Legend
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>Disaster Hazard Epicenter</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Designated Safe Shelter</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs" />
            <span>Field Rescue Unit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
