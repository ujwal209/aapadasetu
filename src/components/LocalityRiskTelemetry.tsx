"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Radar, 
  Wind, 
  Droplets, 
  Thermometer,
  AlertTriangle, 
  X, 
  ChevronUp, 
  ChevronDown, 
  RefreshCw,
  Move,
  Newspaper,
  ExternalLink,
  Loader2,
  FileText,
  ShieldAlert,
  Activity,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { api } from '../lib/api';

export interface LocalityRiskData {
  localityName: string;
  weather: {
    temperature_c: number;
    wind_speed_kmh: number;
    wind_gusts_kmh: number;
    precipitation_mm: number;
    humidity_pct: number;
  };
  irregularities: Array<{
    type: 'FLOOD' | 'SEISMIC' | 'WIND' | 'HEAT' | 'NORMAL';
    severity: 'CRITICAL' | 'WARNING' | 'STABLE';
    title: string;
    description: string;
  }>;
  overallRiskScore: number;
  overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  nearestQuake?: {
    place: string;
    magnitude: number;
    distanceKm: number;
  };
}

interface LocalityRiskTelemetryProps {
  data: LocalityRiskData | null;
  coordinates?: { lat: number; lon: number } | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onClose?: () => void;
}

export const LocalityRiskTelemetry: React.FC<LocalityRiskTelemetryProps> = ({
  data,
  coordinates,
  isLoading,
  onRefresh,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'WEB_INTEL'>('TELEMETRY');

  // Draggable window state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Web search & AI analysis state
  const [searchData, setSearchData] = useState<{
    ai_analysis: string;
    articles: Array<{
      title: string;
      url: string;
      snippet: string;
      domain: string;
      source_name?: string;
      favicon: string;
      published_time?: string;
    }>;
  } | null>(null);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  // Set default initial position on mount (top right, responsive)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (!mobile && position === null) {
        const initialX = Math.max(16, window.innerWidth - 540);
        const initialY = 80;
        setPosition({ x: initialX, y: initialY });
      }
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [position]);

  // Execute web search with exact latitude and longitude whenever locality or coordinates change
  useEffect(() => {
    if (!data?.localityName) return;
    setIsSearchingWeb(true);
    api.getIntelSearch(
      data.localityName, 
      data.localityName, 
      coordinates?.lat, 
      coordinates?.lon
    )
      .then((res) => setSearchData(res))
      .catch((err) => console.error("Telemetry web search error:", err))
      .finally(() => setIsSearchingWeb(false));
  }, [data?.localityName, coordinates?.lat, coordinates?.lon]);

  // Window Drag Event Listeners (Desktop only)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile || !containerRef.current || !position) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;

      const newX = Math.max(10, Math.min(window.innerWidth - 500, dragStartRef.current.posX + deltaX));
      const newY = Math.max(70, Math.min(window.innerHeight - 200, dragStartRef.current.posY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!data) return null;

  return (
    <div
      ref={containerRef}
      style={!isMobile && position ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
      } : undefined}
      className={`fixed z-40 ${
        isMobile
          ? 'inset-x-2 bottom-3 max-h-[85vh] w-[calc(100vw-1rem)]'
          : 'sm:w-[500px] lg:w-[520px] sm:max-h-[82vh]'
      } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden select-none pointer-events-auto text-slate-900 dark:text-white animate-in slide-in-from-bottom-3 sm:slide-in-from-top-3 duration-200 flex flex-col`}
    >
      {/* Draggable Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        className={`px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 ${!isMobile ? 'cursor-move' : ''} transition-colors ${
          isDragging ? 'bg-blue-950 border-blue-600' : ''
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Radar className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300">
                20km Sector HUD
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <Move className="w-3 h-3 text-slate-400 opacity-60" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold truncate max-w-[200px]">
              {data.localityName}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Real-World APIs"
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand HUD" : "Collapse HUD"}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close Telemetry"
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Sub Navigation: Telemetry vs Live Web Search & AI Analysis */}
          <div className="grid grid-cols-2 gap-1 p-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('TELEMETRY')}
              className={`py-1.5 rounded-xl transition ${
                activeTab === 'TELEMETRY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Sensors &amp; Surrounding Risk
            </button>
            <button
              onClick={() => setActiveTab('WEB_INTEL')}
              className={`py-1.5 rounded-xl transition flex items-center justify-center space-x-1 ${
                activeTab === 'WEB_INTEL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Newspaper className="w-3 h-3" />
              <span>Web Intel &amp; AI Analysis</span>
            </button>
          </div>

          <div className="p-4 space-y-3.5 text-xs max-h-[72vh] overflow-y-auto">
            {activeTab === 'TELEMETRY' && (
              <>
                {/* Composite Risk Header */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      Surrounding Risk Level (Real-World APIs)
                    </span>
                    <strong className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {data.overallRiskLevel} • Score {data.overallRiskScore}/100
                    </strong>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[9px] text-slate-500 block">Radius</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">20 km Perimeter</span>
                  </div>
                </div>

                {/* Real-time Atmospheric Metrics */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Live Atmospheric Telemetry
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Temp</span>
                      <strong className="text-xs font-bold">{data.weather.temperature_c}°C</strong>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Wind</span>
                      <strong className="text-xs font-bold">{data.weather.wind_speed_kmh}k</strong>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Rain Rate</span>
                      <strong className={`text-xs font-bold ${data.weather.precipitation_mm > 5 ? 'text-blue-600' : ''}`}>
                        {data.weather.precipitation_mm}mm
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Humidity</span>
                      <strong className="text-xs font-bold">{data.weather.humidity_pct}%</strong>
                    </div>
                  </div>
                </div>

                {/* Real-World Surrounding Risk Irregularities */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Surrounding Hazards &amp; Irregularities
                  </span>
                  <div className="space-y-2">
                    {data.irregularities.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 space-y-1 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            {item.title}
                          </span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* USGS Seismic Telemetry */}
                {data.nearestQuake && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">USGS Seismic Feed Proximity</span>
                      <span className="font-semibold truncate max-w-[210px] block">
                        {data.nearestQuake.place}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        M {data.nearestQuake.magnitude.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{data.nearestQuake.distanceKm} km</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'WEB_INTEL' && (
              <div className="space-y-3">
                {isSearchingWeb ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="font-semibold">Searching Real-Time Web &amp; Analyzing Threats...</span>
                  </div>
                ) : searchData ? (
                  <>
                    {/* 1. Operational Situation Analysis */}
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-2.5 shadow-xs">
                      <div className="flex items-center space-x-1.5 text-neutral-900 dark:text-neutral-100">
                        <FileText className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Operational Situation Analysis
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {searchData.ai_analysis}
                      </p>
                    </div>

                    {/* 2. Real-Time Web Search Sources with Favicons */}
                    <div className="space-y-3 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Verified Web Reports &amp; Dispatches ({searchData.articles.length})
                      </span>
                      <div className="space-y-3">
                        {searchData.articles.map((art: any, aIdx) => (
                          <a
                            key={aIdx}
                            href={art.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition group space-y-2 shadow-xs"
                          >
                            {/* Real Image if available */}
                            {art.image && (
                              <div className="h-32 w-full overflow-hidden rounded-xl bg-slate-900 mb-1 relative">
                                <img
                                  src={art.image}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={art.favicon}
                                  alt=""
                                  className="w-4 h-4 rounded-full flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                  {art.source_name || art.domain}
                                </span>
                              </div>
                              {art.published_time && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  {art.published_time}
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                              {art.title}
                            </h4>

                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                              {art.deep_text || art.snippet}
                            </p>

                            <div className="flex items-center justify-end text-xs text-blue-600 dark:text-blue-400 font-bold pt-1">
                              <span className="flex items-center space-x-1">
                                <span>Read Verified Dispatch</span>
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No web dispatches available for this sector.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
