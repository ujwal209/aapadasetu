"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Globe2, 
  Layers, 
  MapPin, 
  Compass, 
  Plus, 
  Minus, 
  Crosshair,
  Sliders,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { LiveEarthquake, ReliefShelter, LiveDisaster } from '../types';
import { api } from '../lib/api';
import { InspectItem } from './PlaceDetailCard';

interface GlobeViewer3DProps {
  earthquakes: LiveEarthquake[];
  disasters?: LiveDisaster[];
  shelters?: ReliefShelter[];
  userLocation?: { lat: number; lon: number; locality?: string } | null;
  selectedCoordinates?: { lat: number; lon: number; zoom?: number; name?: string } | null;
  onInspectItem: (item: InspectItem) => void;
  onTriggerLocate: () => void;
  onViewportChange?: (viewport: { lat: number; lon: number; zoom: number; bounds?: { north: number; south: number; east: number; west: number } }) => void;
  isLocating?: boolean;
}

export const GlobeViewer3D: React.FC<GlobeViewer3DProps> = ({
  earthquakes,
  disasters = [],
  shelters = [],
  userLocation,
  selectedCoordinates,
  onInspectItem,
  onTriggerLocate,
  onViewportChange,
  isLocating,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null);
  const shelterMarkersRef = useRef<maplibregl.Marker[]>([]);
  const disasterMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Camera State
  const [currentPitch, setCurrentPitch] = useState<number>(0);
  const [currentBearing, setCurrentBearing] = useState<number>(0);
  const [showAngleSlider, setShowAngleSlider] = useState<boolean>(false);
  const angleSliderRef = useRef<HTMLDivElement>(null);

  // Close 3D angle slider on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (angleSliderRef.current && !angleSliderRef.current.contains(e.target as Node)) {
        setShowAngleSlider(false);
      }
    };
    if (showAngleSlider) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showAngleSlider]);

  // Layer State
  const [basemap, setBasemap] = useState<'satellite' | 'osm' | 'dark'>('satellite');
  const [terrainEnabled, setTerrainEnabled] = useState<boolean>(true);
  const [showSheltersOnGlobe, setShowSheltersOnGlobe] = useState<boolean>(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);

  // Basemap style generator (100% free open-source tiles with seamless spherical labels)
  const getStyleForBasemap = (type: 'satellite' | 'osm' | 'dark') => {
    let rasterTile = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = 'ESRI World Imagery';

    if (type === 'osm') {
      rasterTile = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = 'OpenStreetMap Contributors';
    } else if (type === 'dark') {
      rasterTile = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
      attribution = 'CartoDB Dark Matter';
    }

    const sources: any = {
      'basemap-source': {
        type: 'raster' as const,
        tiles: [rasterTile],
        tileSize: 256,
        attribution,
      },
      'terrain-source': {
        type: 'raster-dem' as const,
        tiles: [
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
        ],
        encoding: 'terrarium' as const,
        tileSize: 256,
        maxzoom: 14,
      },
    };

    const layers: any[] = [
      {
        id: 'basemap-layer',
        type: 'raster' as const,
        source: 'basemap-source',
      },
    ];

    // Seamlessly overlay real boundaries and authoritative city names directly on the 3D globe surface
    if (type === 'satellite') {
      sources['reference-labels-source'] = {
        type: 'raster' as const,
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'ESRI Boundaries and Places',
      };
      layers.push({
        id: 'reference-labels-layer',
        type: 'raster' as const,
        source: 'reference-labels-source',
      });
    }

    return {
      version: 8 as const,
      sources,
      layers,
      terrain: terrainEnabled
        ? {
            source: 'terrain-source',
            exaggeration: 1.5,
          }
        : undefined,
    };
  };

  // 1. INITIALIZE NORMAL MAP (Edge-to-edge seamless view with 3D angle support)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const mapOptions: any = {
        container: mapContainerRef.current,
        style: getStyleForBasemap(basemap) as any,
        center: [78.9629, 20.5937],
        zoom: 4.2,
        pitch: 0,
        maxPitch: 75,
      };

      const map = new maplibregl.Map(mapOptions);
      mapRef.current = map;

      map.on('pitch', () => setCurrentPitch(Math.round(map.getPitch())));
      map.on('rotate', () => setCurrentBearing(Math.round(map.getBearing())));

      // Viewport movement listener: notifies when user pans to a different place
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

      map.on('load', () => {
        renderEarthquakeLayers(map, earthquakes);
        renderDisasterMarkers(map, disasters);
        embedShelterPlaces(map, shelters);

        if (selectedCoordinates) {
          flyToCoordinates(selectedCoordinates.lon, selectedCoordinates.lat, selectedCoordinates.zoom || 13);
        }
      });

      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error("Map initialization error:", err);
    }
  }, []);

  // Update Basemap & Terrain
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const bearing = map.getBearing();

    map.setStyle(getStyleForBasemap(basemap) as any);
    map.once('style.load', () => {
      map.setCenter(center);
      map.setZoom(zoom);
      map.setPitch(pitch);
      map.setBearing(bearing);
      renderEarthquakeLayers(map, earthquakes);
      renderDisasterMarkers(map, disasters);
      embedShelterPlaces(map, shelters);
    });
  }, [basemap, terrainEnabled]);

  // Update Earthquake Layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.isStyleLoaded()) {
      renderEarthquakeLayers(map, earthquakes);
    } else {
      map.once('style.load', () => {
        renderEarthquakeLayers(map, earthquakes);
      });
    }
  }, [earthquakes]);

  // Update Multi-Hazard Disasters Layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.isStyleLoaded() || map.loaded()) {
      renderDisasterMarkers(map, disasters || []);
    } else {
      map.once('style.load', () => {
        renderDisasterMarkers(map, disasters || []);
      });
    }
  }, [disasters]);


  // Update Shelters Layer
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    embedShelterPlaces(mapRef.current, shelters);
  }, [shelters, showSheltersOnGlobe]);

  // 2. GUARANTEED FLY-TO WHEN A TOWN OR COORDINATE IS SEARCHED
  const flyToCoordinates = (lon: number, lat: number, zoom = 13, pitch = 55) => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    map.stop();
    map.flyTo({
      center: [lon, lat],
      zoom: zoom,
      pitch: pitch,
      essential: true,
      duration: 2200,
    });

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
    }

    // Minimal single-color target marker (Zero emojis)
    const pinEl = document.createElement('div');
    pinEl.className = 'flex flex-col items-center select-none animate-in fade-in';
    pinEl.innerHTML = `
      <div class="bg-black text-white font-mono text-[10px] px-2 py-0.5 rounded shadow-sm border border-white/90 whitespace-nowrap mb-1">
        Target Location
      </div>
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-black/30 dark:bg-white/30 animate-ping"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-black dark:bg-white border-2 border-white dark:border-black shadow-md"></div>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: pinEl })
      .setLngLat([lon, lat])
      .addTo(map);

    searchMarkerRef.current = marker;
  };

  useEffect(() => {
    if (!selectedCoordinates) return;
    flyToCoordinates(
      selectedCoordinates.lon, 
      selectedCoordinates.lat, 
      selectedCoordinates.zoom || 13,
      currentPitch || 55
    );
  }, [selectedCoordinates]);

  // Helper to generate 20km surveillance circle GeoJSON
  const createGeoJsonCircle = (center: [number, number], radiusKm: number, points = 64) => {
    const coords: [number, number][] = [];
    const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = radiusKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center[0] + x, center[1] + y]);
    }
    coords.push(coords[0]);

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords],
      },
      properties: {},
    };
  };

  const render20kmPerimeter = (map: maplibregl.Map, lon: number, lat: number) => {
    try {
      const circleFeature = createGeoJsonCircle([lon, lat], 20);

      if (map.getLayer('user-20km-fill')) map.removeLayer('user-20km-fill');
      if (map.getLayer('user-20km-stroke')) map.removeLayer('user-20km-stroke');
      if (map.getSource('user-20km-source')) map.removeSource('user-20km-source');

      map.addSource('user-20km-source', {
        type: 'geojson',
        data: circleFeature,
      });

      map.addLayer({
        id: 'user-20km-fill',
        type: 'fill',
        source: 'user-20km-source',
        paint: {
          'fill-color': '#737373',
          'fill-opacity': 0.06,
        },
      });

      map.addLayer({
        id: 'user-20km-stroke',
        type: 'line',
        source: 'user-20km-source',
        paint: {
          'line-color': '#525252',
          'line-width': 1.5,
          'line-dasharray': [3, 2],
          'line-opacity': 0.65,
        },
      });
    } catch (e) {
      console.warn("Perimeter render error:", e);
    }
  };

  // Handle User Location (Zoom out to 20km radius view + render perimeter circle)
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const map = mapRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'flex flex-col items-center select-none';
    el.innerHTML = `
      <div class="bg-black dark:bg-white text-white dark:text-black font-semibold text-[10px] px-3 py-1 rounded-full shadow-lg border border-white/90 whitespace-nowrap mb-1.5 flex items-center space-x-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-white dark:bg-black animate-ping"></span>
        <span>20km Sector: ${userLocation.locality || 'GPS'}</span>
      </div>
      <div class="relative flex items-center justify-center pointer-events-none">
        <div class="absolute w-48 h-48 rounded-full border border-neutral-500/30 animate-radar-sweep bg-gradient-to-tr from-neutral-500/20 via-transparent to-transparent"></div>
        <div class="absolute w-32 h-32 rounded-full border border-neutral-400/40 animate-ping"></div>
        <div class="absolute w-16 h-16 rounded-full bg-neutral-500/20 animate-pulse"></div>
        <div class="w-4 h-4 rounded-full bg-black dark:bg-white border-2 border-white dark:border-black shadow-xl z-10"></div>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([userLocation.lon, userLocation.lat])
      .addTo(map);

    userMarkerRef.current = marker;

    // Zoom out to 20km radius bounding box
    const lat = userLocation.lat;
    const lon = userLocation.lon;
    const latDelta = 20 / 110.574;
    const lonDelta = 20 / (111.32 * Math.cos((lat * Math.PI) / 180));

    map.fitBounds([
      [lon - lonDelta, lat - latDelta],
      [lon + lonDelta, lat + latDelta]
    ], {
      padding: { top: 90, bottom: 90, left: 90, right: 90 },
      pitch: currentPitch || 45,
      duration: 2400,
      essential: true,
    });

    // Render 20km circle perimeter
    render20kmPerimeter(map, lon, lat);
  }, [userLocation]);

  // Markers visibility manager: ensures all hazard & shelter markers remain crisp and visible
  const updateMarkersOcclusion = (map: maplibregl.Map | null) => {
    if (!map) return;
    try {
      disasterMarkersRef.current.forEach((marker) => {
        const el = marker.getElement();
        if (el) el.style.display = '';
      });

      shelterMarkersRef.current.forEach((marker) => {
        const el = marker.getElement();
        if (el) el.style.display = '';
      });

      if (searchMarkerRef.current) {
        const el = searchMarkerRef.current.getElement();
        if (el) el.style.display = '';
      }
    } catch {}
  };

  // 3. EMBED RELIEF SHELTERS (Minimal, Professional Pin with Tooltip on Hover)
  const embedShelterPlaces = (map: maplibregl.Map, shelterList: ReliefShelter[]) => {
    shelterMarkersRef.current.forEach((m) => m.remove());
    shelterMarkersRef.current = [];

    if (!showSheltersOnGlobe) return;

    shelterList.forEach((sh) => {
      const el = document.createElement('div');
      el.className = 'relative flex flex-col items-center group cursor-pointer select-none';
      const pct = Math.round((sh.current_occupancy / sh.total_capacity) * 100);
      
      el.innerHTML = `
        <!-- Tooltip appears strictly on hover -->
        <div class="absolute bottom-5 hidden group-hover:flex items-center bg-black text-white dark:bg-white dark:text-black font-semibold text-[9px] px-2 py-0.5 rounded shadow-lg border border-neutral-700 dark:border-neutral-300 whitespace-nowrap z-30 pointer-events-none">
          ${sh.name} (${pct}%)
        </div>
        <div class="w-2.5 h-2.5 rounded-sm bg-black dark:bg-white border border-white dark:border-black shadow-xs transition-transform duration-150 transform group-hover:scale-125"></div>
      `;

      el.addEventListener('click', () => {
        onInspectItem({ type: 'SHELTER', data: sh });
        flyToCoordinates(sh.longitude, sh.latitude, 14, currentPitch || 55);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([sh.longitude, sh.latitude])
        .addTo(map);

      shelterMarkersRef.current.push(marker);
    });

    updateMarkersOcclusion(map);
  };

  // 4b. COLOR-CODED REAL-WORLD DISASTERS WITH OVERLAP COLLISION AVOIDANCE
  const getDisasterColor = (type: string) => {
    switch (type) {
      case 'FLOOD':
        return { hex: '#0284C7', ping: '#38BDF8' };
      case 'CYCLONE':
        return { hex: '#6366F1', ping: '#818CF8' };
      case 'TSUNAMI':
        return { hex: '#0D9488', ping: '#2DD4BF' };
      case 'FIRE':
        return { hex: '#E11D48', ping: '#FB7185' };
      case 'EARTHQUAKE':
      default:
        return { hex: '#D97706', ping: '#FBBF24' };
    }
  };

  const getDisasterSvg = (type: string) => {
    switch (type) {
      case 'FLOOD':
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0M2 18c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0"/></svg>`;
      case 'CYCLONE':
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7a5 5 0 0 1 5 5c0 2.5-2 4-5 4s-4-2-4-4"/></svg>`;
      case 'TSUNAMI':
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20c4-4 8-16 12-16 3 0 6 6 8 8M2 20h20"/></svg>`;
      case 'FIRE':
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
      case 'EARTHQUAKE':
      default:
        return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
    }
  };

  const renderDisasterMarkers = (map: maplibregl.Map, list: LiveDisaster[]) => {
    disasterMarkersRef.current.forEach((m) => m.remove());
    disasterMarkersRef.current = [];

    // Filter valid coordinates strictly to prevent invalid LngLat throws
    const validDisasters = (list || []).filter((d) => {
      const lon = Number(d.longitude);
      const lat = Number(d.latitude);
      return !isNaN(lon) && !isNaN(lat) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
    });

    // 1. Hardware-Accelerated WebGL Disaster Layer (Guaranteed 100% visible worldwide)
    const geojsonData: any = {
      type: 'FeatureCollection',
      features: validDisasters.map((d) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(d.longitude), Number(d.latitude)],
        },
        properties: {
          id: d.id,
          title: d.title,
          place: d.place,
          disaster_type: d.disaster_type,
          severity: d.severity,
          risk_score: d.risk_score || 70,
        },
      })),
    };

    if (map.getLayer('disaster-glow')) map.removeLayer('disaster-glow');
    if (map.getLayer('disaster-points')) map.removeLayer('disaster-points');
    if (map.getSource('live-disasters-source')) map.removeSource('live-disasters-source');

    map.addSource('live-disasters-source', {
      type: 'geojson',
      data: geojsonData,
    });

    map.addLayer({
      id: 'disaster-glow',
      type: 'circle',
      source: 'live-disasters-source',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          2, 11,
          6, 18,
          10, 28,
        ],
        'circle-color': [
          'match',
          ['get', 'disaster_type'],
          'FLOOD', '#0284C7',
          'CYCLONE', '#6366F1',
          'TSUNAMI', '#0D9488',
          'FIRE', '#E11D48',
          '#D97706'
        ],
        'circle-opacity': 0.28,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#FFFFFF',
      },
    });

    map.addLayer({
      id: 'disaster-points',
      type: 'circle',
      source: 'live-disasters-source',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          2, 5.5,
          6, 8,
          10, 12,
        ],
        'circle-color': [
          'match',
          ['get', 'disaster_type'],
          'FLOOD', '#0284C7',
          'CYCLONE', '#6366F1',
          'TSUNAMI', '#0D9488',
          'FIRE', '#E11D48',
          '#D97706'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF',
      },
    });

    map.on('click', 'disaster-points', (e) => {
      if (!e.features || !e.features[0]) return;
      const props = e.features[0].properties as any;
      const matched = validDisasters.find((d) => d.id === props.id);
      if (matched) {
        onInspectItem({ type: 'DISASTER', data: matched });
        flyToCoordinates(matched.longitude, matched.latitude, 11, currentPitch || 45);
      }
    });

    // 2. Interactive DOM Pins with Icons & Tooltips
    validDisasters.forEach((d) => {
      const el = document.createElement('div');
      el.className = 'relative flex flex-col items-center group cursor-pointer select-none';
      const iconSvg = getDisasterSvg(d.disaster_type);
      const color = getDisasterColor(d.disaster_type);

      const cleanPlace = (d.place || '').replace(/,\s*(India|Global)$/i, '').trim();
      const displayLocation = cleanPlace || d.place || d.title;

      el.innerHTML = `
        <!-- Floating Tooltip on Hover Only (Zero Label Collision) -->
        <div class="absolute bottom-9 hidden group-hover:flex items-center space-x-2 bg-black/95 text-white dark:bg-white/95 dark:text-black font-sans text-[11px] px-3 py-1.5 rounded-lg shadow-2xl border border-neutral-700/60 dark:border-neutral-300/60 z-40 whitespace-nowrap pointer-events-none backdrop-blur-md">
          <span style="background-color: ${color.ping};" class="w-2 h-2 rounded-full animate-ping flex-shrink-0"></span>
          <div class="flex flex-col text-left">
            <span class="font-mono uppercase tracking-wider text-[9px] text-neutral-400 dark:text-neutral-500 font-bold">${d.disaster_type} • ${d.severity || 'ALERT'}</span>
            <span class="font-semibold leading-tight">${displayLocation}</span>
          </div>
        </div>
        <!-- Monochrome Pill Shell with Hazard-Colored Icon Inside -->
        <div style="width: 28px; height: 28px; min-width: 28px; min-height: 28px; color: ${color.hex};" class="rounded-full bg-white dark:bg-black flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-md transition-transform duration-200 transform group-hover:scale-125 z-20">
          ${iconSvg}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onInspectItem({ type: 'DISASTER', data: d });
        flyToCoordinates(d.longitude, d.latitude, 11, currentPitch || 45);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([d.longitude, d.latitude])
        .addTo(map);

      disasterMarkersRef.current.push(marker);
    });

    updateMarkersOcclusion(map);
  };

  // 5. RENDER REAL-TIME USGS EARTHQUAKES WITH MONOCHROMATIC RISK BUFFERS
  const renderEarthquakeLayers = (map: maplibregl.Map, quakes: LiveEarthquake[]) => {
    const geojsonData: any = {
      type: 'FeatureCollection',
      features: quakes.map((q) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [q.longitude, q.latitude],
        },
        properties: {
          id: q.id,
          title: q.title,
          place: q.place,
          magnitude: q.magnitude,
          depth_km: q.depth_km,
          time: q.time,
          risk_score: q.risk_score,
          severity: q.severity,
          buffer_radius_km: q.buffer_radius_km,
        },
      })),
    };

    if (map.getLayer('quake-points')) map.removeLayer('quake-points');
    if (map.getLayer('quake-buffers')) map.removeLayer('quake-buffers');
    if (map.getSource('live-quakes-source')) map.removeSource('live-quakes-source');

    map.addSource('live-quakes-source', {
      type: 'geojson',
      data: geojsonData,
    });

    map.addLayer({
      id: 'quake-buffers',
      type: 'circle',
      source: 'live-quakes-source',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          2, ['*', ['get', 'magnitude'], 2.8],
          6, ['*', ['get', 'magnitude'], 7.0],
          10, ['*', ['get', 'magnitude'], 16.0],
        ],
        'circle-color': '#D97706',
        'circle-opacity': 0.22,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#B45309',
      },
    });

    map.addLayer({
      id: 'quake-points',
      type: 'circle',
      source: 'live-quakes-source',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'magnitude'],
          2.5, 4,
          5.0, 6.5,
          7.0, 10
        ],
        'circle-color': '#D97706',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF',
      },
    });

    map.on('click', 'quake-points', (e) => {
      if (!e.features || !e.features[0]) return;
      const props = e.features[0].properties as any;
      const quakeObj: LiveEarthquake = {
        id: props.id,
        title: props.title,
        place: props.place,
        magnitude: Number(props.magnitude),
        depth_km: Number(props.depth_km),
        time: Number(props.time),
        url: '',
        tsunami: false,
        longitude: (e.lngLat as any).lng,
        latitude: (e.lngLat as any).lat,
        risk_score: Number(props.risk_score),
        severity: props.severity,
        buffer_radius_km: Number(props.buffer_radius_km),
      };
      onInspectItem({ type: 'QUAKE', data: quakeObj });
    });

    map.on('mouseenter', 'quake-points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'quake-points', () => {
      map.getCanvas().style.cursor = '';
    });
  };

  // 6. DIRECT 3D ANGLE & PITCH ADJUSTMENT
  const setPitchAngle = (pitch: number) => {
    if (!mapRef.current) return;
    const clamped = Math.min(85, Math.max(0, pitch));
    setCurrentPitch(clamped);
    mapRef.current.setPitch(clamped);
  };

  const adjustPitchStep = (delta: number) => {
    if (!mapRef.current) return;
    const next = Math.min(85, Math.max(0, currentPitch + delta));
    setPitchAngle(next);
  };

  const zoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const zoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const resetNorth = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({ bearing: 0 });
      setCurrentBearing(0);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 1. BOTTOM-LEFT LAYER DRAWER */}
      <div className="absolute bottom-6 left-4 sm:left-6 z-30 select-none">
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="group flex flex-col items-center bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden hover:scale-105 transition-all w-14 h-14 relative"
          >
            <div className="w-full h-full bg-neutral-900 dark:bg-neutral-950 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <span className="absolute bottom-0 inset-x-0 bg-black/90 backdrop-blur-xs text-[9px] font-bold text-white uppercase text-center py-0.5">
              Layers
            </span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute bottom-16 left-0 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-3 w-52 space-y-2 text-xs">
              <div className="font-semibold text-[10px] uppercase tracking-wider text-neutral-400">
                Basemap Layer
              </div>

              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => {
                    setBasemap('satellite');
                    setIsLayerMenuOpen(false);
                  }}
                  className={`p-1.5 rounded-lg text-center flex flex-col items-center space-y-1 border transition ${
                    basemap === 'satellite'
                      ? 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 font-semibold text-black dark:text-white'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Satellite</span>
                </button>

                <button
                  onClick={() => {
                    setBasemap('osm');
                    setIsLayerMenuOpen(false);
                  }}
                  className={`p-1.5 rounded-lg text-center flex flex-col items-center space-y-1 border transition ${
                    basemap === 'osm'
                      ? 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 font-semibold text-black dark:text-white'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[10px]">OSM</span>
                </button>

                <button
                  onClick={() => {
                    setBasemap('dark');
                    setIsLayerMenuOpen(false);
                  }}
                  className={`p-1.5 rounded-lg text-center flex flex-col items-center space-y-1 border transition ${
                    basemap === 'dark'
                      ? 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 font-semibold text-black dark:text-white'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Dark</span>
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5 text-[11px]">
                <label className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <span>3D Elevation Mesh</span>
                  <input
                    type="checkbox"
                    checked={terrainEnabled}
                    onChange={(e) => setTerrainEnabled(e.target.checked)}
                    className="rounded accent-black dark:accent-white"
                  />
                </label>

                <label className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <span>Relief Shelters</span>
                  <input
                    type="checkbox"
                    checked={showSheltersOnGlobe}
                    onChange={(e) => setShowSheltersOnGlobe(e.target.checked)}
                    className="rounded accent-black dark:accent-white"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. DEDICATED 3D ANGLE & CAMERA CONTROLS (Right Side) */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-30 flex flex-col items-end space-y-2 select-none pointer-events-auto">
        {showAngleSlider && (
          <div 
            ref={angleSliderRef}
            className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-3.5 mb-1 space-y-2.5 text-xs w-48 animate-in fade-in"
          >
            <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center space-x-1">
                <Sliders className="w-3 h-3 text-neutral-700 dark:text-neutral-300" />
                <span>3D Pitch Angle</span>
              </span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white">
                  {currentPitch}°
                </span>
                <button
                  onClick={() => setShowAngleSlider(false)}
                  className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white transition"
                  title="Close 3D Angle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="85"
              step="1"
              value={currentPitch}
              onChange={(e) => setPitchAngle(Number(e.target.value))}
              className="w-full accent-black dark:accent-white cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
            />

            <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold pt-0.5">
              <button
                onClick={() => setPitchAngle(0)}
                className={`py-0.5 rounded border transition ${
                  currentPitch === 0
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                0°
              </button>
              <button
                onClick={() => setPitchAngle(50)}
                className={`py-0.5 rounded border transition ${
                  currentPitch >= 45 && currentPitch <= 55
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                50°
              </button>
              <button
                onClick={() => setPitchAngle(80)}
                className={`py-0.5 rounded border transition ${
                  currentPitch >= 75
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                80°
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
          <button
            onClick={resetNorth}
            title="Reset North"
            className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex items-center justify-center group"
          >
            <Compass 
              className="w-4 h-4 text-neutral-800 dark:text-neutral-200 group-hover:scale-110 transition-transform" 
              style={{ transform: `rotate(${-currentBearing}deg)` }}
            />
          </button>

          <button
            onClick={() => setShowAngleSlider(!showAngleSlider)}
            title="Toggle 3D Angle Panel"
            className={`p-2 font-mono font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex items-center justify-center ${
              showAngleSlider ? 'text-black dark:text-white underline font-bold' : 'text-neutral-500'
            }`}
          >
            {currentPitch}°
          </button>

          <button
            onClick={() => adjustPitchStep(10)}
            title="Tilt Up +10°"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex items-center justify-center text-neutral-700 dark:text-neutral-300"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => adjustPitchStep(-10)}
            title="Tilt Down -10°"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex items-center justify-center text-neutral-700 dark:text-neutral-300"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <button
            onClick={zoomIn}
            title="Zoom in"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={zoomOut}
            title="Zoom out"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={onTriggerLocate}
            title="Center on My Location"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition flex items-center justify-center"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
