import React from 'react';
import {
    ResponsiveContainer,
    LineChart, Line,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// ─── Shared Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-sm">
            <p className="text-gray-500 mb-1 font-medium">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-semibold">
                    {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
                </p>
            ))}
        </div>
    );
};

// ─── Line Chart ───────────────────────────────────────────────────────────────

export const SimpleLineChart = ({ data = [], xKey, lines = [], height = 280, prefix = '', suffix = '' }) => (
    <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip prefix={prefix} suffix={suffix} />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            {lines.map((l, i) => (
                <Line key={i} type="monotone" dataKey={l.key} name={l.name || l.key}
                    stroke={l.color || '#22c55e'} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
            ))}
        </LineChart>
    </ResponsiveContainer>
);

// ─── Bar Chart ────────────────────────────────────────────────────────────────

export const SimpleBarChart = ({ data = [], xKey, bars = [], height = 280, prefix = '', suffix = '' }) => (
    <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip prefix={prefix} suffix={suffix} />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            {bars.map((b, i) => (
                <Bar key={i} dataKey={b.key} name={b.name || b.key} fill={b.color || '#22c55e'} radius={[4, 4, 0, 0]} />
            ))}
        </BarChart>
    </ResponsiveContainer>
);
