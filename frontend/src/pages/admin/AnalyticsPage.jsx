import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../../features/admin/adminSlices';

const AnalyticsPage = () => {
    const dispatch = useDispatch();
    const { data, status } = useSelector((state) => state.dashboard || { data: null });

    useEffect(() => {
        if (!data) dispatch(fetchDashboardData());
    }, [dispatch, data]);

    if (status === 'loading' || !data) return <div className="p-8 text-center">Loading Analytics...</div>;

    return (
        <div className="p-8 w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
                <p className="text-gray-500 mt-1">Deep dive into sales and user growth metrics.</p>
            </div>

            {/* Since we don't have Recharts installed, we will use simplified visual blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Orders Bar Chart Placeholder */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800">Daily Orders (Last 7 Days)</h3>
                    <div className="h-64 flex items-end justify-between px-4 gap-4">
                        {data.ordersPerDay?.map((day, idx) => {
                            const heightPct = Math.max((day.count / 50) * 100, 5); // Example scaling
                            return (
                                <div key={idx} className="flex flex-col items-center w-full group">
                                    <div
                                        className="w-full bg-blue-400 rounded-t-md hover:bg-blue-600 transition-colors relative"
                                        style={{ height: `${heightPct}%` }}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                                            {day.count} Orders
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-3 whitespace-nowrap">
                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Growth Stats */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800">Growth Metrics</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">User Acquisition</span>
                                <span className="text-sm font-medium text-green-600">+12%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Farmer Onboarding</span>
                                <span className="text-sm font-medium text-green-600">+8%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Order Completion Rate</span>
                                <span className="text-sm font-medium text-green-600">92%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
};

export default AnalyticsPage;
