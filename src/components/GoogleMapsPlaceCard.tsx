"use client";

import React from 'react';
import { 
  X, 
  MapPin, 
  Wind, 
  Droplets, 
  Thermometer, 
  Navigation, 
  ShieldAlert, 
  Radio, 
  Share2,
  Building2,
  Home
} from 'lucide-react';
import { EmbeddedCity } from '../data/real-cities';
import { LiveEarthquake, ReliefShelter } from '../types';

export type InspectItem = 
  | { type: 'CITY'; data: EmbeddedCity; weather?: any; nearestQuakeDist?: number }
  | { type: 'QUAKE'; data: LiveEarthquake }
  | { type: 'SHELTER'; data: ReliefShelter }
  | { type: 'PLACE'; name: string; lat: number; lon: number; displayName: string };

interface GoogleMapsPlaceCardProps {
  item: InspectItem | null;
  onClose: () => void;
  onFlyTo: (lat: number, lon: number, zoom?: number) => void;
  onTriggerSos?: () => void;
}

export const GoogleMapsPlaceCard: React.FC<GoogleMapsPlaceCardProps> = ({
  item,
  onClose,
  onFlyTo,
  onTriggerSos,
}) => {
  if (!item) return null;

  return (
    <div className="fixed top-24 left-4 sm:left-6 z-40 w-[92vw] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-left-2 duration-200 text-slate-900 dark:text-white pointer-events-auto select-none">
      {/* Top Banner / Color Stripe */}
      <div className={`h-24 relative flex items-end p-4 ${
        item.type === 'QUAKE' 
          ? 'bg-gradient-to-r from-red-600 to-amber-600' 
          : item.type === 'SHELTER'
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
          : 'bg-gradient-to-r from-blue-600 to-cyan-600'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md border border-white/20">
            {item.type === 'CITY' && 'Major City Center'}
            {item.type === 'QUAKE' && 'Live USGS Seismic Event'}
            {item.type === 'SHELTER' && 'Designated Relief Camp'}
            {item.type === 'PLACE' && 'Searched Location'}
          </span>
          <h3 className="text-lg font-extrabold leading-tight mt-1 truncate max-w-[280px]">
            {item.type === 'CITY' && item.data.name}
            {item.type === 'QUAKE' && `M${item.data.magnitude.toFixed(1)} ${item.data.place}`}
            {item.type === 'SHELTER' && item.data.name}
            {item.type === 'PLACE' && item.name}
          </h3>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
        {/* City Information */}
        {item.type === 'CITY' && (
          <>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span>{item.data.state ? `${item.data.state}, ` : ''}{item.data.country}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Population</span>
                <strong className="font-bold text-slate-900 dark:text-white">
                  ~{item.data.population.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Risk Tier</span>
                <strong className="font-bold text-blue-600 dark:text-blue-400">
                  {item.data.tier.replace('_', ' ')}
                </strong>
              </div>
            </div>

            {/* Live Atmospheric Telemetry */}
            {item.weather && (
              <div className="bg-neutral-50 dark:bg-black p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center space-x-1">
                  <Wind className="w-3 h-3" />
                  <span>Live Ground Telemetry</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Temp</span>
                    <strong className="text-slate-900 dark:text-white">{item.weather.temperature_c}°C</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Wind</span>
                    <strong className="text-slate-900 dark:text-white">{item.weather.wind_speed_kmh} km/h</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Precip</span>
                    <strong className="text-slate-900 dark:text-white">{item.weather.precipitation_mm} mm</strong>
                  </div>
                </div>
              </div>
            )}

            {item.nearestQuakeDist !== undefined && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Nearest Seismic Activity:</span>
                <strong className="text-slate-800 dark:text-slate-200">{item.nearestQuakeDist} km away</strong>
              </div>
            )}
          </>
        )}

        {/* Live Earthquake Information */}
        {item.type === 'QUAKE' && (
          <>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Magnitude</span>
                <strong className="text-base font-extrabold text-red-600 dark:text-red-400">
                  M {item.data.magnitude.toFixed(1)}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Focal Depth</span>
                <strong className="text-slate-900 dark:text-white">{item.data.depth_km.toFixed(1)} km</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Hazard Radius</span>
                <strong className="text-slate-900 dark:text-white">{item.data.buffer_radius_km} km</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Risk Score</span>
                <strong className="text-red-600 dark:text-red-400">{item.data.risk_score} / 100</strong>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
              <span className="font-mono">{item.data.latitude.toFixed(4)}°N, {item.data.longitude.toFixed(4)}°E</span>
              <span className="text-red-600 font-bold">USGS VERIFIED</span>
            </div>
          </>
        )}

        {/* Relief Shelter Information */}
        {item.type === 'SHELTER' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.data.address}</p>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span>Occupancy</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {item.data.current_occupancy} / {item.data.total_capacity} ({Math.round((item.data.current_occupancy / item.data.total_capacity) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Commander:</span>
                <span>{item.data.contact_person}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Hotline:</span>
                <a href={`tel:${item.data.contact_phone}`} className="text-blue-600 font-bold hover:underline">
                  {item.data.contact_phone}
                </a>
              </div>
            </div>
          </>
        )}

        {/* Generic Place */}
        {item.type === 'PLACE' && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {item.displayName}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              if (item.type === 'CITY') onFlyTo(item.data.latitude, item.data.longitude, 13);
              else if (item.type === 'QUAKE') onFlyTo(item.data.latitude, item.data.longitude, 10);
              else if (item.type === 'SHELTER') onFlyTo(item.data.latitude, item.data.longitude, 14);
              else if (item.type === 'PLACE') onFlyTo(item.lat, item.lon, 13);
            }}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Center 3D View</span>
          </button>

          {onTriggerSos && (
            <button
              onClick={onTriggerSos}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center space-x-1"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
