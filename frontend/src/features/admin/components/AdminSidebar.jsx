import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Tractor,
    ShoppingCart,
    MessageSquare,
    DollarSign,
    BarChart2,
    ChevronDown,
    ChevronRight,
    TrendingUp,
    MapPin,
} from 'lucide-react';

const AdminSidebar = () => {
    const location = useLocation();
    const isAnalyticsActive = location.pathname.startsWith('/admin/analytics');
    const [analyticsOpen, setAnalyticsOpen] = useState(isAnalyticsActive);

    const menuItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Farmers', path: '/admin/farmers', icon: Tractor },
        { name: 'Consumers', path: '/admin/consumers', icon: Users },
        { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
        { name: 'Delivery', path: '/admin/delivery-zones', icon: MapPin },
        { name: 'Feedback', path: '/admin/feedback', icon: MessageSquare },
        { name: 'Price Control', path: '/admin/price-control', icon: DollarSign },
    ];

    const analyticsItems = [
        { name: 'Overview', path: '/admin/analytics' },
        { name: 'Orders', path: '/admin/analytics/orders' },
        { name: 'Revenue', path: '/admin/analytics/revenue' },
        { name: 'Top Farmers', path: '/admin/analytics/top-farmers' },
        { name: 'Top Products', path: '/admin/analytics/top-products' },
        { name: 'Subscriptions', path: '/admin/analytics/subscriptions' },
    ];

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col shadow-xl hidden md:flex">
            <div className="p-6 text-2xl font-bold border-b border-gray-800 text-green-400">
                Admin Portal
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.name} to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-green-600 text-white shadow-md'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                {/* Analytics collapsible section */}
                <div>
                    <button
                        onClick={() => setAnalyticsOpen(o => !o)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${isAnalyticsActive
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        <span className="flex items-center space-x-3">
                            <BarChart2 size={20} />
                            <span className="font-medium">Analytics</span>
                        </span>
                        {analyticsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                    {analyticsOpen && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-700 pl-3">
                            {analyticsItems.map(item => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link key={item.path} to={item.path}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                            ? 'bg-green-700 text-white'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <TrendingUp size={13} /> {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="text-sm text-gray-500 text-center">&copy; 2026 FarmToTable</div>
            </div>
        </div>
    );
};

export default AdminSidebar;
