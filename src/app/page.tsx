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
import { OperationalRegionsTab } from '../components/OperationalRegionsTab';
import { api, INITIAL_BASELINE_DISASTERS } from '../lib/api';
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
  ChevronDown,
  Radar,
  CheckCircle2,
  Phone,
  Sun,
  Moon,
  Loader2,
  Compass
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { INITIAL_STATS } from '../lib/mock-data';
import { INDIA_DISASTER_ZONES, DisasterZone } from '../lib/india-zones';

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
  const [activeTab, setActiveTab] = useState<'regions' | 'alerts' | 'intel' | 'telemetry' | 'assistant' | 'shelters' | 'sos' | 'resources'>('regions');

  // Inspected Item State
  const [inspectedItem, setInspectedItem] = useState<InspectItem | null>(null);

  // Live Data Feeds
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [shelters, setShelters] = useState<ReliefShelter[]>([]);
  const [sosBeacons, setSosBeacons] = useState<DistressBeacon[]>([]);
  const [resources, setResources] = useState<ResourceStock[]>([]);
  const [liveEarthquakes, setLiveEarthquakes] = useState<LiveEarthquake[]>([]);
  const [liveDisasters, setLiveDisasters] = useState<LiveDisaster[]>(INITIAL_BASELINE_DISASTERS);

  // 5 Disaster Operational Zones State (Default: Northern Himalayas & Karakoram)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('ZONE-1-HIMALAYAN');
  const [isScanningSector, setIsScanningSector] = useState<boolean>(false);
  const selectedZone = useMemo(
    () => INDIA_DISASTER_ZONES.find((z) => z.id === selectedZoneId) || null,
    [selectedZoneId]
  );

  const handleSelectZone = async (zone: DisasterZone | null) => {
    if (!zone) {
      setSelectedZoneId(null);
      setTargetCoords({
        lat: 23.0,
        lon: 80.5,
        zoom: 4.4,
        name: 'All India & Himalayas',
      });
      return;
    }
    if (selectedZoneId === zone.id) {
      setSelectedZoneId(null);
      setTargetCoords({
        lat: 23.0,
        lon: 80.5,
        zoom: 4.4,
        name: 'All India & Himalayas',
      });
      return;
    }
    setSelectedZoneId(zone.id);
    setTargetCoords({
      lat: zone.center[1],
      lon: zone.center[0],
      zoom: zone.zoom,
      name: zone.name,
    });

    // Trigger on-demand sector-wise intelligence search
    try {
      setIsScanningSector(true);
      const res = await fetch(`/api/geo/sector-intelligence?sector=${zone.id}`);
      if (res.ok) {
        const sectorDisasters = await res.json();
        if (Array.isArray(sectorDisasters) && sectorDisasters.length > 0) {
          setLiveDisasters((prev) => {
            const combined = [...sectorDisasters, ...prev];
            const deduped: any[] = [];
            const seen = new Set<string>();
            for (const d of combined) {
              const dType = (d.disaster_type || '').toUpperCase();
              const spatialKey = `${dType}-${Math.round(d.latitude * 8) / 8},${Math.round(d.longitude * 8) / 8}`;
              const nameKey = `${dType}-${(d.place || d.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14)}`;
              if (!seen.has(spatialKey) && !seen.has(nameKey)) {
                seen.add(spatialKey);
                seen.add(nameKey);
                deduped.push(d);
              }
            }
            return deduped;
          });
        }
      }
    } catch {} finally {
      setIsScanningSector(false);
    }
  };

  // User Geographic & Navigation States
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; locality?: string; parentCity?: string } | null>(null);
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lon: number; zoom?: number; name?: string } | null>({
    lat: 33.2,
    lon: 77.2,
    zoom: 5.2,
    name: 'Northern Himalayas & Karakoram',
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [activeViewport, setActiveViewport] = useState<{ lat: number; lon: number; zoom: number } | null>(null);
  // Navigation Route State
  const [activeRoute, setActiveRoute] = useState<any>(null);

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
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    handleCheckMobile();
    // Default to closed sidebar on mobile screen on initial load so map is immediately visible
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
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

    // Baseline multi-hazard risk assessment across India (no camera auto-zoom)
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
          // Note: Do not force zoom camera to current location automatically; keep wide 5-zone view
          fetch20kmRiskAssessment(lat, lon);
        } catch (err) {
          console.error("Geocoding error:", err);
          setUserLocation({ lat, lon });
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

  // Determine if active location / selected sector is a High Risk Danger Zone
  const isHighRiskZone = useMemo(() => {
    // 1. Check localityRiskData
    if (localityRiskData) {
      if (localityRiskData.overallRiskScore >= 70) return true;
      if (['CRITICAL', 'SEVERE', 'HIGH'].includes(localityRiskData.overallRiskLevel)) return true;
    }
    // 2. Check inspectedItem
    if (inspectedItem?.type === 'DISASTER') {
      const d = inspectedItem.data;
      if (d.severity === 'CRITICAL' || d.severity === 'SEVERE' || (d.risk_score && d.risk_score >= 70)) return true;
    }
    if (inspectedItem?.type === 'QUAKE') {
      const q = (inspectedItem as any).data;
      if (q.magnitude >= 5.5 || q.severity === 'CRITICAL' || q.severity === 'SEVERE' || (q.risk_score && q.risk_score >= 70)) return true;
    }
    // 3. Check proximity to any critical disaster within 35 km
    const activePos = targetCoords || userLocation;
    if (activePos) {
      const nearCriticalDisaster = liveDisasters.some((d) => {
        const isCrit = d.severity === 'CRITICAL' || d.severity === 'SEVERE' || (d.risk_score && d.risk_score >= 70);
        if (!isCrit) return false;
        const dLat = ((Number(d.latitude) - activePos.lat) * Math.PI) / 180;
        const dLon = ((Number(d.longitude) - activePos.lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((activePos.lat * Math.PI) / 180) *
            Math.cos((Number(d.latitude) * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return distKm <= 35;
      });
      if (nearCriticalDisaster) return true;

      const nearCriticalQuake = liveEarthquakes.some((q) => {
        const isCrit = q.magnitude >= 5.5 || q.severity === 'CRITICAL' || (q.risk_score && q.risk_score >= 70);
        if (!isCrit) return false;
        const dLat = ((Number(q.latitude) - activePos.lat) * Math.PI) / 180;
        const dLon = ((Number(q.longitude) - activePos.lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((activePos.lat * Math.PI) / 180) *
            Math.cos((Number(q.latitude) * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return distKm <= (q.buffer_radius_km || 40);
      });
      if (nearCriticalQuake) return true;
    }
    return false;
  }, [localityRiskData, inspectedItem, targetCoords, userLocation, liveDisasters, liveEarthquakes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  return (
    <div className="flex w-full h-[100dvh] max-w-full overflow-hidden bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 select-text font-sans">
      {/* 1. SAAS SPLIT SIDEBAR: ALL TABS & FUNCTIONALITY EMBEDDED (NO FLOATING MODALS) */}
      {isSidebarOpen && (
        <aside
          style={{
            width: isMobile ? '100vw' : `${sidebarWidth}px`,
          }}
          className={`${
            isMobile 
              ? 'fixed inset-0 z-50 w-full h-full' 
              : 'relative h-full flex-shrink-0 z-40'
          } flex flex-col bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 shadow-2xl transition-[width] ${
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

          {/* Header Bar: Enterprise Mission Control */}
          <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-shrink-0 bg-white dark:bg-black">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-md overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
                <img src="/logobgwhite.png" alt="Aapda Setu" className="w-full h-full object-contain block dark:hidden" />
                <img src="/logobgblack.png" alt="Aapda Setu" className="w-full h-full object-contain hidden dark:block" />
              </div>
              <span className="text-xs font-bold tracking-wider text-neutral-900 dark:text-neutral-100 uppercase font-mono truncate">
                AAPDA SETU
              </span>

              {/* Prominent Two-Tone Multi-Hazard Risk Indicator */}
              {localityRiskData ? (
                (() => {
                  const score = localityRiskData.overallRiskScore;
                  const level = localityRiskData.overallRiskLevel;
                  const isCrit = level === 'CRITICAL';
                  
                  return (
                    <button
                      onClick={() => setActiveTab('telemetry')}
                      className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border transition ml-1 cursor-pointer flex-shrink-0 ${
                        isCrit
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800'
                      }`}
                      title="View dynamic multi-hazard risk assessment"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isCrit ? 'bg-rose-400 animate-ping' : 'bg-neutral-900 dark:bg-white'}`}></span>
                      <span className="opacity-60 text-[10px]">RISK</span>
                      <span>{score}</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold">({level})</span>
                    </button>
                  );
                })()
              ) : (
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 ml-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse"></span>
                  <span>RISK: ANALYZING...</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Mobile "View Map" Quick Switcher */}
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black font-mono text-[11px] font-bold flex items-center space-x-1 shadow-xs mr-1 cursor-pointer"
                  title="Close operations drawer and view map"
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Map</span>
                </button>
              )}

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
                {isMobile ? <X className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {/* Minimalist Operational Status Bar (Adaptive Light & Dark, Border color-coded to map) */}
          <div 
            style={{ borderColor: selectedZone ? selectedZone.color : undefined }}
            className={`px-3.5 py-2.5 bg-neutral-100/80 dark:bg-neutral-950 border-b flex items-center justify-between text-xs flex-shrink-0 transition-colors duration-200 ${
              selectedZone ? '' : 'border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <span 
                style={{ backgroundColor: selectedZone ? selectedZone.color : '#737373' }}
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
              />
              <div className="flex items-center space-x-2 min-w-0">
                <span className="font-semibold text-neutral-900 dark:text-white truncate">
                  {selectedZone ? selectedZone.name : 'All Continental Sectors'}
                </span>
                {selectedZone && (
                  <span 
                    style={{ borderColor: selectedZone.color, color: selectedZone.color }}
                    className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0"
                  >
                    ACTIVE
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 ml-2">
              {isScanningSector && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 animate-pulse flex items-center space-x-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  <span className="hidden sm:inline">SCANNING...</span>
                </span>
              )}
              <button
                onClick={() => setActiveTab('regions')}
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                  activeTab === 'regions'
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white bg-neutral-200/80 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 border-neutral-300 dark:border-neutral-800'
                }`}
              >
                {activeTab === 'regions' ? 'Sectors Active' : 'Sectors Tab →'}
              </button>
            </div>
          </div>

          {/* Quick Sub-Navigation Tabs (Strict Black & White Style) */}
          <nav className="flex items-center space-x-1 p-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar bg-white dark:bg-black flex-shrink-0">
            {[
              { id: 'regions', label: 'Regions', icon: Compass },
              { id: 'alerts', label: 'Alerts', icon: AlertOctagon },
              { id: 'intel', label: 'Briefing', icon: Shield },
              { id: 'telemetry', label: '20km Risk', icon: Radar },
              { id: 'assistant', label: 'Assistant', icon: MessageSquare },
              { id: 'shelters', label: 'Shelters', icon: Home },
              { id: 'sos', label: 'SOS', icon: Radio },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-xs'
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
            {/* 0. OPERATIONAL SECTORS: 5 Regional Disaster Management Commands */}
            {activeTab === 'regions' && (
              <OperationalRegionsTab
                selectedZoneId={selectedZoneId}
                onSelectZone={handleSelectZone}
                disasters={liveDisasters}
                isScanningSector={isScanningSector}
              />
            )}

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
                userLocation={userLocation}
                disasters={liveDisasters}
                onFlyTo={(lat, lon, zoom = 14) => setTargetCoords({ lat, lon, zoom })}
                onNavigate={(route) => setActiveRoute(route)}
                onClearRoute={() => setActiveRoute(null)}
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
                                irr.severity === 'WARNING' || (irr.severity as string) === 'HIGH' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30' :
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
      <main className="relative flex-1 w-full min-w-0 h-full overflow-hidden">
        {/* Full 3D Earth Map with MapLibre */}
        <GlobeViewer3D
          earthquakes={liveEarthquakes}
          disasters={liveDisasters}
          shelters={shelters}
          userLocation={userLocation}
          selectedCoordinates={targetCoords}
          activeRoute={activeRoute}
          onClearRoute={() => setActiveRoute(null)}
          isHighRisk={isHighRiskZone}
          onInspectItem={handleInspectItem}
          onTriggerLocate={autoDetectLocation}
          onViewportChange={handleViewportChange}
          isLocating={isLocating}
          selectedZoneId={selectedZoneId}
          onSelectZone={(id) => {
            const z = INDIA_DISASTER_ZONES.find((x) => x.id === id) || null;
            handleSelectZone(z);
          }}
        >
          {/* Top-Left Minimalist Search Bar & Filter Buttons */}
          <SearchCard
            onSelectPlace={handleSelectSearchPlace}
            onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)}
            onFilterClick={handleFilterClick}
            onDetectLocation={autoDetectLocation}
            isLocating={isLocating}
          />
        </GlobeViewer3D>

        {/* Floating Command Operations Trigger (Desktop & Mobile) */}
        {!isSidebarOpen && (
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 z-40 flex items-center space-x-2 pointer-events-auto">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center space-x-2.5 px-3.5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-2xl font-bold text-xs sm:text-sm border border-neutral-800 dark:border-neutral-200 transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-xs overflow-hidden flex-shrink-0">
                <img src="/logobgwhite.png" alt="Aapda Setu" className="w-full h-full object-contain block dark:hidden" />
                <img src="/logobgblack.png" alt="Aapda Setu" className="w-full h-full object-contain hidden dark:block" />
              </div>
              <span>Open Operations ({liveDisasters.length} Hazards)</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
