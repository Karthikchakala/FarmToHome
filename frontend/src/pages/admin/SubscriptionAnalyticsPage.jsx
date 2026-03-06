import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionStats } from '../../features/admin/analytics/analyticsSlice';
import { SimpleBarChart } from '../../features/admin/analytics/AnalyticsChart';
import { Repeat2 } from 'lucide-react';

const SubscriptionAnalyticsPage = () => {
    const dispatch = useDispatch();
    const { data, status } = useSelector(s => s.analytics?.subscriptions || { data: null, status: 'idle' });

    useEffect(() => { dispatch(fetchSubscriptionStats()); }, [dispatch]);

    const d = data || {};
    const t = d.totals || {};

    // Status breakdown for mini donut-style bars
    const total = parseInt(t.total) || 0;
    const pctActive = total ? ((parseInt(t.active) / total) * 100).toFixed(0) : 0;
    const pctPaused = total ? ((parseInt(t.paused) / total) * 100).toFixed(0) : 0;
    const pctCancelled = total ? ((parseInt(t.cancelled) / total) * 100).toFixed(0) : 0;

    return (
        <div className="p-8 w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Subscription Analytics</h1>
                <p className="text-gray-500 mt-1">Monitor subscription health, growth and popular products.</p>
            </div>

            {status === 'loading' ? (
                <div className="text-center py-20 text-gray-400">Loading subscription metrics…</div>
            ) : (
                <div className="space-y-6">
                    {/* KPI Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {[
                            { label: 'Total', value: t.total, color: 'text-gray-900', bg: 'bg-gray-100' },
                            { label: 'Active', value: t.active, color: 'text-green-700', bg: 'bg-green-100' },
                            { label: 'Paused', value: t.paused, color: 'text-yellow-700', bg: 'bg-yellow-100' },
                            { label: 'Cancelled', value: t.cancelled, color: 'text-red-700', bg: 'bg-red-100' },
                        ].map(item => (
                            <div key={item.label} className={`${item.bg} rounded-2xl p-6`}>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{item.label}</p>
                                <p className={`text-4xl font-bold ${item.color}`}>{parseInt(item.value || 0).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Status distribution bars */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-5">Status Distribution</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Active', pct: pctActive, bar: 'bg-green-500' },
                                { label: 'Paused', pct: pctPaused, bar: 'bg-yellow-400' },
                                { label: 'Cancelled', pct: pctCancelled, bar: 'bg-red-400' },
                            ].map(r => (
                                <div key={r.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{r.label}</span>
                                        <span className="text-gray-500">{r.pct}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className={`${r.bar} h-2.5 rounded-full transition-all`} style={{ width: `${r.pct}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Growth chart */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-5">Subscription Growth (Monthly)</h3>
                            <SimpleBarChart
                                data={(d.growth || []).slice().reverse().map(r => ({
                                    month: r.month?.toString().slice(0, 7),
                                    count: parseInt(r.new_subscriptions)
                                }))}
                                xKey="month"
                                bars={[{ key: 'count', name: 'New Subscriptions', color: '#4f46e5' }]}
                            />
                        </div>

                        {/* Popular products */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-semibold text-gray-800 mb-4">Most Subscribed Products</h3>
                            <div className="space-y-3">
                                {(d.popular || []).slice(0, 6).map((p, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{p.product_name}</p>
                                            <p className="text-xs text-gray-500">{p.farm_name} · per {p.unit}</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                            <Repeat2 size={12} /> {p.subscriber_count}
                                        </div>
                                    </div>
                                ))}
                                {!d.popular?.length && <p className="text-gray-400 text-sm text-center py-4">No active subscriptions yet</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionAnalyticsPage;
