"use client";

import React, { useState } from 'react';
import { 
  Radio, 
  X, 
  MapPin, 
  AlertOctagon, 
  Phone, 
  User, 
  BatteryMedium, 
  CheckCircle, 
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { DistressBeacon, DistressBeaconCreate, EmergencyCategory } from '../types';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSos: (data: DistressBeaconCreate) => Promise<DistressBeacon>;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  onSubmitSos,
}) => {
  const [formData, setFormData] = useState<DistressBeaconCreate>({
    contact_name: '',
    phone_number: '',
    category: 'TRAPPED_WATER',
    people_count: 2,
    has_elderly_or_infants: false,
    has_injured: false,
    description: '',
    latitude: 19.8142,
    longitude: 85.8325,
    address_or_landmark: 'Near VIP Road Old Bridge, Puri',
    battery_level_percent: 24,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBeacon, setSubmittedBeacon] = useState<DistressBeacon | null>(null);

  if (!isOpen) return null;

  const categories: { id: EmergencyCategory; label: string; desc: string }[] = [
    { id: 'TRAPPED_WATER', label: 'Trapped in Water / Flood', desc: 'Rising flood waters, roof evacuation needed' },
    { id: 'MEDICAL_CRITICAL', label: 'Critical Medical Emergency', desc: 'Severe trauma, bleeding, or cardiac distress' },
    { id: 'STRUCTURAL_COLLAPSE', label: 'Building / Debris Collapse', desc: 'Trapped under rubble, masonry or mudslide' },
    { id: 'FIRE_SMOKE', label: 'Fire or Hazardous Gas', desc: 'Active blaze or dense smoke conditions' },
    { id: 'FOOD_WATER_DEPLETED', label: 'No Potable Water / Rations', desc: 'Cut-off without provisions for >24 hours' },
    { id: 'MISSING_PERSON', label: 'Separated Family Member', desc: 'Lost contact during emergency evacuation' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const beacon = await onSubmitSos(formData);
      setSubmittedBeacon(beacon);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedBeacon(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 w-full sm:max-w-2xl lg:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-neutral-900 dark:text-white max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-black dark:bg-white px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between text-white dark:text-black flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center border border-white/20 dark:border-black/20">
              <Radio className="w-5 h-5 flex-shrink-0 text-red-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider">
                Emergency Distress Beacon (SOS)
              </h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-600 font-medium">
                Search &amp; Rescue Triage Network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 dark:text-black/80 hover:text-white dark:hover:text-black p-2 rounded-2xl bg-neutral-800 dark:bg-neutral-200 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {submittedBeacon ? (
            /* Broadcast Success Screen */
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-red-500 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 rounded font-bold">
                  TRANSMISSION CONFIRMED • ID: {submittedBeacon.id}
                </span>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                  Distress Beacon Broadcasted
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Your coordinates have been dispatched to the District Emergency Operations Center &amp; NDRF.
                </p>
              </div>

              {/* Triage Summary */}
              <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-xl text-left space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Triage Priority</span>
                  <span className="font-bold text-red-500 font-mono">
                    {submittedBeacon.priority_score} / 100 (HIGH URGENCY)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Persons Trapped</span>
                  <span className="font-semibold">{submittedBeacon.people_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">GPS Coordinates</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {submittedBeacon.latitude.toFixed(4)}°N, {submittedBeacon.longitude.toFixed(4)}°E
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Assigned Unit</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {submittedBeacon.assigned_team || 'NDRF Quick Reaction Boat Crew'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs transition"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            /* SOS Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-800 dark:text-red-200 leading-relaxed flex items-start space-x-2">
                <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span>
                  For genuine life-threatening emergencies. First responders will triangulate your location immediately.
                </span>
              </div>

              {/* Emergency Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Nature of Emergency
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`text-left p-2.5 rounded-xl border text-xs transition ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-white border-red-400 dark:border-red-700'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold">{cat.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {cat.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trapped count & vulnerabilities */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Persons Trapped
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.people_count}
                    onChange={(e) => setFormData({ ...formData, people_count: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 sm:mt-5">
                  <input
                    type="checkbox"
                    id="has_elderly"
                    checked={formData.has_elderly_or_infants}
                    onChange={(e) => setFormData({ ...formData, has_elderly_or_infants: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 border-slate-300 dark:border-slate-700"
                  />
                  <label htmlFor="has_elderly" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Infants/Elderly
                  </label>
                </div>

                <div className="flex items-center space-x-2 sm:mt-5">
                  <input
                    type="checkbox"
                    id="has_injured"
                    checked={formData.has_injured}
                    onChange={(e) => setFormData({ ...formData, has_injured: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 border-slate-300 dark:border-slate-700"
                  />
                  <label htmlFor="has_injured" className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    Injured Persons
                  </label>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+91 Mobile"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Landmark & Coordinates */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Landmark / Building / Floor
                </label>
                <div className="relative mb-2">
                  <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.address_or_landmark}
                    onChange={(e) => setFormData({ ...formData, address_or_landmark: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                    placeholder="Near Old Bridge, 2nd Floor Balcony"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="font-mono">
                    Fix: {formData.latitude.toFixed(4)}°N, {formData.longitude.toFixed(4)}°E
                  </span>
                  <span className="flex items-center space-x-1">
                    <BatteryMedium className="w-3.5 h-3.5 text-amber-500" />
                    <span>Battery {formData.battery_level_percent}%</span>
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Situation Details
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Water rising, roof access, need boat rescue..."
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5" />
                      <span>Broadcast Distress SOS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
