import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConsumers, banConsumerAction } from '../../features/admin/adminSlices';
import DataTable from '../../features/admin/components/DataTable';
import { Ban } from 'lucide-react';

const ConsumersManagementPage = () => {
    const dispatch = useDispatch();
    const { consumers, status } = useSelector((state) => state.consumers || { consumers: [] });

    useEffect(() => {
        dispatch(fetchConsumers());
    }, [dispatch]);

    const handleBan = (id) => {
        if (window.confirm('Are you certain you want to ban this consumer from the platform?')) {
            dispatch(banConsumerAction(id));
        }
    };

    const columns = ['Name', 'Email', 'Phone', 'Total Orders', 'Status', 'Actions'];

    const renderRow = (consumer, idx) => (
        <tr key={consumer.consumer_id || idx} className="hover:bg-gray-50 transition-colors">
            <td className="p-4 font-medium text-gray-900">{consumer.name}</td>
            <td className="p-4 text-gray-600">{consumer.email}</td>
            <td className="p-4 text-gray-600">{consumer.phone || 'N/A'}</td>
            <td className="p-4 text-gray-600">{consumer.total_orders}</td>
            <td className="p-4">
                {consumer.account_status === false ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Banned</span>
                ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                )}
            </td>
            <td className="p-4 flex gap-2">
                {consumer.account_status !== false && (
                    <button
                        onClick={() => handleBan(consumer.consumer_id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors tooltip"
                        title="Ban Consumer"
                    >
                        <Ban size={18} />
                    </button>
                )}
            </td>
        </tr>
    );

    return (
        <div className="p-8 w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Consumers Management</h1>
                <p className="text-gray-500 mt-1">Review accounts and manage platform access for consumers.</p>
            </div>

            {status === 'loading' ? (
                <div className="text-center p-8 text-gray-500">Loading consumers data...</div>
            ) : (
                <DataTable
                    columns={columns}
                    data={consumers}
                    searchable={true}
                    renderRow={renderRow}
                />
            )}
        </div>
    );
};

export default ConsumersManagementPage;
