"use client";

import React, { useState, useMemo } from 'react';
import { 
  Navigation,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  ShieldAlert,
  Flame,
  Waves,
  Wind,
  Activity
} from 'lucide-react';
import { LiveDisaster, DisasterAlert } from '../types';

interface AlertFeedProps {
  alerts?: DisasterAlert[];
  disasters?: LiveDisaster[];
  userLocation?: { lat: number; lon: number } | null;
  onFocusOnMap: (lat: number, lon: number, title?: string, item?: any) => void;
  onFindShelter?: (district: string) => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  alerts = [],
  disasters = [],
  userLocation,
  onFocusOnMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Combine live disasters (from map) and alerts into a unified list
  const unifiedItems = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      place: string;
      type: string;
      severity: string;
      latitude: number;
      longitude: number;
      source: string;
      url?: string;
      magnitude?: number | null;
      distanceKm: number | null;
    }> = [];

    const seen = new Set<string>();

    // 1. Primary: Map Disasters (USGS + GDACS + NASA EONET + Web Dispatches)
    disasters.forEach((d) => {
      // Filter out generic SEO weather portals and historical lists
      const lowerTitle = (d.title || '').toLowerCase();
      if (
        lowerTitle.includes('weather in') ||
        lowerTitle.includes('timeline') ||
        lowerTitle.includes('over a dozen years') ||
        lowerTitle.includes('natural disasters |') ||
        lowerTitle.includes('weather report') ||
        lowerTitle.includes('weatherapi')
      ) {
        return;
      }

      const key = `${d.latitude.toFixed(3)}_${d.longitude.toFixed(3)}_${d.disaster_type}`;
      if (seen.has(key)) return;
      seen.add(key);

      let distanceKm: number | null = null;
      if (userLocation) {
        const dLat = ((d.latitude - userLocation.lat) * Math.PI) / 180;
        const dLon = ((d.longitude - userLocation.lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLocation.lat * Math.PI) / 180) *
            Math.cos((d.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        distanceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      }

      list.push({
        id: d.id,
        title: d.title,
        place: d.place,
        type: d.disaster_type,
        severity: d.severity,
        latitude: d.latitude,
        longitude: d.longitude,
        source: d.source || 'Civil Protection Agency',
        url: d.url,
        magnitude: d.magnitude,
        distanceKm,
      });
    });

    // 2. Secondary fallback: alerts
    alerts.forEach((a) => {
      const key = `${a.location.latitude.toFixed(3)}_${a.location.longitude.toFixed(3)}_${a.disaster_type}`;
      if (seen.has(key)) return;
      seen.add(key);

      let distanceKm: number | null = null;
      if (userLocation) {
        const dLat = ((a.location.latitude - userLocation.lat) * Math.PI) / 180;
        const dLon = ((a.location.longitude - userLocation.lon) * Math.PI) / 180;
        const x =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLocation.lat * Math.PI) / 180) *
            Math.cos((a.location.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        distanceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
      }

      list.push({
        id: a.id,
        title: a.title,
        place: a.location.location_name || `${a.location.district}, ${a.location.state}`,
        type: a.disaster_type,
        severity: a.severity,
        latitude: a.location.latitude,
        longitude: a.location.longitude,
        source: a.source_agency || 'Civil Protection',
        distanceKm,
      });
    });

    return list;
  }, [disasters, alerts, userLocation]);

  // Filter items based on user search and disaster category
  const filtered = useMemo(() => {
    return unifiedItems.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source.toLowerCase().includes(searchTerm.toLowerCase());

      const isIndia =
        (item.place || '').toLowerCase().includes('india') ||
        (item.title || '').toLowerCase().includes('india') ||
        (item.source || '').toLowerCase().includes('india') ||
        (item.latitude >= 6.0 && item.latitude <= 38.0 && item.longitude >= 68.0 && item.longitude <= 98.0);

      const matchType =
        typeFilter === 'ALL' ||
        (typeFilter === 'INDIA' && isIndia) ||
        (typeFilter === 'QUAKE' && item.type.includes('EARTHQUAKE')) ||
        (typeFilter === 'FLOOD' && item.type.includes('FLOOD')) ||
        (typeFilter === 'CYCLONE' && (item.type.includes('CYCLONE') || item.type.includes('STORM'))) ||
        (typeFilter === 'FIRE' && (item.type.includes('FIRE') || item.type.includes('WILDFIRE')));

      return matchSearch && matchType;
    });
  }, [unifiedItems, searchTerm, typeFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('EARTHQUAKE')) return <Activity className="w-3.5 h-3.5" />;
    if (type.includes('FLOOD')) return <Waves className="w-3.5 h-3.5" />;
    if (type.includes('CYCLONE') || type.includes('STORM')) return <Wind className="w-3.5 h-3.5" />;
    if (type.includes('FIRE')) return <Flame className="w-3.5 h-3.5" />;
    return <ShieldAlert className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-3 select-text text-xs font-sans text-neutral-900 dark:text-white">
      {/* 1. Strict Monochrome Search & Controls */}
      <div className="space-y-2">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by city, region, or hazard type..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-black dark:focus:border-white transition shadow-xs"
          />
        </div>

        {/* Monochrome Category Filter Pills with India Watch */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: `All (${unifiedItems.length})` },
            { id: 'INDIA', label: '🇮🇳 India Watch' },
            { id: 'QUAKE', label: 'Quakes' },
            { id: 'FLOOD', label: 'Floods' },
            { id: 'CYCLONE', label: 'Cyclones' },
            { id: 'FIRE', label: 'Fires' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTypeChange(tab.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase transition flex-shrink-0 border ${
                typeFilter === tab.id
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xs'
                  : 'bg-white dark:bg-black text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-black dark:hover:text-white hover:border-neutral-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Paginated Live Disasters Stream */}
      <div className="space-y-2">
        {paginatedList.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 bg-neutral-50 dark:bg-black rounded-lg border border-neutral-200 dark:border-neutral-800">
            No active disaster advisories match this filter criteria.
          </div>
        ) : (
          paginatedList.map((item) => {
            const isIndiaItem =
              (item.place || '').toLowerCase().includes('india') ||
              (item.title || '').toLowerCase().includes('india') ||
              (item.source || '').toLowerCase().includes('india') ||
              (item.latitude >= 6.0 && item.latitude <= 38.0 && item.longitude >= 68.0 && item.longitude <= 98.0);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg space-y-2 transition hover:border-neutral-400 dark:hover:border-neutral-600 shadow-xs"
              >
                {/* Header Row: Type, Severity, Distance, India Tag */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <div className="p-1 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                      {getTypeIcon(item.type)}
                    </div>
                    {isIndiaItem && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        🇮🇳 INDIA
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                      {item.type} {item.magnitude ? `• M${item.magnitude.toFixed(1)}` : ''}
                    </span>
                    <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                      {item.severity}
                    </span>
                  </div>

                  {item.distanceKm !== null && (
                    <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.2 rounded border border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                      {item.distanceKm} km away
                    </span>
                  )}
                </div>

              {/* Title & Place */}
              <div>
                <h4 className="font-bold text-xs text-neutral-900 dark:text-white leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5 truncate">
                  {item.place}
                </p>
              </div>

              {/* Footer: Source and Center View Action */}
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-neutral-100 dark:border-neutral-900 text-neutral-400 font-mono">
                <span className="truncate max-w-[200px]">{item.source}</span>
                <div className="flex items-center space-x-2">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-black dark:hover:text-white transition"
                      title="View primary dispatch source"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => onFocusOnMap(item.latitude, item.longitude, item.title, item)}
                    className="text-neutral-900 dark:text-white font-semibold hover:underline flex items-center space-x-1 flex-shrink-0 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Focus Map</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>

      {/* 3. Strict Monochrome Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-white disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex items-center space-x-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="text-neutral-500 font-bold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-white disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex items-center space-x-1 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
