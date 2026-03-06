import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTopFarmers } from '../../features/admin/analytics/analyticsSlice';
import TopFarmersTable from '../../features/admin/analytics/TopFarmersTable';
import { RefreshCw } from 'lucide-react';

const TopFarmersPage = () => {
    const dispatch = useDispatch();
    const { data, status } = useSelector(s => s.analytics?.topFarmers || { data: null, status: 'idle' });

    useEffect(() => { dispatch(fetchTopFarmers({ limit: 20 })); }, [dispatch]);

    return (
        <div className="p-8 w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Top Performing Farmers</h1>
                <p className="text-gray-500 mt-1">Ranked by total revenue generated on the platform.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {status === 'loading' ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-green-400 animate-spin" />
                    </div>
                ) : (
                    <TopFarmersTable data={data || []} />
                )}
            </div>
        </div>
    );
};

export default TopFarmersPage;
