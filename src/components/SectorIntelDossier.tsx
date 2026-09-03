"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Shield, 
  ExternalLink, 
  Loader2, 
  Newspaper, 
  FileText, 
  Activity, 
  Phone, 
  Home, 
  Clock, 
  ChevronDown, 
  Radar, 
  Crosshair, 
  Radio,
  MapPin
} from 'lucide-react';
import { InspectItem } from './PlaceDetailCard';
import { SectorRiskScoreCard } from './SectorRiskScoreCard';
import { GoogleMapsPlaceView } from './GoogleMapsPlaceView';
import { api } from '../lib/api';
import { LiveDisaster } from '../types';

interface SectorCacheData {
  images: string[];
  articles: Array<{
    title: string;
    url: string;
    snippet: string;
    deep_text?: string;
    domain: string;
    source_name?: string;
    favicon: string;
    image?: string | null;
    published_time?: string;
  }>;
  aiOverview: string | null;
  liveSensors: {
    temperature_c?: number;
    wind_speed_kmh?: number;
    precipitation_mm?: number;
  } | null;
  reliefData: {
    camps: Array<{ name: string; type: string; address: string; phone: string; capacity: string; status: string }>;
    helplines: Array<{ service: string; number: string }>;
  } | null;
  riskAssessment: {
    overallRiskScore: number;
    overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    nearestQuake?: { place: string; magnitude: number; distanceKm: number };
  } | null;
}

// Global In-Memory Cache (Persists across tab navigation to eliminate re-fetching & save AI credits)
const sectorCache = new Map<string, SectorCacheData>();

interface SectorIntelDossierProps {
  item: InspectItem | null;
  currentSector?: {
    name?: string;
    locality?: string;
    parentCity?: string;
    lat: number;
    lon: number;
  } | null;
  userLocation?: { lat: number; lon: number; locality?: string } | null;
  onFlyTo: (lat: number, lon: number, zoom?: number) => void;
  onNavigate?: (route: any) => void;
  onClearRoute?: () => void;
  onTriggerSos: () => void;
  onClose?: () => void;
  onRiskAssessmentUpdated?: (data: any) => void;
  disasters?: LiveDisaster[];
}

