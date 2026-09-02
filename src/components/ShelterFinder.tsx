"use client";

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Phone, 
  Search, 
  Loader2, 
  MapPin, 
  ShieldCheck,
  Radio,
  Users
} from 'lucide-react';
import { api } from '../lib/api';

interface ShelterFinderProps {
  currentLocation?: string;
  lat?: number;
  lon?: number;
}

export const ShelterFinder: React.FC<ShelterFinderProps> = ({
  currentLocation = "Active Sector",
  lat,
  lon,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reliefData, setReliefData] = useState<{
    camps: Array<{ name: string; type: string; address: string; phone: string; capacity: string; status: string }>;
    helplines: Array<{ service: string; number: string }>;
  } | null>(null);

  // Lazy-load real-time Tavily + Groq shelter data dynamically when this page is visited
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    api.getReliefCampsForSector(currentLocation, lat, lon)
      .then((data) => {
        if (!isCancelled) {
          setReliefData(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentLocation, lat, lon]);

  const camps = reliefData?.camps || [];
  const helplines = reliefData?.helplines || [];

  const filteredCamps = camps.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.address.toLowerCase().includes(term) ||
      c.type.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-3.5 select-text font-sans text-neutral-900 dark:text-white">
      {/* 1. Fluid Search & Header Bar (Strict Black and White) */}
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white">
              <Home className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Emergency Relief Camps ({camps.length})
              </h2>
              <p className="text-[10px] text-neutral-500 font-mono">
                Sector: {currentLocation}
              </p>
            </div>
          </div>

          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
            {isLoading ? 'Scanning...' : 'Live Ready'}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search relief camp name, address, or facility type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-black dark:focus:border-white transition shadow-xs"
          />
        </div>
      </div>

      {/* 2. Loading State */}
      {isLoading ? (
        <div className="p-8 rounded-xl bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 text-center space-y-2 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-900 dark:text-white" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-neutral-900 dark:text-white">
              Harvesting Real-Time Relief Facilities for {currentLocation}...
            </p>
            <p className="text-[10px] text-neutral-500">
              Querying municipal shelters, evacuation halls, and hospital emergency posts.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Camps List */}
          <div className="space-y-2">
            {filteredCamps.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 bg-neutral-50 dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
                No relief facilities match &quot;{searchTerm}&quot;.
              </div>
            ) : (
              filteredCamps.map((camp, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 space-y-2 shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block">
                        {camp.type}
                      </span>
                      <h3 className="text-xs font-bold text-neutral-900 dark:text-white leading-snug">
                        {camp.name}
                      </h3>
                    </div>

                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 flex-shrink-0">
                      {camp.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-500 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                    <span className="truncate">{camp.address}</span>
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100 dark:border-neutral-900 text-[11px] font-mono">
                    <span className="text-neutral-500 flex items-center space-x-1">
                      <Users className="w-3 h-3 text-neutral-400" />
                      <span>{camp.capacity}</span>
                    </span>

                    <a
                      href={`tel:${camp.phone}`}
                      className="text-neutral-900 dark:text-white font-bold hover:underline flex items-center space-x-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{camp.phone}</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 4. Emergency Crisis Helplines (Strict Monochrome) */}
          {helplines.length > 0 && (
            <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 space-y-2 shadow-xs">
              <div className="flex items-center space-x-1.5 pb-1 border-b border-neutral-100 dark:border-neutral-900">
                <Radio className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                  Regional Emergency Helplines
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {helplines.map((h, hIdx) => (
                  <a
                    key={hIdx}
                    href={`tel:${h.number}`}
                    className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between hover:border-black dark:hover:border-white transition"
                  >
                    <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300 truncate mr-1">
                      {h.service}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-neutral-900 dark:text-white flex-shrink-0">
                      {h.number}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
