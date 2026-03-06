import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Tractor, ShoppingCart, Package, Repeat2, TrendingUp } from 'lucide-react';
import { fetchOverview } from '../../features/admin/analytics/analyticsSlice';
import AnalyticsCard from '../../features/admin/components/AnalyticsCard';

const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">{title}</span>
            <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{value?.toLocaleString() ?? '—'}</p>
    </div>
);

const PlatformAnalyticsPage = () => {
    const dispatch = useDispatch();
    const { data, status } = useSelector(s => s.platformAnalytics?.overview || s.analytics?.overview || { data: null, status: 'idle' });

    useEffect(() => { dispatch(fetchOverview()); }, [dispatch]);

    const d = data || {};

    return (
        <div className="p-8 w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
                <p className="text-gray-500 mt-1">A high-level summary of your marketplace health.</p>
            </div>

            {status === 'loading' ? (
                <div className="text-center py-20 text-gray-400">Loading platform metrics…</div>
            ) : (
                <>
                    {/* Primary KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-8">
                        <StatCard title="Total Users" value={d.total_users} icon={<Users size={18} className="text-blue-600" />} color="bg-blue-50" />
                        <StatCard title="Farmers" value={d.total_farmers} icon={<Tractor size={18} className="text-orange-500" />} color="bg-orange-50" />
                        <StatCard title="Consumers" value={d.total_consumers} icon={<Users size={18} className="text-purple-600" />} color="bg-purple-50" />
                        <StatCard title="Active Products" value={d.total_products} icon={<Package size={18} className="text-green-600" />} color="bg-green-50" />
                        <StatCard title="Total Orders" value={d.total_orders} icon={<ShoppingCart size={18} className="text-indigo-600" />} color="bg-indigo-50" />
                        <StatCard title="Active Subscriptions" value={d.active_subscriptions} icon={<Repeat2 size={18} className="text-teal-600" />} color="bg-teal-50" />
                        <StatCard title="New Users (7d)" value={d.new_users_7d} icon={<TrendingUp size={18} className="text-green-600" />} color="bg-green-50" />
                        <StatCard title="New Orders (7d)" value={d.new_orders_7d} icon={<TrendingUp size={18} className="text-blue-600" />} color="bg-blue-50" />
                    </div>

                    {/* Revenue highlight */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white">
                        <p className="text-green-100 text-sm font-medium mb-2">Total Platform Revenue</p>
                        <p className="text-5xl font-bold">₹{parseFloat(d.total_revenue || 0).toLocaleString()}</p>
                        <p className="text-green-200 text-sm mt-3">Calculated from all non-cancelled orders</p>
                    </div>
                </>
            )}
        </div>
    );
};

export default PlatformAnalyticsPage;