export const SectorIntelDossier: React.FC<SectorIntelDossierProps> = ({
  item,
  currentSector,
  userLocation,
  onFlyTo,
  onNavigate,
  onClearRoute,
  onTriggerSos,
  onClose,
  onRiskAssessmentUpdated,
  disasters = [],
}) => {
  // 1. Google Maps Place Overview is the primary first tab
  const [activeDossierTab, setActiveDossierTab] = useState<'place' | 'wire' | 'ai' | 'relief'>('place');

  const [articles, setArticles] = useState<Array<{
    title: string;
    url: string;
    snippet: string;
    deep_text?: string;
    domain: string;
    source_name?: string;
    favicon: string;
    image?: string | null;
    published_time?: string;
  }>>([]);
  const [aiOverview, setAiOverview] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [liveSensors, setLiveSensors] = useState<{
    temperature_c?: number;
    wind_speed_kmh?: number;
    precipitation_mm?: number;
  } | null>(null);
  const [reliefData, setReliefData] = useState<{
    camps: Array<{ name: string; type: string; address: string; phone: string; capacity: string; status: string }>;
    helplines: Array<{ service: string; number: string }>;
  } | null>(null);
  const [isLoadingRelief, setIsLoadingRelief] = useState<boolean>(false);
  const [visibleWireCount, setVisibleWireCount] = useState<number>(8);
  const images = useMemo(() => articles.map((a) => a.image).filter((img): img is string => Boolean(img)), [articles]);

  // Dynamic 20km Risk Data
  const [riskAssessment, setRiskAssessment] = useState<{
    overallRiskScore: number;
    overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    nearestQuake?: { place: string; magnitude: number; distanceKm: number };
  } | null>(null);

  // Dynamic reverse-geocoded location for exact administrative display
  const [resolvedLocation, setResolvedLocation] = useState<string | null>(null);

  // Helper to extract clean city/town name (first token of comma-separated address)
  const extractCleanCity = (str?: string): string => {
    if (!str) return '';
    // Strip distance prefixes like "24 km SW of Wayanad" or "10 km NW of Puri"
    const cleaned = str.replace(/^[\d\s\w\.\-]+of\s+/i, '').replace(/[\(\)]/g, '').trim();
    const parts = cleaned.split(/[,-]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return '';
    // If the first part is a number or postal code, take the second
    if (/^\d+/.test(parts[0]) && parts.length > 1) {
      return parts[1];
    }
    return parts[0];
  };

  const rawName = useMemo(() => {
    if (item) {
      if (item.type === 'CITY') return item.data.name;
      if (item.type === 'PLACE') return item.name || item.displayName;
      if (item.type === 'SHELTER') return item.data.name;
      if (item.type === 'DISASTER') return item.data.place || item.data.title;
      if (item.type === 'QUAKE') return item.data.place;
    }
    return currentSector?.locality || currentSector?.name || 'Active Sector';
  }, [item, currentSector]);

  const parentCity = useMemo(() => {
    if (item) {
      if (item.type === 'CITY') return item.data.name;
      if (item.type === 'PLACE') return item.parentCity || extractCleanCity(item.displayName) || item.name;
      if (item.type === 'SHELTER') return item.data.district || extractCleanCity(item.data.name);
      if (item.type === 'DISASTER') {
        const clean = extractCleanCity(item.data.place);
        return clean || extractCleanCity(item.data.title) || 'Disaster Zone';
      }
      if (item.type === 'QUAKE') return extractCleanCity(item.data.place);
    }
    const cand = currentSector?.parentCity || currentSector?.name || currentSector?.locality;
    if (cand && !['Active Sector', 'Designated Sector', 'Local Sector'].includes(cand)) {
      return extractCleanCity(cand);
    }
    return 'India';
  }, [item, currentSector]);

  const lat = item
    ? item.type === 'CITY' ? item.data.latitude
    : item.type === 'SHELTER' ? item.data.latitude
    : item.type === 'DISASTER' ? item.data.latitude
    : item.type === 'QUAKE' ? item.data.latitude
    : item.type === 'PLACE' ? item.lat
    : currentSector?.lat ?? 20.5937
    : currentSector?.lat ?? 20.5937;

  const lon = item
    ? item.type === 'CITY' ? item.data.longitude
    : item.type === 'SHELTER' ? item.data.longitude
    : item.type === 'DISASTER' ? item.data.longitude
    : item.type === 'QUAKE' ? item.data.longitude
    : item.type === 'PLACE' ? item.lon
    : currentSector?.lon ?? 78.9629
    : currentSector?.lon ?? 78.9629;

  const locality = (item as any)?.locality || currentSector?.locality || rawName;
  const isHazard = item?.type === 'DISASTER' || item?.type === 'QUAKE';
  const hazardId = item?.type === 'DISASTER' ? item.data.id : item?.type === 'QUAKE' ? item.data.id : '';
  const cacheKey = `${isHazard ? hazardId : (parentCity || 'india').toLowerCase().trim()}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const lastFetchedKeyRef = useRef<string>('');
  const onRiskUpdatedRef = useRef(onRiskAssessmentUpdated);

  // Compute real-time distance from user's current GPS location
  const distanceFromUserKm = useMemo(() => {
    if (!userLocation) return null;
    const dLat = ((lat - userLocation.lat) * Math.PI) / 180;
    const dLon = ((lon - userLocation.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [userLocation, lat, lon]);

  useEffect(() => {
    onRiskUpdatedRef.current = onRiskAssessmentUpdated;
  }, [onRiskAssessmentUpdated]);

  // Reverse-geocode to ensure verified administrative locality is always known
  useEffect(() => {
    let isMounted = true;
    if (item && (item.type === 'DISASTER' || item.type === 'QUAKE' || item.type === 'PLACE')) {
      api.reverseGeocode(lat, lon)
        .then((geo) => {
          if (!isMounted) return;
          if (geo && (geo.city || geo.locality || geo.state)) {
            const locTokens = [geo.locality, geo.city, geo.state, geo.country].filter(Boolean);
            const dedupedTokens = Array.from(new Set(locTokens));
            setResolvedLocation(dedupedTokens.slice(0, 3).join(', '));
          }
        })
        .catch(() => {});
    } else {
      setResolvedLocation(null);
    }
    return () => { isMounted = false; };
  }, [item, lat, lon]);

  useEffect(() => {
    if (!parentCity) return;

    // GUARD: If this sector and coordinates were already fetched, DO NOT fetch again!
    if (lastFetchedKeyRef.current === cacheKey) {
      return;
    }
    lastFetchedKeyRef.current = cacheKey;

    // Reset previous city state immediately so previous city's briefing never lingers
    setAiOverview(null);
    setArticles([]);
    setReliefData(null);
    setRiskAssessment(null);
    setIsLoadingAi(true);

    const hazardTitle = item?.type === 'DISASTER' ? item.data.title : item?.type === 'QUAKE' ? item.data.title : undefined;
    const hazardType = item?.type === 'DISASTER' ? item.data.disaster_type : item?.type === 'QUAKE' ? 'EARTHQUAKE' : undefined;

    // Fetch fresh live multi-hazard intel and atmospheric sensors (100% Pure Tavily with parent city priority)
    const pWeather = api.getLiveCityWeather(lat, lon).catch(() => null);
    const pIntel = api.getIntelSearch(
      parentCity,
      parentCity,
      lat,
      lon,
      parentCity,
      hazardTitle,
      hazardType
    ).catch(() => ({ ai_analysis: null, articles: [] }));

    Promise.all([pWeather, pIntel]).then(([w, intel]) => {
      const fetchedSensors = w ? {
        temperature_c: w.temperature_c,
        wind_speed_kmh: w.wind_speed_kmh,
        precipitation_mm: w.precipitation_mm,
      } : null;

      // Risk score is calculated from hazard metadata, AI intelligence, or environmental baseline
      let fetchedRisk = null;
      if (intel && (intel as any).risk_evidence) {
        fetchedRisk = {
          overallRiskScore: (intel as any).risk_evidence.score,
          overallRiskLevel: (intel as any).risk_evidence.level,
        };
      } else if (item?.type === 'DISASTER') {
        const sev = ((item as any).data?.severity || '').toUpperCase();
        const isCrit = sev === 'CRITICAL' || sev === 'SEVERE';
        const isHigh = sev === 'HIGH' || sev === 'WARNING';
        fetchedRisk = {
          overallRiskScore: isCrit ? 92 : isHigh ? 78 : 65,
          overallRiskLevel: (isCrit ? 'CRITICAL' : isHigh ? 'HIGH' : 'MODERATE') as any,
        };
      } else if (item?.type === 'QUAKE') {
        const mag = Number((item as any).data?.magnitude || 0);
        const isCrit = mag >= 5.0;
        const isHigh = mag >= 3.5;
        fetchedRisk = {
          overallRiskScore: isCrit ? 90 : isHigh ? 74 : 52,
          overallRiskLevel: (isCrit ? 'CRITICAL' : isHigh ? 'HIGH' : 'MODERATE') as any,
        };
      } else if (intel && intel.articles && intel.articles.length > 0) {
        const combined = intel.articles.map(a => `${a.title} ${a.snippet}`).join(' ').toLowerCase();
        const isCrit = /(dead|fatal|catastroph|emergency|landslide|submerged|critical|breach)/.test(combined);
        const isHigh = /(flood|cyclone|warning|evacuat|heavy rain|damage|deluge)/.test(combined);
        fetchedRisk = {
          overallRiskScore: isCrit ? 88 : isHigh ? 72 : 48,
          overallRiskLevel: (isCrit ? 'CRITICAL' : isHigh ? 'HIGH' : 'MODERATE') as any,
        };
      } else {
        // High terrain hazard sector fallback (Himalayan / Northeast)
        const isHimalayanOrNe = lat >= 26.0 && (lon <= 82.0 || lon >= 88.0);
        fetchedRisk = {
          overallRiskScore: isHimalayanOrNe ? 68 : 38,
          overallRiskLevel: (isHimalayanOrNe ? 'HIGH' : 'MODERATE') as any,
        };
      }

      if (fetchedRisk && onRiskUpdatedRef.current) {
        onRiskUpdatedRef.current(fetchedRisk);
      }

      const fetchedArticles = intel?.articles || [];
      const fetchedAi = intel?.ai_analysis || null;

      // Update State
      setLiveSensors(fetchedSensors);
      setRiskAssessment(fetchedRisk);
      setArticles(fetchedArticles);
      setAiOverview(fetchedAi);
      setVisibleWireCount(8);
      setIsLoadingAi(false);
    });
  }, [cacheKey, parentCity, lat, lon, item]);

  // 3. LAZY-LOAD REAL-TIME RELIEF FACILITIES: Only fetched if and when the user visits the relief tab
  useEffect(() => {
    if (activeDossierTab === 'relief' && !reliefData && parentCity) {
      setIsLoadingRelief(true);
      api.getReliefCampsForSector(parentCity, lat, lon)
        .then((data) => {
          setReliefData(data);
          // Update cache with relief data
          const existing = sectorCache.get(cacheKey);
          if (existing) {
            existing.reliefData = data;
          }
        })
        .finally(() => {
          setIsLoadingRelief(false);
        });
    }
  }, [activeDossierTab, parentCity, lat, lon, reliefData, cacheKey]);

  // Evaluate casualty and evacuation flags
  const combinedText = articles.map((a) => `${a.title} ${a.snippet} ${a.deep_text || ''}`).join(' ').toLowerCase();
  const hasFatalities = /\b(death|deaths|killed|fatalit|dead|loss of life|drowned|crushed)\b/.test(combinedText);
  const hasEvacuation = /\b(evacuat|relocat|shifted to shelter|relief camp open)\b/.test(combinedText);
  const distinctSourcesCount = new Set(articles.map((a) => a.domain)).size;

  // Clean Markdown & Pre-Process linebreaks
  const cleanMarkdown = (aiOverview || '')
    .replace(/<br\s*\/?>/gi, '\n\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<\/?p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u2011/g, '-')
    .replace(/\u202f/g, ' ')
    .replace(/\|\s*\|/g, '|\n|');

  return (
    <div className="flex flex-col h-full space-y-3 text-neutral-900 dark:text-neutral-100 font-sans pb-8 select-text">
      {/* 1. Sector Identity Header (Space-Conserving, No Lat/Long) */}
      <div className="p-2.5 sm:p-3 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 flex-shrink-0 mt-0.5 bg-white dark:bg-black p-0.5">
              <img src="/logobgwhite.png" alt="Aapda Setu" className="w-full h-full object-contain block dark:hidden" />
              <img src="/logobgblack.png" alt="Aapda Setu" className="w-full h-full object-contain hidden dark:block" />
            </div>
            <div>
              {item?.type === 'DISASTER' ? (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                      Active Hazard • {item.data.disaster_type}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold">
                      {item.data.severity}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-0.5 leading-snug">
                    {item.data.title}
                  </h2>
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                    <span>{resolvedLocation || item.data.place}</span>
                  </span>
                </>
              ) : item?.type === 'QUAKE' ? (
                <>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-widest block font-bold">
                    Seismic Telemetry • M{item.data.magnitude.toFixed(1)}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-0.5">
                    {item.data.place}
                  </h2>
                  {resolvedLocation && (
                    <span className="text-[11px] text-neutral-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      <span>{resolvedLocation}</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mt-0.5">
                    {parentCity || "Sector Area"}
                  </h2>
                  {(resolvedLocation || (rawName && rawName !== parentCity)) && (
                    <span className="text-[11px] text-neutral-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      <span>{resolvedLocation || rawName}</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {distanceFromUserKm !== null && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                {distanceFromUserKm} km away
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              {distinctSourcesCount > 0 ? `${distinctSourcesCount} Feeds` : 'Live Telemetry'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Enterprise Segmented Sub-Tab Bar (Briefing is strictly SECOND TAB) */}
      <div className="grid grid-cols-4 p-1 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg gap-1 flex-shrink-0">
        {[
          { id: 'place', label: 'Overview', fullLabel: 'Place Photos, Weather & Temperature Graph', icon: MapPin },
          { id: 'ai', label: 'Briefing', fullLabel: 'Situation Briefing', icon: FileText },
          { id: 'wire', label: 'News Wire', fullLabel: 'Live Verified News (Past 7 Days)', icon: Newspaper },
          { id: 'relief', label: 'Shelters', fullLabel: 'Nearest Relief Camps & Safe Shelters', icon: Home },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeDossierTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDossierTab(tab.id as any)}
              title={tab.fullLabel}
              className={`flex items-center justify-center space-x-1 py-1.5 px-1 rounded-md text-[11px] font-medium transition text-center ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs border border-neutral-300 dark:border-neutral-700'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. VIEW 1: GOOGLE MAPS PLACE OVERVIEW (Photos, Weather, Rain Chance, 6-Day Temperature Graph, Nearby Alerts) */}
      {activeDossierTab === 'place' && (
        <GoogleMapsPlaceView
          placeName={rawName}
          parentCity={parentCity}
          locality={locality}
          resolvedLocation={resolvedLocation || undefined}
          lat={lat}
          lon={lon}
          userLocation={userLocation}
          onFlyTo={onFlyTo}
          onNavigate={onNavigate}
          onClearRoute={onClearRoute}
          onTriggerSos={onTriggerSos}
          nearbyDisasters={disasters}
          photos={images}
          reliefCamps={reliefData?.camps}
        />
      )}

      {/* 4. VIEW 2: SITUATION BRIEFING */}
      {activeDossierTab === 'ai' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-800 text-[11px]">
            <span className="font-mono uppercase tracking-wider font-semibold text-neutral-600 dark:text-neutral-400">
              Operational Situation Synthesis
            </span>
            <span className="font-mono text-neutral-400">
              Verified Intelligence
            </span>
          </div>

          {/* AI Synthesis Rendered with Clean Markdown */}
          {isLoadingAi ? (
            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-2 animate-pulse">
              <div className="flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black dark:text-white" />
                <span>Synthesizing multi-source casualty and atmospheric evidence...</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full w-4/5" />
              <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full w-3/5" />
            </div>
          ) : aiOverview ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 font-sans shadow-xs overflow-x-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h3 className="text-sm font-bold mt-2.5 mb-1.5 text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-1" {...props} />,
                    h2: ({node, ...props}) => <h4 className="text-xs font-bold mt-2 mb-1 text-neutral-900 dark:text-neutral-100" {...props} />,
                    h3: ({node, ...props}) => <h5 className="text-xs font-semibold mt-2 mb-0.5 text-neutral-700 dark:text-neutral-300 uppercase font-mono tracking-wide" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="text-[11px] leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-neutral-900 dark:text-white" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-2.5 border-neutral-200 dark:border-neutral-800" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="p-2 border-l-2 border-neutral-500 bg-neutral-100 dark:bg-neutral-900 text-[11px] my-2 rounded-r-md italic" {...props} />,
                    table: ({node, ...props}) => <div className="my-3 overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-md"><table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-[11px]" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 font-mono" {...props} />,
                    tbody: ({node, ...props}) => <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-black" {...props} />,
                    tr: ({node, ...props}) => <tr {...props} />,
                    th: ({node, ...props}) => <th className="px-2.5 py-1.5 text-left font-semibold" {...props} />,
                    td: ({node, ...props}) => <td className="px-2.5 py-1.5 text-neutral-800 dark:text-neutral-200 align-top" {...props} />,
                  }}
                >
                  {cleanMarkdown}
                </ReactMarkdown>
              </div>

              {/* Synthesized Verified Ground Sources at the BOTTOM */}
              {articles.length > 0 && (
                <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                    <span>Verified Synthesized Sources ({articles.length})</span>
                    <span className="text-neutral-600 dark:text-neutral-400 font-mono">Ground Evidence</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {articles.map((art, aIdx) => (
                      <a
                        key={aIdx}
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${art.source_name || art.domain}: ${art.title}`}
                        className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 transition text-[10px] font-mono text-neutral-800 dark:text-neutral-200 shadow-xs"
                      >
                        <img
                          src={art.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(art.domain)}&sz=64`}
                          alt=""
                          loading="lazy"
                          className="w-3.5 h-3.5 rounded-xs flex-shrink-0 bg-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(art.domain)}&sz=64`;
                          }}
                        />
                        <span className="font-semibold truncate max-w-[110px]">{art.source_name || art.domain}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-neutral-400 ml-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-neutral-400 bg-neutral-50 dark:bg-black rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
              Briefing synthesis ready upon sector selection.
            </div>
          )}
        </div>
      )}

      {/* 4. VIEW 2: FIELD WIRE (Strictly Past 7 Days) */}
      {activeDossierTab === 'wire' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 pb-1 border-b border-neutral-200 dark:border-neutral-800">
            <span className="font-mono uppercase tracking-wider font-semibold">
              Live Verified Wire Dispatches ({articles.length})
            </span>
            <span className="font-mono text-[10px] text-neutral-500">
              Past 7 Days (Verified)
            </span>
          </div>

          {isLoadingAi && articles.length === 0 ? (
            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-2 animate-pulse">
              <div className="flex items-center space-x-2 text-xs text-neutral-500">
                <Loader2 className="w-3.5 h-3.5 text-black dark:text-white animate-spin" />
                <span>Ingesting 1-week dispatches for {parentCity}...</span>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full w-4/5" />
              <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full w-3/5" />
            </div>
          ) : articles.length === 0 ? (
            <div className="p-5 text-center text-neutral-400 bg-neutral-50 dark:bg-black rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
              No weather alerts recorded for {parentCity} in the last 7 days.
            </div>
          ) : (
            <div className="space-y-2">
              {articles.slice(0, visibleWireCount).map((art, aIdx) => (
                <div 
                  key={aIdx} 
                  className="p-3 rounded-lg bg-neutral-50/70 dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-1.5 hover:border-neutral-400 dark:hover:border-neutral-700 transition"
                >
                  {/* Source Metadata & Favicon */}
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <img
                        src={art.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(art.domain)}&sz=64`}
                        alt=""
                        loading="lazy"
                        className="w-3.5 h-3.5 rounded-xs flex-shrink-0 bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(art.domain)}&sz=64`;
                        }}
                      />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide truncate font-mono">
                        {art.source_name || art.domain}
                      </span>
                    </div>
                    <span className="font-mono text-neutral-400 flex items-center space-x-1 flex-shrink-0 ml-1">
                      <Clock className="w-2.5 h-2.5 inline" strokeWidth={1.5} />
                      <span>{art.published_time || "Recent"}</span>
                    </span>
                  </div>

                  {/* Headline */}
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold text-xs text-neutral-900 dark:text-neutral-100 hover:underline transition leading-snug"
                  >
                    {art.title}
                  </a>

                  {/* Deep Excerpt */}
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {art.deep_text || art.snippet}
                  </p>

                  {/* Link */}
                  <div className="pt-0.5 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-neutral-400">
                      Source: {art.domain}
                    </span>
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 font-semibold text-neutral-900 dark:text-neutral-100 hover:underline"
                    >
                      <span>Read Original Dispatch</span>
                      <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.5} />
                    </a>
                  </div>
                </div>
              ))}

              {articles.length > visibleWireCount && (
                <button
                  onClick={() => setVisibleWireCount((prev) => prev + 3)}
                  className="w-full py-2 rounded-md bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs flex items-center justify-center space-x-1 transition border border-neutral-200 dark:border-neutral-800"
                >
                  <span>Load More Dispatches ({articles.length - visibleWireCount} remaining)</span>
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW 4: RELIEF & AID DIRECTORY (Real Tavily + Groq Lazy Loaded) */}
      {activeDossierTab === 'relief' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-800 text-[11px]">
            <span className="font-mono uppercase tracking-wider font-semibold text-neutral-500">
              Verified Relief Facilities {reliefData?.camps ? `(${reliefData.camps.length})` : ''}
            </span>
            <span className="font-mono text-neutral-400">
              {isLoadingRelief ? 'Scanning...' : 'Active Status'}
            </span>
          </div>

          {isLoadingRelief ? (
            <div className="p-6 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 text-center space-y-2 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-900 dark:text-white" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Retrieving Real-Time Relief Facilities for {parentCity}...
                </p>
                <p className="text-[10px] text-neutral-500">
                  Scanning designated shelters, medical triage units, and emergency hotlines.
                </p>
              </div>
            </div>
          ) : reliefData && reliefData.camps && reliefData.camps.length > 0 ? (
            <>
              <div className="space-y-2">
                {reliefData.camps.map((c, cIdx) => (
                  <div key={cIdx} className="p-3 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-neutral-900 dark:text-white">
                        {c.name}
                      </h4>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      {c.address}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-200/50 dark:border-neutral-800/50 text-[11px] font-mono">
                      <span className="text-neutral-500">
                        Capacity: {c.capacity}
                      </span>
                      <a href={`tel:${c.phone}`} className="text-neutral-900 dark:text-neutral-100 font-semibold hover:underline flex items-center space-x-1">
                        <Phone className="w-3 h-3" strokeWidth={1.5} />
                        <span>{c.phone}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Emergency Hotlines */}
              {reliefData.helplines && reliefData.helplines.length > 0 && (
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                    Emergency Hotlines // {parentCity}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {reliefData.helplines.map((h, hIdx) => (
                      <a
                        key={hIdx}
                        href={`tel:${h.number}`}
                        className="p-2 rounded-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:border-neutral-400 transition shadow-xs"
                      >
                        <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300 truncate mr-1">
                          {h.service}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-neutral-900 dark:text-white flex-shrink-0">
                          {h.number}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 rounded-lg bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-500">
              No designated relief facilities currently reported for this coordinate sector.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
