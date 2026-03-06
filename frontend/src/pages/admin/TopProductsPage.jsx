import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTopProducts } from '../../features/admin/analytics/analyticsSlice';
import TopProductsTable from '../../features/admin/analytics/TopProductsTable';
import { RefreshCw } from 'lucide-react';

const TopProductsPage = () => {
    const dispatch = useDispatch();
    const { data, status } = useSelector(s => s.analytics?.topProducts || { data: null, status: 'idle' });

    useEffect(() => { dispatch(fetchTopProducts({ limit: 20 })); }, [dispatch]);

    return (
        <div className="p-8 w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Best-Selling Products</h1>
                <p className="text-gray-500 mt-1">Ranked by total revenue and units sold across the platform.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {status === 'loading' ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-green-400 animate-spin" />
                    </div>
                ) : (
                    <TopProductsTable data={data || []} />
                )}
            </div>
        </div>
    );
};

export default TopProductsPage;
