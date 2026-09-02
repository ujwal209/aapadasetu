"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Phone 
} from 'lucide-react';

interface SafeCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SafePerson {
  name: string;
  phone: string;
  location: string;
  status: string;
  updatedAt: string;
}

export const SafeCheckInModal: React.FC<SafeCheckInModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'SEARCH'>('REGISTER');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shelterLocation, setShelterLocation] = useState('Puri Multipurpose Cyclone Shelter');
  const [isSuccess, setIsSuccess] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [mockSafeList, setMockSafeList] = useState<SafePerson[]>([
    {
      name: "Debabrata Mohanty",
      phone: "+91 94371 00987",
      location: "Puri Cyclone Shelter (Section B)",
      status: "Safe & Uninjured",
      updatedAt: "25m ago",
    },
    {
      name: "Pooja Hazarika",
      phone: "+91 98640 11223",
      location: "Guwahati Stadium Relief Camp",
      status: "Safe with Family",
      updatedAt: "40m ago",
    },
    {
      name: "Siddharth Verma",
      phone: "+91 98765 43210",
      location: "Dehradun Community Center",
      status: "Safe & Accommodated",
      updatedAt: "1h ago",
    },
  ]);

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: SafePerson = {
      name,
      phone,
      location: shelterLocation,
      status: "Safe & Verified",
      updatedAt: "Just now",
    };
    setMockSafeList([newEntry, ...mockSafeList]);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setName('');
      setPhone('');
      setActiveTab('SEARCH');
    }, 1600);
  };

  const filtered = mockSafeList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full sm:max-w-2xl lg:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-white max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider">
                &quot;I AM SAFE&quot; REGISTRY (मैं सुरक्षित हूँ)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evacuee Safety Status &amp; Family Locator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'REGISTER'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mark Myself Safe
          </button>
          <button
            onClick={() => setActiveTab('SEARCH')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'SEARCH'
                ? 'border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Search Evacuees ({mockSafeList.length})
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {activeTab === 'REGISTER' ? (
            isSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold">
                  Status Registered Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your entry is now visible to relatives searching the registry.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Announcing your safety prevents unnecessary dispatch of emergency search &amp; rescue teams.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 Mobile Number"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Current Location / Safe Camp
                  </label>
                  <input
                    type="text"
                    required
                    value={shelterLocation}
                    onChange={(e) => setShelterLocation(e.target.value)}
                    placeholder="e.g., Konark High School Shelter"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
                >
                  Publish &quot;I Am Safe&quot;
                </button>
              </form>
            )
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filtered.length > 0 ? (
                  filtered.map((person, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs">
                            {person.name}
                          </span>
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded font-medium">
                            {person.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-red-600 dark:text-red-400" />
                          <span>{person.location}</span>
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="block font-mono font-medium text-slate-700 dark:text-slate-300">{person.phone}</span>
                        <span className="text-[10px]">{person.updatedAt}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-xs text-slate-400">
                    No results for &quot;{searchQuery}&quot;.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
