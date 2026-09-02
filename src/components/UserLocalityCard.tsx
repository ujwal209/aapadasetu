"use client";

import React, { useState } from 'react';
import { 
  Crosshair, 
  MapPin, 
  ShieldAlert, 
  Search, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Compass
} from 'lucide-react';
import { api } from '../lib/api';
import { LiveEarthquake } from '../types';

interface UserLocalityCardProps {
  onFlyToLocation: (lat: number, lon: number, zoom?: number) => void;
  liveEarthquakes: LiveEarthquake[];
}

export const UserLocalityCard: React.FC<UserLocalityCardProps> = ({
  onFlyToLocation,
  liveEarthquakes,
}) => {
  const [status, setStatus] = useState<'IDLE' | 'LOCATING' | 'GRANTED' | 'DENIED'>('IDLE');
  const [userLocality, setUserLocality] = useState<{
    locality: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setStatus('LOCATING');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          const geo = await api.reverseGeocode(lat, lon);
          setUserLocality({
            locality: geo.locality || 'Current Locality',
            city: geo.city || '',
            state: geo.state || '',
            country: geo.country || '',
            latitude: lat,
            longitude: lon,
          });
          setStatus('GRANTED');
          onFlyToLocation(lat, lon, 13);
        } catch (err) {
          console.error("Reverse geocoding failed", err);
          setUserLocality({
            locality: 'Your Coordinates',
            city: '',
            state: '',
            country: '',
            latitude: lat,
            longitude: lon,
          });
          setStatus('GRANTED');
          onFlyToLocation(lat, lon, 13);
        }
      },
      (err) => {
        console.warn("Geolocation permission error:", err);
        setStatus('DENIED');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);
          const parts = first.display_name.split(',');
          setUserLocality({
            locality: parts[0] || searchQuery,
            city: parts[1] || '',
            state: parts[2] || '',
            country: parts[parts.length - 1] || '',
            latitude: lat,
            longitude: lon,
          });
          setStatus('GRANTED');
          onFlyToLocation(lat, lon, 12);
        }
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Compute distance to nearest live USGS earthquake
  let nearestQuake: LiveEarthquake | null = null;
  let minDistanceKm = Infinity;

  if (userLocality && liveEarthquakes.length > 0) {
    for (const q of liveEarthquakes) {
      const dLat = ((q.latitude - userLocality.latitude) * Math.PI) / 180;
      const dLon = ((q.longitude - userLocality.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocality.latitude * Math.PI) / 180) *
          Math.cos((q.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = 6371 * c;
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        nearestQuake = q;
      }
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition space-y-3.5">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-red-50 dark:bg-red-950/60 rounded-xl text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              YOUR LOCALITY &amp; 3D EARTH FLY-TO
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grant location permission to pinpoint your exact coordinates &amp; analyze nearby threat buffers
            </p>
          </div>
        </div>

        {/* Location detect button */}
        <button
          onClick={requestUserLocation}
          disabled={status === 'LOCATING'}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-60 flex-shrink-0"
        >
          {status === 'LOCATING' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Detecting GPS...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-4 h-4" />
              <span>Detect My Locality</span>
            </>
          )}
        </button>
      </div>

      {/* Manual Search Fallback */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Or search any city or place globally (e.g., Puri, Mumbai, Tokyo, San Francisco)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white pl-8 pr-20 py-2 rounded-xl focus:outline-none focus:border-red-600 transition"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-lg transition"
        >
          {isSearching ? 'Flying...' : 'Fly To'}
        </button>
      </form>

      {/* Geolocation Status Card */}
      {status === 'GRANTED' && userLocality && (
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                Locality Pinpointed: {userLocality.locality}
              </span>
              {userLocality.city && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  ({userLocality.city}, {userLocality.state})
                </span>
              )}
            </div>

            <button
              onClick={() => onFlyToLocation(userLocality.latitude, userLocality.longitude, 14)}
              className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:underline text-[11px] font-semibold"
            >
              <Navigation className="w-3 h-3" />
              <span>Refocus 3D Globe</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800 pt-1.5">
            <span className="font-mono">
              Coordinates: {userLocality.latitude.toFixed(4)}°N, {userLocality.longitude.toFixed(4)}°E
            </span>

            {nearestQuake && (
              <span className="text-slate-700 dark:text-slate-300">
                Nearest Live USGS Quake: <strong>M{nearestQuake.magnitude.toFixed(1)}</strong> ({nearestQuake.place}) —{' '}
                <strong className={minDistanceKm < 200 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}>
                  {minDistanceKm.toFixed(0)} km away
                </strong>
              </span>
            )}
          </div>
        </div>
      )}

      {status === 'DENIED' && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            Location permission was denied or timed out. You can use the search bar above to type your city/locality and fly the 3D globe there directly.
          </span>
        </div>
      )}
    </div>
  );
};
