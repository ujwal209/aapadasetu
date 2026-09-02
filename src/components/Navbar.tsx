"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Radio, 
  PhoneCall, 
  AlertTriangle, 
  MapPin, 
  Activity, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  BellRing, 
  LifeBuoy, 
  CheckCircle2,
  Crosshair,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SearchAutocomplete, PlaceSuggestion } from './SearchAutocomplete';

interface NavbarProps {
  onOpenSos: () => void;
  onOpenSafeCheck: () => void;
  onDetectLocation: () => void;
  onSelectSearchPlace: (place: PlaceSuggestion) => void;
  activeHudTab: string;
  setActiveHudTab: (tab: string) => void;
  pendingSosCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSos,
  onOpenSafeCheck,
  onDetectLocation,
  onSelectSearchPlace,
  activeHudTab,
  setActiveHudTab,
  pendingSosCount,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const hudTabs = [
    { id: 'overview', label: 'Dashboard HUD', icon: Activity },
    { id: 'alerts', label: 'Live Alerts', icon: AlertTriangle },
    { id: 'shelters', label: 'Relief Camps', icon: MapPin },
    { id: 'resources', label: 'Logistics Bridge', icon: LifeBuoy },
    { id: 'helpline', label: 'Helplines', icon: PhoneCall },
  ];

  return (
    <header className="fixed top-3 left-3 right-3 sm:top-4 sm:left-6 sm:right-6 z-40 pointer-events-auto">
      <div className="glass-panel rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 px-3.5 py-2.5 transition-all">
        <div className="flex items-center justify-between gap-2.5">
          {/* Brand Emblem */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer select-none flex-shrink-0"
            onClick={() => setActiveHudTab(activeHudTab === 'none' ? 'overview' : 'none')}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white shadow-sm ring-1 ring-blue-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  AAPDA SETU
                </span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/80 px-1.5 py-0.2 rounded">
                  3D EARTH
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Disaster Command &amp; Geocoding
              </p>
            </div>
          </div>

          {/* Center Search Autocomplete Bar with OpenStreetMap */}
          <div className="flex-1 max-w-md mx-2">
            <SearchAutocomplete onSelectPlace={onSelectSearchPlace} />
          </div>

          {/* Desktop HUD Panel Switchers */}
          <nav className="hidden xl:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {hudTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeHudTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveHudTab(isActive ? 'none' : item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* GPS Locality Button */}
            <button
              onClick={onDetectLocation}
              title="Detect My Locality"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">My Locality</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Citizen Safety Registry */}
            <button
              onClick={onOpenSafeCheck}
              className="hidden md:inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>I Am Safe</span>
            </button>

            {/* Emergency SOS Trigger */}
            <button
              onClick={onOpenSos}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
              <span className="hidden sm:inline">SOS</span>
              {pendingSosCount > 0 && (
                <span className="bg-white text-blue-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ml-0.5">
                  {pendingSosCount}
                </span>
              )}
            </button>

            {/* Mobile Drawer Trigger (< xl) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-in slide-in-from-top-1">
            <div className="grid grid-cols-2 gap-2">
              {hudTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeHudTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveHudTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 p-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <button
                onClick={() => {
                  onOpenSafeCheck();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-1 font-semibold text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Citizen &quot;I Am Safe&quot; Check-In</span>
              </button>
              <span className="font-mono">{time || '23:20:24 IST'}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
