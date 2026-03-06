import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenueAnalytics } from '../../features/admin/analytics/analyticsSlice';
import { SimpleLineChart, SimpleBarChart } from '../../features/admin/analytics/AnalyticsChart';

const PERIODS = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '3 Months' },
    { value: '1y', label: '1 Year' },
];

const RevenueAnalyticsPage = () => {
    const dispatch = useDispatch();
    const [period, setPeriod] = useState('30d');
    const { data, status } = useSelector(s => s.analytics?.revenue || { data: null, status: 'idle' });

    useEffect(() => { dispatch(fetchRevenueAnalytics({ period })); }, [dispatch, period]);
    const d = data || {};

    const totalInPeriod = (d.revenuePerDay || []).reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0);

    return (
        <div className="p-8 w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
                    <p className="text-gray-500 mt-1">Track revenue trends across time, farmers and categories.</p>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    {PERIODS.map(p => (
                        <button key={p.value} onClick={() => setPeriod(p.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p.value ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                                }`}>{p.label}</button>
                    ))}
                </div>
            </div>

            {status === 'loading' ? (
                <div className="text-center py-20 text-gray-400">Loading revenue data…</div>
            ) : (
                <div className="space-y-6">
                    {/* Total Highlight */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
                        <p className="text-green-100 text-sm font-medium mb-1">Revenue in Selected Period</p>
                        <p className="text-4xl font-bold">₹{totalInPeriod.toLocaleString()}</p>
                    </div>

                    {/* Daily Revenue */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-5">Daily Revenue Trend</h3>
                        <SimpleLineChart
                            data={d.revenuePerDay?.map(r => ({ ...r, date: r.date?.slice(5), revenue: parseFloat(r.revenue) }))}
                            xKey="date"
                            lines={[{ key: 'revenue', name: 'Revenue (₹)', color: '#22c55e' }]}
                            prefix="₹"
                        />
                    </div>

                    {/* Monthly Revenue + Farmer breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-5">Monthly Revenue</h3>
                            <SimpleBarChart
                                data={(d.revenuePerMonth || []).slice().reverse().map(r => ({ ...r, revenue: parseFloat(r.revenue) }))}
                                xKey="month"
                                bars={[{ key: 'revenue', name: 'Revenue (₹)', color: '#6366f1' }]}
                                prefix="₹"
                            />
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-4">Top 5 Revenue Farmers</h3>
                            <div className="space-y-3">
                                {(d.revenueByFarmer || []).slice(0, 5).map((f, _i) => {
                                    const maxRev = d.revenueByFarmer?.[0]?.total_revenue || 1;
                                    const pct = ((f.total_revenue / maxRev) * 100).toFixed(0);
                                    return (
                                        <div key={f.farmer_id}>
                                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                <span className="font-medium">{f.farm_name}</span>
                                                <span className="font-semibold text-green-700">₹{f.total_revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevenueAnalyticsPage;
