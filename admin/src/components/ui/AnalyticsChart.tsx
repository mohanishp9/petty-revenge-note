"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartDataPoint } from "@/features/dashboard/dashboardSlice";

interface AnalyticsChartProps {
  data: ChartDataPoint[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-[var(--color-term-border)] bg-[var(--color-term-surface)]">
        <span className="text-xs font-mono text-[var(--color-term-text-secondary)] uppercase tracking-widest">
          WAITING FOR TELEMETRY...
        </span>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="border border-[var(--color-term-border)] bg-[#050505] p-3 shadow-2xl">
          <p className="mb-2 text-[10px] font-mono font-bold tracking-widest text-white uppercase border-b border-[var(--color-term-border)] pb-2">
            SYS.DATE: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative border border-[var(--color-term-border)] bg-[var(--color-term-surface)] p-6 group">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono tracking-widest text-[var(--color-term-text-secondary)] uppercase">
            15-Day Telemetry
          </h2>
          <p className="text-[10px] font-mono text-[var(--color-term-text-secondary)] mt-1">
            NETWORK VELOCITY (USERS, NOTES, COMMENTS)
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-[#06b6d4]" />
            <span className="text-[10px] font-mono text-white uppercase tracking-widest">Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-[#e81cff]" />
            <span className="text-[10px] font-mono text-white uppercase tracking-widest">Notes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-[#39ff14]" />
            <span className="text-[10px] font-mono text-white uppercase tracking-widest">Comments</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNotes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e81cff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e81cff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#39ff14" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
            <XAxis 
                dataKey="date" 
                stroke="#404040" 
                tick={{ fill: '#737373', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
                tickMargin={10}
            />
            <YAxis 
                stroke="#404040" 
                tick={{ fill: '#737373', fontSize: 10, fontFamily: 'monospace' }}
                tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="users"
              name="SIGNUPS"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUsers)"
            />
            <Area
              type="monotone"
              dataKey="notes"
              name="NOTES"
              stroke="#e81cff"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNotes)"
            />
            <Area
              type="monotone"
              dataKey="comments"
              name="COMMENTS"
              stroke="#39ff14"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorComments)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--color-term-accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--color-term-accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--color-term-accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--color-term-accent-cyan)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
