"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Wind, 
  Navigation, 
  Shield, 
  ExternalLink,
  Loader2,
  Newspaper,
  ChevronDown,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { EmbeddedCity } from '../data/real-cities';
import { LiveEarthquake, ReliefShelter, LiveDisaster } from '../types';
import { api } from '../lib/api';

export type InspectItem = 
  | { type: 'CITY'; data: EmbeddedCity; weather?: any; nearestQuakeDist?: number }
  | { type: 'QUAKE'; data: LiveEarthquake }
  | { type: 'DISASTER'; data: LiveDisaster }
  | { type: 'SHELTER'; data: ReliefShelter }
  | { type: 'PLACE'; name: string; lat: number; lon: number; displayName: string; parentCity?: string };

interface PlaceDetailCardProps {
  item: InspectItem | null;
  onClose: () => void;
  onFlyTo: (lat: number, lon: number, zoom?: number) => void;
  onTriggerSos?: () => void;
}

export const PlaceDetailCard: React.FC<PlaceDetailCardProps> = ({
  item,
  onClose,
  onFlyTo,
  onTriggerSos,
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [articles, setArticles] = useState<Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
    source_name?: string;
    favicon: string;
    published_time?: string;
  }>>([]);
  const [aiOverview, setAiOverview] = useState<string | null>(null);
  const [isLoadingAiOverview, setIsLoadingAiOverview] = useState<boolean>(false);
  const [liveSensors, setLiveSensors] = useState<{
    temperature_c?: number;
    wind_speed_kmh?: number;
    precipitation_mm?: number;
    nearest_quake_dist?: number;
    nearest_quake_mag?: number;
  } | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(3); // Lazy loading

  useEffect(() => {
    if (!item) {
      setImages([]);
      setArticles([]);
      setAiOverview(null);
      setLiveSensors(null);
      return;
    }

    const placeName = 
      item.type === 'CITY' ? item.data.name :
      item.type === 'SHELTER' ? item.data.district || item.data.name :
      item.type === 'DISASTER' ? item.data.place :
      item.type === 'PLACE' ? item.name : null;

    const lat =
      item.type === 'CITY' ? item.data.latitude :
      item.type === 'SHELTER' ? item.data.latitude :
      item.type === 'DISASTER' ? item.data.latitude :
      item.type === 'QUAKE' ? item.data.latitude :
      item.type === 'PLACE' ? item.lat : undefined;

    const lon =
      item.type === 'CITY' ? item.data.longitude :
      item.type === 'SHELTER' ? item.data.longitude :
      item.type === 'DISASTER' ? item.data.longitude :
      item.type === 'QUAKE' ? item.data.longitude :
      item.type === 'PLACE' ? item.lon : undefined;

    if (placeName) {
      // 1. Fetch Images
      api.getPlaceImages(placeName)
        .then((imgs) => setImages(imgs))
        .catch(() => setImages([]));

      // 2. Fetch Live Disaster Sensors for checked coordinates
      if (lat !== undefined && lon !== undefined) {
        api.getLiveCityWeather(lat, lon)
          .then((w) => {
            setLiveSensors({
              temperature_c: w.temperature_c,
              wind_speed_kmh: w.wind_speed_kmh,
              precipitation_mm: w.precipitation_mm,
            });
          })
          .catch(() => {});
      }

      // 3. AI Overview in Lazy Loading Mode (Synthesizing real-world feeds + sources)
      setIsLoadingAiOverview(true);
      api.getIntelSearch(placeName, placeName, lat, lon)
        .then((res) => {
          setAiOverview(res.ai_analysis || null);
          setArticles(res.articles || []);
          setVisibleCount(3);
        })
        .catch(() => {
          setAiOverview(null);
          setArticles([]);
        })
        .finally(() => setIsLoadingAiOverview(false));
    } else {
      setImages([]);
      setArticles([]);
      setAiOverview(null);
      setLiveSensors(null);
    }
  }, [item]);

  if (!item) return null;

  const targetName = 
    item.type === 'CITY' ? item.data.name :
    item.type === 'QUAKE' ? `M${item.data.magnitude.toFixed(1)} ${item.data.place}` :
    item.type === 'DISASTER' ? item.data.title :
    item.type === 'SHELTER' ? item.data.name :
    item.name;

  return (
    <div className="fixed inset-x-2 bottom-3 sm:bottom-auto sm:top-20 sm:left-6 z-40 w-[calc(100vw-1rem)] sm:w-[520px] lg:w-[560px] max-h-[85vh] sm:max-h-[82vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden select-none pointer-events-auto text-slate-900 dark:text-white animate-in slide-in-from-bottom-3 sm:slide-in-from-top-3 duration-200 flex flex-col">
      {/* 1. Real Place Image Header */}
      {images.length > 0 ? (
        <div className="h-44 sm:h-48 relative bg-slate-900 overflow-hidden flex-shrink-0">
          <img
            src={images[0]}
            alt={targetName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 font-semibold">
              {item.type === 'CITY' && 'Municipal Center'}
              {item.type === 'QUAKE' && 'Seismic Hazard'}
              {item.type === 'DISASTER' && `${item.data.disaster_type} Hazard Zone`}
              {item.type === 'SHELTER' && 'Designated Relief Camp'}
              {item.type === 'PLACE' && 'Geocoded Sector'}
            </span>
            <h3 className="text-lg sm:text-xl font-bold leading-tight truncate">
              {targetName}
            </h3>
          </div>
        </div>
      ) : (
        <div className="h-20 bg-blue-900 text-white relative flex items-center justify-between px-5 flex-shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-200 font-semibold">
              {item.type === 'CITY' && 'Municipal Center'}
              {item.type === 'QUAKE' && 'Seismic Hazard'}
              {item.type === 'DISASTER' && `${item.data.disaster_type} Hazard`}
              {item.type === 'SHELTER' && 'Relief Shelter'}
              {item.type === 'PLACE' && 'Geocoded Point'}
            </span>
            <h3 className="text-base sm:text-lg font-bold leading-tight truncate max-w-[320px]">
              {targetName}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. Scrollable Body Details */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
        {/* Real-World Sensor Telemetry Bar (For searched place) */}
        {liveSensors && (
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Live Ground Sensor Verification</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 font-semibold">Sensor Array Active</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Temperature</span>
                <strong className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">{liveSensors.temperature_c ?? '--'}°C</strong>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Wind Velocity</span>
                <strong className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">{liveSensors.wind_speed_kmh ?? '--'} km/h</strong>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">Precipitation</span>
                <strong className={`font-bold text-xs sm:text-sm ${liveSensors.precipitation_mm && liveSensors.precipitation_mm > 5 ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                  {liveSensors.precipitation_mm ?? '0.0'} mm
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* 3. High-Context AI Overview (Lazy Loading Mode) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>AI Overview: Evidence-Based Risk Assessment</span>
            </span>
            <span className="text-[9px] font-mono text-blue-600 font-semibold bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
              Ground Intelligence
            </span>
          </div>

          {isLoadingAiOverview ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Synthesizing real-time ground feeds &amp; deep web dispatches...
                </span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-4/5" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-full" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-3/4" />
            </div>
          ) : aiOverview ? (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/80 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap shadow-xs">
              {aiOverview}
            </div>
          ) : null}
        </div>

        {item.type === 'CITY' && (
          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">Population</span>
              <strong className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                {item.data.population.toLocaleString('en-IN')}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Sector Classification</span>
              <strong className="font-semibold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                {item.data.tier.replace('_', ' ')}
              </strong>
            </div>
          </div>
        )}

        {item.type === 'DISASTER' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block">Hazard Classification</span>
                <strong className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                  {item.data.disaster_type}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Severity Tier</span>
                <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {item.data.severity}
                </strong>
              </div>
              {item.data.magnitude && (
                <div>
                  <span className="text-[10px] text-slate-500 block">Intensity Reading</span>
                  <strong className="text-xs sm:text-sm font-bold text-blue-600">
                    M {item.data.magnitude.toFixed(1)}
                  </strong>
                </div>
              )}
              <div>
                <span className="text-[10px] text-slate-500 block">Hazard Radius</span>
                <strong className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {item.data.buffer_radius_km} km
                </strong>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Source: {item.data.source}</span>
              {item.data.url && (
                <a href={item.data.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center space-x-1">
                  <span>Advisory</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {item.type === 'PLACE' && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Geocoded Location</span>
            <p className="text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed text-xs">
              {item.displayName}
            </p>
          </div>
        )}

        {/* 4. Real-Time Web Search: Prominent, Big Cards with Real Images */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Newspaper className="w-4 h-4 text-blue-600" />
              <span>Verified Dispatches &amp; Sources ({articles.length})</span>
            </span>
            <span className="text-[9px] font-mono text-blue-600 font-semibold bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
              Live Feed
            </span>
          </div>

          {articles.length === 0 && !isLoadingAiOverview ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              No recent field reports found for this sector.
            </div>
          ) : (
            <div className="space-y-3">
              {articles.slice(0, visibleCount).map((art, aIdx) => (
                <a
                  key={aIdx}
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition group space-y-2 shadow-xs"
                >
                  {/* Real Article Image if available */}
                  {art.image && (
                    <div className="h-36 w-full overflow-hidden rounded-xl bg-slate-900 relative">
                      <img
                        src={art.image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={art.favicon}
                        alt=""
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        {art.source_name || art.domain}
                      </span>
                    </div>
                    {art.published_time && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {art.published_time}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug">
                    {art.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {art.deep_text || art.snippet}
                  </p>

                  <div className="flex items-center justify-end text-xs text-blue-600 dark:text-blue-400 font-bold pt-1">
                    <span className="flex items-center space-x-1">
                      <span>Read Verified Dispatch</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}

              {/* Lazy Loading Trigger */}
              {articles.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + 3)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition border border-slate-200 dark:border-slate-700"
                >
                  <span>Load More Reports ({articles.length - visibleCount} remaining)</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Fixed Action Buttons at Bottom */}
      <div className="flex items-center space-x-2 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <button
          onClick={() => {
            if (item.type === 'CITY') onFlyTo(item.data.latitude, item.data.longitude, 13);
            else if (item.type === 'QUAKE') onFlyTo(item.data.latitude, item.data.longitude, 10);
            else if (item.type === 'DISASTER') onFlyTo(item.data.latitude, item.data.longitude, 10);
            else if (item.type === 'SHELTER') onFlyTo(item.data.latitude, item.data.longitude, 14);
            else if (item.type === 'PLACE') onFlyTo(item.lat, item.lon, 13);
          }}
          className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 shadow-md"
        >
          <Navigation className="w-4 h-4" />
          <span>Center Perspective</span>
        </button>

        {onTriggerSos && (
          <button
            onClick={onTriggerSos}
            className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition flex items-center space-x-1.5"
          >
            <Shield className="w-4 h-4" />
            <span>SOS</span>
          </button>
        )}
      </div>
    </div>
  );
};
