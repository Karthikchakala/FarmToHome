import React from 'react';
import { Trophy } from 'lucide-react';

const MEDAL = ['🥇', '🥈', '🥉'];

const TopFarmersTable = ({ data = [] }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
            <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 rounded-l-lg">#</th>
                    <th className="px-4 py-3">Farmer / Farm</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-4 py-3 text-right">Rating</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Products</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {data.map((f, idx) => (
                    <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-gray-400">
                            {MEDAL[idx] || <span className="w-6 h-6 inline-flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold">{idx + 1}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                            <p className="font-semibold text-gray-900">{f.farm_name}</p>
                            <p className="text-xs text-gray-500">{f.farmer_name}</p>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-green-700">
                            ₹{f.total_revenue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-700">{f.total_orders}</td>
                        <td className="px-4 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                                ⭐ {f.avg_rating}
                            </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-600">{f.total_products}</td>
                    </tr>
                ))}
                {data.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No data available</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

export default TopFarmersTable;
