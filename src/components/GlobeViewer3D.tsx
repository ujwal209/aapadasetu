"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Layers, 
  Plus, 
  Minus, 
  Crosshair, 
  X,
  Compass,
  Check
} from 'lucide-react';
import { LiveEarthquake, ReliefShelter, LiveDisaster } from '../types';
import { api } from '../lib/api';
import { InspectItem } from './PlaceDetailCard';
import { INDIA_DISASTER_ZONES, DisasterZone, getDisasterZoneForCoords } from '../lib/india-zones';

export interface ActiveRouteData {
  origin?: { lat: number; lon: number; name?: string };
  destination?: { lat: number; lon: number; name: string };
  lat?: number;
  lon?: number;
  name?: string;
  distanceKm: number;
  durationMin: number;
  coordinates: [number, number][];
  steps?: Array<{ instruction: string; distanceM: number; name?: string }>;
}

interface GlobeViewer3DProps {
  earthquakes: LiveEarthquake[];
  disasters?: LiveDisaster[];
  shelters?: ReliefShelter[];
  userLocation?: { lat: number; lon: number; locality?: string } | null;
  selectedCoordinates?: { lat: number; lon: number; zoom?: number; name?: string } | null;
  activeRoute?: ActiveRouteData | null;
  onClearRoute?: () => void;
  isHighRisk?: boolean;
  onInspectItem: (item: InspectItem) => void;
  onTriggerLocate: () => void;
  onViewportChange?: (viewport: { lat: number; lon: number; zoom: number; bounds?: { north: number; south: number; east: number; west: number } }) => void;
  isLocating?: boolean;
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string | null) => void;
  children?: React.ReactNode;
}

