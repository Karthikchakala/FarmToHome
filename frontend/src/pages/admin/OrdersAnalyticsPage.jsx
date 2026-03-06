import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrdersAnalytics } from '../../features/admin/analytics/analyticsSlice';
import { SimpleBarChart, SimpleLineChart } from '../../features/admin/analytics/AnalyticsChart';

const PERIODS = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '3 Months' },
    { value: '1y', label: '1 Year' },
];

const OrdersAnalyticsPage = () => {
    const dispatch = useDispatch();
    const [period, setPeriod] = useState('30d');
    const { data, status } = useSelector(s => s.analytics?.orders || { data: null, status: 'idle' });

    useEffect(() => { dispatch(fetchOrdersAnalytics({ period })); }, [dispatch, period]);

    const d = data || {};
    const cancellationRate = d.cancellationRate || 0;

    return (
        <div className="p-8 w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders Analytics</h1>
                    <p className="text-gray-500 mt-1">Order volume trends, growth and cancellation metrics.</p>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    {PERIODS.map(p => (
                        <button key={p.value} onClick={() => setPeriod(p.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p.value ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}>{p.label}</button>
                    ))}
                </div>
            </div>

            {status === 'loading' ? (
                <div className="text-center py-20 text-gray-400">Loading order data…</div>
            ) : (
                <div className="space-y-6">
                    {/* KPI Row */}
                    <div className="grid grid-cols-3 gap-5">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">Orders in Period</p>
                            <p className="text-3xl font-bold text-gray-900">{d.totalInPeriod?.toLocaleString() ?? 0}</p>
                        </div>
                        <div className={`rounded-2xl p-6 border shadow-sm ${cancellationRate > 10 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                            <p className="text-sm text-gray-500 mb-1">Cancellation Rate</p>
                            <p className={`text-3xl font-bold ${cancellationRate > 10 ? 'text-red-600' : 'text-gray-900'}`}>{cancellationRate}%</p>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">Statuses</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {d.statusBreakdown?.map(s => (
                                    <span key={s.status} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                                        {s.status}: {s.count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Orders per Day chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-5">Orders Per Day</h3>
                        <SimpleBarChart
                            data={d.ordersPerDay?.map(r => ({ ...r, date: r.date?.slice(5) }))}
                            xKey="date"
                            bars={[{ key: 'count', name: 'Orders', color: '#4f46e5' }]}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersAnalyticsPage;
