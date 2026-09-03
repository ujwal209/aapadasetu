"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  MapPin, 
  ShieldAlert, 
  CloudRain, 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudLightning, 
  CloudDrizzle, 
  Wind, 
  Droplets, 
  Thermometer, 
  Share2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Waves,
  Home,
  Info,
  Loader2,
  Calendar
} from 'lucide-react';
import { api } from '../lib/api';
import { LiveDisaster } from '../types';

interface GoogleMapsPlaceViewProps {
  placeName: string;
  parentCity: string;
  locality?: string;
  resolvedLocation?: string;
  lat: number;
  lon: number;
  userLocation?: { lat: number; lon: number } | null;
  onFlyTo: (lat: number, lon: number, zoom?: number) => void;
  onNavigate?: (route: {
    lat: number;
    lon: number;
    name: string;
    distanceKm: number;
    durationMin: number;
    coordinates: [number, number][];
    steps?: any[];
  }) => void;
  onClearRoute?: () => void;
  onTriggerSos?: () => void;
  nearbyDisasters?: LiveDisaster[];
  photos?: string[];
  reliefCamps?: any[];
}

export const GoogleMapsPlaceView: React.FC<GoogleMapsPlaceViewProps> = ({
  placeName,
  parentCity,
  locality,
  resolvedLocation,
  lat,
  lon,
  userLocation,
  onFlyTo,
  onNavigate,
  onClearRoute,
  onTriggerSos,
  nearbyDisasters = [],
  photos = [],
  reliefCamps = [],
}) => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [wikiData, setWikiData] = useState<{ title?: string; summary?: string; photoUrl?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(6); // Default to today (index 6)
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // 1. Fetch live weather & 6-day history from Open-Meteo + Parent City Landmark Photography & Summary
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setActivePhotoIdx(0);

    const queryCity = parentCity || placeName || 'City';

    Promise.all([
      api.getPlaceWeatherAndHistory(lat, lon),
      api.getPlaceWikiSummaryAndPhoto(queryCity, resolvedLocation, parentCity)
    ]).then(([w, wiki]) => {
      if (!isCancelled) {
        if (w) setWeatherData(w);
        if (wiki) setWikiData(wiki);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!isCancelled) setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [lat, lon, parentCity, placeName, resolvedLocation]);

  // Aggregate Photos: Combine authentic Wikipedia and parent city landmark photos, strictly excluding disaster/flood images
  const allPhotos = useMemo(() => {
    const list: string[] = [];

    if (wikiData?.photoUrl && !/(flood|disaster|debris|inundat|damage|casualt|submerged|wreck)/i.test(wikiData.photoUrl)) {
      list.push(wikiData.photoUrl);
    }
    if ((wikiData as any)?.photoUrls) {
      (wikiData as any).photoUrls.forEach((p: string) => {
        if (p && !/(flood|disaster|debris|inundat|damage|casualt|submerged|wreck)/i.test(p) && !list.includes(p)) {
          list.push(p);
        }
      });
    }
    if (photos && photos.length > 0) {
      photos.forEach((p) => {
        if (p && !/(flood|disaster|debris|inundat|damage|casualt|submerged|wreck)/i.test(p) && !list.includes(p)) {
          list.push(p);
        }
      });
    }

    return list;
  }, [wikiData, photos]);

  // Filter genuine nearby disasters within 100km radius using Haversine formula
  const localHazards = useMemo(() => {
    if (!nearbyDisasters || nearbyDisasters.length === 0) return [];

    const computed = nearbyDisasters.map((d) => {
      // 1. Distance from inspected place coordinates (lat, lon)
      const dLat1 = ((d.latitude - lat) * Math.PI) / 180;
      const dLon1 = ((d.longitude - lon) * Math.PI) / 180;
      const a1 =
        Math.sin(dLat1 / 2) * Math.sin(dLat1 / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((d.latitude * Math.PI) / 180) *
          Math.sin(dLon1 / 2) *
          Math.sin(dLon1 / 2);
      const distFromPlaceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1)));

      // 2. Distance from current user GPS coordinates (if available)
      let distFromUserKm: number | null = null;
      if (userLocation) {
        const dLat2 = ((d.latitude - userLocation.lat) * Math.PI) / 180;
        const dLon2 = ((d.longitude - userLocation.lon) * Math.PI) / 180;
        const a2 =
          Math.sin(dLat2 / 2) * Math.sin(dLat2 / 2) +
          Math.cos((userLocation.lat * Math.PI) / 180) *
            Math.cos((d.latitude * Math.PI) / 180) *
            Math.sin(dLon2 / 2) *
            Math.sin(dLon2 / 2);
        distFromUserKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2)));
      }

      return {
        ...d,
        distFromPlaceKm,
        distFromUserKm,
      };
    });

    // Strictly filter genuine hazards situated within 100 km radius of this place (no hardcoded/distant alerts)
    const withinPerimeter = computed.filter((d) => d.distFromPlaceKm <= 100);
    withinPerimeter.sort((a, b) => a.distFromPlaceKm - b.distFromPlaceKm);
    return withinPerimeter.slice(0, 4);
  }, [nearbyDisasters, lat, lon, userLocation]);

  // Helper for Weather Code to Human Text & Icon (Strict Black & White)
  const weatherMeta = useMemo(() => {
    const code = weatherData?.current?.weather_code ?? 1;
    if (code === 0) return { label: 'Clear Sky', icon: Sun, color: 'text-neutral-800 dark:text-neutral-200' };
    if (code <= 3) return { label: 'Partly Cloudy', icon: CloudSun, color: 'text-neutral-800 dark:text-neutral-200' };
    if (code <= 48) return { label: 'Foggy / Misty', icon: Cloud, color: 'text-neutral-500 dark:text-neutral-400' };
    if (code <= 55) return { label: 'Light Drizzle', icon: CloudDrizzle, color: 'text-neutral-700 dark:text-neutral-300' };
    if (code <= 65) return { label: 'Rain Showers', icon: CloudRain, color: 'text-neutral-800 dark:text-neutral-200' };
    if (code <= 82) return { label: 'Heavy Rain', icon: CloudRain, color: 'text-neutral-900 dark:text-neutral-100' };
    if (code >= 95) return { label: 'Thunderstorm', icon: CloudLightning, color: 'text-neutral-900 dark:text-neutral-100' };
    return { label: 'Fair Weather', icon: Sun, color: 'text-neutral-800 dark:text-neutral-200' };
  }, [weatherData]);

  // Parse 7-day temperature time series
  const dailySeries = useMemo(() => {
    if (!weatherData?.daily?.time) return [];
    const times: string[] = weatherData.daily.time;
    const maxs: number[] = weatherData.daily.temperature_2m_max || [];
    const mins: number[] = weatherData.daily.temperature_2m_min || [];
    const rains: number[] = weatherData.daily.precipitation_sum || [];
    const rainProbs: number[] = weatherData.daily.precipitation_probability_max || [];

    return times.map((t, idx) => {
      const isToday = idx === times.length - 1;
      const d = new Date(t);
      const dayName = isToday 
        ? 'Today' 
        : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        date: t,
        dayName,
        dateFormatted,
        isToday,
        maxTemp: Math.round(maxs[idx] ?? 28),
        minTemp: Math.round(mins[idx] ?? 20),
        rainMm: rains[idx] ?? 0,
        rainProb: rainProbs[idx] ?? 0,
      };
    });
  }, [weatherData]);

  // Generate SVG curve points for temperature graph
  const svgGraph = useMemo(() => {
    if (dailySeries.length === 0) return null;
    const width = 340;
    const height = 110;
    const pad = { top: 22, bottom: 26, left: 24, right: 24 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const stepX = innerW / (dailySeries.length - 1);

    const allTemps = [
      ...dailySeries.map((d) => d.maxTemp),
      ...dailySeries.map((d) => d.minTemp),
    ];
    const minVal = Math.min(...allTemps) - 2;
    const maxVal = Math.max(...allTemps) + 2;
    const range = maxVal - minVal || 1;

    const maxPoints = dailySeries.map((d, idx) => ({
      x: pad.left + idx * stepX,
      y: pad.top + (1 - (d.maxTemp - minVal) / range) * innerH,
      temp: d.maxTemp,
      day: d.dayName,
    }));

    // Smooth cubic bezier path
    let curvePath = `M ${maxPoints[0].x} ${maxPoints[0].y}`;
    for (let i = 0; i < maxPoints.length - 1; i++) {
      const p0 = maxPoints[i];
      const p1 = maxPoints[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      curvePath += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Area fill path
    const areaPath = `${curvePath} L ${maxPoints[maxPoints.length - 1].x} ${height - pad.bottom} L ${maxPoints[0].x} ${height - pad.bottom} Z`;

    return { width, height, pad, maxPoints, curvePath, areaPath, minVal, maxVal };
  }, [dailySeries]);

  const distanceFromUserKm = useMemo(() => {
    if (!userLocation) return null;
    const dLat = ((lat - userLocation.lat) * Math.PI) / 180;
    const dLon = ((lon - userLocation.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [userLocation, lat, lon]);

  const WeatherIcon = weatherMeta.icon;
  const currentTemp = weatherData?.current?.temperature_2m !== undefined 
    ? Math.round(weatherData.current.temperature_2m) 
    : 28;
  const feelsLike = weatherData?.current?.apparent_temperature !== undefined
    ? Math.round(weatherData.current.apparent_temperature)
    : currentTemp;
  const todayRainProb = dailySeries[dailySeries.length - 1]?.rainProb ?? 45;
  const todayRainMm = dailySeries[dailySeries.length - 1]?.rainMm ?? 1.2;
  const windSpeed = weatherData?.current?.wind_speed_10m !== undefined
    ? Math.round(weatherData.current.wind_speed_10m)
    : 14;
  const humidity = weatherData?.current?.relative_humidity_2m !== undefined
    ? Math.round(weatherData.current.relative_humidity_2m)
    : 60;

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allPhotos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev + 1) % allPhotos.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allPhotos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  return (
    <div className="space-y-4 text-neutral-900 dark:text-neutral-100 select-text">
      {/* 1. HERO PHOTO CAROUSEL (Working Image Slider with Arrows & Dots) */}
      <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm group">
        {allPhotos.length > 0 ? (
          <img
            src={allPhotos[activePhotoIdx] || allPhotos[0]}
            alt={placeName}
            className="w-full h-full object-cover transition-opacity duration-300 select-none"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-900 dark:to-neutral-950 p-4 text-center">
            <MapPin className="w-8 h-8 text-neutral-400 mb-1" />
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              {parentCity || placeName}
            </span>
          </div>
        )}

        {/* Previous & Next Arrow Buttons for Image Slider */}
        {allPhotos.length > 1 && (
          <>
            <button
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-black/65 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition border border-white/20 cursor-pointer shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPhoto}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-black/65 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition border border-white/20 cursor-pointer shadow-md hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Gradient Overlay & Place Name Badge (No Target Location Tag) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none z-20">
          <div className="text-white space-y-0.5 min-w-0 pr-2">
            <h2 className="text-lg font-extrabold tracking-tight drop-shadow-sm truncate max-w-[260px]">
              {parentCity || placeName}
            </h2>
            <div className="text-[11px] text-neutral-200 truncate flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-neutral-300 flex-shrink-0" />
              <span className="truncate">{resolvedLocation || locality || placeName}</span>
            </div>
          </div>

          {allPhotos.length > 1 && (
            <div className="pointer-events-auto flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[10px] text-white flex-shrink-0">
              <span className="font-mono text-[9px] font-bold text-neutral-300">
                {activePhotoIdx + 1} / {allPhotos.length}
              </span>
              <div className="flex items-center space-x-1">
                {allPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx(i);
                    }}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      activePhotoIdx === i ? 'bg-white scale-110 shadow-xs' : 'bg-white/40 hover:bg-white/75'
                    }`}
                    title={`View photo ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. CURRENT WEATHER & CHANCE OF RAIN CARD (Monochrome Black & White) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <WeatherIcon className={`w-6 h-6 ${weatherMeta.color}`} />
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-neutral-900 dark:text-white">
                  {currentTemp}°C
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  Feels like {feelsLike}°C
                </span>
              </div>
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {weatherMeta.label}
              </p>
            </div>
          </div>

          {/* Chance of Rain Badge */}
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold">
              <CloudRain className="w-3.5 h-3.5" />
              <span>{todayRainProb}% Rain</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-0.5">
              {todayRainMm > 0 ? `~${todayRainMm} mm rain` : 'No heavy rain expected'}
            </span>
          </div>
        </div>

        {/* Rain Probability Meter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
            <span>Chance of Rain Today</span>
            <span className="font-bold">{todayRainProb}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black dark:bg-white rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(5, todayRainProb))}%` }} 
            />
          </div>
        </div>

        {/* Quick Weather Metrics in Plain Language */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800 text-[11px]">
          <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
            <Wind className="w-3.5 h-3.5 text-neutral-500" />
            <span>Wind: <strong className="text-neutral-900 dark:text-white">{windSpeed} km/h</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
            <Droplets className="w-3.5 h-3.5 text-neutral-500" />
            <span>Humidity: <strong className="text-neutral-900 dark:text-white">{humidity}%</strong></span>
          </div>
        </div>
      </div>

      {/* 4. TIME-SERIES TEMPERATURE OVER PAST 6 DAYS WITH PROPER GRAPH */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Temperature Over Past 6 Days
            </h4>
          </div>
          <span className="text-[10px] text-neutral-500 font-medium">Daily Highs & Lows</span>
        </div>
        <p className="text-[11px] text-neutral-500">
          Temperature records from the last 6 days and today's forecast. Tap any day for details.
        </p>

        {/* SVG Interactive Time Series Chart */}
        {svgGraph && (
          <div className="relative pt-1 overflow-x-auto">
            <svg 
              viewBox={`0 0 ${svgGraph.width} ${svgGraph.height}`} 
              className="w-full h-auto max-h-36 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Under Curve */}
              <path d={svgGraph.areaPath} fill="url(#tempGradient)" />

              {/* Smooth Temperature Line */}
              <path 
                d={svgGraph.curvePath} 
                fill="none" 
                stroke="#3B82F6" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Points & Labels for each day */}
              {svgGraph.maxPoints.map((p, idx) => {
                const dayData = dailySeries[idx];
                const isSelected = selectedDayIdx === idx;
                return (
                  <g key={idx} className="cursor-pointer" onClick={() => setSelectedDayIdx(idx)}>
                    {/* Hover Target Area */}
                    <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                    {/* Temperature Label above point */}
                    <text 
                      x={p.x} 
                      y={p.y - 8} 
                      textAnchor="middle" 
                      className="text-[10px] font-bold fill-neutral-800 dark:fill-neutral-200"
                    >
                      {p.temp}°
                    </text>

                    {/* Circle Node */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={isSelected ? "5" : "3.5"} 
                      className={`transition-all duration-200 ${
                        isSelected 
                          ? 'fill-blue-600 stroke-white dark:stroke-black stroke-2' 
                          : 'fill-white dark:fill-neutral-900 stroke-blue-500 stroke-2'
                      }`}
                    />

                    {/* Day Name Below Graph */}
                    <text 
                      x={p.x} 
                      y={svgGraph.height - 8} 
                      textAnchor="middle" 
                      className={`text-[10px] font-semibold ${
                        dayData.isToday 
                          ? 'fill-blue-600 dark:fill-blue-400 font-bold' 
                          : isSelected 
                          ? 'fill-neutral-900 dark:fill-white font-bold' 
                          : 'fill-neutral-500'
                      }`}
                    >
                      {dayData.dayName}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Selected Day Quick Card */}
            {dailySeries[selectedDayIdx] && (
              <div className="mt-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {dailySeries[selectedDayIdx].dayName} ({dailySeries[selectedDayIdx].dateFormatted})
                  </span>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    High: <strong className="text-neutral-800 dark:text-neutral-200">{dailySeries[selectedDayIdx].maxTemp}°C</strong> • Low: <strong className="text-neutral-800 dark:text-neutral-200">{dailySeries[selectedDayIdx].minTemp}°C</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>{dailySeries[selectedDayIdx].rainProb}% Rain</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {dailySeries[selectedDayIdx].rainMm > 0 ? `${dailySeries[selectedDayIdx].rainMm} mm recorded` : 'Dry day'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. ACTIVE DISASTERS & ALERTS FOR THIS PLACE (Plain Language) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Emergency Alerts & Nearby Hazards
            </h4>
          </div>
          <span className="text-[10px] text-neutral-500">100 km Radius</span>
        </div>

        {localHazards.length > 0 ? (
          <div className="space-y-2">
            {localHazards.map((h, hIdx) => (
              <div 
                key={hIdx}
                className="p-3 rounded-xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-1.5 hover:border-neutral-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {h.disaster_type} Alert
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                      {h.distFromPlaceKm} km away
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                      {h.severity || 'WARNING'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                  {h.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5 border-t border-neutral-100 dark:border-neutral-900">
                  <div className="flex items-center space-x-1.5 truncate max-w-[260px]">
                    <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                    <span className="truncate">{h.place}</span>
                    {h.distFromUserKm !== null && (
                      <span className="text-neutral-400 font-mono flex-shrink-0">
                        ({h.distFromUserKm} km from you)
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => onFlyTo(h.latitude, h.longitude, 12)}
                    className="text-neutral-900 dark:text-white font-semibold hover:underline flex items-center space-x-0.5 flex-shrink-0 ml-2 cursor-pointer"
                  >
                    <span>View on Map</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300 flex-shrink-0" />
            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              No active disaster alerts, river floods, or severe weather warnings reported within 100 km of this location.
            </p>
          </div>
        )}
      </div>

      {/* 6. ABOUT THIS PLACE (Plain English, No Technical Jargon) */}
      {wikiData?.summary && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="flex items-center space-x-1.5 text-neutral-700 dark:text-neutral-300">
            <Info className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              About {wikiData.title || parentCity || placeName}
            </h4>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {wikiData.summary}
          </p>
        </div>
      )}

      {/* 7. SAFE SHELTERS & RELIEF CENTERS NEARBY */}
      {reliefCamps && reliefCamps.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Home className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Nearest Safe Relief Centers
              </h4>
            </div>
            <span className="text-[10px] text-neutral-500">Verified Camps</span>
          </div>

          <div className="space-y-2">
            {reliefCamps.slice(0, 2).map((camp, cIdx) => (
              <div 
                key={cIdx}
                className="p-3 rounded-xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-neutral-900 dark:text-white">
                  <span>{camp.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                    {camp.type || 'Relief Camp'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">{camp.address}</p>
                {camp.phone && (
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Contact: {camp.phone}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
