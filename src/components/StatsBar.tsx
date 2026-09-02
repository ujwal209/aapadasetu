import React from 'react';
import { DashboardStats } from '../types';
import { 
  AlertOctagon, 
  Radio, 
  Users, 
  Home, 
  Truck, 
  ShieldCheck 
} from 'lucide-react';

interface StatsBarProps {
  stats: DashboardStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const shelterOccupancyRate = Math.round(
    (stats.current_shelter_occupancy / stats.total_shelter_capacity) * 100
  );

  const kpis = [
    {
      label: "Critical Advisories",
      value: `${stats.critical_alerts_count}`,
      unit: "Active",
      sub: `${stats.active_alerts_count} Monitored Zones`,
      icon: AlertOctagon,
      urgent: true,
    },
    {
      label: "Citizen SOS Calls",
      value: `${stats.pending_sos_count}`,
      unit: "Pending",
      sub: "Immediate Triage Queue",
      icon: Radio,
      urgent: true,
    },
    {
      label: "Citizens Sheltered",
      value: stats.rescued_citizens_count.toLocaleString('en-IN'),
      unit: "Persons",
      sub: "Safe Evacuation Corridors",
      icon: Users,
      urgent: false,
    },
    {
      label: "Relief Camps Active",
      value: `${stats.total_shelters_active}`,
      unit: "Camps",
      sub: `${shelterOccupancyRate}% Total Capacity`,
      icon: Home,
      urgent: false,
    },
    {
      label: "Deployed Battalions",
      value: `${stats.deployed_rescue_teams}`,
      unit: "Units",
      sub: "NDRF, SDRF & Coast Guard",
      icon: ShieldCheck,
      urgent: false,
    },
    {
      label: "Logistics Dispatched",
      value: `${(stats.water_litres_dispatched / 1000).toFixed(0)}k`,
      unit: "Liters",
      sub: `${stats.food_packets_dispatched.toLocaleString('en-IN')} Rations`,
      icon: Truck,
      urgent: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className={`rounded-2xl border p-3 sm:p-4 transition-all duration-150 flex flex-col justify-between ${
              kpi.urgent
                ? 'bg-white dark:bg-black border-neutral-300 dark:border-neutral-700 shadow-xs'
                : 'bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate pr-1">
                {kpi.label}
              </span>
              <div
                className={`p-1.5 rounded-lg ${
                  kpi.urgent
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline space-x-1">
                <span className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  kpi.urgent ? 'text-red-500 font-mono' : 'text-neutral-900 dark:text-white font-mono'
                }`}>
                  {kpi.value}
                </span>
                <span className="text-xs text-neutral-500 font-medium">{kpi.unit}</span>
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5 font-mono">
                {kpi.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
