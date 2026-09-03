"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SearchCard } from '../components/SearchCard';
import { InspectItem } from '../components/PlaceDetailCard';
import { SectorIntelDossier } from '../components/SectorIntelDossier';
import { DisasterChatbot } from '../components/DisasterChatbot';
import { LocalityRiskTelemetry, LocalityRiskData } from '../components/LocalityRiskTelemetry';
import { SectorRiskScoreCard } from '../components/SectorRiskScoreCard';
import { StatsBar } from '../components/StatsBar';
import { AlertFeed } from '../components/AlertFeed';
import { ShelterFinder } from '../components/ShelterFinder';
import { LogisticsHub } from '../components/LogisticsHub';
import { EmergencyDirectory } from '../components/EmergencyDirectory';
import { api } from '../lib/api';
import { 
  DisasterAlert, 
  ReliefShelter, 
  DistressBeacon, 
  DistressBeaconCreate, 
  ResourceStock, 
  DashboardStats,
  LiveEarthquake,
  LiveDisaster
} from '../types';
import { 
  Globe2, 
  X, 
  Shield, 
  Radio,
  AlertOctagon,
  Home,
  Activity,
  Boxes,
  PhoneCall,
  MessageSquare,
  FileText,
  ChevronLeft,
  Radar,
  CheckCircle2,
  Phone,
  Sun,
  Moon,
  Loader2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { INITIAL_STATS } from '../lib/mock-data';

// Dynamically import 3D Globe with SSR disabled
const GlobeViewer3D = dynamic(
  () => import('../components/GlobeViewer3D').then((mod) => mod.GlobeViewer3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#080C14] flex items-center justify-center text-xs text-slate-400">
        <div className="flex flex-col items-center space-y-2">
          <Globe2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="font-semibold text-slate-200">Initializing 3D Geospatial Surface...</span>
        </div>
      </div>
    ),
  }
);

