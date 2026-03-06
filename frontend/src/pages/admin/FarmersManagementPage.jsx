import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFarmers, approveFarmerAction, suspendFarmerAction } from '../../features/admin/adminSlices';
import DataTable from '../../features/admin/components/DataTable';
import { CheckCircle, XCircle, Ban } from 'lucide-react';

const FarmersManagementPage = () => {
    const dispatch = useDispatch();
    const { farmers, status } = useSelector((state) => state.farmers || { farmers: [] });

    useEffect(() => {
        dispatch(fetchFarmers());
    }, [dispatch]);

    const handleApprove = (id) => {
        if (window.confirm('Approve this farmer profile?')) {
            dispatch(approveFarmerAction(id));
        }
    };

    const handleSuspend = (id) => {
        if (window.confirm('Are you sure you want to suspend this farmer? They will not be able to sell products.')) {
            dispatch(suspendFarmerAction(id));
        }
    };

    const columns = ['Farm Name', 'Farmer', 'Rating', 'Products', 'Status', 'Actions'];

    const renderRow = (farmer, idx) => (
        <tr key={farmer.farmer_id || idx} className="hover:bg-gray-50 transition-colors">
            <td className="p-4 font-medium text-gray-900">{farmer.farm_name}</td>
            <td className="p-4 text-gray-600">{farmer.farmer_name}</td>
            <td className="p-4 text-gray-600 flex items-center gap-1">
                ⭐ {parseFloat(farmer.rating).toFixed(1)}
            </td>
            <td className="p-4 text-gray-600">{farmer.total_products}</td>
            <td className="p-4">
                {farmer.is_active === false ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Suspended</span>
                ) : farmer.verification_status ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Verified</span>
                ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Pending</span>
                )}
            </td>
            <td className="p-4 flex gap-2">
                {!farmer.verification_status && farmer.is_active !== false && (
                    <button
                        onClick={() => handleApprove(farmer.farmer_id)}
                        className="p-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded transition-colors tooltip"
                        title="Approve Farmer"
                    >
                        <CheckCircle size={18} />
                    </button>
                )}
                {farmer.is_active !== false && (
                    <button
                        onClick={() => handleSuspend(farmer.farmer_id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors tooltip"
                        title="Suspend Farmer"
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
                <h1 className="text-3xl font-bold text-gray-900">Farmers Management</h1>
                <p className="text-gray-500 mt-1">Review, approve, and manage farmer accounts across the platform.</p>
            </div>

            {status === 'loading' ? (
                <div className="text-center p-8 text-gray-500">Loading farmers data...</div>
            ) : (
                <DataTable
                    columns={columns}
                    data={farmers}
                    searchable={true}
                    renderRow={renderRow}
                />
            )}
        </div>
    );
};

export default FarmersManagementPage;
