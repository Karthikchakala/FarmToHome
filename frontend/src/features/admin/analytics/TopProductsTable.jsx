import React from 'react';

const MEDAL = ['🥇', '🥈', '🥉'];

const TopProductsTable = ({ data = [] }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
            <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 rounded-l-lg">#</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Farm</th>
                    <th className="px-4 py-3 text-right">Units Sold</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Revenue</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {data.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-gray-400">
                            {MEDAL[idx] || <span className="w-6 h-6 inline-flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold">{idx + 1}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                            <p className="font-semibold text-gray-900">{p.product_name}</p>
                            <p className="text-xs text-gray-500">{p.unit}</p>
                        </td>
                        <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                {p.category || 'Uncategorized'}
                            </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-xs">{p.farm_name}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-gray-800">{p.units_sold.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-green-700">
                            ₹{p.total_revenue.toLocaleString()}
                        </td>
                    </tr>
                ))}
                {data.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No sales data yet</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

export default TopProductsTable;
