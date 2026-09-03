"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  MapPin, 
  Loader2, 
  Shield, 
  Crosshair,
  Sun,
  Moon,
  AlertCircle,
  Building,
  Radio
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PlaceSuggestion } from './SearchAutocomplete';

interface SearchCardProps {
  onSelectPlace: (place: { lat: number; lon: number; name: string; displayName: string; parentCity?: string; locality?: string }) => void;
  onToggleMenu: () => void;
  onFilterClick: (filter: 'hazards' | 'shelters' | 'cities' | 'sos' | 'safe' | 'india') => void;
  onDetectLocation: () => void;
  isLocating?: boolean;
}

export const SearchCard: React.FC<SearchCardProps> = ({
  onSelectPlace,
  onToggleMenu,
  onFilterClick,
  onDetectLocation,
  isLocating,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Geocoding Suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        // 1. Primary High-Capacity Geocoder: Photon (OpenStreetMap, no strict rate limit, global coverage)
        const photonRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`
        );

        if (photonRes.ok) {
          const pData = await photonRes.json();
          if (pData.features && pData.features.length > 0) {
            const mapped = pData.features.map((feat: any, idx: number) => {
              const props = feat.properties || {};
              const geom = feat.geometry || {};
              const coords = geom.coordinates || [78.96, 20.59];
              const localityName = props.name || query.trim();
              
              // Always extract the true Parent City (metropolitan or district center)
              const parentCity = props.city || props.town || props.municipality || props.state_district || props.county || props.district || localityName;
              const displayParts = [props.name, props.district || props.city, props.state, props.country].filter(Boolean);

              return {
                place_id: props.osm_id || idx,
                lat: coords[1],
                lon: coords[0],
                display_name: displayParts.join(', ') || localityName,
                name: localityName,
                parentCity: parentCity,
                locality: localityName,
                type: props.type || props.osm_value || 'place',
                address: props,
              };
            });
            setSuggestions(mapped);
            setIsOpen(true);
            return;
          }
        }

        // 2. Fallback Geocoder: Nominatim with full address decomposition
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&addressdetails=1&limit=8`,
          { headers: { 'User-Agent': 'AapdaSetu-DisasterEngine/2.0' } }
        );

        if (res.ok) {
          const data = await res.json();
          const mapped: any[] = data.map((item: any) => {
            const parts = item.display_name.split(',');
            const addr = item.address || {};
            const localityName = parts[0]?.trim() || item.name || query.trim();
            const parentCity = addr.city || addr.town || addr.municipality || addr.state_district || addr.county || addr.district || localityName;

            return {
              place_id: item.place_id,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              display_name: item.display_name,
              name: localityName,
              parentCity: parentCity,
              locality: localityName,
              type: item.type || item.class || 'place',
              address: item.address,
            };
          });
          setSuggestions(mapped);
          setIsOpen(mapped.length > 0);
        }
      } catch (err) {
        console.error("Search suggestions error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  const executeSearch = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;
    setIsLoading(true);
    setIsOpen(false);

    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      handleSelect(suggestions[selectedIndex]);
      setIsLoading(false);
      return;
    }

    try {
      // Try Photon first
      const pRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(targetQuery)}&limit=1`);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.features && pData.features.length > 0) {
          const feat = pData.features[0];
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates || [78.96, 20.59];
          const localityName = props.name || targetQuery.trim();
          const parentCity = props.city || props.town || props.municipality || props.state_district || props.county || props.district || localityName;
          const displayName = [props.name, props.city || props.district, props.state, props.country].filter(Boolean).join(', ');
          
          setQuery(parentCity);
          onSelectPlace({ 
            lat: coords[1], 
            lon: coords[0], 
            name: parentCity, 
            locality: localityName, 
            displayName, 
            parentCity 
          });
          return;
        }
      }

      // Fallback to Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(targetQuery)}&addressdetails=1&limit=1`,
        { headers: { 'User-Agent': 'AapdaSetu-DisasterEngine/2.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);
          const localityName = first.display_name.split(',')[0]?.trim() || targetQuery;
          const addr = first.address || {};
          const parentCity = addr.city || addr.town || addr.municipality || addr.state_district || addr.county || addr.district || localityName;

          setQuery(parentCity);
          onSelectPlace({ 
            lat, 
            lon, 
            name: parentCity, 
            locality: localityName, 
            displayName: first.display_name, 
            parentCity 
          });
        } else {
          alert(`Location "${targetQuery}" not found. Please check spelling.`);
        }
      }
    } catch (e) {
      console.error("Direct geocoding error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (place: any) => {
    const selectedCity = place.parentCity || place.name;
    setQuery(selectedCity);
    setIsOpen(false);
    onSelectPlace({ 
      lat: place.lat, 
      lon: place.lon, 
      name: selectedCity, 
      locality: place.name, 
      displayName: place.display_name, 
      parentCity: selectedCity 
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch(query);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-4 sm:left-5 z-30 w-[calc(100%-2rem)] sm:w-[380px] lg:w-[420px] max-w-[calc(100%-2rem)] pointer-events-auto select-text space-y-2.5">
      {/* Search Input Bar (Enterprise Geometry) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeSearch(query);
        }}
        className="relative bg-white dark:bg-black backdrop-blur-md rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 flex items-center px-3 py-2 text-neutral-900 dark:text-neutral-100 transition-all"
      >
        <button
          type="button"
          onClick={onToggleMenu}
          title="Open Operations Drawer"
          className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition flex items-center space-x-1.5 mr-0.5"
        >
          <div className="w-5 h-5 rounded-xs overflow-hidden flex-shrink-0">
            <img src="/logobgwhite.png" alt="Aapda Setu" className="w-full h-full object-contain block dark:hidden" />
            <img src="/logobgblack.png" alt="Aapda Setu" className="w-full h-full object-contain hidden dark:block" />
          </div>
          <Menu className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search town, district or sector..."
          className="flex-1 bg-transparent px-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />

        <div className="flex items-center space-x-1">
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-neutral-900 dark:text-white animate-spin mr-1" />}

          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="p-1 rounded text-neutral-400 hover:text-black dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-[1px] h-3.5 bg-neutral-200 dark:border-neutral-800 mx-0.5" />

          <button
            type="button"
            onClick={toggleTheme}
            title="Toggle Theme"
            className="p-1 rounded-md text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            type="submit"
            title="Search"
            className="p-1.5 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 rounded-md shadow-xs transition"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown (Rounded Geometry, Pure Black/White) */}
      {isOpen && suggestions.length > 0 && (
        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in text-xs">
          <div className="px-4 py-2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span>Location Results</span>
            <span>Enter to navigate</span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {suggestions.map((place, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={place.place_id}
                  type="button"
                  onClick={() => handleSelect(place)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-4 py-2.5 flex items-start space-x-2.5 transition ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white font-medium'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-neutral-900 dark:text-white truncate text-sm">
                        {place.parentCity || place.name}
                      </span>
                      {place.parentCity && place.name !== place.parentCity && (
                        <span className="text-[11px] text-neutral-500 truncate font-normal">
                          ({place.name})
                        </span>
                      )}
                      <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-full uppercase ml-auto flex-shrink-0">
                        {place.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">{place.display_name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pill Chips (Monochrome Theme with Red SOS Alert) */}
      <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
        <button
          onClick={onDetectLocation}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex-shrink-0"
        >
          <Crosshair className={`w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Scanning Sector...' : 'My Locality (20km)'}</span>
        </button>

        <button
          onClick={() => onFilterClick('india')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex-shrink-0"
        >
          <span className="text-xs">🇮🇳</span>
          <span>India Radar</span>
        </button>

        <button
          onClick={() => onFilterClick('hazards')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex-shrink-0"
        >
          <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
          <span>Hazards</span>
        </button>

        <button
          onClick={() => onFilterClick('shelters')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex-shrink-0"
        >
          <Shield className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
          <span>Relief Camps</span>
        </button>

        <button
          onClick={() => onFilterClick('cities')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition flex-shrink-0"
        >
          <Building className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
          <span>Municipalities</span>
        </button>

        <button
          onClick={() => onFilterClick('sos')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md text-xs font-bold transition flex-shrink-0"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>SOS</span>
        </button>
      </div>
    </div>
  );
};
