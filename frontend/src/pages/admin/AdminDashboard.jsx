import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Tractor, ShoppingCart, DollarSign, Activity } from 'lucide-react';
import { fetchDashboardData } from '../../features/admin/adminSlices';
import AnalyticsCard from '../../features/admin/components/AnalyticsCard';

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const { data, status } = useSelector((state) => state.dashboard || { data: null });

    useEffect(() => {
        dispatch(fetchDashboardData());
    }, [dispatch]);

    if (status === 'loading') return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;
    if (!data) return null;

    return (
        <div className="p-8 w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Monitor your platform's key performance metrics.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <AnalyticsCard
                    title="Total Revenue"
                    value={`₹${data.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend="+12%"
                    trendLabel="from last month"
                    colorClass="text-green-600"
                />
                <AnalyticsCard
                    title="Total Orders"
                    value={data.totalOrders.toLocaleString()}
                    icon={ShoppingCart}
                    trend="+8%"
                    trendLabel="from last month"
                    colorClass="text-blue-500"
                />
                <AnalyticsCard
                    title="Total Consumers"
                    value={data.totalConsumers.toLocaleString()}
                    icon={Users}
                    trend={`+${data.newUsersThisWeek}`}
                    trendLabel="this week"
                    colorClass="text-purple-500"
                />
                <AnalyticsCard
                    title="Total Farmers"
                    value={data.totalFarmers.toLocaleString()}
                    icon={Tractor}
                    colorClass="text-orange-500"
                />
            </div>

            {/* Recent Activity / Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Orders Over Last 7 Days</h3>
                    <div className="h-64 flex items-end justify-between px-2 gap-2">
                        {data.ordersPerDay?.map((day, idx) => (
                            <div key={idx} className="flex flex-col items-center w-full group">
                                {/* Simulated Bar Chart */}
                                <div
                                    className="w-full bg-green-100 rounded-t-md hover:bg-green-500 transition-colors relative"
                                    style={{ height: `${Math.max((day.count / 20) * 100, 5)}%` }} // Demo scaling
                                >
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded">
                                        {day.count}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 mt-2 rotate-45 origin-left">
                                    {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-green-50 text-left transition-colors text-gray-700 hover:text-green-700 font-medium">
                            <span>View Pending Approvals</span>
                            <Activity size={18} />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 text-left transition-colors text-gray-700 hover:text-blue-700 font-medium">
                            <span>Generate Reports</span>
                            <DollarSign size={18} />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-purple-50 text-left transition-colors text-gray-700 hover:text-purple-700 font-medium">
                            <span>Manage Marketing Banners</span>
                            <Users size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default AdminDashboard;
