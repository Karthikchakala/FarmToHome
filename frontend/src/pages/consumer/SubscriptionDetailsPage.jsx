import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Calendar, Package, Repeat2, PauseCircle, PlayCircle, XCircle } from 'lucide-react';
import {
    fetchSubscriptionDetails,
    pauseSubscription, resumeSubscription, cancelSubscription
} from '../../features/subscriptions/subscriptionsSlice';
import SubscriptionStatusBadge from '../../features/subscriptions/components/SubscriptionStatusBadge';

const FREQ_DISPLAY = {
    daily: 'Every day',
    weekly: 'Every week',
    biweekly: 'Every 2 weeks',
    monthly: 'Every month',
};

const SubscriptionDetailsPage = () => {
    const { subscriptionId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { selected: sub, status } = useSelector(s => s.subscriptions);

    useEffect(() => { dispatch(fetchSubscriptionDetails(subscriptionId)); }, [dispatch, subscriptionId]);

    if (status === 'loading' || !sub) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-400">Loading subscription details...</div>
            </div>
        );
    }

    const handlePause = () => { if (window.confirm('Pause this subscription?')) dispatch(pauseSubscription(sub.id)); };
    const handleResume = () => { if (window.confirm('Resume this subscription?')) dispatch(resumeSubscription(sub.id)); };
    const handleCancel = () => { if (window.confirm('Cancel this subscription permanently?')) dispatch(cancelSubscription(sub.id)); };

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-2xl mx-auto px-4">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Subscriptions
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                    <div className="p-7">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">{sub.product_name}</h1>
                                <p className="text-gray-500 text-sm">from {sub.farm_name} · {sub.farmer_name}</p>
                            </div>
                            <SubscriptionStatusBadge status={sub.status} />
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><Package size={14} /> QUANTITY</div>
                                <p className="text-lg font-semibold text-gray-900">{sub.quantity} {sub.unit}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><Repeat2 size={14} /> FREQUENCY</div>
                                <p className="text-lg font-semibold text-gray-900">{FREQ_DISPLAY[sub.interval]}</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-4 col-span-2">
                                <div className="flex items-center gap-2 text-green-600 text-xs mb-1"><Calendar size={14} /> NEXT DELIVERY</div>
                                <p className="text-lg font-semibold text-green-800">
                                    {new Date(sub.next_delivery_date).toLocaleDateString(undefined, { dateStyle: 'full' })}
                                </p>
                            </div>
                        </div>

                        {/* Price Estimate */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 mb-8">
                            <span className="text-gray-600 text-sm font-medium">Estimated cost per delivery</span>
                            <span className="text-xl font-bold text-gray-900">
                                ₹{(parseFloat(sub.price) * sub.quantity).toFixed(2)}
                            </span>
                        </div>

                        {/* Actions */}
                        {sub.status !== 'cancelled' && (
                            <div className="flex gap-3">
                                {sub.status === 'active' ? (
                                    <button onClick={handlePause}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 rounded-xl transition-colors">
                                        <PauseCircle size={18} /> Pause
                                    </button>
                                ) : (
                                    <button onClick={handleResume}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl transition-colors">
                                        <PlayCircle size={18} /> Resume Deliveries
                                    </button>
                                )}
                                <button onClick={handleCancel}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition-colors">
                                    <XCircle size={18} /> Cancel Subscription
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionDetailsPage;