export const GlobeViewer3D: React.FC<GlobeViewer3DProps> = ({
  earthquakes = [],
  disasters = [],
  shelters = [],
  userLocation,
  selectedCoordinates,
  activeRoute,
  onClearRoute,
  isHighRisk = false,
  onInspectItem,
  onTriggerLocate,
  onViewportChange,
  isLocating,
  selectedZoneId: propSelectedZoneId,
  onSelectZone,
  children,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const currentTileLayerRef = useRef<any>(null);
  const zoneLayersGroupRef = useRef<any>(null);
  const disasterMarkersGroupRef = useRef<any>(null);
  const shelterMarkersGroupRef = useRef<any>(null);
  const routeLayerGroupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);

  // Basemap & Layer toggles
  const [basemap, setBasemap] = useState<'satellite' | 'street' | 'dark'>('satellite');
  const [showZoneBorders, setShowZoneBorders] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);
  const [internalSelectedZoneId, setInternalSelectedZoneId] = useState<string | null>(null);

  const effectiveZoneId = propSelectedZoneId !== undefined ? propSelectedZoneId : internalSelectedZoneId;
  const selectedZone = INDIA_DISASTER_ZONES.find((z) => z.id === effectiveZoneId) || null;

  const handleSelectZone = useCallback((zone: DisasterZone | null) => {
    if (onSelectZone) {
      onSelectZone(zone ? zone.id : null);
    } else {
      setInternalSelectedZoneId(zone ? zone.id : null);
    }
    if (leafletMapRef.current && zone) {
      leafletMapRef.current.flyTo([zone.center[1], zone.center[0]], zone.zoom, { duration: 1.2 });
    }
  }, [onSelectZone]);

  // Disaster styling helpers
  const getDisasterColor = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('LANDSLIDE')) {
      return { hex: '#D97706', bg: '#D97706', ping: '#FBBF24', glow: 'rgba(217, 119, 6, 0.45)' };
    }
    return { hex: '#0284C7', bg: '#0284C7', ping: '#38BDF8', glow: 'rgba(2, 132, 199, 0.45)' };
  };

  const getDisasterSvg = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('LANDSLIDE')) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20L10 5l4 8 8 7H2z"/><circle cx="16" cy="11" r="1.5" fill="currentColor"/><circle cx="18" cy="15" r="1.2" fill="currentColor"/><circle cx="14" cy="16" r="1.5" fill="currentColor"/></svg>`;
    }
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 11c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7 0"/><path d="M2 16c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7 0"/><path d="M2 21c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7 0"/><path d="M7 4l1 2M12 2l1 2M17 4l1 2"/></svg>`;
  };

  // Get Tile URL for basemap
  const getTileConfig = (type: 'satellite' | 'street' | 'dark') => {
    switch (type) {
      case 'street':
        return {
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; World Street Map',
          maxZoom: 19,
        };
      case 'dark':
        return {
          url: 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
          attribution: '&copy; CartoDB Dark Matter',
          maxZoom: 19,
        };
      case 'satellite':
      default:
        return {
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri World Imagery',
          maxZoom: 19,
        };
    }
  };

  // RENDER THE OPERATIONAL REGIONS (CLEAN REGIONAL COLOR-CODING, ZERO BADGES/NUMBERS)
  const renderZones = useCallback((map: any) => {
    const L = (window as any).L;
    if (!L || !map || !zoneLayersGroupRef.current) return;

    zoneLayersGroupRef.current.clearLayers();

    if (!showZoneBorders) return;

    // 1. Render Domestic Indian Operational Sectors
    INDIA_DISASTER_ZONES.forEach((zone) => {
      const isSelected = effectiveZoneId === zone.id;
      const latLngs = zone.coordinates.map(([lon, lat]) => [lat, lon]);

      // Solid color boundary for domestic sectors
      const polygon = L.polygon(latLngs, {
        color: zone.borderColor,
        weight: isSelected ? 3.5 : 2,
        fillColor: zone.color,
        fillOpacity: isSelected ? 0.25 : 0.08,
        smoothFactor: 1.5,
        interactive: false,
      });

      const dashedContour = L.polyline(latLngs, {
        color: '#FFFFFF',
        weight: 1.5,
        dashArray: '4, 4',
        opacity: isSelected ? 0.95 : 0.55,
        interactive: false,
      });

      polygon.addTo(zoneLayersGroupRef.current);
      dashedContour.addTo(zoneLayersGroupRef.current);
    });
  }, [showZoneBorders, effectiveZoneId]);

  // RENDER ALL HAZARDS DIRECTLY (ANTI-COLLISION MICRO-FANNING: ALL VISIBLE, ZERO OVERLAP)
  const renderDisasterMarkers = useCallback((map: any) => {
    const L = (window as any).L;
    if (!L || !map || !disasterMarkersGroupRef.current) return;

    disasterMarkersGroupRef.current.clearLayers();

    const validDisasters = (disasters || []).filter((d) => {
      const lon = Number(d.longitude);
      const lat = Number(d.latitude);
      const itemZone = (d as any).zone || getDisasterZoneForCoords(lat, lon).id;
      const matchesZone = !effectiveZoneId || itemZone === effectiveZoneId;
      return matchesZone && !isNaN(lon) && !isNaN(lat) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
    });

    // 1. Strict Deduplication: NEVER allow the same disaster or same location to render twice
    const dedupedDisasters: LiveDisaster[] = [];
    const seenEvents = new Set<string>();

    validDisasters.forEach((d) => {
      const lat = Number(d.latitude);
      const lon = Number(d.longitude);
      const dType = (d.disaster_type || '').toUpperCase();
      // Spatial grid key (~12km resolution)
      const spatialKey = `${dType}-${Math.round(lat * 8) / 8},${Math.round(lon * 8) / 8}`;
      // Normalized name token
      const nameKey = `${dType}-${(d.place || d.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14)}`;

      if (seenEvents.has(spatialKey) || seenEvents.has(nameKey)) {
        return; // Discard duplicate marker!
      }
      seenEvents.add(spatialKey);
      seenEvents.add(nameKey);
      dedupedDisasters.push(d);
    });

    // 2. Group closely positioned hazards into spatial clusters to eliminate overlap
    const clusters: LiveDisaster[][] = [];
    dedupedDisasters.forEach((d) => {
      const lat = Number(d.latitude);
      const lon = Number(d.longitude);
      let foundCluster = false;
      for (const cluster of clusters) {
        const first = cluster[0];
        const dist = Math.hypot(lat - Number(first.latitude), lon - Number(first.longitude));
        if (dist < 0.35) {
          cluster.push(d);
          foundCluster = true;
          break;
        }
      }
      if (!foundCluster) {
        clusters.push([d]);
      }
    });

    // 3. Render EVERY hazard with anti-collision fanning & staggered labels (NONE touch each other)
    clusters.forEach((clusterItems) => {
      const count = clusterItems.length;
      clusterItems.forEach((d, index) => {
        let lat = Number(d.latitude);
        let lon = Number(d.longitude);

        // Anti-collision fanning offset when multiple hazards exist in the same cluster
        if (count > 1) {
          const angle = (index / count) * (2 * Math.PI) + (Math.PI / 4);
          const offsetRadius = 0.22; // ~25km separation offset
          lat = lat + Math.sin(angle) * offsetRadius;
          lon = lon + (Math.cos(angle) * offsetRadius) / Math.cos((lat * Math.PI) / 180);
        }

        const dType = (d.disaster_type || '').toUpperCase();
        const color = getDisasterColor(dType);
        const cleanPlace = (d.place || '').replace(/,\s*(India|Nepal|Bangladesh|Myanmar|Bhutan|Global)$/i, '').trim();
        const displayLocation = cleanPlace || d.place || d.title;

        // Clean, compact placename for top label
        const primaryTown = displayLocation.split(',')[0].trim();
        const shortName = primaryTown.length > 12 ? primaryTown.slice(0, 11) + '…' : primaryTown;

        const isCrit = d.severity === 'CRITICAL';
        const beaconColor = color.hex;

        // Stagger label placement: top for even indices, bottom for odd indices so labels NEVER touch
        const isBottom = count > 1 && index % 2 === 1;
        const labelPosClass = isBottom 
          ? 'top-full mt-1.5' 
          : 'bottom-full mb-1.5';

        const pinHtml = `
          <div class="relative flex flex-col items-center select-none cursor-pointer group">
            <!-- Non-Overlapping Staggered Label -->
            <div class="absolute ${labelPosClass} px-1.5 py-0.5 rounded bg-black/90 text-white font-mono text-[9px] font-bold border border-neutral-700/90 shadow-md whitespace-nowrap flex items-center space-x-1 pointer-events-none transition-transform duration-100 group-hover:scale-105 z-20">
              <span style="background-color: ${beaconColor};" class="w-1.5 h-1.5 rounded-full shrink-0"></span>
              <span class="max-w-[100px] truncate uppercase tracking-wider">${shortName}</span>
            </div>

            <!-- Visible Luminous Beacon Dot (~14px) -->
            <div class="relative flex items-center justify-center">
              ${isCrit ? `<span style="background-color: ${beaconColor};" class="absolute w-5 h-5 rounded-full animate-ping opacity-35 pointer-events-none"></span>` : ''}
              <div style="background-color: ${beaconColor};" class="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-transform duration-100 group-hover:scale-125 z-10"></div>
            </div>
          </div>
        `;

        const pinIcon = L.divIcon({
          className: 'custom-hazard-beacon',
          html: pinHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([lat, lon], { icon: pinIcon });

        // Rich Leaflet Popup with Detailed Info
        const popupContent = `
          <div class="p-3.5 bg-neutral-950 text-white rounded-xl border border-neutral-800 shadow-2xl font-sans min-w-[240px] max-w-[280px]">
            <div class="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div class="flex items-center space-x-2">
                <span style="background-color: ${beaconColor};" class="w-2.5 h-2.5 rounded-full"></span>
                <span class="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-300">${dType}</span>
              </div>
              <span class="text-[9px] font-mono px-2 py-0.5 rounded font-bold ${isCrit ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-neutral-900 text-neutral-300'}">${d.severity}</span>
            </div>
            <div class="py-2.5 space-y-1">
              <h4 class="text-xs font-bold text-white leading-snug">${d.title || displayLocation}</h4>
              <p class="text-[11px] text-neutral-400 font-mono">${displayLocation}</p>
              ${d.description ? `<p class="text-[10px] text-neutral-300 line-clamp-3 leading-relaxed pt-1">${d.description}</p>` : ''}
            </div>
            <div class="pt-2 border-t border-neutral-900 flex items-center justify-between text-[9px] font-mono text-neutral-400">
              <span>${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E</span>
              <span class="text-neutral-500">Verified</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'custom-hazard-leaflet-popup',
          closeButton: true,
          offset: [0, -12]
        });

        // Hover shows detail popup and closes immediately on mouseout (No 2-min timer!)
        marker.on('mouseover', () => {
          marker.openPopup();
        });
        marker.on('mouseout', () => {
          marker.closePopup();
        });

        // Click keeps popup open and inspects in console
        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          marker.openPopup();
          onInspectItem({ type: 'DISASTER', data: d });
        });

        marker.addTo(disasterMarkersGroupRef.current);
      });
    });
  }, [disasters, effectiveZoneId, onInspectItem]);

  // RENDER SHELTER MARKERS (SLEEK, COMPACT)
  const renderShelters = useCallback((map: any) => {
    const L = (window as any).L;
    if (!L || !map || !shelterMarkersGroupRef.current) return;

    shelterMarkersGroupRef.current.clearLayers();

    if (!showShelters) return;

    (shelters || []).forEach((sh) => {
      const pct = Math.round((sh.current_occupancy / sh.total_capacity) * 100);
      const shelterHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer select-none">
          <div class="absolute bottom-5 hidden group-hover:flex items-center bg-black/90 text-white text-[9px] px-2 py-0.5 rounded shadow border border-neutral-700 whitespace-nowrap z-30 pointer-events-none">
            ${sh.name} (${pct}%)
          </div>
          <div class="w-2 h-2 rounded-xs bg-white border border-black shadow"></div>
        </div>
      `;

      const shelterIcon = L.divIcon({
        className: 'custom-shelter-pin',
        html: shelterHtml,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const marker = L.marker([sh.latitude, sh.longitude], { icon: shelterIcon });
      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        onInspectItem({ type: 'SHELTER', data: sh });
      });

      marker.addTo(shelterMarkersGroupRef.current);
    });
  }, [shelters, showShelters, onInspectItem]);

  // INITIALIZE LEAFLET MAP ENGINE
  useEffect(() => {
    let isMounted = true;

    const initMap = () => {
      if (!isMounted || !mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      // Initialize map centered by default on Northern Himalayas & Karakoram
      const initialCenter = selectedCoordinates ? [selectedCoordinates.lat, selectedCoordinates.lon] : [33.2, 77.2];
      const initialZoom = selectedCoordinates?.zoom || 5.4;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
        doubleClickZoom: false,
        scrollWheelZoom: true,
        wheelDebounceTime: 60,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
      });

      leafletMapRef.current = map;

      // Base Tile Layer
      const tileCfg = getTileConfig(basemap);
      currentTileLayerRef.current = L.tileLayer(tileCfg.url, {
        attribution: tileCfg.attribution,
        maxZoom: tileCfg.maxZoom,
      }).addTo(map);

      // Layer Groups for clean updating
      zoneLayersGroupRef.current = L.layerGroup().addTo(map);
      disasterMarkersGroupRef.current = L.layerGroup().addTo(map);
      shelterMarkersGroupRef.current = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = L.layerGroup().addTo(map);

      // Viewport movement notification
      map.on('moveend', () => {
        const center = map.getCenter();
        const bounds = map.getBounds();
        if (onViewportChange) {
          onViewportChange({
            lat: center.lat,
            lon: center.lng,
            zoom: map.getZoom(),
            bounds: {
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
            }
          });
        }
      });

      // Double-click place inspection (WITHOUT involuntary camera jumping)
      map.on('dblclick', async (e: any) => {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        try {
          const geo = await api.reverseGeocode(lat, lon);
          const parentCity = (geo as any).parent_city || geo.city || geo.district || geo.locality || 'Location';
          const locality = geo.locality || parentCity;
          onInspectItem({
            type: 'PLACE',
            name: parentCity,
            parentCity: parentCity,
            locality: locality,
            lat,
            lon,
            displayName: geo.display_name || `${parentCity} (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
          } as any);
        } catch {
          onInspectItem({
            type: 'PLACE',
            name: 'Location',
            parentCity: 'Location',
            lat,
            lon,
            displayName: `Coordinates: ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
          } as any);
        }
      });

      // Re-run anti-collision decluttering dynamically on zoom changes
      map.on('zoomend', () => {
        renderDisasterMarkers(map);
      });

      // Render layers
      renderZones(map);
      renderDisasterMarkers(map);
      renderShelters(map);

      if (selectedCoordinates) {
        map.flyTo([selectedCoordinates.lat, selectedCoordinates.lon], selectedCoordinates.zoom || 11, { duration: 1.2 });
      }
    };

    // Load Leaflet CSS and JS via robust CDN loader
    const loadLeafletAssets = async () => {
      if (typeof window === 'undefined') return;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => {
            // Fallback CDN if unpkg is blocked
            const fallback = document.createElement('script');
            fallback.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
            fallback.onload = () => resolve();
            document.head.appendChild(fallback);
          };
          document.head.appendChild(script);
        });
      }

      initMap();
    };

    loadLeafletAssets();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    const map = leafletMapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const tileCfg = getTileConfig(basemap);
    currentTileLayerRef.current = L.tileLayer(tileCfg.url, {
      attribution: tileCfg.attribution,
      maxZoom: tileCfg.maxZoom,
    }).addTo(map);
  }, [basemap]);

  // Update Zone Borders
  useEffect(() => {
    if (leafletMapRef.current) {
      renderZones(leafletMapRef.current);
    }
  }, [showZoneBorders, effectiveZoneId, renderZones]);

  // Update Disaster Markers
  useEffect(() => {
    if (leafletMapRef.current) {
      renderDisasterMarkers(leafletMapRef.current);
    }
  }, [disasters, effectiveZoneId, renderDisasterMarkers]);

  // Update Shelters
  useEffect(() => {
    if (leafletMapRef.current) {
      renderShelters(leafletMapRef.current);
    }
  }, [shelters, showShelters, renderShelters]);

  // Selected Coordinates Camera Fly-to
  useEffect(() => {
    if (!leafletMapRef.current || !selectedCoordinates) return;
    leafletMapRef.current.flyTo(
      [selectedCoordinates.lat, selectedCoordinates.lon],
      selectedCoordinates.zoom || 11,
      { duration: 1.2 }
    );
  }, [selectedCoordinates]);

  // User Location Marker
  useEffect(() => {
    const map = leafletMapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        className: 'user-loc-pin',
        html: userHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon }).addTo(map);
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full bg-[#0B0F19] overflow-hidden select-none">
      {/* Map DOM Container (No isolated z-0 so Leaflet panes participate in stacking) */}
      <div ref={mapContainerRef} className="w-full h-full relative" tabIndex={0} />

      {/* Embedded Floating Overlays (SearchCard) */}
      {children}

      {/* 1. LAYER SWITCHER (Top Right - No collision with SearchCard) */}
      <div className="absolute top-4 right-4 sm:right-6 z-[450] flex flex-col items-end space-y-2 select-none pointer-events-auto">
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className={`p-2.5 rounded-xl border backdrop-blur-md shadow-2xl transition flex items-center space-x-2 ${
              isLayerMenuOpen
                ? 'bg-black text-white border-neutral-700'
                : 'bg-black/85 text-white/90 border-neutral-800 hover:bg-black hover:text-white'
            }`}
            title="Map Basemaps & Layers"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {basemap === 'satellite' ? 'Satellite' : basemap === 'street' ? 'Street' : 'Dark'}
            </span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute top-12 right-0 w-60 bg-black/95 text-white border border-neutral-800 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-in fade-in backdrop-blur-xl z-50">
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Select Basemap
                </span>
                <button
                  onClick={() => setIsLayerMenuOpen(false)}
                  className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={() => {
                    setBasemap('satellite');
                    setIsLayerMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-center flex flex-col items-center space-y-1 border transition ${
                    basemap === 'satellite'
                      ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-bold'
                      : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-[11px]">Satellite</span>
                </button>

                <button
                  onClick={() => {
                    setBasemap('street');
                    setIsLayerMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-center flex flex-col items-center space-y-1 border transition ${
                    basemap === 'street'
                      ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-bold'
                      : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-[11px]">Street</span>
                </button>

                <button
                  onClick={() => {
                    setBasemap('dark');
                    setIsLayerMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-center flex flex-col items-center space-y-1 border transition ${
                    basemap === 'dark'
                      ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-bold'
                      : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-[11px]">Dark</span>
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
                <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>5 Operational Zones</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showZoneBorders}
                    onChange={(e) => setShowZoneBorders(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>Relief Shelters</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showShelters}
                    onChange={(e) => setShowShelters(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. CAMERA CONTROLS (Right Side) */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-20 flex flex-col items-end space-y-2 select-none pointer-events-auto">
        <div className="bg-black/90 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col divide-y divide-neutral-800 text-white">
          <button
            onClick={() => {
              if (leafletMapRef.current) {
                leafletMapRef.current.flyTo([23.0, 80.5], 5, { duration: 1.0 });
              }
            }}
            title="Reset to All India"
            className="p-2.5 hover:bg-neutral-800 transition flex items-center justify-center group"
          >
            <Compass className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => {
              if (leafletMapRef.current) leafletMapRef.current.zoomIn();
            }}
            title="Zoom In"
            className="p-2.5 hover:bg-neutral-800 transition flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (leafletMapRef.current) leafletMapRef.current.zoomOut();
            }}
            title="Zoom Out"
            className="p-2.5 hover:bg-neutral-800 transition flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={onTriggerLocate}
            title="Center on My Location"
            className="p-2.5 hover:bg-neutral-800 text-white transition flex items-center justify-center"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
