"use client";

import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Send, 
  Boxes, 
  Truck, 
  ShieldCheck,
  X 
} from 'lucide-react';
import { ResourceStock } from '../types';

interface LogisticsHubProps {
  resources: ResourceStock[];
  onRequestSupplies: (itemId: string, qty: number, shelterId: string) => void;
}

export const LogisticsHub: React.FC<LogisticsHubProps> = ({
  resources,
  onRequestSupplies,
}) => {
  const [selectedItem, setSelectedItem] = useState<ResourceStock | null>(null);
  const [requestQty, setRequestQty] = useState<number>(50);
  const [shelterTarget, setShelterTarget] = useState<string>('SHL-PURI-01');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    onRequestSupplies(selectedItem.id, requestQty, shelterTarget);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedItem(null);
    }, 1800);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 rounded-lg text-blue-600 dark:text-blue-400">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              RELIEF LOGISTICS &amp; RESOURCE BRIDGE (आपदा सेतु)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              National Stockpile Tracking &amp; Rapid Camp Requisitions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl font-medium">
            <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>18 Relief Convoys Active</span>
          </span>
        </div>
      </div>

      {/* Grid of Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {resources.map((res) => {
          const allocationPct = Math.round((res.allocated_quantity / res.quantity) * 100);
          const isCritical = res.status === 'CRITICAL_DEFICIT';
          const isLow = res.status === 'LOW_STOCK';

          return (
            <div
              key={res.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition bg-white dark:bg-slate-900 shadow-xs ${
                isCritical
                  ? 'border-red-200 dark:border-red-900/60'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    {res.id} • {res.category}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.2 rounded border ${
                      isCritical
                        ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900'
                        : isLow
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {res.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                  {res.item_name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Depot: <strong className="text-slate-700 dark:text-slate-300">{res.warehouse_location}</strong>
                </p>

                {/* Stock allocation progress */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl mb-3">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Stock Inventory</span>
                    <span className="text-slate-900 dark:text-white">
                      {res.quantity.toLocaleString('en-IN')} {res.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full ${isCritical ? 'bg-blue-600' : 'bg-blue-400'}`}
                      style={{ width: `${Math.min(allocationPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Allocated: {res.allocated_quantity.toLocaleString('en-IN')}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Available: {(res.quantity - res.allocated_quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requisition Button */}
              <button
                onClick={() => setSelectedItem(res)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Requisition Supplies</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal for Requisition */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-xl relative text-slate-900 dark:text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Emergency Requisition
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedItem.item_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSuccess ? (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-4 rounded-xl text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
                <p className="font-bold text-sm text-red-800 dark:text-red-200">Requisition Dispatched</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Allocated to convoy. Delivery tracker initiated.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDispatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Destination Camp
                  </label>
                  <select
                    value={shelterTarget}
                    onChange={(e) => setShelterTarget(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="SHL-PURI-01">Puri Multipurpose Cyclone Shelter</option>
                    <option value="SHL-PURI-02">Konark High School Shelter</option>
                    <option value="SHL-GHY-01">Guwahati Sarada Stadium Hall</option>
                    <option value="SHL-WYD-01">St. Joseph Community Hall (Wayanad)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Requested Quantity ({selectedItem.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.quantity - selectedItem.allocated_quantity}
                    value={requestQty}
                    onChange={(e) => setRequestQty(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Available in warehouse: {(selectedItem.quantity - selectedItem.allocated_quantity).toLocaleString('en-IN')} {selectedItem.unit}
                  </span>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize Dispatch</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