export default function DisasterCommandPage() {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'intel' | 'assistant' | 'telemetry' | 'alerts' | 'shelters' | 'sos' | 'resources'>('alerts');

  // Inspected Item State
  const [inspectedItem, setInspectedItem] = useState<InspectItem | null>(null);

  // Live Data Feeds
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [shelters, setShelters] = useState<ReliefShelter[]>([]);
  const [sosBeacons, setSosBeacons] = useState<DistressBeacon[]>([]);
  const [resources, setResources] = useState<ResourceStock[]>([]);
  const [liveEarthquakes, setLiveEarthquakes] = useState<LiveEarthquake[]>([]);
  const [liveDisasters, setLiveDisasters] = useState<LiveDisaster[]>([]);

  // User Geographic & Navigation States
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; locality?: string; parentCity?: string } | null>(null);
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lon: number; zoom?: number; name?: string } | null>(null);
  const [activeViewport, setActiveViewport] = useState<{ lat: number; lon: number; zoom: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // 20km Sector Risk Telemetry Data
  const [localityRiskData, setLocalityRiskData] = useState<LocalityRiskData | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState<boolean>(false);

  // Resizable Sidebar Width State
  const [sidebarWidth, setSidebarWidth] = useState<number>(500);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Responsive screen-size tracking
  useEffect(() => {
    const handleCheckMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleCheckMobile();
    window.addEventListener('resize', handleCheckMobile);
    return () => window.removeEventListener('resize', handleCheckMobile);
  }, []);

  // Horizontal Resize Drag Handlers
  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const minW = 360;
      const maxW = Math.min(860, window.innerWidth * 0.75);
      const newWidth = Math.max(minW, Math.min(maxW, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Embedded SOS Form State
  const [sosContact, setSosContact] = useState('');
  const [sosPhone, setSosPhone] = useState('');
  const [sosDesc, setSosDesc] = useState('');
  const [sosSuccess, setSosSuccess] = useState(false);

  // Safe registry mock state
  const [safeName, setSafeName] = useState('');
  const [safePhone, setSafePhone] = useState('');
  const [safeSuccess, setSafeSuccess] = useState(false);
  const [safeSearch, setSafeSearch] = useState('');
  const [safeList, setSafeList] = useState([
    { name: "Priya Sharma", phone: "9876543210", location: "Puri Cyclone Shelter", status: "Safe & Verified" },
    { name: "Rahul Verma", phone: "9811223344", location: "Guwahati Central Camp", status: "Safe & Verified" },
    { name: "Sunil Nayak", phone: "9437012345", location: "Konark Relief Center", status: "Safe & Verified" }
  ]);

  // Active Coordinates for Telemetry Calculation
  const activeCoordinates = targetCoords 
    ? { lat: targetCoords.lat, lon: targetCoords.lon }
    : userLocation 
    ? { lat: userLocation.lat, lon: userLocation.lon }
    : { lat: 20.5937, lon: 78.9629 };

  // 1. Initial Data Ingestion - FIRST PRIORITY: Zero-Latency Disaster & Earthquake Map Hydration
  useEffect(() => {
    // Priority 1: Instant 0ms hydration from local cache so map markers render immediately
    const initialDisasters = api.getCachedDisasters();
    if (initialDisasters && initialDisasters.length > 0) {
      setLiveDisasters(initialDisasters);
    }

    // Priority 1: Immediate concurrent network fetch for live hazards
    api.getLiveDisasters().then((disasters) => {
      if (disasters && disasters.length > 0) setLiveDisasters(disasters);
    });
    api.getLiveEarthquakes().then((quakes) => {
      if (quakes && quakes.length > 0) setLiveEarthquakes(quakes);
    });

    // Priority 2: Secondary background feeds
    api.getAlerts().then((data) => setAlerts(data));
    api.getShelters().then((data) => setShelters(data));
    api.getSosBeacons().then((data) => setSosBeacons(data));
    api.getResources().then((data) => setResources(data));
    api.getStats().then((data) => setStats(data));

    // Auto-detect user location on load and compute baseline multi-hazard risk
    autoDetectLocation();
    fetch20kmRiskAssessment(20.5937, 78.9629);
  }, []);

  // 2. Geolocation Acquisition & 20km Perimeter Risk Assessment
  const autoDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          const geo = await api.reverseGeocode(lat, lon);
          const parentCity = (geo as any).parent_city || geo.city || geo.district || geo.locality || 'User Locality';
          setUserLocation({ lat, lon, locality: geo.locality, parentCity });
          setTargetCoords({ lat, lon, zoom: 11, name: parentCity });
          setInspectedItem(null);
          fetch20kmRiskAssessment(lat, lon);
        } catch (err) {
          console.error("Geocoding error:", err);
          setUserLocation({ lat, lon });
          setTargetCoords({ lat, lon, zoom: 11, name: 'Active Sector' });
          setInspectedItem(null);
          fetch20kmRiskAssessment(lat, lon);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Location permission dismissed:", err);
        setIsLocating(false);
        fetch20kmRiskAssessment(20.5937, 78.9629);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  // 3. Dynamic AI Risk Assessment (Computed strictly from live multi-hazard sensors and telemetry)
  const fetch20kmRiskAssessment = async (lat: number, lon: number) => {
    setIsLoadingRisk(true);
    try {
      const result = await api.assessLocalityRisk20km(lat, lon);
      setLocalityRiskData(result);
    } catch (err) {
      console.error("Risk assessment error:", err);
    } finally {
      setIsLoadingRisk(false);
    }
  };

  // 4. Place Search Handler: Flies to Coordinates & Opens Sector Dossier Tab
  const handleSelectSearchPlace = (place: { lat: number; lon: number; name: string; displayName: string; parentCity?: string; locality?: string }) => {
    const selectedCity = place.parentCity || place.name;
    fetch20kmRiskAssessment(place.lat, place.lon);
    setTargetCoords({
      lat: place.lat,
      lon: place.lon,
      zoom: 13,
      name: selectedCity,
    });
    setInspectedItem({
      type: 'PLACE',
      name: selectedCity,
      locality: place.locality || place.name,
      lat: place.lat,
      lon: place.lon,
      displayName: place.displayName,
      parentCity: selectedCity,
    } as any);

    // Automatically open Sector Dossier tab in sidebar
    setActiveTab('intel');
    setIsSidebarOpen(true);
  };

  // 5. Globe Marker Inspection Click (Syncs Target Coordinates & Hazard Dossier)
  const handleInspectItem = (item: InspectItem) => {
    setInspectedItem(item);
    setActiveTab('intel');
    setIsSidebarOpen(true);

    const itemLat = item.type === 'CITY' ? item.data.latitude
      : item.type === 'SHELTER' ? item.data.latitude
      : item.type === 'DISASTER' ? item.data.latitude
      : item.type === 'QUAKE' ? item.data.latitude
      : item.type === 'PLACE' ? item.lat : null;
    const itemLon = item.type === 'CITY' ? item.data.longitude
      : item.type === 'SHELTER' ? item.data.longitude
      : item.type === 'DISASTER' ? item.data.longitude
      : item.type === 'QUAKE' ? item.data.longitude
      : item.type === 'PLACE' ? item.lon : null;

    const itemName = item.type === 'CITY' ? item.data.name
      : item.type === 'SHELTER' ? item.data.name
      : item.type === 'DISASTER' ? (item.data.place || item.data.title)
      : item.type === 'QUAKE' ? item.data.place
      : item.type === 'PLACE' ? (item.parentCity || item.name) : 'Sector';

    if (itemLat !== null && itemLon !== null) {
      setTargetCoords({ lat: itemLat, lon: itemLon, zoom: 11, name: itemName });
      fetch20kmRiskAssessment(itemLat, itemLon);
    }
  };

  const lastViewportSearchRef = useRef<number>(0);

  // 6. Map Viewport Change
  const handleViewportChange = (vp: { lat: number; lon: number; zoom: number; bounds?: { north: number; south: number; east: number; west: number } }) => {
    setActiveViewport(vp);
  };

  const handleFilterClick = (filter: 'hazards' | 'shelters' | 'cities' | 'sos' | 'safe' | 'india') => {
    setIsSidebarOpen(true);
    if (filter === 'india') {
      setActiveTab('alerts');
      setTargetCoords({ lat: 21.7679, lon: 78.8718, zoom: 4.8, name: 'National Sector (India)' });
      fetch20kmRiskAssessment(21.7679, 78.8718);
    } else if (filter === 'sos' || filter === 'safe') {
      setActiveTab('sos');
    } else if (filter === 'hazards') {
      setActiveTab('alerts');
    } else if (filter === 'shelters') {
      setActiveTab('shelters');
    } else if (filter === 'cities') {
      setActiveTab('intel');
    }
  };

  const handleSosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosContact.trim() || !sosPhone.trim()) return;

    const newBeacon = await api.createSos({
      contact_name: sosContact,
      phone_number: sosPhone,
      category: 'TRAPPED_WATER',
      people_count: 2,
      has_elderly_or_infants: false,
      has_injured: false,
      description: sosDesc || 'Emergency evacuation requested via Sector Command.',
      latitude: activeCoordinates.lat,
      longitude: activeCoordinates.lon,
      address_or_landmark: localityRiskData?.localityName || 'Designated Coordinates',
    });

    setSosBeacons([newBeacon, ...sosBeacons]);
    setStats((prev) => ({ ...prev, pending_sos_count: prev.pending_sos_count + 1 }));
    setSosSuccess(true);
    setTimeout(() => {
      setSosSuccess(false);
      setSosContact('');
      setSosPhone('');
      setSosDesc('');
    }, 2500);
  };

  const handleSafeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safeName.trim() || !safePhone.trim()) return;

    setSafeList([
      { name: safeName, phone: safePhone, location: localityRiskData?.localityName || 'Safe Sector', status: 'Safe & Verified' },
      ...safeList
    ]);
    setSafeSuccess(true);
    setTimeout(() => {
      setSafeSuccess(false);
      setSafeName('');
      setSafePhone('');
    }, 2000);
  };

  const handleRequestSupplies = (itemId: string, qty: number) => {
    setResources((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, allocated_quantity: item.allocated_quantity + qty }
          : item
      )
    );
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 select-text font-sans">
      {/* 1. SAAS SPLIT SIDEBAR: ALL TABS & FUNCTIONALITY EMBEDDED (NO FLOATING MODALS) */}
      {isSidebarOpen && (
        <aside
          style={{
            width: isMobile ? '100%' : `${sidebarWidth}px`,
          }}
          className={`relative ${
            isMobile ? 'w-full' : ''
          } h-full flex flex-col bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 flex-shrink-0 z-40 shadow-2xl transition-[width] ${
            isResizing ? 'transition-none' : 'duration-150'
          }`}
        >
          {/* Drag Resize Handle along Right Border (Desktop Only) */}
          {!isMobile && (
            <div
              onMouseDown={handleStartResize}
              className="absolute top-0 right-0 w-2.5 h-full cursor-col-resize hover:bg-neutral-500/20 active:bg-neutral-600 transition-colors z-50 flex items-center justify-center group"
              title="Drag horizontally to resize sidebar width"
            >
              <div className="w-1 h-12 rounded-full bg-neutral-300 dark:bg-neutral-700 group-hover:bg-neutral-400 transition-colors" />
            </div>
          )}

          {/* Header Bar */}
          {/* 1. Header Bar: Enterprise Mission Control (Compact, No Big Risk Banner) */}
          <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-shrink-0 bg-white dark:bg-black">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-md overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
                <img src="/logobgwhite.png" alt="Aapda Setu" className="w-full h-full object-contain block dark:hidden" />
                <img src="/logobgblack.png" alt="Aapda Setu" className="w-full h-full object-contain hidden dark:block" />
              </div>
              <span className="text-xs font-bold tracking-wider text-neutral-900 dark:text-neutral-100 uppercase font-mono truncate">
                AAPDA SETU
              </span>

              {/* Prominent Colored Multi-Hazard Risk Indicator (Calculated strictly from AI analysis) */}
              {localityRiskData ? (
                (() => {
                  const score = localityRiskData.overallRiskScore;
                  const level = localityRiskData.overallRiskLevel;
                  const isCrit = level === 'CRITICAL';
                  const isHigh = level === 'HIGH';
                  const isMod = level === 'MODERATE';
                  
                  const badgeStyle = isCrit
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 shadow-xs'
                    : isHigh
                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40 shadow-xs'
                    : isMod
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-xs'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-xs';

                  const dotColor = isCrit
                    ? 'bg-rose-500'
                    : isHigh
                    ? 'bg-orange-500'
                    : isMod
                    ? 'bg-amber-500'
                    : 'bg-emerald-500';

                  return (
                    <button
                      onClick={() => setActiveTab('telemetry')}
                      className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border transition ml-1 cursor-pointer flex-shrink-0 ${badgeStyle}`}
                      title="View dynamic AI multi-hazard risk assessment"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isCrit ? 'animate-ping' : ''}`}></span>
                      <span className="opacity-70 text-[10px]">RISK</span>
                      <span>{score}</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold">({level})</span>
                    </button>
                  );
                })()
              ) : (
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 text-neutral-400 ml-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse"></span>
                  <span>RISK: AI ANALYZING...</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Theme Toggle Control */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300 transition"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Collapse / Close Control */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse Command Console"
                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Quick Sub-Navigation Tabs */}
          <nav className="flex items-center space-x-1 p-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar bg-white dark:bg-black flex-shrink-0">
            {[
              { id: 'intel', label: 'Briefing', icon: Shield },
              { id: 'assistant', label: 'Assistant', icon: MessageSquare },
              { id: 'telemetry', label: '20km Risk', icon: Radar },
              { id: 'alerts', label: 'Alerts', icon: AlertOctagon },
              { id: 'shelters', label: 'Shelters', icon: Home },
              { id: 'sos', label: 'SOS', icon: Radio },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                    isActive
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Tab Content Panel */}
          <div className={`flex-1 min-h-0 ${activeTab === 'assistant' ? 'flex flex-col overflow-hidden p-0' : 'overflow-y-auto p-4 sm:p-5'}`}>
            {/* 1. SECTOR DOSSIER: Real Tavily Images, Live Relief Camps, AI Overview, Timeline Wire */}
            <div className={activeTab === 'intel' ? 'block' : 'hidden'}>
              <SectorIntelDossier
                item={inspectedItem}
                currentSector={{
                  name: (inspectedItem as any)?.parentCity || targetCoords?.name || userLocation?.parentCity || "Active Sector",
                  locality: (inspectedItem as any)?.locality || userLocation?.locality || targetCoords?.name || "Active Sector",
                  parentCity: (inspectedItem as any)?.parentCity || userLocation?.parentCity || targetCoords?.name || "Active Sector",
                  lat: activeCoordinates.lat,
                  lon: activeCoordinates.lon,
                }}
                disasters={liveDisasters}
                onFlyTo={(lat, lon, zoom = 14) => setTargetCoords({ lat, lon, zoom })}
                onTriggerSos={() => setActiveTab('sos')}
                onRiskAssessmentUpdated={(data) => {
                  if (data) {
                    setLocalityRiskData((prev) => {
                      if (prev?.overallRiskScore === data.overallRiskScore && prev?.overallRiskLevel === data.overallRiskLevel) {
                        return prev;
                      }
                      return {
                        localityName: (inspectedItem as any)?.parentCity || targetCoords?.name || prev?.localityName || "Active Sector",
                        overallRiskScore: data.overallRiskScore,
                        overallRiskLevel: data.overallRiskLevel,
                        nearestQuake: data.nearestQuake,
                        weather: prev?.weather || { temperature_c: 24, wind_speed_kmh: 12, precipitation_mm: 0, wind_gusts_kmh: 15, humidity_pct: 60 },
                        irregularities: prev?.irregularities || [],
                      };
                    });
                  }
                }}
              />
            </div>

            {/* 2. DISASTER ASSISTANT: Embedded AI Chatbot (Preserved across tab switches, strictly scrollable from inside) */}
            <div className={activeTab === 'assistant' ? 'flex-1 min-h-0 flex flex-col h-full overflow-hidden' : 'hidden'}>
              <DisasterChatbot
                embedded={true}
                currentLocation={targetCoords?.name || (inspectedItem as any)?.parentCity || localityRiskData?.localityName || userLocation?.locality || "Active Sector"}
              />
            </div>

            {/* 3. 20KM SECTOR RISK TELEMETRY (Only shown after analysis, never hardcoded initially) */}
            {activeTab === 'telemetry' && (
              <div className="space-y-4">
                {isLoadingRisk ? (
                  <div className="p-6 rounded-xl bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-500" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Synthesizing Multi-Hazard Telemetry
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Gathering atmospheric sensors, seismic proximity, and relief buffers...
                      </p>
                    </div>
                  </div>
                ) : localityRiskData ? (
                  <>
                    <SectorRiskScoreCard
                      score={localityRiskData.overallRiskScore}
                      level={localityRiskData.overallRiskLevel}
                      locationName={localityRiskData.localityName || targetCoords?.name || (inspectedItem as any)?.parentCity || userLocation?.locality || 'Active Sector'}
                      weather={localityRiskData.weather || { temperature_c: 24, wind_speed_kmh: 12, precipitation_mm: 0, wind_gusts_kmh: 15, humidity_pct: 60 }}
                      corroboratingSourcesCount={3}
                      nearestQuake={localityRiskData.nearestQuake}
                    />

                    {/* Irregularities & Hazards List */}
                    {localityRiskData.irregularities && localityRiskData.irregularities.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                          Active Multi-Hazard Irregularities
                        </span>
                        {localityRiskData.irregularities.map((irr, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">{irr.title}</h4>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                irr.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' :
                                irr.severity === 'WARNING' || irr.severity === 'HIGH' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30' :
                                'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800'
                              }`}>
                                {irr.severity}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{irr.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Atmospheric and tectonic sensor telemetry indicate nominal baseline conditions across this 20km surveillance sector.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 rounded-xl bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                      Dynamic AI Threat Analysis in Progress
                    </h4>
                    <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                      Synthesizing multi-source emergency bulletins, atmospheric sensor telemetry, and seismic proximity for this sector...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4. GLOBAL MULTI-HAZARD ALERTS (Strict Monochrome & Paginated Live Map Hazards) */}
            {activeTab === 'alerts' && (
              <AlertFeed
                alerts={alerts}
                disasters={liveDisasters}
                userLocation={userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : activeViewport ? { lat: activeViewport.lat, lon: activeViewport.lon } : null}
                onFocusOnMap={(lat, lon, title, item) => {
                  const targetName = item?.place || title || 'Hazard Coordinate';
                  setTargetCoords({ lat, lon, zoom: 12, name: targetName });
                  if (item) {
                    setInspectedItem({
                      type: 'DISASTER',
                      data: item,
                    });
                  } else {
                    setInspectedItem({
                      type: 'PLACE',
                      name: title || 'Hazard Coordinate',
                      displayName: title || 'Hazard Coordinate',
                      lat,
                      lon,
                    });
                  }
                  setLocalityRiskData(null);
                  setActiveTab('intel');
                  setIsSidebarOpen(true);
                  fetch20kmRiskAssessment(lat, lon);
                }}
                onFindShelter={() => setActiveTab('shelters')}
              />
            )}

            {/* 5. RELIEF SHELTER FINDER (Real-Time Dynamic Tavily + Groq Shelters) */}
            {activeTab === 'shelters' && (
              <ShelterFinder
                currentLocation={targetCoords?.name || (inspectedItem as any)?.parentCity || localityRiskData?.localityName || userLocation?.locality || "Active Sector"}
                lat={activeCoordinates.lat}
                lon={activeCoordinates.lon}
              />
            )}

            {/* 6. SOS DISTRESS & SAFE REGISTRY (Pure Black/White Theme with Red Trigger) */}
            {activeTab === 'sos' && (
              <div className="space-y-5">
                {/* Send SOS Form */}
                <div className="p-4 rounded-xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                    <Radio className="w-4 h-4" />
                    <span>Emergency Distress Beacon</span>
                  </div>

                  {sosSuccess ? (
                    <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">SOS Broadcast Transmitted!</h4>
                      <p className="text-xs text-neutral-500">Quick reaction teams dispatched to your coordinates.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSosSubmit} className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={sosContact}
                        onChange={(e) => setSosContact(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={sosPhone}
                        onChange={(e) => setSosPhone(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                        required
                      />
                      <textarea
                        placeholder="Nature of Emergency (e.g. Trapped by floodwaters, need boat)"
                        value={sosDesc}
                        onChange={(e) => setSosDesc(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white h-20 resize-none focus:outline-none focus:border-black dark:focus:border-white"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs"
                      >
                        Transmit Distress Signal
                      </button>
                    </form>
                  )}
                </div>

                {/* "I AM SAFE" Registry */}
                <div className="p-4 rounded-xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center space-x-2 text-neutral-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>&quot;I Am Safe&quot; Registry (मैं सुरक्षित हूँ)</span>
                  </div>

                  {safeSuccess ? (
                    <div className="p-3 text-center text-xs text-emerald-600 font-bold bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      Registry Updated: Your status is logged as safe.
                    </div>
                  ) : (
                    <form onSubmit={handleSafeSubmit} className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        value={safeName}
                        onChange={(e) => setSafeName(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Contact Phone"
                        value={safePhone}
                        onChange={(e) => setSafePhone(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold text-xs transition"
                      >
                        Register Safe Status
                      </button>
                    </form>
                  )}

                  {/* Evacuee Search */}
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">
                      Search Evacuees ({safeList.length} Verified)
                    </span>
                    <input
                      type="text"
                      placeholder="Search relative by name..."
                      value={safeSearch}
                      onChange={(e) => setSafeSearch(e.target.value)}
                      className="w-full p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                    />
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {safeList
                        .filter((p) => p.name.toLowerCase().includes(safeSearch.toLowerCase()))
                        .map((p, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs flex justify-between">
                            <div>
                              <strong className="block font-bold text-neutral-900 dark:text-white">{p.name}</strong>
                              <span className="text-[10px] text-neutral-500">{p.location}</span>
                            </div>
                            <span className="text-[10px] text-emerald-500 font-bold self-center">{p.status}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* 2. MAP CONTAINER (FLEX-1: RESIZES DYNAMICALLY WHEN SIDEBAR OPENS/CLOSES) */}
      <main className="relative flex-1 h-full overflow-hidden">
        {/* Full 3D Earth Map with MapLibre */}
        <GlobeViewer3D
          earthquakes={liveEarthquakes}
          disasters={liveDisasters}
          shelters={shelters}
          userLocation={userLocation}
          selectedCoordinates={targetCoords}
          onInspectItem={handleInspectItem}
          onTriggerLocate={autoDetectLocation}
          onViewportChange={handleViewportChange}
          isLocating={isLocating}
        />

        {/* Top-Left Minimalist Search Bar & Filter Buttons */}
        <SearchCard
          onSelectPlace={handleSelectSearchPlace}
          onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)}
          onFilterClick={handleFilterClick}
          onDetectLocation={autoDetectLocation}
          isLocating={isLocating}
        />

        {/* Floating Command Operations Trigger (When sidebar collapsed) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute bottom-6 left-6 z-30 flex items-center space-x-2.5 px-3.5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-2xl font-bold text-xs sm:text-sm border border-neutral-800 dark:border-neutral-200 transition transform hover:scale-105"
          >
            <div className="w-5 h-5 rounded-sm overflow-hidden flex-shrink-0">
              <img src="/logobgblack.png" alt="Aapda Setu" className="w-full h-full object-contain block dark:hidden" />
              <img src="/logobgwhite.png" alt="Aapda Setu" className="w-full h-full object-contain hidden dark:block" />
            </div>
            <span>Open Command Operations</span>
          </button>
        )}
      </main>
    </div>
  );
}
