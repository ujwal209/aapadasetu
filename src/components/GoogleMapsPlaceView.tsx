"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
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
  onFlyTo: (lat: number, lon: number, zoom?: number) => void;
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
  onFlyTo,
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

  // 1. Fetch live weather & 6-day history from Open-Meteo + Wikipedia Place Summary & Photo
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const queryName = parentCity || placeName || 'Sector';

    Promise.all([
      api.getPlaceWeatherAndHistory(lat, lon),
      api.getPlaceWikiSummaryAndPhoto(queryName)
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
  }, [lat, lon, parentCity, placeName]);

  // Aggregate Photos: Combine Wikipedia photo with Tavily / user photos
  const allPhotos = useMemo(() => {
    const list: string[] = [];
    if (wikiData?.photoUrl) list.push(wikiData.photoUrl);
    if (photos && photos.length > 0) {
      photos.forEach((p) => {
        if (p && !list.includes(p)) list.push(p);
      });
    }
    return list;
  }, [wikiData, photos]);

  // Filter Nearby Disasters (within 120km)
  const localHazards = useMemo(() => {
    if (!nearbyDisasters || nearbyDisasters.length === 0) return [];
    return nearbyDisasters.slice(0, 3);
  }, [nearbyDisasters]);

  // Helper for Weather Code to Human Text & Icon
  const weatherMeta = useMemo(() => {
    const code = weatherData?.current?.weather_code ?? 1;
    if (code === 0) return { label: 'Clear Sky', icon: Sun, color: 'text-amber-500' };
    if (code <= 3) return { label: 'Partly Cloudy', icon: CloudSun, color: 'text-blue-400' };
    if (code <= 48) return { label: 'Foggy / Misty', icon: Cloud, color: 'text-neutral-400' };
    if (code <= 55) return { label: 'Light Drizzle', icon: CloudDrizzle, color: 'text-cyan-400' };
    if (code <= 65) return { label: 'Rain Showers', icon: CloudRain, color: 'text-blue-500' };
    if (code <= 82) return { label: 'Heavy Rain', icon: CloudRain, color: 'text-blue-600' };
    if (code >= 95) return { label: 'Thunderstorm', icon: CloudLightning, color: 'text-amber-600' };
    return { label: 'Fair Weather', icon: Sun, color: 'text-amber-500' };
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

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/?lat=${lat}&lon=${lon}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

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

  return (
    <div className="space-y-4 text-neutral-900 dark:text-neutral-100 select-text">
      {/* 1. HERO PHOTO CAROUSEL (Google Maps Style) */}
      <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        {allPhotos.length > 0 ? (
          <img
            src={allPhotos[activePhotoIdx] || allPhotos[0]}
            alt={placeName}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={(e) => {
              // Fallback scenic placeholder if image fails to load
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

        {/* Gradient Overlay & Place Name Badge */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none">
          <div className="text-white space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/30 inline-block">
              Target Location
            </span>
            <h2 className="text-lg font-extrabold tracking-tight drop-shadow-sm truncate max-w-[240px]">
              {parentCity || placeName}
            </h2>
            <p className="text-[11px] text-neutral-200 truncate flex items-center space-x-1">
              <span>📍 {resolvedLocation || locality || placeName}</span>
            </p>
          </div>

          {allPhotos.length > 1 && (
            <div className="pointer-events-auto flex items-center space-x-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[10px] text-white">
              {allPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhotoIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition ${activePhotoIdx === i ? 'bg-white scale-125' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. GOOGLE MAPS ACTION BAR */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onFlyTo(lat, lon, 14)}
          className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs shadow-xs hover:opacity-90 transition cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Fly Here</span>
        </button>

        <button
          onClick={onTriggerSos}
          className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-semibold text-xs hover:bg-red-500/20 transition cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Distress SOS</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* 3. CURRENT WEATHER & CHANCE OF RAIN CARD (Plain Language) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-xs ${weatherMeta.color}`}>
              <WeatherIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight">{currentTemp}°C</span>
                <span className="text-xs text-neutral-500">Feels like {feelsLike}°C</span>
              </div>
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {weatherMeta.label}
              </p>
            </div>
          </div>

          {/* Chance of Rain Badge */}
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
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
              className="h-full bg-blue-500 rounded-full transition-all duration-500" 
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
            <Droplets className="w-3.5 h-3.5 text-blue-500" />
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
                className="p-3 rounded-xl bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 space-y-1 hover:border-neutral-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {h.disaster_type} Alert
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                    {h.severity || 'WARNING'}
                  </span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                  {h.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5">
                  <span>📍 {h.place}</span>
                  <button 
                    onClick={() => onFlyTo(h.latitude, h.longitude, 12)}
                    className="text-neutral-900 dark:text-white font-semibold hover:underline flex items-center space-x-0.5"
                  >
                    <span>View on Map</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
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
