import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RefreshCw, Plus } from 'lucide-react';
import { fetchSubscriptions } from '../../features/subscriptions/subscriptionsSlice';
import SubscriptionCard from '../../features/subscriptions/components/SubscriptionCard';

const SubscriptionsPage = () => {
    const dispatch = useDispatch();
    const { items, status } = useSelector(s => s.subscriptions);

    useEffect(() => { dispatch(fetchSubscriptions()); }, [dispatch]);

    const active = items.filter(i => i.status === 'active');
    const paused = items.filter(i => i.status === 'paused');
    const cancelled = items.filter(i => i.status === 'cancelled');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Subscriptions</h1>
                        <p className="text-gray-500 mt-1">Recurring farm deliveries, managed effortlessly.</p>
                    </div>
                    <Link to="/subscriptions/new"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:shadow-md transition-shadow">
                        <Plus size={18} /> New Subscription
                    </Link>
                </div>

                {status === 'loading' && (
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 text-green-400 animate-spin" />
                    </div>
                )}

                {status === 'succeeded' && items.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="text-5xl mb-4">🌱</div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">No subscriptions yet</h2>
                        <p className="text-gray-500 mb-6">Subscribe to a recurring farm delivery and never miss a fresh harvest.</p>
                        <Link to="/subscriptions/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors">
                            <Plus size={18} /> Start a Subscription
                        </Link>
                    </div>
                )}

                {/* Active */}
                {active.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Active ({active.length})</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {active.map(s => <SubscriptionCard key={s.id} subscription={s} />)}
                        </div>
                    </section>
                )}

                {/* Paused */}
                {paused.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Paused ({paused.length})</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {paused.map(s => <SubscriptionCard key={s.id} subscription={s} />)}
                        </div>
                    </section>
                )}

                {/* Cancelled */}
                {cancelled.length > 0 && (
                    <section>
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Cancelled ({cancelled.length})</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
                            {cancelled.map(s => <SubscriptionCard key={s.id} subscription={s} />)}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default SubscriptionsPage;
