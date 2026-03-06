import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminOrders } from '../../features/admin/adminSlices';
import DataTable from '../../features/admin/components/DataTable';
import { Filter } from 'lucide-react';

const OrdersManagementPage = () => {
    const dispatch = useDispatch();
    const { orders, status } = useSelector((state) => state.orders || { orders: [] });

    const [filters, setFilters] = useState({
        status: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        dispatch(fetchAdminOrders(filters));
    }, [dispatch, filters]);

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const clearFilters = () => {
        setFilters({ status: '', startDate: '', endDate: '' });
    };

    const columns = ['Order ID', 'Consumer', 'Farmer', 'Date', 'Total', 'Status'];

    const renderRow = (order, idx) => (
        <tr key={order.order_id || idx} className="hover:bg-gray-50 transition-colors">
            <td className="p-4 font-mono text-sm text-gray-600">#{order.order_number}</td>
            <td className="p-4 font-medium text-gray-900">{order.consumer_name}</td>
            <td className="p-4 text-gray-600">{order.farmer_name}</td>
            <td className="p-4 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
            <td className="p-4 font-medium">₹{parseFloat(order.total_amount).toFixed(2)}</td>
            <td className="p-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {order.status}
                </span>
            </td>
        </tr >
    );

    return (
        <div className="p-8 w-full">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders Monitor</h1>
                    <p className="text-gray-500 mt-1">Track and filter all orders placed across the platform.</p>
                </div>

                {/* Filters Panel */}
                <div className="flex flex-wrap gap-3 items-end bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="PLACED">Placed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                        <Filter size={16} /> Clear
                    </button>
                </div>
            </div>

            {status === 'loading' && orders.length === 0 ? (
                <div className="text-center p-8 text-gray-500">Loading orders...</div>
            ) : (
                <DataTable
                    columns={columns}
                    data={orders}
                    searchable={false} /* we use custom filters */
                    renderRow={renderRow}
                />
            )}
        </div>
    );
};

export default OrdersManagementPage;
