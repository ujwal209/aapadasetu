"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  MapPin, 
  Loader2, 
  ShieldAlert, 
  Home, 
  Building2, 
  Radio, 
  CheckCircle2, 
  Crosshair,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PlaceSuggestion } from './SearchAutocomplete';

interface GoogleMapsSearchCardProps {
  onSelectPlace: (place: PlaceSuggestion) => void;
  onToggleMenu: () => void;
  onFilterClick: (filter: 'hazards' | 'shelters' | 'cities' | 'sos' | 'safe') => void;
  onDetectLocation: () => void;
  isLocating?: boolean;
}

export const GoogleMapsSearchCard: React.FC<GoogleMapsSearchCardProps> = ({
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&addressdetails=1&limit=6`,
          { headers: { 'User-Agent': 'AapdaSetu-GoogleMapsEngine/1.0' } }
        );

        if (res.ok) {
          const data = await res.json();
          const mapped: PlaceSuggestion[] = data.map((item: any) => {
            const parts = item.display_name.split(',');
            return {
              place_id: item.place_id,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              display_name: item.display_name,
              name: parts[0] || item.name || 'Location',
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
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  const handleSelect = (place: PlaceSuggestion) => {
    setQuery(place.name);
    setIsOpen(false);
    onSelectPlace(place);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="fixed top-4 left-4 sm:left-6 z-40 w-[92vw] sm:w-[410px] pointer-events-auto select-none space-y-2.5">
      {/* 1. Google Maps Floating Search Bar */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 flex items-center px-3 py-2 text-slate-800 dark:text-slate-100 transition-all">
        {/* Menu Hamburger */}
        <button
          onClick={onToggleMenu}
          title="Open Menu Drawer"
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search Aapda Setu / Google Earth..."
          className="flex-1 bg-transparent px-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />

        {/* Right Action Icons in Search Bar */}
        <div className="flex items-center space-x-1">
          {isLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-1" />}

          {query && !isLoading && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            title="Toggle Light/Dark Theme"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Search Magnifying Glass */}
          <button
            onClick={() => {
              if (suggestions.length > 0) handleSelect(suggestions[0]);
            }}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 text-xs">
          <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Places &amp; Localities</span>
            <span>OSM Live</span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {suggestions.map((place, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={place.place_id}
                  onClick={() => handleSelect(place)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-start space-x-2.5 transition ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {place.name}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded uppercase">
                        {place.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{place.display_name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Google Maps Horizontal Category Pill Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto py-1 no-scrollbar">
        {/* My Locality Button */}
        <button
          onClick={onDetectLocation}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex-shrink-0"
        >
          <Crosshair className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'My Location'}</span>
        </button>

        {/* Live Hazards */}
        <button
          onClick={() => onFilterClick('hazards')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex-shrink-0"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          <span>Hazards</span>
        </button>

        {/* Relief Shelters */}
        <button
          onClick={() => onFilterClick('shelters')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex-shrink-0"
        >
          <Home className="w-3.5 h-3.5 text-blue-500" />
          <span>Shelters</span>
        </button>

        {/* Cities */}
        <button
          onClick={() => onFilterClick('cities')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex-shrink-0"
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Cities</span>
        </button>

        {/* Emergency SOS */}
        <button
          onClick={() => onFilterClick('sos')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md text-xs font-bold transition flex-shrink-0"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>SOS</span>
        </button>
      </div>
    </div>
  );
};
