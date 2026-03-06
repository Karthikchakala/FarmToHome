import React from 'react';

const AnalyticsCard = ({ title, value, icon, trend, trendLabel, colorClass = "text-green-500" }) => {
    const Icon = icon;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 bg-current`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {
                trend && (
                    <div className="mt-4 flex items-center text-sm">
                        <span className={`font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {trend}
                        </span>
                        <span className="text-gray-500 ml-2">{trendLabel}</span>
                    </div >
                )}
        </div >
    );
};

export default AnalyticsCard;
